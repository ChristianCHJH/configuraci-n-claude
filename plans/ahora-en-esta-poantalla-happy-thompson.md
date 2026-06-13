# Plan: Hero con imágenes reales + carrusel

## Contexto

La pantalla "Mi Página" ya sube imágenes a `pagina_hero_imagen` (fichero físico en disco, URL guardada en columna `url`). Sin embargo:

- El **preview vivo** del admin (`mi-pagina.component.html`) todavía aplica `heroImagenUrl` (campo deprecated en `negocio_pagina_config`) como fondo — no muestra las imágenes reales.
- El **catálogo público** (Next.js en puerto 3010) tiene dos templates (`CatalogoGrilla` y `CatalogoEsencias`) cuyos `HeroBanner.tsx` también usan solo `heroImagenUrl` — ni siquiera conocen el array `imagenesHero[]`.
- El DTO público (`ConfigPublicaDto`) no incluye el array de imágenes del hero.

## Nota importante: almacenamiento de imágenes (local vs producción)

El campo `url` en `pagina_hero_imagen` **ya contiene la URL correcta según el entorno**:
- **Local**: URL relativa del backend (archivo en `uploads/negocio-{id}/pagina/cabecera/`)  
- **Producción**: URL de Cloudinary (el `StorageServicio` decide cómo guardar y qué URL retornar)

Los componentes del carrusel usan `img.url` directamente — ninguna lógica condicional de entorno.

## Respuesta a la consulta sobre `hero_imagen_url`

La columna `hero_imagen_url` en `negocio_pagina_config` **se elimina** — ya no se usa en local ni en producción. La fuente activa es `pagina_hero_imagen.url`. Sin fallback legacy.

---

## Cambios a implementar

### 1. Backend — `ConfigPublicaDto` + `PublicoServicio`

**Archivo**: `backend/src/publico/dto/config-publica.dto.ts`
- Agregar clase `ImagenHeroPublicaDto` con campos: `id`, `url`, `alt`, `orden`, `esPrincipal`
- Agregar campo `imagenesHero: ImagenHeroPublicaDto[]` al DTO

**Archivo**: `backend/src/publico/publico.servicio.ts`
- En el método que consulta la config pública, incluir eager load de `imagenesHero` (relación `HasMany` ya existe en la entidad)
- Mapear al DTO: solo imágenes con `eliminado = false`, ordenadas por `orden ASC`

### 2. Next.js — Tipos e interfaz

**Archivo**: `catalogo/lib/types.ts`
- Agregar interfaz `ImagenHero { id: number; url: string; alt?: string; orden: number; esPrincipal: boolean }`
- Agregar campo `imagenesHero: ImagenHero[]` a `NegocioConfig`

### 3. Next.js — HeroBanner (ambos templates)

**Archivo**: `catalogo/templates/catalogo-grilla/HeroBanner.tsx`
**Archivo**: `catalogo/templates/catalogo-esencias/HeroBanner.tsx`

- Mostrar carrusel con `imagenesHero[]`:
  - `useState` para índice activo + `useEffect` con `setInterval` (auto-slide cada 4s)
  - Fondo = `imagenesHero[activeIndex].url`
  - Indicadores dot abajo del hero (uno por imagen)
  - Si solo 1 imagen: fija, sin auto-slide ni dots
- Eliminar toda referencia a `heroImagenUrl` — ya no existe

### 4. Angular — Preview vivo del admin

**Archivo**: `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.html`

- En el panel preview (derecha desktop), el hero actualmente aplica `previewData().heroImagenUrl` como `background-image`
- Cambiar: si `imagenesHero().length > 0`, mostrar la imagen `esPrincipal` (o índice 0 si ninguna es principal) como fondo
- Agregar mini-carrusel en preview: `previewIndex = signal(0)`, auto-rotate con `setInterval` limpiado en `ngOnDestroy`/`takeUntilDestroyed`

**Archivo**: `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.ts`
- Agregar signal `previewHeroIndex = signal(0)`
- Agregar computed `previewHeroUrl` que retorna `imagenesHero()[previewHeroIndex()]?.url ?? previewData().heroImagenUrl ?? null`
- Iniciar intervalo de rotación en `ngOnInit` cuando `imagenesHero().length > 1`, limpiar con `takeUntilDestroyed`

---

### 0. BD — Eliminar columna `hero_imagen_url`

**Migración**: `database/migrations/019-eliminar-hero-imagen-url.sql`
```sql
ALTER TABLE negocio_pagina_config DROP COLUMN IF EXISTS hero_imagen_url;
```

**`database/setup-completo.sql`**: eliminar la línea `hero_imagen_url VARCHAR(500)` del `CREATE TABLE negocio_pagina_config`

---

## Archivos críticos

| Archivo | Cambio |
|---------|--------|
| `database/migrations/019-eliminar-hero-imagen-url.sql` | Nueva migración — DROP COLUMN |
| `database/setup-completo.sql` | Eliminar columna del CREATE TABLE |
| `backend/src/negocio/entidades/negocio-pagina-config.entidad.ts` | Eliminar campo `heroImagenUrl` |
| `backend/src/negocio/negocio.servicio.ts` | Eliminar referencias a `heroImagenUrl` |
| `backend/src/negocio/dto/` (DTOs de config) | Eliminar campo `heroImagenUrl` |
| `backend/src/publico/dto/config-publica.dto.ts` | Agregar `ImagenHeroPublicaDto` + `imagenesHero`; eliminar `heroImagenUrl` |
| `backend/src/publico/publico.servicio.ts` | Eager load `imagenesHero` + mapeo al DTO |
| `catalogo/lib/types.ts` | Agregar `ImagenHero` + campo en `NegocioConfig`; eliminar `heroImagenUrl` |
| `catalogo/templates/catalogo-grilla/HeroBanner.tsx` | Carrusel con `imagenesHero[]` |
| `catalogo/templates/catalogo-esencias/HeroBanner.tsx` | Carrusel con `imagenesHero[]` |
| `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.html` | Preview hero usa imagen real |
| `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.ts` | Signal `previewHeroIndex` + rotación |

---

## Verificación

1. Backend: `GET /api/pub/mi-tienda` devuelve `imagenesHero: [...]` en la respuesta
2. Catálogo público: hero en `localhost:3010/mi-tienda` rota entre las imágenes subidas cada 4s
3. Dots de paginación visibles y reflejan imagen activa
4. Si solo 1 imagen: se muestra fija, sin dots ni rotación
5. Si 0 imágenes: hero cae al `heroImagenUrl` original (sin regresión)
6. Admin preview: al tener 2+ imágenes, el mini-preview del panel derecho también rota
