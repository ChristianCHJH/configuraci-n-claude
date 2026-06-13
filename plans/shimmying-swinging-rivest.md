# Plan: Aplicar diseño card + panel-horarios a e_gine.php

## Contexto
El usuario quiere que la sección "Orden de Internamiento" en `e_gine.php` tenga el mismo aspecto que el componente de programación en `e_repro_02.php`: card blanca con bordes/sombra a la izquierda con el formulario, y panel de "Horarios Disponibles" a la derecha con los slots clickeables. Actualmente usa el layout JQM antiguo sin card ni panel.

## Archivo objetivo
`apps/web/e_gine.php`

---

## Cambio 1 — Agregar bloque `<style>` (insertar antes de línea 1168)

Insertar antes del `<div id="container-full-calendario"...>` el mismo CSS que tiene `e_repro_fechaprogramacion.php` (líneas 65-156), adaptado con `!important` para sobrevivir JQM:

```css
<style>
/* Panel horarios */
.panel-horarios{width:268px;min-width:268px;background:#fff!important;border:1.5px solid #e2e8f0!important;border-radius:14px!important;padding:14px!important;overflow-y:auto;flex-shrink:0;box-shadow:0 2px 14px rgba(0,30,64,0.08)!important;align-self:stretch}
.panel-horarios-header{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:2px;letter-spacing:-.01em}
.panel-horarios-sub{font-size:11px;color:#94a3b8;margin-bottom:10px;line-height:1.4}
.panel-leyenda{...} /* mismas reglas que e_repro */
/* ... slots, asp-card, intern-aviso — ídem */
/* ASP card */
.gine-card{background:#fff!important;border:1.5px solid #e2e8f0!important;border-radius:14px!important;padding:20px 22px!important;box-shadow:0 2px 16px rgba(0,30,64,0.07)!important;flex:1;min-width:0}
.gine-card .block{font-size:10px!important;font-weight:700!important;color:#64748b!important;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;display:block}
/* JQM select overrides */
.gine-card .ui-select .ui-btn,...  /* !important overrides */
/* Warning */
.intern-aviso{display:flex!important;align-items:flex-start!important;gap:8px;background:#fff7ed!important;border:1px solid #fed7aa!important;border-left:3px solid #f97316!important;border-radius:8px!important;padding:10px 14px!important;color:#9a3412!important;font-size:12px!important;font-weight:500!important;margin-top:12px;line-height:1.5}
</style>
```

> Usaré clase `.gine-card` (no `.asp-card`) para evitar conflictos si `e_repro_fechaprogramacion.php` se incluye en el mismo contexto. Mismos estilos, nombre distinto.

---

## Cambio 2 — Reestructurar HTML de la sección (líneas 1168-1248)

### Estructura actual
```html
<div id="container-full-calendario" data-role="collapsible">
  <h3>Orden de Internamiento...</h3>
  <div class="grid"><div class="col-12"><!-- radio buttons --></div></div>
  <div style="display:flex;flex-wrap:wrap;gap:20px;">
    <!-- sedes, sala, procedimiento, fechas, turno, notas -->
  </div>
  <font color="#E34446">Las citas para mañana...</font>
  <div class="grid"><div class="col-12">FullCalendar</div></div>
</div>
```

### Nueva estructura
```html
<div id="container-full-calendario" data-role="collapsible">
  <h3>Orden de Internamiento...</h3>

  <div style="display:flex;gap:16px;align-items:stretch;">
    <!-- CARD IZQUIERDA -->
    <div class="gine-card">
      <strong>Tipo de Internamiento</strong>
      <!-- Radio buttons En Sala / En Consultorio (sin cambios funcionales) -->

      <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;">
        <!-- include sedes_sala.php (sin cambio) -->
        <!-- #in_t1, #in_t2 procedimiento selects (sin cambio) -->
        <!-- #in_f1, #in_h1, #in_m1 fecha/hora internamiento (sin cambio) -->
        <!-- #idturno, #in_f2, #in_hora turno/fecha/hora intervención (sin cambio) -->
        <!-- #descripcion_intervencion textarea (sin cambio) -->
      </div>
    </div>

    <!-- PANEL DERECHA (horarios disponibles) -->
    <div id="panel-horarios" class="panel-horarios" style="display:none;">
      <div class="panel-horarios-header">Horarios Disponibles</div>
      <div class="panel-horarios-sub" id="panel-subtitle">Seleccione sede, sala y fecha</div>
      <div class="panel-leyenda">
        <!-- leyenda Disponible / Ocupado / Otro procedimiento -->
      </div>
      <div id="panel-slots">
        <p style="color:#94a3b8;font-size:12px;">Seleccione sede, sala y fecha para ver horarios</p>
      </div>
    </div>
  </div>

  <!-- Warning moderno (reemplaza <font color="#E34446">) -->
  <div class="intern-aviso">
    <svg ...triangle-warning...></svg>
    Las citas para mañana deben agendarse antes de las <strong>3:00 PM</strong> de hoy.
  </div>

  <!-- FullCalendar sin cambio -->
  <div class="grid"><div class="col-12"><?php include_once('FullCalendar/index.php'); ?></div></div>
</div>
```

