# apps027 — Developer Guide

Open-source group apps platform. A group can be a family, team, or any collective.
Each group manages its own users, roles, and app permissions.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) + TypeScript strict |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion (use sparingly) |
| i18n | next-intl |
| Mobile | Expo (React Native) + EAS Update |
| Docs site | Fumadocs (fumadocs-ui + fumadocs-core + fumadocs-mdx) |
| Testing | Vitest + Playwright |
| Package manager | pnpm |
| Hosting | Local → Vercel (pending) |

## Directory structure

```
source.config.ts      <- Fumadocs source config (MDX from content/docs/)
src/
  proxy.ts              <- Next.js 16 middleware (locale routing, session refresh, admin guards); /doc/* redirected to /{locale}/doc/*
  app/
    (admin)/[locale]/admin/   <- Backoffice, desktop-first, admin role only
      dashboard/              <- Overview stats
      users/                  <- Members and administrators
      admins/                 <- Administrator list
      invitations/            <- Invitation management
      profile/                <- Admin's own profile + password change
      settings/
        general/              <- Group settings (active locales, default locale)
        api-keys/             <- API key management (page.tsx, actions.ts, ApiKeysManager.tsx)
      apps/                   <- App management (install, uninstall, configure, permissions)
        [slug]/                <- App detail page (admin view + config form)
    (app)/[locale]/           <- Public web, mobile-first, member role
    (doc)/[locale]/doc/       <- Developer docs site (Fumadocs), public, no auth
      layout.tsx              <- DocsLayout with DocRootProvider (i18n + language switcher + brand color)
      language-provider.tsx   <- 'use client' RootProvider with onLocaleChange for /{locale}/doc/ structure
      [[...slug]]/page.tsx    <- i18n-aware catch-all; resolves page via source.getPage(slug, locale)
    api/
      v1/                     <- REST API v1
        me/route.ts           <- GET /api/v1/me (auth: jwt)
        apps/route.ts         <- GET /api/v1/apps (auth: any)
        locales/route.ts      <- GET /api/v1/locales (auth: public) — returns { code, name, is_default }[]
    doc/
      page.tsx                <- redirect /doc → /en/doc (proxy also handles /doc/* → /{locale}/doc/*)
      [lang]/                 <- legacy safety-net redirects (proxy intercepts before reaching these)
    auth/callback/            <- Supabase auth redirect handler
  components/
    ui/                <- shadcn components (do not edit) — installed: button, card, confirm-dialog, input, label, sonner
    auth/              <- Login forms
    layout/            <- Shell, Header, Sidebar
    shared/            <- Reusable across admin and app
    admin-sidebar.tsx          <- Collapsible vertical sidebar (state persisted to localStorage)
    admin-header.tsx           <- Top bar with locale switcher + user dropdown
    admin-user-table.tsx       <- Users table with block/role action buttons
    admin-block-button.tsx     <- Block/unblock action button
    admin-role-button.tsx      <- Role change (admin ↔ member) button
    admin-overflow-reset.tsx   <- Resets CSS overflow from Fumadocs/next-themes on admin mount
    locale-switcher.tsx        <- Locale toggle (supports 6 locales)
    user-dropdown.tsx          <- Profile dropdown (Edit profile + Sign out), fully translated
    app-footer.tsx             <- Global footer for public web; link to /{locale}/doc using 'nav.docs' i18n key
  lib/
    supabase/          <- client.ts, server.ts, admin.ts (service role), api.ts (no-cookie clients)
    api/               <- auth.ts (authenticate), response.ts (apiOk/apiError/apiList), types.ts
    auth/              <- helpers.ts, actions.ts
    source.ts          <- Fumadocs source loader
    use-cases/
      types.ts         <- UseCaseContext, UseCaseError
      admin/           <- admin use-cases
      auth/            <- auth use-cases
      api-keys/        <- create-api-key.ts, list-api-keys.ts, revoke-api-key.ts, types.ts
      groups/          <- group use-cases
      install/         <- install/uninstall use-cases
      invitations/     <- invitation use-cases
      settings/        <- getGroupSettings / updateGroupSettings
      users/           <- user use-cases (block, role change, etc.)
  hooks/               <- use-user.ts, use-locale.ts
  types/
    supabase.ts        <- auto-generated, do not edit
    app.ts             <- domain types
  i18n/
    routing.ts
    request.ts
    messages/          <- en.json, es.json, it.json, ca.json, fr.json, de.json
content/
  docs/                <- MDX source for the Fumadocs docs site (i18n: one dir per locale)
    en/                <- Source of truth — all new content starts here
      index.mdx        <- Docs landing page (Fumadocs Cards layout)
      api/
        meta.json      <- Navigation config: endpoints as collapsible group
        index.mdx      <- REST API intro + versioning
        authentication.mdx
        errors.mdx
        i18n.mdx       <- i18n / locales endpoint documentation
        endpoints/
          meta.json    <- Defines "Core Endpoints" section label
          me.mdx
          apps.mdx
          locales.mdx
    es/                <- Spanish translation (kept in sync by the Translator agent)
    it/                <- Italian translation
    ca/                <- Catalan translation
    fr/                <- French translation
    de/                <- German translation
supabase/
  migrations/          <- ordered SQL files
tests/
  unit/
  e2e/
apps/                  <- App modules (each app is a self-contained folder)
  README.md            <- Developer guide for creating apps
  [slug]/
    manifest.json      <- App metadata and configuration schema
    migrations.sql     <- DDL — applied by the system at install time
    uninstall.sql      <- Reverse DDL — applied by the system at uninstall time
    install.ts         <- Data initialization (no DDL)
    uninstall.ts       <- Data cleanup (no DDL)
    view.tsx           <- Public web view (if manifest.views.public === true)
    admin.tsx          <- Admin web view (if manifest.views.admin === true)
    admin-routes/
      [slug]/          <- App detail page in admin /(admin)/[locale]/admin/apps/[slug]/
        page.tsx       <- Rewrite with header + AdminComponent + AppConfigSection
        AppConfigSection.tsx   <- Client component with config form for installed app
    widget.tsx         <- Dashboard widget (if manifest.views.widget === true)
    native.tsx         <- React Native screen (if manifest.views.native === true)
    routes/            <- REST API handlers (if manifest.api === true)
      GET.ts           <- handler for GET /api/v1/apps/[slug]
      [id]/
        GET.ts         <- handler for GET /api/v1/apps/[slug]/[id]
    docs/
      index.mdx        <- Required if docs/ exists
      api.mdx          <- Recommended if manifest.api === true
      config.mdx       <- Optional: configuration fields reference
mobile/                <- Expo React Native app (Sprint 3+)
```

