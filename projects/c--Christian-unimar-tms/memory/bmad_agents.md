---
name: bmad-agents
description: Roster de agentes BMAD con nombres propios — evita confusión nombre→librería en modelos pequeños
metadata: 
  node_type: memory
  type: project
  originSessionId: c993a4f3-88b9-4567-9689-2f6ebc46f52b
---

Usuario trabaja con BMAD Method framework. Los agentes tienen nombres propios. Cuando el usuario menciona un nombre de persona, primero verificar si es un agente BMAD.

| Nombre | Rol | Skill |
|--------|-----|-------|
| Mary | Business Analyst | `bmad-agent-analyst` |
| Paige | Technical Writer | `bmad-agent-tech-writer` |
| John | Product Manager | `bmad-agent-pm` |
| Sally | UX Designer | `bmad-agent-ux-designer` |
| Winston | System Architect | `bmad-agent-architect` |
| Amelia | Senior Software Engineer | `bmad-agent-dev` |

**Why:** Opus tenía esto en training; Sonnet no — sin este contexto Sonnet confunde "winston" con winston.js (librería npm).

**How to apply:** Cualquier referencia a estos nombres en contexto de desarrollo/arquitectura → activar skill correspondiente, no buscar librería.
