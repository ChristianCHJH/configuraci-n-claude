# Plan — Fix variantes: generación aditiva + renombrar `estado` → `disponible`

## Context

Dos problemas en el módulo de variantes de productos:

1. **Bug de generación**: Al pulsar "Generar variantes", el backend hace soft-delete de todas las variantes existentes que no están en la nueva combinación seleccionada. Esto provoca que cada generación *reemplace* en vez de *añadir*.

2. **Semántica de `estado`**: La columna `estado` en `producto_variante` actúa como toggle "Activo/Inactivo". El usuario quiere renombrarla a `disponible` para separar claramente el concepto de "disponibilidad de venta" del soft-delete (`eliminado`). El texto en UI también cambia de "Activo/Inactivo" → "Disponible/No disponible".

---

## Fix 1 — Generar variantes debe ser ADITIVO

**Archivo**: `backend/src/inventario/variantes/variantes.servicio.ts`

**Root cause exacto** (líneas 288–296):
```typescript
// Soft-delete de variantes cuya firma no está en las combinaciones nuevas
for (const [firma, variante] of firmaMap.entries()) {
  if (!firmasNuevas.has(firma)) {
    variante.eliminado = true;
    variante.fechaEliminacion = new Date();
    ...
  }
}
```

**Acción**: Eliminar ese bloque completo. El nuevo comportamiento:
- Combinación nueva que no existe → CREAR
- Combinación ya existente (con cualquier valor de `disponible`) → OMITIR, sin tocar nada
- Variantes previas que no están en la nueva selección → NO TOCAR (el usuario las elimina manualmente con el ícono de eliminar)

También eliminar el bloque de re-activación (líneas 254–259) que ponía `estado=true` si la variante tenía `estado=false`. Con el nuevo criterio: si ya existe, se omite sin modificar.

---

## Fix 2 — Renombrar `estado` → `disponible`

### 2.1 Migración SQL
Crear `database/migrations/016-variante-estado-a-disponible.sql`:
```sql
ALTER TABLE producto_variante RENAME COLUMN estado TO disponible;
```
(con `IF EXISTS` para idempotencia)

### 2.2 `database/setup-completo.sql`
En el `CREATE TABLE producto_variante`, cambiar:
```sql
estado     BOOLEAN NOT NULL DEFAULT true,
```
por:
```sql
disponible BOOLEAN NOT NULL DEFAULT true,
```
Actualizar cabecera `-- Última actualización:`.

### 2.3 Entidad Sequelize
`backend/src/inventario/variantes/entidades/producto-variante.entidad.ts`
```typescript
// Cambiar:
declare estado: CreationOptional<boolean>;
// Por:
@Column({ field: 'disponible', type: DataType.BOOLEAN, defaultValue: true })
declare disponible: CreationOptional<boolean>;
```

### 2.4 DTO de actualización
`backend/src/inventario/variantes/dto/actualizar-variante.dto.ts`
- `estado?: boolean` → `disponible?: boolean`

### 2.5 Servicio backend
`backend/src/inventario/variantes/variantes.servicio.ts`
- `obtenerConfiguracion()`: `estado: v.estado` → `disponible: v.disponible`
- `generarVariantes()`: eliminar bloque de re-activación; si la firma ya existe → `continue` (omitir)
- `actualizarVariante()`: `dto.estado` → `dto.disponible`; retorno `estado:` → `disponible:`

### 2.6 Servicio Angular
`frontend/src/app/core/services/variantes-inventario.servicio.ts`
- Interface `VarianteProducto`: `estado: boolean` → `disponible: boolean`
- Interface `DatosActualizarVariante`: `estado?: boolean` → `disponible?: boolean`

### 2.7 Componente Angular (TS)
`frontend/src/app/features/inventario/productos-premium/productos-premium.component.ts`
- `toggleEstadoVariante()`: `{ estado: !variante.estado }` → `{ disponible: !variante.disponible }`
- Optimistic update: `v.id === variante.id ? { ...v, estado: !v.estado }` → `{ ...v, disponible: !v.disponible }`
- Mensaje snack: `'activada'/'desactivada'` → `'marcada como disponible'/'marcada como no disponible'`

### 2.8 Template HTML
`frontend/src/app/features/inventario/productos-premium/productos-premium.component.html`
- `[class.var-row-inactive]="!v.estado"` → `!v.disponible`
- `[class.var-estado-activo]="v.estado"` → `v.disponible`
- `[class.var-estado-inactivo]="!v.estado"` → `!v.disponible`
- `matTooltip="{{ v.estado ? 'Desactivar' : 'Activar' }}"` → `'Marcar no disponible' : 'Marcar disponible'`
- `<mat-icon>{{ v.estado ? 'toggle_on' : 'toggle_off' }}</mat-icon>` → según `v.disponible`
- Texto `'Activo'/'Inactivo'` → `'Disponible'/'No disponible'` (en tabla desktop y cards móvil)
- `[class.var-mob-activo]="v.estado"` → `v.disponible`, etc.

---

## Archivos a modificar (resumen)

| Archivo | Cambio |
|---------|--------|
| `database/migrations/016-variante-estado-a-disponible.sql` | NUEVO — renombra columna en BD |
| `database/setup-completo.sql` | `estado` → `disponible` en tabla + cabecera |
| `backend/.../entidades/producto-variante.entidad.ts` | Propiedad `estado` → `disponible` |
| `backend/.../dto/actualizar-variante.dto.ts` | Campo `estado` → `disponible` |
| `backend/.../variantes.servicio.ts` | Bug fix (eliminar soft-delete en generación) + renombres |
| `frontend/.../variantes-inventario.servicio.ts` | Interfaces: `estado` → `disponible` |
| `frontend/.../productos-premium.component.ts` | toggleEstadoVariante + snack messages |
| `frontend/.../productos-premium.component.html` | Clases CSS + textos Activo → Disponible |

---

## Verificación

1. Aplicar migración en BD local
2. Reiniciar backend: `npm run start:dev`
3. En la UI, abrir "Editar producto" → tab Variantes:
   - Seleccionar Color Azul + Tallas 42,43 → Generar → aparecen 2 variantes
   - Seleccionar Color Verde + Tallas 42,43 → Generar → aparecen 4 variantes en total (las 2 anteriores siguen)
   - Toggle de disponibilidad muestra "Disponible" / "No disponible" en vez de "Activo" / "Inactivo"
   - El ícono de eliminar (basurero) sigue funcionando para soft-delete individual
