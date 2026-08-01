# Wizard de creación de producto en 2 pasos

## Contexto

Hoy crear un producto son **dos momentos separados**: el modal "Nuevo producto" solo pide nombre, SKU, descripción, stock mínimo y marca; para poner precio, hacerlo visible en el catálogo, subir fotos o generar variantes hay que cerrar, buscar el producto en la lista y reabrirlo en el modal "Editar" (tabs Producto/Catálogo/Imágenes/Distribución/Variantes). El usuario crea un producto y en la práctica no queda publicado.

El objetivo es que crear un producto sea un solo acto: nombre + precio + **visible en catálogo activado por defecto**, y en el mismo flujo poder subir fotos y elegir colores/tallas.

Hallazgo clave que hace esto barato: **`CrearProductoDto` ya acepta los 11 campos** (precio, precioOferta, visibleCatalogo, destacado, ofertaInicio/Fin) — el modal actual solo manda 5 de ellos (`productos-premium.component.ts:873-879`). Imágenes y variantes, en cambio, **exigen que el producto ya exista** (`agregarImagen` y `generarVariantes` hacen `buscarPorId` primero), por eso el wizard tiene 2 pasos y no 1.

Gotcha que motiva la validación: un producto con `precio = null` **no aparece en el catálogo público** aunque `visible_catalogo = true` (el catálogo filtra `precio: { [Op.not]: null }`). Con "visible ON por defecto" eso produciría productos fantasma.

### Decisiones tomadas
1. Wizard de 2 pasos en el mismo modal. Paso 1 crea el producto; paso 2 (fotos + variantes) es opcional.
2. Incluye precio + visible catálogo + imágenes + variantes. **No** incluye stock inicial por sede.
3. Precio obligatorio si visible = ON → botón bloqueado + mensaje inline.
4. Variantes colapsadas: toggle "¿Tiene tallas o colores?" → colores en fila + desplegable de tipo de talla → solo los chips de ese tipo (hoy se pintan los 5 grupos, ~50 chips).

---

## Arquitectura

`productos-premium.component` ya tiene 1268 TS / 1758 HTML / 1760 CSS y ~90 signals. Meter el wizard in-place duplicaría precio+oferta+vigencia (ya existen como `catPrecio/catVisible/catDestacado`) y obligaría a copiar la subida de imágenes (44 líneas con `concatMap`, límite del plan, primera = principal).

Se extraen **un wizard + dos sub-componentes compartidos** que el modal de editar también consume — así no hay lógica duplicada y el padre encoge a ~950 TS / ~1500 HTML.

| Componente nuevo | Selector | Responsabilidad | Consumido por |
|---|---|---|---|
| `ProductoCrearWizardComponent` | `inv-producto-crear-wizard` | Modal de 2 pasos completo | padre (reemplaza HTML 1626-1755) |
| `ProductoImagenesGaleriaComponent` | `app-producto-imagenes-galeria` | Galería: subir, reordenar, principal, eliminar | wizard paso 2 **y** tab Imágenes del modal editar |
| `ProductoVariantesSelectorComponent` | `app-producto-variantes-selector` | Solo el *generador*: colores + desplegable de talla + chips + botón Generar | wizard paso 2 **y** tab Variantes del modal editar |

**Se queda en el padre, intacto:** `varConfig`, `varEjes`, `variantesAgrupadas`, `varSinEjeCount`, `varEjeNombre`, `toggleEstadoVariante`, `guardarSkuVariante`, `confirmarEliminarVariante`, tab Distribución, tab Catálogo, tabla y KPIs. El spec actual (259 líneas) prueba justamente ese conjunto y no debe requerir cambios.

`atributosTipos` sigue viviendo en el padre (`varEjes` lo necesita y el spec hace `componente.atributosTipos.set(...)`); el selector lo carga y lo emite con `(tiposCargados)`.

---

## Paso 1 — lo esencial

Signals del wizard: `paso: 1|2`, `productoCreado: Producto|null`, `creando`, `wError`, `wNombre`, `wSkuManual`, `wSku`, `wSugieriendoSku`, `wDescripcion`, `wStockMinimo`, `wMarcaId`, `wPrecio`, `wVisible = signal(true)`, `wDestacado`, y para la oferta colapsada `wOfertaAbierta`, `wPrecioOferta`, `wOfertaInicio`, `wOfertaFin`.

El pipeline de autosugerencia de SKU (`Subject` + `debounceTime(500)` + `switchMap(sugerirSku)`, hoy en el constructor del padre, líneas 1195-1207) **se mueve tal cual**.

Payload del POST (`DatosCrearProducto` ya lo soporta, sin tocar el servicio):

```
nombre, sku (solo si wSkuManual), descripcion|null, stockMinimo, marcaId,
precio, visibleCatalogo: wVisible(), destacado,
precioOferta: tieneOferta() ? v : null,
ofertaInicio/ofertaFin: ISO o null
```

