# Rediseño UNIMAR v2 — en paralelo, sin tocar lo existente

## Contexto

Se instalaron skills de diseño nuevas. Dos objetivos:

1. **Ordenar el arsenal**: decidir qué skill manda sobre qué, con `emil-design-eng` y
   `taste-skill` como prioridad 1 e `impeccable` como prioridad 2, eliminando solapamiento
   (hoy 4 skills opinan sobre color, motion y layout, y se contradicen entre sí).
2. **Rediseñar la web** bajo esas reglas, construyendo en paralelo: carpeta y rutas nuevas,
   cero archivos de contenido tocados, misma data JSON bilingüe, mismos 2 colores de marca
   (`#0F3E67` / `#3F6585`).

El sitio actual funciona pero arrastra tells: hero slideshow genérico, intro `text-justify`
centrada, grillas de 3 tarjetas iguales repetidas 4 veces, `Inter/Montserrat` por defecto,
reveal de 800ms con stagger de 120ms (lento), y ningún estado `:active` en botones.

---

## Parte 1 — Inventario de skills y resolución de solapamiento

### Jerarquía de autoridad

| Nivel | Skill | Dominio exclusivo |
|---|---|---|
| **P1** | `emil-design-eng` | **Cómo se siente y se mueve.** Easings, duraciones, estados (`:hover`/`:active`/`:focus`), feedback de press, entrada/salida de modales y popovers, `transform-origin`, interrumpibilidad, stagger, reduced-motion, rendimiento de animación. Manda sobre cualquier otra skill en motion. |
| **P1** | `taste-skill` | **Cómo se compone y qué NO se escribe.** Familias de layout, reglas de hero, variedad de secciones, ban de eyebrows, ban de em-dash, tells de copy, estrategia de imágenes, protocolo de rediseño (§11). Manda en composición e IA visual. |
| **P2** | `impeccable` | **Solo donde P1 calla.** Gates de contexto (PRODUCT.md / DESIGN.md), color en OKLCH y estrategia de compromiso, neutros tintados, escala tipográfica, tokens reutilizables, y los comandos `critique` / `audit` / `harden` / `polish` como QA final. |
| **P3** | `gsap-react`, `gsap-scrolltrigger`, `gsap-core`, `gsap-timeline`, `gsap-performance` | Referencia técnica bajo demanda. No opinan de diseño, solo de API. |
| **QA** | `review-animations`, `unimar-audit` | Se invocan **después** de construir, nunca durante. |
| **Silenciadas** | `ui-ux-pro-max`, `apple-design`, `prototype`, `pick-ui-library`, `find-animation-opportunities`, `improve-animations`, `animation-vocabulary`, `gsap-frameworks` | Ver abajo. |

### Por qué se silencian

- **`ui-ux-pro-max`** — solapa 100% con `taste-skill` (estilos, paletas, tipografía) e
  `impeccable` (review/fix de código UI). Su valor son catálogos de 96 paletas y 57
  pairings; aquí la marca ya está bloqueada en 2 azules. Aportaría ruido y contradicción.
- **`apple-design`** — su núcleo es gesto, spring física, hojas arrastrables y materiales
  translúcidos. Este es un sitio corporativo B2B de scroll, sin gestos. Además `taste-skill`
  prohíbe glassmorphism decorativo, que es donde más solaparían.
- **`prototype` / `pick-ui-library`** — el stack ya está decidido y documentado en CLAUDE.md.
- **Las 3 skills de auditoría de animación** — son read-only sobre código ya escrito. Se usa
  solo `review-animations` al cierre; `find-animation-opportunities` e `improve-animations`
  harían el mismo trabajo que ya hace el framework de decisión de emil durante el build.
- **`gsap-frameworks`** — es para Vue/Svelte. No aplica.

### Conflictos reales encontrados y su resolución

