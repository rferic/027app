# Proyecto: 027Apps

Plataforma open-source de aplicaciones en grupo.
Un grupo puede ser una familia, equipo, amigos u otro colectivo.
Cada grupo gestiona sus propios usuarios, roles y permisos de acceso a las apps.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) + TypeScript strict |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI base | shadcn/ui + Tailwind CSS v4 |
| Animaciones | Framer Motion (puntual) |
| i18n | next-intl v4 |
| Package manager | pnpm |
| Mobile | Expo (React Native) + EAS Update |
| Testing unit | Vitest + Testing Library |
| Testing e2e | Playwright |
| Docs | Fumadocs (fumadocs-ui + fumadocs-core + fumadocs-mdx) |
| Hosting | Local → Vercel (pendiente) |

## Idiomas soportados

- `en` — English (default)
- `es` — Español
- `it` — Italiano
- `ca` — Català
- `fr` — Français
- `de` — Deutsch

## Arquitectura de rutas

```
app/
  (admin)/          → Backoffice — desktop-first — solo role admin
    admin/
      dashboard/
      users/
      settings/
        general/
        api-keys/
  (app)/            → Web pública — mobile-first — usuarios con permisos
    [locale]/
      dashboard/
      apps/
        [app-slug]/
  api/
    v1/             → REST API v1
      me/           → GET /api/v1/me (auth: jwt)
      apps/         → GET /api/v1/apps (auth: any)
      locales/      → GET /api/v1/locales (auth: public)
  doc/              → Sitio público de docs (Fumadocs, catch-all [[...slug]])
```

## Modelo de datos principal

```
groups              → Entidad raíz (familia, equipo, etc.)
  ↓
group_members       → usuario + grupo + role (admin | member)

installed_apps      → apps instaladas en el grupo
  ↓                   status (installing|active|error|uninstalling)
app_permissions     → permisos usuario+app cuando visibility='private'

profiles            → extensión del user de Supabase Auth
                      (display_name, locale, avatar_url)
```

## Roles y accesos

| Rol | Acceso |
|---|---|
| `admin` | Backoffice `/admin` + web pública |
| `member` | Solo web pública, apps permitidas |

## Flujos de autenticación

- **Invitación**: admin invita por email → Supabase Auth invitation → usuario se registra y entra al grupo
- **Sesión**: JWT persistente con refresh token (Supabase nativo)
- **Login backoffice**: `/admin/login` — solo admins
- **Login web**: `/[locale]/login` — members

## Sistema de Apps

Cada app vive en `/apps/[slug]/` con este contrato:

```
apps/[slug]/
  manifest.json      # metadatos, config, views declaradas
  migrations.sql     # DDL — el sistema lo ejecuta al instalar
  uninstall.sql      # DDL inverso — el sistema lo ejecuta al desinstalar
  install.ts         # init de datos (seeds, config defaults) — sin DDL
  uninstall.ts       # cleanup de datos — sin DDL
  view.tsx           # vista pública (si manifest.views.public === true)
  admin.tsx          # vista admin (si manifest.views.admin === true)
  widget.tsx         # widget dashboard (si manifest.views.widget === true)
```

**Contrato de archivos por app:**
```
apps/[slug]/
  manifest.json      views.native: boolean declarado aquí
  native.tsx         pantalla React Native (Expo), requerida si views.native === true
  docs/
    index.mdx        requerido si existe docs/
    api.mdx, config.mdx, ...   secciones adicionales opcionales
```

**Visibilidad:** una app instalada puede ser `public` (todos los miembros) o `private` (solo usuarios con registro en `app_permissions`).

**Mobile:** proyecto Expo en `/mobile`. Bundle estático — instalar/desinstalar = solo DB. Añadir app nueva = EAS Update via CI. Setup en Sprint 3.

**Rutas:** `/apps/[slug]/...` para usuarios, `/admin/apps/[slug]` para admin, `/api/apps/[slug]/...` para API, `/doc/apps/[slug]/...` para documentación técnica.

