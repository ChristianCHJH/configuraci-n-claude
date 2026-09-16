---
name: git-cuenta-github-unimar-tms
description: "Push a unimar_tms falla con \"Repository not found\" porque hay dos cuentas GitHub en la máquina y Git Credential Manager sirve la equivocada"
metadata: 
  node_type: memory
  type: project
  originSessionId: fca84073-9086-4e43-ad46-f95b3793a119
  modified: 2026-09-01T04:45:01.268Z
---

En la máquina de Christian conviven **dos cuentas GitHub** en `gh`: `ChristianCHJH` (personal, era la activa) y `unimar-christian-jara` (la que pertenece a la org `unimar-peru`). Solo la segunda ve los repos privados de la org.

Git Credential Manager guarda una credencial única por host — `git:https://github.com` apuntando a `ChristianCHJH` — así que `git push origin develop` en `unimar_tms` devolvía:

```
remote: Repository not found.
fatal: repository 'https://github.com/unimar-peru/unimar_tms.git/' not found
```

**Why:** GitHub responde `404` en vez de `403` para repos privados sin acceso — no revela su existencia. El mensaje engaña: parece que el repo no existe, cuando el problema es la credencial.

**How to apply:** ante un "Repository not found" en un repo de `unimar-peru`, verificar la cuenta antes que la URL: `gh auth status` y `GH_TOKEN=$(gh auth token -u unimar-christian-jara) gh api repos/unimar-peru/<repo>`. Arreglo aplicado el 2026-08-31, **por repo** (no global, para no romper los repos personales de `ChristianCHJH`):

```
git remote set-url origin https://unimar-christian-jara@github.com/unimar-peru/unimar_tms.git
git config credential.https://github.com.username unimar-christian-jara
```

Los demás repos de la suite (`unimar_arch`, `unimar-ums`, `unimar-cli`…) necesitan el mismo ajuste si dan el mismo error. Ver [[github-project-tms-backlog]] para el tema de scopes del token.
