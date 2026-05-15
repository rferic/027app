# ✅ Checklist Sprint 5 — Estabilización

## TASK-46 — Instalación de apps
- [ ] Instalar app To-Do desde admin — sin error de migración
- [ ] Instalar app Recetas (si existe) — sin error
- [ ] Desinstalar y reinstalar — sin errores
- [ ] `pnpm build` sin errores
- [ ] `pnpm test` todo verde

## TASK-39 — Bottom nav sin sesión
- [ ] Abrir la web en mobile (o viewport reducido) sin sesión
- [ ] No debe verse el bottom nav ni header con opciones de usuario
- [ ] Solo se ve el formulario de login

## TASK-40 — Rutas protegidas sin sesión
- [ ] Ir a /{locale}/profile sin sesión → redirige a login
- [ ] Ir a /{locale}/dashboard sin sesión → redirige a login
- [ ] Ir a /{locale}/apps/* sin sesión → redirige a login

## TASK-41 — Locale selector en perfil
- [ ] (Pendiente decisión A/B del usuario)

## TASK-42 — Sidebar admin
- [ ] Crear una API Key → el sidebar "Configuración" no se colapsa
- [ ] El ítem activo sigue marcado

## TASK-43 — Detalle de app
- [ ] (Pendiente decisión modal/drawer/botón del usuario)

## TASK-44 — Unificar modales
- [ ] Invitaciones y API Keys siguen el mismo patrón (modal o formulario)
- [ ] Toast de éxito/error funciona en ambos casos

## TASK-45 — Widget apps en dashboard
- [ ] Dashboard muestra widget con apps disponibles
- [ ] Click en app navega a /{locale}/apps/{slug}
- [ ] Estado vacío muestra mensaje adecuado
- [ ] 6 idiomas traducidos

## General
- [ ] `pnpm build` sin errores
- [ ] `pnpm test` todo verde
- [ ] Navegación completa: login → dashboard → apps → perfil → logout