## Naming conventions

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase | `LoginForm.tsx` |
| Hooks | kebab-case with `use-` prefix | `use-user.ts` |
| Utilities | camelCase | `getUserRole.ts` |
| API routes | kebab-case | `/api/auth/callback` |
| Env vars | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |
| SQL tables | snake_case plural | `group_members` |
| TypeScript types | PascalCase | `type GroupRole = 'admin' | 'member'` |

## shadcn/ui — componentes disponibles

Solo están instalados: `button`, `card`, `confirm-dialog`, `input`, `label`, `sonner`.

**Regla obligatoria antes de usar `@/components/ui/<name>`**: verifica que el archivo `src/components/ui/<name>.tsx` existe.  
Si no existe, elige una de estas opciones:
1. Instalar via `pnpm dlx shadcn@latest add <name>` y actualizar la lista de arriba.
2. Implementar el comportamiento con primitivas React + Tailwind (sin dependencia shadcn).

Nunca importar un componente `@/components/ui/*` sin verificar su existencia primero — rompe el build.

## Code patterns

- **Server Components by default.** Add `'use client'` only for state, effects, or browser events.
- **No `any`.** Use `unknown` and explicit narrowing.
- **Explicit errors.** Never silence `catch (e) {}` without logging or rethrowing.
- **Absolute imports only.** Use `@/*` alias. Never use `../../../`.
- **One component per file** unless the subcomponent is <30 lines and tightly coupled.
- **Supabase server client** for all data fetching in Server Components and Server Actions.
- **Supabase browser client** only for real-time subscriptions.
- **All user-visible strings must use `useTranslations` / `getTranslations`.** Never hardcode English text in components.
- **Admin page centering**: all admin page wrappers use `p-6 max-w-{size} mx-auto` to center content horizontally with consistent padding.
- **Use-cases layer**: `src/lib/use-cases/[domain]/[action].ts` — pure functions `(ctx: UseCaseContext, ...args) => Promise<T>`. Never import `next/headers`. Called by Server Actions and API handlers. **Use-cases read user locale from `profiles.locale` after auth operations** to ensure correct post-login redirects.
- **UseCaseContext**: `{ supabase, userId?, groupId, role?, email? }` — built by the caller (Server Action or API handler), never by the use-case itself.
- **UseCaseError**: throw `new UseCaseError(code, message)` for expected failures. Let unknown errors bubble up.

