# Plan F7 — Modal "Catálogo" de producto (precios + visibilidad + imágenes)

## Contexto

F1–F6 del catálogo público están completas. F7 introduce un nuevo modal **"Catálogo"** accesible desde la lista de productos mediante un botón dedicado. Este modal concentra todo lo relacionado con la presencia del producto en el catálogo público: precios, visibilidad y galería de imágenes.

**Cambio UX clave:** Los campos `precio`, `precioOferta`, `visibleCatalogo` y `ordenCatalogo` se **mueven** del dialog de edición actual a este nuevo modal. El dialog de edición queda solo con datos básicos (nombre, SKU, descripción, stock mínimo, marca, etiquetas).

**Storage imágenes:** dev = multer → `backend/uploads/productos/` (git-ignored) | prod = Cloudinary. Seleccionado por `STORAGE_PROVIDER=local|cloudinary`.

---

## Archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `backend/src/storage/storage.modulo.ts` | Crear |
| `backend/src/storage/storage.servicio.ts` | Crear |
| `backend/src/inventario/productos/productos.modulo.ts` | Modificar — importar StorageModulo |
| `backend/src/inventario/productos/productos.servicio.ts` | Modificar — agregar métodos imagen |
| `backend/src/inventario/productos/productos.controlador.ts` | Modificar — agregar endpoints imagen |
| `backend/src/inventario/productos/dto/agregar-imagen.dto.ts` | Crear |
| `backend/src/inventario/productos/dto/actualizar-imagen.dto.ts` | Crear |
| `backend/src/app.modulo.ts` | Modificar — ServeStaticModule |
| `backend/.gitignore` | Modificar — agregar `uploads/` |
| `frontend/src/app/core/services/producto-imagenes.servicio.ts` | Crear |
| `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.ts` | Crear |
| `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.html` | Crear |
| `frontend/src/app/features/inventario/productos-lista/productos-lista.component.ts` | Modificar — mover campos + lógica dialog |
| `frontend/src/app/features/inventario/productos-lista/productos-lista.component.html` | Modificar — botón catálogo + remover campos |

**No tocar:**

- `backend/src/inventario/productos/entidades/producto-imagen.entidad.ts` — ya existe y está bien
- `backend/src/inventario/productos/entidades/producto.entidad.ts` — ya tiene precio, precioOferta, visibleCatalogo, ordenCatalogo

---

## Paso 1 — Backend: instalar dependencias

```bash
cd backend && npm install multer @types/multer cloudinary
```

Verificar si `@nestjs/serve-static` ya existe en `package.json`; si no, instalarlo.

Vars nuevas en `.env` y `.env.example`:

```
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads/productos
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Agregar `uploads/` a `backend/.gitignore`.

---

## Paso 2 — Backend: StorageServicio

**`backend/src/storage/storage.servicio.ts`**

```typescript
@Injectable()
export class StorageServicio {
  async subirImagen(file: Express.Multer.File): Promise<string>
  // STORAGE_PROVIDER=local  → '/uploads/productos/${file.filename}'
  // STORAGE_PROVIDER=cloudinary → cloudinary.uploader.upload(file.path) → secure_url
}
```

**`backend/src/storage/storage.modulo.ts`** — exporta `StorageServicio`.

**`backend/src/app.modulo.ts`** — agregar `ServeStaticModule.forRoot({ rootPath: join(__dirname,'..','..','uploads'), serveRoot: '/uploads' })` (solo cuando `STORAGE_PROVIDER=local`).

---

## Paso 3 — Backend: DTOs

**`agregar-imagen.dto.ts`:** `alt?: string`, `orden?: number`, `esPrincipal?: boolean`

**`actualizar-imagen.dto.ts`:** idem

---

## Paso 4 — Backend: métodos en ProductosServicio

```typescript
listarImagenes(productoId: number, negocioId: number): Promise<ProductoImagen[]>

agregarImagen(productoId, file, dto, usuarioId, negocioId): Promise<ProductoImagen>
// Si esPrincipal=true → UPDATE SET esPrincipal=false WHERE productoId AND id != nueva

actualizarImagen(imagenId, dto, usuarioId, negocioId): Promise<ProductoImagen>
// Mismo manejo de esPrincipal

eliminarImagen(imagenId, usuarioId, negocioId): Promise<void>
// eliminado = true — nunca DELETE físico
```

---

## Paso 5 — Backend: endpoints en ProductosControlador

```
GET    /inventario/productos/:id/imagenes            @Permisos('CATALOGO_PRODUCTO_IMAGEN_VER')
POST   /inventario/productos/:id/imagenes            @Permisos('CATALOGO_PRODUCTO_IMAGEN_SUBIR') + FileInterceptor('archivo')
PATCH  /inventario/productos/:id/imagenes/:imagenId  @Permisos('CATALOGO_PRODUCTO_IMAGEN_SUBIR')
DELETE /inventario/productos/:id/imagenes/:imagenId  @Permisos('CATALOGO_PRODUCTO_IMAGEN_ELIMINAR')
```

POST usa `multer diskStorage` — destino `uploads/productos/`, filename `${Date.now()}-${originalname}`.

---

## Paso 6 — Frontend: ProductoImagenesServicio

**`frontend/src/app/core/services/producto-imagenes.servicio.ts`**

```typescript
export interface ProductoImagen { id: number; url: string; alt: string|null; orden: number; esPrincipal: boolean; }

