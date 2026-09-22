---
name: prefiere-prosa-no-selector
description: Christian prefiere respuestas y decisiones en prosa; interrumpe el selector de opciones de AskUserQuestion.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d63b51e3-97f8-477a-ad7e-bcb86ae30df4
  modified: 2026-08-23T22:52:43.733Z
---

Responder en prosa y recomendar una opción, en vez de abrir el selector de
`AskUserQuestion`. Christian lo interrumpió dos veces seguidas en la sesión del
23 de agosto de 2026 y en ambas pidió lo mismo: «resúmeme la respuesta».

**Why:** trabaja por voz y el selector le corta el hilo — no puede dictar sobre
una lista de opciones. Además suele traer contexto de negocio que ninguna de las
opciones contempla (con el Excel dijo «que acepte los dos formatos», que no era
ninguna de las tres que le ofrecí).

**How to apply:** cuando haya una decisión abierta, decirla en dos o tres líneas
al final de la respuesta, con la recomendación primero y el porqué. Reservar
`AskUserQuestion` para cuando de verdad haga falta una elección cerrada y ya se
haya agotado la explicación. Si algo es reversible y hay un default sensato,
tomarlo y avisar, en vez de preguntar. Ver [[codigo-sin-comentarios]].
