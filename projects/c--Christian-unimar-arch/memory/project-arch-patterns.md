---
name: project-arch-patterns
description: Patrones arquitectónicos core y principios de la Suite UNIMAR
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f6ac401-a018-46a7-a2f7-262dc126db53
---

**Patrones mandatorios:**
- Hexagonal Architecture (Ports & Adapters) — todos los backends
- Monolito Modular como punto de partida; microservicios requieren ADR-0045
- DDD (bounded contexts, lenguaje ubicuo, tactical patterns)
- Event-Driven con Transactional Outbox (publicación confiable)

**Multi-tenancy:** Single-enterprise, multi-branch
- Filtrado por branch en capa aplicación (primario)
- RLS PostgreSQL como failsafe (ADR-0010)
- Feature flags centralizados en UMS (ADR-0060)

**65+ ADRs organizados por:**
- Core/agnóstico: 42 ADRs (infraestructura, seguridad, integración, datos)
- Node.js-specific: 13 ADRs
- .NET-specific: 3 ADRs
- Android-specific: 1 ADR

**Principios fundamentales (7 niveles jerárquicos):**
1. Suite before product
2. Domain-first (zero deps en capa dominio)
3. Strict modularity
4. Evidence-driven evolution (extracción a microservicios requiere evidencia métrica)
5. Explicit contracts (OpenAPI/Protobuf/AsyncAPI versionados)
6. Security by design
7. Observability mandatory

**SDLC 5 fases:** Concepción → Diseño → Construcción → Validación → Entrega
- Cada fase tiene quality gates explícitos y artefactos requeridos
- Trazabilidad: PRD → FS → US → TS → ADR → PR → TSR → RN

**Why:** Architecture Board define estándares; productos deben conformar o crear ADR override.
**How to apply:** Toda decisión técnica debe alinearse o documentar la desviación con un ADR.