## Use-cases pattern

All business logic lives in `src/lib/use-cases/[domain]/[action].ts`. Every entry point (Server Actions, API handlers, tests) calls the same use-case function.

```typescript
// src/lib/use-cases/types.ts
interface UseCaseContext {
  supabase: SupabaseClient  // caller-scoped client (user or admin)
  userId?: string           // undefined for machine-to-machine (API key)
  groupId: string
  role?: 'admin' | 'member'
}

// src/lib/use-cases/users/block-user.ts
export async function blockUser(ctx: UseCaseContext, userId: string): Promise<void>
```

Rules:
- Use-cases are **pure functions** — no `import` from `next/headers`, no HTTP context
- Use-cases throw `UseCaseError(code, message)` on business logic failures
- Server Actions = thin wrappers that build `ctx` and call a use-case
- API handlers = thin wrappers that build `ctx` (from JWT or API key) and call a use-case

## REST API conventions

- Base path: `/api/v1/` — versioned from day one
- Auth levels: `public` (no auth) | `apikey` (`X-API-Key` header) | `jwt` (`Authorization: Bearer`) | `any` (either apikey or jwt)
- Success response: flat resource or array — no `{ data: ... }` envelope
- Error response: `{ "error": "code", "message": "...", "fields"?: {...} }` + HTTP status
- Pagination: `Link` header RFC 5988 — no body metadata
- App endpoints: handlers in `apps/[slug]/routes/[METHOD].ts`, mounted at `/api/v1/apps/[slug]/...`
- Use `authenticate(req, level)` from `@/lib/api/auth` in every API route handler
- Use `apiOk`, `apiError`, `apiList` from `@/lib/api/response` — never build `NextResponse` manually
- Use `createApiClient(accessToken?)` or `createApiAdminClient()` from `@/lib/supabase/api` in route handlers (no cookies)

## Admin backoffice patterns

- The admin area lives at `/(admin)/[locale]/admin/` (locale-aware URL).
- `AdminSidebar` is a `'use client'` component. Collapsed state is persisted in `localStorage` under key `admin-sidebar-collapsed`. **Default state is expanded** (checked via `=== 'true'`), not collapsed.
- When collapsed, submenu items (Users, Settings) are shown via JS hover state (`hoveredMenu` + `hoverTimeout` ref) — do NOT use CSS `group-hover` for this.
- Action buttons (block, role change, revoke, delete) must be `<button>` elements styled as pill buttons — never plain coloured text links.
- Use `createAdminClient()` (service role key) for all admin data operations. Auth identity is verified separately via `supabase.auth.getUser()`.
- `AdminUserTable`, `AdminBlockButton`, `AdminRoleButton`, `InvitationTable`, `CreateInvitationForm` are all `'use client'` and use `useTranslations`.
- **App management**: The app list (`AppsManager.tsx`) shows author and a public/private toggle. The "Configure" button navigates to `/(admin)/[locale]/admin/apps/[slug]` (not a modal). The app detail page displays the app's admin view from the manifest plus an `AppConfigSection` component for managing the app's configuration.

