---
name: carga-usuarios-ums
description: "Padrón de usuarios TMS en UMS — archivos en Unimar/cargas-ums, cargador de unimar-ums, UMS Docker en 14331; probado en local el 2026-10-27, falta producción"
metadata:
  node_type: memory
  type: project
  originSessionId: 52e6fc66-7c38-4f81-a404-8fdf0bfd821f
  modified: 2026-10-27T19:30:22.221Z
---

Carga masiva de usuarios TMS a UMS (29 del Excel + Christian, sede Callao). Cargada en producción el 2026-10-27 desde la sesión «SERVIDOR PRD .16 API»: 30 de 30 accesos. mhernandez, lromero y avaldez se crearon sin nombre (su fila no traía `displayName`).

Contra producción el cargador dio 403. La sesión del servidor lo parchó en su copia y esos cambios aún no están en el repo de unimar-ums: login con `systemCode` 'UMS' (`UMS_SYSTEM_CODE`), un tarro con todas las cookies (`XSRF-TOKEN` pisaba `ums.session`), y la cabecera `X-CSRF-Token` en cada escritura tras un `GET /auth/me`.

- Archivos: `Unimar/cargas-ums/tms-suite-usuarios.json` (spec TMS vigente sin `sampleUsers` + `profiles`) y `usuarios-tms-callao.xlsx` (con contraseñas).
- Cargador: `unimar-ums/src/provisioning/cargar-en-ums.mjs --spec ... --crear-cuentas`, `UMS_PAUSA_MS=700`. Se le agregó `displayName` (sin commitear): UMS no permite poner el nombre después de crear la cuenta.
- Contraseña: `Unimar.{Usuario}.2026!` (parte del correo antes de @, primera en mayúscula). Una cuenta ya existente conserva la suya.
- UMS Docker: la base se publica en 14331 con un override, porque 14330 es el SQL Server 2016 nativo.
- Reejecutar con las plantillas ya publicadas da «2 fallos» y salida 1 (se descartan concesiones); es esperado, y las personas nuevas igual reciben su plantilla.

**Why:** evitar repetir el análisis y no confundir esos 2 fallos con un error real.
**How to apply:** antes de producción, correr `--dry-run` contra producción y confirmar que su UMS acepta `displayName`.
