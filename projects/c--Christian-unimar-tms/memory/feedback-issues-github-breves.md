---
name: feedback-issues-github-breves
description: "Los issues de GitHub se crean puntuales — título + descripción breve + link al .md, nunca volcando el contenido de la historia"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5580b0bc-e7ef-4333-a7ed-7170adf821df
  modified: 2026-08-07T16:51:29.886Z
---

Al crear issues/tarjetas en GitHub (repo `unimar-peru/unimar_tms`, Project 8 «TMS: Backlog»), ser **puntual**: título de la historia + una o dos líneas de descripción + link al archivo `.md`. No volcar Gherkin, DoD ni criterios completos dentro del issue.

**Why:** la fuente de verdad son los `.md` de `_bmad-output/planning-artifacts/`. Duplicar el contenido en el issue lo desincroniza en días, y satura el board de texto que nadie lee ahí.

**How to apply:** body = `**Épica:** … · **Sprint:** … · **Talla:** … · **Prioridad:** …` + 1-2 líneas + `📄 [archivo.md](link a blob/develop)`. El detalle vive en el `.md`; los metadatos estructurados van en los campos del Project (Épica, Sprint, Size, Prioridad, Status), no en el body. Ver [[github-project-tms-backlog]].
