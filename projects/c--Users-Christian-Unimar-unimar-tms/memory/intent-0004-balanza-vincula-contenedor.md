---
name: intent-0004-balanza-vincula-contenedor
description: "Intent 0004 (balanza de SAP vincula el contenedor): en develop desde el 2026-10-29 (TMS PR #176, XMS PR #95); probado de punta a punta en local"
metadata:
  node_type: memory
  type: project
  originSessionId: dc17462d-992a-4917-bbbb-fff8a10803fb
  modified: 2026-10-29T17:24:30.906Z
---

Estado al 2026-10-29: fusionado en develop (TMS PR #176; XMS PR #95, con su registro en `unimar-xms/intent/0002-balanza-vincula-contenedor/`). Probado de punta a punta en local, con SAP simulado por SOAP → XMS → TMS. Los desvíos de la construcción están en `plan.md` del TMS. Pendiente: desplegar XMS antes o junto al TMS.

`POST /entrega-tms/sincronizar` de XMS no respeta la espera entre reintentos: llamarlo seguido gasta los 10 intentos en minutos. `gh pr create` está bloqueado por `deny`: los PR los crea Christian.

Decisiones que no se reabren: solo contenedor (nunca carga suelta); se revisa la sede (cambia lo del 19-10); sin guía ni SICNI; si la web ya cerró el viaje con «Balanza DT», el aviso posterior no lo completa; SAP no lee la respuesta, XMS guarda `contenedorVinculado` (columna nueva en `TR_INTEGRACION_SAP_MDM`); XMS no reintenta los 409 nuevos y sí reintenta `BALANZA_SIN_CARGA`; los mensajes no llevan el DNI.

Fallas que ya estaban en develop y no son de este cambio: TMS `almacen-de-archivos.sistema-archivos.spec.ts` (2) y XMS `FalloDePersistenciaPruebas` TRUNCADO 2628 contra el 2016 (la CI de XMS usa 2022).

**Why:** Christian trabaja cada requerimiento con el flujo intent → spec → plan → construir, y el cierre actualiza `intent/SISTEMA.md` en TMS y en XMS.

**How to apply:** desplegar XMS antes o junto al TMS. En XMS la copia local está en CRLF por `core.autocrlf`, pero `.editorconfig` pide LF: formatear solo los archivos propios con CSharpier, nunca todo `src`. Ver [[commits-unimar-tms]] y [[tms-sql-server-2016]].
