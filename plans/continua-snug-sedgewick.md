# Plan — Unificar las 7 plantillas del catálogo React en una sola

## Context

El catálogo público (`catalogo-react`, Next.js App Router) hoy tiene **7 carpetas en `templates/`**
(`catalogo-grilla`, `catalogo-standard`, `catalogo-esencias`, `catalogo-bebe`, `catalogo-dama`,
`catalogo-mujer`, `catalogo-accesorios`). Cada una repite casi el mismo `index.tsx`, `Navbar`,
`FilterSidebar`, `ProductGrid`, `Footer`, `WhatsAppFab` y `temaContext`. La estructura/layout es
**idéntica**; lo único que cambia entre plantillas es:

1. **Color** — ya modelado con una interfaz `Tema` idéntica en todas (`theme.ts`).
2. **Tipografía** — título `sans` (Quicksand) vs `serif` (Cormorant/Playfair); cuerpo siempre Nunito Sans.
3. **Formato del card** — aspecto de imagen, redondeo, badge índice, swatches, botón WhatsApp, uppercase.

Esto genera ~95% de código duplicado y obliga a tocar 7 carpetas + el `if/else` de
`app/[slug]/page.tsx` cada vez que se cambia algo. **Objetivo:** un solo catálogo manejado por un
**registro de presets** (color + fuente + formato de card), conservando exacto el look de cada
preset actual y **sin cambiar** el esquema de `config.plantilla` (retrocompatible).

Decisiones confirmadas con el usuario:
- Un componente `Catalogo` unificado + registro de config (no mantener 7 carpetas).
- El negocio sigue eligiendo con el string `config.plantilla` (ej. `catalogo-bebe-azul`). Cero cambios en backend/admin.
- Formato de card = enum pequeño de **4 formatos** reutilizables con flags.

---

## Arquitectura nueva

### 1. Tipos centrales — `lib/plantillas/tipos.ts` (nuevo)

```ts
export interface Tema {
  bg; surface; surfaceSoft; border; text; textMuted;
  primary; primaryDark; primaryLight; accent; footerBg;   // (mismas 11 keys actuales)
}

export type FormatoCard = 'estandar' | 'redondeado' | 'alto' | 'cuadrado';

export interface ConfigCard {
  formato: FormatoCard;
  aspecto: string;                       // '4/3' | '3/4' | '1/1'
  redondeo: string;                      // 'rounded-xl' | 'rounded-3xl' | 'rounded-none'
  conBorde: boolean;
  conSombra: boolean;
  swatches: boolean;                     // mostrar muestras de color
  indice: boolean;                       // badge 01,02,... (accesorios)
  whatsapp: 'verde' | 'primary' | 'oculto';
  ofertaEstilo: 'badge' | 'texto';
  tituloUppercase: boolean;
  tituloFuente: 'titulo' | 'cuerpo';
}

export interface Fuentes { titulo: string; cuerpo: string; }   // CSS vars: 'var(--font-quicksand)' etc.

export interface PlantillaResuelta { tema: Tema; fuentes: Fuentes; card: ConfigCard; }
```

### 2. Registro de presets — `lib/plantillas/registro.ts` (nuevo)

Un `PRESETS: Record<string, Preset>` con un preset por tipo base. Cada preset:
`{ paletas: Record<string, Tema>, paletaDefault: string, fuentes: Fuentes, card: ConfigCard }`.
**Los datos de paleta se copian tal cual** desde los `theme.ts` actuales (mismos hex), para que
cada look quede idéntico.

```ts
export function resolverPlantilla(plantilla: string | null): PlantillaResuelta {
  // 1. matchea prefijo del string contra las claves de PRESETS (orden: esencias exacto,
  //    luego startsWith de standard/bebe/dama/mujer/accesorios; fallback = grilla).
  // 2. extrae sufijo de color y elige paleta (replica resolverVariante de cada theme.ts);
  //    si no matchea, usa paletaDefault.
}
```

Mapeo de presets (formato + fuente por tipo, derivado de los ProductCard actuales):

| Preset (prefijo) | formato | aspecto | redondeo | whatsapp | swatches | índice | título fuente / upper | oferta |
|---|---|---|---|---|---|---|---|---|
| `catalogo-standard` | estandar | 4/3 | rounded-xl | verde | sí | no | quicksand / no | badge |
| `catalogo-bebe` | redondeado | 4/3 | rounded-3xl (+sombra) | verde | no | no | quicksand / no | badge |
| `catalogo-dama` | estandar | 4/3 | rounded-xl | verde | sí | no | romance(serif) / no | badge |
| `catalogo-mujer` | estandar | 4/3 | rounded-xl | verde | sí | no | romance(serif) / no | badge |
| `catalogo-esencias` | alto | 3/4 | rounded-none | primary | no | no | display(serif) / no | texto |
| `catalogo-accesorios` | cuadrado | 1/1 | rounded-none | oculto | sí | sí | gallery / uppercase | texto |
| `catalogo-grilla` (fallback) | estandar | 4/3 | rounded-2xl | verde | sí | no | quicksand / no | badge |

> `esencias` y `grilla` hoy son tema único (objeto `THEME`); en el registro se modelan como preset de **una sola paleta**.

### 3. Componentes unificados — `components/catalogo/` (nuevo)

- `PlantillaContext.tsx` — provee `PlantillaResuelta` completa (reemplaza los 7 `temaContext.tsx`).
  Hook `usePlantilla()` (devuelve tema+fuentes+card); helper `useTema()` para compat.
- `Catalogo.tsx` — shell unificado. Recibe `{ config, productos, categorias }`, llama
  `resolverPlantilla(config.plantilla)`, envuelve en `PlantillaContext` y renderiza la misma
  estructura que el `index.tsx` de standard (banda bienvenida + sidebar + grid + footer + fab).
  Fuentes aplicadas vía `style={{ fontFamily: fuentes.cuerpo }}` y títulos con `fuentes.titulo`.
