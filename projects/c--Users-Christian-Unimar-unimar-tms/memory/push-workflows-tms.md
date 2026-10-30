---
name: push-workflows-tms
description: el clon unimar_tms usa un PAT local sin scope workflow; para tocar .github/workflows hay que empujar con la credencial de gh
metadata:
  node_type: memory
  type: reference
  originSessionId: df88ec2e-088d-4e74-8ae4-24f5dcd74030
  modified: 2026-10-28T21:32:05.956Z
---

El clon `C:\Users\Christian\Unimar\unimar_tms` tiene `credential.https://github.com.helper=store --file=.git/.credenciales-github`, con un PAT **sin scope `workflow`**: GitHub rechaza cualquier push que cree o cambie `.github/workflows/*`.

El token de `gh` (cuenta `unimar-christian-jara`) sí lo tiene. Para ese push, sin tocar la config:

`git -c credential.helper= -c credential.https://github.com.helper= -c 'credential.helper=!gh auth git-credential' push https://github.com/unimar-peru/unimar-tms-gr.git <rama>`

Los repos se renombraron (2026-10): `unimar_tms` → `unimar-tms-gr`, `unimar-xms` → `unimar-xms-tms-gr`; los remotos locales siguen con el nombre viejo y GitHub redirige. `unimar-ums` tiene `main`, `develop` y dos `fix/*`. El 2026-10-28 se copió entero (ramas y tags) a `unimar-peru/unimar-ums-tms-gr`, que pasa a ser el repo de UMS; el viejo no se usa más. El clon local `C:\Users\Christian\Unimar\unimar-ums` y el servidor .14 WEB ya apuntan al nuevo.
