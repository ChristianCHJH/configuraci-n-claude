---
name: escrituras-a-produccion-las-corre-christian
description: el modo automático bloquea escribir en la BD de producción; Christian corre el script desde PowerShell con cmd /c y sin comillas simples.
metadata:
  node_type: memory
  type: feedback
  originSessionId: 88426db0-ecb6-438b-8b2b-5308e87fa26e
  modified: 2026-10-25T19:25:33.133Z
---

Escribir en la base de producción de la inmobiliaria por SSH lo bloquea el filtro del modo automático, aunque Christian lo apruebe en el chat. Pasó el 25/10/2026 con las correcciones del corte. Lo que funcionó: Christian corrió el script él mismo, en PowerShell como administrador, con esta forma:

`cmd /c "ssh -T -o BatchMode=yes -i C:\Users\Christian\.ssh\id_ed25519 root@179.199.128.169 docker exec -i inmobiliaria-postgres psql -U inmobiliaria -d inmobiliaria -v ON_ERROR_STOP=1 -f - < C:\ruta\al\script.sql"`

**Why:** PowerShell no acepta `<`. Con comillas simples dentro de `cmd /c`, el servidor recibe el comando como una sola palabra y responde «command not found». `Get-Content | ssh` en PowerShell 5.1 cambia las tildes por signos de interrogación.

El filtro también bloquea leer la configuración del servidor (`docker inspect` de las APIs). Para scripts bash enteros, la forma que funcionó es `cmd /c "ssh ... root@179.199.128.169 bash -s < C:\ruta\script.sh"`; dentro del script, lo que vaya a psql va como heredoc, no por stdin aparte.

**How to apply:** antes de escribir en producción, simular el script en una base local restaurada del respaldo, darle a Christian el comando en esa forma y verificar después en modo solo lectura. Relacionado: [[corte-25-oct-2026]], [[recuperar-con-python-y-verificar]].
