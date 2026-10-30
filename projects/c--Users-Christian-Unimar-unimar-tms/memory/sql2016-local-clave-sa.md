---
name: sql2016-local-clave-sa
description: "Clave de sa del SQL Server 2016 local (instancia SQL2016, puerto 14330) para las pruebas de integración del TMS"
metadata:
  node_type: memory
  type: reference
  originSessionId: 91dfba41-d579-4541-9de7-88a3fe35378e
  modified: 2026-10-28T18:38:28.210Z
---

SQL Server 2016 nativo en Windows: servicio `MSSQL$SQL2016`, `localhost,14330`, modo mixto.

- Usuario `sa`, clave `Tms2016Local!2243` (restablecida el 2026-10-28 a pedido de Christian; es solo de pruebas).
- Si se pierde: `sqlcmd -S "localhost,14330" -E` entra con Windows (Christian es sysadmin) y `ALTER LOGIN sa WITH PASSWORD = N'…', CHECK_POLICY = OFF`.
- Uso: `cd src/apps/api && DB_HOST=localhost DB_PUERTO=14330 DB_USUARIO=sa DB_CLAVE='Tms2016Local!2243' npm run test:integracion`.

Relacionado: [[tms-sql-server-2016]].
