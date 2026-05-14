---
name: Planificación — API REST + App Mobile
description: Stack, decisiones técnicas y plan de sprints para la API pública y la app Android (React Native/Expo)
type: planning
updated_at: 2026-05-08
---

## Sesiones, dispositivos y gestión de tokens

### Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Cómo persiste la sesión en mobile? | **Refresh token en SecureStore** — no expira hasta logout o revocación manual |
| ¿Cómo funciona el token de la API REST? | **access_token de corta duración** (1h, estándar Supabase) + renovación vía refresh token rotation |
| ¿Cómo se identifican los dispositivos? | **UUID generado en primer arranque** guardado en SecureStore + metadatos de `expo-device` (nombre, modelo, OS) |
| ¿Cómo se revoca una sesión desde la web? | Tabla `user_devices` tiene `session_id` de Supabase; al revocar se llama a `supabase.auth.admin.signOut(session_id)` |
| ¿Cómo se limpian tokens expirados? | **`pg_cron`** (Postgres extension) como opción principal |
| ¿Notificaciones de seguridad? | **Email al registrar un dispositivo nuevo** |
| ¿Límite de dispositivos? | **Configurable por grupo/admin** (TBD — ver decisiones pendientes) |
| ¿Biometría en mobile? | **`expo-local-authentication`** para re-abrir app sin reintroducir contraseña; el token persiste, solo es confirmación local |

---

### Ciclo de vida de tokens

```
access_token   → expira en 1h (Supabase default)
refresh_token  → rotación: cada uso invalida el anterior y emite uno nuevo
               → en mobile: guardado en SecureStore, persiste entre sesiones
               → en API REST: el cliente debe usar un getter lazy para leer el token
                 en cada petición (no cachear access_token al arrancar la app)
```

**Importante:** El cliente ts-rest en mobile debe leer `access_token` con una función, no con un valor estático:

```typescript
// CORRECTO — getter lazy, lee el token en cada petición
Authorization: () => `Bearer ${getSupabaseSession()?.access_token}`

// INCORRECTO — acceso_token cacheado en arranque, expira sin renovarse
Authorization: `Bearer ${session.access_token}`
```

Supabase maneja la renovación automáticamente si se configura `autoRefreshToken: true` (por defecto).

---

### Tabla `user_devices`

```sql
CREATE TABLE user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      UUID,                          -- ID de sesión Supabase para revocar
  device_uuid     TEXT NOT NULL,                 -- UUID único generado en primer arranque (SecureStore)
  device_name     TEXT,                          -- ej. "iPhone de Eric" / "Pixel 7"
  device_model    TEXT,                          -- expo-device: Device.modelName
  os_name         TEXT,                          -- expo-device: Device.osName
  os_version      TEXT,                          -- expo-device: Device.osVersion
  app_version     TEXT,                          -- Constants.expoConfig?.version
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,                   -- NULL = activo; NOT NULL = revocado
  revoked_by      UUID REFERENCES auth.users(id) -- quién revocó (admin o el propio usuario)
);

-- Índices
CREATE INDEX ON user_devices (user_id);
CREATE INDEX ON user_devices (device_uuid);
CREATE UNIQUE INDEX ON user_devices (user_id, device_uuid); -- un UUID por usuario
```

**`session_id`** es clave para poder llamar a `supabase.auth.admin.signOut(session_id)` desde el backend y revocar el token en Supabase Auth además de marcar el dispositivo como revocado en esta tabla.

---

### Flujo de registro de dispositivo

```
1. App arranca por primera vez
   → Genera UUID aleatorio, lo guarda en SecureStore
   → Lee metadatos del device con expo-device

2. Usuario hace login
   → supabase.auth.signInWithPassword() → { access_token, refresh_token, session.id }
   → POST /api/v1/shared/devices/register  { device_uuid, device_name, model, os, app_version }
   → Backend: upsert en user_devices (INSERT ON CONFLICT DO UPDATE last_seen_at)
   → Backend: guarda session_id en user_devices

3. Si el device_uuid es nuevo para ese usuario
   → Backend envía email de seguridad: "Nuevo acceso desde [device_name] ([os])"

4. En cada apertura de la app
   → PATCH /api/v1/shared/devices/ping  → actualiza last_seen_at

5. Al hacer logout
   → DELETE /api/v1/shared/devices/me  (o PATCH revoked_at = NOW())
   → supabase.auth.signOut() — invalida tokens en Supabase
```

