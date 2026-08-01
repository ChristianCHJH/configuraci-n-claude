# Páginas internas del clon de unimar.com.pe

## Contexto

La home del clon (`C:\Users\Christian\Proyectos\unimar-web`) está terminada y verificada: todas las
secciones caen en la misma `y` que el original a 1440px, el bilingüe funciona y build/lint/tipos están
limpios. Pero **todos los enlaces del menú dan 404** — no existe ninguna página interna.

El recon en vivo del original encontró **más alcance del estimado**: no son 11 páginas sino **16**, más
~24 páginas de detalle de comunicados. Aparecieron 3 páginas de sectores que la home ya enlaza desde sus
tarjetas y que nadie había contabilizado.

Resultado esperado: las 40 rutas (16 páginas + 24 comunicados) × 2 idiomas, prerenderizadas, sin enlaces
rotos, y la home sin regresiones.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Comunicados | Los **~24, todo el histórico**, con paginación funcionando |
| Mapas de Ubicaciones | **Iframe de Google Maps embed** (`maps/embed?pb=`), que no necesita API key. No se reutiliza la key del original |
| Trabaja con nosotros | **Se mantiene el iframe** a `grupo-unimar.sherlockhr.com/ofertas/` — verificado: no manda `X-Frame-Options` ni CSP, se puede embeber |
| `/contacto` | **No se crea.** El enlace "Contactos" del pie apunta a `/`, como en el original |
| Intranet / Portal de Clientes | Siguen siendo enlaces externos (ya está bien) |
| Bilingüe | Completo es/en, traduciendo lo que el original dejó a medias |

## Hallazgo clave: la plantilla interna NO es la de la home

En el original, las páginas internas resuelven la cabecera de otra forma:

```
header.top-home.interior   position: relative !important   ← ¡NO absolute como en la home!  y=0 h=120
.img_single                relative, w:100%, h:412px, overflow:hidden
                           img: absolute, translate(-50%,-50%), height:412px, width:1440px
                           @max-992: h:350px · img h:350px w:auto max-width:none
  └── .msj-interior        absolute, bottom:0, left:50%, translate(-50%,0), bg-black.png, padding:30px
      └── h2               #fff, center, 30px/45px, weight 300, uppercase, line-blue.gif abajo, pb:20px
                           @max-992: 20px/30px, pb:10px
.container                 contenido propio de la página
.seccion-4                 "Nuestros Servicios" → `ServiciosSection` se reutiliza TAL CUAL
footer
```

Dos cosas verificadas que simplifican mucho:

- **Ninguna página interna lleva el newsletter.**
- **El detalle de comunicado encaja en la misma plantilla**: su banner dice "Comunicados" (no el título del
  comunicado) y el contenido es 2 columnas — `col-md-8` (720px) con el texto + `col-md-4` (240px) con el
  aside "ANTERIORES COMUNICADOS".

## Arquitectura

### Route group `(interior)` + `<BannerInterior>`

```
src/app/[locale]/
├── layout.tsx          (existe, no se toca)
├── page.tsx            (home — NO hereda el layout nuevo)
└── (interior)/
    ├── layout.tsx      ← NUEVO: SiteHeader variant="interior" + main + ServiciosSection + SiteFooter
    ├── empresa/{page,ubicaciones,trabaja-con-nosotros,politicas-sig,
    │            proteccion-datos-unimar,proteccion-datos-unilog}
    ├── servicios/{page,centro-logistico,gestion-logistica}
    ├── sectores/{operadores-de-comercio-exterior,lineas-navieras,importadores-exportadores}
    └── comunicados/{page, pagina/[numero], [slug]}
```

Un route group no aparece en la URL y no afecta a los hermanos, así que la home queda intacta.

**Por qué no meter el banner en el layout:** un layout de Next no puede leer datos de su página hija, y el
banner y el título cambian por página. Las alternativas (tabla por pathname con `headers()`, o parallel
routes) convertirían el subárbol en dinámico o añadirían más ficheros de los que ahorran. Con
`<BannerInterior>` como primer hijo de cada página, la parte variable queda explícita y tipada:

