---
name: project-architecture
description: "UMS full architecture — polyglot monorepo, .NET 10 Clean Architecture backend, React 18 Hexagonal frontend, 8 DDD bounded contexts"
metadata: 
  node_type: memory
  type: project
  originSessionId: ee19ae5c-a713-459c-a9b2-51e0a59701bb
---

## Stack

| Layer | Tech |
|-------|------|
| Backend | .NET 10, Minimal APIs + HotChocolate GraphQL |
| ORM | EF Core 10 + Npgsql (PostgreSQL 16 primary; SQL Server togglable) |
| CQRS | MediatR 12 — commands → REST, queries → GraphQL + REST |
| Messaging | MassTransit 8 + transactional outbox pattern |
| Frontend | React 18 + Vite 6 |
| State | Zustand 5 (app state) + TanStack Query 5 (server cache) |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 (NO PrimeNG — uses Lucide React icons only) |
| Validation | Zod 4 (frontend) + FluentValidation 12 (backend) |
| Monorepo | Nx 22 + npm Workspaces (frontend) + .NET SLN (backend) |

## Repo structure (top-level)

```
C:\Christian\ums
├── src/apps/ums.api/          ← .NET 10 backend
├── src/apps/ums.web-app/      ← React 18 frontend
├── src/libs/sdk/              ← Multi-language SDK libraries
├── src/Ums.ReadModels/        ← CQRS read projections
├── docs/                      ← 68 ADRs, DDD docs, governance (EN + ES)
├── infra/                     ← Terraform modules
├── tests/                     ← Integration + contract (Pact)
├── .github/workflows/         ← 8 CI/CD pipelines
├── docker-compose.yml         ← Postgres 16 + pgAdmin (port 5433)
└── .bmad-core/                ← BMAD-METHOD phase standards
```

No Git submodules — single repo, not split.

## Backend: Clean Architecture (4 layers)

```
Ums.Domain        ← Pure DDD aggregates, no NuGet deps
Ums.Application   ← Use cases, CQRS handlers, pipelines
Ums.Infrastructure← EF Core, repos, outbox, Redis, Polly
Ums.Presentation  ← Minimal API endpoints, GraphQL, middleware
```

### 8 Bounded contexts (DDD)
Identity, Authorization, Configuration, Audit, Approvals, IGA, Kernel, ReadModels

### Key patterns
- Result<T> pattern — no exceptions for flow control
- Outbox (transactional) + MassTransit dispatcher (5s poll, batch 50, 5 retries)
- Soft delete: `IsDeleted` + `DeletedAtUtc` + `DeletedBy` on all entities
- GDPR anonymization: SHA-256 deterministic on `UserAccountRecord`
- Multi-tenancy: EF Core `HasQueryFilter` (primary) + SQL RLS (failsafe)
- Idempotency: `Idempotency-Key` UUID header → `IdempotencyStore` with TTL
- ETag/optimistic concurrency: `byte[] RowVersion` on all aggregates
- Correlation ID: `X-Correlation-Id` → OTel activity + Serilog enrichment
- Dead-letter queue: outbox exhausted retries → `DeadLetterMessages` table

## Frontend: Clean Architecture (Hexagonal)

```
src/presentation/   ← Pages, views, components (React)
src/application/    ← Custom hooks, Zustand stores, services, i18n
src/domain/         ← Value objects, DTOs, domain models
src/infrastructure/ ← Axios HTTP client, API adapters
```

Feature areas: identity, authorization, configuration, audit, approvals + shared

## Observability
- OpenTelemetry distributed tracing
- Serilog → Grafana Loki
- SonarQube SAST in CI

## Important deviations
- NOT microservices — modular monolith with logical bounded contexts
- NOT Angular — frontend is React 18 (important: user's global CLAUDE.md assumes Angular; this project ignores those rules)
- No DESIGN.md / DESIGN.json present
- No API tier split despite CQRS (ADR-0059)
- Postgres/SQL Server both supported via infrastructure toggle

## Governance
- 68 ADRs in `docs/architecture/adrs/`, bilingual EN + ES
- BMAD-METHOD phases 00-05
- UMS is an Evolith satellite — inherits/overrides corporate baseline policies
- CI enforces bilingual sync, Markdown encoding, Mermaid diagrams

**Why:** UMS is a User Management System (identity + authorization platform) for the Unimar/Evolith ecosystem.
**How to apply:** When working on this project, use .NET 10 + EF Core patterns for backend and React 18 + Zustand + TanStack Query for frontend. Ignore Angular/PrimeNG global rules — they don't apply here.
