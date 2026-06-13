# Plan: Corrección de lógica de lote activo y listado de transacciones

## Contexto

El cálculo actual del lote activo usa `MAX(numero_lote) FROM cierres_lote + 1`. El problema: el terminal PinPad puede cerrar el mismo número de lote más de una vez (ej. cerrar lote 3 ayer y hoy), por lo que el número de lote NO siempre incrementa. Esto hace que el contador sea poco fiable.

La corrección: usar la `fecha_creacion` del último cierre como punto de corte (cutoff), y derivar tanto el lote activo como el conteo/listado de transacciones a partir de las transacciones generadas **después** de ese timestamp.

---

## Tablas y columnas que intervienen

| Tabla | Columna | Tipo | Uso en la nueva lógica |
|-------|---------|------|------------------------|
| `cierres_lote` | `id_terminal` | VARCHAR(50) | Identificar el terminal |
| `cierres_lote` | `numero_lote` | INTEGER | Fallback si no hay transacciones post-cierre |
| `cierres_lote` | `fecha_creacion` | TIMESTAMPTZ | **Cutoff datetime** — "desde cuándo" |
| `transacciones_pagos` | `id_terminal` | VARCHAR(50) | Identificar el terminal |
| `transacciones_pagos` | `numero_lote_host` | INTEGER | Determinar el lote activo (MAX post-cierre) |
| `transacciones_pagos` | `fecha_creacion` | TIMESTAMPTZ | Filtrar transacciones post-cierre |

> Se usa `cierres_lote.fecha_creacion` (TIMESTAMPTZ, timestamp del sistema) y NO `fecha_cierre_pinpad` (solo DATE) porque tiene precisión de hora completa y es más confiable.

---

## Nueva lógica de negocio

### A) Calcular lote activo

```
Para cada terminal:

1. Si NO tiene historial de cierres:
   → Buscar MAX(numero_lote_host) de TODAS sus transacciones
   → Si hay: lote_actual = ese MAX
   → Si no hay: lote_actual = 1

2. Si SÍ tiene historial de cierres:
   → Obtener fecha_creacion del último cierre (ORDER BY fecha_creacion DESC)
   → Buscar MAX(numero_lote_host) de transacciones WHERE fecha_creacion > fecha_ultimo_cierre
   → Si hay transacciones post-cierre: lote_actual = ese MAX
   → Si no hay transacciones post-cierre: lote_actual = ultimo_lote_cerrado + 1
```

### B) Contar transacciones del lote activo

```
Antes: COUNT(*) WHERE id_terminal = X AND numero_lote_host = lote_actual AND cancelado = false

Ahora: COUNT(*) WHERE id_terminal = X AND fecha_creacion > fecha_ultimo_cierre
       (si no tiene cierre: COUNT(*) WHERE id_terminal = X — todas las transacciones)
       Incluye canceladas y no canceladas (todas las del lote)
```

### C) Listar transacciones del lote activo

```
Antes: WHERE (id_terminal = A AND numero_lote_host = loteA) OR (id_terminal = B AND numero_lote_host = loteB)

Ahora: WHERE (id_terminal = A AND fecha_creacion > fecha_corte_A)
          OR (id_terminal = B AND fecha_creacion > fecha_corte_B)
       (si terminal sin cierre: WHERE id_terminal = X — sin filtro de fecha)
```

---

## Archivos a modificar

### 1. Entidades de dominio

**`domain/entities/CierreLotePinpad.ts`**
- `UltimoLoteCerrado`: agregar `fecha_ultimo_cierre: Date`
- Agregar interfaz: `TerminalFechaCorte { id_terminal: string; fecha_corte: Date | null }`

### 2. Interfaces de repositorio

**`domain/repositories/CierreLotePinpad.repository.ts`**
- Actualizar tipo de retorno de `getUltimosLotesCerrados` para incluir `fecha_ultimo_cierre`

**`domain/repositories/TransaccionPago.repository.ts`**
- Agregar método: `getUltimoLotePostCierre(terminales: TerminalFechaCorte[]): Promise<{id_terminal: string; ultimo_lote: number}[]>`
- Agregar método: `findByTerminalesFechaCorte(terminales: TerminalFechaCorte[], pagination: PaginationParams): Promise<PaginatedResult<TransaccionPagoAttributes>>`
- Mantener `findByTerminalesLote` para no romper otros usos

### 3. Implementaciones de repositorio

**`infrastructure/repositories/CierreLotePinpad.sequelize.ts`**

Cambiar `getUltimosLotesCerrados` — seleccionar `fecha_creacion` y ordenar por ella:
```sql
-- ANTES
SELECT DISTINCT ON (id_terminal)
  id_terminal, numero_lote as ultimo_lote
FROM ${schema}.cierres_lote
WHERE id_terminal IN (:terminales) AND eliminado = false
ORDER BY id_terminal, numero_lote DESC

-- DESPUÉS
SELECT DISTINCT ON (id_terminal)
  id_terminal,
  numero_lote as ultimo_lote,
  fecha_creacion as fecha_ultimo_cierre
FROM ${schema}.cierres_lote
WHERE id_terminal IN (:terminales) AND eliminado = false
ORDER BY id_terminal, fecha_creacion DESC
```

Reemplazar `contarTransaccionesPorLotes` con `contarTransaccionesPostCierre`:
```sql
SELECT id_terminal, COUNT(*)::INTEGER as total
FROM ${schema}.transacciones_pagos
WHERE (
  (id_terminal = :t0 AND (:f0 IS NULL OR fecha_creacion > :f0))
  OR (id_terminal = :t1 AND (:f1 IS NULL OR fecha_creacion > :f1))
  ...
)
GROUP BY id_terminal
```

