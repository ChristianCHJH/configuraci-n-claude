# Análisis: Sección Fechas/Horas en e_repro_02.php
## Objetivo del entregable
Generar un HTML de análisis (no código de producción) que documente:
- Cómo está construida la lógica actual
- Qué hace el endpoint de horas
- Qué cambios necesitamos para mostrar horas libres/ocupadas en panel derecho

---

## 1. Archivos clave identificados

| Archivo | Rol |
|---------|-----|
| `apps/web/e_repro_02.php` | Página principal del expediente reproductivo |
| `apps/web/_includes/e_repro_fechaprogramacion.php` | Sección "Aspiración" + JS de turnos |
| `apps/web/_Microservices/EMR/Services/Turnos.service.php` | Wrapper PHP → Microservicio Calendario |
| `apps/web/_Microservices/EMR/Controllers/Turnos.controller.php` | Controlador frontend JS |
| `apps/web/_database/db_medico_reproduccion.php` | Validaciones legacy (hc_reprod, hc_gineco, etc.) |
| `apps/web/_database/db_hora.php` | Tabla man_hora (catálogo de horas) |

---

## 2. Lógica de las 4 variantes de fecha

El include `e_repro_fechaprogramacion.php` detecta el tipo de procedimiento por `$repro['des_dia']`:

| Condición | Tipo | Fecha 1 | Fecha 2 (readonly) | Filtro turno |
|-----------|------|---------|--------------------|--------------|
| `des_dia IS NULL` | **Aspiración** | Fecha de Aspiración | Fecha de Inyección (−41h auto) | `aspiracion = true` |
| `des_dia = 0` | **Descongelación Óvulos** | Fecha de Descongelación (readonly) | Fecha de Inseminación | — |
| `des_dia >= 1` AND `des_don IS NULL` | **TED** | Fecha de Descongelación (readonly) | Fecha de Transferencia | `transferencia = true` |
| `des_dia >= 1` AND `des_don IS NOT NULL` | **Embriodonación** | Fecha de Descongelación (readonly) | Fecha de Transferencia | — |

**Cálculo automático Fecha Inyección:** Al cambiar hora de aspiración, JS resta 41h:
```
horaInyeccion = fecha_aspiracion + hora_aspiracion − 41 horas
```
Para TED (atencion = 2): fecha inyección = fecha aspiración (misma).

---

## 3. Trigger del endpoint de horas

**Evento:** `change` en `#f_asp1` (Fecha Aspiración) O en `#idturno` (Turno)

**Condiciones mínimas para disparar:**
- `fecha` (f_asp1) tiene valor
- `sala_id` tiene valor
- `atencion_id` tiene valor (determinado por PHP al cargar)

---

## 4. Flujo del endpoint de horas (actual)

```
[JS Frontend]
  getTurno(atencion_id, sala_id, fecha, turnoMinutos)
       ↓
  TurnosController.findAll({
    startDay: "YYYY-MM-DD 00:00:00.00-05",
    endDay:   "YYYY-MM-DD 23:59:59.00-05",
    params: { atencion: [id], sala: [id] }
  })
       ↓
  POST → Turnos.service.php → Microservicio EMR.Calendar.Service
       ↓
  Devuelve: array de objetos turno con { hora_inicio, hora_fin }
       ↓
  [JS] Genera slots cada N minutos entre hora_inicio y hora_fin
  Resultado: ["07:15", "07:45", "08:15", ...] → llena <select #h_asp1>
```

**Lo que el microservicio valida actualmente:**
- Disponibilidad del turno de la sala para ese tipo de atención
- Bloqueos en `lab_agenda_bloqueo`
- Agendamientos en `agendamiento` (tabla del microservicio calendario)
- **NO valida** contra: `hc_reprod`, `hc_gineco`, `hc_urolo` directamente (esas son legacy)

---

## 5. Tablas involucradas

### Microservicio Calendario (PostgreSQL moderno)
- `agendamiento` — citas agendadas (hora_inicio, hora_fin, sala_id, atencion_id)
- `turno` / `disponibilidad_turno` — rangos habilitados por sede/sala/tipo

### Legacy PHP (PostgreSQL)
- `hc_reprod` — campos: f_asp, h_asp, idturno, sala_id, estado, cancela
- `hc_gineco`, `hc_urolo` — idem para otras especialidades
- `man_hora` — catálogo horas con flags: aspiracion, transferencia, urologia, ginecologia
- `man_turno_reproduccion` — duraciones: formato_hora_minuto ("30 minutes")
- `lab_agenda_bloqueo` — bloqueos manuales

---

## 6. Gap actual (problema a resolver)

El select `#h_asp1` hoy muestra **SOLO horas disponibles** (ya filtradas por el microservicio).
El usuario no ve qué horas están ocupadas — simplemente no aparecen.

**Lo que se quiere:** Panel derecho tipo calendario que muestre:
- Horas del rango habilitado (ej. 07:00 – 11:00)
- Cada hora con estado visual: **Libre** (clickeable) | **Ocupada** (gris/lock)
- La selección de hora ocurre en ese panel, no en el select actual

---

## 7. Plan del cambio (alto nivel para el HTML)

### Datos necesarios (dos llamadas o una combinada):
1. **Horas del rango habilitado** → endpoint actual (Turnos.service) devuelve esto
2. **Horas ocupadas** → necesitamos endpoint adicional que consulte `agendamiento` filtrado por sala + fecha + turno

