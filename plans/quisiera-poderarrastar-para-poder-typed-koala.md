# Plan — Límite de imágenes por producto configurable + ocultar "Subir" al alcanzarlo

## Contexto

Hoy el máximo de imágenes por producto está fijo (3) y el usuario no puede cambiarlo. Además, al
llegar al límite el slot **"Subir"** sigue apareciendo y solo falla con un toast de error
("Límite de imágenes por producto alcanzado (3 máximo)"). Christian quiere:

1. **Configurar** el máximo de imágenes por negocio desde la pantalla **"Editar negocio"** (admin
   `negocios-lista`, `/dashboard/negocios`), junto a "Max. marcas" / "Max. productos".
2. **Ocultar el slot "Subir"** cuando el producto ya alcanzó ese máximo (no mostrar la opción).

**Buena noticia:** el backend ya soporta el campo completo — no hay cambios de BD.
- Entidad `negocio.entidad.ts:33` → `maxImagenesProducto` (`max_imagenes_producto SMALLINT DEFAULT 3`).
- `setup-completo.sql:227` ya tiene la columna + seed. **Sin migración, sin tocar setup-completo.sql.**
- `CrearNegocioDto` (`@Min(1) @Max(20)`) y `ActualizarNegocioDto` (PartialType) ya validan el campo.
- `PATCH /negocio/:id` → `actualizar()` usa spread `...dto` → **ya persiste** `maxImagenesProducto`.
- `GET /negocio/mi-negocio` usa `@NegocioActual()` (respeta el negocio activo) y devuelve la entidad completa con `maxImagenesProducto`.

Falta: (a) exponer/editar el campo en el frontend admin, (b) que `productos-premium` conozca el
límite y oculte el slot, (c) un bug menor en `crear()`.

---

## Backend (1 fix)

### Bug en `negocio.servicio.ts` → `crear()`
`backend/src/negocio/negocio.servicio.ts` (~línea 41-53). Hoy `create({...})` mapea solo
`maxUsuarios`/`maxSedes` y **omite** `maxMarcas`, `maxProductos`, `maxImagenesProducto` (quedan en el
default de la entidad al crear un negocio desde el form admin). Agregar el mapeo de los tres:
```ts
maxMarcas: dto.maxMarcas,
maxProductos: dto.maxProductos,
maxImagenesProducto: dto.maxImagenesProducto,
```
(`actualizar()` ya funciona vía spread — no tocar.)

---

## Frontend — Editar negocio (admin `negocios-lista`)

`frontend/src/app/features/negocios/negocios-lista/negocios-lista.component.{ts,html}` y
`frontend/src/app/core/services/negocio.servicio.ts`.

1. **`negocio.servicio.ts`**: agregar `maxImagenesProducto: number` a la interface `Negocio` y al type `CrearNegocioPayload`.
2. **FormGroup** (`.ts` ~línea 61): nuevo control
   `maxImagenesProducto: [3, [Validators.required, Validators.min(1), Validators.max(20)]]`.
3. **`abrirEditarNegocio()`** (reset, ~línea 105): `maxImagenesProducto: negocio.maxImagenesProducto ?? 3`.
4. **`guardarNegocio()`** (objeto `datos`, ~línea 114): `maxImagenesProducto: Number(v.maxImagenesProducto)`.
5. **HTML** (después del `form-row` de marcas/productos, ~línea 313): nuevo `field-group` idéntico a los
   otros, `formControlName="maxImagenesProducto"`, `type="number" min="1" max="20"`, label "Max. imágenes por producto".

---

## Frontend — Ocultar "Subir" en `productos-premium`

`frontend/src/app/features/inventario/productos-premium/productos-premium.component.{ts,html}`.

El componente NO conoce el límite (el `NegocioContextoServicio` solo guarda id+nombre). Se obtiene con
el endpoint existente `NegocioServicio.obtenerMiNegocio()` (respeta negocio activo).

1. **`.ts`**: inyectar `NegocioServicio` (ya existe `negocioContexto`). Nuevo
   `readonly maxImagenes = signal<number | null>(null);` (null = aún no cargado → no bloquea).
   - Método `cargarLimiteNegocio()`: `obtenerMiNegocio()` → `this.maxImagenes.set(n.maxImagenesProducto)`.
   - Llamarlo en `ngOnInit` y dentro del `effect()` que ya reacciona a `negocioActivo()` (junto a `cargar()`), para que se refresque al cambiar de negocio.
   - Computed `readonly puedeSubirImagen = computed(() => { const max = this.maxImagenes(); return max == null || this.imagenes().length < max; });`
2. **`.html`** (slot "Subir", ~línea 662): envolver el `<label class="cat-upload-slot">` en
   `@if (puedeSubirImagen()) { ... }`. El `<input type=file>` puede quedar fuera del @if (oculto por
   CSS) o dentro; mantenerlo junto al label. Añadir hint cuando esté lleno:
   ```html
   @if (!puedeSubirImagen()) {
     <p class="cat-field-hint">Límite alcanzado ({{ maxImagenes() }} imágenes máx.).</p>
   }
   ```
   > Nota: `onArchivoSeleccionado()` y el backend ya validan el límite como red de seguridad; esto es solo UX.

Fuera de alcance (opcional, no pedido): agregar KPI "Máx. imágenes" en `mi-negocio-vista`.

---

## Verificación

1. **Backend build:** `cd backend && npx tsc --noEmit` limpio.
2. **Frontend build:** `cd frontend && npx tsc --noEmit -p tsconfig.app.json` limpio.
3. **Manual — configurar:** `/dashboard/negocios` → Editar negocio → cambiar "Max. imágenes por producto"
   (p.ej. 5) → Guardar → reabrir y confirmar que persiste.
4. **Manual — ocultar slot:** producto con N imágenes = máximo → tab Imágenes → el slot "Subir" NO
   aparece y se muestra el hint. Subir de máximo (editar negocio a 5) → el slot reaparece.
5. **Crear negocio:** crear uno nuevo con Max. imágenes = 4 → confirmar en BD/relistar que guardó 4 (no el default 3) — valida el fix de `crear()`.

## Tests recomendados

### Unit (Jest — backend) — `backend/src/negocio/negocio.servicio.spec.ts`
- [ ] `crear()` mapea `maxMarcas`, `maxProductos` y `maxImagenesProducto` del DTO al `create()`

### Unit (Jest — frontend)
- [ ] `negocio.servicio` incluye `maxImagenesProducto` en payload crear/actualizar — `frontend/src/app/core/services/negocio.servicio.spec.ts`
- [ ] `puedeSubirImagen()` = false cuando `imagenes().length >= maxImagenes()`; true cuando `maxImagenes` es null — `frontend/.../productos-premium.component.spec.ts`
- [ ] `negocios-lista` incluye el control `maxImagenesProducto` y lo envía al guardar — `frontend/.../negocios-lista.component.spec.ts`

### E2E (Playwright)
- [ ] Editar negocio: cambiar Max. imágenes → persiste tras reabrir — `e2e/tests/XX-negocios/negocio-max-imagenes.spec.ts`
