---
name: todo-entra-por-pr-a-develop
description: "nunca push directo a develop; todo cambio entra por PR a develop, aunque Christian diga \"push a develop\""
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5f80cf16-a55c-4653-8741-f4326aa5d3f9
  modified: 2026-10-15T17:15:02.493Z
---

Todo cambio entra a `develop` por un PR, aunque Christian diga «push a develop». Esa frase significa subir la rama y abrir el PR contra develop, no `git push origin HEAD:develop`.

**Why:** el 15-oct-2026 subí directo a develop el commit de la verificación de Google en la landing y Christian lo corrigió: «siempre el pr se hace a develop».

**How to apply:** rama propia desde `origin/develop`, push de esa rama y `gh pr create --base develop`. Si el cambio toca solo `apps/landing/**`, el PR no dispara pruebas ni despliegues (PR #109).