---

### Pantalla de gestión de dispositivos (web)

En la web (admin y/o perfil de usuario), se mostrará una lista de dispositivos activos:

```
/admin/users/:id  → sección "Dispositivos"
/profile          → sección "Mis dispositivos"

Columnas: Dispositivo | OS | Última actividad | Acción
Acción:   [Desconectar] → revoca la sesión en Supabase + marca revoked_at
```

---

### Cleanup de tokens expirados

**Opción principal: `pg_cron`** (extensión PostgreSQL)

```sql
-- Ejecutar cada noche a las 3:00 AM
SELECT cron.schedule(
  'cleanup-revoked-devices',
  '0 3 * * *',
  $$
    DELETE FROM user_devices
    WHERE revoked_at IS NOT NULL
      AND revoked_at < NOW() - INTERVAL '30 days';
  $$
);
```

**Alternativas si pg_cron no está disponible:**
- Supabase Edge Function con cron schedule (disponible en Supabase cloud)
- Vercel Cron Jobs (si se despliega en Vercel)

---

### Biometría (post-login)

La biometría **no es un segundo factor de autenticación** — es solo para re-abrir la app sin reintroducir contraseña. El token Supabase se mantiene activo en SecureStore.

```
Primer login:
  1. Email + password → JWT en SecureStore
  2. Si el dispositivo soporta biometría, se ofrece activarla
  3. Al activar: se guarda una flag en SecureStore (biometrics_enabled = true)

Re-apertura de la app:
  1. App detecta biometrics_enabled = true
  2. Lanza expo-local-authentication (Face ID / huella)
  3. Si OK → leer tokens de SecureStore → continuar sesión
  4. Si falla o se cancela → mostrar formulario email+password
```

Librería: `expo-local-authentication`  
El token en sí no cambia — la biometría solo controla si se "desbloquea" el acceso a los tokens guardados.

---

### Decisiones pendientes (antes del Sprint A)

| Decisión | Opciones | Recomendación |
|---|---|---|
| **Límite de dispositivos por usuario** | Sin límite / Fijo (ej. 5) / Configurable por admin | Configurable por grupo en `group_settings` — empezar sin límite |
| **Qué pasa al superar el límite** | Bloquear login / Revocar el más antiguo / Notificar al admin | Notificar al admin + bloquear |
| **Visibilidad de dispositivos** | Solo admin los ve / El usuario también | El usuario también (en pantalla de perfil) |
| **Retención de dispositivos revocados** | Borrar inmediatamente / Guardar N días | Guardar 30 días para auditoría, luego `pg_cron` los borra |

---

## Contexto y decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿La API va dentro del proyecto Next.js o es un servicio aparte? | **Dentro de 027apps** — comparte use-cases, cero duplicación de lógica |
| ¿Cómo se organiza la API? | **Namespaces** dentro de una sola API (`/api/v1/admin/*`, `/api/v1/shared/*`, `/api/v1/apps/[slug]/*`) |
| ¿App mobile Android o cross-platform? | **Expo (React Native)** — preparado para iOS también, TypeScript, mental model Next.js |
| ¿Autenticación de la API? | **JWT Supabase** — Bearer token en header `Authorization` |

---

## Sprint API REST

### Stack elegido

| Rol | Tecnología | Por qué |
|---|---|---|
| Contrato API | **ts-rest** | Contract-first. Define la API una vez en TypeScript, la implementa el servidor, la consume el cliente mobile. Genera OpenAPI automáticamente. Zod ya está en el proyecto. |
| Route Handlers | **Next.js App Router** (`src/app/api/v1/`) | Comparte los use-cases de `src/lib/use-cases/` con las Server Actions. Una sola fuente de verdad. |
| Documentación | **Scalar** (`@scalar/nextjs-api-reference`) | UI moderna, mejor que Swagger UI. OpenAPI-first. Open-source. Se sirve en `/api/docs`. |
| Validación | **Zod** (ya existe) | El contrato ts-rest usa Zod para request/response. |
| Auth en API | Helper `requireAuthFromHeader()` (nuevo) | Igual que `requireAdmin()` pero lee el JWT del header `Authorization: Bearer <token>` en vez de la cookie de sesión. |

### Estructura de namespaces

