# Plan: Panel Horarios en e_urolo.php

## Context
`e_repro_02.php` ya tiene el componente de horarios disponibles (panel derecho con slots visuales). `e_gine.php` **ya tiene el componente completo** implementado (HTML líneas 1440-1457, CSS líneas 1326-1366, JS inline líneas 636-788). La tarea es replicar exactamente lo mismo en `e_urolo.php`, que actualmente solo muestra un formulario plano sin panel de horarios.

---

## Estado actual de los archivos

| Archivo | Estado |
|---|---|
| `e_repro_02.php` | ✅ Tiene panel (referencia original) |
| `e_gine.php` | ✅ Ya tiene panel completo — sin cambios necesarios |
| `e_urolo.php` | ❌ No tiene panel — requiere implementación |

---

## Cambios en `e_urolo.php`

### 1. Agregar bloque `<style>` (antes del collapsible, ~línea 512)

Copiar CSS de `e_gine.php` líneas 1326-1366 renombrando `.gine-card` → `.urolo-card`.

Clases que se agregan:
- `.panel-horarios`, `.panel-horarios-header`, `.panel-horarios-sub`
- `.panel-leyenda`, `.panel-leyenda-item`, `.panel-leyenda-dot`
- `#panel-slots`, `.panel-slot`, `.panel-slot-free`, `.panel-slot-busy`, `.panel-slot-other`, `.panel-slot-selected`
- `.urolo-card` (equivalente a `.gine-card`)
- `.intern-aviso`
- JQM popup overrides

### 2. Restructurar HTML de "Orden de Internamiento" (líneas 513-547)

**Antes:** fieldset plano con campos internos.

**Después:** flex container con dos columnas:
```
<div style="display:flex;gap:16px;align-items:stretch;">
  <div class="urolo-card">         ← left: form fields (contenido actual del fieldset)
    [sede/sala include]
    [procedimiento]
    [turno/fecha/hora]
    [descripcion]
  </div>
  <div id="panel-horarios" ...>   ← right: panel slots (nuevo)
    header / leyenda / #panel-slots
  </div>
</div>
<div class="intern-aviso">...</div>  ← banner de aviso
```

El `<fieldset id="fieldset-internamiento">` se mantiene como wrapper externo o se convierte en el contenedor flex directamente.

### 3. Agregar bloque `<script>` inline (antes de `</script>` del bloque existente en ~línea 236, o como bloque nuevo antes de `<script src="js/e_urolo.js">`)

Funciones a agregar (copiadas de `e_gine.php` líneas 636-788 con adaptaciones):

```js
function triggerPanelUrolo() {
  // Lee: #in_t, #sala_id, #in_f2, #idturno
  // Llama cargarPanelHorariosUrolo() si todos están presentes
}

async function cargarPanelHorariosUrolo(atencion_id, sala_id, fecha, intervaloMinutos) {
  // Muestra panel, spinner, Promise.all([getRangoHorario, findAll turnos, findAll agendamientos])
  // Llama renderSlotsPanelHorarios()
}

function renderSlotsPanelHorarios(rango, turnosProcedimiento, agendamientos, intervaloMinutos) {
  // Genera grid de slots con estados: libre / ocupado / propio / otro
  // Mismo algoritmo que e_gine.php líneas 697-773
}

// Change handler
$(document).on("change", "#sala_id, #in_f2, #idturno, #in_t", function() {
  triggerPanelUrolo();
});

// Click handler para slot libre
document.addEventListener('click', function(e) {
  // Selecciona slot, actualiza #in_hora
});
```

**Diferencias clave respecto a gine:**
- ID del procedimiento: `#in_t` (no `#in_t1`)
- `grupo_agenda_id: 3` (ya es así en urolo)
- Sin radio `in_c` — el panel se muestra siempre que haya datos
- Banner de aviso: "8:00 AM" (no "3:00 PM")

### 4. Actualizar `cargarProgramacion()` (línea ~283)

Después de cargar la programación existente y setear los campos, llamar:
```js
triggerPanelUrolo();
```
Para que el panel se renderice con el slot ya seleccionado.

---

## Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `apps/web/e_urolo.php` | HTML + CSS inline + JS inline |

---

## Verificación

1. Abrir `http://localhost:8081/e_urolo.php?dni=...`
2. En sección "Orden de Internamiento": seleccionar Sede → Sala → Procedimiento → Turno → Fecha
3. Panel derecho debe aparecer con slots verdes (libre), rojos (ocupado), grises (otro)
4. Clic en slot verde → `#in_hora` se actualiza, slot queda azul oscuro
5. Guardar → slot queda como "propio" (azul) en reload
6. Verificar que `e_gine.php` ya funciona (no requiere cambios)
