# Plan: Botón Editar Movimiento + Actualización de Documentos

## Context
El módulo de movimientos tiene el endpoint `PATCH /movimientos/:id` operativo en backend y el método `update()` en el service Angular, pero ambos están sin conectar a la UI. El usuario requiere un botón "Editar" en la pantalla de detalle del movimiento que permita modificar los campos de datos (manifiesto, viaje, pesos, posición, etc.), con la restricción de que quede bloqueado cuando el movimiento está en estado **INMOVILIZADO** o **INCAUTADO**. Tras implementar la feature, actualizar ESPECIFICACION_TECNICA.md y .html para reflejar el guard de estado en el endpoint PATCH.

---

## Estado actual confirmado por exploración

| Elemento | Estado |
|---|---|
| `PATCH /movimientos/:id` en backend | Existe, sin guard de estado |
| `MovimientosService.update()` en Angular | Existe, nunca llamado |
| Botón Editar en UI | No existe |
| Modal de edición | No existe |
| Getter `esEstadoInmovilizado` | Ya existe en el componente |
| `ActualizarMovimientoDto` | `PartialType(CrearMovimientoDto)` + `canalControl` opcional |

**Estados bloqueantes para edición:** `INMOVILIZADO` (operativamente congelado) e `INCAUTADO` (decomisado, terminal). El frontend ya trata INMOVILIZADO con un alert rojo; INCAUTADO no tiene acciones disponibles.

---

## Archivos a modificar

```
backend/src/movimiento/movimiento.service.ts          ← agregar guard en update()
frontend/src/app/features/movimientos/
  movimiento-detalle/movimiento-detalle.component.ts  ← lógica editar modal
  movimiento-detalle/movimiento-detalle.component.html← botón + modal editar
ESPECIFICACION_TECNICA.md                             ← documentar guard
ESPECIFICACION_TECNICA.html                           ← ídem en HTML
```

---

## Cambios detallados

### 1. Backend — `movimiento.service.ts` → método `update()`

Agregar al inicio del método, antes de buscar el movimiento, o justo después del `findOne`:

```typescript
const ESTADOS_BLOQUEADOS = [EstadoContenedor.INMOVILIZADO, EstadoContenedor.INCAUTADO];
if (ESTADOS_BLOQUEADOS.includes(movimiento.estadoActual)) {
  throw new BadRequestException(
    `No se puede editar un movimiento en estado ${movimiento.estadoActual}`
  );
}
```

Esto hace que `PATCH /movimientos/:id` devuelva HTTP 400 si el estado es INMOVILIZADO o INCAUTADO.

---

### 2. Frontend — `movimiento-detalle.component.ts`

**Agregar:**
- Signal `editModalVisible = signal(false)`
- `formEditar: FormGroup` con campos: `navieraOperacion`, `numeroViaje`, `numeroManifiesto`, `numeroSello`, `pesoCargaKg`, `pesoBrutoDeclaradoKg`, `posicionPatio`, `fechaEta`
- Getter `puedeEditar`: retorna `false` si `estadoActual` es `INMOVILIZADO` o `INCAUTADO`
- Método `abrirEditar()`: puebla el form con valores actuales del movimiento y abre el modal
- Método `guardarEdicion()`: llama a `movimientosService.update(movId, dto)`, en éxito cierra modal + recarga movimiento + muestra toast; en error muestra toast de error

**Reutilizar:** `movimientosService.update()` ya existe en `movimientos.service.ts` línea 33.

---

### 3. Frontend — `movimiento-detalle.component.html`

**Botón Editar** — añadir junto al botón de eliminar en el header de acciones:
```html
@if (puedeEditar) {
  <button class="..." (click)="abrirEditar()">
    <i class="pi pi-pencil"></i> Editar
  </button>
}
```
Si `!puedeEditar` el botón no se muestra (o se muestra deshabilitado con tooltip explicativo).

**Modal `p-dialog`** con:
- Título: "Editar Movimiento"
- Campos: `navieraOperacion`, `numeroViaje`, `numeroManifiesto`, `numeroSello`, `pesoCargaKg`, `pesoBrutoDeclaradoKg`, `posicionPatio`, `fechaEta`
- Botones: Cancelar / Guardar (con spinner durante la petición)

---

### 4. Documentos

**`ESPECIFICACION_TECNICA.md`** — sección `PATCH /movimientos/:movId`:
- Agregar fila en tabla de errores: `400` cuando estado es `INMOVILIZADO` o `INCAUTADO`
- Agregar nota: "No se permite editar datos del movimiento cuando está en estado bloqueante"

**`ESPECIFICACION_TECNICA.html`** — mismo cambio reflejado en HTML.

---

## Orden de ejecución

1. Backend: guard en `update()` de `movimiento.service.ts`
2. Frontend: lógica en `movimiento-detalle.component.ts`
3. Frontend: template `movimiento-detalle.component.html`
4. Docs: ESPECIFICACION_TECNICA.md
5. Docs: ESPECIFICACION_TECNICA.html

---

## Verificación

- Abrir detalle de movimiento en estado normal (ej. EN_PATIO) → botón Editar visible
- Hacer clic → modal se abre con datos pre-cargados
- Editar `posicionPatio` → Guardar → toast éxito + datos actualizados en pantalla
- Navegar a movimiento en estado INMOVILIZADO → botón Editar NO aparece
- Llamar `PATCH /movimientos/:id` directamente con estado INMOVILIZADO → responde HTTP 400
