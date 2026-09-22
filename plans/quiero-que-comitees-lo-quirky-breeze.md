# Excel de tablas maestras — TMS Sprint 1

## Contexto

El 08-09 el modelo de datos del TMS se contrastó contra data real de SAP y quedaron
`docs/modelo-entidad-relacion-tms.md` (38 tablas + 3 vistas), `docs/modelo-er-tms.dbml`
(33 tablas acotadas al Sprint 1) y `docs/estructura-columnas-rd-rce.md` (los formatos RD/RCE
columna por columna). Esa información está correcta pero **repartida en tres documentos técnicos
que nadie fuera de desarrollo va a leer**, y la pregunta operativa sigue sin respuesta en un solo
lugar: *¿qué tablas maestras hay que tener listas para el Sprint 1, cuáles llegan desde SAP y con
qué columnas, y cuáles son netamente del TMS?*

Ese es el entregable: **un Excel** que consolide el inventario de maestros y catálogos del
Sprint 1, arrancando por la sección del **Reporte Detallado (RD impo / RCE expo)**, que es el
insumo de entrada de todo el sistema.

Sirve para tres cosas concretas ya en curso:
- cerrar con Documentación las **20 preguntas de columnas** que siguen abiertas;
- que la PO (Anaís) valide qué maestros hay que poblar antes de que arranque el desarrollo;
- que quede escrito qué se pide a SAP vía MMS y qué se siembra a mano en el TMS.

**Sobre el commit:** no se hace. `CLAUDE.md` del repo prohíbe `git commit`/`git push` en
`unimar_tms` y hay reglas `deny` en `.claude/settings.json`. Los 12 archivos en staging
(+2768 líneas) quedan tal cual para que los versione Christian.

---

## Entregable

**Archivo:** `docs/tablas-maestras-tms-sprint1.xlsx`

**Cómo se genera:** PowerShell + COM de Excel (verificado: Excel 16.0 disponible). No hay Python
ni `openpyxl` en la máquina, y no hace falta instalar nada. El script se escribe en el scratchpad,
no en el repo.

**Alcance:** Sprint 1 completo (las 12 historias US-TMS-001…010, 019, 025).

---

## Estructura del libro

### `00 · Leyenda`
Cómo leer el archivo. Convenciones que aplican a todas las hojas:
- PK siempre `id BIGINT GENERATED ALWAYS AS IDENTITY`.
- Bloque de auditoría obligatorio (`usuario_creacion`, `usuario_actualizacion`, `fecha_creacion`,
  `fecha_actualizacion`, `estado`, `eliminado`) — se documenta **una vez aquí**, no se repite en
  las 20 hojas.
- Bloque de sincronización SAP (`codigo_sap`, `fecha_sincronizacion`, `activo_en_origen`,
  `version_origen`) — qué tablas lo llevan y por qué.
- Diccionario de la columna **Origen**: `SAP` · `SAP+TMS` · `Catálogo semilla` · `TMS` · `UMS`.
- Diccionario de la columna **Estado**: `Confirmado` · `Por confirmar con PO` · `Gap`.
- **La cadena real de la data maestra es `SAP → MMS → TMS`**, no `SAP → TMS`: MMS (Data Maestra)
  sirve transportista, chofer y unidad; XMS es el bróker (RabbitMQ); el patrón es
  Outbox → broker → proyección idempotente. La RD **no** pasa por MMS — entra por Excel y pantalla
  propia del TMS.

### `01 · Índice`
Una fila por tabla maestra/catálogo. Columnas:
`Tabla` · `Dominio` · `Naturaleza` (maestro / catálogo cerrado / maestro externo) · `Origen` ·
`Vía` (MMS / directo / semilla / UMS) · `Transacción SAP` · `¿Bloque SAP?` ·
`Nº registros esperado` · `Historias que la usan` · `RN que la sustenta` · `Estado` · `Hoja`.

La columna **Transacción SAP** se llena con el mapa ya documentado: `ZRD01N`/`ZRD02N` (crear/modificar
registro documentario) · `ZBI01` (crear viaje/nave) · `ZRD03N` (Visualización de Documentos: IMO/ONU,
pesos, los dos juegos de precintos) · `ZDMR026`/`ZDMR028` (transmisiones descarga/exportación) ·
`ZCSR0006` (carga suelta) · `SDA` (canal y levante) · pantalla *Visualizar viaje* (Id Viaje + Cod. Nave).

Las tablas que entran (del Dominio A + los catálogos que el Sprint 1 necesita):

| Origen | Tablas |
|---|---|
| **SAP** (con bloque de sincronización) | `nave`, `transportista`, `conductor`, `unidad_vehicular`, `cliente` |
| **SAP declarado, sin bloque de sincronización — GAP** | `linea_naviera`, `recalada_nave`, `tipo_contenedor` |
| **SAP + TMS** (bidireccional, RN-81) | `unidad_conductor` |
| **Mixto SAP/catálogo** | `sede` |
| **Catálogo semilla (TMS)** | `puerto`, `instalacion_portuaria`, `unidad_negocio`, `tipo_carga`, `clasificacion_carga`, `estado_servicio`, `motivo_cambio_servicio`, `parametro` |
| **Externo (UMS)** | `usuario`, `usuario_sede` |

