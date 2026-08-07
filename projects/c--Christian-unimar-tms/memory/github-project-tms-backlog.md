---
name: github-project-tms-backlog
description: Cómo está montado el board TMS Backlog (Project 8 de unimar-peru) y qué credencial hace falta para tocarlo
metadata: 
  node_type: memory
  type: project
  originSessionId: 5580b0bc-e7ef-4333-a7ed-7170adf821df
  modified: 2026-08-07T16:51:44.829Z
---

El backlog del TMS vive en el GitHub Project **`TMS: Backlog`** — org `unimar-peru`, número **8**, id `PVT_kwDOEenn8M4Bfr4e`. Los issues van al repo `unimar-peru/unimar_tms`.

**Credencial:** el token que Git Credential Manager guarda para github.com **no sirve** (scopes `gist, repo, workflow`, sin `project`). El device flow de `gh auth login` tampoco: GitHub CLI hoy es GitHub App y devuelve un token `ghu_` sin permisos sobre la org. Hace falta un **PAT clásico con `repo` + `project` + `read:org`**, cargado con `gh auth login --with-token`. `gh` está en `C:\Program Files\GitHub CLI\gh.exe` (instalado 2026-08-07 vía winget).

**Convención del board** (montada el 2026-08-07): campos custom `Épica` (EP-01…EP-05), `Sprint` (1-4) y `Prioridad` (Must/Should/Could), más los del template `Size` y `Status` (En Refinamiento · Todo · En Diseño · En Codificación · En Pruebas · En Producción). El campo `Priority` del template quedó vacío y sin opciones — GitHub no deja editarlo por API.

**Labels del repo:** `historia`, `tarea`, `sprint-1`, `epica:EP-01`…`epica:EP-05`.

Las historias de usuario entran como `US-TMS-0NN — nombre`; el trabajo de proyecto que no es funcionalidad (grooming, validación del prototipo) entra con label `tarea` y **sin** ID `US-TMS`, para no ensuciar el conteo de 32 historias del MVP. Formato del body: ver [[feedback-issues-github-breves]].

**Personas:** Anaís (PO) = `AnaClau10` · Laura = `LauraUnimar` · Christian = `unimar-christian-jara`.
