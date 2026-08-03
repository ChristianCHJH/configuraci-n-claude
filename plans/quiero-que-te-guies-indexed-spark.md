# Trazabilidad de una carga a través de las versiones de RD

## Contexto

Las RD se atienden en el orden en que llegan: **la versión es la cola de trabajo**. Cuando SAP transmita
una versión nueva no va a reenviar todo — va a traer líneas nuevas **y modificaciones de líneas que ya
estaban**. Cada modificación obliga a Transporte a re-planificar, así que hace falta ver **por qué RD ha
pasado cada carga**, no solo dónde nació.

Hoy la pantalla no puede contarlo, por tres razones concretas:

1. `CargaItem` guarda **un solo** `changeRD`. Si RD2 y RD4 tocan la misma carga, el paso por RD2 se
   sobrescribe y **desaparece**.
2. Al abrir una RD, el listado trae solo **las que esa RD creó**, no las que modificó
   ([applyCargasFilter, línea 905](prototipo-web/src/data/demandaConsolidada.ts#L905)). Por eso la
   sub-fila de RD4 anuncia `🗑 1 eliminado` y, al pulsar *Ver cargas*, **no hay nada** — esa carga nació
   en RD2. La sub-fila promete un número que su propia acción no puede mostrar.
3. Ninguna fila sabe si está **vigente** en la RD que estás mirando o si ya la superó otra posterior.

## La lógica

**Cada RD conserva lo que envió.** RD1 no pierde nada; RD2 muestra sus contenedores nuevos **más** los
que modificó. Los conteos no se mueven de sitio y **la suma de las sub-filas sigue cuadrando exacto con
la fila de la nave** — el invariante del 08-01 queda intacto.

**Una carga tocada por varias RD aparece en todas ellas**, con estado distinto según cuál estés viendo:

```text
carga X:  RD1 (alta) → RD2 (mod: peso) → RD4 (mod: clasificación)

viendo RD1  →  aparece BLOQUEADA   · entró aquí, la superó RD4
viendo RD2  →  aparece BLOQUEADA   · la tocó aquí, la superó RD4
viendo RD4  →  aparece ACTIVA      · es desde aquí que se planifica
```

La regla es una sola: **activa si esa RD es su último paso; bloqueada si no.** Cuando llegue RD5 y la
vuelva a tocar, RD4 se bloquea igual que las anteriores.

**El bloqueo solo existe dentro de la vista de una RD.** Sin filtro de versión cada carga sale **una
sola vez**, en su estado actual — así la paginación y los totales de la cabecera siguen reconciliando
con la fila del consolidado.

**Sin contador de modificaciones.** El número sale solo: en `Estado / último cambio` se apilan las RD
que la tocaron, tres badges = tres modificaciones, y la última va destacada.

## Decisiones tomadas

| Punto | Decisión |
| :-- | :-- |
| Conteos del consolidado | **No se tocan** — cada RD sigue contando lo que trajo |
| Dónde aparece una carga | En **todas** las RD que la tocaron; activa solo en la última |
| `Estado / último cambio` | **Badges encadenados**, el último destacado: `✎ Modificado · RD2 RD4` |
| Columna `RD` nueva | **No** — la pertenencia la da la lista que estás viendo |
| Contador de veces | **No** — es implícito en el número de badges |
| Trayectoria | **Lista de pasos por carga**, en vez de un `changeRD` único |

**Supuesto declarado:** «bloqueada» se implementa como fila atenuada **y sin edición de clasificación**
—el único campo editable del modal—, con el badge de la RD vigente a la vista para saber dónde sí se
edita. Si solo la querías atenuada, es quitar una línea.

> **Nota anotada, no implementada:** tienes razón en que el eje real es el **manifiesto**, no la nave —
> la misma nave puede venir tres veces al año y el manifiesto es único. En el mock cada fila es una
> nave-manifiesto, así que no cambia nada ahora; para el modelo real la clave es el manifiesto.

---

## Cambios

### 1. Capa de datos — [demandaConsolidada.ts](prototipo-web/src/data/demandaConsolidada.ts)

- **`PasoRD`** — `{ rd: string; tipo: 'alta' | 'mod' | 'elim'; nota?: string; fechaHora: string }`.
- **`CargaItem.pasos: PasoRD[]`** sustituye a `createdRD` / `createdAt` / `change` / `changeRD` / `note`.
  Los cinco pasan a **derivarse** con helpers (`origenDe`, `ultimoPasoDe`, `estadoDe`) que devuelven
  exactamente lo que hoy devuelven los campos — así la UI que no se toca sigue funcionando igual.
- **`rdIndex(rd) → n`** — parsea el número tras `RD`. Hoy no existe ningún comparador de RD en `src/`;
  el único orden es posicional por índice de array. Hace falta para ordenar los pasos.
- **`vigenteEn(carga, rd) → boolean`** — `ultimoPasoDe(carga).rd === rd`. Es la regla activa/bloqueada.
- **`applyCargasFilter`** — el filtro de versión (`okV`) pasa a devolver **las que esa RD creó más las
  que esa RD tocó**. Este cambio arregla el defecto del `Ver cargas`.
- **`RdDesglose.modificados` / `.eliminados`** se derivan de los pasos de tipo `mod` / `elim` de esa RD.
  Misma semántica que hoy, pero ya correcta cuando una carga se toca varias veces (hoy RD2 diría 0).
  **Las columnas numéricas no cambian**: siguen contando lo que la RD trajo.

### 2. Modal de cargas — [DemandaConsolidada.tsx](prototipo-web/src/pages/tms/DemandaConsolidada.tsx)

- **`changeCell`** (línea ~294) pasa de un badge a la **cadena de badges**: la etiqueta refleja el tipo
  del último paso (`Modificado` / `Eliminado`) y detrás van todas las RD que la tocaron, las anteriores
  atenuadas y la última en color fuerte. Se reutiliza `rdBadge`, así que **cada badge sigue saltando al
  historial** como hoy.
- **Filas bloqueadas** en `renderCargaRow`: cuando hay filtro de RD y esa RD no es el último paso, la
  fila va atenuada y la clasificación no editable. Se reutiliza el patrón de opacidad que ya existe para
  las eliminadas.
- **Pie**: `N vigentes · M bloqueadas` cuando se está viendo una RD concreta.
- Las **6 columnas se quedan como están**. `Creado en` sigue siendo el origen.

### 3. El mock se queda corto para ver esto

No es del diseño: es cómo el prototipo **inventa** sus datos, porque no hay backend
([buildCargas](prototipo-web/src/data/demandaConsolidada.ts#L622-L638)). Importa porque **el caso que
motivó todo esto no existe hoy**.

- Tras generar los contenedores de una nave, el código marca **exactamente 3** —los de posición 18 %,
  45 % y 60 % del array— y **ninguna carga se toca dos veces**.
- Solo entra si la nave tiene **≥4 RD y ≥20 contenedores** → `RC007` (15 cntrs) y `RC008` (12) no tienen
  ni un cambio. Solo toca contenedores; los bultos nunca cambian.

**Se amplía**, sin perder el determinismo (nada de `Math.random`): ~10 % de las cargas con cambio,
repartidas entre varias RD, **al menos una tocada dos veces** (el caso RD1 → RD2 → RD4), incluyendo
algún bulto y alguna nave pequeña. Los totales por nave no se mueven: marcar un paso no crea ni borra
cargas.

---

## Archivos

| Archivo | Cambio |
| :-- | :-- |
| [prototipo-web/src/data/demandaConsolidada.ts](prototipo-web/src/data/demandaConsolidada.ts) | `PasoRD`, `CargaItem.pasos`, helpers derivados, `rdIndex`, `vigenteEn`, `applyCargasFilter`, desglose, generador |
| [prototipo-web/src/pages/tms/DemandaConsolidada.tsx](prototipo-web/src/pages/tms/DemandaConsolidada.tsx) | `changeCell` encadenado, filas bloqueadas, pie |
| [prototipo-web/src/historias/mapa.ts](prototipo-web/src/historias/mapa.ts) | La nota de la interacción del filtro de versión: ahora incluye lo que la RD tocó, no solo lo que creó |

## Lo que esto desbloquea

Con la trayectoria guardada sale **gratis** el KPI que [[relacion-detallada]] da como motivo de versionar:
*cuántas veces el depósito hizo re-planificar a Transporte*. No se construye ahora, pero el dato queda.

## Verificación

1. `npm run build` en `prototipo-web`.
2. **Los totales de nave no cambian**: conteos por tipo, TOTAL CNTRS y BULTOS de cada fila idénticos a
   los de hoy, pese al modelo nuevo y al mock ampliado. Y sin filtro de RD, el modal sigue diciendo
   `1-20 de 120` — ninguna carga se duplica.
3. Con Playwright, sobre la carga tocada dos veces (RD1 → RD2 → RD4):
   - **viendo RD1**: aparece **bloqueada**, con `✎ Modificado · RD2 RD4` y RD4 destacado;
   - **viendo RD2**: aparece **bloqueada** — es lo que hoy es imposible, porque RD2 se sobrescribía;
   - **viendo RD4**: aparece **activa** y con la clasificación editable;
   - la sub-fila del consolidado marca `✎ 1` **tanto en RD2 como en RD4**.
4. *Ver cargas* en la sub-fila de **RD4**: la carga que dio de baja **ahora sí sale** — el defecto vivo,
   corregido.
5. Los badges de RD de la cadena siguen saltando al Historial de versiones.
6. Panel de historias: las 10 anclas del modal siguen resolviendo.

## Impacto documental (pendiente, no se escribe ahora)

Para cuando ejecutes `/unimar`: concepto nuevo a documentar, **la trayectoria de una carga por las RD**,
con la regla *vigente en su último paso, bloqueada en los anteriores*. No contradice la decisión del
08-01 ([[tms-pantallas-demanda-desglose-rd]]) — cada RD sigue mostrando lo que trajo—, pero sí precisa
que el filtro por versión devuelve **lo creado más lo tocado**. Toca **RN-77**, **F-01** y
**US-TMS-001**. Anotar también que el eje real del agrupamiento es el **manifiesto**, no la nave.
