---
name: produccion-y-local-al-27-09
description: Qué tiene producción tras la carga histórica del 28/09/2026, cómo se entra al servidor y cómo se ensaya en local desde un backup
metadata:
  node_type: memory
  type: project
  originSessionId: 8d58b4e4-2d11-4388-a938-ae89e140accd
  modified: 2026-09-29T03:02:16.075Z
---

El 28/09/2026 se cargó en producción la cartera histórica: 402 contratos, 1 633 pagos, 8 proyectos, 483 lotes, 19 clientes nuevos, 73 DNI, 79 vouchers validados y 294 documentos de contrato. Antes: 664 clientes, 317 documentos, 1 proyecto demo, 59 migraciones. Detalle en `documentos-inmobiliaria/_analisis/carga-documentos/estado-carga-historica.md`.

Servidor: `ssh root@179.199.128.169` con la llave `id_ed25519`; código en `/opt/inmobiliaria-sistema`, contenedores `inmobiliaria-api`, `inmobiliaria-postgres`, volumen `inmobiliaria-datos-archivos`. Respaldos en `/root/respaldos/`. Los scripts de carga entran a `https://intranet.ibllimaco.io/api` con el usuario que Christian indique (el 28/09 fue su cuenta de gmail).

Entorno de pruebas (desde 28/09/2026): rama `develop` clonada en `/opt/inmobiliaria-sistema-pruebas`, se ve en `https://tester.ibllimaco.io` (registro A en Hostinger, certificado propio de certbot, nginx del host → 127.0.0.1:8382). Base `inmobiliaria_pruebas` dentro del mismo contenedor `inmobiliaria-postgres` (copia de producción), volumen `inmobiliaria-datos-archivos-pruebas`, compose sin versionar `infra/docker-compose.pruebas.yml`, JWT propio y la misma cuenta Gmail de producción con remitente «(PRUEBAS)» (desde 29/09/2026, a pedido de Christian). Christian no quiere backups automáticos por ahora. Despliegue manual: skill de proyecto `spiderman-despliegue-manual-tester`; el automático es `desplegar-pruebas.yml` en push a develop (PR #77). El 28/09/2026 GitHub Actions quedó frenado por facturación (2 027 de 2 000 min gratis): hasta que se renueve el cupo, tester y producción se actualizan a mano.

Ensayo en local: restaurar un backup con DROP/CREATE DATABASE (no con el --clean del dump), dejar que el API corra las migraciones, y no reconstruir contenedores mientras corre un script de carga. El API de desarrollo corre la semilla demo al arrancar y agrega usuarios @demo.pe y conceptos de código corto que no vienen de producción.

**Why:** Christian ensaya en local exactamente lo que después corre en producción.
**How to apply:** si un script de carga se corta sin escribir resultados, reanudar (es idempotente) y recuperar ids desde la base antes de correr el 36, que depende de `resultado-pagos.csv`. Ver [[cada-etapa-es-un-proyecto]].
