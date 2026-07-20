---
name: feedback-regla-100-lineas
description: "El límite de 100 líneas en los wikis /unimar y /viernes es tope de HOJA, no de contenido — se parte, nunca se recorta"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9f0ec2b2-eebe-4c88-84c6-611b24c5b37c
---

En los wikis de [[bmad-agents]] (/unimar → Unimar_obsidian, /viernes → viernes-obsidean), el límite de 100
líneas es un **tope de tamaño POR HOJA para lectura rápida, NUNCA un tope de contenido**.

**Why:** Christian corrigió explícitamente (2026-07-16) mi razonamiento erróneo "la página ya está al límite, no
la inflo / dejo el delta afuera". Eso está mal: recortar u omitir información para caber en 100 líneas viola el
propósito. El objetivo del límite es atomicidad + que se encuentre todo rápido + lectura fácil, no minimizar contenido.

**How to apply:** Si el contenido no cabe en una hoja → NO se descarta: se **parte en hub + sub-páginas
enlazadas** (`{página}-{subtema}.md`), y se sigue partiendo en cuantas hojas haga falta, consecutivamente. Si una
sub-página también pasa de 100, se re-parte. Todo queda enlazado (hub↔sub-páginas, index.md actualizado). Regla
mental: "¿supera 100? → lo divido y enlazo", nunca "escribo menos". Ya quedó codificado en los archivos de skill
`~/.claude/commands/unimar.md` y `~/.claude/commands/viernes.md`.