## API REST v1

Ruta base: `/api/v1/`

Auth levels:
- `public` — sin autenticación
- `jwt` — `Authorization: Bearer <supabase-token>`
- `apikey` — `X-API-Key: <key>` (key generada en admin settings)
- `any` — acepta jwt o apikey

Respuesta éxito: recurso plano o array (sin envelope).
Respuesta error: `{ "error": "code", "message": "...", "fields"?: {...} }`

Endpoints core implementados:
- GET /api/v1/me — perfil del usuario autenticado (auth: jwt)
- GET /api/v1/apps — apps activas del grupo (auth: any)
- GET /api/v1/locales — locales disponibles (auth: public)

Infraestructura:
- `src/lib/api/auth.ts` — `authenticate(req, level)` — middleware reutilizable
- `src/lib/api/response.ts` — `apiOk`, `apiError`, `apiList` (Link headers RFC 5988)
- `src/lib/supabase/api.ts` — `createApiClient()` y `createApiAdminClient()` sin cookies

## Componentes implementados

### Global
- **`src/components/admin-overflow-reset.tsx`** — Client Component. Limpia CSS overflow de `<html>`/`<body>` al montar admin layout. Previene bleed de Fumadocs/next-themes durante navegación cliente. Análogo al `bg-white` en `(app)` layout.
- **`src/components/app-footer.tsx`** — Server Component. Footer global para la web pública `(app)/[locale]/`. Renderiza link a `/{locale}/doc` con i18n key `nav.docs`. Posicionado al final del layout padre con `mt-auto`.

### Variantes de logo
- **`public/logo.svg`** — Wordmark light (texto "027" en `#1E293B`, fondo del ícono en `#9B1C1C`)
- **`public/logo-dark.svg`** — Wordmark dark (texto "027" en blanco, fondo del ícono en `#9B1C1C`)
- **Aplicación**: en `(doc)/[locale]/doc/layout.tsx` con Tailwind `dark:hidden` / `hidden dark:block` para dark mode automático

### Layout y aislamiento de estilos
- **`(app)/[locale]/layout.tsx`**: outer div incluye `bg-white` para prevenir que el class='dark' de Fumadocs/next-themes (persistido en `<html>`) afecte el estilo de la web pública. Admin y app pública tienen diseños intencionalmente diferentes.
- **`(app)/[locale]/login/page.tsx`**: formulario centrado con `flex flex-1 items-center justify-center bg-slate-50 p-6`
- **`(admin)/[locale]/admin/apps/[slug]/page.tsx`**: página de detalle de app con header (metadatos), vista admin de la app (desde manifest), y formulario de configuración.
- **`(admin)/[locale]/admin/apps/[slug]/AppConfigSection.tsx`**: componente `'use client'` que renderiza el formulario de configuración de una app instalada.

## Módulos activos

_(ninguno todavía — se añaden aquí a medida que se crean)_

## Reglas de negocio globales

- Los datos del grupo son privados. Sin analytics de terceros que envíen datos personales.
- Autenticación requerida para acceder a cualquier módulo.
- Web pública → experiencia mobile-first (los miembros usan principalmente el móvil).
- Backoffice → experiencia desktop-first (los admins gestionan desde ordenador).
- El locale del usuario se guarda en su perfil (`profiles.locale`) y se aplica en toda la web pública.
- **Post-login routing**: tras autenticar, el usuario es redirigido a `/{profile_locale}/dashboard` (o al locale del URL si el perfil no tiene preference).
- Proyecto open-source: el código debe ser limpio, documentado y reutilizable.
- **Admin sidebar default**: estado expandido (no colapsado).

## TODOs pendientes

- [ ] Definir plan de pricing/tiers si el proyecto crece (open-source)

