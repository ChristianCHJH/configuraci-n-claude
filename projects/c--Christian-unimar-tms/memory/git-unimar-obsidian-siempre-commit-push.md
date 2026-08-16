---
name: git-unimar-obsidian-siempre-commit-push
description: "Wikis y repo .claude: commit local automático SÍ; push, pull y fetch NUNCA — ningún comando de red (regla 2026-08-12, endurece la de 2026-07-31)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1e8113f4-85fc-42fc-92a6-86974cfe5868
  modified: 2026-08-12T23:12:48.318Z
---

En los repos de memoria (**`C:\Christian\Unimar_obsidian`**, `viernes-obsidean`, `C:\Users\cjara\.claude`): **`git commit` local automático SÍ; `git push`, `git pull` y `git fetch` NUNCA.** Ningún comando que toque la red, en ningún hook ni en ningún comando. El push y el pull los ejecuta Christian a mano cuando él decida.

**Why:** el push automático le molestaba (cancelado 2026-07-31) y el **2026-08-12 extendió la prohibición al pull**: el aviso de auto-sync fallido se repetía cada turno y llenaba el contexto con una causa falsa. Christian prefiere sincronizar él antes de arrancar. Riesgo asumido y explícito: si editó el wiki desde otra PC, se trabaja sobre una foto vieja — si sospechas desactualización, **avísale**, no sincronices.

**How to apply:** tras escribir en el vault dentro de `/unimar` o `/viernes`: `git add -A && git commit -m "..."` y **detenerse ahí**. `/despertar` y `/despertar-unimar` ya no hacen pull (se les quitó el Paso 0 de sincronización el 2026-08-12) y tampoco invocan `/unimar` ni `/viernes` por su cuenta — esas skills solo se activan cuando Christian las escribe él mismo. El hook `Stop` [[hook-sesion-guard-sin-push]] solo commitea.

**Ojo — NO confundir con [[bmad-agents]] ni con el repo de código `unimar_tms`:** en `unimar_tms` sigue vigente la regla más estricta (JAMÁS commit/push; el versionado lo hace la persona usuaria). El commit automático local es **solo** para los repos de memoria.
