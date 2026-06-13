---
name: project-tech-stack
description: Stack tecnológico autorizado multi-runtime de la Suite UNIMAR
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f6ac401-a018-46a7-a2f7-262dc126db53
---

**Runtimes autorizados** (cada uno con su propio ADR stack):
- Node.js 20+ / TypeScript strict / NestJS 10 / TypeORM — APIs, BFF, web services
- .NET / C# — workloads enterprise, batch, ETL, integración legacy
- Android / Kotlin — operaciones de campo (offline-first)

**Bases de datos:**
- PostgreSQL — runtime Node.js (BIGINT IDENTITY PK obligatorio)
- Microsoft SQL Server — runtime .NET
- Redis — caché distribuido (ADR-0014)
- MinIO (S3-compatible) — object storage on-premise

**APIs & protocolos:**
- REST + OpenAPI v3 (default público/B2B)
- gRPC + Protocol Buffers (interno, alta frecuencia)
- GraphQL (solo BFF, nunca capa dominio)
- AsyncAPI + CloudEvents (async contracts)

**Observabilidad:** OpenTelemetry, Loki, Prometheus, Jaeger/Tempo

**Seguridad:** OIDC/OAuth2/SAML, RS256 JWT, HashiCorp Vault, Zero Trust mTLS (Fase 3+)

**Monorepo & CI:** Nx, GitHub Actions, markdownlint, CodeQL (SAST)

**Futuro:** Dapr para transición a microservicios

**Why:** Stack seleccionado por ADRs aprobados por Architecture Board; toda desviación requiere nuevo ADR.
**How to apply:** No sugerir tecnologías fuera de este stack sin mencionar que requieren un ADR.
