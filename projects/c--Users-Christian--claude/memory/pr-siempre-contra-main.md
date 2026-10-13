---
name: pr-siempre-contra-main
description: En el repo de configuración ~/.claude los PR y merges van siempre contra main
metadata:
  node_type: memory
  type: project
  originSessionId: 53523736-7c55-416a-bfaa-5d489b5cadc2
  modified: 2026-10-13T01:03:16.630Z
---

En el repo `configuraci-n-claude` (la carpeta `~/.claude`), todo cambio se integra contra `main`: la rama propia se mergea con `origin/main` y el PR se abre con base `main`.

**Why:** Christian lo pidió el 2026-10-12 al decir "todo contra main".

**How to apply:** cuando pida commitear o subir cambios de este repo, después de los commits por bloque (ver [[christian-commit]]) traer `origin/main`, resolver choques de archivos de sincronización (`plugins/known_marketplaces.json`, `*/synced/*`) con la versión local, y abrir el PR contra `main` sin preguntar la base.
