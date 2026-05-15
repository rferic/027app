---
name: merge-to-main
description: Merge a branch into main with automatic code review and deploy to Vercel. Use when asked to "merge to main", "deploy to production", "publish", or "release a sprint/feature/fix". Always asks for explicit confirmation before merging and before deploying.
allowed-tools: Bash(gh *), Bash(git *), Bash(npx vercel *), Bash(npx supabase *)
---

# merge-to-main

Skill mixta: el agente ejecuta pasos automáticos pero espera confirmación explícita del usuario en cada checkpoint crítico.

## 🚨 REGLA DE ORO

**NUNCA hacer deploy sin confirmación explícita del usuario.** Preguntar siempre antes del último paso.

## Workflow

### Paso 1 — Verificar rama actual

```bash
git branch --show-current
git status
```

Confirmar que no estamos en `main`. Si estamos en `main`, parar y abortar.

### Paso 2 — Pre-check local (lockfile + lint + types + tests + build)

Ejecutar **siempre** localmente antes de cualquier push:

```bash
pnpm install --frozen-lockfile  # lockfile sincronizado
pnpm lint
pnpm tsc --noEmit
pnpm test --run
pnpm build
```

Si cualquiera falla, corregir antes de continuar. **No pasar al siguiente paso hasta que todo esté verde.**

### Paso 3 — Ingeniero audita

Ejecutar al **Ingeniero** con el contexto completo de los cambios (git diff contra main).

### Paso 4 — Preguntar al usuario

> "El Ingeniero ha [aprobado/rechazado] los cambios con [observaciones].
> ¿Revisas tú el diff o te fías del veredicto?"

- Si revisa: mostrar el diff (`git diff main...HEAD`) y esperar su decisión
- Si se fía: continuar

### Paso 5 — Push y PR

```bash
git push -u origin HEAD
```

Crear PR usando `gh pr create`:
```
gh pr create --title "Resumen del cambio" --body "## Summary\n\n[1-3 bullet points]"
```

### Paso 6 — Merge a main

**Preguntar confirmación:**
> "¿Confirmas el squash merge de esta rama a `main`?"

Esperar respuesta. Si confirma:

```bash
gh pr merge --squash
```

### Paso 7 — Deploy a Vercel

**Preguntar confirmación:**
> "¿Desplegamos a producción ahora?"

Solo si el usuario dice explícitamente "sí" o "adelante". Si duda o dice que no, detenerse.

### Paso 8 — Usar review-in-production

Ejecutar la skill `review-in-production` para verificar el deploy.