### Button and form styling

- **Primary action buttons** (submit, create, save): `bg-slate-900 hover:bg-slate-700 text-white rounded-lg`. **Rose is never used for action buttons** — it is reserved exclusively for active navigation states in the sidebar.
- **All form submit buttons** must be placed **inside the card** as the last element with a separator: `pt-3 border-t border-slate-100`.
- **Destructive action buttons** (block, revoke, delete): `border border-red-200 bg-red-50 text-red-700 rounded-lg` pill buttons.

### Toast notifications

- All admin forms display feedback via **Sonner toasts**: `<Toaster theme="light" position="bottom-right" />` is included in the admin layout.
- **Forms using `useActionState`**: detect state changes via `useEffect` + `prevStateRef`. Call `toast.success(t('common.saved'))` or `toast.error(message)` on state change.
- **Forms using `useTransition`**: call `toast.success()`/`toast.error()` directly in the callback after the action completes.
- Toast styling uses `theme="light"` (does not depend on next-themes, which only exists in `/doc`).

## Design / visual style

The admin panel and the public app have **intentionally different visual styles**. This is by design — users should immediately perceive which context they are in.

### Admin panel (`/[locale]/admin/`)

Desktop-first. Sober, professional palette.

| Element | Classes |
|---|---|
| Page background | `bg-gray-100` |
| Content cards | `bg-white rounded-xl border border-slate-100 p-5` |
| Sidebar background | `bg-white border-r border-gray-200` |
| Sidebar active item | `bg-rose-50 text-rose-700 font-medium` |
| Sidebar inactive item | `text-gray-500 hover:text-gray-900 hover:bg-gray-100` |
| Primary action buttons | `bg-slate-900 hover:bg-slate-700 text-white rounded-lg` |
| Destructive actions | `border border-red-200 bg-red-50 text-red-700` pill buttons |
| Avatar initials | `bg-slate-100 text-slate-500` |
| Role badge (admin) | `bg-slate-900 text-white` |
| Role badge (member) | `bg-slate-100 text-slate-500` |
| Status badge (pending) | `bg-emerald-50 text-emerald-700` |
| Status badge (expired) | `bg-amber-50 text-amber-700` |
| Status badge (revoked) | `bg-red-50 text-red-600` |
| Status badge (accepted) | `bg-slate-100 text-slate-500` |

**Rose is used exclusively for active navigation states** in the sidebar. It signals "where you are", not "what you can do".

### Public app (`/[locale]/`)

Mobile-first. Visual style **to be defined** when the first app module is implemented. Do not use the admin palette here.

**Layout isolation**: The outer `<div>` in `(app)/[locale]/layout.tsx` must include `bg-white` to prevent dark-mode class from Fumadocs/next-themes (persisted in `<html>`) bleeding into the public web UI. Admin panel and public app have different visual styles by design.

**Dark mode support**: Furnish light and dark logo variants as separate SVG files. Apply conditional visibility with Tailwind's `dark:hidden` / `hidden dark:block` when `class="dark"` is set (e.g., via next-themes in Fumadocs).

### Rules (both contexts)

- All interactive elements must have `cursor-pointer`.
- Action buttons are `<button>` elements — never plain coloured text links.
- Rounded corners: `rounded-lg` for buttons, `rounded-xl` for cards.
- All user-visible strings use `useTranslations` / `getTranslations`. No hardcoded text.

## Database conventions