## Decisiones técnicas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-05-06 | Stack definitivo | Next.js + Supabase por versatilidad. shadcn/ui sobre Aceternity por rendimiento mobile. next-intl para i18n. |
| 2026-05-06 | Modelo multi-group | Open-source. Cualquier colectivo puede usarlo. "Familia" es un caso de uso. |
| 2026-05-06 | Backoffice en /admin | Simplicidad. Un solo dominio, misma app Next.js. |
| 2026-05-10 | DDL via migrations.sql | Las apps declaran su schema en SQL files. El sistema los aplica. install.ts solo hace init de datos. Evita exec_sql SECURITY DEFINER. |
| 2026-05-10 | App visibility | installed_apps.visibility = public\|private. Si private, acceso individual via app_permissions. |
| 2026-05-10 | Mobile: Expo + EAS Update | Bundle estático. Instalar/desinstalar = solo DB. Nueva app = EAS Update via CI. Proyecto en /mobile, Sprint 3. |
| 2026-05-10 | Docs: /doc con Fumadocs | Sitio público de docs técnicas. Fumadocs (fumadocs-ui + fumadocs-core + fumadocs-mdx) sobre Next.js App Router. MDX en content/docs/ para plataforma, apps/[slug]/docs/ para apps. Menú dinámico, búsqueda integrada (Orama). |
| 2026-05-10 | GitHub + Vercel + versionado semántico | Sprint 3: repo GitHub → CI/CD con GitHub Actions → deploy en Vercel → release-please para semver automático. Prerequisito para EAS Update (Sprint 4) y usuarios reales. |
| 2026-05-10 | Seguridad weaved en sprints | Path traversal fix en /doc (Sprint 1). pnpm audit en CI + CORS restringido + auth rate limits + HTTP security headers en next.config.ts (Sprint 3). Sin sprint de seguridad separado para MVP. |
| 2026-05-11 | Sprint 0: API REST v1 + Fumadocs (implementado) | Capa de use-cases, API v1 con 3 niveles de auth (public/apikey/jwt/any), gestión de API keys, endpoints core (/me, /apps, /locales), sitio /doc con Fumadocs. 61/61 tests pasando. |
| 2026-05-11 | Use-cases como única implementación de lógica de negocio | src/lib/use-cases/[domain]/[action].ts. Server Actions y API handlers son wrappers delgados que construyen UseCaseContext y delegan. Garantiza consistencia entre web, admin, API REST y mobile. |
| 2026-05-11 | Docs MDX en content/docs/ | Fumadocs lee MDX de content/docs/ (plataforma). Apps exponen docs en apps/[slug]/docs/. source.config.ts en raíz del proyecto configura el loader. |
| 2026-05-12 | Dark mode logo + AppFooter | Dos SVG logos (light + dark) con Tailwind conditional visibility. AppFooter global en layout (app) con link a docs. Layout envuelve children en flex para posicionar footer al fondo. |
| 2026-05-12 | Bug fixes: layout isolation + dark mode + sidebar + locale routing | (1) bg-white en (app) layout aísla dark mode bleed. (2) Admin sidebar default expandido. (3) signIn usa profiles.locale para redirect post-login. (4) Login page centrada. |
| 2026-05-12 | App detail page + AppConfigSection | Página /admin/apps/[slug] centraliza vista admin + configuración. Botón "Configurar" navega en lugar de abrir modal. AppConfigSection es un client component reutilizable. |
| 2026-05-12 | AdminOverflowReset — limpia overflow CSS | Componente que limpia overflow:hidden de Fumadocs/next-themes al montar admin. Análogo al bg-white en (app) layout para aislamiento de estilos. |
| 2026-05-12 | Hydration: useFormatter de next-intl | ApiKeysManager y otros 'use client' que muestran fechas usan useFormatter en lugar de toLocaleDateString para evitar SSR/cliente mismatch. |
| 2026-05-16 | Pre-push hook (.githooks/pre-push) | Ejecuta frozen-lockfile → lint → tsc → test → build en cada push. Aborta si falla. Atrapa errores antes de GitHub Actions. `git config core.hooksPath .githooks`. |
