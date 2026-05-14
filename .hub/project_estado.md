---
name: Estado actual 027Apps — mayo 2026
description: Dónde está el proyecto 027Apps, qué funciona, qué queda pendiente
type: project
updated_at: 2026-05-08
---

## Última sesión (2026-05-08)

- Completada la sección **"Sesiones, dispositivos y gestión de tokens"** en `sprint_api_mobile_planning.md`:
  - Esquema SQL de tabla `user_devices` (con `session_id`, `device_uuid`, metadatos OS/modelo, `revoked_at`)
  - Ciclo de vida de tokens (access_token 1h, refresh token rotation, getter lazy en mobile)
  - Flujo completo de registro de dispositivo (UUID en SecureStore, upsert, email de seguridad)
  - Cleanup con `pg_cron`
  - Biometría con `expo-local-authentication` (no es 2FA, solo desbloqueo local)
  - Pantalla de gestión de dispositivos en web (admin + perfil de usuario)
  - Decisiones pendientes (límite de devices, qué pasa al superarlo, visibilidad, retención)

**Planificación completa.** Toda la documentación de API REST + Mobile + Sesiones/Dispositivos está lista en `sprint_api_mobile_planning.md`.

---

Proyecto en `/Users/ericrf/Sites/027apps`. Stack: Next.js 16 (App Router) + TypeScript strict + Supabase local (Docker) + next-intl + shadcn/ui + Tailwind CSS v4.

**Why:** Plataforma open-source de apps en grupo (familia, equipo, amigos…). Un grupo gestiona sus usuarios, roles y permisos de acceso a las apps. "Familia" es un caso de uso, no el modelo.

---

## Auth (decisión definitiva)

- Login unificado en `/{locale}/login` para todos los usuarios
- `group_members.role`: `admin | member`
- Después del login → `/{locale}/` (home con grid de apps)
- Admin ve enlace "Backoffice" en el header de la app pública
- Admin panel en `/{locale}/admin/` (locale-aware, no subdirectorio `/admin/` sin locale)
- Protección de rutas admin: middleware (`src/middleware.ts` → `src/proxy.ts`) + layout (`getUserWithRole()`)
- Sin `/admin/login` separado — login unificado para todos

---

## Base de datos

6 tablas + 1 enum. RLS activo en todas.

| Tabla | Descripción |
|---|---|
| `profiles` | Extensión de auth.users (display_name, locale, avatar_url, last_login_at) |
| `groups` | Entidad raíz (name, slug) |
| `group_members` | usuario + grupo + role (admin\|member) |
| `app_permissions` | usuario + grupo + app_slug + enabled |
| `invitations` | token, title, role, email opcional, expires_at, accepted_by, revoked_at |
| `group_settings` | active_locales[], default_locale por grupo |

Enum: `group_role = 'admin' | 'member'`

---

## Lo que funciona (estado real)

### Auth y setup
- `/install` — wizard primer admin, 404 si ya existe admin
- `/{locale}/login` — login email/password, mobile-first, language picker
- `/invite/[token]` — aceptar invitación pública (crea usuario, lo añade al grupo, auto-login)
- `/auth/callback` — callback Supabase Auth

### Admin panel (`/{locale}/admin/`) — backoffice completo
- **Dashboard** — 3 cards (Admins · Members · Pending invites) + listas recientes
- **Users** — tabla con avatar, nombre, email, rol, locale, último login; acciones en dropdown (tres puntos) con confirmación modal para bloquear, hacer miembro y **eliminar usuario** (destructivo)
- **Users / [id]** — edición individual: nombre, email, rol, locale, fecha de alta, estado
- **Admins** — listado de administradores
- **Invitations** — crear (título, rol, email opcional, expiración), copiar link, revocar, eliminar; acciones en dropdown con confirmación modal para revocar y eliminar; colores de estado: pending=gris, accepted=verde, expired=ámbar, revoked=rojo
- **Profile** — editar nombre, idioma (solo locales activos del grupo), cambiar contraseña
- **Settings > General** — habilitar/deshabilitar idiomas por grupo, locale por defecto

### App pública (`/{locale}/`)
- **Home** — grid de apps habilitadas según `app_permissions`. Empty state si sin apps.
- **Login** — formulario email/password; si cuenta bloqueada muestra `BlockedOverlay` (pantalla completa, sin cambio de URL)
- **Profile** — editar nombre, idioma
- **BlockedOverlay** — componente `position:fixed inset-0 z-50 bg-white` que cubre la pantalla cuando el usuario está bloqueado. Se detecta en cada navegación via `getUserById` en el layout `(app)/[locale]/layout.tsx`. Muestra título, descripción y botón "Sign out". También se usa en el login para usuarios bloqueados (sin botón sign out).

### i18n
- 6 locales: `en`, `es`, `it`, `ca`, `fr`, `de`. Default: `en`
- EN, ES, IT — traducciones completas
- CA, FR, DE — archivos existen pero traducciones parciales. UI no las expone aún.
- Locale del usuario guardado en `profiles.locale`
- `group_settings` permite al admin configurar qué locales están activos en su grupo

### Use-cases implementados
`auth`, `users`, `groups`, `install`, `invitations`, `admin-users`, `settings`