- Never edit `src/types/supabase.ts` manually. Regenerate with: `supabase gen types typescript --local > src/types/supabase.ts` (strip the first "Connecting to db" line if present).
- RLS must be enabled on every table.
- New migrations go in `supabase/migrations/` with timestamp prefix.
- Test RLS policies with a cross-user query before merging.
- `group_members` RLS uses a security-definer function `is_group_admin(uuid)` to avoid infinite recursion.

## i18n conventions

- **6 supported locales**: `en`, `es`, `it`, `ca`, `fr`, `de`. Default: `en`.
- Message files: `src/i18n/messages/{locale}.json`. All 6 files must have identical keys.
- Fallback locale is `en`.
- User locale preference is stored in `profiles.locale`.
- Group-level active locales and default locale are stored in `group_settings` table.
- Key namespaces: `auth`, `home`, `nav`, `common`, `admin.*`, `user`, `profile`.
- `user.editProfile` / `user.signOut` — used by `UserDropdown` (shared between app and admin).
- **Post-login locale routing**: After successful authentication, the `signIn` use-case reads `profiles.locale` and redirects the user to `/{profile_locale}/dashboard`. If the profile has no locale, fallback to the URL locale.

## Docs site conventions (`/doc`)

The developer docs site is served at `/doc` via Fumadocs (MDX sources in `content/docs/`).

### i18n

- **URL structure**: `/{lang}/doc/...` — e.g. `/en/doc/api`, `/es/doc/api`. Consistent with admin (`/en/admin`) and app (`/en/`).
- **6 supported languages**: `en`, `es`, `it`, `ca`, `fr`, `de`. Default: `en`.
- `/doc` and `/doc/*` → proxy redirects to `/{preferredLocale}/doc/...`.
- `src/lib/source.ts` configures the Fumadocs loader with `i18n: { defaultLanguage: 'en', languages: [...], parser: 'dir' as const }` and exports `i18nConfig`. The custom `url` function generates `/{lang}/doc/...`.
- **Source of truth**: `content/docs/en/` — all new pages are written in English first.
- Translations live in `content/docs/{lang}/` and are maintained by the **Translator agent**.

### Navigation and layout

- **Navigation** is controlled by `meta.json` files in each directory. Use them to define section labels, page order, and collapsible groups — never rely on filesystem order alone.
- **`content/docs/en/api/meta.json`** — top-level API nav; the `endpoints/` directory is rendered as a collapsible group.
- **`content/docs/en/api/endpoints/meta.json`** — defines the "Core Endpoints" section label and page order.
- **`(doc)/[locale]/doc/layout.tsx`** — sets DocsLayout with 027Apps logo (light and dark variants: `logo.svg` + `logo-dark.svg` with Tailwind `dark:hidden` / `hidden dark:block`) and overrides Fumadocs primary color to `#9B1C1C` via CSS variable.
- **`(doc)/[locale]/doc/language-provider.tsx`** — `'use client'` `DocRootProvider` wraps `RootProvider` with i18n config and custom `onLocaleChange` for `/{locale}/doc/` URL structure.
- Landing page (`content/docs/en/index.mdx`) uses Fumadocs `<Cards>` / `<Card>` components (included in `defaultMdxComponents`).

## Supabase: applying migrations locally

`supabase db push --local` may fail if the remote already has earlier migrations. Apply only the new migration directly:

```bash
docker exec -i supabase_db_027apps psql -U postgres -d postgres < supabase/migrations/<file>.sql
supabase gen types typescript --local > src/types/supabase.ts
# Remove the first "Connecting to db" line from the generated file if present
```

## How to add a new app module

1. Create `src/app/(app)/[locale]/apps/[slug]/page.tsx`
2. Add the `app_slug` to `app_permissions` for the relevant users (via backoffice)
3. Add i18n keys in all 6 `src/i18n/messages/*.json` files

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm test             # Vitest unit tests
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright e2e tests

# Supabase
supabase gen types typescript --local > src/types/supabase.ts
supabase db push      # Apply migrations (linked project)
supabase db reset     # Reset local DB and reapply migrations
```
