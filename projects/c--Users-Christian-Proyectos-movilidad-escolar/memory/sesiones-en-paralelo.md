---
name: sesiones-en-paralelo
description: "Si otra sesión de Claude trabaja en el mismo repo, usar otra rama o worktree, o esperar a que termine"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1d502e16-4d7c-4953-8434-f9534694d978
  modified: 2026-10-08T14:45:30.551Z
---

Cuando otra sesión de Claude está trabajando en el mismo repositorio, no editar en la misma copia de trabajo: hacerlo en otra rama o worktree, o esperar a que la otra sesión termine.

**Why:** El 2026-10-08 edité la app Android de movilidad_escolar en la misma rama (feat/microapps-nucleo) mientras otra sesión refactorizaba el núcleo. Su commit se llevó mis cambios, y compartimos el emulador y el puerto 3000. Christian dijo que hubiera sido mejor otra rama.

**How to apply:** Antes de editar, revisar `ListAgents` y `git status`. Si hay una sesión ocupada en el mismo repo, usar `EnterWorktree` o una rama nueva, o preguntar si esperar. Tampoco usar puertos (3000) ni el emulador sin coordinar.