```
/api/v1/admin/*           → Solo admins. Requiere JWT + role=admin
  GET  /api/v1/admin/users
  GET  /api/v1/admin/users/:id
  PUT  /api/v1/admin/users/:id
  POST /api/v1/admin/invitations
  GET  /api/v1/admin/settings

/api/v1/shared/*          → Recursos comunes. Requiere JWT válido (cualquier role)
  GET  /api/v1/shared/locales         → lista de idiomas activos del grupo
  GET  /api/v1/shared/config          → configuración del grupo
  GET  /api/v1/shared/profile         → perfil del usuario autenticado
  PUT  /api/v1/shared/profile         → actualizar perfil

/api/v1/apps/:slug/*      → Por app. Requiere JWT + app_permission habilitada
  (cada módulo define sus propios endpoints bajo este namespace)

/api/docs                 → Scalar UI con el OpenAPI spec completo
```

### Cómo funciona el contrato (ts-rest)

```
src/lib/api/
  contract/
    admin.contract.ts       → endpoints admin
    shared.contract.ts      → endpoints shared
    apps.contract.ts        → endpoints por app (genérico)
    index.ts                → router raíz que agrupa todos

src/app/api/v1/
  [...ts-rest]/
    route.ts                → handler único que delega en el contrato
```

El contrato se exporta también como **paquete compartido** para que la app mobile lo importe. Ver sección Mobile.

### Autenticación: de cookies a Bearer

Las Server Actions usan `requireAdmin()` que lee la sesión de las cookies de Next.js.
Los Route Handlers (API) reciben peticiones desde mobile/terceros sin cookies, por eso necesitamos un helper nuevo:

```typescript
// src/lib/auth/helpers.ts (nuevo helper, no rompe el existente)
async function requireAuthFromHeader(req: Request): Promise<{ userId: string; role: 'admin' | 'member' }> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  // Verificar token con Supabase admin client
  // Retornar userId + role o lanzar 401
}
```

Los clientes (mobile, terceros) obtienen el JWT haciendo login con Supabase Auth y lo envían en cada petición.

### Documentación Scalar

```typescript
// src/app/api/docs/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  spec: { url: '/api/v1/openapi.json' },  // generado por ts-rest
})
```

La doc queda accesible en `https://tudominio.com/api/docs` con interfaz interactiva para probar endpoints, autenticarse con JWT y ver schemas de request/response.

### Dependencias nuevas (API)

```bash
pnpm add @ts-rest/core @ts-rest/next @scalar/nextjs-api-reference
```

---

## Sprint Mobile

### Stack elegido

| Rol | Tecnología | Por qué |
|---|---|---|
| Framework | **Expo** (SDK 53+, Expo Router) | Framework oficial de React Native. File-based routing = misma mental model que Next.js. Android + iOS desde el mismo código. |
| Routing | **Expo Router** | Rutas por archivo como Next.js App Router. Typed routes. |
| Estilos | **NativeWind v5** | Tailwind CSS en React Native. Mismas clases de `src/app`. Consistencia visual con la web. |
| API client | **ts-rest client** | Consume el mismo contrato que el servidor. Si la API cambia, TypeScript avisa en el móvil. |
| Server state | **TanStack Query** + `@ts-rest/react-query` | React Query integrado con ts-rest. Mismo patrón que la web. |
| Auth | **@supabase/supabase-js** + AsyncStorage | Login con email/password → JWT → se inyecta automáticamente en el cliente ts-rest. |
| Componentes | **NativewindUI** | 30+ componentes para React Native con NativeWind. Equivalente a shadcn/ui en mobile. |
| Build/Deploy | **EAS Build + EAS Submit** | Builds en la nube. Sin necesitar Xcode localmente para subir a Google Play. |

### Estructura del repositorio

Se recomienda **monorepo** dentro del mismo repo `027apps` usando pnpm workspaces. Así el contrato ts-rest se comparte sin publicar en npm:

```
027apps/
  src/                        → Next.js (web)
  mobile/                     → App Expo (nueva)
    app/                      → rutas Expo Router
      (auth)/
        login.tsx
      (app)/
        index.tsx             → home con grid de apps
        profile.tsx
        apps/
          [slug]/
            index.tsx
    components/
    lib/
      api/                    → cliente ts-rest (importa el contrato de src/lib/api)
      supabase/               → cliente Supabase con AsyncStorage
  packages/                   → (futuro) si se necesita separar el contrato
  pnpm-workspace.yaml
```

