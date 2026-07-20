# Hero-carrusel en páginas de servicio + eliminar galería

## Context

Hoy cada página de servicio (`/servicios/:slug`) muestra:
1. Un **hero** con UNA sola imagen de fondo (`service.image_url`) — componente compartido `PageHero`.
2. Más abajo, un **catálogo/galería** de imágenes en grid (`ServiceGallery`).

El usuario quiere **eliminar la galería de abajo** y que **esas imágenes suban al hero**, convirtiéndolo en un **carrusel auto-rotativo** (tipo el slideshow del home). Decisiones confirmadas:
- **Contenido del carrusel:** SOLO las imágenes de la galería actual (no se incluye `image_url`).
- **Controles:** flechas izq/der + puntos indicadores, con auto-rotación (igual que `HeroSlideshow` del home).
- **Datos/CMS:** renombrar el campo `gallery` → `hero_images` en todas las capas (rename limpio).

Resultado: hero de servicio con carrusel de las imágenes que antes estaban en la galería; la sección de galería inferior desaparece. `image_url` **se conserva** porque `ServiceCrossSelling` lo usa como fallback del card (`item.card_image || item.image_url`).

---

## Cambios por capa

### 1. Dominio — `src/domain/services/models/services.model.ts`
- Renombrar interfaz `GalleryItem` → `HeroImage` (mismos campos `{ image: string; caption?: string }`; el `caption` queda pero sin uso visual).
- `ServiceItem.gallery: GalleryItem[]` → `hero_images: HeroImage[]`.
- `ServiceMediaItem.gallery?: { image?: string }[]` → `hero_images?: { image?: string }[]`.
- Actualizar el re-export en `src/domain/services/index.ts` si exporta `GalleryItem`.

### 2. Merge — `src/application/utils/media-merge.utils.ts` (`mergeServicesMedia`, ~L56-59)
- `gallery: item.gallery.map(...)` → `hero_images: item.hero_images.map((g, i) => ({ ...g, image: m.hero_images?.[i]?.image ?? g.image }))`.
- El merge sigue siendo **por índice**: mantener alineadas las longitudes de los arrays texto/media (ver §5).

### 3. Query Tina — `src/application/services/hooks/use-services-tina.ts`
- `SERVICES_QUERY`: `gallery { caption }` → `hero_images { caption }`.
- `SHARED_SERVICES_QUERY`: `gallery { image }` → `hero_images { image }`.

### 4. Esquema Tina — `tina/config.ts`
- Colección de texto `services` (lista `catalog`): renombrar el `list` field `gallery` → `hero_images` (mantiene subcampo `caption`). Ajustar `label` a algo como "Imágenes del hero".
- Colección `shared_services` (lista `catalog`): renombrar el `list` field `gallery` → `hero_images` (subcampo `image`). Ajustar `label`.
- `tina/__generated__/` es autogenerado (eslint-ignored) — se regenera solo, no editar a mano.

### 5. JSON de contenido (rename de clave, misma estructura)
- `public/locales/es/services.json` y `public/locales/en/services.json`: en cada entrada de `catalog`, renombrar `"gallery"` → `"hero_images"` (los objetos `{ caption }` / `{}` quedan igual).
- `public/locales/shared/services.json`: en cada entrada, renombrar `"gallery"` → `"hero_images"` (objetos `{ image }` igual).
- **Crítico:** por servicio, el array de texto y el de media deben tener la misma cantidad de elementos (el merge es por índice); solo se renombra la clave, no se toca la longitud.

### 6. Nuevo componente — `src/presentation/services/components/ServiceHero.tsx`
Hero-carrusel que **fusiona el lenguaje visual de `PageHero`** (breadcrumbs, título en mayúsculas, overlay `bg-secondary`, gradiente de marca, reveal GSAP de entrada, parallax) **con la lógica de rotación de `HeroSlideshow`** (`useState` + `setInterval`, `nextSlide/prevSlide`, flechas `ChevronLeft/Right` de `lucide-react`, puntos).

Props:
```ts
interface ServiceHeroProps {
  images: string[];                 // URLs (de hero_images)
  title: string;
  breadcrumbs: BreadcrumbItem[];    // misma forma que PageHero
  overlayOpacity?: number;          // default 40
  titleTinaField?: string;
  imageTinaFields?: (string | undefined)[]; // tina field por imagen (activa)
  a11yLabels?: { prevSlide?: string; nextSlide?: string; goToSlide?: string };
}
```
Estructura (reutiliza clases exactas de `PageHero` para consistencia):
- `<section ref={root} className="relative h-[58vh] min-h-[400px] flex items-end overflow-hidden">`.
- **Envoltura de parallax única** `<div data-hero-bg className="absolute top-0 left-0 w-full h-[120%] will-change-transform">` que contiene TODAS las diapositivas; el parallax GSAP (`yPercent:-15`, scrub) se aplica a esta envoltura (igual que `PageHero`), preservando el efecto.
  - Dentro, `images.map((img, idx) => <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: url(resolveImageUrl(img)), opacity: idx===currentSlide?1:0 }} data-tina-field={idx===currentSlide ? imageTinaFields?.[idx] : undefined} />)`.
