# Plan: Imágenes hero múltiples + límite configurable por negocio

## Context
El campo "URL imagen hero" (string único) se reemplaza por un sistema de múltiples imágenes
en el hero del catálogo. El límite de imágenes hero se configura por negocio en la pantalla de
administración de negocios (igual que `max_usuarios`, `max_sedes`, etc.). Las imágenes se suben a Cloudinary en producción (`STORAGE_PROVIDER=cloudinary`, carpeta
`inventario-ventas/{negocioId}/pagina/cabecera`). En local (`STORAGE_PROVIDER=local`) el
archivo queda en disco del backend (`uploads/negocio-{id}/pagina/cabecera/`) y se sirve
como estático — sin dependencia externa. `StorageServicio` ya maneja ambos modos.

---

## Cambios por capa

### A. Base de datos — 2 cambios

**1. Columna `max_imagenes_hero` en tabla `negocio`**
```sql
ALTER TABLE negocio ADD COLUMN max_imagenes_hero SMALLINT NOT NULL DEFAULT 3;
```

**2. Nueva tabla `pagina_hero_imagen`** (patrón idéntico a `producto_imagen`)
```sql
CREATE TABLE pagina_hero_imagen (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pagina_config_id      BIGINT NOT NULL REFERENCES negocio_pagina_config(id),
    url                   VARCHAR(500) NOT NULL,
    alt                   VARCHAR(200),
    orden                 INTEGER NOT NULL DEFAULT 0,
    es_principal          BOOLEAN NOT NULL DEFAULT false,
    usuario_creacion      BIGINT NOT NULL,
    usuario_actualizacion BIGINT NOT NULL,
    fecha_creacion        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado                BOOLEAN NOT NULL DEFAULT true,
    eliminado             BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_pagina_hero_imagen_config ON pagina_hero_imagen(pagina_config_id);
CREATE INDEX idx_pagina_hero_imagen_orden  ON pagina_hero_imagen(pagina_config_id, orden);
```

`hero_imagen_url` en `negocio_pagina_config` queda deprecated pero NO se elimina (backwards compat).

**Archivos a actualizar:**
- `database/migrations/NNN-pagina-hero-imagenes.sql` — idempotente con IF NOT EXISTS
- `database/setup-completo.sql` — integrar ambos cambios

---

### B. Backend

#### B1. `StorageServicio` — `backend/src/storage/storage.servicio.ts`
Agregar param `carpeta` con default `'productos'` (no rompe código existente):
```typescript
async subirImagen(file, negocioId, carpeta = 'productos'): Promise<string>
// Cloudinary folder: `inventario-ventas/${negocioId}/${carpeta}`
// Local path: uploads/negocio-${negocioId}/${carpeta}/
```

#### B2. Nueva entidad `PaginaHeroImagen`
Crear `backend/src/negocio/entidades/pagina-hero-imagen.entidad.ts` (patrón de `ProductoImagen`):
campos: `pagina_config_id`, `url`, `alt`, `orden`, `es_principal` + audit.

#### B3. `NegocioPaginaConfig` entity — `backend/src/negocio/entidades/negocio-pagina-config.entidad.ts`
Agregar:
```typescript
@HasMany(() => PaginaHeroImagen, { foreignKey: 'paginaConfigId' })
declare imagenesHero: CreationOptional<PaginaHeroImagen[]>;
```

#### B4. `Negocio` entity — `backend/src/negocio/entidades/negocio.entidad.ts`
Agregar campo:
```typescript
@Column({ field: 'max_imagenes_hero', type: DataType.SMALLINT, defaultValue: 3 })
declare maxImagenesHero: CreationOptional<number>;
```

#### B5. `CrearNegocioDto` / `ActualizarNegocioDto`
Agregar en `backend/src/negocio/dto/crear-negocio.dto.ts`:
```typescript
@IsOptional() @IsInt() @Min(1) @Max(20)
maxImagenesHero?: number;
```
`ActualizarNegocioDto` extiende `PartialType(CrearNegocioDto)` → se hereda automático.

#### B6. Nuevos endpoints en `NegocioControlador` — `backend/src/negocio/negocio.controlador.ts`
```
POST   /negocio/pagina-config/imagen-hero        → subir imagen (multipart)
DELETE /negocio/pagina-config/imagen-hero/:id    → eliminar imagen (soft delete + Cloudinary)
PATCH  /negocio/pagina-config/imagen-hero/:id/orden → actualizar orden
PATCH  /negocio/pagina-config/imagen-hero/:id/principal → marcar como principal
```
Todos usan `@Permisos('CATALOGO_MI_PAGINA_EDITAR')`.

El endpoint POST:
- Usa `FileInterceptor('archivo', { storage: multerStoragePagina })` (diskStorage a `uploads/negocio-{id}/pagina`)
- Llama `negocioServicio.subirImagenHero(negocioId, file, usuarioId)`

