---
name: guia-remision-tms-xms
description: "La guía de remisión la pide el conductor desde la app UNITRANS o Transporte desde la bandeja web; el TMS la pide a XMS (SAP-TMS-GR) por HTTP, sin emisor simulado"
metadata:
  node_type: memory
  type: project
  originSessionId: e74d155a-a070-45a3-83a9-3a33990bb31d
  modified: 2026-09-15T15:23:15.830Z
---

La guía de remisión remitente se pide **desde la app UNITRANS** (`POST unitrans/viajes/{id}/guia-remision`, vía `APP`) y, desde el 2026-09-15, también **desde la bandeja «Citas de transporte»** (`POST planificacion/servicios/{id}/guia-remision`, vía `WEB`, a nombre del conductor que aceptó el viaje). El TMS la pide a XMS (repo `unimar-xms`, rama `feat/sap-tms-gr-rfc`) en `POST {GUIA_REMISION_URL}/documentos-entrega`, y XMS llama a SAP por RFC (`ZMMF_CREA_ENTREGA_TMS`). El emisor simulado del TMS se eliminó el 2026-09-14.

**Why:** el 2026-09-14 Christian pidió "la generación es desde la app, no lo olvides; eliminemos el mock e integrémonos". El 2026-09-15 pidió además un botón en la bandeja web para generarla y ver su estado, que es la contingencia RN-55 del PRD (Transporte desde la web). XMS es dueño del contrato: el 202 trae `idIntercambio`, `numeroEntrega` y `estado`, y el TMS se alinea.

**How to apply:** no reintroducir un emisor `simulado`. En local XMS corre nativo en Windows con `unimar-xms/src/levantar-xms-sap.ps1`, porque SAP NCo solo existe para Windows x64; muere al cerrar la sesión que lo lanzó o al reiniciar la PC. Necesita FortiClient VPN y SAP QAS encendido (de noche no respondió: `partner 10.30.20.5:3300 not reached`); `--sap-ping` prueba la conexión sin crear nada. Usa la BD `xms-db-dev` en el puerto 1434. SAP exige la placa con guion (`A0T-874`). Cada pedido que llega a SAP crea un documento real en QAS: no repetir por costumbre. XMS todavía no manda el aviso de vuelta, así que la guía queda EN_PROCESO. Ver [[quitar-del-front-limpia-el-back]].
