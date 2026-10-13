export const meta = {
  name: 'revisar-vehiculo-rodante',
  description: 'Revisar cómo se modelan tracto y carreta y dónde vive la documentación de data maestra',
  phases: [
    { title: 'Leer', detail: 'lectores en paralelo sobre BD, docs, contrato SAP, UML y front' },
    { title: 'Verificar', detail: 'refutar cada hallazgo contra el archivo real' },
  ],
}

const RAIZ = 'c:/Christian/unimar_tms'

const HALLAZGOS = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          afirmacion: { type: 'string', description: 'Un hecho concreto y verificable, en español' },
          evidencia: { type: 'string', description: 'ruta/archivo.ext:linea — cita textual corta' },
          implicacion: { type: 'string', description: 'Qué significa para el modelado de tracto/carreta o para la doc de maestras' },
        },
        required: ['afirmacion', 'evidencia', 'implicacion'],
      },
    },
    resumen: { type: 'string', description: 'Máximo 4 líneas' },
  },
  required: ['dimension', 'hallazgos', 'resumen'],
}

const VEREDICTO = {
  type: 'object',
  properties: {
    refutada: { type: 'boolean' },
    motivo: { type: 'string' },
    correccion: { type: 'string', description: 'Si está refutada, cuál es el hecho correcto con su evidencia' },
  },
  required: ['refutada', 'motivo'],
}

const DIMENSIONES = [
  {
    key: 'bd',
    prompt: `Trabajas en el repo ${RAIZ} (NestJS + TypeORM + SQL Server, todo en español).

OBJETIVO: determinar con exactitud cómo está HOY la tabla de vehículos en la base de datos real.

Revisa:
- Las migraciones TypeScript vivas en src/apps/api/src/shared/infrastructure/persistence/migraciones/ (todas las que toquen vehiculo, transportista o conductor).
- Las entidades ORM: busca "vehiculo_rodante" en src/apps/api/src.
- Las semillas y datos de prueba: datos-prueba/*.sql, docker/sqlserver/*.sql.

Contesta con precisión:
1. ¿Existe la tabla vehiculo_rodante? ¿Con qué columnas EXACTAS (nombre, tipo SQL, nulabilidad, constraints con nombre)?
2. ¿Existe hoy una columna que distinga TRACTO de CARRETA? ¿Con qué nombre y qué CHECK?
3. ¿Hay alguna columna que guarde el TIPO/CLASE del vehículo en el sentido de la carrocería o categoría (p.ej. semirremolque, plataforma, portacontenedor, camión), distinta del rol tracto/carreta?
4. ¿Qué columnas tiene para marca, modelo, año, capacidad, configuración vehicular, número de ejes?
5. ¿Cómo se relaciona con transportista y con conductor?
6. ¿Existe alguna tabla separada para carretas o remolques?

Cita archivo:línea en cada hallazgo. No inventes: si algo no existe, dilo explícitamente como hallazgo.`,
  },
  {
    key: 'doc-maestras',
    prompt: `Trabajas en el repo ${RAIZ} (documentación en español).

OBJETIVO: ubicar DÓNDE vive la documentación de la data maestra (vehículos, conductores, transportistas) y qué dice sobre el vehículo.

Rastrea de forma exhaustiva:
- docs/ completo (01-concepcion, 02-diseno, 03-construccion...), en especial cualquier archivo sobre modelo de datos, maestras, diccionario o mantenimientos.
- docs/02-diseno/modelo-er-tms-sin-maestros-sap.dbml — lee la sección de maestras.
- docs/02-diseno/modelo-datos-ejecucion-unitrans.md — sección 4.4 y lo que diga de vehiculo_rodante.
- docs/02-diseno/convencion-nombres-constraints.md y auditoria/diagnostico del modelo.
- reference/ y MASTER_INDEX.md, README.md, DECISIONS.md, GAPS.md.
- Menciona si hay un .xlsx de diccionario de datos y qué hoja documenta las columnas.

Contesta:
1. ¿Cuál es el documento canónico de la data maestra? Da su ruta exacta. Si hay varios, ordénalos por autoridad y di cuál manda.
2. ¿Qué dice cada uno sobre vehiculo_rodante y sus columnas?
3. ¿Hay contradicciones entre documentos sobre el vehículo?
4. ¿La documentación describe el tipo/clase del vehículo? ¿Con qué nombre?
5. ¿Las maestras vienen de SAP o se mantienen en el TMS? Cita la decisión.

Cita archivo:línea. Si un documento que esperarías no existe, dilo como hallazgo.`,
  },
  {
    key: 'sap-043',
    prompt: `Trabajas en el repo ${RAIZ}.

OBJETIVO: leer completo docs/01-concepcion/stories/us-tms-043-contrato-integracion-sap.es.md y extraer todo lo relativo a vehículos, tracto, carreta, placas, conductores y transportistas.

Contesta:
1. ¿Qué campos de vehículo define el contrato con SAP? Lista nombre por nombre con su tipo y si es obligatorio.
2. ¿El contrato distingue tracto de carreta? ¿Cómo?
3. ¿El contrato trae algún campo de TIPO o CLASE de vehículo (configuración vehicular, categoría, carrocería)? Cita el texto literal.
4. ¿Qué campos de conductor y transportista trae?
5. ¿Qué dice sobre la guía de remisión y qué datos de la unidad exige SUNAT? (la GRE exige placa y a veces configuración vehicular — busca si está)
6. ¿Hay otras historias en docs/01-concepcion/stories/ que definan la maestra de vehículos o el mantenimiento de unidades? Lístalas.

Cita archivo:línea con texto literal corto.`,
  },
  {
    key: 'uml',
    prompt: `Trabajas en el repo ${RAIZ}.

OBJETIVO: extraer del modelo UML de StarUML qué define para el vehículo.

El archivo unimar_tms_recepcion.mdj es JSON grande (1.3 MB). NO lo leas entero: usa grep para encontrar los bloques.

1. Busca "vehiculo_rodante" en unimar_tms_recepcion.mdj y extrae TODAS sus columnas con nombre, tipo y documentación asociada. Ojo: las columnas propuestas llevan el prefijo NUEVO_.
2. Compara con unimar_tms_recepcion.ANTES-DE-PROPUESTA.mdj para ver qué se agregó en la propuesta.
3. Busca si existe alguna entidad de tipo de vehículo, marca, modelo o configuración vehicular.
4. Reporta si el UML tiene una columna de tipo/clase del vehículo más allá del rol TRACTO/CARRETA.

Cita el archivo y el fragmento JSON relevante (corto). Usa grep con contexto, no vuelques el archivo.`,
  },
  {
    key: 'uso',
    prompt: `Trabajas en el repo ${RAIZ}.

OBJETIVO: ver cómo se USA hoy el vehículo en las tres aplicaciones, para saber qué dato falta en la UI.

Revisa:
- src/apps/web/src — el módulo de planificación de citas, el modal de asignar viaje (modal-asignar-viaje.tsx, selector de vehículos) y cualquier mantenimiento de vehículos/unidades.
- src/apps/prototipo-web/src — pantallas de UNITRANS y del TMS que muestren placa, tracto o carreta.
- apps/unitrans-android/app/src — modelos y pantallas Kotlin (Modelos.kt, DatosMock.kt, MenuLateral.kt).

Contesta:
1. ¿La UI web permite hoy elegir una carreta además del tracto? ¿Dónde y con qué campo?
2. ¿Qué datos del vehículo se muestran al usuario (placa, marca, transportista, tipo)?
3. ¿La app del conductor muestra placa de tracto y de carreta por separado? Cita el modelo Kotlin.
4. ¿Existe una pantalla de mantenimiento de vehículos? ¿Qué campos edita?
5. ¿Aparece en algún lado un concepto de "tipo de vehículo" o "configuración vehicular" en la UI?

Cita archivo:línea.`,
  },
]

