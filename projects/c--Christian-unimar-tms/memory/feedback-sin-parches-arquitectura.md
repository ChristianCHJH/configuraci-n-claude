---
name: feedback-sin-parches-arquitectura
description: "Christian rechaza los parches; exige arreglar la causa respetando SOLID, Clean Code y la arquitectura"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 216bae06-4a27-4aa9-b1b2-af6c7fc2619c
  modified: 2026-09-08T22:02:41.157Z
---

Ante un error, no quiere «que funcione»: quiere la **causa arreglada**. Rechaza explícitamente los
condicionales metidos a la fuerza y cualquier cosa que rompa el modelo de arquitectura, SOLID o
Clean Code. Pregunta «¿cuál sería la mejor solución?» antes de dejar aplicar nada.

**Why:** el TMS es la base de la suite Unimar y va a crecer; un parche hoy se paga en cada historia
que venga después.

**How to apply:** diagnostica con evidencia (logs, consultas a la base, mediciones), presenta las
alternativas con su riesgo medido —no supuesto— y recomienda una. Cuando una opción toca más
superficie de la que arregla, dilo con números. Ver [[feedback-respuestas-breves]].
