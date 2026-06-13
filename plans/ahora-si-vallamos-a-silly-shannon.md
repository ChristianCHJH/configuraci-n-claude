# Plan: Suite Completa de Tests — Catálogo + Imágenes + Componentes

## Contexto

Se implementaron varias features en las últimas sesiones (catálogo público Next.js, panel "Mi Página", modal de imágenes de producto, StorageServicio Cloudinary). El CLAUDE.md del proyecto lista un backlog de pruebas pendientes generado automáticamente. El objetivo es escribir TODOS los tests pendientes, sin romper los 87 tests E2E + 141 backend + 139 frontend ya existentes.

**Suite actual (base):** 22 specs E2E (87 tests) · 17 specs backend (141 tests) · 17 specs frontend (~139 tests)  
**Tests a crear:** ~15 archivos nuevos/ampliados, ~85 tests nuevos

---

## Archivos existentes que NO tocar

Estos archivos ya pasan. Solo se amplían si el plan lo indica explícitamente:
- `e2e/tests/04-productos/productos-crud.spec.ts` — tiene botón `pi-globe` Catálogo, no colisiona
- `backend/src/inventario/productos/productos.servicio.spec.ts` — AMPLIAR (agregar métodos imagen)
- `backend/src/negocio/negocio.servicio.spec.ts` — AMPLIAR (agregar paginaConfig)

---

## Bloque 1 — Backend Unit Tests (Jest)

### 1a. NUEVO: `backend/src/storage/storage.servicio.spec.ts`
Mock: cloudinary `uploader.upload`, fs `unlink`. No DI de NestJS — instanciar directo con env vars.

Tests:
- `subirImagen(file, 5)` con STORAGE_PROVIDER=cloudinary → llama upload con folder `inventario-ventas/5/productos`
- `subirImagen(file, 5)` con STORAGE_PROVIDER=cloudinary → retorna `secure_url` del resultado
- `subirImagen(file, 5)` con STORAGE_PROVIDER=cloudinary error → lanza `InternalServerErrorException`
- `subirImagen(file, 3)` con STORAGE_PROVIDER=local → retorna URL con `negocio-3/productos/`

### 1b. NUEVO: `backend/src/publico/publico.servicio.spec.ts`
Mock: `NegocioPaginaConfig`, `Producto`, `Etiqueta` (Sequelize models vía `getModelToken`).

Tests:
- `obtenerConfig('slug-ok')` → retorna config mapeada; excluye campos auditoría
- `obtenerConfig('slug-no-existe')` → lanza `NotFoundException`
- `obtenerProductos('slug-ok')` → retorna solo productos con `visibleCatalogo=true`, `precio NOT NULL`, `eliminado=false`
- `obtenerProductos('slug-no-existe')` → lanza `NotFoundException`
- `obtenerCategorias('slug-ok')` → retorna etiquetas con al menos 1 producto visible
- `obtenerCategorias('slug-no-existe')` → lanza `NotFoundException`

### 1c. AMPLIAR: `backend/src/inventario/productos/productos.servicio.spec.ts`
Agregar suite `describe('Imágenes de producto')`:
- `listarImagenes(productoId, negocioId)` → llama `imagenModelo.findAll` con `where: { productoId, eliminado: false }`
- `agregarImagen(...)` esPrincipal=true → resetea otras imágenes antes de crear
- `agregarImagen(...)` esPrincipal=false → no llama `imagenModelo.update` para reset
- `actualizarImagen(imagenId, dto, usuarioId, negocioId)` → llama `imagen.save()` con campos actualizados
- `eliminarImagen(imagenId, usuarioId, negocioId)` → asigna `eliminado = true`, no DELETE físico

