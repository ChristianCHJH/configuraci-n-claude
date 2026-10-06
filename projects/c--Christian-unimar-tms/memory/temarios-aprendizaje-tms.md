---
name: temarios-aprendizaje-tms
description: "Tres artifacts con el temario de clases de 1 h (backend, frontend, móvil); genéricos desde el 2026-10-06, sin rutas del TMS; el avance vive en su db"
metadata:
  node_type: memory
  type: reference
  originSessionId: 771137de-569c-4186-a0ba-c05f86e62519
  modified: 2026-10-06T18:47:53.476Z
---

Temarios de estudio de Christian, publicados el 2026-10-06 y generalizados ese mismo día (sin rutas del TMS, ver [[aprender-lenguaje-no-el-proyecto]]):

- Backend (BK-01..80, JS → TS → Node → Nest → arquitectura y datos): https://claude.ai/artifact/KFU8VMnmMKrHLG4FYeK5CF
- Frontend (FE-01..58, base web → React → Angular): https://claude.ai/artifact/H2eria8osHLLy21NjPAvgr
- Móvil (MV-01..54, Kotlin → Android → Compose → avisos y cierre): https://claude.ai/artifact/1yxs4jUHT2fwR5EeLHjETz

Uso: «revisa el artefacto, ve dónde nos quedamos y crea la clase» → `ArtifactData list` en `progreso` (doc = código de clase) y `extras`; la próxima es la primera sin `terminada: true`. «Actualiza el artefacto» → `set progreso/<código>` {terminada, fecha, resumen, pendientes}. El protocolo completo está dentro de cada página.

Fuente local para republicar: scratchpad de la sesión 771137de, carpeta `temarios/` (`node generalizar.js && node generar.js`; los `*-original` son la versión con rutas). Si ya no existe, se lee la página con `Artifact read` y se edita el JSON `#temario`. Los códigos de clase no se renumeran: el avance cuelga de ellos.

Relacionado: [[teacher-ingles]] (la misma idea, para inglés).
