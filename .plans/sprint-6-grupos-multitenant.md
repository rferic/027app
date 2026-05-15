# Sprint 6: Grupos Multitenant

> ⚠️ **Este sprint trae cambios arquitecturales profundos.** Afecta el esquema de DB, todas las rutas de la web pública, el middleware y los componentes de navegación. Revisar en detalle antes de ejecutar.

## Contexto del proyecto

- **Stack:** Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS v4
- **DB:** Supabase (PostgreSQL + RLS). Sin ORM — cliente Supabase directo con tipos generados.
- **Auth:** Supabase Auth. Roles: `admin` (platform-wide) / `member`.
- **i18n:** next-intl v4, 6 idiomas.
- **Package manager:** pnpm

---

## Objetivo del sprint

Convertir la plataforma en un sistema genuinamente multi-tenant. Actualmente los grupos existen en el schema pero el código los ignora: las queries no filtran por grupo, las URLs no incluyen grupo, y las apps instaladas son globales sin contexto de grupo.

Este sprint implementa el modelo completo:

1. **URL por grupo** — `/[locale]/[group-slug]/dashboard` como estructura de rutas para la web pública
2. **Datos por grupo** — las tablas de datos de las apps tienen `group_id`
3. **Acceso a apps privadas por grupo** — el admin controla qué grupos tienen acceso
4. **Admin platform-wide** — los admins gestionan todos los grupos desde el backoffice
5. **Creación de grupos con wizard** — onboarding al crear un grupo nuevo
6. **Group switcher** — selector en el header para cambiar de grupo

---

## Decisiones de diseño tomadas

| Punto | Decisión |
|---|---|
| URL de grupo | `/[locale]/[group-slug]/dashboard` (locale primero) |
| Apps instaladas | Globales (sin `group_id` en `installed_apps`) |
| Datos de apps | Por grupo (`group_id` en tablas de datos de cada app) |
| Acceso apps privadas | Por grupo — tabla `group_app_access` |
| Rol admin | Platform-wide (no por grupo) |
| Crear grupo | Solo admins, con wizard de onboarding |
| Multi-grupo | Un usuario puede estar en varios grupos; switcher en header + URL |

---

## Cambios de schema

### Tabla nueva: `group_app_access`

Reemplaza el modelo anterior de `app_permissions` para el control de acceso a apps privadas:

```sql
create table public.group_app_access (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  app_slug   text not null,
  created_at timestamptz not null default now(),
  unique (group_id, app_slug)
);
```

**Lógica de acceso:**
- Si `installed_apps.visibility = 'public'` → todos los miembros de cualquier grupo tienen acceso
- Si `installed_apps.visibility = 'private'` → solo miembros de grupos con entrada en `group_app_access` tienen acceso

### `app_permissions` (deprecada)

La tabla `app_permissions` existente (que tenía control por usuario) se elimina. El acceso es a nivel de grupo, no de usuario individual.

### `group_id` en tablas de datos de apps

Cada app que gestiona datos debe añadir `group_id` a sus tablas. Para la app `todo`:

```sql
alter table public.todo_items add column group_id uuid references public.groups(id) on delete cascade;
-- Asignar grupo por defecto a registros existentes (ver TASK-47)
update public.todo_items set group_id = (select id from public.groups limit 1) where group_id is null;
alter table public.todo_items alter column group_id set not null;
```

El contrato de `migrations.sql` de cada app debe incluir `group_id` desde ahora.

---

## Arquitectura de rutas

**Antes (Sprint 5 y anteriores):**
```
(app)/[locale]/
  dashboard/
  apps/[slug]/
  profile/
```

**Después (Sprint 6):**
```
(app)/[locale]/
  [group-slug]/          ← nuevo segmento dinámico
    dashboard/
    apps/[slug]/
  profile/               ← perfil de usuario: SIN group-slug (es personal, no de grupo)
```

**Redirecciones a implementar:**
- `/[locale]/dashboard` → `/[locale]/[first-group-slug]/dashboard`
- `/[locale]/apps/[slug]` → `/[locale]/[first-group-slug]/apps/[slug]`
- Si el usuario pertenece a un solo grupo: redirigir automáticamente a ese grupo
- Si pertenece a varios: redirigir al último grupo visitado (guardado en cookie) o al primero