Verificado: `validarVigenciaOferta` (backend `productos.servicio.ts:148`) solo entra si `precioOferta` no es null/undefined → mandar `precioOferta: null` es seguro.

**Dos salidas**, un método privado `ejecutarCrear(continuar: boolean)`:
- **"Crear y continuar"** → guarda el producto devuelto, `paso.set(2)`, emite `creado`.
- **"Crear y salir"** → emite `creado` + `cerrado`.

En ambos casos `creado.emit(p)` se dispara **inmediatamente tras el 201** y el padre hace `this.cargar()`. La tabla queda actualizada aunque el usuario abandone el paso 2. Ojo: el `guardarNuevoProducto()` actual descarta la respuesta (`next: () => …`, línea 885) — el wizard **debe** capturar el `id`.

### Validación precio-si-visible
- `precioValido = p != null && p > 0`
- `requierePrecio = computed(() => wVisible() && !precioValido())`
- `puedeCrear = computed(() => nombreValido() && !requierePrecio() && !vigenciaInvalida())` → `[disabled]` en ambos botones.
- Mensaje inline permanente bajo el campo Precio reusando `.cat-field-error`: *"Un producto visible en el catálogo necesita precio."* Al apagar el toggle desaparece solo (es computed).

---

## Paso 2 — fotos y variantes

Al entrar solo hay lecturas: la galería carga imágenes + `maxImagenesProducto`; **los atributos no se piden** hasta que el usuario abra el toggle de variantes.

Cada acción persiste al instante (subir foto → `POST /:id/imagenes`; Generar → `POST /variantes/producto/:id/generar`). El botón final **"Listo" no dispara ninguna llamada**: solo cierra. Eso elimina los errores "todo o nada".

### Sección variantes (colapsada)

```
⌄ ¿Tiene tallas o colores?      (opcional · genera una versión por combinación)
   Colores   ● Rojo  ● Azul  ● Negro …
   Talla     [ Sin talla ▾ ]   ← select: Ropa adulto / Calzado adulto / Bebé / …
   Chips     38  39  40  41 …   ← solo del tipo elegido
   ──────────────────────────
   [ 6 combinaciones ]        [ Generar variantes ]
```

API: `input productoId` (required), `input colapsable = true`, `output tiposCargados`, `output generado`.

- `tiposColor = tipos().filter(t => t.tipoDato === 'color')`, `tiposTalla = filter(t => t.tipoDato !== 'color')` — mismo criterio que ya usan `tallaTipoActivoId` (TS:217) y el backend (`variantes.servicio.ts:214`).
- `setTallaTipo(id)` limpia de `varSeleccion` los valores del tipo de talla anterior → la regla "una sola talla" queda garantizada **por construcción**. `tallaTipoActivoId`/`tipoBloqueado` se conservan como red de seguridad.
- Se reutilizan sin cambios de lógica: `toggleValorVariante`, `isValorSeleccionado`, `seleccionTotal()`, `generarVariantes()`.
- **El modal editar usa el mismo componente** con `[colapsable]="false"` (siempre expandido, sin fila de toggle). El problema de los ~50 chips es idéntico allí; mantener dos UIs sería peor.

### Galería de imágenes
Se **mueve** (no se copia) todo el bloque actual: `cargarImagenes`, `onArchivoSeleccionado` (concatMap secuencial, primera = principal, recorte por `maxImagenes()`), `imgMarcarPrincipal`, `imgEliminar`, `onImagenDrop` con rollback, `cargarLimiteNegocio`, `puedeSubirImagen`, `imagenPrincipal`, HTML 613-691 y el CSS `.cat-img-*` / `.cat-upload-slot*`.

Ajustes: `productoId` pasa a `input.required<number>()` con un `effect` que dispara la carga; el `id="catFileInput"` fijo pasa a id único por instancia (habrá dos consumidores); el límite lo consulta el propio componente.

---

## Manejo de errores y cierre

| Fallo | Qué ve el usuario |
|---|---|
| POST paso 1 | `wError` inline, sigue en paso 1, campos intactos |
| Subida de imagen | Snack de error + recarga desde servidor (rollback ya implementado) — el producto ya existe, se reintenta ahí mismo |
| `generarVariantes` 400 | Snack con `err.error.mensaje`; **`varSeleccion` se conserva** para corregir y reintentar |

Cierre a mitad:
- Paso 1 con datos escritos → `ConfirmDialogComponent` "¿Descartar el producto nuevo?" (mismo patrón que `cerrarCatalogo`, TS:476).
- Paso 2 → cierra sin confirmación + snack *"Producto creado. Puedes agregar fotos y variantes cuando quieras desde Editar."* (todo ya está persistido).
- Si `creando()` o una subida están en curso, el cierre se ignora.