- `Navbar.tsx`, `FilterSidebar.tsx`, `ProductGrid.tsx`, `Footer.tsx`, `WhatsAppFab.tsx` — versiones
  únicas (basadas en las de `catalogo-standard`, que ya consumen `useTema`).
- `ProductCard.tsx` — **una sola card parametrizada** por `card: ConfigCard`:
  - `aspecto`/`redondeo`/`conBorde`/`conSombra` → clases del `<article>` e imagen.
  - `indice` → badge `01,02…` (usa prop `indice` que ya pasa `ProductGrid` a accesorios).
  - `ofertaEstilo` → badge esquina vs texto.
  - `swatches` → bloque de muestras de color (lógica `esColor` de `lib/facetas.ts`, ya existe).
  - `whatsapp` → `verde` (#25d366) | `primary` (tema.primary) | `oculto`.
  - `tituloUppercase` + `tituloFuente` → estilo del `<h3>`.
  - Conserva placeholder SVG genérico (uno solo; los SVG por-rubro actuales se descartan o se deja el de standard).

### 4. Simplificar `app/[slug]/page.tsx`

Borrar los 7 imports y el `if/else` (líneas 3-9 y 59-74). Queda:

```tsx
import { Catalogo } from '@/components/catalogo/Catalogo';
...
return (<><TrackerVisita slug={params.slug} tipo="PAGINA" /><Catalogo {...props} /></>);
```

### 5. Página de detalle — `lib/tema-catalogo.ts`

`resolverTemaDetalle()` hoy reimporta los 5 `theme.ts`. Reescribir para que use
`resolverPlantilla()` y derive `TemaDetalle` de `PlantillaResuelta` (primario=`tema.primaryDark`,
`estiloTipografia` desde `fuentes.titulo`/`card.tituloFuente`). `ProductoDetalleContenido.tsx` no cambia.

### 6. Limpieza

Eliminar las 7 carpetas `templates/*` una vez que `Catalogo` renderiza igual. Las fuentes ya están
declaradas como CSS vars en `app/layout.tsx` (quicksand, nunito-sans, display, romance, gallery) — **no tocar**.

---

## Archivos

**Nuevos**
- `lib/plantillas/tipos.ts`
- `lib/plantillas/registro.ts`
- `components/catalogo/PlantillaContext.tsx`
- `components/catalogo/Catalogo.tsx`
- `components/catalogo/{Navbar,FilterSidebar,ProductGrid,ProductCard,Footer,WhatsAppFab}.tsx`

**Modificados**
- `app/[slug]/page.tsx` — un solo `<Catalogo>`.
- `lib/tema-catalogo.ts` — usar `resolverPlantilla`.

**Eliminados (al final)**
- `templates/catalogo-grilla/`, `templates/catalogo-standard/`, `templates/catalogo-esencias/`,
  `templates/catalogo-bebe/`, `templates/catalogo-dama/`, `templates/catalogo-mujer/`,
  `templates/catalogo-accesorios/`.

**Reutilizar (no reescribir)**
- `lib/facetas.ts` (`derivarFacetas`, `filtrarPorFacetas`, `alternarValor`, `contarSeleccionados`, `esColor`).
- `lib/types.ts` (`ProductoPublico`, `NegocioConfig`, `EtiquetaPublica`).
- `lib/api.ts` (`getNegocioConfig`, `getProductos`, `getCategorias`).

---

## Verificación

1. `npm run dev` en `catalogo-react`.
2. Con un negocio por cada `plantilla`, abrir `/{slug}` y comparar contra el look anterior
   (git stash / screenshots): `catalogo-bebe-azul`, `catalogo-standard-esmeralda`,
   `catalogo-esencias`, `catalogo-accesorios-oro`, `catalogo-dama-rosa`, `catalogo-mujer-vino`,
   y un slug sin plantilla (→ grilla fallback).
   Checar: color, fuente del título, aspecto/redondeo del card, swatches, badge índice (accesorios),
   botón WhatsApp (verde/primary/oculto), badge vs texto de oferta.
3. Abrir un detalle `/{slug}/producto/{id}` con 2-3 plantillas → confirmar `resolverTemaDetalle` correcto.
4. `npm run build` (o `tsc --noEmit`) sin errores de tipos tras borrar `templates/`.

## Tests recomendados

### Unit tests (Jest)
- [ ] `resolverPlantilla()` con cada prefijo devuelve el `formato`/`fuentes` correctos — `lib/plantillas/registro.spec.ts`
- [ ] `resolverPlantilla()` resuelve el sufijo de color a la paleta correcta y cae a `paletaDefault` con sufijo inválido — `lib/plantillas/registro.spec.ts`
- [ ] `resolverPlantilla(null)` y plantilla desconocida → preset grilla (fallback) — `lib/plantillas/registro.spec.ts`
- [ ] `resolverTemaDetalle()` deriva primario/tipografía coherentes con el registro — `lib/tema-catalogo.spec.ts`
- [ ] `ProductCard` oculta botón WhatsApp cuando `card.whatsapp==='oculto'` o no hay `whatsappNumero` — `components/catalogo/ProductCard.spec.tsx`
- [ ] `ProductCard` muestra badge índice solo cuando `card.indice` y se pasa `indice` — `components/catalogo/ProductCard.spec.tsx`

### E2E (Playwright)
- [ ] Catálogo carga `/{slug}` y renderiza grid con cada plantilla (color/fuente/formato esperado) — `e2e/tests/13-plantillas/plantillas-unificadas.spec.ts`
