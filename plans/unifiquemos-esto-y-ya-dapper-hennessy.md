# Unificar logo + favicon en una sola imagen subida

## Context

Hoy la pestaña **Identidad** de "Mi Página" (admin Angular) tiene dos inputs de texto separados —
**URL del logo** y **URL del favicon**— donde el usuario debe pegar URLs externas manualmente.
Esto es incómodo y propenso a error (hay que hospedar la imagen en otro lado).

El usuario quiere:
1. **Unificar** ambos campos en uno solo.
2. Que ya **no sea una URL sino una imagen subida** (upload de archivo).
3. Que **la misma imagen del logo se use también como favicon**.

Decisión confirmada: **colapsar a una sola columna `logo_url`**; el favicon del catálogo se
deriva de `logoUrl`. Se elimina `favicon_url` de todo el stack.

Ya existe infraestructura reutilizable:
- `StorageServicio` (`backend/src/storage/storage.servicio.ts`) con `subirImagen(file, negocioId, carpeta)`
  y `eliminarImagen(url)`, que ya soporta local **y** Cloudinary según `STORAGE_PROVIDER`.
- `NegocioModulo` **ya importa** `StorageModulo`, así que `StorageServicio` es inyectable en `NegocioServicio` sin cambios de wiring.
- El patrón de upload con Multer está en `backend/src/inventario/productos/productos.controlador.ts` (`multerStorage` + `FileInterceptor('archivo')`).
- El patrón de uploader inline (file input oculto + preview + estado "subiendo") está en `productos-premium.component` (`onArchivoSeleccionado`).
- El permiso `CATALOGO_MI_PAGINA_EDITAR` ya existe y protege el PATCH actual — **se reutiliza**, no se crea permiso nuevo.

---

## Backend (NestJS)

### 1. Quitar `faviconUrl` del modelo
- `backend/src/negocio/entidades/negocio-pagina-config.entidad.ts` — eliminar la columna `faviconUrl` (`field: 'favicon_url'`).
- `backend/src/negocio/dto/actualizar-pagina-config.dto.ts` — eliminar el campo `faviconUrl`.
- `backend/src/publico/dto/config-publica.dto.ts` — eliminar `faviconUrl` (línea 23).
  - La config pública se devuelve con `config.toJSON()` en `publico.servicio.ts:52`, así que **no hay mapping manual que tocar**: al quitar la columna del entity, desaparece del payload automáticamente.
- `backend/src/negocio/negocio.servicio.ts` — quitar cualquier referencia a `faviconUrl` en `actualizarPaginaConfig` (el `...dto` spread ya no la traerá).

### 2. Nuevos endpoints de imagen del logo
En `backend/src/negocio/negocio.controlador.ts`:
- Definir un `multerStorage` (copiar el de `productos.controlador.ts` líneas 31-41) con destino
  `uploads/negocio-${negocioId}/pagina-config` (lee `req['negocioId']`, igual que productos).
- `POST pagina-config/logo` — `@Permisos('CATALOGO_MI_PAGINA_EDITAR')`, `@UseInterceptors(FileInterceptor('archivo', { storage: multerStorage }))`, `@ApiConsumes('multipart/form-data')`. Llama `negocioServicio.actualizarLogo(negocioId, file, usuarioId)`.
- `DELETE pagina-config/logo` — mismo permiso. Llama `negocioServicio.quitarLogo(negocioId, usuarioId)`.

En `backend/src/negocio/negocio.servicio.ts` (inyectar `StorageServicio`):
```ts
async actualizarLogo(negocioId, file, usuarioId) {
  const config = await this.obtenerPaginaConfig(negocioId); // reutilizar el findOne existente
  const url = await this.storage.subirImagen(file, negocioId, 'pagina-config');
  if (config.logoUrl) await this.storage.eliminarImagen(config.logoUrl); // limpia el anterior
  return config.update({ logoUrl: url, fechaActualizacion: new Date(), usuarioActualizacion: usuarioId });
}
async quitarLogo(negocioId, usuarioId) {
  const config = await this.obtenerPaginaConfig(negocioId);
  if (config.logoUrl) await this.storage.eliminarImagen(config.logoUrl);
  return config.update({ logoUrl: null, fechaActualizacion: new Date(), usuarioActualizacion: usuarioId });
}
```
Ambos devuelven la `PaginaConfig` actualizada (para que el front sincronice).

### 3. Base de datos
- Crear `database/migrations/038-quitar-favicon-url.sql` idempotente:
  `ALTER TABLE negocio_pagina_config DROP COLUMN IF EXISTS favicon_url;`
- Actualizar `database/setup-completo.sql`: eliminar la línea `favicon_url VARCHAR(500),` del `CREATE TABLE negocio_pagina_config` (≈línea 618) y actualizar la cabecera `-- Última actualización: … (migración 038 — quitar favicon_url)`.

---

## Frontend admin (Angular — `features/catalogo/mi-pagina`)

