---
name: git-unimar-obsidian-siempre-commit-push
description: "En el repo Unimar_obsidian (wiki) SIEMPRE hacer commit Y push automáticamente, sin pedir permiso"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1e8113f4-85fc-42fc-92a6-86974cfe5868
---

En el repositorio **`C:\Christian\Unimar_obsidian`** (el wiki/segundo cerebro de Unimar): después de cualquier cambio (edición de páginas, mover archivos, /unimar en modo escritura, etc.) hacer **SIEMPRE `git commit` Y `git push`**, automáticamente, sin preguntar. Es una regla permanente ("siempre siempre").

**Why:** Christian quiere que la memoria del wiki no viva solo en disco local — cada cambio debe quedar versionado y sincronizado al remoto de inmediato.

**How to apply:** tras escribir en `Unimar_obsidian`, ejecutar `git add -A && git commit -m "..." && git push`. Esto **anula** la nota del skill /unimar de "no hacer push salvo que lo pida" para este repo.

**Ojo — NO confundir con [[bmad-agents]] ni con el repo de código `unimar_tms`:** en `unimar_tms` sigue vigente la regla contraria (JAMÁS commit/push; el versionado lo hace la persona usuaria). La excepción de commit+push automático es **solo** para `Unimar_obsidian`.