| Tema | `taste-skill` | `emil-design-eng` | `impeccable` | Resolución |
|---|---|---|---|---|
| Librería de motion | `motion/react` obligatorio | CSS transitions para UI, springs para gestos | ease-out exponencial | **GSAP** para scroll/pin (ya instalado, `@gsap/react`) + **CSS transitions** para estados de UI. **No se instala Motion.** El proyecto manda sobre el default de la skill. |
| Tailwind | v4 | - | - | **v3.4** (el propio taste §3.A lo permite si el proyecto lo exige). |
| Iconos | Phosphor; desaconseja lucide | - | - | **lucide-react** (taste permite "el proyecto ya depende"). Una sola familia, `strokeWidth` global. |
| Fuentes | nunca `<link>` a Google Fonts en prod | - | - | **Self-host `woff2`** con `@font-face` propio de v2. Bonus: cero cambios en `index.html`. |
| Color | máx 1 acento, regla LILA | - | OKLCH, nunca `#000`/`#fff`, estrategia comprometida | **2 azules de marca** (override explícito del usuario sobre "1 acento"), neutros tintados hacia el hue primario en OKLCH. El `accent: #3b82f6` de `theme.json` **no se usa en v2**. |
| Cards | solo si la elevación comunica jerarquía real | - | "cards es la respuesta perezosa" | Coinciden. Agrupar con hairlines, `divide-y` y espacio negativo. |
| `transition: all` | lo usa en §7 nivel 4-7 | prohibido | - | **Prohibido.** Emil gana: propiedades explícitas siempre. |
| Duración | hasta 0.3s genérico | <300ms en UI, tabla por elemento | - | **Tabla de emil**, sección de motion en DESIGN.md. |
| Em-dash | ban binario, cero | - | ban | **Aplica solo a copy nuevo de UI v2.** Los JSON existentes tienen em-dashes (`"—vacío y lleno—"`) y **no se tocan**: el usuario pidió preservar la data. |
| Dark mode | obligatorio dual | - | el escenario decide | **Dual mode** (decidido por el usuario). |

### Gate de `impeccable` (estado actual)

- `PRODUCT.md` — **existe y es sólido** (register `brand`, anti-referencias explícitas,
  5 principios). Gate pasa, no hay que correr `teach`.
- `DESIGN.md` — **no existe**. Es el primer entregable del plan. CLAUDE.md global ya exige
  leer `DESIGN.md`/`DESIGN.json` antes de escribir HTML, así que esto cierra una deuda real.

---

## Parte 2 — Design Read y dials

> **Reading this as:** rediseño-overhaul de un sitio corporativo B2B logístico para
> compradores profesionales peruanos, con lenguaje industrial-editorial anclado en
> trayectoria, apoyado en Tailwind v3 + tokens OKLCH + GSAP restringido.

**Dials (taste §1):** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 5` · `VISUAL_DENSITY: 4`

Justificación: preset "redesign - overhaul" sobre un sitio actual que lee 3/2/5. Sube
varianza y motion, mantiene densidad. No se va a 9/8 porque el comprador B2B bajo presión
(principio 2 de PRODUCT.md) penaliza el scroll-hijack.

**Modo taste §11.A:** *Redesign - Overhaul* con preservación estricta de contenido e IA.

**Nunca cambia (taste §11.F):** slugs de ruta, labels de nav, nombres de campos del
formulario, logo, copy de los JSON, eventos de analytics.

---

## Parte 3 — Aislamiento

Todo lo nuevo vive en `src/presentation-v2/`. Consume los hooks existentes de
`@app/*` y los mismos `public/locales/**` — **cero duplicación de data**.

**Único archivo existente que se modifica: `src/App.tsx`.** Se parte el árbol de rutas en
dos ramas para que `/v2` no herede `MainLayout`:

```tsx
<Routes>
  <Route path="/v2/*" element={safe(<AppV2 />)} />
  <Route path="/*" element={<MainLayout><Routes>{/* rutas actuales, intactas */}</Routes></MainLayout>} />
