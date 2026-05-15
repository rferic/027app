<!-- BEGIN:sprint-conventions -->
# Convención de Sprints

Los planes de sprint se guardan en `.plans/` con el formato:

```
sprint-{N}-{descripcion}.md
```

## Numeración
- Los sprints van numerados secuencialmente: Sprint 1, Sprint 2, Sprint 3...
- Las tareas continúan la numeración global entre sprints. Si el Sprint 1 termina en TASK-13, el Sprint 2 empieza en TASK-14.

## Estado de un sprint
- **Pendiente:** el archivo no tiene sufijo → `sprint-1-apps-system.md`
- **Implementado:** añadir sufijo `.done` → `sprint-1-apps-system.md.done`

Antes de empezar cualquier tarea, revisa los archivos en `.plans/` para saber qué sprints están pendientes (`.md`) y cuáles ya están implementados (`.md.done`), y continúa la numeración desde la última TASK del último sprint.

## Rama por sprint
- Cada sprint se trabaja en su propia rama: `sprint/{N}-{descripcion}` (ej. `sprint/4-github-deploy`)
- Features en ramas `feature/{descripcion}`, fixes en `fix/{descripcion}`
- El merge a `main` se hace con **squash merge** — un solo commit limpio por feature/sprint
- **NUNCA** se trabaja directamente en `main`

## Formato de PR y commits

```
PR title:         Sprint N: Título descriptivo
Squash commit:    Sprint N: Título descriptivo
Commits en rama:  Sprint N: type(scope): mensaje
```

**Ejemplos:**

```
PR:               Sprint 6: Multitenant groups
Squash commit:    Sprint 6: Multitenant groups
Commits:          Sprint 6: feat: widget dashboard
                  Sprint 6: fix: sidebar collapse
                  Sprint 6: docs: pre-push hook
```

**Reglas:**
- El PR title y el squash commit SIEMPRE empiezan con `Sprint N: `
- Los commits individuales en la rama también llevan `Sprint N: ` prefijo
- `type` sigue conventional commits: feat, fix, docs, refactor, test, chore
- El `scope` es opcional, va entre paréntesis tras el type

## Flujo preview-first (OBLIGATORIO)
Siempre seguir este orden:

```
Push rama → Vercel preview (staging) → pruebas en preview → OK → merge a main → deploy producción
```

**Reglas:**
1. Nunca mergear a `main` sin antes haber pusheado la rama y verificado el preview en staging
2. El preview de Vercel se genera automáticamente al pushear la rama
3. Probar en la URL de preview antes de autorizar el merge
4. Documentar en el sprint la URL de preview usada

**Excepciones:** Solo si el usuario dice explícitamente "merge directo" o "sin preview".
<!-- END:sprint-conventions -->

<!-- BEGIN:admin-form-pattern -->
# Patrón de formularios admin

Todos los formularios de creación/edición en el área admin (`/(admin)`) DEBEN usar el patrón MODAL:

- Backdrop: `fixed inset-0 z-50` con `bg-black/40`
- Panel: `bg-white rounded-xl border border-slate-100 shadow-xl p-6 w-full max-w-lg mx-4`
- Abrir/cerrar con estado local (`useState(true/false)`) en el componente padre de la lista
- Cierre: backdrop click + botón X + escape key
- NO usar páginas separadas (`/[id]/` o `/new`) para formularios de creación/edición
- NO usar formularios inline visibles siempre

Excepciones permitidas:
- Páginas de configuración completas (ej. Settings General, App Config)
- Páginas de perfil propio (ej. Admin Profile)
- Formularios que son el propósito principal de la página

Ejemplo canónico: `ApiKeysManager.tsx` (modal inline), `CreateInvitationModal.tsx` (modal separado).
<!-- END:admin-form-pattern -->

<!-- BEGIN:code-review -->
# Pre-Check antes de merge (OBLIGATORIO)

Antes de cualquier code review o merge, ejecutar localmente:

```bash
pnpm install --frozen-lockfile  # lockfile sincronizado
pnpm lint                       # corrige errores automáticos con --fix si aplica
pnpm tsc --noEmit               # errores de tipos
pnpm test --run                 # tests unitarios
pnpm build                      # build completo
```

Si cualquiera falla, **no se procede** hasta corregirlo.

El pre-push hook (`.githooks/pre-push`) ejecuta esto automáticamente en cada `git push`.
Para activarlo: `git config core.hooksPath .githooks` (ya configurado).

# Code Review antes de merge

1. Ejecutar pre-check (lint + tsc + test + build)
2. El **Ingeniero** (agente de calidad) audita el código automáticamente
3. El Ingeniero emite un veredicto (aprobado/rechazado con observaciones)
4. Se pregunta al usuario: "¿Revisas tú o te fías del veredicto?"
5. Según su respuesta: él revisa el diff o se procede con el merge
<!-- END:code-review -->

