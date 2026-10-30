---
name: artefacto-auditoria-quitar-corregidos
description: "Al corregir un hallazgo de una auditoría publicada como artefacto, quitarlo del artefacto en cuanto se termina, sin preguntar"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 92dc25cf-56e4-4128-b924-56c9435ca842
  modified: 2026-10-14T15:41:22.593Z
---

Cada vez que termino de corregir (y commitear) un hallazgo de una auditoría que vive en un artefacto, lo quito del artefacto y lo republico en la misma URL, sin preguntar.

**Why:** Christian usa el artefacto como lista viva de pendientes; lo pidió explícitamente el 2026-10-14 tras corregir los #2 y #5 de la auditoría de XMS `feat/xms-sap-mdm` (https://claude.ai/artifact/3m6bsx1NLRuSjukm9SgbRj).

**How to apply:** tras el commit de cada corrección, editar el HTML del artefacto (quitar la entrada del hallazgo), republicar con la misma `url` y avisarlo en una línea. Relacionado: [[remediar-auditorias]].
