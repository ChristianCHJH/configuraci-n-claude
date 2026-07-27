---
name: project-staging-supabase
description: BDs del proyecto en Supabase — dev (test-inventario-ventas) y prod (inventario-ventas); la BD local Docker ya NO se usa
metadata: 
  node_type: memory
  type: project
  originSessionId: 3ebbe74e-cdc5-457c-95e2-80187e386646
---

**La BD local de Docker (`venta_inventario` / schema `public`) quedó DESCARTADA (2026-07-06) — no volver a usarla ni aplicarle migraciones.** El desarrollo prioriza la BD **dev en Supabase** (`test-inventario-ventas`). Todas las BDs viven en **Supabase** (proyecto `gmrpkbxlwrlvotnsmyzb`, PG 17.6).

- Conexión vía **Session pooler** (`aws-1-sa-east-1.pooler.supabase.com:5432`, user `postgres.gmrpkbxlwrlvotnsmyzb`, db `postgres`), **NO** la conexión directa (esa es IPv6-only y falla desde contenedores Docker). Requiere `DB_SSL=true`.
- Producción usa el schema **`inventario-ventas`**; dev/staging usa **`test-inventario-ventas`** (mismo proyecto, distinto schema). El backend soporta schema con guion porque Sequelize lo entrecomilla.
- Config real vive en `.env` de la raíz (gitignoreado). `docker-compose.dev.yml` interpola `${DB_HOST:-...}` etc. con fallback a la BD local (`host.docker.internal` / `venta_inventario`). Para volver a local: borrar/comentar el `.env` y recrear el contenedor backend.
- Se agregó `DB_SSL` al compose; el código ya lo leía en [modulo-aplicacion.ts](backend/src/modulo-aplicacion.ts).

**Clonar prod → test schema** (estructura + datos), sin pg tools locales, usando contenedor `postgres:17-alpine`:
`pg_dump --schema=inventario-ventas --no-owner --no-privileges` → `sed 's/"inventario-ventas"/"test-inventario-ventas"/g'` → `psql`. El rename por forma entrecomillada es seguro porque los datos en `COPY` van sin comillas.
