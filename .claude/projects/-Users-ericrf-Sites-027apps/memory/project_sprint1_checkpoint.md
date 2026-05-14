---
name: sprint1-checkpoint
description: Punto de parada al final del Sprint 1 — pendiente revisión del usuario antes de lanzar Periodista
metadata:
  type: project
---

Sprint 1 completado técnicamente. Usuario quiere revisar con calma antes de lanzar el Periodista.

**Estado al cerrar sesión:**

Todas las tareas del Sprint 1 implementadas y funcionando:
- TASK-07: Admin UI de apps (page.tsx + AppsManager.tsx)
- TASK-08: Routing dinámico (view, admin, API dispatcher)
- TASK-09: Dashboard con widgets
- TASK-10: App todo (completa con todas las vistas y rutas)
- TASK-11: Sidebar con enlace Apps
- TASK-12: i18n (namespaces `admin.apps`, `apps`)
- TASK-13: Tests (9/9 archivos, 81/81 tests ✓)
- TASK-14: Skill `/create-app`
- TASK-16: `apps/README.md`

**Fix adicional:** Bug en `src/lib/apps/manifest.ts` — `author` estaba en el array de campos string pero es un objeto. Eliminado de la lista `required`.

**Tests:** `pnpm test` → 9/9 files, 81 tests ✓

**Pendiente de ejecutar (en orden):**
1. Periodista — cerrar Sprint 1 (marca .done, actualiza docs, sincroniza traducciones si hay MDX nuevos)
2. Sprint 1.A — eliminar concepto de grupos de la plataforma
3. Sprint 1.B — TODO app completa (después del 1.A)
4. Sprint 2 — shell pública + permisos (diferido por el usuario)

**Why:** Usuario quiere revisar el trabajo antes de marcar el sprint como cerrado.
**How to apply:** Cuando el usuario diga "Continuemos por donde lo dejamos", preguntar: "¿Procedemos con el Periodista para cerrar Sprint 1 y luego empezamos Sprint 1.A?"