```tsx
// src/components/banner-interior.tsx  (Server Component)
export interface BannerInteriorProps {
  readonly titulo: string;   // ya traducido por la página
  readonly imagen: string;   // "/images/banners/empresa.jpg"
  readonly alt?: string;
}
```

Cada página queda en ~6 líneas: `<BannerInterior …/>` + `<Container>{contenido}</Container>`.

⚠️ **`BannerInterior` NO puede usar `fill` + `object-cover`.** El original fija `height:412px; width:1440px`
centrado con `translate(-50%,-50%)`: por encima de 1440px la imagen **no se estira**, quedan bandas. Hay que
reproducirlo con `<Image>` absoluto + `max-w-none` + tamaños explícitos.

### `SiteHeader` recibe `variant`

```tsx
export type VarianteCabecera = "home" | "interior";
export function SiteHeader({ variant = "home" }: { variant?: VarianteCabecera } = {})
```

El default `"home"` deja `page.tsx` intacto. Solo cambia el `className` del `<header>` raíz:

- comunes: `z-50 w-full bg-[url(bg-white.png)] bg-repeat h-[130px] md:h-[120px]`
- home: `absolute top-0 left-0`
- interior: `relative shrink-0`

Dos trampas:
- **`z-50` se mantiene en `interior`.** Sin él, el submenú de escritorio (200px de alto, sale de los 120px
  del header) queda pintado por debajo del `<img>` absoluto del banner.
- **`shrink-0`.** En `interior` el header pasa a ser un item flex real dentro de `body.flex.flex-col` y sin
  esto puede comprimirse en páginas cortas.

### Los comunicados van en `src/content/`, no en `messages/*.json`

Razón decisiva: **`/comunicados` necesita enumerar, ordenar y paginar**. Con next-intl no se pueden iterar
las claves de un namespace de forma tipada (`t.raw()` devuelve algo sin tipo, y el proyecto prohíbe `any`).
Para paginar 24 ítems en 3 páginas hace falta un array real de todos modos.

Dos ventajas añadidas:
- **Bundle:** `NextIntlClientProvider` hoy pasa *todos* los mensajes al cliente. 24 comunicados × cuerpo ×
  idioma se descargarían en **todas** las páginas, incluida la home. Los módulos de `src/content/` solo se
  importan desde Server Components y nunca llegan al navegador.
- **Paralelización:** un archivo por comunicado = N builders sin conflictos de merge.

```ts
// src/types/content.ts
export interface TextoBilingue { readonly es: string; readonly en: string }
export interface Comunicado {
  readonly slug: string;      // estable, en español, igual en ambos locales
  readonly fecha: string;     // ISO YYYY-MM-DD — fuente única de orden
  readonly titulo: TextoBilingue;
  readonly cuerpo: { readonly es: readonly string[]; readonly en: readonly string[] };
  readonly adjunto?: string;  // PDF en public/docs/comunicados/
}

// src/content/comunicados/index.ts
export const COMUNICADOS: readonly Comunicado[];          // orden fecha desc
export const COMUNICADOS_POR_PAGINA = 8;
export function obtenerComunicado(slug): Comunicado | undefined;
export function comunicadosDePagina(numero): readonly Comunicado[];
export function comunicadosAnteriores(slugActual, limite): readonly Comunicado[];
```

El resto del texto (las 12 páginas de prosa) **sí** va a `messages/*.json`, bajo namespaces `paginas.*` para
no chocar con `services`/`notices`. Claves numeradas explícitas (`p1`, `p2`…), no arrays.

### Paginación por ruta, no por query

`/comunicados` (pág. 1) y `/comunicados/pagina/2`, `/comunicados/pagina/3`, con `generateStaticParams`.
Con `?page=2` se fuerza render dinámico y se pierde el prerender de la ruta más pesada del sitio. La URL
diverge del original (`?cat=3&paged=2`), pero todo el esquema de URLs ya diverge.

## Fases

### Fase 0 — Extracción (yo, secuencial) · BLOQUEANTE