### Decisiones técnicas
- Default locale: `en`
- `/install` usa translations propias en `src/app/install/translations.ts`
- Middleware en `src/proxy.ts` — en Next.js 16 el archivo de middleware se llama `proxy.ts` (no `middleware.ts`). Gestiona: locale routing (next-intl), session refresh en rutas admin, redirect a login si no autenticado, `/admin` → `/{locale}/admin/`.
- `createAdminClient()` (service role) para operaciones admin. Auth identity verificada via `getUser()`.
- Role check en layout admin via `getUserWithRole()` — redirige si no es admin
- Invitaciones: registro solo por invitación, sin signup público
- Fuente única de verdad de locales: `src/i18n/routing.ts` exporta `LOCALES`, `Locale`, `LOCALE_LABELS`
- `LOCALE_LABELS`: mapa locale→nombre nativo (es→Español, en→English, it→Italiano, ca→Català, fr→Français, de→Deutsch)
- Sidebar admin: persiste estado (colapsado/expandido) en cookie `admin-sidebar-collapsed`; valor SSR sin flash
- Confirm dialogs: `src/components/ui/confirm-dialog.tsx` (Base UI Dialog) — modal controlado, prop `variant: 'default' | 'destructive'`
- Table actions: `src/components/admin-user-actions.tsx` — dropdown (Base UI Menu) con confirm modal para block, make-member y **delete** (destructivo); `InvitationTable.tsx` — dropdown con confirm para revoke y delete
- BlockedOverlay: `src/components/blocked-overlay.tsx` — `position:fixed inset-0 z-50 bg-white`; prop `showSignOut` (default false). Usado en: layout `(app)/[locale]` (ban detection via `getUserById` en cada navegación, con sign-out) y `AppLoginForm` (cuando login falla con `blocked`, sin sign-out)

---

## Tests

Vitest + jsdom + @testing-library/jest-dom. 4 archivos, 40 tests, todos en verde.

| Archivo | Tests | Qué cubre |
|---|---|---|
| `tests/unit/smoke.test.ts` | 1 | placeholder |
| `tests/unit/utils.test.ts` | 9 | `cn()` — Tailwind class merging, conflictos, condicionales, objetos, arrays |
| `tests/unit/use-cases/invitations.test.ts` | 23 | `getInvitationStatus` (7 casos puros) · `getAdminInvitationList` · `createInvitation` · `revokeInvitation` · `deleteInvitation` · `acceptInvitation` (8 casos: token inválido, revoked, expired, email mismatch, email match, error createUser, happy path open, happy path sin grupo) |
| `tests/unit/use-cases/settings.test.ts` | 7 | `getGroupSettings` (5: sin grupo, sin settings, con settings, null active_locales, null default_locale) · `updateGroupSettings` (2: sin grupo lanza error, happy path) |

Patrón de mock Supabase: `makeChain(data, error?)` — un objeto thenable + chainable que funciona tanto para `.single()/.maybeSingle()` como para `await` directo (builder sin terminal). Definido localmente en cada test file para evitar acoplamiento.

E2E: `tests/e2e/` vacío — pendiente.

---

## Pending (por orden de prioridad)

> **TRIGGER:** Cuando el usuario diga **"arrancamos siguiente sprint"**, presentar la lista de sprints disponibles y dejar que elija por dónde tirar. No asumir orden.

### Sprints disponibles

#### Sprint APP-PERMISSIONS — UI de permisos por usuario
- **Dónde:** Añadir sección "Apps" en la ficha de edición de usuario (`/admin/users/:id/EditUserForm.tsx`)
- **Qué:** Toggles (mismo patrón pill que locales) para cada app disponible. Lee/escribe `app_permissions (user_id, group_id, app_slug, enabled)`.
- **Por qué aquí y no en sección dedicada:** Con pocos usuarios y pocas apps es suficiente. Vista global se añade después si se necesita.
- **Decisiones tomadas:**
  - Permisos por usuario (no por grupo — "grupo" era forma de hablar)
  - Rollout gradual: el admin habilita apps una a una por usuario
  - Cada app tendrá sus propias tablas con prefijo de la app (ej. `lista_compra_items`) — independiente del sistema de permisos

#### Sprint API-REST — API pública con ts-rest + Scalar
- Ver detalle completo en `sprint_api_mobile_planning.md` → sección "Sprint API REST"
- Prerequisito: Supabase cloud + app_permissions UI funcional

#### Sprint SUPABASE-CLOUD — Entornos dev + prod en Supabase cloud
- Crear proyectos en Supabase cloud (dev y prod)
- Prerequisito para que la API sea accesible desde device real o terceros

#### Sprint MOBILE — App Expo (Android)
- Ver detalle completo en `sprint_api_mobile_planning.md` → sección "Sprint Mobile"
- Prerequisito: Sprint API-REST completado

#### Sprint E2E — Tests end-to-end con Playwright
- `tests/e2e/` vacío. Flujos críticos: login, aceptar invitación, acciones admin.
- Se puede hacer en paralelo con cualquier otro sprint

#### Sprint I18N — Completar CA/FR/DE
- Traducciones parciales. Exponer en locale switcher cuando estén completas.

---

## How to run

```bash
~/bin/supabase start          # desde /Users/ericrf/Sites/027apps — arrancar Supabase local primero
pnpm dev                      # Next.js en puerto 3000
```

Si Supabase no está corriendo: `/install` y login fallan con database error.

- Supabase Studio: `http://127.0.0.1:54323`
- API: `http://127.0.0.1:54321`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
