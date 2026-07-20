---
name: variantes-talla-exclusiva
description: Regla de variantes de producto — un solo tipo de talla; Color es lo único combinable.
metadata: 
  node_type: memory
  type: project
  originSessionId: f76f42c1-db28-4ba5-bc15-6e82721c278f
---

Al generar variantes de producto, un producto tiene **una sola dimensión de talla**. Nunca se combina talla × talla. **Color** (`atributo_tipo.tipo_dato = 'color'`) es el único atributo combinable con la talla.

"Tipo de talla" = atributo generador (`genera_variante = true`) con `tipo_dato !== 'color'` (Talla bebé, Talla ropa/calzado adulto/niño).

**Cómo se aplica:**
- Backend `variantes.servicio.ts` → `generarVariantes` lanza `BadRequestException` si el payload trae 2+ tipos con `tipoDato !== 'color'`.
- Frontend `productos-premium.component.ts` → computed `tallaTipoActivoId` + helper `tipoBloqueado(tipo)`; al elegir una talla, los otros grupos de talla se deshabilitan (`.var-atrib-group-off`). Guardia en `toggleValorVariante`.

**Why:** el backend hace producto cartesiano de todos los tipos juntos; sin esta regla generaba combos absurdos (ej. `9 meses · 27 · 43 · 2X Large · 14 años`).
