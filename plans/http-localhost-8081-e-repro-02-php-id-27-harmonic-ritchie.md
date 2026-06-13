# Plan: Ancho proporcional de bloques parciales en Panel Horarios

## Context

El panel de "Horarios Disponibles" usa un CSS grid de 2 columnas cuando `intervaloMinutos = 30`. Cada columna representa 30 min (50% del ancho de la fila). El problema: cuando un agendamiento solo ocupa 15 min dentro de un slot de 30 min (bloque parcial), se renderiza dentro de un único flex-container que sigue ocupando 1 columna (50%). Visualmente parece un bloque de 30 min. Debe ocupar 25% (proporcional a 15/60 min). El fix ya fue aplicado a repro; falta aplicarlo a gine y urolo.

## Archivos a modificar

| Archivo | Función | Línea aprox | Estado |
|---------|---------|-------------|--------|
| `apps/web/_includes/e_repro_fechaprogramacion.php` | `renderSlotsPanelHorarios` | ~710 | ✅ Ya corregido |
| `apps/web/e_gine.php` | `renderSlotsPanelHorarios` | 697 | ❌ Pendiente |
| `apps/web/e_urolo.php` | `renderSlotsPanelHorariosUrolo` | 702 | ❌ Pendiente |

## Implementación para e_gine.php y e_urolo.php

Mismo patrón ya aplicado en `_includes/e_repro_fechaprogramacion.php`. En cada archivo:

### Paso 1 — Agregar `gcd` helper antes de la función

**e_gine.php** (antes de línea 697):
```javascript
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
```

**e_urolo.php** (antes de línea 702):
```javascript
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
```

### Paso 2 — Reemplazar cálculo de numCols

En ambos archivos, reemplazar:
```javascript
const numCols = intervaloMinutos <= 15 ? 4 : 2;
slotsEl.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
```
por (insertar DESPUÉS del bloque `slotsConEstado`):
```javascript
let gridUnit = intervaloMinutos;
slotsConEstado.forEach(slot => {
    if ((slot.estado === 'ocupado' || slot.estado === 'ocupado_otro') && slot.agFin) {
        const durReal = tiempoAMinutos(slot.agFin) - tiempoAMinutos(slot.time);
        if (durReal > 0 && durReal < intervaloMinutos) gridUnit = gcd(gridUnit, durReal);
    }
});
const numCols = Math.round(60 / gridUnit);
const colSpanFull = Math.round(intervaloMinutos / gridUnit);
slotsEl.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
```

### Paso 3 — Ajustar spans en el rendering loop

**Bloques no-parciales**:
- `span ${j-i}` → `span ${(j-i) * colSpanFull}`
- `span 1` en `otro` y `libre` → `span ${colSpanFull}`

**Bloques parciales** (`isPartial === true`): reemplazar flex-container por **dos grid items separados**:

```javascript
// ocupado parcial
const durReal = tiempoAMinutos(agFinReal) - tiempoAMinutos(slot.time);
const durRest = tiempoAMinutos(slot.slotFin) - tiempoAMinutos(agFinReal);
const spanOccupied = Math.round(durReal / gridUnit);
const spanFree = Math.round(durRest / gridUnit);
html += `<div class="panel-slot panel-slot-busy" style="grid-column:span ${spanOccupied}">...</div>`;
html += `<div class="panel-slot panel-slot-free" style="grid-column:span ${spanFree}" data-hora="${agFinReal}">...</div>`;
// mismo para ocupado_otro parcial
```

### Notas de indentación

- `e_gine.php`: función está dentro de un scope más profundo (4 niveles de indent con espacios)
- `e_urolo.php`: función al nivel del script (2 niveles de indent)
- `gcd` debe agregarse con la misma indentación que la función render de cada archivo

## Verificación

1. `http://localhost:8081/e_gine.php` — abrir un paciente con turno 30 y bloque parcial, verificar proporciones
2. `http://localhost:8081/e_urolo.php` — mismo check
3. Verificar que sin parciales el grid sigue en 2 columnas (numCols=2, colSpanFull=1)
4. Verificar clic en slot libre del remainder selecciona la hora correcta