### `02 · RD-Descarga (impo)` y `03 · RCE-Embarque (expo)`
La sección de reporte detallado que pediste para empezar. Una fila por columna del reporte
(33 impo · 34 expo). Columnas de la hoja:
`#` · `Columna del reporte` · `Tipo de dato` · `Ejemplo` · `¿Ya viene o es NUEVA?` ·
`Tabla destino` · `Columna destino` · `Maestro contra el que valida` · `Pregunta abierta`.

Se marcan en color las **9 columnas nuevas** que se pidieron a Documentación y las que
**no tienen destino en el modelo** (ver hoja de gaps). Cuando el destino es una tabla propuesta
pero aún no modelada (`carga_precinto`, `carga_exportacion`), la celda lo dice explícitamente.

Bajo la tabla, tres notas que ya están confirmadas y conviene que viajen con el archivo:
- **Reglas de formato** exigidas a Documentación: un dato por columna, identificadores como Texto
  (`0076807` pierde el cero a la izquierda), fechas como Fecha real, decimales sin separador de
  miles, encabezados en fila 1, celdas vacías vacías.
- **Fechas que se calculan, no se piden:** `Inicio de stacking = ETB − 72 h` y
  `Cutoff documentario = Inicio stacking − 24 h`. Van a la vista `v_recalada_itinerario`, con las
  72 y 24 horas como parámetros.
- **Numeración asimétrica:** embarque trae número propio de SAP (`Nro. RD Int.` cabecera +
  `Num RCE` por registro); descarga no tiene número y se identifica por nave + manifiesto + IP.
  ⚠️ **RN-41 («el número lo asigna el TMS») vale solo para importación.**

### `04 … 23 · Una hoja por maestro`
Una hoja por cada tabla del índice. Encabezado con propósito, origen, transacción SAP y RN que
la sustenta; debajo la tabla de columnas:
`Columna` · `Tipo` · `Null` · `Único` · `Origen del valor` · `Columna del reporte / campo SAP` ·
`FK a` · `Nota`.

Todas las columnas salen literales del DBML (`docs/modelo-er-tms.dbml`) — no se inventa ninguna.
El bloque de auditoría no se repite: se referencia la hoja `00 · Leyenda`.

### `24 · Valores semilla`
Los catálogos cerrados con su contenido literal, listos para el `INSERT` inicial:
- `unidad_negocio`: DT · VACIOS · CD · DAS · DS · INLAND (solo DT activo en MVP)
- `tipo_carga`: CONTENEDOR · SUELTA · RODANTE
- `clasificacion_carga`: NORMAL · IMO · IQBF · REFRIG · OOG · SENSIBLE (con `origen_dato` RD vs TMS)
- `estado_servicio`: los 16 estados con fase, operación, orden y fuente
- `motivo_cambio_servicio`: los 6 valores
- `parametro`: las 5 claves con su default (30 min, 4 h, 48 h, 3 días, 24 h)
- `instalacion_portuaria`: APM · DPW · PAITA con su mecanismo de cita y `permite_swap_entre_bl`
- `sede`: Callao · Paita

### `25 · Gaps y preguntas`
Lo que **no cuadra** y hay que resolver antes de construir. Una fila por gap:
`#` · `Tipo` · `Descripción` · `Impacto` · `A quién se pregunta` · `Bloquea a`.

Contenido ya identificado en la exploración:

**Columnas del reporte sin destino en el modelo**
1. `Condición` (FCL/LCL/MTY) — aparece en los dos reportes, **no existe catálogo ni columna**.
2. `Canal` aduanero (VER/NAR/¿ROJ?), `Tipo Llenado` (ALM.CLIE.), `SADA`, `Numero DAM`,
   `Fecha Numeración`, `Nro ONU` — sin destino modelado.
3. **Precintos**: el reporte trae 5 columnas separadas y hay **dos juegos** (manifestado vs
   recibido) que no coinciden, con motivo de cambio; el modelo tiene un solo
   `carga.precintos VARCHAR(120)`.
4. `Peso Neto`, `Peso Tara`, `Volumen` — pedidas como nuevas, no existen en `carga`.
5. `Rumbo` (WB) — sin lugar en el modelo; el propio doc pregunta si se descarta.
6. **El RCE no trae ningún cliente** → `bl.cliente_id` quedaría NULL en toda la exportación.

