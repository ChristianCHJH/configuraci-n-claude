---
name: github-project-tms-backlog
description: Cómo está montado el board TMS Backlog (Project 8 de unimar-peru) y qué credencial hace falta para tocarlo
metadata: 
  node_type: memory
  type: project
  originSessionId: 5580b0bc-e7ef-4333-a7ed-7170adf821df
  modified: 2026-08-10T15:04:36.735Z
---

El backlog del TMS vive en el GitHub Project **`TMS: Backlog`** — org `unimar-peru`, número **8**, id `PVT_kwDOEenn8M4Bfr4e`. Los issues van al repo `unimar-peru/unimar_tms`.

**Credencial:** el token que Git Credential Manager guarda para github.com **no sirve** (scopes `gist, repo, workflow`, sin `project`). El device flow de `gh auth login` tampoco: GitHub CLI hoy es GitHub App y devuelve un token `ghu_` sin permisos sobre la org. Hace falta un **PAT clásico con `repo` + `project` + `read:org`**, cargado con `gh auth login --with-token`. `gh` está en `C:\Program Files\GitHub CLI\gh.exe` (instalado 2026-08-07 vía winget).

**Convención del board** (actualizada 2026-08-10): campos custom `Épica` (EP-01…**EP-06 App UNITRANS**) y `Prioridad` (Must/Should/Could), más los del template `Size` y `Status` (Todo · En Refinamiento · Aprobado · En Diseño · En Codificación · En Pruebas · En Despliegue). **Ya no hay campo `Sprint`: el sprint lo lleva el campo `Iteration`**, con **3 iteraciones** — la 3ª se llama *«Sprint 3: GRE, Exportación e Integraciones, Visibilidad y soporte»*, o sea **fusiona los sprints 3 y 4 del backlog**. El campo `Priority` del template quedó vacío y sin opciones — GitHub no deja editarlo por API.

**Labels del repo:** `historia`, `tarea`, `TMS`, `sprint-1`…`sprint-4`. **No existen labels `epica:*`** — la épica vive solo en el campo del Project.

**Estado 2026-08-10: el board tiene las 32 historias del MVP** (12 del Sprint 1 + las 20 creadas el 08-10 en `En Refinamiento`, sin assignee). Las épicas de S2-S4 se **infirieron** salvo 013/014/015/016 (EP-06, declarada en el doc de épicas): 011/012→EP-04 · 017/018/021/022/023/030/031/032→EP-06 · 020→EP-03 · 024/026/027/028→EP-05 · 042→EP-01. **Ningún artefacto declara épica para esas 16** — pendiente de validar con la PO.

Las historias de usuario entran como `US-TMS-0NN — nombre`; el trabajo de proyecto que no es funcionalidad (grooming, validación del prototipo) entra con label `tarea` y **sin** ID `US-TMS`, para no ensuciar el conteo de 32 historias del MVP. Formato del body: ver [[feedback-issues-github-breves]].

**Personas:** Anaís (PO) = `AnaClau10` · Laura = `LauraUnimar` · Christian = `unimar-christian-jara`.