1. `scripts/extraer-paginas.mjs` — recorre las ~40 URLs × 2 idiomas y vuelca `docs/research/paginas/<slug>-<lang>.json`
   con: título del banner, `banner_src`, alturas @1440/768/390, bloques (`tag`/`clase`/`texto`), imágenes,
   PDFs y **conteo de `.post`/`.postxx`** (para saber qué envolver en `<Reveal>`).
   Debe hacer **scroll lento** antes de leer — si no, sale en blanco por el reveal.
2. Confirmar que `.seccion-4` en internas tiene la misma geometría que en la home.
3. Obtener a mano los `maps/embed?pb=` de Google Maps para cada sede de Ubicaciones.
4. Ampliar `scripts/download-assets.mjs` con `ASSETS_INTERNAS`: banners por página, imágenes de `/empresa`
   (`UNIMAR-211/191/168`, `tecnologia`, `UNIMAR-225-2`), **`arrow_blue.png`** (falta y lo usan las listas de
   servicios), y los PDFs de comunicados. Ejecutarlo.

### Fase 1 — Cimientos (yo, secuencial) · BLOQUEANTE

Todo lo que los builders tienen prohibido tocar. **Debe cerrarse entero antes de despachar el primer builder.**

| Archivo | Acción |
|---|---|
| `src/types/content.ts` | `+ TextoBilingue`, `+ Comunicado` |
| `src/components/site-header.tsx` | `+ variant`, `z-50` + `shrink-0` |
| `src/components/site-footer.tsx` | `contact: "/contacto"` → `"/"` |
| `src/app/[locale]/(interior)/layout.tsx` | nuevo |
| `src/components/banner-interior.tsx` | nuevo |
| `src/app/globals.css` | `+ .titulo-left-grande` (25px), `+ .lista-flechas`, `+ .paginacion` / `.paginacion-actual` |
| `messages/es.json` + `en.json` | **todas** las claves `paginas.*` de las 16 páginas, ya traducidas |
| `src/content/comunicados/index.ts` | barrel + helpers |
| `docs/research/components/` | 1 spec por página + `_SHARED-INTERIOR.md` |

`_SHARED-INTERIOR.md` debe fijar: "tu página empieza SIEMPRE con `<BannerInterior>` y NO renderiza
header/footer/ServiciosSection", las clases nuevas, `flow-root` en la raíz del contenido (el colapso de
márgenes ya mordió 3 veces), y las alturas objetivo.

### Fase 2 — Páginas de prosa (7 builders en paralelo)

| Builder | Archivos |
|---|---|
| B1 | `empresa/page.tsx` (el más largo: 3180px, 4 bloques, 5 imágenes) |
| B2 | `politicas-sig` + `proteccion-datos-unimar` + `proteccion-datos-unilog` (mismo molde, texto legal) |
| B3 | `ubicaciones` (h4 + iframe de mapa) + `trabaja-con-nosotros` (solo iframe) |
| B4 | `servicios` + `centro-logistico` + `gestion-logistica` |
| B5 | los 3 de `sectores/` |
| B6 | `src/content/comunicados/*.ts` — comunicados 1–12 |
| B7 | `src/content/comunicados/*.ts` — comunicados 13–24 |

B6/B7 no dependen del layout, solo del tipo y del extracto: arrancan a la vez que el resto.

### Fase 3 — Vistas de comunicados (2 builders, tras B6/B7)

| B8 | `comunicados-lista.tsx` + `comunicados-paginacion.tsx` + `comunicados/page.tsx` + `comunicados/pagina/[numero]/page.tsx` |
| B9 | `comunicados-anteriores.tsx` (aside 240px) + `comunicados/[slug]/page.tsx` con `generateStaticParams` y `generateMetadata` |

### Fase 4 — Integración (yo)

1. `ComunicadosSection` deja de usar `NOTICES` y deriva de `COMUNICADOS.slice(0, 2)`; se borran `NOTICES` de
   `site-content.ts` y `notices.items` de los dos JSON. **Re-QA de la home obligatoria.**
2. Estrechar `NextIntlClientProvider` a los namespaces que consumen Client Components
   (`topbar`, `nav`, `hero`, `newsletter`), dejando la prosa en servidor.