### `mi-pagina-catalogo.servicio.ts`
- Quitar `faviconUrl` de `PaginaConfig` y `ActualizarPaginaConfig`.
- Agregar:
  - `subirLogo(file: File): Observable<PaginaConfig>` → POST `api/negocio/pagina-config/logo` con `FormData` (`archivo`).
  - `quitarLogo(): Observable<PaginaConfig>` → DELETE `api/negocio/pagina-config/logo`.

### `mi-pagina.component.ts`
- Eliminar el control `faviconUrl` del `form` y quitarlo del payload de `guardar()`.
- Mantener `logoUrl` en el form (se sigue usando para la preview reactiva), pero ahora se setea vía upload, no por texto.
- Agregar señales `subiendoLogo = signal(false)` y handlers:
  - `onLogoSeleccionado(e)` → toma `files[0]`, llama `servicio.subirLogo(file)`, al éxito `form.patchValue({ logoUrl: cfg.logoUrl })`, `config.set(cfg)`, snackbar; resetea el input.
  - `quitarLogo()` → `servicio.quitarLogo()`, al éxito `form.patchValue({ logoUrl: null })`.
  - Reusar el patrón de `onArchivoSeleccionado` de `productos-premium.component.ts` como referencia.

### `mi-pagina.component.html` (líneas 114-133)
- Reemplazar los **dos** bloques `.field` de logo/favicon por **un solo** bloque "Logo":
  - Label "Logo" con hint: *"Se usa en el encabezado y como ícono (favicon) de la pestaña del navegador."*
  - Si `logoUrl` existe: thumbnail preview + botón "Cambiar" + botón "Quitar".
  - Si no: dropzone/botón "Subir imagen".
  - `<input type="file" accept="image/*" hidden (change)="onLogoSeleccionado($event)">`.
  - Mantener el botón "ojo" de preview (`destacar('navbar-logo')`).
- En la preview del navegador (líneas 424-437), la mini-favicon pasa a usar `previewData().logoUrl` en vez de `faviconUrl`.

### `mi-pagina.component.css`
- Conservar clases (`.browser-favicon`, etc.); solo agregar estilos del uploader si hace falta. No hay lógica de favicon que romper.

> Nota: `frontend/src/index.html` tiene su propio `<link rel="icon">` (favicon de la app admin, no del catálogo) — **fuera de alcance**, no tocar.

---

## Catálogo público (Next.js — `catalogo/`)

- `lib/types.ts` — quitar `faviconUrl` de `NegocioConfig` (línea 12).
- `lib/mock-data.ts` — quitar las claves `faviconUrl` (líneas 14, 75).
- `app/[slug]/page.tsx` (línea 64) y `app/[slug]/producto/[id]/page.tsx` (línea 116) — en `generateMetadata`, cambiar el icon para derivarlo del logo:
  `icons: config.logoUrl ? { icon: config.logoUrl } : undefined`.
- El Navbar (`components/catalogo/Navbar.tsx`) ya usa `config.logoUrl` — sin cambios.

---

## Verificación

1. **Build/typecheck**
   - Backend: `cd backend && npm run build`.
   - Frontend: `cd frontend && npx tsc --noEmit -p tsconfig.app.json`.
   - Catálogo: `cd catalogo && npx tsc --noEmit`.
2. **Migración**: aplicar `038-quitar-favicon-url.sql` en la BD de dev y confirmar que `negocio_pagina_config` ya no tiene `favicon_url`.
3. **Flujo admin**: en "Mi Página" → Identidad, subir una imagen → verificar que aparece en la preview del navbar **y** en la mini-pestaña del navegador; recargar y confirmar que persiste; "Quitar" la borra.
4. **Catálogo público**: abrir `/{slug}` → el logo se ve en el navbar y el favicon de la pestaña usa esa misma imagen (`view-source`/DevTools → `<link rel="icon">`).
5. **Storage**: verificar que el archivo quede en `uploads/negocio-{id}/pagina-config/` (local) o en Cloudinary si `STORAGE_PROVIDER=cloudinary`, y que al reemplazar/quitar se elimine el anterior.
6. **Riesgo a validar**: que `req['negocioId']` esté poblado en la ruta `POST negocio/pagina-config/logo` antes de que corra el `multerStorage` (igual que en productos, vía guard). Si no lo estuviera, el archivo caería en `negocio-0/`; ajustar tomando el negocio del token en el guard/interceptor.

## Tests recomendados (según CLAUDE.md)

### Unit — Backend (Jest)
- `negocio.servicio.spec.ts`: `actualizarLogo()` guarda `logoUrl` con la URL de `StorageServicio` y borra la anterior; `quitarLogo()` deja `logoUrl = null` y llama `eliminarImagen`.

### Unit — Frontend (Jest)
- `mi-pagina-catalogo.servicio.spec.ts`: `subirLogo()` hace POST `api/negocio/pagina-config/logo` con FormData; `quitarLogo()` hace DELETE.
- `mi-pagina.component.spec.ts`: al subir, `form.logoUrl` se actualiza con la respuesta; "Quitar" lo pone en null; muestra error con snackbar en fallo HTTP.

### E2E (Playwright)
- Mi Página: subir imagen de logo → preview muestra logo + favicon → guardar → recargar persiste → quitar imagen.
