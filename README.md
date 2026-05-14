# apps027

An open-source group apps platform. Whether you're managing a family, team, or any collective, apps027 provides a unified workspace where groups manage users, roles, and app permissions in one place.

## Features

**Multi-group & Auth**
- Invitation-based user management with Supabase Auth
- Group-scoped roles and permissions (admin / member)
- Persistent JWT sessions (no expiry — users stay logged in until they sign out)
- Block/unblock users

**Backoffice (admin panel)**
- Multilingual admin panel at `/{locale}/admin`
- Collapsible vertical sidebar (state persisted across reloads)
- Dashboard with group stats
- User & administrator management with inline block/role actions
- Invitation management (create, revoke, delete)
- Profile editing with password change
- Settings > General: configure active languages and default locale

**Internationalization**
- 6 supported locales: English, Spanish, Italian, Catalan, French, German
- Per-user locale preference stored in the database
- Per-group active locales configurable from the admin panel
- All UI strings translated — no hardcoded English

**App Permissions**
- Per-app module access control
- Role-based feature toggles
- Extensible app architecture

## Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | Frontend framework (App Router) |
| TypeScript | Strict typing |
| Supabase | PostgreSQL + Auth |
| shadcn/ui | Component library |
| Tailwind CSS | Styling |
| next-intl | i18n management |
| Vitest | Unit testing |
| Playwright | E2E testing |

## Route Structure

- **`/{locale}/admin`** – Multilingual backoffice for group and user management (admin role only)
- **`/{locale}`** – Public web app with locale-aware routing (member role)

## Visual Style

- White sidebar with **rose/garnet** accent color (`rose-600` primary).
- Gray page background (`bg-gray-100`), white content cards.
- All action buttons are pill-shaped `<button>` elements — never plain text links.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (package manager)
- **Supabase CLI** (for local development)

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/apps027.git
cd apps027
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Start local Supabase
```bash
supabase start
```

### 5. Apply database migrations
```bash
# If supabase db push fails (remote already has earlier migrations), apply directly:
docker exec -i supabase_db_027apps psql -U postgres -d postgres < supabase/migrations/<file>.sql
```

### 6. Generate Supabase types
```bash
supabase gen types typescript --local > src/types/supabase.ts
# Remove "Connecting to db" line at the top if present
```

### 7. Start the development server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |

## How to Add a New App Module

1. **Create the page** under `src/app/(app)/[locale]/apps/[module-name]/page.tsx`
2. **Define permissions** in `app_permissions` table
3. **Add i18n keys** to all 6 locale files in `src/i18n/messages/`
4. **Register in backoffice** so admins can grant access

## Contributing

Follow the conventions in `CLAUDE.md`. Write tests for new features. Open an issue first for large changes.

## License

See `LICENSE` for details.
