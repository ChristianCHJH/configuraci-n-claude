# Panel de validación Historias ↔ Pantallas (Sprint 1) en el prototipo

## Contexto

Las 15 historias del Sprint 1 describen sus interacciones en la sección **§2.4 Interacciones del Actor Principal**, una tabla `# | Interacción | Pantalla/Vista | Resultado esperado`. En total son **75 interacciones**. Por otro lado, `prototipo-web` tiene 10 pantallas TMS ya construidas.

Hoy no hay forma de validar una contra otra: hay que leer el `.md` en un lado y adivinar en qué pantalla del prototipo vive cada fila. Y hay fricción real de vocabulario — las historias hablan de **viaje** (lista de viajes, detalle de viaje, asignación de viaje) mientras el prototipo es **cita-céntrico** (asignar/reasignar viven en modales sobre una cita).

**Objetivo:** un panel lateral derecho en el prototipo que liste las historias del Sprint 1 y, al hacer clic en cada interacción, navegue a la pantalla y **resalte el control exacto** que la cumple. Lo que no exista se marca como **GAP** — no se construye nada nuevo ni se inventa data.

**Decisiones ya tomadas** (confirmadas con Christian):
1. Lo no mapeado **solo se marca** como gap; no se crean pantallas ni datos.
2. Precisión **al elemento exacto**, con resaltado visual.
3. El texto de las historias se **lee de los `.md` reales** en build — cero transcripción, cero divergencia.

---

## Alcance

- **Entra:** las 15 historias del Sprint 1 → `US-TMS-001…012`, `019`, `024`, `025`.
- **Fuente de verdad del Sprint:** el documento de épicas [epicas-historias-planificacion-sprint1.es.md](_bmad-output/planning-artifacts/epicas-historias-planificacion-sprint1.es.md). ⚠️ El campo `**Sprint:** N` dentro de cada archivo de historia está **desactualizado** (dice 2/3/6/7); no usarlo.
- **No entra:** las 10 pantallas UNITRANS. Ninguna historia del Sprint 1 las toca, y no usan `AppShell`. El panel solo vive en las rutas `/tms/*`.
- **No se toca:** ni una línea del texto de las historias, ni los `.md`, ni los datos mock.

---

## Arquitectura

Todo lo nuevo vive en `prototipo-web/src/historias/`. Las pantallas existentes solo reciben atributos `data-us`, sin cambios de lógica.

### 1. Lectura de las historias (verbatim, en build)

`src/historias/parser.ts` + `src/historias/fuente.ts`

- `import.meta.glob('../../../_bmad-output/planning-artifacts/stories/us-tms-*.es.md', { query: '?raw', eager: true })`.
- Requiere abrir el sandbox de Vite: añadir `server: { fs: { allow: ['..'] } }` en [vite.config.ts](prototipo-web/vite.config.ts). En build no hace falta (Rollup resuelve la ruta relativa).
- El parser extrae, por archivo:
  - El título (línea 1: `# Historia de Usuario: US-TMS-001 — …`).
  - El bloque entre `### 2.4` y el siguiente `## 3`.
  - Los sub-apartados `#### 2.4.1` / `#### 2.4.2` — **solo US-TMS-001 los tiene**; el resto es tabla plana.
  - Cada fila de tabla → `{ n, interaccion, pantallaVista, resultado }`, texto **crudo tal cual**.
  - Las citas `>` al pie de §2.4 → notas de alcance (se muestran, no se mapean).
- Un render inline mínimo (`MarkdownInline.tsx`) para `**negrita**`, `*cursiva*` y `` `código` ``. Nada más — no se reescribe el texto.

### 2. El mapa — el entregable de la revisión

`src/historias/mapa.ts` — **una entrada por interacción, 75 en total**:

```ts
'US-TMS-001#10': {
  estado: 'mapeado',                   // mapeado | parcial | logica | gap
  ruta: '/tms/demanda',
  ancla: 'demanda.col-plazo',          // → data-us en el DOM
  pasos: [],                           // qué hacer si el elemento está tras un modal/tab
  nota: '',                            // por qué es parcial / qué falta / qué regla es
}
```

Los cuatro estados:

| Estado | Significado |
|---|---|
| `mapeado` | Existe en el prototipo, con ancla al elemento exacto |
| `parcial` | Existe pero incompleto — la `nota` dice qué falta |
| `logica` | Regla/fórmula sin representación visual propia; si su *efecto* se ve, el ancla apunta al efecto |
| `gap` | No existe en el prototipo |

