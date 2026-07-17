# Plan — Impedir combinar dos tipos de talla en variantes

## Context

Al generar variantes de un producto, el usuario puede seleccionar valores de **varios tipos de talla a la vez** (Talla bebé, Talla calzado adulto, Talla calzado niño, Talla ropa adulto, Talla ropa niño) y el backend hace el **producto cartesiano de todos los tipos juntos**. Eso produce combinaciones sin sentido como `9 meses · 27 · 43 · 2X Large · 14 años` (una zapatilla no puede ser 5 tallas distintas a la vez).

**Regla de negocio correcta:** un producto tiene **una sola dimensión de talla**. Las variantes se generan por esa talla sola, o por **Color × esa talla**. **Color es el único atributo combinable**; nunca se combina talla × talla.

**Qué faltaba:** el modelo no tiene ningún concepto que marque los tipos de talla como mutuamente excluyentes. El backend no valida nada y el frontend permite seleccionarlos todos.

**Decisiones del usuario:**
- Mecanismo: **exclusión mutua en la UI** (un solo grupo de talla activo; Color libre). Sin cambios de BD.
- Refuerzo: **UI + backend** (doble seguridad).

**Definición operativa de "tipo de talla":** cualquier atributo generador con `tipo_dato !== 'color'`. Color (`tipo_dato === 'color'`) es el único combinable. No se toca el esquema — no hay cambios en `database/setup-completo.sql`.

---

## Frontend — exclusión mutua en el generador

Archivo: `frontend/src/app/features/inventario/productos-premium/productos-premium.component.ts`
Template: `.../productos-premium.component.html`
CSS: `.../productos-premium.component.css`

1. **Nuevo computed `tallaTipoActivoId`** (junto a los signals de variantes, ~línea 199-201):
   devuelve el `id` del tipo de talla (`tipoDato !== 'color'`) que actualmente tiene ≥1 valor en `varSeleccion()`, o `null`. Recorre `varSeleccion()` cruzando con `atributosTipos()` para leer `tipoDato`.

2. **Nuevo helper `tipoBloqueado(tipo: AtributoTipoItem): boolean`**:
   `true` si `tipo.tipoDato !== 'color'` **y** `tallaTipoActivoId() != null` **y** `tallaTipoActivoId() !== tipo.id`. Color nunca se bloquea.

3. **Guardia en `toggleValorVariante`** (línea 848): al inicio, si el tipo está bloqueado, `return` (defensa; la UI ya lo deshabilita). Requiere pasar/leer el `tipoDato` — resolver el tipo desde `atributosTipos()` por `tipoId`.

4. **Template** (bloque `@for (tipo of atributosTipos())`, líneas 977-997):
   - En `.var-atrib-group` añadir `[class.var-atrib-group-off]="tipoBloqueado(tipo)"`.
   - En cada `.var-valor-chip` añadir `[disabled]="tipoBloqueado(tipo)"`.
   - Añadir hint en la cabecera de la sección (línea ~968): "Solo un tipo de talla por producto; el Color se combina con ella."

5. **CSS**: clase `.var-atrib-group-off` → `opacity: .45; pointer-events: none;` (y `cursor: not-allowed` en chips). Reusar tokens/estilo existentes de `.var-atrib-group`.

Resultado: al elegir un valor de una talla, los demás grupos de talla quedan atenuados y no clicables; Color permanece activo. Genera solo `Color × talla-activa`.

---

## Backend — rechazar payload con 2+ tipos de talla

Archivo: `backend/src/inventario/variantes/variantes.servicio.ts`, método `generarVariantes` (línea 194).

- Importar `BadRequestException` de `@nestjs/common` (línea 1-5).
- `atributoTipoModelo` (AtributoTipo) **ya está inyectado** (línea 59-60) — reutilizarlo.
- Tras validar el producto (después de línea 205): tomar `dto.valoresPorAtributo.map(g => g.atributoTipoId)`, consultar
  `this.atributoTipoModelo.findAll({ where: { id: tipoIds, eliminado: false } })`,
  contar los que tienen `tipoDato !== 'color'`. Si `> 1`:
  `throw new BadRequestException('No se pueden combinar dos tipos de talla en un mismo producto. Elige un solo tipo de talla (Color puede combinarse con ella).')`.

No se modifican DTOs, controlador ni entidades.

---

## Verificación

1. **Manual (app levantada):** editar "Zapatilla" → pestaña Variantes → seleccionar un valor de "Talla calzado adulto"; confirmar que los demás grupos de talla se atenúan y no responden al clic, mientras Color sigue clicable. Generar → las combinaciones son solo `color · talla-calzado`.
2. **Backend (guardrail):** con el frontend anterior o Postman, enviar `POST /inventario/variantes/producto/:id/generar` con 2 `valoresPorAtributo` de tipos de talla distintos → responde `400` con el mensaje.
3. **Regresión:** un solo tipo de talla + Color sigue generando el cartesiano correcto (color × talla).

---

## Tests recomendados

### Unit tests (Jest — backend)
- [ ] `generarVariantes()` lanza `BadRequestException` cuando el payload trae 2 tipos con `tipoDato !== 'color'` — `backend/src/inventario/variantes/variantes.servicio.spec.ts`
- [ ] `generarVariantes()` genera correctamente con 1 tipo de talla + Color (no lanza) — mismo archivo

### Unit tests (Jest — frontend)
- [ ] `tipoBloqueado()` devuelve `true` para un segundo tipo de talla cuando otro tipo de talla ya tiene selección — `frontend/src/app/features/inventario/productos-premium/productos-premium.component.spec.ts`
- [ ] `tipoBloqueado()` devuelve `false` para el tipo Color aunque haya una talla activa — mismo archivo
- [ ] `toggleValorVariante()` ignora el toggle de un tipo bloqueado — mismo archivo

### E2E (Playwright)
- [ ] Editar producto → seleccionar Talla calzado adulto → los otros grupos de talla quedan deshabilitados; seleccionar Color sigue permitido; generar produce solo combinaciones color×talla — `e2e/tests/04-productos/productos-crud.spec.ts`