---

## Tareas del sprint

---

### TASK-47 — Migración de schema (DB)

**Archivos:** `supabase/migrations/20260515000001_group_multitenant.sql`

```sql
-- 1. Tabla group_app_access (reemplaza app_permissions para acceso por grupo)
create table public.group_app_access (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  app_slug   text not null,
  created_at timestamptz not null default now(),
  unique (group_id, app_slug)
);

alter table public.group_app_access enable row level security;

-- SELECT: admin siempre, member solo si pertenece al grupo
create policy "group_app_access_select" on public.group_app_access
  for select to authenticated using (
    exists (select 1 from public.group_members gm where gm.user_id = auth.uid())
  );

-- INSERT/DELETE: solo service_role (via admin client)
create policy "group_app_access_admin" on public.group_app_access
  for all to service_role using (true);

-- 2. Eliminar app_permissions (sustituida por group_app_access)
drop table if exists public.app_permissions cascade;

-- 3. group_id en todo_items
alter table public.todo_items
  add column group_id uuid references public.groups(id) on delete cascade;

-- Asignar grupo existente a registros huérfanos
update public.todo_items
  set group_id = (select id from public.groups order by created_at limit 1)
  where group_id is null;

alter table public.todo_items alter column group_id set not null;

-- Actualizar RLS de todo_items para filtrar por grupo
drop policy if exists "todo_items_select" on public.todo_items;
create policy "todo_items_select" on public.todo_items
  for select to authenticated using (
    exists (
      select 1 from public.group_members gm
      where gm.user_id = auth.uid() and gm.group_id = todo_items.group_id
    )
  );
```

**Actualizar `apps/todo/migrations.sql`** para incluir `group_id` en la definición original (para instalaciones desde cero).

---

### TASK-48 — Reestructuración de rutas: añadir `[group-slug]`

**Archivos afectados:**
- `src/app/(app)/[locale]/layout.tsx` → mover a `src/app/(app)/[locale]/[group-slug]/layout.tsx`
- `src/app/(app)/[locale]/dashboard/` → mover a `(app)/[locale]/[group-slug]/dashboard/`
- `src/app/(app)/[locale]/apps/` → mover a `(app)/[locale]/[group-slug]/apps/`
- `src/app/(app)/[locale]/profile/` → **NO mover** — perfil es personal, sin contexto de grupo
- `src/app/(app)/[locale]/page.tsx` → redirect a `/{locale}/{first-group-slug}/dashboard`

**Nuevo layout** `(app)/[locale]/[group-slug]/layout.tsx`:
```typescript
// Valida que group-slug existe y que el usuario es miembro
// Si no existe: notFound()
// Si el usuario no es miembro: redirect a /{locale}/dashboard (sin grupo)
// Si el usuario no está logueado: redirect a /{locale}/login
// Pasa el grupo resuelto como contexto a los children
```

**Conflicto a resolver:** `[group-slug]` es un segmento dinámico que podría colisionar con otras rutas de `[locale]`. Verificar que `profile/` y `login/` siguen siendo alcanzables.

---

### TASK-49 — Group context: resolución y propagación

**Archivo:** `src/lib/groups/context.ts`

```typescript
export interface GroupContext {
  id: string
  name: string
  slug: string
  role: 'admin' | 'member'
}

// Server-side: resuelve el grupo desde el slug de la URL
// Verifica que el usuario actual es miembro
// Retorna null si el grupo no existe o el usuario no pertenece a él
export async function resolveGroupContext(
  slug: string
): Promise<GroupContext | null>

// Retorna todos los grupos del usuario (para el switcher)
export async function getUserGroups(userId: string): Promise<GroupContext[]>

// Lee/escribe el último grupo visitado en cookie
export function getLastGroupCookie(): string | null
export function setLastGroupCookie(slug: string): void
```

**GroupContext en componentes:**
- El layout `[group-slug]/layout.tsx` resuelve el contexto y lo pasa por props
- `AppShell` y `AppHeader` reciben el `GroupContext` para mostrar el nombre del grupo y el switcher
- Las pages reciben `groupId` para filtrar datos

