---
name: claude-repo-push-403-identidad
description: El auto-sync de C:\Users\cjara\.claude falla con 403 porque Git usa la cuenta unimar-christian-jara sobre un repo de ChristianCHJH
metadata: 
  node_type: memory
  type: project
  originSessionId: 5452365a-0149-4f2c-b313-20ba2cd9a497
  modified: 2026-08-05T15:29:54.364Z
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

Christian tiene **4 cuentas GitHub** en el Credential Manager de esta PC:
`ChristianCHJH` (la dueña de los repos personales y de memoria),
`christian-jara-unimar`, `unimar-christian-jara` y `290055476`. El diálogo
"Select an account" salía en cada push porque GCM no sabía cuál usar.

**ARREGLADO el 2026-08-05** con dos cambios locales al repo `.claude`:

```
git remote set-url origin https://ChristianCHJH@github.com/ChristianCHJH/configuraci-n-claude.git
git config credential.useHttpPath true
```

El `ChristianCHJH@` en la URL le dice a GCM qué cuenta elegir; `useHttpPath`
guarda la credencial por ruta de repo en vez de una sola global para
`github.com`, que era lo que hacía que las 4 cuentas se pisaran.

**How to apply:** Si vuelve el diálogo de cuenta o un 403 en OTRO repo de
Christian, aplicar el mismo par de comandos ahí — no perder tiempo con
`pull --rebase`, que es lo que sugiere el mensaje del hook y nunca es la causa.
Los otros dos repos del auto-sync (`Unimar_obsidian`, `viernes-obsidean`, ambos
de ChristianCHJH) seguían sin el arreglo al 2026-08-05.

Relacionado: [[sesion-guard-stamp-solo-en-exito]]
