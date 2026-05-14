# Plan GO — Asignación de Modelos

Documento canónico. Define qué modelo usa cada agente según la herramienta de codificación activa.

---

## Hub Familiar (027apps)

| Agente     | Tarea             | Claude API                | Copilot CLI         | OpenCode GO         | Razón GO                           |
|------------|-------------------|---------------------------|---------------------|---------------------|------------------------------------|
| Comandante | Estrategia/coord. | `claude-opus-4-7`         | `claude-sonnet-4.6` | `deepseek-v4-pro`   | Mejor razonamiento del plan        |
| Capitán    | Requisitos        | `claude-opus-4-7`         | `claude-sonnet-4.6` | `deepseek-v4-pro`   | Análisis de contexto largo         |
| Soldado    | Implementación    | `claude-sonnet-4-6`       | `claude-sonnet-4.6` | `deepseek-v4-pro`   | Top coding del plan                |
| Ingeniero  | Tests/validación  | `claude-sonnet-4-6`       | `claude-sonnet-4.6` | `deepseek-v4-flash` | Análisis rápido, bien en código    |
| Enfermero  | Limpieza código   | `claude-haiku-4-5`        | `claude-haiku-4.5`  | `minimax-m2.5`      | 80.2% SWE, muy barato en cuota     |
| Cocinero   | Docs simples      | `claude-haiku-4-5`        | `claude-haiku-4.5`  | `minimax-m2.5`      | Rápido y abundante en cuota        |
| Periodista | Docs post-sprint  | `claude-haiku-4-5`        | `claude-haiku-4.5`  | `minimax-m2.5`      | Ídem                               |
| Traductor  | MDX multilingüe   | `claude-haiku-4-5`        | `claude-haiku-4.5`  | `qwen3.6-plus`      | Mejor soporte multilingüe del plan |

---

## Hub Profesional (Labelgrup)

| Agente          | Tarea                | Claude API        | Copilot CLI       | OpenCode GO         | Razón GO                        |
|-----------------|----------------------|-------------------|-------------------|---------------------|---------------------------------|
| Boss            | Orquestación         | `claude-opus-4-7` | `claude-sonnet-4.6` | `deepseek-v4-pro` | Decisiones estratégicas         |
| Architect       | Diseño estructural   | `claude-opus-4-7` | `claude-sonnet-4.6` | `deepseek-v4-pro` | Razonamiento complejo (ya era Opus) |
| Tech Lead       | Arq. cross-proyecto  | `claude-sonnet-4-6` | `claude-sonnet-4.6` | `deepseek-v4-pro` | Análisis cross-proyecto         |
| Product Manager | Requisitos           | `claude-sonnet-4-6` | `claude-sonnet-4.6` | `deepseek-v4-pro` | Desglose de épicos              |
| Programmer      | Implementación       | `claude-sonnet-4-6` | `claude-sonnet-4.6` | `deepseek-v4-pro` | Código Laravel complejo         |
| QA              | Tests/validación     | `claude-sonnet-4-6` | `claude-sonnet-4.6` | `deepseek-v4-pro` | OWASP + edge cases profesionales |
| Style Reviewer  | Estilo + Pint        | `claude-haiku-4-5` | `claude-haiku-4.5`  | `minimax-m2.5`    | Tareas mecánicas                |
| Becario         | Tareas simples       | `claude-haiku-4-5` | `claude-haiku-4.5`  | `minimax-m2.5`    | Tareas triviales                |

---

## Lógica de distribución de cuota GO

### Hub Familiar
```
deepseek-v4-pro   → Comandante, Capitán, Soldado
deepseek-v4-flash → Ingeniero
minimax-m2.5      → Enfermero, Cocinero, Periodista
qwen3.6-plus      → Traductor
```

### Hub Profesional
```
deepseek-v4-pro   → Boss, Architect, Tech Lead, PM, Programmer, QA
minimax-m2.5      → Style Reviewer, Becario
```

---

## Implementación por herramienta

### OpenCode GO

Cada agente tiene `model:` en el frontmatter de `~/.config/opencode/agents/{agente}.md`.
El formato es `opencode-go/{modelo-id}`.

### Claude API

Guía de referencia en `.claude/CLAUDE.md` (familiar) y `~/hub-agentes/CLAUDE.md` (profesional).
El usuario selecciona manualmente el modelo con `/model` según el rol a ejercer.

### Copilot CLI

Guía de referencia en `.github/copilot-instructions.md`.
El usuario selecciona manualmente el modelo en la UI según el rol.

---

## Archivos modificados

### Hub Familiar (8 agentes)
| Archivo | Cambio |
|---------|--------|
| `~/.config/opencode/agents/comandante.md` | `model:` + tabla multi-proveedor |
| `~/.config/opencode/agents/capitan.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/soldado.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/ingeniero.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/enfermero.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/cocinero.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/periodista.md` | Nuevo agente |
| `~/.config/opencode/agents/traductor.md` | Nuevo agente |

### Hub Profesional (8 agentes)
| Archivo | Cambio |
|---------|--------|
| `~/.config/opencode/agents/boss.md` | `model:` + tabla multi-proveedor |
| `~/.config/opencode/agents/architect.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/tech-lead.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/product-manager.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/programmer.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/qa.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/style-reviewer.md` | `model:` + anotación modelos |
| `~/.config/opencode/agents/becario.md` | `model:` + anotación modelos |

### Documentación
| Archivo | Cambio |
|---------|--------|
| `.hub/plan-go.md` | Este documento |