---

### TASK-50 — Group switcher en el header

**Archivo:** `src/components/group-switcher.tsx` (`'use client'`)

Componente que:
- Muestra el nombre del grupo actual con un chevron
- Al pulsar: abre un dropdown con todos los grupos del usuario
- Cada ítem: nombre del grupo + slug + indicador visual si es el activo
- "Crear grupo" al final (solo si el usuario es admin) — abre el wizard (TASK-52)
- Al seleccionar: navega a `/{locale}/{group-slug}/dashboard`
- Guarda en cookie `last_group` el slug seleccionado

**Integrar en `AppHeader`:**
- Sustituir el nombre del grupo actual (si lo hay) por `<GroupSwitcher>`
- Si el usuario pertenece a un solo grupo: mostrar el nombre sin dropdown (sin opción de cambio)

**i18n** (añadir en TASK-55):
```json
{
  "groups": {
    "switch_label": "Cambiar grupo",
    "create_group": "Crear grupo"
  }
}
```

---

### TASK-51 — Admin: gestión de grupos (`/admin/groups`)

**Archivos:**
- `src/app/(admin)/[locale]/admin/groups/page.tsx`
- `src/app/(admin)/[locale]/admin/groups/[id]/page.tsx`
- `src/app/(admin)/[locale]/admin/groups/[id]/GroupMembersSection.tsx`
- `src/app/(admin)/[locale]/admin/groups/[id]/GroupAppsSection.tsx`

**Lista de grupos** (`/admin/groups`):
- Tabla con: nombre, slug, nº de miembros, nº de apps activas, fecha creación
- Botón "Nuevo grupo" → abre wizard (TASK-52)
- Click en fila → navega a `/admin/groups/[id]`

**Detalle de grupo** (`/admin/groups/[id]`):
- Header: nombre, slug, fecha creación
- Sección "Miembros": lista de miembros con rol, botón "Añadir miembro" (buscar por email entre usuarios existentes), botón "Eliminar del grupo"
- Sección "Apps privadas": lista de apps con `visibility=private` instaladas, toggle para habilitar/deshabilitar acceso para este grupo
- Botón "Eliminar grupo" (destructivo, con confirm dialog)

**Añadir "Grupos" en el sidebar admin** entre "Usuarios" y "Configuración".

---

### TASK-52 — Admin: wizard de creación de grupos

**Archivos:** `src/app/(admin)/[locale]/admin/groups/new/page.tsx` o componente modal multi-step

**Pasos del wizard:**

**Paso 1 — Datos del grupo:**
- Campo: Nombre del grupo (text, requerido)
- Campo: Slug (text, auto-generado desde el nombre, editable, validación: `/^[a-z0-9-]+$/`)
- Preview de URL: `/{locale}/{slug}/dashboard`

**Paso 2 — Invitar miembros:**
- Campo multi-email: añadir emails de futuros miembros
- Checkbox: "Enviar email de invitación ahora"
- Puede saltarse (sin miembros iniciales)

**Paso 3 — Apps:**
- Lista de apps instaladas
- Checkbox para incluir cada app (apps públicas se marcan por defecto y no son editables aquí)
- Apps privadas: checkbox para habilitar acceso al nuevo grupo

**Confirmación:**
- Resumen: nombre, slug, nº miembros invitados, apps habilitadas
- Botón "Crear grupo"
- Tras crear: redirect a `/admin/groups/[id]` del nuevo grupo

**Use-cases a implementar:** `src/lib/use-cases/groups/create-group-with-wizard.ts`

---

### TASK-57 — Admin: invitaciones con asignación a N grupos

**Problema actual:** Al crear una invitación, el usuario invitado entra a la plataforma pero no se le asigna a ningún grupo específico (o solo al grupo por defecto). Con el modelo multi-grupo, el admin debe poder asignar el usuario a uno o más grupos en el momento de la invitación.

**Archivos afectados:**
- `src/app/(admin)/[locale]/admin/invitations/page.tsx`
- `src/lib/use-cases/invitations/index.ts`
- Componente del formulario/modal de invitación