@Injectable({ providedIn: 'root' })
export class ProductoImagenesServicio {
  listar(productoId: number): Observable<ProductoImagen[]>
  subir(productoId: number, archivo: File, alt?: string, esPrincipal?: boolean): Observable<ProductoImagen>
  // Envía FormData con campo 'archivo'
  actualizar(productoId: number, imagenId: number, datos: Partial<ActualizarImagen>): Observable<ProductoImagen>
  eliminar(productoId: number, imagenId: number): Observable<void>
}
```

Usa `HttpBaseService` — no desempaquetar envelope manualmente.

---

## Paso 7 — Frontend: CatalogoProductoDialog

**Ruta:** `features/inventario/productos-lista/catalogo-producto-dialog/`

**Inputs:** `productoId`, `productoNombre`, `visible`, `productoActual: Producto`

**Output:** `cerrar`, `guardado` (emite cuando guarda precios/visibilidad)

**Layout del dialog — dos secciones sin tabs (scroll vertical):**

### Sección A: Precios y visibilidad (MOVIDA del dialog de edición)

Gated por permisos `CATALOGO_PRODUCTO_PRECIO_EDITAR` y `CATALOGO_PRODUCTO_VISIBILIDAD`.

- `precio` — input number (2 decimales)
- `precioOferta` — input number (2 decimales), opcional
- `visibleCatalogo` — toggle (p-toggleButton o p-inputSwitch)
- `ordenCatalogo` — input number, opcional

Guardar con `PATCH /inventario/productos/:id` (mismo endpoint existente, solo envía esos 4 campos).

### Sección B: Galería de imágenes

Gated por `CATALOGO_PRODUCTO_IMAGEN_VER`.

- Lista de imágenes: thumbnail 80×80px + alt + badge "Principal"
  - Botón `pi-star` → marcar principal (gated `CATALOGO_PRODUCTO_IMAGEN_SUBIR`)
  - Botón `pi-trash` → soft delete (gated `CATALOGO_PRODUCTO_IMAGEN_ELIMINAR`)
- Upload (gated `CATALOGO_PRODUCTO_IMAGEN_SUBIR`):
  - `<input type="file" accept="image/*">` + campo alt + checkbox "Principal" + botón Subir
- Estado vacío: "Sin imágenes"
- Spinner mientras carga/sube

---

## Paso 8 — Frontend: modificar dialog de edición actual

En `productos-lista.component.html` **eliminar** del dialog existente:

- Campo `precio`
- Campo `precioOferta`
- Toggle `visibleCatalogo` (con su condicional de permiso)
- Campo `ordenCatalogo`

En `productos-lista.component.ts` **modificar** el `formulario`:

- Remover: `precio`, `precioOferta`, `visibleCatalogo`, `ordenCatalogo`
- El DTO de actualizar solo enviará los campos restantes

---

## Paso 9 — Frontend: botón "Catálogo" en productos-lista

Icono propuesto: `pi-globe` o `pi-shopping-bag`. Label tooltip: "Catálogo".

Agregar en **dos lugares** (desktop tabla Y mobile cards):

```html
<button *appPermiso="'CATALOGO_PRODUCTO_IMAGEN_VER'"
        type="button" class="icon"
        pTooltip="Catálogo" tooltipPosition="top"
        (click)="abrirCatalogo(p)">
  <i class="pi pi-globe"></i>
</button>
```

En `productos-lista.component.ts`:

```typescript
productosCatalogoActivo = signal<Producto | null>(null);
catalogoVisible = signal<boolean>(false);

abrirCatalogo(p: Producto) {
  this.productosCatalogoActivo.set(p);
  this.catalogoVisible.set(true);
}
```

`<app-catalogo-producto-dialog>` al final del template.

---

## Verificación

1. Backend compila sin errores TypeScript
2. `GET /inventario/productos/:id/imagenes` retorna array vacío
3. `POST .../imagenes` con `multipart/form-data archivo=<file>` retorna imagen, URL accesible en `http://localhost:3200/uploads/productos/<filename>`
4. Dialog de edición ya **no muestra** precio/precioOferta/visibilidad
5. Botón `pi-globe` aparece en lista — desktop Y mobile
6. Dialog Catálogo abre mostrando: sección precios + sección galería
7. Guardar precios → `PATCH` exitoso → datos actualizados
8. Subir imagen → thumbnail aparece en galería
9. Marcar principal → badge se mueve a la nueva imagen
10. Eliminar imagen → desaparece de la lista (soft delete verificado en BD)

---

## Tests recomendados

### Unit — Backend

- [ ] `listarImagenes()` retorna solo `eliminado=false` del producto correcto
- [ ] `agregarImagen()` con `esPrincipal=true` desmarca las otras imágenes
- [ ] `eliminarImagen()` setea `eliminado=true`, no DELETE físico

### Unit — Frontend

- [ ] `ProductoImagenesServicio.subir()` envía `FormData` con campo `archivo`
- [ ] `CatalogoProductoDialog` sección precios no renderiza si no tiene `CATALOGO_PRODUCTO_PRECIO_EDITAR`
- [ ] Guardar precios llama `PATCH /inventario/productos/:id` con solo los 4 campos del catálogo
- [ ] Eliminar imagen llama `servicio.eliminar()` y recarga la lista