- Overlay `bg-secondary` (z-10, `opacity: overlayOpacity/100`) + gradiente `bg-gradient-to-t from-primary/85 via-secondary/25 to-transparent` (z-10) — idénticos a `PageHero`.
- Breadcrumbs + `<h1 data-hero-reveal>` en z-20, `flex items-end`, con el mismo bloque de breadcrumbs y `useGSAP` reveal de `PageHero`.
- **Controles (solo si `images.length > 1`):** flechas prev/next y fila de puntos indicadores, copiando el markup/estilos de `HeroSlideshow` (z-30, `aria-label` desde `a11yLabels`).
- Auto-rotación: `useEffect` + `setInterval(SLIDE_INTERVAL_MS)` con cleanup; wrap modular. Respetar `prefersReducedMotion()` para el parallax/reveal (ya lo hace el patrón de `PageHero`).

Reutilizar: `resolveImageUrl` (`@app/utils/url.utils`), `tf` (`@app/utils/tina.utils`), `gsap/useGSAP/prefersReducedMotion` (`@shared/animation/gsap.setup`).

### 7. Pantalla — `src/presentation/services/screens/ServiceDetailScreen.tsx`
- Sustituir `<PageHero image={service.image_url} ... />` por `<ServiceHero ... />`.
- Construir el array de imágenes desde `hero_images`, excluyendo la `intro_image` del features (para no duplicar la que muestra `ServiceFeatures`), con fallback a `image_url` si quedara vacío:
  ```ts
  const heroImages = useMemo(() => {
    const imgs = (service?.hero_images ?? [])
      .map(g => g.image)
      .filter(img => img && img !== service?.features_section?.intro_image);
    return imgs.length ? imgs : [service!.image_url];
  }, [service]);
  ```
- Pasar `imageTinaFields` mapeando `tinaServiceMedia?.hero_images?.[idx]` con `tf(item, 'image')` (bind Tina por diapositiva activa).
- Pasar `a11yLabels` desde `common` (mismo origen que usa el home para el slideshow) para evitar textos hardcodeados.
- **Eliminar** el bloque `{service.gallery && ... <ServiceGallery .../>}` (L72-79) y su `import`.

### 8. Eliminar componente muerto
- Borrar `src/presentation/services/components/ServiceGallery.tsx` (queda sin uso). Verificar que nadie más lo importe (solo lo usa `ServiceDetailScreen`).

### 9. Tests y mocks (evitar romper build/typecheck)
Actualizar las referencias `gallery` → `hero_images` en:
- `src/application/utils/media-merge.utils.test.ts` (fixture `makeServices` + assertion `catalog[0].gallery[0].image` → `hero_images[0].image`).
- Revisar `src/test/mocks/handlers.ts` y `src/application/services/hooks/use-services.test.ts` por si referencian `gallery` en fixtures de services.

---

## Verificación (end-to-end)

1. `npm run dev` y abrir `http://localhost:5173/web-design/#/servicios/contenedores-vacios`.
   - El hero debe **rotar** entre las imágenes que antes estaban en la galería (auto-cada 7s), con flechas y puntos funcionando, título y breadcrumbs intactos, overlay/gradiente de marca y parallax al hacer scroll.
   - **No** debe existir ya la sección de galería en grid más abajo.
   - Probar varios slugs (`deposito-temporal` 4 imgs, `transporte-y-distribucion` 2 imgs, `bpa-bpm` 3 imgs) — el carrusel se adapta a la cantidad; con 1 imagen no muestra flechas/puntos.
   - Cambiar idioma ES/EN: el hero sigue mostrando las imágenes (media es compartida) y breadcrumbs/título traducen.
2. `npm run build` (tsc -b + vite) sin errores de tipos (validar el rename en todas las capas).
3. `npm run lint` limpio.
4. (Opcional) `npx vitest run` si el proyecto ejecuta los `.test.ts` — que pasen los tests de merge de services.
5. Revisar que `ServiceCrossSelling` (cards inferiores de "otros servicios") sigue mostrando imágenes vía `card_image || image_url` — no debe verse afectado.

## Notas
- `image_url` **se conserva** (fallback de `ServiceCrossSelling` + fallback de hero vacío). No borrar.
- `ServiceFeatures` / `intro_image` **no se tocan**: la sección de features sigue igual.
- Commits en español (convención del proyecto).
