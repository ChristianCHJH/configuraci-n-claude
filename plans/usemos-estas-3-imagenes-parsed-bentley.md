# Plan — Sección de screenshots en la landing de Adifnex

## Context

La landing (`catalogo-react/app/page.tsx`, la web `inventario-multisede-catalogo-react.vercel.app`)
explica el producto solo con texto y precios. No muestra **cómo se ve** el producto.
Christian entregó 3 capturas reales y quiere una sección nueva que comunique 3 capacidades:

1. **Catálogo virtual** de productos (grid público con filtros)
2. **Detalle y variantes** de producto (tallas, colores, foto grande, botón WhatsApp)
3. **Analítica de visitas** — productos más vistos y visitas a la página

Las imágenes hoy están sueltas en la raíz del repo padre. Deben moverse al submódulo
`catalogo-react` (donde vive la web) y renderizarse en la landing.

## Archivos

- **Nuevo**: `catalogo-react/public/` (carpeta no existe aún) con las 3 imágenes renombradas a kebab-case:
  | Origen (raíz repo padre) | Destino |
  |--------------------------|---------|
  | `catalogo.png` | `catalogo-react/public/showcase-catalogo.png` |
  | `detalle de producto.png` | `catalogo-react/public/showcase-detalle-producto.png` |
  | `gestion_analitica_productos.png` | `catalogo-react/public/showcase-analitica.png` |
- **Editar**: `catalogo-react/app/page.tsx` — agregar componente `Showcase()` y montarlo en `Home()`.

Las capturas del repo padre se **mueven** (no copiar+dejar duplicado): quedan versionadas
dentro del submódulo `catalogo-react`, que es lo que Vercel despliega.

## Implementación

### 1. Mover imágenes
Crear `catalogo-react/public/` y mover ahí las 3 PNG con los nombres kebab-case de la tabla.
Borrar los originales de la raíz del repo padre (evitar duplicado sin usar).

### 2. Nuevo componente `Showcase` en `app/page.tsx`
Insertar la función **entre `Problema` y `ComoFunciona`** (orden narrativo: problema →
esto es lo que obtienes → cómo empiezas), y añadir `<Showcase />` en `Home()` en esa posición.

Patrón: filas zig-zag (imagen / texto alternados) — funciona bien con capturas anchas.
Reutilizar los tokens y clases ya presentes en el archivo, **sin hardcodear colores nuevos**:

- Fondo de sección: `bg-white` (Problema termina con callout verde `#DCFCE7`, que separa visualmente; ComoFunciona que sigue es verde `#F0FDF4`).
- Encabezado con el mismo patrón que las otras secciones:
  `font-[family:var(--font-quicksand)] text-3xl sm:text-4xl font-bold text-[#14532D]` + subtítulo `text-[#6B7280] text-lg`.
- Marco de cada screenshot: `rounded-2xl shadow-sm border border-[#DCFCE7] overflow-hidden` (mismo lenguaje visual que las cards de ComoFunciona).
- Imagen: `<img>` plano (el proyecto **no usa `next/image`** en ningún lado — ver `ProductCard.tsx:105`, `ProductoDetalleContenido.tsx:130`), con `className="w-full h-auto"`, `alt` descriptivo y `loading="lazy"`.
- Título de cada feature: `text-[#14532D]` quicksand bold; descripción `text-[#6B7280]`; acento naranja `text-[#EA580C]` si se usa un check/emoji.
- Contenedor: `max-w-5xl mx-auto`, filas `grid md:grid-cols-2 gap-8 md:gap-12 items-center`, alternando el orden con `md:order-2` en filas impares.

Contenido (texto en español, tono de la landing):

| Screenshot | Título | Descripción |
|-----------|--------|-------------|
| `showcase-catalogo.png` | Catálogo virtual siempre actualizado | Tus productos en una tienda pública con filtros por talla, color y categoría. El cliente ve stock y precio real, sin preguntarte por WhatsApp. |
| `showcase-detalle-producto.png` | Detalle y variantes de cada producto | Ficha con foto grande, galería, tallas y colores. Un clic en "Consultar por WhatsApp" y la venta arranca. |
| `showcase-analitica.png` | Analítica de tu catálogo | Mira qué productos se ven más y cuántas visitas recibe tu tienda. Decide con datos, no con corazonadas. |

### 3. Verificación de guardas del proyecto
- No se toca `frontend/src/environments/environment.prod.ts` (protegido). ✔ (cambios solo en `catalogo-react`).
- No hay cambios de BD → no aplica `setup-completo.sql`. ✔

## Verificación (end-to-end)

1. El dev Docker ya está levantado; el catálogo corre en `http://localhost:3010`.
   Rebuild del contenedor catalogo apuntando al contexto correcto **está pendiente/roto**
   (compose usa `./catalogo` en vez de `./catalogo-react`), así que verificar con dev server local:
   ```
   cd catalogo-react && npm run dev
   ```
   Abrir `http://localhost:3000` (o el puerto que reporte) y confirmar:
   - Las 3 capturas cargan (no 404) entre "¿Te suena familiar?" y "Cómo funciona".
   - Layout zig-zag responsive: en móvil las filas se apilan (imagen arriba, texto abajo).
   - Colores coinciden con el resto de la landing (verdes/naranja, sin tonos nuevos).
2. `npm run build` en `catalogo-react` compila sin errores.

## Fuera de alcance (mencionar, no ejecutar sin OK)
- El bug del compose dev (`./catalogo` → `./catalogo-react`) que impide el rebuild del contenedor `catalogo`. Se puede arreglar en un paso aparte si Christian quiere ver la sección dentro de Docker en vez del dev server.
