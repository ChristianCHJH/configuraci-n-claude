---
name: candado-sap-maestras
description: Maestras del TMS solo las escribe SAP por API; la web no crea ni edita salvo usuario_ums y horas libres; la data maestra actual es de prueba y se borrará
metadata: 
  node_type: memory
  type: project
  originSessionId: 431a69b4-e211-49c0-b7c1-22fb3a2f2a48
  modified: 2026-09-18T21:47:26.985Z
---

Decidido por Christian el 2026-09-18 al revisar la brecha de [[contrato-api-maestras-sap]] (§9) y US-TMS-043:

- Candado fuerte: nave, nave_viaje, instalación portuaria, transportista, vehículo y conductor solo los crea/edita SAP vía XMS-MDM → TMS API. Se quitan los botones de crear/editar de la web.
- Excepción: la web sigue editando solo `conductor.usuario_ums` y `instalacion_portuaria.horas_libres_almacenaje` (SAP no los manda).
- Sin adopción por clave natural (§2 regla 10 fuera): clave natural repetida = 409 siempre.
- La data maestra actual es de prueba; se borra cuando lleguen los maestros de SAP. No planear conciliación.
- Ingesta Excel de RD: ya no crea nave ni nave_viaje. Busca por los datos planos; si encuentra, pone el id; si no, id en NULL y se sigue mostrando el texto que vino.
- `categoria_brevete`: texto en conductor, sin catálogo. `tipo_documento_identidad`: sí es tabla.
- `conductor.id_transportista` sí existe (un transportista tiene muchos conductores). Vehículo↔conductor 1:1, vehículo↔transportista N:1 (A.10/A.11). Conductor de empresa X en vehículo de empresa Y: se acepta.
- `vehiculo_rodante.tipo`: TRACTO | CARRETA por ahora.
- Cuando SAP crea un nave_viaje, el TMS vincula solo las RD que quedaron sin viaje con esa nave, viaje y manifiesto.
- Las rutas `/sap/` solo aceptan tokens de cuenta de servicio (`UserCategory.ServiceAccount`); una persona con `.manage` recibe 403. Sin permisos nuevos. El TMS lee el claim `user_category` = `ServiceAccount`, que UMS todavía no emite (nombre por acordar, G-117).
- Implementado el 2026-09-18 (TS-TMS-010): migraciones 1791936000000 a 1792195200000, rutas `/sap/` en flota y naves, web de mantenimientos en solo lectura. Probado contra SQL Server el mismo día. Vive en la rama `feature/maestras-sap` (5 commits, subida); `feature/unitrans-android` ya se fusionó a develop por squash (#122) y no recibe más commits.

**Why:** SAP es la única fuente del dato maestro; dos escritores pisaban cambios sin aviso.
**How to apply:** no proponer formularios de alta/edición de maestras ni lógica de conciliación; toda escritura de maestras entra por los endpoints `/sap/{codigo}`.
