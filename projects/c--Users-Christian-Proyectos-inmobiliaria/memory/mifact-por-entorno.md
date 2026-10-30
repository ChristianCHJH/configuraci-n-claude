---
name: mifact-por-entorno
description: "cómo está configurado MiFact en local, tester y producción, y por qué tester tiene el RUC demo."
metadata:
  node_type: memory
  type: project
  originSessionId: c0a26c3d-cdef-4210-99d5-346a69439022
  modified: 2026-10-25T19:25:30.871Z
---

Estado al 25/10/2026:
- **Local y tester**: MiFact demo público (`https://demo.mifact.net.pe`, token demo). El token demo solo acepta el RUC `20100100100` (con el RUC real responde «TOKEN INCORRECTO PARA …»), así que la empresa 1 (INMOBILIARIA BL) lleva ese RUC en local y en tester. GRUPO LIMACO no tiene credencial.
- **Tester** lee su configuración de `/opt/inmobiliaria-sistema-pruebas/.env` (`env_file`); producción pasa las variables por `infra/docker-compose.yml`. Tester tiene su propia `FACTURACION_CLAVE_CIFRADO` desde el 25/10.
- **Producción**: `FACTURACION_CLAVE_CIFRADO` vacía y sin credencial; falta el token real que MiFact entrega para el RUC 20610694871.
- No hay pantalla para la credencial: solo la API `POST /empresas/:id/credencial-facturacion`. El token se cifra con la clave del entorno, así que no se copia un token cifrado de un entorno a otro.

**Why:** que el RUC de tester no sea el real es a propósito; corregirlo rompe la facturación de tester.
**How to apply:** para producción, repetir el patrón de `C:\Users\Christian\Proyectos\backup\facturacion-tester.sh` con la URL y el token reales y sin tocar el RUC. Relacionado: [[escrituras-a-produccion-las-corre-christian]].
