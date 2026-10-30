---
name: corte-25-oct-2026
description: revisión del corte antes del arranque del 26/10/2026 — qué falta cargar del Drive y qué contratos están en el cliente equivocado.
metadata:
  node_type: memory
  type: project
  originSessionId: 88426db0-ecb6-438b-8b2b-5308e87fa26e
  modified: 2026-10-25T19:06:42.860Z
---

El 25/10/2026, antes de que el sistema entre en uso (26/10), se revisó el corte en producción (solo lectura, `ssh root@179.199.128.169`, psql con `PGOPTIONS=-c default_transaction_read_only=on`).

- La descarga del Drive del 25/10 viene en dos ZIP (`drive-download-20261025T044701Z-1-001` extraído y `-1-002.zip` sin extraer). Las dos partes juntas: 821 archivos nuevos frente al corte del 27/09.
- Faltan en el sistema 254 boletas del 23/07 al 23/10 (S/ 675 216), además de 92 clientes, 45 contratos y 32 separaciones.
- Se cargó el 49,7 % del dinero del padrón (S/ 7,30 M de 14,67 M), con 402 ventas cargadas y 465 observadas.
- (Corregido el 25/10 en producción: los 6 contratos pasaron al cliente correcto y se dieron de baja el cliente de prueba 159 y los duplicados 267, 447 y 500.) 5 contratos quedaron en un cliente duplicado con el DNI errado (267→487, 447→510, 500→308, 427→389, 205→574). El contrato 372 se ató por un DNI mal digitado en el padrón. El cliente de prueba 159 tiene pagos en producción.
- La descarga del 25/10 casi no corrige lo observado: solo 3 ventas quedan resueltas y 443 siguen observadas. Listo para subir: 80 pagos (S/ 111 895), 35 clientes, 2 contratos y 5 ventas del padrón nuevo; documentos listos: 29 DNI, 10 contratos y 163 boletas. En el padrón nuevo de 1ra etapa, la celda A1 «MZ» quedó sobrescrita con un 1: hay que corregirla antes de correr el pipeline.
- Desde el 25/10, `documentos-inmobiliaria\` es la descarga del 25/10 (las dos partes, con A1 corregida). La del 27/09 quedó en `documentos-inmobiliaria-2026-09-27\`. La carga incremental, ensayada en local, está en `herramientas/analisis-documentos/CARGA-INCREMENTAL-2026-10-25.md`: 34 clientes, 4 contratos, 77 pagos y 20 DNI. Las 163 boletas en PDF no se suben porque ningún script las sube. **Aplicada en producción el 25/10 por la tarde**: totales 413 contratos, 4 166 cuotas, 1 726 pagos, S/ 7 572 668,65 y 719 clientes activos. Queda pendiente: una ficha duplicada de MIRLO MIGUEL QUISPE SULLCA (clientes 704 y 723, con DNI distinto), las 9 boletas rechazadas por céntimos, decidir dónde se guardan las boletas en PDF y los 4 pagos de H1-4+1 y Playa A-3.
- Excel con las cifras: `Downloads\corte-de-datos-2026-10-25.xlsx`. El tablero y la presentación publicados se borraron el mismo día. Los scripts y resultados están en el scratchpad de la sesión: no son permanentes.

**Why:** Christian encontró documentos físicos que no coincidían con el cliente registrado.

**How to apply:** antes de cargar el delta, corregir primero los duplicados para que los pagos nuevos no caigan en el registro equivocado. Relacionado: [[recuperar-con-python-y-verificar]], [[dni-se-ata-por-ocr-no-por-carpeta]].