**Cambios en el formulario de invitación:**

Añadir campo multi-select de grupos:
```typescript
// Nuevo campo en el formulario
groups: string[]  // array de group IDs — mínimo 1 requerido
```

- El selector muestra todos los grupos existentes (nombre + slug)
- Selección múltiple con checkboxes o multi-select
- Al menos un grupo debe estar seleccionado (validación)
- Por defecto: si hay un solo grupo, se pre-selecciona automáticamente

**Cambios en el use-case de invitación:**

```typescript
// src/lib/use-cases/invitations/index.ts
// Actualizar la firma para aceptar grupos
export async function createInvitation(
  ctx: UseCaseContext,
  email: string,
  groupIds: string[]  // ← nuevo parámetro
): Promise<{ error: string | null }>
```

**Flujo al aceptar la invitación:**
- Cuando el usuario acepta la invitación y se registra, el sistema lo añade a todos los grupos especificados en `group_members` con `role = 'member'`
- El callback de auth (`src/app/auth/callback/`) o el hook post-registro debe leer los grupos de la invitación y hacer los inserts en `group_members`
- Si la invitación tenía N grupos: se crean N entradas en `group_members`

**Schema — añadir `groups` a la tabla de invitaciones:**

En la migración TASK-47 o en una migración separada:
```sql
alter table public.invitations add column group_ids uuid[] not null default '{}';
```

> Si la tabla `invitations` no tiene este campo, añadirlo. Si la tabla usa otra estructura, adaptar según el schema existente.

---

### TASK-58 — Admin: editar grupos de un usuario existente

**Problema:** Una vez que un usuario está en la plataforma, el admin no puede cambiar a qué grupos pertenece. Solo existe la opción de eliminarlo del grupo desde el detalle del grupo (TASK-51), pero no hay una vista centrada en el usuario que muestre y permita editar todos sus grupos.

**Archivos afectados:**
- `src/app/(admin)/[locale]/admin/users/[id]/page.tsx` (o crear si no existe)
- `src/app/(admin)/[locale]/admin/users/page.tsx` — añadir link al detalle de usuario
- `src/lib/use-cases/users/` — añadir use-cases de gestión de grupos por usuario

**Vista de detalle de usuario** (`/admin/users/[id]`):

Si ya existe una página de detalle de usuario, añadir sección "Grupos". Si no existe, crearla con:
- Header: display_name, email, avatar, fecha de registro, estado (activo/bloqueado)
- Sección "Grupos": lista de grupos a los que pertenece el usuario, con su rol en cada uno
- Botón "Añadir a grupo": select de grupos disponibles (los que el usuario NO está ya) → al confirmar, inserta en `group_members`
- Botón "Eliminar del grupo" por fila: elimina la entrada en `group_members`
- No se puede dejar al usuario sin ningún grupo si tiene datos en alguno (advertir pero no bloquear)

**Use-cases a implementar:**

```typescript
// src/lib/use-cases/users/manage-groups.ts

// Retorna los grupos a los que pertenece el usuario
export async function getUserGroupMemberships(
  userId: string
): Promise<{ groupId: string; groupName: string; groupSlug: string; role: 'admin' | 'member' }[]>

// Añade el usuario a un grupo con rol 'member'
export async function addUserToGroupAction(
  userId: string,
  groupId: string
): Promise<{ error: string | null }>

// Elimina al usuario de un grupo
// Verifica que no sea el último admin del grupo antes de eliminar
export async function removeUserFromGroupAction(
  userId: string,
  groupId: string
): Promise<{ error: string | null }>
```

**Desde la lista de usuarios** (`/admin/users`):
- Añadir columna o badge que muestre cuántos grupos tiene el usuario (ej. "2 grupos")
- Click en el nombre/fila → navega al detalle del usuario

---

### TASK-53 — Actualizar app todo para usar `group_id`

**Archivos:** `apps/todo/view.tsx`, `apps/todo/widget.tsx`, `apps/todo/admin.tsx`, `apps/todo/routes/`

