# Desglose por RD en el consolidado por nave (+ renombrado de la pantalla)

## Contexto

La pantalla `/tms/demanda` del prototipo muestra **una fila por nave**: el agregado de todas sus cargas. Pero lo que llega de SAP no son naves, son **relaciones detalladas versionadas** (RD1, RD2, RD3…), y cada transmisión trae un lote nuevo de carga. Christian necesita **priorizar según lo que va llegando**, y hoy para ver eso hay que abrir el modal «Ver más» → pestaña «Historial de versiones». El dato existe, pero está enterrado un nivel más abajo de donde se toma la decisión.

Dos cambios, ortogonales entre sí:

1. **Renombrar la pantalla.** «Demanda Consolidada» es un fósil: nació el 2026-07-10 para una bandeja genérica multi-origen con nº de demanda propio que nunca se construyó (`wiki/proyectos/tms-reunion-2026-07-10.md:22-24`). El PRD nunca adoptó ese nombre — llama a la pantalla *«Listado de Relaciones Detalladas»* (F-01) y a este nivel *«el consolidado por nave»* (RN-77). Y el rótulo **«Módulo Solicitudes» está mal**: esta pantalla es F-01 (consulta, épica EP-01 *Demanda y Relaciones Detalladas*); Solicitudes es **F-02 / EP-02 / US-TMS-004**, otra historia.
2. **Hacer la fila desplegable** en sus versiones de RD, con el conteo por tipo y los totales calculados **por RD**, dentro de la misma tabla y reutilizando las mismas columnas.

### Decisiones tomadas con Christian

| Decisión | Elegido |
|---|---|
| Nombre | Módulo **Relaciones Detalladas** / pantalla **Consolidado por nave** |
| Cifras por RD | **Delta** — lo que trajo esa versión. La suma de las sub-filas es exactamente la fila nave |
| Clic en la fila | **Despliega**. La navegación al detalle queda en el botón de acción y en el nombre de la nave |
| Modal «Ver más» | **Se queda**. Clic en una sub-fila RD → abre el modal en Cargas ya filtrado por esa versión |

---

## Parte 1 · Renombrado (solo rótulos visibles)

**No** se tocan: la ruta `/tms/demanda`, los nombres de archivo, el componente `DemandaConsolidada`, las anclas `demanda.*` ni las constantes `DEMANDA`/`DEM`. Renombrar identificadores rompería 27 anclas de trazabilidad a cambio de nada.