### Cómo comparte lógica con el servidor

```typescript
// mobile/lib/api/client.ts
import { initClient } from '@ts-rest/core'
import { contract } from '../../src/lib/api/contract'  // mismo contrato

export const api = initClient(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  baseHeaders: {
    Authorization: () => `Bearer ${getSupabaseSession()?.access_token}`,
  },
})

// Uso en un componente
const { data } = useQuery(api.shared.getProfile.queryOptions())
```

Si mañana se añade un campo al endpoint `GET /api/v1/shared/profile`, TypeScript ya avisa en el cliente mobile de que hay que actualizar.

### Flujo de auth mobile

```
1. Usuario introduce email + password
2. supabase.auth.signInWithPassword() → { access_token, refresh_token }
3. Guardar tokens en SecureStore (AsyncStorage encriptado)
4. Cada petición a la API incluye: Authorization: Bearer <access_token>
5. Supabase refresca el token automáticamente antes de que expire
```

### Dependencias nuevas (mobile)

```bash
# Dentro de mobile/
npx create-expo-app@latest . --template blank-typescript
npx expo install nativewind@^5 tailwindcss react-native-reanimated
pnpm add @tanstack/react-query @ts-rest/core @ts-rest/react-query
pnpm add @supabase/supabase-js @react-native-async-storage/async-storage
```

---

## Plan de sprints

### Sprint A — API REST (prerequisito del mobile)

**Objetivo:** API funcional con auth, documentación Scalar y los primeros endpoints shared y admin.

| Paso | Tarea |
|---|---|
| 1 | Instalar ts-rest + Scalar |
| 2 | Crear `src/lib/api/contract/shared.contract.ts` con `GET /profile`, `PUT /profile`, `GET /locales`, `GET /config` |
| 3 | Crear `requireAuthFromHeader()` en `src/lib/auth/helpers.ts` |
| 4 | Implementar Route Handlers para shared (invocan use-cases existentes) |
| 5 | Crear `src/lib/api/contract/admin.contract.ts` con endpoints de users, invitations, settings |
| 6 | Implementar Route Handlers para admin |
| 7 | Generar OpenAPI spec y conectar Scalar en `/api/docs` |
| 8 | Tests de integración para los endpoints críticos |

**Resultado:** API documentada en `/api/docs`. Mobile y terceros pueden autenticarse y consumirla.

---

### Sprint B — App Mobile (después del Sprint A)

**Objetivo:** App Expo funcional en Android con login, home y perfil.

| Paso | Tarea |
|---|---|
| 1 | Crear proyecto Expo en `mobile/` con Expo Router + TypeScript |
| 2 | Configurar NativeWind v5 |
| 3 | Configurar cliente Supabase con AsyncStorage |
| 4 | Configurar cliente ts-rest con inyección automática del JWT |
| 5 | Pantalla Login (email/password) |
| 6 | Pantalla Home (grid de apps con `GET /apps/permissions`) |
| 7 | Pantalla Profile (ver/editar usando `GET|PUT /shared/profile`) |
| 8 | Build de desarrollo con EAS Build + prueba en Android |
| 9 | EAS Submit a Google Play (internal testing) |

**Resultado:** APK funcional en Google Play internal testing con login y perfil.

---

### Sprint C — Apps module en mobile (después del Sprint B)

Cada módulo de app (lista-compra, recetas…) añade sus endpoints en `/api/v1/apps/[slug]/` y su pantalla en `mobile/app/(app)/apps/[slug]/`.

---

## Decisiones pendientes para cuando se retome

Estas decisiones no bloquean ahora pero hay que tomarlas antes del Sprint A:

1. **Versioning de la API**: ¿`/api/v1/` y ya? ¿O versionado por header `Accept-Version`? — Recomendación: URL prefix `/v1/` por simplicidad.
2. **Rate limiting**: ¿Middleware en Next.js o delegar en Vercel/CDN? — Recomendación: empezar sin él, añadir al hacer el deploy en Vercel.
3. **CORS**: La API debe permitir peticiones desde la app mobile. En Next.js Route Handlers se configura con headers en `next.config.ts`.
4. **`packages/` monorepo**: Si el contrato ts-rest crece y se quiere reutilizar en más proyectos, extraerlo a `packages/api-contract/` con su propio `package.json`. De momento no es necesario.
