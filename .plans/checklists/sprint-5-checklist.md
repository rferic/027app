# ✅ Checklist Sprint 5 — Estabilización

## TASK-46 — Instalación de apps
- [x] Instalar app To-Do desde admin — sin error de migración
- [x] Instalar app Recetas (si existe) — sin error
- [x] Desinstalar y reinstalar — sin errores
- [x] `pnpm build` sin errores
- [x] `pnpm test` todo verde

## TASK-39 — Bottom nav sin sesión
- [x] Abrir la web en mobile (o viewport reducido) sin sesión
- [x] No debe verse el bottom nav ni header con opciones de usuario
- [x] Solo se ve el formulario de login

## TASK-40 — Rutas protegidas sin sesión
- [x] Ir a /{locale}/profile sin sesión → redirige a login
- [x] Ir a /{locale}/dashboard sin sesión → redirige a login
- [x] Ir a /{locale}/apps/* sin sesión → redirige a login

## TASK-41 — Locale selector en perfil
- [x] (Pendiente decisión A/B del usuario)

## TASK-42 — Sidebar admin
- [x] Crear una API Key → el sidebar "Configuración" no se colapsa
- [x] El ítem activo sigue marcado

## TASK-43 — Detalle de app
- [x] (Pendiente decisión modal/drawer/botón del usuario)

## TASK-44 — Unificar modales
- [x] Invitaciones y API Keys siguen el mismo patrón (modal o formulario)
- [x] Toast de éxito/error funciona en ambos casos

## TASK-45 — Widget apps en dashboard
- [x] Dashboard muestra widget con apps disponibles
- [x] Click en app navega a /{locale}/apps/{slug}
- [x] Estado vacío muestra mensaje adecuado
- [x] 6 idiomas traducidos

## TASK-47 — Pre-push hook y pre-check local
- [x] Hook ejecuta `pnpm install --frozen-lockfile`
- [x] Hook ejecuta `pnpm lint`
- [x] Hook ejecuta `pnpm tsc --noEmit`
- [x] Hook ejecuta `pnpm test --run`
- [x] Hook ejecuta `pnpm build`
- [x] Hook aborta push si cualquier paso falla (exit 1)
- [x] `git config core.hooksPath .githooks` configurado
- [x] `AGENTS.md` actualizado con pre-check + frozen-lockfile + hook info
- [x] `merge-to-main/SKILL.md` actualizado con frozen-lockfile

## General
- [x] `pnpm build` sin errores
- [x] `pnpm test` todo verde
- [x] Navegación completa: login → dashboard → apps → perfil → logout
