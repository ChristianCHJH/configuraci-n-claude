---
name: el-precio-se-acuerda-al-separar
description: "No hay tabla de precios ni padrón de lotes: el lote y su precio nacen en la separación, con el cliente delante"
metadata: 
  node_type: memory
  type: project
  originSessionId: b971d8c5-ba56-4386-be56-ac31d32890ff
  modified: 2026-09-08T13:07:04.258Z
---

La inmobiliaria BLP **no maneja una lista de precios** y nunca la va a manejar. El
precio de cada lote se acuerda con el cliente **en el momento de la separación** y
lo escribe quien la registra. Antes de eso el lote no existe: el plano es el
inventario y el lote nace en la separación (ADR-022, RN-157).

Se guarda en tres columnas de `lote` —`precio_base`, `ajuste_ubicacion` y
`precio_lista`— que se llenan en la misma operación. Lo normal es que el ajuste
llegue en cero y base y total coincidan; eso es el caso corriente, no un error.
`precio_lista` queda congelado y es contra el que el contrato compara su
`precio_pactado`.

**Why:** el 8-set-2026 construí una tabla `lista_precio` con precio por m² y
recargos por ubicación, más una pantalla entera para mantenerla, apoyándome en
E02-07 y RN-113. Christian la mandó quitar: esa información no existe en el
negocio. E02-07 se había escrito antes de ADR-022 y quedó desactualizada, igual
que le pasó a E02-08 (carga masiva de lotes). El bloque de decisiones de la épica
E02 ya lo decía textualmente —«el dato del lote —precio, medidas, cliente— se
escribe cuando alguien lo compra»—; el error fue no sacar esa consecuencia.

**How to apply:** una historia del corpus puede estar desactualizada por un ADR
posterior aunque nadie la haya tachado. Antes de construir sobre un criterio de
E02 o E06, verificar contra ADR-021 y ADR-022, que reencuadraron la épica entera.
Y ante cualquier «de aquí sale el precio propuesto», recordar que no hay de dónde
sacarlo. Ver [[nada-de-reglas-de-negocio-inventadas]].
