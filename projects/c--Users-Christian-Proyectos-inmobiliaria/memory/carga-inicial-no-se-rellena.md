---
name: carga-inicial-no-se-rellena
description: "en la carga inicial de clientes no se sacan fecha de nacimiento ni asesor, y el teléfono vacío se acepta; se regulariza después."
metadata: 
  node_type: memory
  type: project
  originSessionId: c7216b42-19fa-4927-a312-31206dbf5e6d
  modified: 2026-09-17T02:25:48.946Z
---

Decisión del usuario, 16 set 2026, para la carga inicial de clientes a producción:

- Fecha de nacimiento: no se saca del DNI escaneado (aunque la zona MRZ la trae para ~280 clientes). Queda en null.
- Teléfono: los clientes sin teléfono se cargan igual (226 en local). No se bloquea.
- Asesor: no se carga. En los Excel es texto libre, y el asesor se ata al cliente cuando se crea en el sistema.

**Why:** son datos que el negocio regulariza después; la carga no debe inventarlos ni atarlos por parecido.

**How to apply:** no volver a proponer estos tres rellenos en la carga. Relacionado: [[dni-se-ata-por-ocr-no-por-carpeta]], [[nada-de-reglas-de-negocio-inventadas]].
