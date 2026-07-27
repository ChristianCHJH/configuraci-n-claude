---
name: bigint-ids-llegan-como-string
description: Los id BIGINT de PostgreSQL llegan al frontend como string aunque el tipo TS diga number; nunca comparar con === contra un number.
metadata: 
  node_type: memory
  type: project
  originSessionId: a2e4db57-9af8-419d-b5c3-48f0b1844ded
  modified: 2026-07-27T20:24:35.065Z
---

Todas las tablas usan `id BIGINT GENERATED ALWAYS AS IDENTITY` (ver [[auditoria-actualizacion-nulable]]). Sequelize serializa BIGINT como **string** (`"3"`), pero las interfaces TS del frontend los declaran `number`. TypeScript no lo detecta: el tipo miente.

**Why:** costó un bug real (2026-07-27) en el selector de variantes — el `<select>` de tipo de talla emitía `"3"`, el handler hacía `+valor` → `3`, y `tipos.find(t => t.id === 3)` fallaba contra `"3"`. El select mostraba el tipo elegido pero no aparecía ningún chip de talla.

**How to apply:** al comparar ids que vienen del backend contra valores del DOM o literales numéricos, normalizar en el punto de carga (`.map(t => ({ ...t, id: Number(t.id) }))`) o comparar con `Number(a) === Number(b)`. Ojo al normalizar: si otro componente compara esos ids contra otros campos del backend (también strings), emitirle la lista sin normalizar.

Gotcha vecino del mismo bug: `[value]` sobre un `<select>` se evalúa antes de que existan las `<option>` de un `@for` y no llega a aplicarse — marcar la selección con `[selected]` en cada `<option>`.
