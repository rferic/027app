---
name: create-app
description: Guided workflow for creating a new app module for the 027Apps platform. Asks one question at a time, shows a full plan before generating any file, and only writes code after explicit user approval.
---

# Skill: /create-app

You are helping the developer create a new app module for the 027Apps platform. Follow the three-phase process below strictly. Do not skip phases or generate files before approval.

---

## Phase 1 — Requirements gathering

Ask one question at a time, in this exact order. Wait for the user's answer before asking the next question.

1. **Name and slug**: "What is the app's name and slug? The slug must be lowercase letters, digits, and hyphens only (e.g. `shopping-list`, `recipes`)."
   - Validate slug with `/^[a-z0-9-]+$/`. If invalid, reject and ask again.

2. **Description**: "Describe the app in one or two sentences."

3. **Author**: "Who is the author? (name required, URL optional)"

4. **Public web view** (`views.public`): "Does the app need a public web page for members? If yes, briefly describe what it shows."

5. **Admin web view** (`views.admin`): "Does the app need a page in the admin backoffice? If yes, briefly describe what it shows."

6. **Dashboard widget** (`views.widget`): "Does the app need a dashboard widget? If yes, describe what compact information it shows (e.g. 3 latest items, a counter)."

7. **Mobile screen** (`views.native`): "Does the app need a React Native screen in the mobile app? If yes, describe its main function."

8. **Table prefix**: "What will be the `tablePrefix` for this app's database tables? It must match `^[a-z][a-z0-9_]*_$` — lowercase letters/digits/underscores, ending with `_`, max 20 chars. Example: `todo_`, `gastos_`, `mi_app_`. This prefix is required even if the app has no tables."
   - Validate with `/^[a-z][a-z0-9_]*_$` and `length <= 20`. If invalid, reject and ask again.
   - Suggest a default derived from the slug (e.g. slug `shopping-list` → prefix `shopping_list_`).

9. **Database tables**: "Does the app need its own database tables? If yes, list the tables and their main fields."
   - Reminder: all table names must start with the declared `tablePrefix`.

9. **Configuration fields**: "Does the app have admin-configurable settings? If yes, for each field provide: key name, type (string/number/boolean/select/textarea), whether it's required, and a default value."

10. **Dependencies**: "Does this app depend on other installed apps? If yes, list their slugs."

11. **Colors**: "What are the primary and secondary colors for this app? (hex codes, e.g. `#4F46E5` and `#EEF2FF`)"

12. **Min platform version**: "Minimum platform version required? (default: `1.0.0`)"

13. **Documentation sections**: "Will this app have technical documentation? If yes, list sections beyond the required `index.mdx` (e.g. `api`, `config`, `webhooks`)."

**Validation rules:**
- At least one of `views.public`, `views.admin`, `views.widget`, `views.native` must be true. If all are false, stop and explain.
- `tablePrefix` is always required. Validate format `/^[a-z][a-z0-9_]*_$/` and max 20 chars.
- If tables are declared, both `migrations.sql` and `uninstall.sql` will be generated. All table names must start with `tablePrefix`.
- If `docs/` is created, `index.mdx` is always included.

---

## Phase 2 — Plan

Before generating any file, present the complete plan to the user:

```
📋 APP PLAN: {name} ({slug})

manifest.json preview:
{full manifest JSON}

Files to create:
apps/{slug}/
  manifest.json
  logo.svg                    ← simple SVG using primaryColor
  install.ts
  uninstall.ts
  [migrations.sql]            ← if tables declared
  [uninstall.sql]             ← if tables declared
  [view.tsx]                  ← if views.public
  [admin.tsx]                 ← if views.admin
  [widget.tsx]                ← if views.widget
  [native.tsx]                ← if views.native
  [routes/]                   ← if api endpoints needed
  [docs/index.mdx]            ← always if docs requested
  [docs/{section}.mdx]        ← one per extra section

Database (if tables declared):
{CREATE TABLE statements preview}

⚠️ Please review the plan. Reply "OK", "Adelante" or "Approved" to generate all files.
```

Wait for explicit approval. If the user requests changes, adjust and show the updated plan again before proceeding.

---

## Phase 3 — File generation

Only after explicit approval, generate all files in order:

1. `manifest.json` — complete, valid JSON
2. `logo.svg` — minimal SVG icon using `primaryColor`
3. `migrations.sql` — if tables declared; include RLS policies
4. `uninstall.sql` — `DROP TABLE IF EXISTS ... CASCADE` for each table
5. `install.ts` — seed data if applicable; otherwise minimal stub
6. `uninstall.ts` — data cleanup stub (tables removed by uninstall.sql)
7. `view.tsx` — if `views.public`; functional UI, no placeholder
8. `admin.tsx` — if `views.admin`; functional UI following admin palette
9. `widget.tsx` — if `views.widget`; compact display, no props, fetches own data
10. `native.tsx` — if `views.native`; React Native with FlatList/TextInput/View/Text, no extra deps
11. `routes/` handlers — if API needed; one file per method per path level
12. `docs/index.mdx` — always if docs requested
13. `docs/{section}.mdx` — one per additional section

### Code rules

- All UI strings use `useTranslations` / `getTranslations` — never hardcode text
- Config field labels in `manifest.json` must include all 6 locales: `en`, `es`, `it`, `ca`, `fr`, `de`
- `view.tsx` and `widget.tsx` use the public app palette (not admin rose/slate)
- `admin.tsx` follows the admin palette: `bg-white rounded-xl border border-slate-100 p-5`, slate-900 buttons, red-50 destructive
- `native.tsx` uses only React Native core components: `View`, `Text`, `FlatList`, `TextInput`, `TouchableOpacity`, `StyleSheet`, `ActivityIndicator`
- Route handlers import `authenticate` from `@/lib/api/auth` and use `apiOk`/`apiError` from `@/lib/api/response`
- Route handlers use `createAdminClientUntyped()` from `@/lib/supabase/admin` (app tables not in generated Supabase types)
- Dynamic colors use `style={{ backgroundColor: manifest.primaryColor }}` not Tailwind classes
- Slug validated with `/^[a-z0-9-]+$/` before any filesystem or DB operation

### manifest.json schema reminder

```json
{
  "slug": "string",
  "tablePrefix": "string",
  "name": "string",
  "version": "1.0.0",
  "description": "string",
  "logo": "logo.svg",
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "author": { "name": "string", "url": "optional" },
  "minPlatformVersion": "1.0.0",
  "views": { "public": bool, "admin": bool, "widget": bool, "native": bool },
  "api": bool,
  "dependencies": [],
  "notifications": false,
  "config": [
    {
      "key": "string",
      "type": "string|number|boolean|select|textarea",
      "label": { "en": "", "es": "", "it": "", "ca": "", "fr": "", "de": "" },
      "required": bool,
      "default": "value"
    }
  ]
}
```

**`tablePrefix` rules:**
- Format: `/^[a-z][a-z0-9_]*_$/` — lowercase, alphanumeric + underscores, must end with `_`
- Max 20 characters
- Examples: `todo_`, `gastos_`, `shopping_list_`
- Must be unique across all installed apps — the installer enforces this
- Required even if the app has no tables (used for future namespacing)
- All tables in `migrations.sql` and `uninstall.sql` must start with this prefix
