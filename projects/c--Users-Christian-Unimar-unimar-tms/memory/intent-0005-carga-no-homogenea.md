---
name: intent-0005-carga-no-homogenea
description: "Carga no homogénea (varios equipos del mismo BL por viaje en «Planificar carga suelta»); 3 commits subidos a feat/carga-no-homogenea 2026-10-29, falta PR a develop"
metadata:
  node_type: memory
  type: project
  originSessionId: e5d9cd8b-4be0-4128-9e3c-154fa02ccfe9
  modified: 2026-10-29T21:39:31.592Z
---

Cambio `intent/0005-carga-no-homogenea/` en unimar_tms (flujo /spiderman-sdlc). «Carga no homogénea» es término de la operación, no existe en SAP ni en la RD: un viaje trae bultos/kg de varios equipos del mismo BL.

Estado 2026-10-29: intent (13 decisiones) y spec (REQ-01..14) aprobados. plan.md escrito (8 pasos, sección «Decisiones del 2026-10-29 al revisar el plan»); plan APROBADO por Christian el 2026-10-29 («arranca»), incluido lo deducido de la decisión 10 (autorización solo carga suelta: rechazar contenedor en Asignar/Agregar/alta en lote/Editar/declaración app-portal; balanza excluye viajes de autorización). Rama `feat/carga-no-homogenea` creada desde develop al día; la carpeta intent/0005 está sin commit. Construidos (sin commit) los pasos 1-7: API (3420 unidad OK), web (1249 OK), integración 2016 (669 OK; bug de carrera anulación vs planificador arreglado con relectura). Ya fallaban en develop: 2 de almacen-de-archivos (Windows `\`), repositorio-naves-viaje integración, verificar-bundle.mjs (ruta Windows + TMS_OPERACION), 9 archivos de format:revisar en web, 23 de fronteras. E2E con Playwright hecha (7 casos OK; hallazgos corregidos: equipos en Ejecución, plurales, botón bloqueado tras 4xx). SISTEMA.md actualizado. US-TMS-045 y plan de pruebas NO se tocan (históricos; el plan de pruebas lo genera generar-entregables.mjs). Verificación final verde. Christian lo probó en Docker con RD_CARGA_NO_HOMOGENEA_HEROIC_LEADER.xlsx; se arreglaron: BL quitado suelta su equipo, × y «Añadir equipo» por viaje, dos barras (bultos y kg). Commits ca862c7b (docs), 82554f13 (api), df3f3ece (web) con push a origin/feat/carga-no-homogenea el 2026-10-29. Después: rediseño opción A (modal 1400 px, tres columnas, riel con avance y «Ya en esta autorización»), lápiz amarillo con ×, lista abierta hasta «Listo», BL automático; commits 05cf06bf (web) y 2f89694a (plan) con push el 2026-10-29. Falta: PR a develop (Christian lo abre; descripción en scratchpad pr-0005-carga-no-homogenea.md) y 4 observaciones visuales sin decidir (columna CONTENEDOR en Ejecución, botón deshabilitado sin explicación, viaje cortado en «Ya en esta autorización», ESTADO cortado a 1600 px).

Decisiones clave: mismo modal con sub-filas por equipo; con varios equipos cada equipo del viaje exige bultos Y kg; reparto parcial permitido; una autorización = un BL en TODOS los caminos, incluido «Asignar viaje» (Christian lo corrigió: no dejarlo fuera); una autorización es solo de carga suelta; bandeja y seguimiento muestran todos los equipos; app UNITRANS fuera (US-TMS-045); contrato sin compatibilidad; tope técnico 50 equipos; XMS no cambia (el XML de la guía no pide la carga).

**Why:** la BD ya es N:M (`planificacion_servicio_viaje_carga` con bultos/peso por par), sin migración; lo que impedía era el modal y la API con un solo `idCarga`.
**How to apply:** al retomar, leer intent.md/spec.md/plan.md de esa carpeta y seguir en la fase pendiente. Christian lee desde Control remoto: mandar documentos con SendUserFile.
