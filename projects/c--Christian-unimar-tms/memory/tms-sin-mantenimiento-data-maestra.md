---
name: tms-sin-mantenimiento-data-maestra
description: "El TMS no mantiene data maestra que viene de SAP (naves, viajes de nave, transportistas, vehículos, conductores, instalaciones); no se prueban ni se documentan como mantenimientos"
metadata:
  node_type: memory
  type: project
  originSessionId: ccb987e9-657d-49b7-98a6-9f9a55d9ee00
  modified: 2026-09-25T19:31:10.879Z
---

El TMS **no tiene mantenimiento de data maestra**: naves, viajes de nave, transportistas, vehículos rodantes, conductores e instalaciones portuarias vienen de SAP (por su API). Decisión de Christian, 2026-09-25.

**Why:** la fuente de verdad de esos maestros es SAP; en la web solo quedan listados de consulta.

**How to apply:** en planes de prueba, Excel de pruebas funcionales, historias y documentación, no incluir altas/ediciones/activar-desactivar de esas maestras; quitar sus pruebas. Tipos de descripción de carga sí es catálogo propio del TMS. Ver [[tms_prototipo_scope]].
