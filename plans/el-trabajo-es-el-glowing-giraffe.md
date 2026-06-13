# Plan: Template catalogo-esencias

## Contexto

El proyecto Next.js ya tiene `catalogo-grilla` como primer template. El sistema soporta múltiples catálogos por slug. El usuario quiere un segundo template (`catalogo-esencias`) con estética de perfumería/colonias — paleta cálida dorada, layout con sidebar de filtros, tipografía elegante — usando exactamente los mismos tipos de datos existentes (`ProductoPublico`, `NegocioConfig`, etc.).

## Cambios en archivos existentes

### 1. `catalogo/lib/types.ts`
Agregar campo `plantilla: string | null` a `NegocioConfig`.
- Sin cambios en `ProductoPublico`, `EtiquetaPublica`, `ImagenProducto`.

### 2. `catalogo/lib/mock-data.ts`
Agregar `MOCK_CONFIG_ESENCIAS` con `plantilla: 'esencias'` y datos de muestra de perfumes/colonias (nombres, SKUs, precios, etiquetas: "Cítrico", "Floral", "Amaderado", "Cálido").

### 3. `catalogo/app/[slug]/page.tsx`
Agregar lógica de routing de templates:
```tsx
if (config.plantilla === 'esencias') return <CatalogoEsencias ... />
return <CatalogoGrilla ... />  // default actual
```

### 4. `catalogo/app/layout.tsx`
Agregar `Playfair_Display` via `next/font/google` como nueva variable CSS `--font-display`, junto a las fuentes existentes. Scope solo al nuevo template.

## Nuevo template: `catalogo/templates/catalogo-esencias/`

### `theme.ts`
```ts
export const THEME = {
  bg: '#f7f3ee',        // ivory cálido
  surface: '#f0ebe2',   // sidebar / cards
  border: '#ddd5c6',    // bordes suaves
  text: '#1a1209',      // espresso profundo
  textMuted: '#7a6a58', // gris cálido
  primary: '#b8975c',   // dorado cálido (botones, accents)
  primaryDark: '#8a6a40', // hover
}
```

### `index.tsx` — orquestador principal
Layout:
```
<Navbar>        → sticky top, logo + categorías + ícono carrito
<HeroBanner>    → hero editorial con caja de texto overlay
<main>
  <FilterSidebar> (desktop: columna izq fija 240px)
  <ProductGrid>   (columna derecha, se filtra por categoría activa)
</main>
<Footer>
<WhatsAppFab>
```
Gestiona estado `categoriaActiva: number | null` igual que catalogo-grilla.

### `Navbar.tsx`
- Logo/nombre a la izquierda
- Links de categorías centrados (desktop), scroll horizontal (mobile)
- Ícono WhatsApp a la derecha (desktop)
- Sticky con `bg-[var(--cat-bg)]/90 backdrop-blur-sm`
- Fuente: `var(--font-display)` para nombre del negocio

### `HeroBanner.tsx`
- Imagen full-width con `object-cover`, altura ~480px desktop / 280px mobile
- Overlay: caja blanca/ivory posicionada en esquina inferior-izquierda sobre la imagen
  - Badge "PREMIUM SELECTION" (caps, tracking wide, small)
  - Título grande en `var(--font-display)` (Playfair Display)
  - Subtítulo descriptivo
  - CTA button → scroll a `#productos`
- Mismo fallback que grilla si no hay imagen

### `FilterSidebar.tsx` ← componente nuevo
- Solo visible desktop (`hidden lg:block`)
- En mobile: pills horizontales encima del grid (misma UI que grilla-navbar pero simplificada)
- Contenido:
  - Título "Filtros" + subtítulo "Refinar por familia"
  - Lista de etiquetas como items clicables (ícono de punto de color + nombre)
  - Sección "Familia olfativa" → chips de las etiquetas del negocio
  - Botón "Limpiar filtros" (visible solo si hay filtro activo)
- Props: `etiquetas`, `categoriaActiva`, `onCategoriaChange`

### `ProductGrid.tsx`
- Grid: `grid-cols-2 lg:grid-cols-3` con `gap-4 lg:gap-6`
- Skeleton loading (3 placeholders)
- Mensaje vacío si no hay productos para el filtro

### `ProductCard.tsx`
Diseño inspirado en la imagen:
- Sin bordes redondeados (o mínimos: `rounded-sm`)
- Imagen: aspect 3:4 (vertical, más elegante), `object-cover` con hover `scale-105` suave
- Sin badge "OFERTA" fluorescente → texto tachado discreto en precio
- Etiqueta de categoría: sola la principal, texto pequeño en `textMuted`
- Nombre: `var(--font-display)`, tamaño `text-lg`
- Descripción: truncada 1 línea, color `textMuted`
- Precio: bold, sin prefijo moneda grande — solo `S/ 185.00`
- Botón: fondo `primary`, texto blanco, full width, icono WhatsApp pequeño
- Sin borde exterior en la card — solo separación por grid gap

### `Footer.tsx`
4 columnas (desktop) / 2 columnas (tablet) / 1 columna (mobile):
1. **Marca**: logo/nombre + `footerDescripcion`
2. **Tienda**: links de `footerLinksJson` (o placeholder "SHOP")
3. **Soporte**: dirección, horario, email, WhatsApp
4. **Newsletter**: si `footerNewsletter`, input email + botón → igual que grilla pero styled
- Redes sociales: Instagram, Facebook, TikTok con íconos SVG inline
- Copyright dinámico

### `WhatsAppFab.tsx`
Reutilizar lógica idéntica a `catalogo-grilla/WhatsAppFab.tsx` — solo cambia el color (dorado en lugar de verde) para mantener consistencia de paleta.

## Orden de implementación

1. `theme.ts` + `lib/types.ts` (agregar `plantilla`)
2. `lib/mock-data.ts` (datos de prueba esencias)
3. `FilterSidebar.tsx`
4. `ProductCard.tsx`
5. `ProductGrid.tsx`
6. `Navbar.tsx`
7. `HeroBanner.tsx`
8. `Footer.tsx`
9. `WhatsAppFab.tsx`
10. `index.tsx` (ensambla todo)
11. `app/[slug]/page.tsx` (router de templates)
12. `app/layout.tsx` (agregar Playfair Display)

## Verificación

- Correr `npm run dev` en `catalogo/`
- Navegar a `http://localhost:3000/esencias-demo` (slug del mock)
- Confirmar: hero visible, sidebar de filtros en desktop, grid 3 cols, cards con imagen vertical, filtro por etiqueta funciona, WhatsApp abre con mensaje correcto
- Confirmar que `http://localhost:3000/lullaby-soft` (template original) sigue funcionando sin cambios