Las claves de ancla se nombran `<pantalla>.<elemento>` (`demanda.filtro-impoexpo`, `vista-general.modal-cancelar`), **no** por historia — varias interacciones apuntan al mismo control.

### 3. Anclas en las pantallas

Sembrar `data-us="clave"` en los nodos correspondientes de las 10 páginas TMS. Estimado **45–55 anclas**. Hoy **no existe ni un `id` ni un `data-*` en todo `src/`**, así que se parte de cero; los puntos de inserción naturales son los bloques ya comentados con `{/* ── … ── */}` (filtros, tabla, pie, cada modal).

Regla: el atributo se añade al contenedor de la sección o al control concreto. Ninguna página cambia de comportamiento.

### 4. Panel y resaltado

- `PanelHistorias.tsx` — rail derecho de ~380 px montado en [AppShell.tsx](prototipo-web/src/shell/AppShell.tsx) como hermano del contenedor scrolleable. **Empuja** el contenido (no lo tapa), así se ve la pantalla y la historia a la vez.
  - Cabecera con avance: `X/75 mapeadas · Y parciales · Z gaps`.
  - Historias agrupadas por épica (EP-01…EP-05), colapsables.
  - Al elegir una historia: sus filas de §2.4 verbatim, cada una como tarjeta clicable con su chip de estado.
  - Pestaña **Resumen**: conteo por estado y lista de gaps — el informe de revisión, dentro del propio prototipo.
- `ResaltadoProvider.tsx` — al hacer clic en una interacción:
  1. `navigate(ruta)` si la ruta actual es otra.
  2. Busca `[data-us="…"]` con `MutationObserver` + timeout de ~2 s.
  3. Encontrado → `scrollIntoView` **sobre el contenedor del AppShell** (el scroll no es de `window`) + clase de resaltado (anillo + pulso), que se limpia sola.
  4. No encontrado → el panel muestra los `pasos` ("Abre la vista rápida de Cargas de una nave"). Sin inventar automatismos frágiles sobre el estado interno de cada página.
- Toggle en [Topbar.tsx](prototipo-web/src/shell/Topbar.tsx) + atajo de teclado; el estado abierto/cerrado persiste en `localStorage`.
- **Convivencia con modales:** [Modal.tsx](prototipo-web/src/components/Modal.tsx) es `fixed inset-0 z-[220]` y taparía el panel. Cambio mínimo: que su padding derecho salga de una variable CSS `--panel-w` que el panel fija (0 cuando está cerrado). El rail va en `z-[300]` — por encima del 260 que hoy usa `PlanificacionCitas`.

---

## Mapeo preliminar (a confirmar elemento por elemento al implementar)

Esto es lo que ya se ve del cruce; el `mapa.ts` es donde queda formalizado.