**Cambios:**
1. Todas las queries que leen/escriben en `todo_items` deben incluir `group_id` como filtro
2. El `group_id` se obtiene del `AppContext` (añadir `groupId` al `AppContextValue`)
3. Actualizar `src/lib/apps/context.ts` y `src/components/app-provider.tsx` para incluir `groupId`
4. El layout `[group-slug]/apps/[slug]/layout.tsx` pasa el `groupId` al `AppProvider`

**Contrato de AppContext actualizado:**
```typescript
export interface AppContextValue {
  slug: string
  manifest: AppManifest
  config: ResolvedAppConfig
  groupId: string  // ← nuevo
}
```

**Rutas API de la app todo** (`apps/todo/routes/`): añadir filtro por `group_id` en todas las queries.

---

### TASK-54 — Acceso a apps privadas: `group_app_access`

**Archivos:**
- `src/lib/apps/access.ts` — lógica de verificación de acceso
- `src/app/(app)/[locale]/[group-slug]/apps/[slug]/layout.tsx` — guard de acceso

**Función de verificación:**
```typescript
// Verifica si un usuario (via su grupo) puede acceder a una app
// - Si visibility=public: siempre true
// - Si visibility=private: true solo si existe entrada en group_app_access para ese grupo
export async function canGroupAccessApp(
  groupId: string,
  appSlug: string
): Promise<boolean>
```

**Server Actions para admin:**
```typescript
// Habilitar acceso de un grupo a una app privada
export async function grantGroupAppAccessAction(groupId: string, appSlug: string): Promise<void>

// Revocar acceso de un grupo a una app privada
export async function revokeGroupAppAccessAction(groupId: string, appSlug: string): Promise<void>
```

**Integrar en `GroupAppsSection`** (TASK-51): el toggle de apps privadas llama a estas actions.

---

### TASK-55 — i18n: claves nuevas para grupos

**Archivos:** `src/i18n/messages/[locale].json` para los 6 idiomas

```json
{
  "groups": {
    "switch_label": "Cambiar grupo",
    "create_group": "Crear grupo nuevo",
    "no_groups": "No perteneces a ningún grupo",
    "wizard": {
      "step_data": "Datos del grupo",
      "step_members": "Invitar miembros",
      "step_apps": "Apps",
      "step_confirm": "Confirmar",
      "name_label": "Nombre del grupo",
      "slug_label": "Identificador (slug)",
      "slug_hint": "Solo letras minúsculas, números y guiones",
      "url_preview": "Tu URL será",
      "skip_step": "Saltar",
      "create_button": "Crear grupo",
      "success": "Grupo creado correctamente"
    },
    "admin": {
      "title": "Grupos",
      "new_group": "Nuevo grupo",
      "members_section": "Miembros",
      "apps_section": "Apps",
      "add_member": "Añadir miembro",
      "remove_member": "Eliminar del grupo",
      "delete_group": "Eliminar grupo",
      "delete_confirm": "¿Eliminar el grupo? Esta acción es irreversible.",
      "app_access_enabled": "Con acceso",
      "app_access_disabled": "Sin acceso"
    }
  },
  "invitations": {
    "groups_label": "Asignar a grupos",
    "groups_hint": "El usuario se unirá a estos grupos al aceptar la invitación",
    "groups_required": "Selecciona al menos un grupo"
  },
  "users": {
    "groups_section": "Grupos",
    "groups_count": "{count, plural, one {# grupo} other {# grupos}}",
    "add_to_group": "Añadir a grupo",
    "remove_from_group": "Eliminar del grupo",
    "no_groups_warning": "El usuario no pertenece a ningún grupo"
  }
}
```

Traducir a los 6 idiomas (en, es, it, ca, fr, de).

---

### TASK-56 — Tests

**Archivos en `tests/`:**

`tests/groups/context.test.ts`:
- `resolveGroupContext('mi-familia')` retorna el contexto si el usuario es miembro
- `resolveGroupContext('otro-grupo')` retorna null si el usuario no es miembro
- `resolveGroupContext('no-existe')` retorna null

`tests/groups/access.test.ts`:
- `canGroupAccessApp(groupId, 'todo')` retorna true si la app es pública
- `canGroupAccessApp(groupId, 'private-app')` retorna false si no hay entrada en `group_app_access`
- `canGroupAccessApp(groupId, 'private-app')` retorna true tras `grantGroupAppAccessAction`