phase('Leer')

const resultados = await pipeline(
  DIMENSIONES,
  (d) => agent(d.prompt, { label: `leer:${d.key}`, phase: 'Leer', schema: HALLAZGOS }),
  (res, d) => {
    if (!res || !res.hallazgos || res.hallazgos.length === 0) return { dimension: d.key, hallazgos: [], resumen: res ? res.resumen : 'sin resultado' }
    const aVerificar = res.hallazgos.slice(0, 8)
    return parallel(
      aVerificar.map((h) => () =>
        agent(
          `Repo: ${RAIZ}. Alguien afirma lo siguiente sobre el modelo de datos del TMS:

AFIRMACIÓN: ${h.afirmacion}
EVIDENCIA CITADA: ${h.evidencia}

Tu trabajo es REFUTARLA. Abre el archivo citado y compruébalo carácter por carácter. Comprueba también si hay otro archivo del repo que la contradiga (migración posterior, ADR posterior, entidad ORM real).

Marca refutada = true si el archivo no dice eso, si la línea no existe, si la afirmación exagera, o si otro archivo del repo la contradice. Ante la duda, refuta. Si está refutada, escribe en "correccion" el hecho correcto con su evidencia.`,
          { label: `verificar:${d.key}`, phase: 'Verificar', schema: VEREDICTO },
        ).then((v) => ({ ...h, veredicto: v })),
      ),
    ).then((verificados) => ({
      dimension: d.key,
      resumen: res.resumen,
      hallazgos: verificados.filter(Boolean),
      noVerificados: res.hallazgos.length - aVerificar.length,
    }))
  },
)

const limpio = resultados.filter(Boolean)

for (const r of limpio) {
  const vivos = (r.hallazgos || []).filter((h) => h.veredicto && !h.veredicto.refutada).length
  const caidos = (r.hallazgos || []).filter((h) => h.veredicto && h.veredicto.refutada).length
  log(`${r.dimension}: ${vivos} confirmados, ${caidos} refutados${r.noVerificados ? `, ${r.noVerificados} sin verificar` : ''}`)
}

return limpio
