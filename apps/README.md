# 027Apps — App Developer Guide

This guide covers everything needed to create or integrate an app module into the 027Apps platform.

---

## What is the app system?

App modules extend the platform with new functionality. Each app lives in its own directory under `apps/[slug]/`, declares its capabilities in a `manifest.json`, and integrates with the platform via a well-defined contract.

The platform handles:
- Installation / uninstallation (DDL, data init, rollback)
- Admin UI for managing and configuring apps
- Routing: public web views, admin views, dashboard widgets, REST API, React Native screens
- Configuration schema and validation

---

## Directory structure

```
apps/
  [slug]/
    manifest.json        Required — app metadata and configuration schema
    logo.svg             Required if manifest.logo is set
    migrations.sql       Required if the app needs its own DB tables
    uninstall.sql        Required if migrations.sql exists
    install.ts           Required — data init (no DDL)
    uninstall.ts         Required — data cleanup (no DDL)
    view.tsx             Required if manifest.views.public === true
    admin.tsx            Required if manifest.views.admin === true
    widget.tsx           Required if manifest.views.widget === true
    native.tsx           Required if manifest.views.native === true
    routes/              Required if manifest.api === true
      GET.ts             Handler for GET /api/v1/apps/[slug]
      POST.ts            Handler for POST /api/v1/apps/[slug]
      [id]/
        GET.ts           Handler for GET /api/v1/apps/[slug]/[id]
        PUT.ts           Handler for PUT /api/v1/apps/[slug]/[id]
        DELETE.ts        Handler for DELETE /api/v1/apps/[slug]/[id]
    docs/
      index.mdx          Required if docs/ directory exists
      api.mdx            Recommended if manifest.api === true
      config.mdx         Optional — configuration field reference
```

---

## manifest.json — All fields

```json
{
  "slug": "my-app",
  "tablePrefix": "my_app_",
  "name": "My App",
  "version": "1.0.0",
  "description": "What this app does.",
  "logo": "logo.svg",
  "primaryColor": "#4F46E5",
  "secondaryColor": "#EEF2FF",
  "author": {
    "name": "Your Name",
    "url": "https://yoursite.com"
  },
  "minPlatformVersion": "1.0.0",
  "views": {
    "public": true,
    "admin": false,
    "widget": true,
    "native": false
  },
  "api": true,
  "dependencies": [],
  "extends": null,
  "extensionPoints": [],
  "notifications": false,
  "config": [
    {
      "key": "max_items",
      "type": "number",
      "label": {
        "en": "Maximum items",
        "es": "Máximo de elementos",
        "it": "Elementi massimi",
        "ca": "Màxim d'elements",
        "fr": "Éléments maximum",
        "de": "Maximale Einträge"
      },
      "required": false,
      "default": 50,
      "min": 1,
      "max": 1000
    }
  ]
}
```

### Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | ✓ | Unique identifier. Lowercase letters, digits, hyphens only (`/^[a-z0-9-]+$/`) |
| `tablePrefix` | string | ✓ | DB namespace for all app tables. Format: `^[a-z][a-z0-9_]*_$` (e.g. `my_app_`, `todo_`). Max 20 chars. Must be unique across installed apps. Required even if the app has no tables. |
| `name` | string | ✓ | Human-readable display name |
| `version` | string | ✓ | Semver (e.g. `1.0.0`) |
| `description` | string | ✓ | One-sentence description |
| `logo` | string | — | Path relative to the app directory (e.g. `logo.svg`) |
| `primaryColor` | string | ✓ | Hex color used in admin cards and widget headers |
| `secondaryColor` | string | ✓ | Hex background accent |
| `author.name` | string | ✓ | Author name |
| `author.url` | string | — | Author website |
| `minPlatformVersion` | string | ✓ | Minimum platform version required — references the `version` field in the root `package.json` (currently `0.1.0`). The platform checks this at install time to ensure compatibility. |
| `views.public` | boolean | ✓ | Whether the app has a public web view |
| `views.admin` | boolean | ✓ | Whether the app has an admin panel view |
| `views.widget` | boolean | ✓ | Whether the app has a dashboard widget |
| `views.native` | boolean | ✓ | Whether the app has a React Native screen |
| `api` | boolean | ✓ | Whether the app exposes REST API endpoints |
| `dependencies` | string[] | ✓ | Slugs of apps that must be installed first |
| `extends` | string | — | Slug of a base app this app extends. Auto-added to `dependencies`. |
| `extensionPoints` | string[] | — | Extension points this app exposes to others |
| `notifications` | boolean | ✓ | Reserved — always `false` for now |
| `config` | ConfigField[] | ✓ | Admin-configurable settings (can be empty array) |

