---
name: sdlc-phase-governance
description: Gobernanza estricta de fases SDLC en unimar_tms — no avanzar sin cierre de fase anterior
metadata: 
  node_type: memory
  type: project
  originSessionId: e0df2d8c-272d-4d4a-b6eb-50a71e0c12ed
---

## Gobernanza SDLC Estricta — unimar_tms

**Regla crítica:** El proyecto debe avanzar en fases SDLC del estándar unimar_arch. NO se puede pasar a fase siguiente sin completar y documentar la anterior.

### Fases del MVP (Q3 2026)

1. **Fase 0 — Concepción (2026-06-23 a 2026-06-25)**
   - Artefactos: PRD, ADRs
   - Cierre: ☑ PRD aprobado + CA-01 a CA-19 completados
   - Guardian: `/unimar-tms validate phase-0`

2. **Fase 1 — Diseño & Arquitectura (2026-06-26 a 2026-07-07)**
   - Artefactos: Modelos datos, Contratos integración, DESIGN.md, Diagramas
   - Cierre: ☑ BD schema + Figma + Contratos SAP/DPWORLD firmados
   - Guardian: `/unimar-tms validate phase-1`

3. **Fase 2 — Implementación (2026-07-08 a 2026-07-28)**
   - Artefactos: Código backend, código frontend, tests unitarios
   - Cierre: ☑ F-01 a F-07 implementadas, tests en verde
   - Guardian: `/unimar-tms validate phase-2`

4. **Fase 3 — Testing & QA (2026-07-29 a 2026-08-11)**
   - Artefactos: Tests E2E, reportes de cobertura, bugs reportados
   - Cierre: ☑ Coverage > 80%, bugs críticos = 0, no blockers
   - Guardian: `/unimar-tms validate phase-3`

5. **Fase 4 — Despliegue & Cierre (2026-08-12 a 2026-08-25)**
   - Artefactos: Guía despliegue, release notes, capacitación
   - Cierre: ☑ MVP en prod, usuarios capacitados
   - Guardian: `/unimar-tms validate phase-4`

### Validación de Cierre

**Cada fase debe tener:**
- [ ] Documentación completa en `_bmad-output/`
- [ ] Memoria actualizada (este archivo)
- [ ] PHASE_TRACKING.md con fecha/responsable/evidencia
- [ ] Revisión de criterios de aceptación (CA-*)
- [ ] Aprobación de responsable (PM, Arquitecto, QA Lead, según fase)

**Bloqueo:** Si algo está pending ☐, skill `/unimar-tms` rechaza avance a fase siguiente.

### Criterios de Cierre por Fase

| Fase | Criterio Must | Evidencia |
|:-----|:--------------|:----------|
| **Fase 0** | PRD aprobado negocio + arquitecto | Email/Slack approval screenshot |
| **Fase 1** | Schema BD + Contratos integración firmados | `plan-avance-mvp-fase1.es.md` + archivos .sql/.yaml |
| **Fase 2** | F-01 a F-07 en main, tests en verde | `git log` + CI/CD report |
| **Fase 3** | Coverage > 80%, cero blockers | SonarQube/Jest report |
| **Fase 4** | MVP en producción | Monitoring dashboard activo |

**Why:** Unimar_arch (S-01) exige gobernanza de ciclo; el usuario necesita bloqueos automáticos.

**How to apply:** 
- Antes de pasar a siguiente fase, ejecutar `/unimar-tms validate <fase>`
- Skill revisa PHASE_TRACKING.md + memoria + documentación
- Si hay pending ☐, bloquea y lista qué falta
