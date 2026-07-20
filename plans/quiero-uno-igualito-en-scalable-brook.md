# Plan — Variantes de color para el template Bebé

## Contexto

Ya existe el template `catalogo-bebe` (coral suave) en `catalogo-react`. El usuario quiere
el **mismo template en varios colores** (azul, verde menta, lila) sin duplicar todos los
componentes. Hoy cada template importa su paleta de forma **estática**
(`import { THEME } from './theme'`), por lo que un mismo árbol de componentes no puede
renderizar en distintos colores.

La solución: convertir el tema en algo **resoluble en runtime** (mapa de temas + React
context), codificar la variante elegida dentro del string `plantilla`
(`catalogo-bebe`, `catalogo-bebe-azul`, `catalogo-bebe-menta`, `catalogo-bebe-lila`) y, en
el panel, mostrar **una sola card "Bebé" con swatches de color** debajo.

Alcance acordado: **solo el template Bebé**. Colores: **Coral (default), Azul, Verde menta,
Lila**. Sin cambios de backend ni base de datos (`plantilla` es `@IsString @MaxLength(50)`,
columna de texto libre — 50 chars alcanza para `catalogo-bebe-menta`).

## Cambios

### 1. React — convertir el tema a runtime (`catalogo-react/templates/catalogo-bebe/`)

**`theme.ts`** — reemplazar el `THEME` único por un mapa de temas:
- Definir `type Tema` con la forma actual del objeto + un nuevo token `footerBg`
  (los pasteles con texto blanco no pasan contraste; el footer usará un tono profundo).
- Exportar `TEMAS: Record<VarianteBebe, Tema>` con 4 entradas:
  - `coral` (la actual), `azul`, `menta`, `lila`.
  - Cada una: `bg, surface, surfaceSoft, border, text, textMuted, primary, primaryDark,
    primaryLight, accent, footerBg`. `primaryDark`/`footerBg` con contraste ≥4.5:1 para
    texto. Neutros tintados hacia el matiz, sin negro/blanco puro (regla impeccable/global).
- Exportar `type VarianteBebe = 'coral' | 'azul' | 'menta' | 'lila'`.
- Exportar `resolverVariante(plantilla: string | null): VarianteBebe` que parsea el sufijo
  (`catalogo-bebe-azul` → `azul`; `catalogo-bebe` o desconocido → `coral`).

**Nuevo `temaContext.tsx`** — context mínimo:
- `const TemaContext = createContext<Tema>(TEMAS.coral)`
- `export function TemaProvider({ tema, children })` y `export function useTema(): Tema`.

**`index.tsx`** — resolver variante desde `config.plantilla` con `resolverVariante(...)`,
tomar `TEMAS[variante]`, envolver el árbol en `<TemaProvider tema={tema}>`. Reemplazar los
`THEME.x` locales por el `tema` resuelto.

**Componentes hijos** (`FilterSidebar.tsx`, `ProductGrid.tsx`, `ProductCard.tsx`,
`Navbar.tsx`, `Footer.tsx`) — sustituir `import { THEME }` + usos `THEME.x` por
`const tema = useTema()` y `tema.x`. Sub-componentes a nivel de módulo
(`ImagenPlaceholder`, `SkeletonCard`, `GruposFacetas`) llaman `useTema()` ellos mismos
(siguen renderizándose dentro del provider). `Footer` usa `tema.footerBg` como fondo en
lugar de `tema.primary` (corrige contraste del texto blanco).

**`WhatsAppFab.tsx`** — sin cambios (verde fijo, no usa el tema).

### 2. React router — `catalogo-react/app/[slug]/page.tsx`

Cambiar la rama exacta `config.plantilla === 'catalogo-bebe'` por
`config.plantilla?.startsWith('catalogo-bebe')`. `CatalogoBebe` ya recibe `config` (con
`plantilla`), así que resuelve la variante internamente — no se añade prop nueva.

### 3. Admin Angular — `frontend/.../catalogo/mi-pagina/`

**`mi-pagina.component.ts`**
- `plantillaActual()` ya existe. Añadir helpers:
  - `esFamiliaBebe(): boolean` → `plantillaActual().startsWith('catalogo-bebe')`.
  - `varianteBebeActual(): 'coral'|'azul'|'menta'|'lila'` (parsea el sufijo, default coral).
  - `seleccionarVarianteBebe(color)` → setea `plantilla` a `catalogo-bebe` (coral) o
    `catalogo-bebe-<color>`.
- `seleccionarPlantilla('catalogo-bebe')` (click en la card) deja coral por defecto.
- Definir lista de swatches `VARIANTES_BEBE = [{key,color,label}, ...]` para el template.

**`mi-pagina.component.html`**
- Card "Bebé": activar con `esFamiliaBebe()` en `plantilla-card--active`.
- Debajo de la card (o dentro, tras `plantilla-info`), cuando `esFamiliaBebe()`, renderizar
  una fila de swatches (`@for`) con `*` redondos coloreados; el activo
  (`varianteBebeActual()===key`) lleva anillo. Click → `seleccionarVarianteBebe(key)`
  (con `$event.stopPropagation()` para no re-disparar la card).
- Opcional (polish): bindear el color de los elementos coral del mini-preview
  (`pp-logo--bebe`, `pp-product` accent) a la variante activa vía `[style.background]`.

**`mi-pagina.component.css`**
- Estilos `.bebe-swatches`, `.bebe-swatch`, `.bebe-swatch--active` (anillo).
- Reusar `.plantilla-check--bebe` existente.

### 4. Sin cambios

Backend DTO/entidad, `database/setup-completo.sql`: no se tocan (string libre, sin enum).

## Archivos críticos

- `catalogo-react/templates/catalogo-bebe/theme.ts` (reescribir: mapa + resolver)
- `catalogo-react/templates/catalogo-bebe/temaContext.tsx` (nuevo)
- `catalogo-react/templates/catalogo-bebe/{index,FilterSidebar,ProductGrid,ProductCard,Navbar,Footer}.tsx`
- `catalogo-react/app/[slug]/page.tsx`
- `frontend/src/app/features/catalogo/mi-pagina/mi-pagina.component.{ts,html,css}`

## Verificación

1. `cd catalogo-react && npx tsc --noEmit` → sin errores.
2. `cd frontend && npm run build` → compila.
3. Manual catálogo: con un negocio cuyo `plantilla` sea `catalogo-bebe-azul`, abrir
   `/<slug>` → render azul, filtro a la izquierda, sin `[object Object]`. Repetir con
   `-menta` y `-lila`; sin sufijo → coral.
4. Manual admin: Mi Página → Plantilla → card Bebé → elegir swatch azul → guardar →
   recargar → swatch azul sigue activo y `plantilla === 'catalogo-bebe-azul'`.
5. A11y: verificar contraste del footer (texto blanco sobre `footerBg`) en las 4 variantes.

## Tests recomendados

### Unit (Jest — Frontend)
- `seleccionarVarianteBebe('azul')` deja `plantilla='catalogo-bebe-azul'`;
  `'coral'` deja `'catalogo-bebe'` — `mi-pagina.component.spec.ts`
- `varianteBebeActual()` parsea correctamente cada sufijo y default coral — idem
- `esFamiliaBebe()` true para `catalogo-bebe*`, false para grilla/esencias — idem

### Unit (React, si hay runner) / smoke
- `resolverVariante()` mapea sufijos → variante y default coral — `theme` util

### E2E (Playwright)
- Mi Página → Bebé → swatch azul → guardar → recargar → azul persiste —
  `e2e/tests/XX-mi-pagina/plantilla-bebe-variantes.spec.ts`
