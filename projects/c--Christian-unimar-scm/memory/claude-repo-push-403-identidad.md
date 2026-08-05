---
name: claude-repo-push-403-identidad
description: El auto-sync de C:\Users\cjara\.claude falla con 403 porque Git usa la cuenta unimar-christian-jara sobre un repo de ChristianCHJH
metadata: 
  node_type: memory
  type: project
  originSessionId: 5452365a-0149-4f2c-b313-20ba2cd9a497
  modified: 2026-08-05T14:49:51.216Z
---

El hook de auto-sync que empuja `C:\Users\cjara\.claude` a
`https://github.com/ChristianCHJH/configuraci-n-claude.git` falla en cada sesión.
Mensaje real del remoto:

```
remote: Permission to ChristianCHJH/configuraci-n-claude.git denied to unimar-christian-jara.
403
```

**Why:** No es divergencia de historia ni credencial vencida (las dos causas que
sugiere el propio mensaje del hook). `git fetch` funciona porque el repo es
público y se lee anónimo; el `push` sí exige autorización y Git Credential
Manager entrega la credencial de **unimar-christian-jara**, que no es dueña ni
colaboradora del repo de **ChristianCHJH**. `git pull --rebase` nunca lo arregla
— el repo queda `ahead N`, jamás `behind`.

**How to apply:** No perder tiempo con `pull --rebase` cuando aparezca este
aviso. Verificar con `git -C "C:\Users\cjara\.claude" push origin main` y leer el
error real. El 2026-08-05 se resolvió solo tras reautenticar en el popup de Git
Credential Manager (el push llegó en `f9ea6dc`), así que es **intermitente**: la
credencial cacheada se cruza entre las dos cuentas. Si reaparece de forma
persistente: (a) añadir `unimar-christian-jara` como colaborador en GitHub,
(b) fijar identidad en el remoto con
`git remote set-url origin https://ChristianCHJH@github.com/ChristianCHJH/configuraci-n-claude.git`
y borrar `git:https://github.com` del Administrador de Credenciales de Windows,
o (c) mover el repo a la cuenta unimar.

Christian usa dos identidades GitHub en esta PC — ojo con lo mismo en otros
repos personales. Relacionado: [[identidades-github-chris]],
[[sesion-guard-stamp-solo-en-exito]]
