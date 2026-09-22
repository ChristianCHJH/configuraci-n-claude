---
name: quitar-del-front-limpia-el-back
description: "Al quitar algo de una pantalla, revisar y limpiar el backend que lo alimentaba — dato que no se pinta no se consulta ni se procesa"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a1806625-050a-4e2f-8b33-b6e60356fc58
  modified: 2026-08-20T03:08:12.127Z
---

Cuando se elimina una sección, columna o dato de una pantalla, el cambio no termina en el frontend: hay que revisar la consulta y el caso de uso que lo alimentaban y quitar de ahí lo que quede sin usar — el SELECT, el cálculo y el campo del contrato de salida.

**Why:** un dato que ya nadie pinta se sigue leyendo de la base, agregando y enviando por la red en cada petición. Christian lo pidió explícitamente al quitar la fila de totales del Consolidado por nave (2026-08-19): «si el backend también trae eso y no lo necesitamos, hay que limpiarlo; así nos ahorramos consulta y data».

**How to apply:** antes de dar por cerrado un cambio de UI, buscar cada campo del contrato en los componentes (`grep` del nombre) y, para los que salen a cero, decidir una de dos: quitarlos del caso de uso y del tipo, o pintarlos si el dato vale la pena. Lo que se calcula solo para derivar otra cosa (un `COUNT` que alimenta una resta) se conserva en el SQL pero deja de viajar en la respuesta. Aplica igual en sentido contrario: no exponer campos «por si acaso». Ver [[codigo-espanol-sin-comentarios]].
