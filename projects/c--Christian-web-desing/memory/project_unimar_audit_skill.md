---
name: project-unimar-audit-skill
description: "Skill /unimar-audit creado para auditar el proyecto Unimar web contra SOLID, DDD, React patterns y convenciones del proyecto."
metadata: 
  node_type: memory
  type: project
  originSessionId: 7ce80979-98e9-4300-9106-fbf7911e4010
---

El proyecto tiene un skill custom `/unimar-audit` en `~/.claude/skills/unimar-audit/SKILL.md`.

**Modos:**
- `/unimar-audit` o `/unimar-audit scan` → analiza todo `src/`, genera `AUDIT_REPORT.md` en la raíz con hallazgos por criticidad (🔴 CRÍTICO, 🟠 ALTO, 🟡 MEDIO, 🔵 BAJO)
- `/unimar-audit validate` → checa solo archivos modificados (`git diff --name-only HEAD`) contra el mismo checklist

**Checklist cubre:**
- C1-C3: DDD layer boundaries (tinacms solo en tina.adapter.ts, domain sin imports externos)
- S1-S4: SOLID principles
- R1-R8: React patterns (atomic design, hooks rules, Zustand selectors, resolveImageUrl, no hardcode colores, tinaData ?? rawData, no any, no prop drilling)
- N1-N4: Nomenclatura y convenciones del proyecto

**Why:** El usuario quiere detectar errores arquitecturales antes de que se acumulen y validar cada cambio contra las buenas prácticas.

**How to apply:** Cuando el usuario haga un cambio significativo, sugerir correr `/unimar-audit validate`. Cuando pida revisión general, correr `/unimar-audit scan`.
