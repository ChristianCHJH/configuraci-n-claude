---
name: rama-main-directo
description: movilidad_escolar no tiene develop; Christian acepta commit y push directo a main cuando la rama del PR ya se borró
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb2df193-4ea6-40e6-bc45-41de6c757fd6
  modified: 2026-10-08T23:41:10.508Z
---

En movilidad_escolar solo existe `main` (no hay `develop`). Cuando la rama del PR ya se fusionó y se borró, y queda un commit suelto (ej. el cambio de versión tras subir a Play), Christian pide subirlo **directo a main** sin PR.

**Why:** dijo "estamos en movilidad escolar… de frente el commit a main, de frente push a main" (2026-10-08). La regla de christian-commit de no commitear en main aplica a otros repos (unimar, con develop).

**How to apply:** en este repo, si el usuario pide subir a "develop", es main. Push a main dispara el despliegue del backend (workflow desplegar-prueba-estres). Relacionado: [[play-store-subida]].