3. Actualizar `docs/research/PAGINAS-INTERNAS.md` con el inventario real.

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | `object-cover` no reproduce `.img_single img` — recorte distinto >1440 y en móvil | `<Image>` absoluto + `max-w-none` + tamaños explícitos. En negrita en la spec |
| R2 | Header `relative` sin `z-50` → submenú tapado por el banner en las 16 páginas | Conservar `z-50`. Caso de QA: abrir "Empresa ▾" en `/empresa` a 1440 |
| R3 | Colapso de márgenes (ya mordió 3 veces) | `flow-root` en la raíz del contenido de cada página; regla en `_SHARED-INTERIOR.md` |
| R4 | Títulos largos desbordan `.msj-interior` ("Política de Protección… – UNIMAR" a 390px) | El original crece hacia arriba (`height:auto`, `bottom:0`). Verificar los 3 títulos largos a 390 y 768 |
| R5 | **El embed público de Maps no admite marcadores personalizados** — se pierden los `map-check-01.png` | Consecuencia inevitable de la decisión de mapas. Mantener las listas de direcciones bajo el mapa y documentarlo en la spec para que no se lea como fallo del builder |
| R6 | Conflictos de merge en `messages/*.json` con 7 builders | Fase 1 cerrada al 100% antes de Fase 2. Los builders **reportan** claves faltantes, no las añaden |
| R7 | Apóstrofos y llaves rompen el parser ICU de next-intl en la prosa legal | Evitar `{`/`}`; test de humo que renderice cada namespace |
| R8 | El formateo de fecha de `Intl` no da `jun/2026` | Comprobar contra el original; si difiere, tabla de meses propia |
| R9 | Alguna ruta se vuelve dinámica sin querer | En el build, verificar que las 80 entradas salen `●` (SSG); cualquier `ƒ` es fallo |

## Verificación

**Puerta estática** (tras cada fase): `npx tsc --noEmit` · `npx eslint src/` · `npm run build`.
En el build: **80 entradas** (40 rutas × 2 locales), todas `●`, ninguna advertencia `MISSING_MESSAGE`.

**Paridad i18n** — `scripts/verificar-i18n.mjs` (nuevo): diff de claves `es` vs `en` vacío en ambos sentidos;
por cada comunicado `titulo.en !== ""`, `cuerpo.en.length === cuerpo.es.length` y `titulo.en !== titulo.es`
salvo lista blanca. Convierte "el clon traduce todo" en un test, no en una intención.

**Medidas** — `scripts/verificar-medidas.mjs` (nuevo), por página contra el original:

```
getComputedStyle(header).position === "relative"
header  → y:0  h:120 (130 @390)
banner  → y:120 h:412 (350 @<992)
msjInterior.bottom === banner.bottom
document.querySelector(".newsletter") === null
scrollHeight ≈ esperado ± 2%
```

Alturas objetivo @1440: empresa 3180 · ubicaciones 1847 · trabaja 1848 · politicas-sig 2194 ·
datos-unimar 1964 · datos-unilog 1989 · servicios 1917 · centro-logistico 2231 · gestion-logistica 1859 ·
operadores 1851 · navieras 1645 · impo-expo 1668 · comunicados 1815 · detalle 2911.

Tolerancia ±2%: el original usa la sans del sistema y el clon Open Sans, así que la prosa larga no cuadra al
píxel; ±2% absorbe eso sin ocultar un error estructural.

**Enlaces** — crawl de `/es` y `/en` comprobando 200 en todos los `href` internos.

**Regresión de la home** — innegociable, porque las Fases 1 y 4 tocan `SiteHeader`, `SiteFooter`,
`ComunicadosSection` y `layout.tsx`. Re-capturar los 3 viewports y comparar con
`docs/design-references/qa/clon-final-1440.png`.

## Archivos críticos

- `src/app/[locale]/(interior)/layout.tsx` — el chrome compartido
- `src/components/banner-interior.tsx` — la única parte variable de la plantilla
- `src/components/site-header.tsx` — prop `variant` + `z-50` + `shrink-0`
- `src/content/comunicados/index.ts` — registro, paginación, helpers
- `messages/es.json` / `en.json` — namespaces `paginas.*`, cerrados antes de despachar builders
