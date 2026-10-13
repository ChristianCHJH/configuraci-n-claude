export const meta = {
  name: 'auditar-put-estado',
  description: 'Investiga la semántica correcta de PUT con campos opcionales y audita el patrón estado en las 6 maestras del TMS',
  phases: [
    { title: 'Investigar', detail: 'RFC 9110, guías de diseño de API, práctica de frameworks' },
    { title: 'Auditar', detail: 'backend y frontend de las 6 maestras, solo lectura' },
    { title: 'Sintetizar', detail: 'recomendación única y lista de hallazgos verificados' },
  ],
}

const RAIZ = 'c:/Christian/unimar_tms'
const API = `${RAIZ}/src/apps/api/src`
const WEB = `${RAIZ}/src/apps/web/src`

const ESQUEMA_INVESTIGACION = {
  type: 'object',
  properties: {
    postura: { type: 'string', description: 'Qué dice esta fuente que debe pasar si un PUT omite un campo' },
    fundamento: { type: 'string', description: 'La cita o regla concreta que lo sustenta' },
    fuentes: { type: 'array', items: { type: 'string' }, description: 'URLs o documentos citados' },
    matices: { type: 'array', items: { type: 'string' }, description: 'Cuándo la regla NO aplica o se relaja' },
    veredicto: {
      type: 'string',
      enum: ['RECHAZAR_400', 'CONSERVAR_VALOR', 'APLICAR_DEFAULT', 'SACAR_DEL_PUT', 'DEPENDE'],
      description: 'Qué recomienda esta fuente para un campo booleano omitido en un PUT',
    },
  },
  required: ['postura', 'fundamento', 'fuentes', 'veredicto'],
}

const ESQUEMA_HALLAZGOS = {
  type: 'object',
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archivo: { type: 'string' },
          linea: { type: 'number' },
          titulo: { type: 'string' },
          descripcion: { type: 'string' },
          comoFalla: { type: 'string', description: 'Pasos concretos usuario -> resultado incorrecto' },
          gravedad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
        },
        required: ['archivo', 'titulo', 'descripcion', 'comoFalla', 'gravedad'],
      },
    },
  },
  required: ['hallazgos'],
}

const ESQUEMA_VEREDICTO = {
  type: 'object',
  properties: {
    real: { type: 'boolean', description: 'true si el hallazgo se sostiene tras leer el código' },
    razon: { type: 'string' },
    correccion: { type: 'string', description: 'Qué habría que cambiar, sin cambiarlo' },
  },
  required: ['real', 'razon'],
}

const ANGULOS = [
  {
    key: 'rfc',
    prompt: `Investiga qué dice la especificación HTTP sobre PUT con representaciones parciales o campos omitidos.
Busca y lee RFC 9110 (sección de PUT, 9.3.4) y RFC 5789 (PATCH). Responde específicamente:
si un cliente hace PUT con un JSON al que le falta un campo que el recurso sí tiene, ¿el servidor debe
rechazar, conservar el valor anterior, o aplicar un default? Cita el texto literal relevante.
Es investigación de lectura: NO edites ningún archivo.`,
  },
  {
    key: 'guias',
    prompt: `Investiga qué recomiendan las guías de diseño de API más citadas de la industria sobre campos
opcionales en un PUT: Microsoft REST API Guidelines, Google API Improvement Proposals (AIP-134 sobre Update,
AIP-203 sobre field behavior), Zalando RESTful API Guidelines, y la guía de Stripe/GitHub si aplica.
Pregunta concreta: ¿un booleano que el cliente omite en un PUT debe provocar 400, conservarse, o tomar un default?
¿Qué dicen sobre usar PUT vs PATCH para cambios de estado/activación? Cita reglas numeradas cuando existan.
Es investigación de lectura: NO edites ningún archivo.`,
  },
  {
    key: 'riesgo',
    prompt: `Investiga el modo de falla concreto: un DTO donde un campo booleano es opcional y el servidor
aplica "?? true" al actualizar. Busca cómo se llama este antipatrón (mass assignment, lost update,
silent state reset, unintended reactivation), qué riesgo de seguridad o de datos representa,
y qué recomiendan OWASP y las guías de API sobre defaults implícitos en operaciones de escritura.
Enfócate en el caso de un flag de baja lógica (soft delete / activo-inactivo) que se reactiva solo.
Es investigación de lectura: NO edites ningún archivo.`,
  },
]

