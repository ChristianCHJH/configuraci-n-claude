---
name: tms-sin-datos-reales
description: TMS sin datos reales en ningún entorno; la BD se blanqueará antes de QA/producción y las migraciones no deben mover datos
metadata:
  node_type: memory
  type: project
  originSessionId: 499f5836-2726-4a7b-b87f-755f23708c1c
  modified: 2026-10-13T22:25:07.022Z
---

Al 2026-10-13 todo lo que hay en las bases del TMS (dev, UAT) es data de prueba: nada está en QA ni en producción. Christian blanqueará la base antes de salir, así que no hay datos que conservar.

**Why:** Christian lo dijo al revisar la observación de la migración `MoverFlotaAlModeloDeSap`, que perdía vínculos de vehículos: «no debería haber migraciones con data».

**How to apply:** una observación que pida preservar datos existentes al migrar no aplica; las migraciones deben cambiar esquema, no mover filas. Antes de quitar el movimiento de datos de migraciones ya escritas, confirmarlo con Christian (cambia sus huellas). Relacionado: [[candado-sap-maestras]].

**Plan (2026-10-13):** la limpieza va en la **siguiente rama**, no en `feature/seguimiento-viaje-rediseno`: quitar el movimiento de datos de las migraciones, decidir si los catálogos sembrados (checkpoints, tipos de documento) pasan a una semilla aparte, y actualizar huellas y la prueba `migraciones-que-mueven-datos`. **Decidido:** la base nueva nace vacía salvo los catálogos de configuración (compañía/sucursal/unidad DT, checkpoints, clasificación de carga, tipo de programación, motivos de rechazo, tipo de documento de servicio, parámetro de sede), que se quedan en las migraciones. Lo único que sale es la siembra de `instalacion_portuaria` (DPW/APM) de `1788566400000-AgregarInstalacionPortuaria`: maestra de SAP; las pruebas de integración la siembran en `base-real.ts`. Christian también planteó reemplazar toda la cadena por una migración inicial única (tablas, enums y catálogos de configuración, sin datos de prueba), porque la base de QA/prod aún no existe.
