---
name: us-tms-043-artifact-enlazado
description: US-TMS-043 (contrato SAP) tiene vista publicada en artifact 7Um5xQyz11yBwcFEndhGDA; toda edición de la historia se replica ahí
metadata:
  node_type: memory
  type: project
  originSessionId: 7a4dfded-567d-440b-b260-b46f291d6942
  modified: 2026-09-23T22:56:07.153Z
---

La historia `docs/01-concepcion/stories/us-tms-043-contrato-integracion-sap.es.md` enlaza el artifact https://claude.ai/artifact/7Um5xQyz11yBwcFEndhGDA (contrato SOAP de maestros xms-sap-mdm). Pedido de Christian el 2026-09-23.

**Why:** Christian comparte el artifact con SAP; si la historia cambia y el artifact no, SAP trabaja con un pedido viejo.

**How to apply:** al tocar la US-TMS-043, leer el artifact (`Artifact read`), aplicar el mismo cambio, subir la versión en el chip y republicar con `url`. Los campos que SAP no tiene se muestran tachados, no se borran. Cambios de «la maestra» = solo historia + artifact; el backend no se toca salvo que lo pida.