const SUPERFICIES = [
  {
    key: 'backend-controllers',
    prompt: `Lee SOLO (no edites) estos archivos del TMS:
${API}/modules/flota/api/flota.controller.ts
${API}/modules/naves/api/nave.controller.ts
${API}/modules/naves/api/instalacion-portuaria.controller.ts
${API}/modules/flota/api/dto/guardar-flota.dto.ts
${API}/modules/naves/api/dto/guardar-nave.dto.ts
${API}/modules/naves/api/dto/guardar-instalacion-portuaria.dto.ts

Busca todo lugar donde un campo opcional del DTO recibe un valor por defecto al ACTUALIZAR (patrón "cuerpo.X ?? algo").
Para cada uno di si el default es seguro al crear pero destructivo al actualizar. Cubre las 6 maestras:
transportista, conductor, vehiculo rodante, nave, viaje de nave, instalacion portuaria.
Reporta también campos DISTINTOS de "estado" que sufran lo mismo.`,
  },
  {
    key: 'backend-repos',
    prompt: `Lee SOLO (no edites) los repositorios TypeORM de las maestras del TMS. Búscalos bajo
${API}/modules/flota/infrastructure/persistence/ y ${API}/modules/naves/infrastructure/persistence/.
Para cada método "actualizar", lista qué columnas escribe. Pregunta a responder: ¿el UPDATE escribe
siempre todas las columnas del DTO, incluida "estado", aunque el cliente no la haya mandado?
¿Hay algún control de concurrencia (ultimo_cambio / rowversion) verificado al actualizar, o dos usuarios
editando la misma fila se pisan sin aviso? Reporta lo que encuentres, con archivo y línea.`,
  },
  {
    key: 'frontend-paginas',
    prompt: `Lee SOLO (no edites) las 6 páginas de mantenimientos del TMS en
${WEB}/funcionalidades/mantenimientos/paginas/ (transportistas.tsx, conductores.tsx, vehiculos-rodantes.tsx,
naves.tsx, naves-viaje.tsx, instalaciones-portuarias.tsx).

Compara cómo cada modal inicializa el estado del formulario. Algunas usan useState(() => fila?.campo ?? ''),
otras usan useState('') sin leer la fila. Identifica CADA página cuyo modal de EDICIÓN abre con los campos
vacíos o con valores por defecto en vez de los datos de la fila que se está editando.
Presta atención especial al campo "activo"/"estado". Reporta archivo y línea de cada caso.`,
  },
]

phase('Investigar')
log('Investigando la semántica correcta de PUT y auditando el código en paralelo')

const [investigacion, auditoria] = await Promise.all([
  parallel(
    ANGULOS.map(
      (a) => () => agent(a.prompt, { label: `investigar:${a.key}`, phase: 'Investigar', schema: ESQUEMA_INVESTIGACION }),
    ),
  ),
  pipeline(
    SUPERFICIES,
    (s) => agent(s.prompt, { label: `auditar:${s.key}`, phase: 'Auditar', schema: ESQUEMA_HALLAZGOS }),
    (resultado, superficie) =>
      resultado === null
        ? []
        : parallel(
            resultado.hallazgos.map((h) => () =>
              agent(
                `Verifica adversarialmente este hallazgo del TMS. Lee el código real antes de opinar. NO edites nada.

Archivo: ${h.archivo}${h.linea === undefined ? '' : `:${h.linea}`}
Afirmación: ${h.titulo}
Detalle: ${h.descripcion}
Cómo falla según quien lo reportó: ${h.comoFalla}

Tu trabajo es REFUTARLO. Si el código ya lo maneja en otra capa (validación, hook de React que recarga,
key del componente que lo remonta, guard, migración), el hallazgo es falso. Marca real=false si dudas.`,
                { label: `verificar:${superficie.key}`, phase: 'Auditar', schema: ESQUEMA_VEREDICTO },
              ).then((v) => (v === null ? null : { ...h, superficie: superficie.key, veredicto: v })),
            ),
          ),
  ),
])

phase('Sintetizar')

const posturas = investigacion.filter(Boolean)
const confirmados = auditoria
  .flat()
  .filter(Boolean)
  .filter((h) => h.veredicto.real)
const descartados = auditoria
  .flat()
  .filter(Boolean)
  .filter((h) => !h.veredicto.real)

log(`${posturas.length} posturas investigadas · ${confirmados.length} hallazgos confirmados · ${descartados.length} descartados`)

const sintesis = await agent(
  `Eres el sintetizador. NO edites archivos. Con esto responde en español de Perú, directo y sin relleno:

INVESTIGACIÓN SOBRE PUT:
${JSON.stringify(posturas, null, 2)}

HALLAZGOS CONFIRMADOS EN EL CÓDIGO:
${JSON.stringify(confirmados, null, 2)}

Produce:
1. UNA recomendación única sobre qué debe pasar cuando un PUT omite el campo "estado" en las tablas maestras
   del TMS, sustentada en lo que dicen las fuentes. Si las fuentes se contradicen, di cuál gana y por qué.
2. Los hallazgos ordenados por gravedad, cada uno en dos líneas: qué está mal y cómo se rompe en la práctica.
No propongas parches de código, solo el diagnóstico y la decisión.`,
  { label: 'sintetizar', phase: 'Sintetizar' },
)

return { posturas, confirmados, descartados: descartados.map((d) => ({ titulo: d.titulo, razon: d.veredicto.razon })), sintesis }
