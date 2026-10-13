---
name: tms-balanza-dt-cierre-viaje
description: Cierre del viaje de importación = pesaje en balanza DT (SAP → MDM → TMS, POST /balanza-deposito/aviso); INGRESO_DT se deduce hasta integrar el portal de accesos
metadata: 
  node_type: memory
  type: project
  originSessionId: 470f7a26-5b50-43ef-ab53-6c74011825d7
  modified: 2026-09-16T15:17:01.637Z
---

Decisión de Christian (2026-09-16): el último checkpoint de importación, el que da el viaje por culminado, es `BALANZA_DT`, avisado por SAP vía MDM (SAP→MDM por SOAP, MDM→TMS por REST). El MDM NO es XMS: XMS es otra cosa (lo corrigió Christian). El aviso trae solo número de BL + placa del tracto.

El portal de control de accesos existe pero NO se integra todavía (del lado de ellos también es desarrollo). Mientras tanto `INGRESO_DT` no tiene escritor propio: se da por hecho con la misma fecha que `BALANZA_DT` (marca deducida). Cuando se integre accesos, ese sistema escribirá `INGRESO_DT`.

Alcance cerrado: la integración SOLO marca el hito. No guarda datos del pesaje (ni peso, ni ticket, ni hora de SAP); no proponer más campos ni contratos extra.

Diagrama en Miro: https://miro.com/app/board/uXjVHmRSgf8=/

**Why:** hoy no hay forma de validar la llegada al DT; la balanza es lo más cercano dentro del depósito.

**How to apply:** implementado el 2026-09-16 en `POST /balanza-deposito/aviso` (AvisoDeBalanzaController, clave `MDM_CLAVE_API`, fuente `SAP`, usuario `mdm`, `INGRESO_DT` con `marca_inferida = 1`). Relacionado con G-120 en GAPS.md y [[feedback-sin-parches-arquitectura]].
