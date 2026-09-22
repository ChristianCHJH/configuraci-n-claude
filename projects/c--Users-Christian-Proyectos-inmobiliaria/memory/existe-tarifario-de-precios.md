---
name: existe-tarifario-de-precios
description: "PRECIO LOTES.xlsx tiene 20 tarifas reales, pero calzan con precio_base + ajuste_ubicacion del modelo; no contradicen la decisión de no tener tabla lista_precio"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4218f190-da58-461c-9992-af4a1aafbd91
  modified: 2026-09-10T22:36:58.573Z
---

En `documentos-inmobiliaria/` existe `PRECIO LOTES.xlsx` con 20 tarifas por proyecto, metraje y
tipo de lote (esquina o intermedio), con precio al contado y cuota a 12, 24 y 36 meses. Financiar
suma alrededor de S/1000 por año de plazo. La inicial va del 20% al 50% según el proyecto.

**Contrastado el 10-set-2026 contra el modelo:** no lo contradice. La decisión vigente (ADR-022,
RN-157) es que no hay tabla `lista_precio` y que el lote nace en la separación con
`precio_base`, `ajuste_ubicacion` y `precio_lista`. El tarifario encaja justo ahí: el precio por
metraje es `precio_base` y el diferencial de esquina es `ajuste_ubicacion`. Es una referencia
comercial que el asesor usa, no un padrón que el sistema deba mantener.

**Why:** llegué a pensar que el tarifario contradecía la decisión de no tener lista de precios.
No es así, y conviene no reabrir esa discusión sin motivo nuevo.

**How to apply:** si alguien propone crear una tabla `lista_precio`, la respuesta es que las tres
columnas de `lote` ya cubren el caso y dejan la puerta abierta a calcular el precio solo. Ver
[[el-precio-se-acuerda-al-separar]] y [[recuperacion-datos-historicos]].
