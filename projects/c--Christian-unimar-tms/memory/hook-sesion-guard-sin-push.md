---
name: hook-sesion-guard-sin-push
description: El hook Stop sesion-guard.ps1 ya no hace push (quitado 2026-08-12) — solo commit local + guardia de contexto 60/75%
metadata: 
  node_type: memory
  type: project
  originSessionId: a40f5629-10fc-406f-8445-9053dcfc5af9
  modified: 2026-08-12T23:13:03.041Z
---

`C:\Users\cjara\.claude\hooks\sesion-guard.ps1` es el hook **`Stop`** (registrado en `settings.json` → `hooks.Stop`): corre **al final de cada turno**. Hace dos cosas:

1. **Auto-commit local** en 3 repos (`.claude`, `Unimar_obsidian`, `viernes-obsidean`), debounce 10 min por repo. **Ya no hace `push`** — se quitó el 2026-08-12, junto con el chequeo `git log '@{u}..HEAD'`. Nunca hizo `pull`.
2. **Guardia de contexto**: avisa al 60% y al 75% de la ventana; el script lee el transcript y detecta si la sesión usó `/despertar-unimar` (→ `/unimar`) o `/despertar` (→ `/viernes`) para decir quién documenta.

**Why:** el push fallaba en cada turno e inyectaba el aviso *"AUTO-SYNC: el push falló"* en el contexto, con una causa sugerida que **siempre era falsa** (`pull --rebase`; el repo queda `ahead N`, jamás `behind`). Ver [[claude-repo-push-403-identidad]] para el historial del fallo: primero 403 por identidad cruzada entre 4 cuentas GitHub, luego `Cannot prompt because user interactivity has been disabled` porque el hook corre sin terminal y la credencial de GCM ya no estaba cacheada.

**How to apply:** si un aviso del hook culpa a una divergencia de historia, **no le creas** — verifica con `git status -sb`. El archivo es **ASCII puro a propósito** (PowerShell 5.1 lo lee como ANSI y rompe acentos): no meter caracteres no-ASCII al editarlo. Y todo `git` dentro del script va silenciado con `$null =` — cualquier texto suelto en stdout corrompe el JSON que el hook devuelve.

Relacionado: [[git-unimar-obsidian-siempre-commit-push]]