**IDs funcionales que NO cambian:** `#idturno`, `#in_f2`, `#in_hora`, `#sala_id`, `#in_t1`, `#in_c` — el JS existente de submit/validación sigue funcionando igual.

---

## Cambio 3 — Agregar JS del panel-horarios al `<script>` existente (después de línea 630)

Agregar dentro del bloque `<script>` (lines 393-631), después del handler `.show-page-loading-msg`:

```js
// Panel Horarios — helpers
function tiempoAMinutos(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
function minutosATiempo(min) {
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

// Cargar panel cuando cambian sala/fecha/turno/procedimiento
function triggerPanelGine() {
    const atencion_id = $("#in_t1").val();
    const sala_id = $("#sala_id").val();
    const fecha = $("#in_f2").val();
    const turno = $("#idturno").val() || 30;
    if (atencion_id && sala_id && fecha) {
        cargarPanelHorariosGine(atencion_id, sala_id, fecha, parseInt(turno));
    }
}

$("#sala_id, #in_f2, #idturno, #in_t1").on("change", function() {
    triggerPanelGine();
});

async function cargarPanelHorariosGine(atencion_id, sala_id, fecha, intervaloMinutos) {
    // Idéntica lógica a cargarPanelHorarios() de e_repro_fechaprogramacion.php
    // Llama TurnosController().getRangoHorario, findAll y AgendamientoController().findAll
    // Usa ids: #panel-horarios, #panel-subtitle, #panel-slots
}

function renderSlotsPanelHorarios(rango, turnosProcedimiento, agendamientos, intervaloMinutos) {
    // Idéntica a e_repro_fechaprogramacion.php líneas 689-764
}

// Slot click → selecciona hora en #in_hora
document.addEventListener('click', function(e) {
    const slotEl = e.target.closest('#panel-slots .panel-slot-free, #panel-slots .panel-slot-selected');
    if (!slotEl) return;
    const hora = slotEl.dataset.hora;
    if (!hora) return;
    document.querySelectorAll('#panel-slots .panel-slot-selected').forEach(el => {
        el.classList.remove('panel-slot-selected');
        el.classList.add('panel-slot-free');
    });
    slotEl.classList.remove('panel-slot-free');
    slotEl.classList.add('panel-slot-selected');
    $("#in_hora").append(new Option(hora, hora, true, true)).selectmenu("refresh");
});
```

También modificar `cargarProgramacion()` (línea 557) para que al terminar de cargar llame `triggerPanelGine()`.

---

## Consideraciones

- `sumarMinutosAHora` ya está disponible en el contexto (usada en línea 612 del mismo script, definida en `js/e_gine.js`)
- `TurnosController` y `AgendamientoController` ya están incluidos (líneas 7-10)
- El panel solo se muestra cuando `in_c == 1` (En Sala) — si el usuario elige "En Consultorio" el panel puede ocultarse
- `programacion` variable global ya existe (línea 394) — el `renderSlotsPanelHorarios` la usa para marcar el slot propio como seleccionado

---

## Verificación
1. Abrir `e_gine.php?id=100201` con "En Sala" seleccionado → debe mostrar card izquierda + panel derecho con horarios
2. Cambiar sede/sala/fecha → panel se actualiza automáticamente
3. Clickear un slot verde → `#in_hora` se llena y slot cambia a azul oscuro
4. Warning naranja visible con texto "3:00 PM"
5. Seleccionar "En Consultorio" → panel horarios desaparece
6. Guardar datos → submit funciona igual (sin regresar en funcionalidad)