`tests/groups/user-groups.test.ts`:
- `addUserToGroupAction(userId, groupId)` inserta en `group_members` correctamente
- `removeUserFromGroupAction(userId, groupId)` elimina la entrada
- `removeUserFromGroupAction` retorna error si el usuario es el último admin del grupo

`tests/invitations/groups.test.ts`:
- `createInvitation(ctx, email, [groupId1, groupId2])` crea invitación con `group_ids` correctos
- Al aceptar invitación: el usuario se añade a todos los grupos especificados
- `createInvitation` falla si `groupIds` está vacío

`tests/e2e/group-switcher.e2e.ts`:
- Usuario con 2 grupos ve el switcher en el header
- Al cambiar de grupo, la URL cambia a `/{locale}/{new-slug}/dashboard`
- Los datos del dashboard son del nuevo grupo seleccionado

`tests/e2e/admin-groups.e2e.ts`:
- Admin crea un grupo via wizard (3 pasos)
- El grupo aparece en `/admin/groups`
- Admin habilita una app privada para el grupo
- El miembro del grupo ve la app en su dashboard

`tests/e2e/admin-invitations-groups.e2e.ts`:
- Admin crea una invitación asignando 2 grupos
- El usuario invitado acepta y queda añadido a los 2 grupos
- El detalle del usuario en `/admin/users/[id]` muestra los 2 grupos

`tests/e2e/admin-user-groups.e2e.ts`:
- Admin navega al detalle de un usuario
- Añade al usuario a un nuevo grupo
- El usuario aparece en la lista de miembros del grupo
- Admin elimina al usuario del grupo

---

## Orden de ejecución recomendado

```
TASK-47 (schema migration) ← PRIMERO — base para todo
    ↓
TASK-48 → TASK-49          ← routing + context (en orden, dependientes)
    ↓
TASK-50    TASK-53          ← en paralelo: switcher + actualizar todo
    ↓
TASK-51 → TASK-52           ← en orden: lista grupos + wizard
    ↓
TASK-54    TASK-57    TASK-58   ← en paralelo: acceso apps + invitaciones grupos + editar grupos usuario
    ↓
TASK-55                     ← i18n (puede ir antes, en paralelo con todo lo anterior)
    ↓
TASK-56                     ← tests (al final)
```

---

## Notas para el agente implementador

1. **La migración (TASK-47) es irreversible.** `app_permissions` se elimina. Asegurarse de que no hay código que la referencie antes de aplicarla.

2. **El cambio de URL es breaking.** Todos los links hardcodeados a `/dashboard`, `/apps/[slug]` en la web pública deben actualizarse para incluir el group-slug. El middleware debe redirigir las URLs viejas.

3. **`profile/` NO incluye group-slug.** El perfil del usuario es personal y no tiene contexto de grupo. Verificar que sigue funcionando en `(app)/[locale]/profile/`.

4. **Cookie `last_group`** para recordar el último grupo visitado. Si un usuario tiene un solo grupo, no mostrar el switcher (solo el nombre del grupo sin interacción).

5. **Conflicto de segmentos dinámicos:** `[locale]` y `[group-slug]` son ambos dinámicos. Next.js los resuelve por orden de rutas. Asegurarse de que `profile/` y `login/` (que NO tienen group-slug) son alcanzables y tienen prioridad sobre `[group-slug]/`.

6. **Datos existentes:** Antes de aplicar la migración, verificar que todos los registros de `todo_items` pueden asignarse a un grupo existente. Si la DB está vacía (entorno de desarrollo), no hay problema.

7. **AppContext incluye `groupId` desde este sprint.** Cualquier app nueva debe usarlo. El contrato de `apps/{slug}/view.tsx` ahora puede asumir que `useAppContext().groupId` está disponible.

8. **El wizard de onboarding (TASK-52)** puede simplificarse a MVP: solo Paso 1 (datos) es obligatorio. Pasos 2 y 3 pueden marcarse como "puedes completar esto después" y redirigir al detalle del grupo.
