# Plan: Panel horarios — layout 50/50, slots delgados y proporcionales

## Context
El panel "Horarios Disponibles" actualmente tiene ancho fijo de 360px (el formulario ocupa el resto). El usuario quiere:
1. **50/50**: panel y formulario con igual ancho
2. **Más delgado**: slots más compactos verticalmente
3. **Proporcional**: un bloque de 30 min en grid de 15 min ocupa 2 filas; en grid de 30 min ocupa 1 fila. El span = `j - i` (cantidad de intervalos cubiertos)

## Archivos a modificar

1. `apps/web/_includes/e_repro_fechaprogramacion.php` — CSS + JS render (usado por `e_repro_02.php` y otros)
2. `apps/web/e_gine.php` — CSS + JS render (inline)
3. `apps/web/e_urolo.php` — CSS + JS render (inline)

---

## Cambio 1: Layout 50/50 (los 3 archivos, en el bloque CSS de `.panel-horarios`)

**Antes:**
```css
.panel-horarios{width:360px;min-width:360px;...;flex-shrink:0;...}
```

**Después:**
```css
.panel-horarios{flex:1;min-width:0;...}
```
Eliminar `width`, `min-width` y `flex-shrink:0`. El formulario ya tiene `flex:1` → quedan iguales.

---

## Cambio 2: Slots más delgados (los 3 archivos)

**`#panel-slots`** — agregar `grid-auto-rows` fijo (unidad base por intervalo):
```css
#panel-slots{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;grid-auto-rows:26px}
```

**`.panel-slot`** — reducir padding:
```css
.panel-slot{...;padding:3px 6px;border-radius:6px;...}
```

---

## Cambio 3: Row spanning proporcional (los 3 archivos, en la función renderSlots*)

Para slots **agrupados** (ocupado, ocupado_otro, propio): agregar `style="grid-row: span ${j-i}"`.
Para slots **simples** (libre, otro): span 1 implícito, sin cambios.

Ejemplos:

```js
// Ocupado dentro del turno
html += `<div class="panel-slot panel-slot-busy" style="grid-row:span ${j-i}">...`;

// Ocupado fuera del turno
html += `<div class="panel-slot panel-slot-busy-otro" style="grid-row:span ${j-i}">...`;

// Propio (seleccionado)
html += `<div class="panel-slot panel-slot-selected" style="grid-row:span ${j-i};flex-direction:column;...">...`;
```

---

## Verificación

- `e_gine.php`: panel y formulario misma anchura, slots delgados, un bloque 30min = 2 filas de altura
- `e_repro_02.php` (15min): bloque de 30min = 2 filas, 60min = 4 filas
- Slots libres/otro: siempre altura de 1 fila (26px)
