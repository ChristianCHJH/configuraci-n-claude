---
name: temarios-aprendizaje-tms
description: "Tres artifacts con el temario de clases de 1 h (backend, frontend, móvil) para que Christian aprenda a leer el TMS; el avance vive en su db"
metadata:
  node_type: memory
  type: reference
  originSessionId: ee20d11d-18a2-4867-85e9-d41c46013c24
  modified: 2026-10-06T18:23:48.325Z
---

Christian estudia para poder leer cada archivo del TMS. Temarios publicados el 2026-10-06:

- Backend (BK-01..80, JS → TS → Node → Nest → TMS): https://claude.ai/artifact/KFU8VMnmMKrHLG4FYeK5CF
- Frontend (FE-01..58, base web → React → Angular): https://claude.ai/artifact/H2eria8osHLLy21NjPAvgr
- Móvil (MV-01..54, Kotlin → Android → Compose → UNITRANS): https://claude.ai/artifact/1yxs4jUHT2fwR5EeLHjETz

Uso: «revisa el artefacto, ve dónde nos quedamos y crea la clase» → `ArtifactData list` en `progreso` (doc = código de clase) y `extras`; la próxima es la primera sin `terminada: true`. «Actualiza el artefacto» → `set progreso/<código>` {terminada, fecha, resumen, pendientes}. El protocolo completo está dentro de cada página. Fuente local para republicar: generador en el scratchpad de la sesión ee20d11d (datos.js + plantilla.html); si ya no existe, se lee la página con `Artifact read` y se edita el JSON `#temario`.

Relacionado: [[teacher-ingles]] (la misma idea, para inglés).