#### B7. `NegocioServicio` — `backend/src/negocio/negocio.servicio.ts`
Nuevos métodos:
- `subirImagenHero(negocioId, file, usuarioId)` — verifica límite `maxImagenesHero`, sube a Cloudinary carpeta `pagina/cabecera`, crea registro `PaginaHeroImagen`
- `eliminarImagenHero(negocioId, imagenId, usuarioId)` — soft delete + `storageServicio.eliminarImagen(url)`
- `actualizarOrdenHero(negocioId, imagenId, orden)` — actualiza campo `orden`
- `marcarPrincipalHero(negocioId, imagenId)` — setea `es_principal=true` en este, `false` en los demás

El método `obtenerPaginaConfig` debe incluir `imagenesHero` en el include de Sequelize.

#### B8. `NegocioModulo` — `backend/src/negocio/negocio.modulo.ts`
```typescript
imports: [
  SequelizeModule.forFeature([Negocio, NegocioPaginaConfig, PaginaHeroImagen]),
  StorageModulo
]
```

---

### C. Frontend

#### C1. Interface `PaginaConfig` — `frontend/src/app/core/services/mi-pagina-catalogo.servicio.ts`
Agregar:
```typescript
imagenesHero: { id: number; url: string; alt?: string; orden: number; esPrincipal: boolean }[];
```

Nuevos métodos en el servicio:
```typescript
subirImagenHero(file: File): Observable<{ id: number; url: string; orden: number; esPrincipal: boolean }>
eliminarImagenHero(id: number): Observable<void>
actualizarOrdenHero(id: number, orden: number): Observable<void>
marcarPrincipalHero(id: number): Observable<void>
```

`subirImagenHero` usa `HttpClient.post` con `FormData` (no pasa por `HttpBaseService` porque es multipart).

#### C2. `MiPaginaComponent` — `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.ts`
Agregar signals:
```typescript
imagenesHero = signal<ImagenHeroItem[]>([]);
subiendoHero = signal(false);
maxImagenesHero = signal(3);  // se carga desde la config del negocio
```

Métodos nuevos:
- `onHeroImagenSeleccionada(event)` — valida límite antes de subir, llama servicio, actualiza signal
- `eliminarImagenHero(id)` — confirm dialog, llama servicio, actualiza signal
- `moverOrden(id, direccion)` — reordena localmente y llama servicio
- `marcarPrincipal(id)` — llama servicio

El `obtenerConfig()` inicial carga `imagenesHero` al signal.
El límite `maxImagenesHero` se obtiene también del endpoint `mi-negocio` o se expone en `PaginaConfig`.

#### C3. Template Hero — `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.html`
Reemplazar el bloque "URL imagen hero" con widget multi-imagen:

```html
<!-- Imágenes hero -->
<div class="flex flex-col gap-2">
  <label class="text-sm font-medium text-gray-700 flex items-center gap-1.5">
    Imágenes del hero
    <span class="text-xs text-gray-400">({{ imagenesHero().length }}/{{ maxImagenesHero() }})</span>
  </label>

  <!-- Grid de miniaturas actuales -->
  <div class="grid grid-cols-3 gap-2">
    @for (img of imagenesHero(); track img.id) {
      <div class="relative rounded-lg overflow-hidden border border-gray-200 aspect-video">
        <img [src]="img.url" class="w-full h-full object-cover" [alt]="img.alt ?? ''"/>
        <!-- Badge principal -->
        @if (img.esPrincipal) {
          <span class="absolute top-1 left-1 bg-primary-500 text-white text-[10px] px-1 rounded">Principal</span>
        }
        <!-- Acciones overlay -->
        <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity
                    flex items-center justify-center gap-1">
          <button type="button" (click)="marcarPrincipal(img.id)"
            class="p-1 bg-white/90 rounded text-xs" pTooltip="Marcar como principal">
            <i class="pi pi-star text-yellow-500"></i>
          </button>
          <button type="button" (click)="moverOrden(img.id, -1)"
            class="p-1 bg-white/90 rounded text-xs" pTooltip="Mover izquierda">
            <i class="pi pi-chevron-left text-gray-700"></i>
          </button>
          <button type="button" (click)="moverOrden(img.id, 1)"
            class="p-1 bg-white/90 rounded text-xs" pTooltip="Mover derecha">
            <i class="pi pi-chevron-right text-gray-700"></i>
          </button>
          <button type="button" (click)="eliminarImagenHero(img.id)"
            class="p-1 bg-white/90 rounded text-xs" pTooltip="Eliminar">
            <i class="pi pi-trash text-red-500"></i>
          </button>
        </div>
      </div>
    }

    <!-- Slot para agregar (solo si no llegó al límite) -->
    @if (imagenesHero().length < maxImagenesHero()) {
      <label class="flex flex-col items-center justify-center aspect-video border-2 border-dashed
                    border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors
                    text-gray-400 text-xs gap-1"
             [class.opacity-50]="subiendoHero()">
        @if (subiendoHero()) {
          <i class="pi pi-spin pi-spinner text-lg"></i>
          <span>Subiendo...</span>
        } @else {
          <i class="pi pi-plus text-lg"></i>
          <span>Agregar</span>
        }
        <input type="file" accept="image/*" class="hidden"
               [disabled]="subiendoHero()"
               (change)="onHeroImagenSeleccionada($event)" />
      </label>
    }
  </div>
  <span class="text-xs text-gray-400">La imagen principal se muestra como portada del hero.</span>
</div>
```

