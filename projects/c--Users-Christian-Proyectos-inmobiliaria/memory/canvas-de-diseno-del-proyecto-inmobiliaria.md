---
name: canvas-de-diseno-del-proyecto-inmobiliaria
description: Dónde viven los canvas de diseño publicados del proyecto inmobiliaria y cómo actualizarlos desde otra conversación.
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7c2274b6-f998-44da-91de-ff0b9e535b11
  modified: 2026-09-19T01:00:07.303Z
---

Canvas de acceso móvil del asesor (5 pantallas + estados):
https://claude.ai/code/artifact/bd06238d-3fcf-45da-b844-dbf67c4eb133
Fuentes en `6-prototipo/design-acceso/` (los `.dc.html` se regeneran con `node generar.mjs`).

Canvas anterior, cliente y captación (escritorio 1440): fuentes en `6-prototipo/design/`.

Para editarlo desde otra conversación hay que pasar esa URL como `url` al publicar;
publicar sin la URL crea un artefacto nuevo en lugar de actualizar el existente.
El sistema visual de estos canvas está en los archivos de `6-prototipo/design/`, no en un DESIGN.md.

Canvas de plantillas de contrato (8 pantallas: los 8 estándares + libre, datos y dónde se llenan, estructura de lote, cláusulas, datos legales de la etapa,
paso 4 del contrato y edición del texto), creado el 2026-09-16:
https://claude.ai/artifact/Y6MwTjuxzhK7wzStjfKzD1
Canvas de cobranza (9 pantallas: vouchers, registrar pago, boleta de varios pagos, estado de cuenta,
morosos, pago en dólares para dos lotes, contrato de varios lotes, conciliación de la carga histórica),
creado el 2026-09-18: https://claude.ai/artifact/XriiBqq7zXcWqNep4ggMZ7
Generador en el repo: `6-prototipo/design-cobranza/generar.mjs <carpeta>`; escribe `project/` para publicar.

El generador de plantillas quedó fuera del repo, en el scratchpad de esa sesión (`generar-plantillas-v2.mjs`, reusa
`6-prototipo/design-venta/piezas.mjs`). Para publicar desde el scratchpad, usar la ruta larga
`C:/Users/Christian/AppData/...`: la ruta corta `CHRIST~1` la bloquea una regla de lectura.