### UI propuesta (inspirada en mockup):
- Panel izquierdo: formulario actual (Sede, Sala, Turno, Fecha, Fecha Inyección, Notas)
- Panel derecho: `Horarios Disponibles` — grid de horarios con ícono estado
  - leyenda: Disponible | Bloqueado
  - Al click en hora libre → llena campo Hora en formulario + calcula Fecha Inyección

### Impacto en código existente:
- NO se elimina el `<select #h_asp1>` todavía (fallback)
- Se agrega un div panel-derecho con lógica JS
- Se necesita un nuevo endpoint (o parámetro adicional) que devuelva horas ocupadas

---

---

## NUEVA SECCIÓN: Estructura real de disponibilidades (hallazgos adicionales)

### Microservicio EMR.Calendar.Service — tablas relevantes

| Tabla | Campos clave | Rol |
|-------|-------------|-----|
| `turnos` | `sala_id`, `tipo_atencion_id`, `fecha`, `hora_inicio`, `hora_fin`, `recurrencia_id` | Franja habilitada por sala + tipo + fecha |
| `recurrencias` | `fecha_inicio`, `fecha_fin` + días de semana dinámicos | Rango recurrente de un turno |
| `tipo_atenciones` | `id`, `nombre`, `color`, `grupo_agenda_id` | Catálogo de procedimientos |
| `agendamientos` | `sala_id`, `atencion_id`, `fecha`, `hora_inicio`, `hora_fin`, `registro_id` | Citas reales agendadas |

**Dato crítico:** un mismo slot (sala + fecha + hora) puede tener turnos para **distintos tipos de procedimiento** simultáneamente. La unicidad se valida por `sala_id + tipo_atencion_id + fecha + hora`. Esto significa que puede haber:
- Turno Aspiración 08:00–10:00
- Turno Consulta 08:00–10:00
en la misma sala el mismo día → perfectamente válido.

**Para obtener el rango completo del día sin filtrar:** llamar a `turnos/findAll` con `params.sala=[id]` pero **sin** `params.atencion` → devuelve todos los turnos del día para esa sala independientemente del tipo.

### Legacy PHP — tablas relevantes

| Tabla | Campos clave | Rol |
|-------|-------------|-----|
| `man_hora` | `id`, `codigo`, `nombre` (HH:MM), `aspiracion`, `transferencia`, `ginecologia`, `urologia`, `aspiracion_inyeccion`, `estado` | Catálogo fijo de horas con flags por procedimiento |
| `man_turno_reproduccion` | `id`, `formato_hora_minuto` (interval PG), `aspiracion` | Duraciones de turno |
| `lab_agenda_bloqueo` | `idhora`, `idturno`, `fecha`, `sala_id`, `estado` | Bloqueos manuales por fecha/hora/sala |

**Función existente útil:** `horaTodo()` en `_database/db_hora.php` devuelve todas las horas sin filtrar por tipo → candidata para obtener el rango base del día.

---

## NUEVA SECCIÓN: Concepto de rango completo del día (nuevo requerimiento)

### Problema que resuelve
Hoy el panel solo mostraría las horas que LE CORRESPONDEN al procedimiento del paciente. El usuario no sabe si una hora fuera de ese rango está libre o no. Si una hora está libre en la sala (aunque no esté habilitada para su procedimiento), puede llamar a administración para habilitarla.

### Lógica de los 3 estados por slot

| Estado | Condición | Visual |
|--------|-----------|--------|
| **Libre — este procedimiento** | Slot dentro de turno con `tipo_atencion_id = X` + no tiene agendamiento | Verde, clickeable |
| **Ocupado** | Hay agendamiento en ese slot (cualquier tipo de atención) | Rojo/gris, ícono candado + "Ocupado" |
| **Sin disponibilidad para este procedimiento** | Slot existe en el rango del día pero el turno es de OTRO tipo, o no hay turno creado para este tipo | Gris neutro, ícono info + "Otro procedimiento" |

### Cómo calcular el rango completo

1. Llamar `turnos/findAll` con `params.sala=[id]` SIN filtrar `atencion`, rango = día completo
2. Encontrar `min(hora_inicio)` y `max(hora_fin)` de todos los turnos devueltos → ese es el rango del día
3. Generar todos los slots cada N minutos en ese rango
4. Para cada slot determinar:
   - ¿Hay turno para este `tipo_atencion_id` en este slot? → si sí, es candidato a "libre para este procedimiento"
   - ¿Hay agendamiento en este slot? → si sí, es "ocupado" (independientemente del tipo)
   - Si no hay turno para este tipo pero sí hay turnos de otros tipos → "otro procedimiento"
   - Si no hay ningún turno → puede omitirse o mostrarse vacío

### Dos llamadas necesarias al cargar el panel

```
Llamada 1 — Rango completo
  POST turnos/findAll { sala: [id], sin filtro atencion }
  → todos los turnos del día para esa sala
  → se extrae min hora_inicio y max hora_fin

Llamada 2 — Agendamientos ocupados
  POST agendamientos/findAll { sala: [id], startDay/endDay del día }
  → todos los agendamientos existentes en esa sala ese día
  → se cruza con los slots para marcar ocupados
```

---

## 8. Entregable — actualizar analisis-panel-horarios.html con:
- Nueva sección de estructura de tablas (microservicio + legacy)
- Nueva sección del concepto de rango completo del día
- Wireframe actualizado con los 3 estados visuales
- Las 2 llamadas al endpoint necesarias
- Decisiones pendientes actualizadas
