---
name: guia-tipo-documento-sap
description: "la guía de remisión manda a XMS/SAP el `codigo` SAP del tipo de documento (DNI = 3), no el SUNAT; hotfix en PRs #167 (main) y #168 (develop)"
metadata:
  node_type: memory
  type: project
  originSessionId: df88ec2e-088d-4e74-8ae4-24f5dcd74030
  modified: 2026-10-27T22:47:58.776Z
---

`conductor.tipoDocumento` del pedido de guía va a `ZZDOCID` de SAP, que espera el `codigo` del maestro `tipo_documento_identidad` (DNI = "3", el mismo `codigoTipoDocumento` que SAP manda), **no** `codigo_sunat` ("1"). Christian lo confirmó el 2026-10-27 tras el rechazo 2571 de SUNAT en PRD.

**Why:** con el código SUNAT, SAP creaba la entrega y Efac rechazaba la guía; ninguna guía salía en PRD.

**How to apply:** no volver a leer `codigo_sunat` para la guía. Hotfix: migración `1795824000000-PublicarCodigoSapDelTipoDeDocumentoDelConductor` (vista publica `tipo_documento_sap`), PRs unimar-tms-gr #167 → main y #168 → develop. Sin probar la integración contra el 2016 local al abrirlos.