</Routes>
```

Revertir = borrar una línea y desanidar. No se tocan `vite.config.ts`, `tsconfig`,
`tailwind.config.js`, `index.html`, `tina/config.ts`, ni ningún JSON.

**Sin alias nuevo** (`@v2/*` obligaría a tocar tsconfig + vite): imports relativos dentro
de `presentation-v2/`, y `@app/*` para los hooks compartidos.

**Aislamiento de tokens.** `ThemeProvider` escribe variables en `document.documentElement`
y sigue haciéndolo. v2 monta un contenedor con `data-v2` y `data-theme="light|dark"` que
define su propia rampa en cascada; lo único que hereda de `:root` son
`--primary-color` / `--secondary-color`, manteniendo los 2 azules como fuente única.

---

## Parte 4 — Archivos a crear

### Sistema (primero, en orden)

- **`DESIGN.md`** (raíz) — cierra el gate de impeccable y el requisito de CLAUDE.md global.
  Contiene: rampa OKLCH claro/oscuro derivada de los 2 azules, escala tipográfica, spec de
  motion (tabla de emil), familias de layout permitidas por sección, y la decisión dual-mode
  con su frase de escena física.
- **`src/presentation-v2/styles/tokens.css`** — `@font-face` self-hosted, variables
  scoped a `[data-v2]`, override bajo `[data-v2][data-theme="dark"]`, easings de emil
  (`--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`),
  escala de radios única, sombras tintadas hacia el hue primario, bloque
  `@media (prefers-reduced-motion: reduce)`.
- **`public/fonts/`** — `woff2` de la familia elegida. Display **Archivo Expanded** (grotesca
  industrial variable, evoca señalética portuaria), texto **Archivo**, datos y fechas en
  **Archivo Narrow**. Ni Inter, ni serif, ni ninguna de las baneadas por taste §4.1. CSP
  actual ya permite `font-src 'self'`.

### Shell

- `shared/layouts/LayoutV2.tsx` — wrapper `data-v2` + `data-theme`, header, main, footer.
- `shared/layouts/HeaderV2.tsx` + `header/{NavV2,MobileMenuV2,LanguageToggleV2,ThemeToggleV2}.tsx`
  — nav en **una sola línea** en desktop, altura máx 72px (taste §4.7). Labels idénticos a
  `common.json`.
- `shared/layouts/FooterV2.tsx`
- `shared/components/{ButtonV2,ModalV2,PageStatusV2,SurfaceV2}.tsx`
  — `ButtonV2`: `:active { transform: scale(0.97) }`, `transition: transform 160ms var(--ease-out)`,
  hover detrás de `@media (hover:hover) and (pointer:fine)`, contraste AA verificado en ambos modos.
  — `ModalV2`: `transform-origin: center` (excepción de emil para modales), entrada
  `scale(0.96)→1` + opacity en 200ms ease-out, salida más rápida, foco atrapado, `Esc`.
- `shared/animation/useRevealV2.ts` — clon del patrón de
  [useScrollReveal.ts](src/presentation/shared/animation/useScrollReveal.ts) reusando su
  `gsap.setup.ts`, pero recalibrado a valores de emil: `y: 16`, `duration: 0.45`,
  `stagger: 0.06` (hoy 40/0.8/0.12, demasiado lento y con stagger largo).

### Home

`home/screens/HomeScreenV2.tsx` consume **los mismos hooks** `useHomeData` + `useHomeTinaData`
+ `useCommonData`, así que la edición en TinaCMS sigue funcionando en v2 sin tocar `tina/config.ts`.

Orden de secciones **idéntico al actual** (la IA no cambia), pero cada una cambia de familia
de layout para cumplir taste §4.7 (mínimo 4 familias distintas, cero repetición, máx 2
eyebrows en 7 secciones, prohibidas las 3 tarjetas iguales):

| # | Componente | Data que consume | Familia de layout | Qué arregla |
|---|---|---|---|---|
| 1 | `HeroV2.tsx` | `home.hero.slides` (9) | Asymmetric Split Hero, `min-h-[100dvh]` | Máx 4 elementos de texto, headline ≤2 líneas, sin scroll cue, sin pill de versión. Crossfade + escala sutil, barra de progreso lineal, pausa en hover. Preload de la primera imagen. |
| 2 | `IntroStatement.tsx` | `home.intro_text` | Editorial statement full-width | Mata el `text-justify` centrado actual. Alineado a la izquierda, `max-w-[65ch]`, escala de display. |
| 3 | `CredentialsStrip.tsx` | `certificaciones` (6) | Marquee (**el único de la página**) o scroll-snap horizontal | Las 6 certificaciones dejan de ser una grilla plana; el nombre se conserva como caption accesible porque BASC/SANIPES son credenciales reales, no un logo wall de clientes. |
| 4 | `LogisticsShowcase.tsx` | `gestion_logistica` (3 + modales) | Trío asimétrico (1 grande + 2), hover revela imagen | Rompe las 3 tarjetas iguales. Abre `ModalV2` reusando `activeLogisticsModal` del store existente. |
| 5 | `ComunicadosList.tsx` | `comunicados` (búsqueda + items) | Lista con hairlines agrupadas, sin cards | UI de utilidad real. Emil: la escritura en el buscador **no anima** (acción de teclado). Estados vacío y sin-resultados diseñados, usando `no_results` del JSON. |
| 6 | `TarifasBand.tsx` | `tarifas` (3) | Banda full-bleed en primary (estrategia "committed" de impeccable) | Contraste AA sobre azul verificado. Filas de descarga, no tarjetas. |
| 7 | `ContactCTA.tsx` | `common.footer.quote_link` | CTA contextual sobre imagen real | Principio 5 de PRODUCT.md: el CTA vive junto al contenido. Un solo label por intención (taste: sin CTAs duplicados). |

**Imágenes:** se usan exclusivamente las rutas reales de `public/locales/shared/home.json`
vía `resolveImageUrl()` de [url.utils.ts](src/application/utils/url.utils.ts). Cero
picsum, cero SVG decorativo a mano, cero screenshot falso de divs.

### Fuera de esta entrega

`/v2/nosotros`, `/v2/servicios/:slug`, `/v2/contacto`, `/v2/requisitos-sst` quedan
especificadas en `DESIGN.md` (familia de layout por sección) y se construyen en una segunda
pasada, una vez validada la dirección de la Home.

---

## Parte 5 — Verificación

1. `npm run dev` → abrir `/#/` y `/#/v2` en paralelo. La v1 debe verse **idéntica** a antes.
2. **Ambos modos**: toggle claro/oscuro en cada sección de `/#/v2`. Ninguna sección invierte
   tema respecto a la página (taste §4.11).
3. **Contraste**: DevTools sobre texto en banda primary, placeholders del buscador, focus
   rings, y labels de botón. WCAG AA mínimo, en los dos modos.
4. **Teclado**: tab completo por header, toggle de idioma, toggle de tema, buscador de
   comunicados, apertura y cierre del modal con `Esc`, foco devuelto al trigger.
5. **Reduced motion**: activar en el SO, recargar. Reveals, marquee y crossfade del hero
   colapsan a estático; se conservan solo opacidad y color.
6. **Idiomas**: cambiar a EN y recorrer las 7 secciones buscando desbordes de texto.
7. `npm run lint` y `npm run build` (incluye `validate:images` y `tsc -b`) en verde.
8. **Emil check final**: cero `transition: all`, cero `scale(0)`, cero `ease-in`, cero
   animación en acciones de teclado, hover siempre tras `@media (hover:hover)`.
9. **Taste pre-flight**: contar eyebrows (≤2), contar marquees (=1), verificar que no hay
   3 tarjetas iguales, ni 3 zigzags seguidos, ni em-dash en copy nuevo, ni CTA que envuelva
   a 2 líneas en desktop.
10. Invocar `/review-animations` sobre el diff, y `/unimar-audit validate` para el gate de
    SOLID + DDD del proyecto.
11. `npm run perf:lighthouse` sobre `/v2`: LCP < 2.5s, CLS < 0.1.
