# Plan — Modal de detalle de producto (catálogo)

## Context

El catálogo público (`catalogo-react`) muestra grillas de productos pero click en tarjeta no hace nada. El objetivo: abrir un modal de detalle premium al hacer click en cualquier producto, mostrando galería de imágenes, descripción completa, colores (swatches) y tallas con selección interactiva.

El backend **ya devuelve** `atributos` en `ProductoPublicoDto` — query raw sobre `producto_variante` → `atributo_valor`. Solo falta el frontend.

Dos templates independientes: `catalogo-grilla` (verde, familiar) y `catalogo-esencias` (dorado, boutique). **Diseño con total libertad creativa usando /ui-ux-pro-max e /impeccable.**

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `catalogo-react/lib/types.ts` | Agregar `AtributoPublico`, `ValorAtributoPublico` + campo en `ProductoPublico` |
| `catalogo-react/components/ProductoDetalleModal.tsx` | **Nuevo** — modal compartido que recibe tema |
| `catalogo-react/templates/catalogo-grilla/ProductCard.tsx` | Agregar `onClick` prop |
| `catalogo-react/templates/catalogo-grilla/ProductGrid.tsx` | Propagar `onClickProducto` |
| `catalogo-react/templates/catalogo-grilla/index.tsx` | State + render modal |
| `catalogo-react/templates/catalogo-esencias/ProductCard.tsx` | Agregar `onClick` prop |
| `catalogo-react/templates/catalogo-esencias/ProductGrid.tsx` | Propagar `onClickProducto` |
| `catalogo-react/templates/catalogo-esencias/index.tsx` | State + render modal |

---

## 1. `lib/types.ts` — Nuevos tipos

```ts
export interface ValorAtributoPublico {
  id: number;
  valor: string;        // hex ("#EF4444") para color, "41"/"M" para talla
  etiqueta: string | null;
  orden: number;
}

export interface AtributoPublico {
  tipoId: number;
  nombre: string;       // "Color", "Talla calzado adulto"
  slug: string;
  afectaImagen: boolean; // true → render swatch circular
  valores: ValorAtributoPublico[];
}
```

Agregar a `ProductoPublico`:
```ts
atributos?: AtributoPublico[];
```

---

## 2. `components/ProductoDetalleModal.tsx` — Diseño premium

**Props:**
```ts
interface Props {
  producto: ProductoPublico | null;
  onCerrar: () => void;
  whatsappNumero: string | null;
  tema: {
    primario: string;      // color brand del template
    fondo: string;         // bg del modal info
    texto: string;         // color de texto
    textoMuted?: string;
  };
  estiloTipografia?: 'sans' | 'serif'; // grilla=sans, esencias=serif
}
```

### Layout (Desktop — 2 columnas, Mobile — stack)

```
┌─────────────────────────────────────────────────┐
│  [×]                                            │  ← overlay negro 65%
│  ┌──────────────────┬──────────────────────────┐│
│  │                  │  Nombre del producto      ││
│  │   IMAGEN         │  Marca (si existe)        ││
│  │   PRINCIPAL      │                           ││
│  │   (objeto-cover) │  S/ 49.90  ~~S/ 79.90~~  ││
│  │                  │  [OFERTA]                 ││
│  │                  │─────────────────────────  ││
│  ├──────────────────│  Descripción completa     ││
│  │ [img1][img2][img3│  (sin line-clamp)         ││
│  │  thumbnails]     │─────────────────────────  ││
│  └──────────────────│  Color  ●  ●  ●          ││
│                     │  Talla  [S] [M] [L] [XL] ││
│                     │─────────────────────────  ││
│                     │  [WhatsApp — Consultar]   ││
│                     └──────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Especificaciones visuales

**Modal container:**
- Desktop: `max-w-4xl` centrado, `rounded-2xl`, sombra `shadow-2xl`, max-h 90vh, scroll interno
- Mobile: fullscreen (`fixed inset-0`), slide-up animation
- Transición entrada: `opacity-0 scale-95 → opacity-100 scale-100` (150ms ease-out)

**Galería:**
- Imagen principal: `aspect-[4/3]` md:`aspect-[3/4]` según orientación del contenido
- Thumbnails: fila scrollable horizontal, `w-16 h-16 rounded-lg`, borde primario cuando activo
- Sin imágenes: SVG placeholder con tonos del tema

**Colores (`afectaImagen: true`):**
- Círculos `w-8 h-8 rounded-full border-2`
- No seleccionado: `border-gray-200`
- Seleccionado: `ring-2 ring-offset-2` con color primario del tema
- Tooltip con `etiqueta` on hover

**Tallas (`afectaImagen: false`):**
- Pills `px-3 py-1.5 rounded-full text-sm font-semibold border`
- No seleccionado: `border-gray-300 text-gray-700 bg-white`
- Seleccionado: `border-primario bg-primario text-white`

**Mensaje WhatsApp dinámico:**
```
Hola, me interesa:
*Nombre del producto*
💰 S/ 49.90
🎨 Color: Rojo  (si seleccionado)
📏 Talla: M     (si seleccionado)
```

**Cierre:**
- Botón × en esquina superior derecha (siempre visible, no scroll con contenido)
- Click en overlay cierra
- `Escape` cierra (keydown listener)

---

## 3. ProductCard — ambos templates

Agregar `onClickProducto?: () => void` y wrap clickeable:

```tsx
<article
  className="group ... cursor-pointer"
  onClick={onClickProducto}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && onClickProducto?.()}
>
  ...
  {/* Botón WhatsApp: stopPropagation para no abrir modal */}
  <a onClick={(e) => e.stopPropagation()} href={whatsappUrl} ...>
```

---

## 4. ProductGrid — ambos templates

Agregar `onClickProducto?: (producto: ProductoPublico) => void` y pasar a cada `ProductCard`.

---

## 5. index.tsx — ambos templates

```tsx
const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoPublico | null>(null);

// Pasar a ProductGrid:
onClickProducto={(p) => setProductoSeleccionado(p)}

// Al final del JSX:
<ProductoDetalleModal
  producto={productoSeleccionado}
  onCerrar={() => setProductoSeleccionado(null)}
  whatsappNumero={config.whatsappNumero}
  tema={TEMA_GRILLA /* o TEMA_ESENCIAS */}
  estiloTipografia="sans" /* o "serif" */
/>
```

**Tema grilla:**
```ts
{ primario: '#366758', fondo: '#ffffff', texto: '#1b1c1a', textoMuted: '#6b7280' }
```

**Tema esencias:**
```ts
{ primario: '#b8975c', fondo: '#f7f3ee', texto: '#1a1209', textoMuted: '#7a6a58' }
```

---

## Verificación

1. `cd catalogo-react && npm run dev`
2. Abrir `/[slug]` con negocio real o mock-data
3. Click en producto → modal abre con animación
4. Galería: thumbnails clickeables cambian imagen principal
5. Si hay colores → swatches visibles con selección por ring
6. Si hay tallas → pills con toggle activo
7. Botón WhatsApp incluye color/talla en el mensaje si están seleccionados
8. Escape / click overlay cierra modal
9. Mobile: modal fullscreen, scroll funciona
10. Repetir con template `catalogo-esencias`

---

## Tests recomendados

### Unit (Jest)
- Modal sin atributos: solo muestra galería + descripción + precio
- Click thumbnail cambia imagen activa
- Seleccionar color actualiza estado, deseleccionar lo limpia
- Mensaje WhatsApp incluye etiqueta de color y talla seleccionados
- Escape dispara `onCerrar`
- stopPropagation en botón WhatsApp de la card (no abre modal)
