---
name: project-overview
description: "Qué es unimar_arch, propósito, empresa, dominio de negocio y estructura del repo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f6ac401-a018-46a7-a2f7-262dc126db53
---

**unimar_arch** es el repositorio de arquitectura corporativa de Unimar S.A. — operadora de almacenes portuarios y logística de contenedores en Perú (fundada 1978, RUC 20100412447).

**Por qué existe:** Define el estándar normativo para la Suite UNIMAR — sistema integrado de operaciones logísticas que reemplaza sistemas legados fragmentados (SAP, GRE, OSE). No contiene código de producción; es documentación-first.

**Qué contiene:**
- 65+ ADRs (Architecture Decision Records) para todos los runtimes
- Framework SDLC en 5 fases con quality gates explícitos
- 12 Canonical Patterns (CP-01 a CP-12) por runtime
- Stacks tecnológicos autorizados: Node.js, .NET, Android
- Gobernanza: glosario controlado, trazabilidad PRD→ADR→PR→TSR
- Integracion BMAD Method v6.8.0 (59+ agent skills para planificación)

**Dominio:**
- Ciclo de vida de contenedores (ingreso → almacenamiento → exportación)
- Multi-sucursal con aislamiento estricto de datos por sucursal
- Compliance regulatorio: SUNAT, GRE, DIAN, OSE

**Versión:** 0.1.0 (en desarrollo activo)
**Idioma oficial:** Español (regla dura, zero inglés en docs)
**Licencia:** MIT

**How to apply:** Frame todas las discusiones en términos de Suite UNIMAR como producto enterprise de logística portuaria, no SaaS genérico.