### 1d. AMPLIAR: `backend/src/negocio/negocio.servicio.spec.ts`
Agregar suite `describe('PaginaConfig')`:
- `obtenerPaginaConfig(negocioId)` cuando no existe → crea config con slug=`negocio-{id}`, activo=false
- `obtenerPaginaConfig(negocioId)` cuando existe → retorna config existente sin crear nueva
- `actualizarPaginaConfig(negocioId, dto, usuarioId)` → actualiza campos y `usuarioActualizacion`

---

## Bloque 2 — Frontend Service Unit Tests (Jest)

Patrón: `HttpClientTestingModule`, `httpMock.expectOne(url)`, NO mockear HttpBaseService directo.

### 2a. NUEVO: `frontend/src/app/core/services/mi-pagina-catalogo.servicio.spec.ts`
- `obtener()` → GET `api/negocio/pagina-config`, retorna `PaginaConfig`
- `actualizar(dto)` → PATCH `api/negocio/pagina-config` con payload correcto
- `actualizar(dto)` error 403 → Observable error propagado

### 2b. NUEVO: `frontend/src/app/core/services/producto-imagenes.servicio.spec.ts`
- `listar(7)` → GET `api/inventario/productos/7/imagenes`, retorna array
- `subir(7, file)` → POST `api/inventario/productos/7/imagenes` con FormData
- `subir(7, file, 'alt', true)` → FormData incluye campo `esPrincipal='true'`
- `actualizar(7, 3, datos)` → PATCH `api/inventario/productos/7/imagenes/3`
- `eliminar(7, 3)` → DELETE `api/inventario/productos/7/imagenes/3`

---

## Bloque 3 — Frontend Component Unit Tests (Jest)

Patrón: mock de servicios con `jasmine.createSpyObj` o `jest.fn()`, `TestBed.configureTestingModule`, standalone component con `imports`.

### 3a. NUEVO: `frontend/src/app/features/inventario/marcas-lista/marcas-lista.component.spec.ts`
Mock services: `MarcasInventarioServicio`, `MessageService`, `ConfirmationService`, `NegocioContextoServicio`

Tests:
- Renderiza tabla con datos del servicio mock (listar retorna 2 marcas)
- Botón "Nueva marca" llama `abrirCrear()` → `formularioVisible = true`
- Botón "Editar" llama `abrirEditar(marca)` → formulario con nombre pre-cargado
- Confirmar eliminación llama `servicio.eliminar()` y recarga lista
- Error HTTP en `cargar()` muestra mensaje con `MessageService`

### 3b. NUEVO: `frontend/src/app/features/inventario/etiquetas-lista/etiquetas-lista.component.spec.ts`
Mock services: `EtiquetasInventarioServicio`, `MessageService`, `ConfirmationService`, `NegocioContextoServicio`

Tests:
- Renderiza tabla con punto de color en columna Nombre
- `seleccionarColor('#ff0000')` actualiza signal `colorSeleccionado`
- Botón "Nueva etiqueta" → `formularioVisible = true`
- Confirmar eliminación llama `servicio.eliminar()` y recarga lista
- Error HTTP en `cargar()` muestra toast error

### 3c. NUEVO: `frontend/src/app/features/inventario/productos-lista/productos-lista.component.spec.ts`
Mock services: `ProductosInventarioServicio`, `MarcasInventarioServicio`, `EtiquetasInventarioServicio`, `MessageService`, `ConfirmationService`, `NegocioContextoServicio`

Tests:
- Renderiza todos los productos cuando `etiquetas` es `undefined` (no filtra)
- Chips de etiqueta se renderizan con el color del objeto `Etiqueta`
- Muestra `—` en columna Etiquetas cuando producto no tiene etiquetas asignadas
- Muestra `marcaNombre` (campo literal) en columna Marca

### 3d. NUEVO: `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.spec.ts`
Mock services: `ProductosInventarioServicio`, `ProductoImagenesServicio`, `MessageService`