### ConfigField types

| Type | Extra fields | Description |
|------|-------------|-------------|
| `string` | `regex?` | Free text input |
| `number` | `min?`, `max?` | Numeric input |
| `boolean` | — | Yes/No toggle |
| `select` | `options` (required) | Dropdown from fixed list |
| `textarea` | — | Multi-line text |

---

## DDL: migrations.sql and uninstall.sql

`migrations.sql` runs **before** `install.ts` during app installation. It must contain pure DDL (CREATE TABLE, indexes, RLS policies). No data operations.

`uninstall.sql` runs **after** `uninstall.ts` during app removal. Use `DROP TABLE IF EXISTS ... CASCADE` to remove all app tables.

**Important:** Both files must exist or neither. The platform enforces this.

### Table naming convention

All tables in `migrations.sql` and `uninstall.sql` **must start with the app's `tablePrefix`**. The installer validates this and rejects migrations where any table name does not match. This prevents table name collisions between apps.

```
tablePrefix: "my_app_"  →  tables: my_app_items, my_app_categories, ...
tablePrefix: "todo_"    →  tables: todo_items, todo_lists, ...
```

If the installer raises a `table_prefix_mismatch` error, check that every `CREATE TABLE` in your `migrations.sql` uses the declared prefix.

```sql
-- migrations.sql example (tablePrefix: "my_app_")
create table if not exists my_app_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);

alter table my_app_items enable row level security;

create policy "Users read own items"
  on my_app_items for select using (auth.uid() = user_id);

create policy "Users insert own items"
  on my_app_items for insert with check (auth.uid() = user_id);
```

```sql
-- uninstall.sql example (tablePrefix: "my_app_")
drop table if exists my_app_items cascade;
```

---

## install.ts and uninstall.ts

These files handle **data operations only** — no DDL. The platform calls them with an `AppInstallContext`.

```typescript
// install.ts — seed data, insert default config, etc.
import type { AppInstallContext } from '@/types/apps'

export async function install(ctx: AppInstallContext): Promise<void> {
  // ctx.supabase — admin client (bypasses RLS)
  // ctx.manifest — the app's manifest
  // ctx.slug — the app slug
  await ctx.supabase.from('my_app_items').insert({ title: 'Welcome!' })
}
```

```typescript
// uninstall.ts — clean up data before DDL drop
import type { AppInstallContext } from '@/types/apps'

export async function uninstall(_ctx: AppInstallContext): Promise<void> {
  // Usually empty — CASCADE in uninstall.sql handles row deletion
}
```

**Rules:**
- Never run DDL in `install.ts` or `uninstall.ts`
- If `install()` throws, the platform attempts automatic rollback (calls `uninstall.ts` then `uninstall.sql`)
- The `supabase` client in ctx is a service role client — it bypasses RLS

---

## Web views: view.tsx, admin.tsx, widget.tsx

### view.tsx (public web)

Rendered at `/apps/[slug]`. The user must be logged in.

```tsx
'use client'

export default function MyAppView() {
  return <div>My app content</div>
}
```

- Can be a Server Component or Client Component
- Fetch own data internally (via API routes or Supabase client)
- Follow public web visual style (mobile-first, not admin palette)
- All user-visible strings via `useTranslations` / `getTranslations`

### admin.tsx (admin panel)

Rendered at `/admin/apps/[slug]`. Requires admin role.

```tsx
'use client'

export default function MyAppAdmin() {
  return <div className="p-6 max-w-3xl">Admin content</div>
}
```

- Follow admin visual style: `bg-white rounded-xl border border-slate-100 p-5`, `text-xl font-bold text-gray-900`
- Action buttons: `bg-slate-900 hover:bg-slate-700 text-white rounded-lg`
- Destructive actions: `border border-red-200 bg-red-50 text-red-700` pill buttons

### widget.tsx (dashboard)

Rendered in the dashboard grid. **Must export a default component with no props.**

```tsx
'use client'

export default function MyAppWidget() {
  // Fetch own data here
  return <div className="p-4">Compact summary</div>
}
```

