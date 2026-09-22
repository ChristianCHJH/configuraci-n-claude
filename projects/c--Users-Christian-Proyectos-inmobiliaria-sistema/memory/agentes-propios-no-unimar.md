---
name: agentes-propios-no-unimar
description: "inmobiliaria-sistema no hereda el roster de agentes de Unimar (Winston, Amelia, Mary, BMAD) — construye el suyo propio."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b380178e-4661-4d5c-9656-89117f44800d
  modified: 2026-08-16T05:54:29.344Z
---

En **inmobiliaria-sistema**, nunca reusar ni nombrar los agentes BMAD de
Unimar (Winston/arquitecto, Amelia/dev, Mary/analista, Sally/UX, John/PM,
Paige/tech-writer) ni el roster de `unimar_tms`. Este proyecto es
independiente y construye sus propios subagentes desde cero.

**Por qué:** el usuario lo corrigió explícitamente el 2026-08-16 al verlo
mencionado — el "arquitecto" de este proyecto son los ADR propios
(`docs/adr/`) escritos por Christian Jara y David Barrios, no una persona
BMAD prestada de otro proyecto.

**Cómo aplicar:** cualquier subagente nuevo para inmobiliaria-sistema
(`.claude/agents/*.md`) se nombra por su función técnica
(`constructor-backend`, `validador`, etc.), nunca con nombres de persona.
Ver [[validador-skill-inmobiliaria]] para el mecanismo de cumplimiento de
reglas ya construido en este repo.
