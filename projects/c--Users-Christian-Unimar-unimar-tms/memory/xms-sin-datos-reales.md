---
name: xms-sin-datos-reales
description: En unimar-xms (sap-mdm) no hay filas que importen en ninguna xms-db; se puede retirar valores del CHECK con migración
metadata:
  node_type: memory
  type: project
  originSessionId: 92dc25cf-56e4-4128-b924-56c9435ca842
  modified: 2026-10-14T16:06:10.279Z
---

Christian confirmó el 2026-10-14 que en ninguna `xms-db` (QAS, SEIDOR) hay filas que importen de `TR_INTEGRACION_SAP_MDM`: todo es de prueba. Con eso se retiraron los cinco `TipoMaestra` viejos, `OperacionMaestro.Baja` y `EnProceso` del CHECK (migración `RetirarValoresSinUso`).

**Why:** sap-mdm todavía no salió a producción; una base de prueba con filas viejas se blanquea antes de migrar.

**How to apply:** un cambio de esquema en XMS sap-mdm no necesita mover datos ni cuidar filas históricas, igual que en el TMS ([[tms-sin-datos-reales]]). Volver a preguntar cuando sap-mdm ya esté desplegado en producción.