- Compact: rendered inside a `bg-white rounded-xl border border-slate-100 overflow-hidden` card
- No props — the widget fetches its own data
- Keep it fast: show a summary (count, latest 3 items, status indicator)

---

## Mobile screen: native.tsx

Rendered in the Expo React Native app. **Only use React Native core components.**

```tsx
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

export default function MyAppNativeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My App</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
})
```

**Allowed components:** `View`, `Text`, `FlatList`, `TextInput`, `TouchableOpacity`, `ScrollView`, `ActivityIndicator`, `StyleSheet`, `Pressable`

**No native-only extra dependencies.** Connect to the API at `${process.env.EXPO_PUBLIC_API_URL}/api/v1/apps/[slug]`.

---

## API routes

Route handlers live in `apps/[slug]/routes/` and are mounted at `/api/v1/apps/[slug]/...`.

```typescript
// routes/GET.ts
import { type NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export default async function handler(req: NextRequest) {
  const auth = await authenticate(req, 'jwt')
  if (auth instanceof Response) return auth
  if (!auth.userId) return apiError('UNAUTHORIZED', 'User ID required', 401)

  const db = createAdminClientUntyped()
  const { data, error } = await db
    .from('my_app_items')
    .select('*')
    .eq('user_id', auth.userId)

  if (error) return apiError('QUERY_ERROR', error.message, 500)
  return apiOk(data)
}
```

**Important:**
- Always use `createAdminClientUntyped()` (not `createAdminClient()`). App-specific tables are not in the generated Supabase types.
- Always call `authenticate(req, level)` first. Auth levels: `'public'`, `'jwt'`, `'apikey'`, `'any'`
- Use `apiOk`, `apiError`, `apiList` from `@/lib/api/response` — never build `NextResponse` manually
- Extract URL params from `new URL(req.url).pathname.split('/')`

---

## Documentation: docs/index.mdx

Required if the `docs/` directory exists. Fumadocs renders it in the `/doc` site.

```mdx
---
title: My App
description: What this app does.
---

# My App

Brief description.

## Prerequisites

## Installation

## Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|

## Views

## Uninstallation
```

---

## How to use the /create-app skill

The fastest way to scaffold a new app is via the AI skill:

```
/create-app
```

The skill guides you through a series of questions (name, views, tables, config fields, etc.), shows you the full plan before writing anything, and only generates files after your explicit approval.

---

## Platform migration: table_prefix column

The `tablePrefix` system requires a one-time migration on the Supabase database. If you see a `migration_pending` error when installing an app, run this in the Supabase SQL editor:

```sql
alter table installed_apps add column if not exists table_prefix text;
```

The migration file is at `src/db/migrations/add_table_prefix_to_installed_apps.sql`.

---

## Installer errors reference

| Error code | Cause | Fix |
|------------|-------|-----|
| `migration_pending` | Column `table_prefix` does not exist in `installed_apps` | Run the platform migration above |
| `prefix_conflict` | Another installed app already uses the same `tablePrefix` | Choose a unique prefix in `manifest.json` |
| `table_prefix_mismatch` | A table in `migrations.sql` does not start with the declared `tablePrefix` | Rename the table to match the prefix |
| `uninstall_prefix_mismatch` | A table in `uninstall.sql` does not start with the declared `tablePrefix` | Fix the table name in `uninstall.sql` |

---

## TypeScript: AppManifest type reference

```typescript
export interface AppManifest {
  slug: string
  tablePrefix: string   // e.g. "my_app_" — must match /^[a-z][a-z0-9_]*_$/, max 20 chars
  name: string
  version: string
  description: string
  logo: string
  primaryColor: string
  secondaryColor: string
  author: { name: string; url?: string }
  minPlatformVersion: string
  views: { public: boolean; admin: boolean; widget: boolean; native: boolean }
  api: boolean
  dependencies: string[]
  extends?: string
  extensionPoints?: string[]
  notifications: boolean
  config: AppConfigField[]
}

export interface AppConfigField {
  key: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
  label: Record<string, string>   // { en, es, it, ca, fr, de }
  required: boolean
  default?: unknown
  min?: number           // for type: 'number'
  max?: number           // for type: 'number'
  regex?: string         // for type: 'string'
  options?: { value: string; label: Record<string, string> }[]  // for type: 'select'
}

export interface AppInstallContext {
  supabase: SupabaseClient  // admin client, bypasses RLS
  manifest: AppManifest
  slug: string
}
```