#### C4. `NegociosListaComponent` — `frontend/src/app/features/negocios/negocios-lista/`
Agregar `maxImagenesHero` al grupo de form controls:
```typescript
maxImagenesHero: [3, [Validators.required, Validators.min(1), Validators.max(20)]],
```
Agregar en la tabla (columna) y en el dialog (campo numérico) junto a los otros `max_*`.

#### C5. Interface `Negocio` en el servicio frontend
Agregar `maxImagenesHero: number` a la interface de respuesta.

#### C6. `MiNegocioVista` — `frontend/src/app/features/mi-negocio/mi-negocio-vista/`
Mostrar `maxImagenesHero` como campo read-only en la sección de límites del plan.

---

## Exposición de `maxImagenesHero` al componente `mi-pagina`

**Opción elegida:** Incluir `maxImagenesHero` en la respuesta de `GET /negocio/pagina-config`.
El `NegocioServicio.obtenerPaginaConfig` ya consulta `negocio_pagina_config` via `negocioId`;
se agrega un join a `negocio` para retornar `negocio.max_imagenes_hero` en el DTO de respuesta.

---

## Archivos a crear/modificar (resumen)

| Archivo | Acción |
|---------|--------|
| `database/migrations/NNN-pagina-hero-imagenes.sql` | Crear (migración idempotente) |
| `database/setup-completo.sql` | Actualizar (columna + tabla) |
| `backend/src/storage/storage.servicio.ts` | Editar (param `carpeta`) |
| `backend/src/negocio/entidades/pagina-hero-imagen.entidad.ts` | Crear |
| `backend/src/negocio/entidades/negocio-pagina-config.entidad.ts` | Editar (HasMany) |
| `backend/src/negocio/entidades/negocio.entidad.ts` | Editar (`maxImagenesHero`) |
| `backend/src/negocio/dto/crear-negocio.dto.ts` | Editar (`maxImagenesHero`) |
| `backend/src/negocio/negocio.controlador.ts` | Editar (4 endpoints nuevos) |
| `backend/src/negocio/negocio.servicio.ts` | Editar (4 métodos nuevos) |
| `backend/src/negocio/negocio.modulo.ts` | Editar (StorageModulo + entidad) |
| `frontend/src/app/core/services/mi-pagina-catalogo.servicio.ts` | Editar (interface + 4 métodos) |
| `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.ts` | Editar (signals + métodos) |
| `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.html` | Editar (widget multi-imagen) |
| `frontend/src/app/features/negocios/negocios-lista/negocios-lista.component.ts` | Editar (form control + interface) |
| `frontend/src/app/features/negocios/negocios-lista/negocios-lista.component.html` | Editar (tabla + dialog) |
| `frontend/src/app/features/mi-negocio/mi-negocio-vista/mi-negocio-vista.component.html` | Editar (mostrar límite) |

---

## Verificación

1. Admin en `negocios-lista` edita negocio → cambia `maxImagenesHero` a 2 → guarda
2. Tenant va a Mi Página → Hero → muestra slot "Agregar" → sube primera imagen → aparece miniatura
3. Sube segunda imagen → aparece segunda miniatura
4. Intenta subir tercera → no aparece el slot (límite alcanzado)
5. Marca imagen como principal → badge "Principal" cambia de miniatura
6. Elimina una → slot "Agregar" reaparece
7. Guarda cambios → recarga → imágenes persisten
8. Vista previa del hero muestra la imagen principal

---

## Tests recomendados

### Unit tests — Backend
- [ ] `subirImagenHero()` lanza `ForbiddenException` cuando `count >= maxImagenesHero` — `negocio.servicio.spec.ts`
- [ ] `subirImagenHero()` llama `storageServicio.subirImagen` con carpeta `'pagina/cabecera'`
- [ ] `eliminarImagenHero()` hace soft delete + llama `storageServicio.eliminarImagen`
- [ ] `marcarPrincipalHero()` setea `es_principal=true` solo en el id indicado

### Unit tests — Frontend
- [ ] `subirImagenHero()` hace POST multipart a `api/negocio/pagina-config/imagen-hero`
- [ ] Widget oculta slot "Agregar" cuando `imagenesHero().length >= maxImagenesHero()`

### E2E
- [ ] Subir 2 imágenes hero → verificar miniaturas y límite — `e2e/tests/13-mi-pagina/hero-imagenes.spec.ts`
