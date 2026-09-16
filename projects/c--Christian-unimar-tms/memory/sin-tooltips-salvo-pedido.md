---
name: sin-tooltips-salvo-pedido
description: Nunca agregar tooltips (title) por iniciativa propia; solo si Christian los pide explícitamente
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4b8a5611-1bf6-4b60-867b-5dbe4f2d6e88
  modified: 2026-08-20T20:57:59.549Z
---

En el frontend no se agrega **ningún** `title`/tooltip por iniciativa propia — ni para explicar un icono, ni para mostrar completo un texto truncado, ni como ayuda contextual. Solo se escribe uno cuando Christian lo pide para ese elemento concreto. Si aparece uno que nadie pidió, se borra.

**Why:** el 2026-08-20 pidió quitar los textos de ayuda del menú de clasificación y, al revisarlo, encontró tooltips repartidos por toda la app que nunca había pedido. Los consideró ruido y ordenó eliminarlos todos como regla, no como limpieza puntual.

**How to apply:** al escribir JSX, no poner `title=`. `aria-label` sí se usa donde la accesibilidad lo exige (botón sin texto visible) — lo prohibido es el tooltip visual. La regla quedó escrita en el `CLAUDE.md` del repo, sección «Estilo de código», junto a [[feedback-regla-100-lineas]].
