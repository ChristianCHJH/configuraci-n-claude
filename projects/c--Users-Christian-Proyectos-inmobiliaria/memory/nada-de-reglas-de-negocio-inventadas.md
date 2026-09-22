---
name: nada-de-reglas-de-negocio-inventadas
description: "Christian rechaza umbrales y mínimos de negocio codificados sin respaldo; si no está confirmado por el cliente, no va al código"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 769f1e89-7552-4480-bdc5-2e0ce9911102
  modified: 2026-08-29T22:49:58.121Z
---

Cuando una pantalla mide «cuánto le falta» a algo, la vara tiene que venir de una
decisión de negocio confirmada, no de una constante escrita a ojo. Si no existe
esa decisión, la función se elimina entera: no se rebaja, no se renombra, no se
deja «mientras tanto».

**Why:** el 29-ago-2026, el listado de Empresas contaba datos faltantes contra
`CUENTAS_ESPERADAS = 2` y `SERIES_ESPERADAS = 3`, dos constantes del frontend sin
respaldo en la base, en el backend ni en ningún ADR. El «2» además era una mala
lectura de `3-producto/alcance-negocio.md`, que dice «una cuenta bancaria por
razón social: 2 cuentas, 2 RUC» —o sea 2 en todo el negocio, 1 por empresa—.
Christian: «esto no son reglas de negocio... quita todo eso». Se retiró la
columna «Carga inicial», el recuadro de la ficha y las dos constantes.

**How to apply:** antes de codificar un mínimo, un máximo o un «se espera N»,
buscar el respaldo en `inmobiliaria/3-producto/` o en un ADR. Si no aparece,
preguntar antes de escribirlo. Y al auditar una pantalla, tratar todo umbral
numérico como sospechoso hasta encontrar de dónde salió.
