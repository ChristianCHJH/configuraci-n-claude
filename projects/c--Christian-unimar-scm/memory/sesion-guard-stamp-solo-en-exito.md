---
name: sesion-guard-stamp-solo-en-exito
description: "El debounce de 10 min de sesion-guard.ps1 no aplica a repos que fallan, por eso el aviso de auto-sync se repite cada turno"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5452365a-0149-4f2c-b313-20ba2cd9a497
  modified: 2026-08-05T14:50:07.962Z
---

En `C:\Users\cjara\.claude\hooks\sesion-guard.ps1` (hook `Stop`), el debounce de
`$MinutosDebounce = 10` por repo depende de un stamp en
`~\.claude\session-env\autosync<slug>.stamp`, y ese stamp se escribe **solo
después de un push exitoso** — la rama de error hace `continue` antes de
`Set-Content`.

**Why:** Un repo cuyo push falla nunca marca stamp, así que el hook lo reintenta
en **cada turno** en vez de cada 10 minutos, y reinyecta el mismo aviso
`AUTO-SYNC: el push a ... fallo` una y otra vez. No es que haya un problema nuevo
por turno: es el mismo fallo repitiéndose sin freno.

**How to apply:** Si el aviso de auto-sync aparece en turnos consecutivos, es
este bucle — diagnosticar la causa raíz una vez (ver [[claude-repo-push-403-identidad]])
en lugar de reaccionar a cada repetición. Si molesta, la corrección sería marcar
el stamp también al fallar (o un stamp de fallo aparte) para que el reintento
respete los 10 minutos. Aún no aplicada: es el archivo de configuración personal
de Christian, no tocar sin que lo pida.

El hook sincroniza 3 repos: `.claude`, `Unimar_obsidian` y `viernes-obsidean`.
Solo commitea y empuja — nunca hace pull (eso vive en `/despertar` y
`/despertar-unimar`).