| Historia | Pantalla del prototipo | Lectura preliminar |
|---|---|---|
| **US-001** §2.4.1 (#1–10) | `/tms/demanda` | Cubierto: filtro Impo/Expo, IP, nave, estado, limpiar, ETB/ETD/F.Almacenaje, selector de columnas, columna LAR/Uso de área |
| **US-001** §2.4.2 (#11–22) | `/tms/demanda` → modal *Vista rápida de Cargas* | Cubierto, pero **todo detrás de un modal** → requiere `pasos` |
| **US-002** | modal historial de versiones | #1 ✓ (con color de plazo) · #2 comparativo *parcial* · #3 bandeja de cambios y #4 indicador de re-planificaciones → **gap** |
| **US-003** | — | Búsqueda transversal → **gap**: no hay buscador global, solo buscadores por pantalla |
| **US-004** | `/tms/demanda` | #1–3 y #8 ✓ (acción de fila + modal irreversible + quién/cuándo) · #4–7 crear solicitud desde una fila → por verificar, probable **gap** |
| **US-005** | modales Asignar de citas | *parcial*: el prototipo asigna sobre una **cita**, no hay formulario de viaje con origen/destino/fecha tentativa |
| **US-006** | `/tms/vista-general` | *parcial*: hay filtros de sede/nave/operación/estado/búsqueda; faltan **transportista** y **rango de fechas** |
| **US-007** | `/tms/vista-general` + `/tms/planificacion` | *parcial*: detalle del viaje y excepción con motivo existen; la edición completa por verificar |
| **US-008** | modales Reasignar | ✓ con motivo obligatorio · la ventana **V-01** no está (la nota de 30 min es aceptación del conductor, otra cosa) |
| **US-009** | `/tms/vista-general` modal Cancelar | ✓ · obligatoriedad del motivo por verificar |
| **US-010** | `/tms/citas/importacion`, `/tms/citas/exportacion-nave` | *parcial*: existe "Registrar" / "Nueva cita" |
| **US-011** | `/tms/calendario` | *parcial*: hay **Mes** y **Semana**, la historia pide **día** y semana · resaltar solapamiento → por verificar |
| **US-012** | — | Swap de citas → **gap**, no existe |
| **US-019** | `/tms/citas/exportacion-nave` | *parcial*: asignar contenedor + placa existe; falta el paso de validación de tipo/viaje activo |
| **US-024** | `/tms/dashboard` | *parcial*: **4 KPIs** contra los **7 indicadores** de la historia · filtro de sede del Topbar es decorativo → **gap** |
| **US-025** | `/tms/dashboard` panel de alertas | *parcial*: el panel existe; navegar desde la alerta a la carga/cita → **gap** |

**Lógica sin pantalla** (se marca `logica`, no `gap` — no debe buscarse en el prototipo): RN-79 (fórmula LAR/Roleado/Uso de área), RN-80 (consistencia de conteos), RN-74 (derivación placa→conductor→empresa), ventanas **V-01**/**V-03** sin valor definido, umbral **RN-38**, y las reglas DPW/APM del swap.

**Contradicción activa a dejar visible en el panel:** US-TMS-001 **excluye** la sede como filtro (PA-29, depende de UMS) y US-TMS-024 la **incluye**. Son dos historias del mismo sprint.

---

## Archivos

**Nuevos** — `prototipo-web/src/historias/`: `tipos.ts`, `parser.ts`, `fuente.ts`, `sprint1.ts` (los 15 códigos + épicas), `mapa.ts` (75 entradas), `PanelHistorias.tsx`, `ResaltadoProvider.tsx`, `MarkdownInline.tsx`.

**Modificados:**
- [vite.config.ts](prototipo-web/vite.config.ts) — `server.fs.allow`
- [src/shell/AppShell.tsx](prototipo-web/src/shell/AppShell.tsx) — montar panel + provider
- [src/shell/Topbar.tsx](prototipo-web/src/shell/Topbar.tsx) — botón toggle
- [src/components/Modal.tsx](prototipo-web/src/components/Modal.tsx) — respetar `--panel-w`
- [src/index.css](prototipo-web/src/index.css) — estilos de resaltado
- Las 10 páginas de `src/pages/tms/` — **solo `data-us`**, patrón idéntico en todas. Representativas: [DemandaConsolidada.tsx](prototipo-web/src/pages/tms/DemandaConsolidada.tsx) (la más densa, ~15 anclas entre página y modal), [VistaGeneral.tsx](prototipo-web/src/pages/tms/VistaGeneral.tsx), [CalendarioCitas.tsx](prototipo-web/src/pages/tms/CalendarioCitas.tsx)

Se reutiliza lo que ya existe: tokens de `tailwind.config.js` (`navy`, `steel`, `canvas`, `ok/warn/danger`), `.scroll-slim` y `.tnum` de `index.css`, `StatusBadge.tsx`, `SegmentedControl.tsx`. Nada de hex sueltos ni patrones nuevos.

---

## Orden de trabajo

1. Parser + carga de los `.md` → verificar que las 15 historias y las 75 filas se leen completas y sin alterar.
2. Panel con la lista y el texto, sin navegación aún.
3. Sembrar `data-us` pantalla por pantalla, empezando por `/tms/demanda` (cubre 30 de las 75 interacciones entre US-001 y US-004).
4. Provider de resaltado + navegación.
5. Completar `mapa.ts` con las 75 entradas, confirmando cada estado contra la pantalla real.
6. Pestaña Resumen con el informe de gaps.

---

## Verificación

- `cd prototipo-web && npx tsc && npx vite build` en verde. ⚠️ Node está roto en la PC (`C:\Program Files\nodejs` sin `node.exe`); se usa el node24 del `actions-runner`, como en las sesiones del 07-30.
- `npx vite --port 5183` y recorrido manual: abrir el panel, elegir cada una de las 15 historias y hacer clic en las 75 interacciones, comprobando que cada `mapeado` resalta el control correcto y que ningún `gap` pretende navegar a ningún sitio.
- Contraste del contador del panel contra el conteo real por historia (22/4/4/8/4/5/3/3/3/3/3/3/4/3/3 = 75).
- **Sin capturas Playwright**: no está instalado en `prototipo-web`. La verificación visual queda del lado de Christian sobre el dev server.
- **Sin commits ni push** — regla del proyecto.