**Inconsistencias del propio modelo**
7. El ER dice "41 tablas" en §1 pero lista 38 en §11 y define 38 en el DDL; el DBML declara 33.
8. `linea_naviera`, `recalada_nave`, `tipo_contenedor` y `sede` se declaran de origen SAP pero
   **no llevan el bloque de sincronización** que sí llevan las otras cinco. Con `linea_naviera` el
   riesgo es concreto: el RCE la trae como texto (`COSCO`) → duplicados, igual que con las naves.
9. `guia_remision` (S2) declara `estado VARCHAR(15)` y además hereda `estado BOOLEAN` de
   auditoría → **columna duplicada, no compila**.
10. **MMS no aparece en el modelo de datos.** El §11 pone "SAP" como origen, pero la cadena
    acordada es `SAP → MMS → TMS` (Customer–Supplier). **No existe mapeo campo-a-campo MMS↔TMS**
    en ninguna parte del repo ni del vault.
11. `recalada_nave` **no tiene `codigo_sap`** — sin `Id Viaje` (`618278`) ni `Cod. Nave` (`4782`)
    no se puede re-sincronizar sin duplicar. Y **`fecha_zarpe` no existe**, aunque en expo importa.
12. **Cinco cosas de los hallazgos del 08-08/09 todavía no están en el DBML** (que es del 08-07):
    `carga_precinto` (los dos juegos × 5 tipos), `carga_exportacion` (satélite 1:1 con DAM, canal,
    tipo de llenado, Num RCE, puertos), `carga_archivo` y `carga_archivo_fila` (capa de ingesta con
    la fila cruda) y `bl.bl_padre_id` (BL hijo del master en LCL). El conteo real sube por encima
    de 33/38. **En el Excel se marcan como `Propuesta — no está en el DBML`**, nunca como
    confirmadas.
13. El wiki rotula el Dominio E como "6 tablas en S1"; el DBML entra con **5** (`notificacion`
    se difiere a S2).

**Nomenclatura a unificar antes de modelar**
14. `solicitud_transporte` (historias) vs `servicio_transporte` (modelo) — declarado como
    decisión pendiente con la PO en el DoD de US-TMS-004.
15. `empresa_transporte` (historias) vs `transportista` (modelo).
16. `unidad` (US-TMS-019) vs `unidad_vehicular` (resto).
17. `cita` (007/019/025) vs `cita_portuaria` (010) vs `documento_portuario` (modelo).

**Catálogos incompletos**
18. `motivo_cancelacion` — US-TMS-009 la declara como entidad pero **no define ningún valor**.
19. **Dos catálogos de motivos que se solapan**: el de US-TMS-007 §2.5 (5 valores, incluye
    *incidentes personales/salud*) y el de la nota de F-13 (5 valores, incluye *unidad malograda*).
    Hay que decidir si son uno o dos catálogos.
20. `estado_operativo` de `unidad_vehicular` — RN-28 lo exige pero **no enumera los valores**;
    el DBML propone 4 sin sustento en el PRD.
21. `tipo_contenedor` sin catálogo completo: vistos `ST`, `HC`/`HIQ`, `TK`; falta confirmar si
    aparecen `RF`, `OT`, `FR`, y si hay contenedores de **45 pies** además de 20 y 40.
22. Sin valores confirmados: `Tipo Llenado` (solo se vio `ALM.CLIE.`), `Canal` (`VER`, `NAR`,
    ¿`ROJ`?) y `SADA` (¿SI/NO, número, fecha?).

---

## Ejecución

1. Escribir `<scratchpad>/generar-maestros-xlsx.ps1` con todo el contenido embebido (aquí-strings),
   construyendo el libro vía `New-Object -ComObject Excel.Application`.
2. Aplicar formato: fila 1 congelada y en negrita, autofiltro, ancho de columna automático,
   resaltado de `Gap` en rojo y `Por confirmar` en ámbar, pestañas agrupadas por color según
   dominio.
3. Guardar en `docs/tablas-maestras-tms-sprint1.xlsx` (`xlOpenXMLWorkbook`), cerrar Excel y
   liberar el objeto COM.
4. **No commitear** — el archivo queda como archivo nuevo sin versionar.

## Verificación

- Reabrir el `.xlsx` con COM y volcar por consola: nombre de cada hoja + número de filas con
  contenido. Debe dar 26 hojas y los conteos esperados (33 filas en RD, 34 en RCE, 20 en índice).
- Contrastar las columnas de 3 hojas de maestro elegidas al azar contra `docs/modelo-er-tms.dbml`
  para confirmar que ninguna columna fue inventada ni omitida.
- Abrirlo con `SendUserFile` para que lo revises directamente.

## Fuera de alcance

- No se modifica ningún `.md` ni el `.dbml` existente; los gaps se **reportan** en la hoja 25,
  no se corrigen en el modelo (eso es una decisión con la PO).
- No se tocan las historias ni el backlog.
- Maestros de Sprint 2+ (`guia_remision`, `atributo_mercancia`, `notificacion`,
  `documento_servicio`, `servicio_transporte_evento`) quedan fuera.
