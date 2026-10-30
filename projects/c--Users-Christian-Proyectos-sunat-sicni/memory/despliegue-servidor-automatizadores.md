---
name: despliegue-servidor-automatizadores
description: "Cómo está desplegado unimar-automatizadores en 10.1.20.30 (NSSM, copia sin git) y cómo redesplegar"
metadata:
  node_type: memory
  type: project
  originSessionId: 7eaf6363-b9d6-4bb9-9d0d-04405b89c3db
  modified: 2026-10-28T16:44:08.754Z
---

El panel/job TB/TD (10.1.20.30:3110) corre como servicio NSSM `UnimarAutomatizadorSunat` (un proceso: job + API + panel) desde `C:\apps\automatizadores`, que es una COPIA de archivos, no un repo git. La base real es `C:\apps\automatizadores\datos\automatizadores.db`.

Se redespliega desde la sesión Remote Control «SERVIDOR UAT ALBERTO»: pull en el clon `C:\Users\AARROYO\Documents\Projects\unimar-automatizadores` con el git de GitHub Desktop, build del panel allí, y Christian corre como administrador el script que deja esa sesión (detener servicio, respaldar db en `respaldos\<fecha>`, copiar `src` y `panel\dist`, iniciar). La sesión no está elevada y no puede detener el servicio sola.

**Why:** el primer redespliegue (PR #4, 2026-10-28) asumió git en el servidor y se trabó.
**How to apply:** al pedir un redespliegue, mandar estos pasos directamente a esa sesión y avisar a Christian que tendrá que correr el script como admin.