**`infrastructure/repositories/TransaccionPago.sequelize.ts`**

Agregar `getUltimoLotePostCierre`:
```sql
SELECT id_terminal, MAX(numero_lote_host)::INTEGER as ultimo_lote
FROM ${schema}.transacciones_pagos
WHERE (
  (id_terminal = :t0 AND (:f0 IS NULL OR fecha_creacion > :f0))
  OR ...
)
GROUP BY id_terminal
```

Agregar `findByTerminalesFechaCorte` (misma proyección de subqueries que el método actual, solo cambia el WHERE):
```sql
WHERE (id_terminal = :t0 AND (:f0 IS NULL OR fecha_creacion > :f0))
   OR (id_terminal = :t1 AND (:f1 IS NULL OR fecha_creacion > :f1))
ORDER BY fecha_creacion DESC
```

### 4. Servicios

**`application/services/CierreLotePinpad.service.ts`**

Reescribir `obtenerLotesActivos`:
```
1. getUltimosLotesCerrados(terminales) → Map<terminal, {ultimo_lote, fecha_corte}>
2. getUltimoLotePostCierre(terminalesConFecha) → Map<terminal, ultimo_lote_tx>
3. Calcular lote_actual por terminal (lógica del árbol arriba)
4. contarTransaccionesPostCierre(terminalesConFecha) → Map<terminal, total>
5. Return LoteActivo[] con los valores calculados
```

**`application/services/TransaccionPago.service.ts`**

Modificar `obtenerTransaccionesHoy`:
- Inyectar o recibir `CierreLotePinpadRepository`
- Obtener fecha_corte por terminal antes de listar
- Usar `findByTerminalesFechaCorte` en lugar de `findByTerminalesLote`

Alternativa más limpia: el controller de `findHoy` recibe `terminales` (solo serial numbers), obtiene las fechas del `CierreLotePinpad.service`, y llama a `TransaccionPago.service` con `TerminalFechaCorte[]`.

### 5. Frontend

**`apps/frontend/src/modules/gestor-pagos/composables/useTransacciones.ts`**  
**`apps/frontend/src/modules/gestor-pagos/api/pago.api.ts`**

El DTO `TerminalLote` puede simplificarse — el `lote` ya no es necesario para el endpoint `/hoy`. Cambiar para enviar solo `serialNumbers: string[]`. El backend resuelve el resto internamente.

---

## Queries SQL nuevas (resumen ejecutivo)

```sql
-- 1. Último cierre por terminal (con fecha)
SELECT DISTINCT ON (id_terminal)
  id_terminal, numero_lote as ultimo_lote, fecha_creacion as fecha_ultimo_cierre
FROM cierres_lote
WHERE id_terminal IN (:list) AND eliminado = false
ORDER BY id_terminal, fecha_creacion DESC;

-- 2. MAX(lote) de transacciones post-cierre por terminal
SELECT id_terminal, MAX(numero_lote_host)::INTEGER as ultimo_lote
FROM transacciones_pagos
WHERE (id_terminal = :t0 AND (:f0::timestamptz IS NULL OR fecha_creacion > :f0))
   OR (...)
GROUP BY id_terminal;

-- 3. Contar transacciones post-cierre por terminal
SELECT id_terminal, COUNT(*)::INTEGER as total
FROM transacciones_pagos
WHERE (id_terminal = :t0 AND (:f0::timestamptz IS NULL OR fecha_creacion > :f0))
   OR (...)
GROUP BY id_terminal;

-- 4. Listar transacciones post-cierre (reemplaza filtro por lote)
SELECT [todas las columnas + subqueries existentes]
FROM transacciones_pagos
WHERE (id_terminal = :t0 AND (:f0::timestamptz IS NULL OR fecha_creacion > :f0))
   OR (...)
ORDER BY fecha_creacion DESC;
```

---

## Verificación

1. Terminal con historial, lote cerrado dos veces con mismo número → lote_actual debe ser el `numero_lote_host` de la última transacción, no el del cierre
2. Terminal sin cierre previo → lote_actual = 1 (o MAX de sus transacciones si existen)
3. Terminal sin transacciones post-cierre → lote_actual = ultimo_lote_cerrado + 1
4. Panel lista TODAS las transacciones generadas después del último cierre, incluyendo canceladas
5. Botón "Cerrar Lote" se habilita si COUNT post-cierre > 0

---

## Archivos críticos

```
services/EMR.Financial-Management.Service/src/modules/pinpad/
├── domain/
│   ├── entities/CierreLotePinpad.ts                  ← agregar TerminalFechaCorte, actualizar UltimoLoteCerrado
│   └── repositories/
│       ├── CierreLotePinpad.repository.ts             ← actualizar tipo de retorno
│       └── TransaccionPago.repository.ts              ← agregar 2 métodos nuevos
├── infrastructure/repositories/
│   ├── CierreLotePinpad.sequelize.ts                 ← modificar getUltimosLotesCerrados, reemplazar contarTransaccionesPorLotes
│   └── TransaccionPago.sequelize.ts                  ← agregar getUltimoLotePostCierre, findByTerminalesFechaCorte
└── application/services/
    ├── CierreLotePinpad.service.ts                   ← reescribir obtenerLotesActivos
    └── TransaccionPago.service.ts                    ← modificar obtenerTransaccionesHoy

apps/frontend/src/modules/gestor-pagos/
├── api/pago.api.ts                                   ← simplificar DTO (solo serial numbers)
└── composables/useTransacciones.ts                   ← remover lote del payload
```
