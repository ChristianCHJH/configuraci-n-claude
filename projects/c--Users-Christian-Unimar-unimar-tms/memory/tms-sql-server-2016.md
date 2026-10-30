---
name: tms-sql-server-2016
description: "Producción y UAT del TMS corren SQL Server 2016 (13.x); nada de T-SQL 2017+ (STRING_AGG, TRIM, CONCAT_WS, _UTF8…)"
metadata:
  node_type: memory
  type: project
  originSessionId: 05cb1f6d-329a-42bb-829b-0e0c38bfbd23
  modified: 2026-10-14T17:11:41.644Z
---

Desde 2026-10-14 el motor objetivo del TMS es **SQL Server 2016** en producción y también en UAT (antes UAT era 2019). Donde CLAUDE.md o ADR-TMS-007 decían «SQL Server 16» se refería a 2022 (versión interna 16), no a 2016.

**Why:** el servidor de producción que da TI es 2016 (`10.1.20.153`, 13.0). Cambiar el nivel de compatibilidad no basta: las funciones 2017+ existen o no según el motor.

**How to apply:**
- No usar STRING_AGG, TRIM, CONCAT_WS, TRANSLATE, GREATEST/LEAST, DATETRUNC, GENERATE_SERIES, IS DISTINCT FROM, intercalaciones `_UTF8`, `OPTIMIZE_FOR_SEQUENTIAL_KEY`.
- Docker dev sigue en 2019 (2016 no tiene imagen Linux); la prueba real es un SQL Server 2016 SP3 Developer instalado en Windows en la laptop de Christian.
- Instancia local: `localhost,14330` (instancia `SQL2016`, sa / `Unimar.Tms#2026`). Integración contra ella: `DB_HOST=localhost DB_PUERTO=14330 DB_USUARIO=sa DB_CLAVE=... npx jest --config jest.integracion.config.js`.
- `EsquemaInicial` corre en 2016 sin cambios. La guardia `compatibilidad-sql-server-2016.spec.ts` (carril unitario) atrapa T-SQL 2017+. Decisión en ADR-TMS-029.
- Al 2026-10-14: 87 suites / 577 pruebas de integración verdes en 2016 (cubren los 364 puntos SQL).