| Archivo | Línea | Cambio |
|---|---|---|
| [DemandaConsolidada.tsx:776-779](prototipo-web/src/pages/tms/DemandaConsolidada.tsx#L776-L779) | H1 + subtítulo | `Módulo Solicitudes / Demanda Consolidada` → `Relaciones Detalladas / Consolidado por nave`. Es el **único** sitio donde aparece «Módulo Solicitudes» |
| [Sidebar.tsx:22](prototipo-web/src/shell/Sidebar.tsx#L22) | `label` | → `Relaciones Detalladas` |
| [router.tsx:38](prototipo-web/src/router.tsx#L38) | `handle.title` | → `Consolidado por nave` (alimenta el Topbar) |
| [Index.tsx:17](prototipo-web/src/pages/Index.tsx#L17) | label del catálogo | |
| `CitasExportacionNave.tsx:351`, `PlanificacionCitas.tsx:1425`, `DemandaNaveImpo.tsx:302` | enlace «volver» | 3 breadcrumbs |
| `historias/mapa.ts:447-473`, `inventario.ts:47-68`, `estados.ts:86,199` | campo `pantalla:` | ~40 entradas de metadatos; `'Demanda · Cargas'` → `'Consolidado · Cargas'` |

Va en **commit aparte** del desglose: mezclarlos hace ilegible el diff del archivo más grande del prototipo.

---

## Parte 2 · Desglose por RD

### 2.1 · Capa de datos — [demandaConsolidada.ts](prototipo-web/src/data/demandaConsolidada.ts)

`CargaItem` ya trae **`createdRD`** ('RD1'…'RD6'), así que el desglose es derivable **sin inventar datos**.

Añadir el tipo `RdDesglose` con: `rd`, `seq`, `fechaHora`, `etiqueta?` ('reciente'|'inicial'), los cinco conteos (`normal/imo/iqbf/refrig/oog`), `totalCntrs`, `bultos`, `plazo`, `fueraPlazo`, `totalCargas`, `parcial`, `modificados`, `eliminados`, `acumCntrs`.

- Calcularlo **dentro de `buildCargas`** (líneas 478-676), justo tras el bucle de `versiones` (~661): ahí ya están en ámbito `containers`, `bultos`, `versiones`, `rdNombre`, `rdFecha`, `fmtDT`. Una sola pasada extra sobre las cargas.
- Exponerlo como campo `desglose` dentro de `GeneratedCargas` + accessor de una línea `desgloseRD(row)`, **espejando `resumenPlazoDe` (línea 690)**. Así reutiliza el `cache` por `row.id` que ya existe (línea 680) y que ya sirve al modal y al visor de recepción — memoización gratis, cero cachés nuevos.
- `fechaHora` se deriva de `fmtDT(rdFecha(v))`, **no** de `items.find(...)?.createdAt`: una versión puede quedarse sin cargas si `repartir` le asigna 0.
- Ampliar la interfaz es no-breaking para `recepcionImpo.ts` y `DemandaNaveImpo.tsx`; `npx tsc --noEmit` lo confirma.

**El invariante que hace valiosa la semántica delta:** `repartir()` reparte el total exacto y `tc` es mono-valor, así que **la suma de las sub-filas, columna por columna, es exactamente la fila nave**. El acumulado se descartó porque `marcarCambio(...,'elim',...)` deja 1 eliminado en 6 de las 9 naves y el saldo final daría `totalCntrs − 1` ≠ fila nave.

### 2.2 · La sub-fila — [DemandaConsolidada.tsx](prototipo-web/src/pages/tms/DemandaConsolidada.tsx)

**Enfoque aditivo, sin refactor previo.** Las columnas viven hoy en 3 sitios (`<thead>` 926-1005, fila nave 1010-1151, fila de totales 1156-1198) repartidas entre `CUTOFF_COLS`/`CONTEO_COLS` (declarativas, 51-79) y 8 condicionales `vis.x &&` a mano. Unificarlas en un `ColDef[]` al estilo [VistaGeneral.tsx:35-57](prototipo-web/src/pages/tms/VistaGeneral.tsx#L35-L57) tocaría ~345 de 1676 líneas (21 % del archivo) y 69 renderizados de celda **sin tests** y sin ganancia funcional. Queda como fase B opcional, después de validar el diseño.

**Nada de `colSpan`.** Una `<td>` por columna visible, con las mismas condiciones `vis[...]` que la fila nave: un `colSpan` no puede ser sticky a dos offsets (`right-[132px]` y `right-0`) y con `minWidth: 2400` su contenido queda fuera de pantalla.

**Las 12 celdas del centro se generan con el mismo `.map()`** que usa la fila de totales (`CUTOFF_COLS.map` / `CONTEO_COLS.map`) → 12 de las 20 conmutables **no pueden desalinearse por construcción**. Ese es el riesgo real: si la sub-fila emite una `<td>` de más o de menos, las tres columnas sticky se desalinean y se rompe la tabla entera.

**Mapa de las 23 celdas** — *PROPIA* = valor por RD · *heredada* = `·` atenuado con `title` = valor de la nave · *vacía* = `—`:

| Columna | Sub-fila |
|---|---|
| **Nave** (sticky izq, 178px) | PROPIA: rail `inset 3px 0 0 0 #C7D9E8` + `paddingLeft:22` + chip `RD5` (estilo `rdBadge`, 245-260) + badge INICIAL/ACTUAL (verbatim de 1632-1641, son excluyentes) |
| **Fecha** | **PROPIA** — la fecha/hora de esa versión. Es el discriminador, y RN-77 dice *«la fecha se muestra junto a la versión»*. Nota: Christian la mencionó entre las «compartidas»; si en la demo la quiere heredada, es una línea |
| IP · Manifiesto · Operación | heredadas |
| Cutoff Doc · Inicio Stacking · Cutoff Dry · Cutoff Refrig · ETB · ETD · F. Almac. | heredadas (mantienen `bg-[#F4F8FB]` y los `sep()` de banda) |
| **Normal · IMO · IQBF · Refrig · OOG** | **PROPIAS**: `items.filter(createdRD===rd && tc===X)`. Mantienen `bg-[#F1F6FB]` y `c.color(v)` |
| **Total Cntrs** | PROPIA (`kind==='cnt'`), con `title` = `acumulado a RD5: 84 de 100` |
| **Bultos** | PROPIA (`kind==='blt'`) |
| **LAR / Uso área** | PROPIA: `plazoPill(d.plazo)` + `fueraPlazo`, con el sufijo `n/total solo refrig.` del caso parcial (verbatim 1625-1629). Será el único sitio fuera del modal donde se ve la parcialidad de RN-80 |
| Avance Cntrs | vacía — `avanceAsignados` es de la nave, no hay asignación por RD |
| **Estado** (sticky der, 150px) | PROPIA: chips `✎ n` / `🗑 n` — los deltas **MODIF./ELIMIN.** que hoy solo viven en el Historial. El estado PENDIENTE/EN PLANIFICACIÓN es de la nave (RN-78) y repetirlo mentiría; la celda no se puede ocultar, así que se aprovecha |
| **Acción** (sticky der, 132px) | PROPIA: botón fantasma `Ver cargas` → modal filtrado por esa RD |

**Gotcha de estilo:** `STICKY_CELL` (línea 136) lleva `bg-white` hardcodeado. La sub-fila necesita sus propias clases `STICKY_CELL_RD` / `CELL_RD` con el tinte `#FAFCFE`, o al scrollear horizontalmente aparece una franja blanca en Nave/Estado/Acción. En las bandas de cutoffs y conteo **gana el fondo de banda**, para que las columnas sigan leyéndose de arriba abajo. La sub-fila es un `<tr>` hermano: necesita su propio `className="group"` para el hover.

### 2.3 · Estado de expansión y clic

```ts
const [expandidas, setExpandidas] = useState<Set<string>>(() => new Set())
```

Mismo idioma que [VistaGeneral.tsx:102](prototipo-web/src/pages/tms/VistaGeneral.tsx#L102). **Multi-expansión** (comparar dos naves es justamente el caso de uso). Al cambiar de tab o filtro **no se sincroniza**: si la nave vuelve, vuelve desplegada — cero bugs de sincronía. `limpiar()` no la toca. La fila de totales es inmune (`totalesDe(visibleRows)` se deriva de las naves, no del DOM) y la paginación también (`pgSize` es decorativo).

Llamar `desgloseRD(r)` **solo dentro de la rama expandida** → coste cero al colapsar, O(1) por caché al abrir.

Cambios de interacción sobre `<tr>` (1010-1014):

1. `onClick` de la fila → `toggleExp(r.id)`.
2. **Chevron** (`ChevronRight`/`ChevronDown`, ya importados) al inicio de la celda Nave, con `stopPropagation`.
3. **El nombre de la nave pasa a ser el enlace al detalle** (línea 1016, con `stopPropagation`). Sin esto una nave **PENDIENTE se queda sin navegación**: su botón es «Iniciar», no `gotoDetalle`.
4. **Quitar `group-hover:underline` de la celda Operación** (línea 1045): hoy anuncia «esta fila navega» y pasaría a mentir.
5. `openVista(r, rd?)` recibe la versión por parámetro y hace `setVVer(rd ?? 'Todas las versiones')` — no depender del orden de batching de React.
6. Añadir a la cabecera del modal un chip `· filtrado: RD5 · 8 cargas`: hoy muestra los totales de la nave y con la lista filtrada resultaría contradictorio.

---

## Parte 3 · Trazabilidad de historias

**Anclas nuevas** en `historias/mapa.ts` (`CATALOGO_ANCLAS`, tras línea 462): `demanda.fila-expandir` (el chevron), `demanda.subfila-rd` (celda sticky izq. de la sub-fila, no el `<tr>`: el resaltado debe verse sin scroll horizontal), `demanda.subfila-rd-conteo`, `demanda.subfila-rd-accion`.

**`ABRIR_CARGAS` está triplicada** — `mapa.ts:31`, `mapaEscenarios.ts:24`, `mapaReglas.ts:23`. Su texto («abre la vista rápida de Cargas de una nave») miente en cuanto el clic de la fila deje de abrir el modal. Reescribir en los tres para que diga que se pulsa «Ver más»; cubre 12 entradas de golpe. Añadir `ABRIR_CARGAS_RD` para la ruta nueva y aplicarla al menos a `US-TMS-001#14` (filtro de versión).

**`inventario.ts`**: dos entradas nuevas tras `dem-15`, renumerando el bloque *Demanda · Cargas*. Sin riesgo: `INVENTARIO` solo se consume en `PanelHistorias.tsx:607-709` filtrando por `cobertura`, nunca por `id`.

---

## Parte 4 · PRD e historia

En este proyecto el prototipo y el PRD se mantienen sincronizados, así que el cambio no está cerrado sin esto.

**`prd-tms-parte-1-planificacion.es.md`** (y las mismas ediciones **verbatim** en `prd-tms.es.md`):
- **F-01** (línea 21): el consolidado por nave permite desplegar cada nave en sus versiones de RD, con fecha/hora, conteo por tipo, total de contenedores, bultos y plazo por versión, sin abandonar el consolidado.
- **RN-77** (línea 87): extender, **no crear una RN nueva**. La frase que desactiva la objeción evidente: *«El desglose por versión no introduce filtros propios: es una descomposición del mismo conjunto ya filtrado, no un tercer nivel de consulta»* — así queda intacta la doctrina «cada nivel filtra por lo suyo».
- **RN-80** (línea 90): el plazo por versión y su caso parcial pasan a verse también en el consolidado; la suma de las versiones **es** el conteo de la nave.
- **§0.6 Registro de Evolución del Alcance** (570-576) + tabla espejo (111-112): fila `0.16.0-draft`. Ese changelog se mantiene con disciplina en cada cambio.
- **Glosario**: `Versión de RD` (527) y `Demanda consolidada de una nave` (531).

**`stories/us-tms-001-consultar-relaciones-detalladas.es.md`**:
- **§2.4.1**: dos interacciones nuevas (desplegar una nave en sus versiones; abrir el detalle filtrado por una versión).
  ⚠ **Renumeración obligada**: `parser.ts:131` lee el número de la primera columna y `mapa.ts` indexa por `US-TMS-001#N`; insertar desplaza `#11..#22` → `#13..#24`, lo que obliga a renumerar 12 claves en `mapa.ts` (69-115) + 2 en US-TMS-002 (118, 125). **TypeScript no detecta esto** (`ClaveInteraccion = string`): se verifica en el panel de historias.
- **§3**: un escenario nuevo **al final** (`@22`, apéndice → sin desplazamiento en `mapaEscenarios.ts`) que fija el invariante: las 6 sub-filas de MAERSK LIMA suman 100 en Total Cntrs y cuadran columna a columna con la nave.
- Bumpear el `Versión:` de la cabecera (lo lee `parser.ts:9`).

---

## Verificación

```bash
cd c:\Users\Christian\Unimar\unimar_tms\prototipo-web
npx tsc --noEmit
npm run build
```

El dev server ya corre en **http://localhost:5183/#/tms/demanda**.

1. **Colapsado = idéntico a hoy** (mismo `minWidth`, sombras, cabecera de dos niveles, fila de totales). Si algo se movió, el enfoque aditivo falló.
2. **MAERSK LIMA (RC001, 6 RDs)** — la prueba maestra: las 6 sub-filas suman **90·4·2·4·0** en el conteo por tipo, **100** en Total Cntrs y **20** en Bultos.
3. **Caso parcial de RN-80**: la RD5 de MAERSK LIMA (−18 h, entre cutoff refrig y dry) muestra `LAR` con sufijo `n/total solo refrig.`
4. **EVER LOYAL (RC009)**: RD más reciente `ROLEADO` y RD5 `LAR` — dos marcas en la misma nave.
5. **TASMAN TRADER (RC004, 7 RDs)**: con `maxHeight:600`, la cabecera sticky aguanta el scroll.
6. **Scroll horizontal con una nave expandida**: las 3 celdas sticky de la sub-fila con el mismo fondo que el resto (si hay franja blanca → falta `STICKY_CELL_RD`).
7. **Conteo de celdas** en DevTools, ocultando columnas desde el popover (los 7 cutoffs; luego IMO+IQBF; luego el grupo Conteo entero):
   ```js
   const t = [...document.querySelectorAll('[data-us="demanda.tabla"] tbody tr')]
   new Set(t.map(r => r.children.length))   // debe tener tamaño 1
   ```
8. **Fila de totales inalterada** con 0, 1 y las 9 naves expandidas.
9. **Clics**: fila → despliega · nombre de nave → navega · Iniciar/Continuar/Ver → su acción sin desplegar · chevron → un solo disparo.
10. **Sub-fila → modal**: se abre en Cargas filtrado por esa RD y la lista contiene exactamente `Total Cntrs + Bultos` de la sub-fila.
11. **Panel de historias**: las 4 anclas nuevas resaltan lo correcto, ninguna interacción queda sin mapear tras la renumeración, `TOTAL_INTERACCIONES` sube de 75 a 77.

Sin capturas de Playwright (no está instalado). **Sin commits**: el `CLAUDE.md` del repo lo prohíbe.

## Secuencia de commits (los prepara Christian)

1. `RdDesglose` + `desglose` + `desgloseRD()` — solo capa de datos.
2. Sub-fila + estado de expansión + cambio de clic + anclas en el DOM. **Demostrable ya** con 1+2.
3. Anclas, `ABRIR_CARGAS` ×3, inventario.
4. Historia §2.4 + §3 + renumeración de claves.
5. PRD: F-01, RN-77, RN-80, §0.6, glosario.
6. Renombrado de rótulos (11 sitios).

## Riesgos, por probabilidad real

1. **Franja blanca en las celdas sticky** si no se define `STICKY_CELL_RD` — solo se ve al scrollear horizontal, fácil que llegue a la demo.
2. **Deriva del nº de `<td>`** entre fila nave y sub-fila al ocultar columnas → desalineación total. Mitigado con los `.map()` y la comprobación 7.
3. **Renumeración de `US-TMS-001#N`** — 14 claves, invisible para TypeScript.
4. **`stopPropagation` olvidado** en el chevron o «Ver cargas» → se despliega *y además* navega.
5. **Caché de `generateCargas`** — hoy inocua, pero `marcarEnPlanificacion()` muta `DEMANDA_ROWS` in-place; documentarlo en el `cache` (línea 680) sin añadir invalidación (rompería la identidad de la que depende `useMemo(...,[selRow])`).
6. **Celda Nave de 178 px**: rail + chip + badge con `whitespace-nowrap` desbordan en vez de partir. Verificar con `RD6` + `ACTUAL`.
