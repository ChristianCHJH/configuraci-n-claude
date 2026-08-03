---
name: git-unimar-obsidian-siempre-commit-push
description: "En el repo Unimar_obsidian (wiki): commit automático SÍ, push NO — el push lo hace Christian a mano (regla 2026-07-31, reemplaza la de 2026-07-20)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1e8113f4-85fc-42fc-92a6-86974cfe5868
---

En el repositorio del wiki de Unimar (**`C:\Christian\Unimar_obsidian`** o `C:\Users\Christian\Unimar\Unimar_obsidian` según la máquina): después de escribir vía `/unimar`, hacer **`git commit` automáticamente, pero NUNCA `git push`**. El push lo ejecuta Christian manualmente cuando él decida.

**Why:** Christian quiere los cambios versionados localmente (commit), pero el push automático "a cada rato" le molestaba — lo canceló el 2026-07-31. Esta regla **reemplaza** la autorización del 2026-07-20 que obligaba a commit+push.

**How to apply:** tras escribir en el vault dentro de `/unimar`: `git add -A && git commit -m "..."` y **detenerse ahí**. Prohibido `git push`. Además: `/despertar` y `/despertar-unimar` NO invocan `/unimar` ni `/viernes` ni escriben en el wiki por su cuenta — esas skills solo se activan cuando Christian las escribe él mismo.

**Ojo — NO confundir con [[bmad-agents]] ni con el repo de código `unimar_tms`:** en `unimar_tms` sigue vigente la regla más estricta (JAMÁS commit/push; el versionado lo hace la persona usuaria). El commit automático (sin push) es **solo** para el vault Unimar_obsidian.