---

## Backend — un solo cambio

`backend/src/inventario/productos/productos.servicio.ts`: `private validarPrecioSiVisible(visible, precio)` → `BadRequestException('Un producto visible en el catálogo debe tener precio.')` cuando `visible && precio == null`. Va en el servicio, no en el DTO: es una regla cruzada y `validarVigenciaOferta` (:148) es el precedente exacto en el mismo archivo.

- En `crear()`: siempre.
- En `actualizar()`: **solo en la transición** — evaluar únicamente si el PATCH trae `visibleCatalogo: true` o `precio: null`, calculando el valor efectivo (`dto.X !== undefined ? dto.X : producto.X`). Así los productos legacy con `visible=true, precio=null` no revientan al editar cualquier otro campo.
- Umbral `precio == null` (espeja el filtro del catálogo). El `> 0` vive solo en la UX.

**No se toca:** el default `visibleCatalogo ?? false` (línea 65) se queda — el "ON por defecto" es decisión de UI y el wizard siempre manda el campo explícito; cambiarlo afectaría API, seeds e integraciones. Tampoco endpoint compuesto (las imágenes son multipart) ni transacción en `crear()` (es un solo `create()`). La falta de transacción en `generarVariantes` es deuda preexistente: anotarla, no arreglarla aquí.

DTOs, rutas y permisos sin cambios — `INVENTARIO_PRODUCTOS_CREAR`, `INVENTARIO_PRODUCTOS_CATALOGO` e `INVENTARIO_VARIANTES_GESTIONAR` ya existen. El botón que abre el wizard conserva su `*appPermiso="'INVENTARIO_PRODUCTOS_CREAR'"`.

---

## Archivos

### Nuevos
- `frontend/src/app/features/inventario/productos-premium/producto-crear-wizard/producto-crear-wizard.component.{ts,html,css}`
- `frontend/src/app/shared/components/producto-imagenes-galeria/producto-imagenes-galeria.component.{ts,html,css}`
- `frontend/src/app/shared/components/producto-variantes-selector/producto-variantes-selector.component.{ts,html,css}`
- `frontend/src/app/shared/utils/oferta-vigencia.ts` — helpers puros `localDate/parseDate/inicioDiaISO/finDiaISO/diasVigencia` extraídos del padre (TS:402-420) para no tener una tercera copia.

### Modificados
- `frontend/.../productos-premium.component.ts` — borra los 10 signals `crear*` + su pipeline + los 6 métodos de crear; el bloque de imágenes; y del generador de variantes `varSeleccion`, `toggleValorVariante`, `isValorSeleccionado`, `seleccionTotal`, `generarVariantes`, `cargarAtributos`, `tallaTipoActivoId`, `tipoBloqueado`. Añade `onWizardCreado(p)` → `this.cargar()`. Conserva `crearVisible` y `atributosTipos`.
- `frontend/.../productos-premium.component.html` — 1626-1755 → `<inv-producto-crear-wizard>`; 613-691 → `<app-producto-imagenes-galeria [productoId]="…">`; el grid de atributos → `<app-producto-variantes-selector [colapsable]="false" (generado)="varConfig.set($event)">`.
- `frontend/.../productos-premium.component.css` — mueve `.crear-modal*`, `.cat-img-*`, `.cat-upload-slot*`, `.var-atrib-*`, `.var-valor-chip*` a los hijos. **Ojo:** `.var-color-swatch*` lo usa también la tabla agrupada del padre → duplicar esas ~6 líneas en el selector y dejar la del padre.
- `backend/src/inventario/productos/productos.servicio.ts` — `validarPrecioSiVisible`.
- `e2e/pages/productos.page.ts` — **está obsoleto**: busca `.p-dialog`, `input.sku-field` y botón "Guardar", que ya no existen. Actualizar selectores y añadir `crearProductoRapido(nombre, precio)` + `avanzarAPaso2()`.

---

## Secuenciación

1. `oferta-vigencia.ts` + spec (sin riesgo, desbloquea el resto).
2. `ProductoImagenesGaleriaComponent`: mover y enchufar en el **tab Imágenes del modal editar**; verificar que editar sigue igual.
3. `ProductoVariantesSelectorComponent` con `[colapsable]="false"` en el tab Variantes; verificar spec del padre + E2E de variantes en verde.
4. `ProductoCrearWizardComponent` paso 1 + validación de precio.
5. Paso 2 = composición de 2 y 3, ya probados.
6. Validación backend + tests.
7. `productos.page.ts` + E2E nuevo.

Los pasos 2 y 3 son refactor puro contra la UI vieja: si algo se rompe, se detecta antes de que el wizard entre en escena.

---

## Verificación