Tests:
- `ngOnChanges()` con `visible=true` y `productoActual` → llama `listarImagenes()`
- `guardarPrecios()` llama `productosServicio.actualizar()` con precio/visibilidad/orden
- `guardarPrecios()` exitoso → emite output `guardado`
- `subirImagen()` sin archivo seleccionado → no llama `productoImagenesServicio.subir()`
- `eliminarImagen(img)` → llama `servicio.eliminar(productoId, img.id)`
- `onCerrar()` → emite output `cerrar`

---

## Bloque 4 — E2E (Playwright)

**Verificación previa**: correr suite existente con `npx playwright test` para confirmar baseline 87 tests green antes de agregar nuevos.

### 4a. NUEVO: `e2e/tests/13-catalogo/catalogo-mi-pagina.spec.ts`
Page object: `e2e/pages/mi-pagina.page.ts`

Tests:
- Navegar a "Mi Página" → formulario con 4 tabs visible
- Editar `nombrePublico` → guardar → preview actualiza
- Activar catálogo (`activo=true`) → guardar → toast éxito
- Usuario sin `CATALOGO_MI_PAGINA_VER` → ítem no aparece en sidebar

### 4b. NUEVO: `e2e/tests/13-catalogo/catalogo-imagenes.spec.ts`
Page object: ampliar `e2e/pages/productos.page.ts` con métodos `abrirCatalogo(sku)`, `subirImagen(filePath)`, `eliminarImagen(index)`

Tests:
- Abrir modal Catálogo en un producto → dialog visible con tabs precio e imágenes
- Subir imagen → aparece en galería
- Marcar imagen como principal → badge "Principal" visible
- Eliminar imagen → desaparece de galería

### 4c. ACTUALIZAR: `e2e/tests/04-productos/productos-crud.spec.ts`
- Crear producto con etiqueta → lista muestra chip de etiqueta con color
- Crear producto con marca → lista muestra nombre de marca en columna

---

## Orden de ejecución

```
Bloque 1 (backend) → Bloque 2 (frontend services) → Bloque 3 (frontend components) → Bloque 4 (E2E)
```

Cada bloque corre sus tests antes de pasar al siguiente:
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- E2E: `cd e2e && npx playwright test` (requiere backend + frontend corriendo)

---

## Archivos críticos de referencia

| Qué | Ruta |
|-----|------|
| Storage servicio | `backend/src/storage/storage.servicio.ts` |
| Publico servicio | `backend/src/publico/publico.servicio.ts` |
| Productos servicio (con imagen) | `backend/src/inventario/productos/productos.servicio.ts` |
| Negocio servicio (con paginaConfig) | `backend/src/negocio/negocio.servicio.ts` |
| Mi Página servicio (FE) | `frontend/src/app/core/services/mi-pagina-catalogo.servicio.ts` |
| ProductoImagenes servicio (FE) | `frontend/src/app/core/services/producto-imagenes.servicio.ts` |
| Marcas lista component | `frontend/src/app/features/inventario/marcas-lista/marcas-lista.component.ts` |
| Etiquetas lista component | `frontend/src/app/features/inventario/etiquetas-lista/etiquetas-lista.component.ts` |
| Productos lista component | `frontend/src/app/features/inventario/productos-lista/productos-lista.component.ts` |
| Catálogo dialog component | `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.ts` |
| Spec backend referencia | `backend/src/inventario/marcas/marcas.servicio.spec.ts` |
| Spec frontend servicio ref | `frontend/src/app/core/services/marcas-inventario.servicio.spec.ts` |
| Productos E2E page object | `e2e/pages/productos.page.ts` |
| Productos E2E spec existente | `e2e/tests/04-productos/productos-crud.spec.ts` |

---

## Verificación final

1. `cd backend && npm test` → todos los tests green (141 base + ~16 nuevos)
2. `cd frontend && npm test` → todos los tests green (~139 base + ~20 nuevos)
3. `cd e2e && npx playwright test` → 87 tests originales sin regresión + ~10 nuevos
