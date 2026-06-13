# Plan: Fix mobile overlay + responsive catalog modal + mobile preview

## Context
Bugs resueltos en sesión anterior:
1. **Overlay bloqueante** — `cerrarMovil()` agregado en `seleccionarElemento()` ✅
2. **Modal catálogo no responsivo** — columnas apiladas con `flex-col sm:flex-row`, `maxHeight: 95dvh`, `min-h-0` ✅
3. **p-toast bloqueando clicks en móvil** — `pointer-events: none` global + p-toast eliminado del dialog ✅

Nueva mejora solicitada: **mostrar panel de previsualización en móvil**, encima del formulario (actualmente `hidden lg:flex` lo oculta en móvil).

---

## Cambio único: previsualización visible en móvil

**Archivo:** `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.html`

### Cambio A — Contenedor principal: layout column en móvil, row en desktop
```html
<!-- Antes -->
<div class="flex gap-0 flex-1 overflow-hidden min-h-0">
<!-- Después -->
<div class="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden min-h-0">
```

### Cambio B — Panel previsualización: visible en móvil, compacto arriba
```html
<!-- Antes -->
<div class="hidden lg:flex flex-col w-[320px] flex-shrink-0 bg-surface-50 border-r border-surface-200 rounded-l-xl p-5 gap-4">
<!-- Después -->
<div class="flex flex-col shrink-0 lg:w-[320px] lg:flex-shrink-0 bg-surface-50 border-b lg:border-b-0 lg:border-r border-surface-200 lg:rounded-l-xl p-4 lg:p-5 gap-3 lg:gap-4">
```
En móvil: ancho 100%, `border-b` horizontal, sin `rounded-l-xl`.  
En desktop: comportamiento original (`w-[320px]`, `border-r`, `rounded-l-xl`).

### Cambio C — ID chip al fondo: ocultar en móvil (ahorra espacio)
```html
<!-- Antes -->
<div class="mt-auto text-center">
<!-- Después -->
<div class="hidden lg:block mt-auto text-center">
```

### Cambio D — Eliminar subheader móvil (ya innecesario con preview visible)
```html
<!-- Quitar esta línea (~102): -->
<p class="text-sm text-surface-500 lg:hidden">Edita la información visible en el catálogo.</p>
```

---

## Archivos críticos
- `frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.html` — líneas 11, 14, 91, 102

---

## Verificación
1. Móvil (<1024px): abrir modal catálogo → ver tarjeta de previsualización en la parte superior, campos del formulario debajo con scroll.
2. Desktop (≥1024px): previsualización sigue en panel izquierdo lateral, formulario a la derecha — sin regresión.
3. La tarjeta preview se actualiza en tiempo real al escribir nombre, precio, activar oferta, toggle visibilidad.
4. El ID chip solo se ve en desktop (evita ruido visual en móvil).
