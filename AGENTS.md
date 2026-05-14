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
<!-- END:sprint-conventions -->

<!-- BEGIN:code-review -->
# Code Review antes de merge

1. El **Ingeniero** (agente de calidad) audita el código automáticamente
2. El Ingeniero emite un veredicto (aprobado/rechazado con observaciones)
3. Se pregunta al usuario: "¿Revisas tú o te fías del veredicto?"
4. Según su respuesta: él revisa el diff o se procede con el merge
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
