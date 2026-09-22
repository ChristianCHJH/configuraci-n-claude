---
name: codigo-sin-comentarios
description: "Christian no quiere ningún comentario en el código, en ningún proyecto; solo directivas de herramienta sobreviven."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 32483f64-972a-442e-a9b9-a7fda99081d3
  modified: 2026-08-23T13:08:23.992Z
---

Cero comentarios en el código: ni `//`, ni `/* */`, ni JSDoc, ni `<!-- -->` en
templates, ni banderas de sección, ni claves-comentario en JSON. Pedido el
2026-08-23 y aplicado como regla global en `~/.claude/CLAUDE.md`.

Sobreviven solo las directivas de herramienta (`@ts-`, `eslint-`,
`prettier-ignore`, `/// <reference`) y el `comment:` de una columna de TypeORM,
que viaja al DDL.

**Why:** el nombre de la variable, la función y el archivo tienen que cargar la
explicación. Lo que necesita párrafos es una decisión de arquitectura y
pertenece a un ADR, donde alguien la va a buscar dentro de un año — no encima
de una línea que va a cambiar.

**How to apply:** al escribir código nuevo, no lo comentes. Al tocar un archivo
ajeno con comentarios, quítalos, y si cargaban una razón real, muévela al
nombre o al ADR antes de borrarla. En `inmobiliaria-sistema` es la regla 6 del
`CLAUDE.md` y se verifica sola: `npm run sin-comentarios` (dentro de
`npm run prueba`) y `npm run sin-comentarios:arreglar`. Fuera de eso, los
`.md`, `.env.ejemplo`, `Dockerfile` e infraestructura quedan exentos.
