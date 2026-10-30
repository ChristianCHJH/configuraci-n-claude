---
name: gh-cuenta-personal-para-inmobiliaria
description: gh tiene activa la cuenta de Unimar; los PR de inmobiliaria-sistema se crean con el token de ChristianCHJH.
metadata:
  node_type: memory
  type: reference
  originSessionId: d27868d1-a512-4c46-887d-9b6d93be61cf
  modified: 2026-10-26T19:26:42.280Z
---

`gh` tiene dos cuentas: `unimar-christian-jara` (activa) y `ChristianCHJH`. El repo
`ChristianCHJH/inmobiliaria-sistema` solo lo ve la personal: con la activa, `gh pr create`
responde «Could not resolve to a Repository».

**How to apply:** `export GH_TOKEN=$(gh auth token -u ChristianCHJH)` en el mismo comando,
sin `gh auth switch` (no cambiar la cuenta activa, que usan los repos de Unimar).
Relacionado: [[dos-repos-docs-y-sistema]].
