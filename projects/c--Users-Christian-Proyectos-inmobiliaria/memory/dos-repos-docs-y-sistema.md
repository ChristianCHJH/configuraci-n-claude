---
name: dos-repos-docs-y-sistema
description: El código de inmobiliaria vive en otro repo (inmobiliaria-sistema); este solo tiene documentación y prototipos.
metadata: 
  node_type: memory
  type: project
  originSessionId: a5536864-1cff-4793-91f2-a9470419dc36
  modified: 2026-09-06T14:56:42.005Z
---

`C:\Users\Christian\Proyectos\inmobiliaria` es el repo de documentación: marca,
levantamiento, producto, plan, arquitectura, prototipos (`6-prototipo/design-*`)
y manual. **No hay una sola línea de código de aplicación acá.**

El código está en el repo hermano `C:\Users\Christian\Proyectos\inmobiliaria-sistema`:
monorepo npm con `apps/api` (NestJS), `apps/web`, `packages/contratos`, `infra`
(docker-compose) y `apps/movil` (Android, proyecto Gradle aparte que no entra en
los workspaces de npm).

Los pedidos que hablan de rutas como `apps/movil/README.md` o
`packages/contratos/src/…` se refieren a **inmobiliaria-sistema**, aunque el
directorio de trabajo abierto sea `inmobiliaria`. Los artboards que esos pedidos
citan (`6-prototipo/design-acceso/`) sí están en `inmobiliaria`: hay que leer de
un repo y escribir en el otro.

Relacionado: [[canvas-de-diseno-del-proyecto-inmobiliaria]].
