# Plan: Fix galería collage ServiceDetailScreen

## Contexto
El IIFE con chunks y altura fija `h-[520px]` produce imágenes enormes y desalineadas. La imagen grande (col-span-2) dentro de 520px se estira demasiado. Hay que reemplazar toda la lógica por layouts condicionales simples según la cantidad de imágenes.

## Archivo a modificar
`src/presentation/services/screens/ServiceDetailScreen.tsx` — solo la sección `{/* Galería */}`

## Solución: layout condicional por cantidad

Eliminar el IIFE/chunks. Usar un switch sobre `gallery.length` con un grid distinto por caso.

### Layout por cantidad

**2 imágenes** — `grid-cols-2 h-[280px]`
```
[ img0 ] [ img1 ]
```

**3 imágenes** — `grid-cols-3 auto-rows-[240px]`
```
[ img0 (col-span-2, row-span-2) ] [ img1 ]
                                  [ img2 ]
```

**4 imágenes** — `grid-cols-3 auto-rows-[260px]` (patrón en Z)
```
[ img0 (col-span-2) ] [ img1 ]
[ img2 ] [ img3 (col-span-2) ]
```

**5+ imágenes** — `grid-cols-3` con `aspect-[4/3]` en cada celda (sin row-span, grid uniforme)

### Patrón de celda (igual en todos los casos)
```tsx
<div className="group relative overflow-hidden rounded-2xl shadow-md h-full">
  <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
  {caption && <div className="absolute inset-0 bg-gradient-to-t from-black/70 ... opacity-0 group-hover:opacity-100">...</div>}
</div>
```

### Por qué funciona
- `auto-rows-[240px]` + `row-span-2` = 240+gap+240 ≈ altura de la imagen grande. Sin IIFE, sin chunks.
- `h-full` en cada celda hace que `object-cover` llene la fila del grid sin estirar.
- Sin IIFE ni chunks → JSX limpio y predecible.

## Verificación
- Abrir `/servicios/deposito-temporal` (4 imgs) → patrón Z
- Abrir `/servicios/deposito-aduanero-y-simple` (3 imgs) → 1 grande + 2 apiladas
- Abrir `/servicios/transporte-y-distribucion` (2 imgs) → 50/50
- Confirmar que no hay espacio blanco ni imágenes estiradas