<!-- BEGIN:deploy-rule -->
# 🚨 REGLA DE ORO: No hacer deploy sin permiso

**NUNCA** se hace deploy a producción sin confirmación explícita del usuario.
Toda skill, agente o flujo automático debe preguntar antes de deployar.
<!-- END:deploy-rule -->

<!-- BEGIN:shadcn-verification-rules -->
# Verificación de componentes shadcn/ui

Antes de importar cualquier componente de `@/components/ui/*`, DEBES verificar que el archivo existe en `src/components/ui/`.

**Regla obligatoria para el Soldado:**
1. Usa Glob o Bash para listar `src/components/ui/` antes de escribir código
2. Si el componente no existe, tienes dos opciones:
   a. Instalarlo: `npx shadcn@latest add <component>` (verifica que sea compatible con el proyecto)
   b. Implementarlo sin ese componente usando Tailwind CSS puro
3. NUNCA importes un componente shadcn sin haber verificado que existe — esto rompe la aplicación en build time

Los componentes actualmente instalados se pueden verificar con: `ls src/components/ui/`
<!-- END:shadcn-verification-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:environments -->
# Entornos

## Proyectos

| Entorno | Supabase Project Ref | Supabase URL | Vercel |
|---|---|---|---|
| **Local** | — | `http://localhost:54321` | — |
| **Staging** | `tsphkmbtnahjgsivdhaj` | `https://tsphkmbtnahjgsivdhaj.supabase.co` | Preview Deployments |
| **Producción** | `zbwvvzeljiymwqcbemyy` | `https://zbwvvzeljiymwqcbemyy.supabase.co` | Production |

## Claves de API

| Entorno | `SUPABASE_SERVICE_ROLE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
|---|---|---|
| **Local** | Generada con JWT secret local | Generada con JWT secret local |
| **Staging** | En Vercel (env Preview) | En Vercel (env Preview) |
| **Producción** | En Vercel (env Production) | En Vercel (env Production) |

## Flujo de trabajo

```
Push rama (sprint/*, feature/*, fix/*)
  → CI: lint + tsc + test
  → Vercel: Preview Deployment (contra Supabase staging)
  → migrate-staging.yml: supabase db push (contra staging)
       [solo si hay cambios en supabase/migrations/]

Merge a main (squash merge)
  → Vercel: Production Deployment (contra Supabase producción)
  → migrate-prod.yml: supabase db push (contra producción)
       [solo si hay cambios en supabase/migrations/]
```

## Workflows de GitHub Actions

| Archivo | Disparador | Destino |
|---|---|---|
| `ci.yml` | PR a `main` | lint + tsc + test |
| `release.yml` | Push a `main` | release-please (semver) |
| `migrate-prod.yml` | Push a `main` (migrations/) | `supabase db push` → **producción** |
| `migrate-staging.yml` | Push a `sprint/*`, `feature/*`, `fix/*` (migrations/) | `supabase db push` → **staging** |

## Cómo probar en staging

1. Push a una rama `sprint/*`, `feature/*` o `fix/*`
2. Esperar a que Vercel despliegue el Preview Deployment
3. Abrir la URL que Vercel muestra en el PR/commit (ej. `sprint-5-estabilizacion.027apps.vercel.app`)
4. Esa URL apunta a Supabase staging — datos aislados de producción

## Migraciones manuales

Si necesitas aplicar migraciones a staging manualmente:

```bash
supabase link --project-ref tsphkmbtnahjgsivdhaj
supabase db push --include-all
```

Si necesitas aplicar migraciones a producción manualmente:

```bash
supabase link --project-ref zbwvvzeljiymwqcbemyy
supabase db push --include-all
```
<!-- END:environments -->

<!-- BEGIN:local-dev -->
# Desarrollo local

1. Asegúrate de que Supabase local está corriendo:
   ```bash
   supabase start
   ```

2. El `.env.local` debe tener las claves locales:
   - `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` = claves locales firmadas con el JWT secret local

3. Para regenerar las claves locales (si cambia el JWT secret):
   ```bash
   node -e "
   const c = require('crypto');
   const s = 'super-secret-jwt-token-with-at-least-32-characters-long';
   const n = Math.floor(Date.now()/1000);
   const h = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
   [['service_role'],['anon']].forEach(([r])=>{
     const p = Buffer.from(JSON.stringify({iss:'supabase',ref:'027apps',role:r,iat:n,exp:n+86400*365})).toString('base64url');
     const sig = c.createHmac('sha256', s).update(h+'.'+p).digest('base64url');
     console.log(r.toUpperCase()+'_KEY= '+h+'.'+p+'.'+sig);
   });
   "
   ```
<!-- END:local-dev -->