```bash
# frontend
cd frontend && npx tsc --noEmit && npm run build
npx jest --testPathPattern "producto-crear-wizard|producto-variantes-selector|productos-premium|oferta-vigencia"

# backend
cd backend && npm run build
npx jest --testPathPattern productos.servicio

# e2e
cd e2e && npx playwright test tests/04-productos
```

Prueba manual end-to-end en la app levantada:
1. Productos → "Nuevo producto" → escribir solo nombre → los botones de crear están bloqueados y se ve el mensaje de precio.
2. Apagar "Visible en catálogo" → se desbloquea. Volver a encender, poner precio → se desbloquea igual.
3. "Crear y continuar" → paso 2: la sección de variantes está **cerrada**; abrirla muestra colores y **ningún** chip de talla hasta elegir el tipo en el desplegable.
4. Elegir 2 colores + 2 tallas → la pill dice "4 combinaciones" → Generar.
5. Subir 2 fotos → la primera queda con ★ Principal.
6. "Listo" → el producto aparece en la lista con su precio y marcado como visible; abrirlo en el catálogo público y confirmar que se ve.
7. Repetir con "Crear y salir" y confirmar que el producto igual queda en la lista con precio.

---

## Tests recomendados

### Unit tests (Jest — frontend)
- [ ] `wVisible` arranca en `true` — `frontend/src/app/features/inventario/productos-premium/producto-crear-wizard/producto-crear-wizard.component.spec.ts`
- [ ] `requierePrecio` true con visible ON y precio nulo → `puedeCrear` false — mismo archivo
- [ ] Apagar `wVisible` desbloquea `puedeCrear` sin precio — mismo archivo
- [ ] El payload del POST incluye `precio`, `visibleCatalogo: true`, `destacado` y `precioOferta: null` sin oferta — mismo archivo
- [ ] "Crear y continuar": `paso()` = 2, `productoCreado()` guarda el id, `creado` emitió — mismo archivo
- [ ] "Crear y salir": emiten `creado` **y** `cerrado`, `paso()` sigue en 1 — mismo archivo
- [ ] Error del POST: `wError` seteado, campos intactos — mismo archivo
- [ ] `intentarCerrar()` en paso 1 con datos abre ConfirmDialog; en paso 2 cierra directo — mismo archivo
- [ ] Colapsable: cerrado con `colapsable=true`, expandido con `false` — `frontend/src/app/shared/components/producto-variantes-selector/producto-variantes-selector.component.spec.ts`
- [ ] Abrir el toggle llama `listarTipos()` una sola vez — mismo archivo
- [ ] Sin tipo de talla elegido no se renderiza ningún chip de talla — mismo archivo
- [ ] `setTallaTipo(B)` limpia los valores del tipo A en `varSeleccion` — mismo archivo
- [ ] `seleccionTotal()` = colores × tallas; 0 sin selección — mismo archivo
- [ ] `generarVariantes()` envía `{ valoresPorAtributo: [...] }` y conserva la selección si falla — mismo archivo
- [ ] `diasVigencia` 15 OK / 16 excede; `finDiaISO` cae a 23:59:59 local — `frontend/src/app/shared/utils/oferta-vigencia.spec.ts`

### Unit tests (Jest — backend)
- [ ] `crear()` con `visibleCatalogo: true, precio: null` lanza `BadRequestException` — `backend/src/inventario/productos/productos.servicio.spec.ts`
- [ ] `crear()` con `visibleCatalogo: true, precio: 29.9` pasa — mismo archivo
- [ ] `crear()` con `visibleCatalogo: false, precio: null` pasa — mismo archivo
- [ ] `crear()` sin `visibleCatalogo` sigue guardando `false` (protege el default) — mismo archivo
- [ ] `actualizar()` con `{ visibleCatalogo: true }` sobre producto sin precio lanza 400 — mismo archivo
- [ ] `actualizar()` con `{ nombre }` sobre producto legacy (`visible=true, precio=null`) **no** lanza — mismo archivo

### E2E (Playwright)
- [ ] Camino rápido: nombre + precio → "Crear y salir" → aparece en la tabla con precio y visible — `e2e/tests/04-productos/crear-wizard.spec.ts`
- [ ] Bloqueo de precio: visible ON sin precio → botones deshabilitados + error inline; al escribir precio se habilitan — mismo spec
- [ ] Visible OFF sin precio → se puede crear — mismo spec
- [ ] Camino completo: "Crear y continuar" → paso 2, variantes colapsadas, cero chips de talla hasta elegir tipo, 2 colores + 2 tallas = "4 combinaciones" → Generar (201) — mismo spec
- [ ] Persistencia: crear, cerrar en paso 2 sin hacer nada → el producto sigue en la lista con su precio — mismo spec
- [ ] Subir imagen en paso 2 (`setInputFiles` con fixture) → 201 + badge "★ Principal" en la primera miniatura — mismo spec
