export const meta = {
  name: 'modelo-datos-movilidad-escolar',
  description: 'Extrae datos de las 18 pantallas del prototipo Fusión, diseña el modelo de tablas con 3 enfoques, sintetiza y verifica adversarialmente',
  phases: [
    { title: 'Extraer', detail: 'una lectura por grupo de pantallas' },
    { title: 'Diseñar', detail: '3 modelos independientes + síntesis' },
    { title: 'Verificar', detail: '3 lentes adversariales + corrección final' },
  ],
}

const DIR = 'C:/Users/Christian/Proyectos/movilidad_escolar/diseno/'
const PRD = 'C:/Users/Christian/Proyectos/movilidad_escolar/PRD.md'

const GRUPOS = [
  { key: 'acceso', titulo: 'Login, sesión y Mi cuenta', archivos: ['FusionLogin', 'FusionPadreSesionCerrada', 'FusionPadreCuenta'] },
  { key: 'padre-viaje', titulo: 'Padre: En ruta, Sin ruta, Avisos', archivos: ['FusionPadreEnRuta', 'FusionPadreSinRuta', 'FusionPadreAvisos'] },
  { key: 'padre-hijos', titulo: 'Padre: varios hijos', archivos: ['FusionPadreDosHijos', 'FusionPadreMismoBus'] },
  { key: 'conductor-ruta', titulo: 'Conductor: permiso, Mi ruta, Ida, Vuelta', archivos: ['FusionConductorPermiso', 'FusionConductorMiRuta', 'FusionConductorAlumnos', 'FusionConductorVuelta'] },
  { key: 'conductor-familias', titulo: 'Conductor: Familias, Nueva, Editar', archivos: ['FusionConductorFamilias', 'FusionConductorNuevaFamilia', 'FusionConductorEditarFamilia'] },
  { key: 'conductor-alumnos', titulo: 'Conductor: Nuevo/Editar alumno, Colegios', archivos: ['FusionConductorNuevoAlumno', 'FusionConductorEditarAlumno', 'FusionConductorColegios'] },
]

const EXTRACCION_SCHEMA = {
  type: 'object',
  properties: {
    grupo: { type: 'string' },
    pantallas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archivo: { type: 'string' },
          proposito: { type: 'string' },
          datos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entidad: { type: 'string', description: 'concepto de negocio al que pertenece el dato, en español singular snake_case (usuario, familia, apoderado, alumno, colegio, parada, vehiculo, viaje, aviso, etc.)' },
                campo: { type: 'string', description: 'nombre de columna sugerido en español snake_case' },
                tipo_sugerido: { type: 'string', description: 'tipo PostgreSQL sugerido' },
                obligatorio: { type: 'boolean' },
                evidencia: { type: 'string', description: 'texto literal o variable de estado de la pantalla que lo demuestra' },
              },
              required: ['entidad', 'campo', 'tipo_sugerido', 'obligatorio', 'evidencia'],
            },
          },
          acciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                efecto_en_datos: { type: 'string', description: 'qué fila se crea/actualiza y qué estado o marca de tiempo cambia' },
              },
              required: ['nombre', 'efecto_en_datos'],
            },
          },
          estados_o_enums: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entidad: { type: 'string' },
                campo: { type: 'string' },
                valores: { type: 'array', items: { type: 'string' } },
              },
              required: ['entidad', 'campo', 'valores'],
            },
          },
        },
        required: ['archivo', 'proposito', 'datos', 'acciones', 'estados_o_enums'],
      },
    },
  },
  required: ['grupo', 'pantallas'],
}

const COLUMNA_SCHEMA = {
  type: 'object',
  properties: {
    nombre: { type: 'string' },
    tipo: { type: 'string', description: 'tipo PostgreSQL, p. ej. BIGINT, VARCHAR(100), TEXT, BOOLEAN, TIMESTAMPTZ, TIME, DATE, NUMERIC(10,7), SMALLINT' },
    nulable: { type: 'boolean' },
    pk: { type: 'boolean' },
    fk_tabla: { type: 'string', description: 'tabla referenciada o cadena vacía' },
    justificacion: { type: 'string', description: 'pantalla o sección del PRD que exige la columna' },
  },
  required: ['nombre', 'tipo', 'nulable', 'pk', 'fk_tabla', 'justificacion'],
}

const MODELO_SCHEMA = {
  type: 'object',
  properties: {
    enfoque: { type: 'string' },
    grupos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
        },
        required: ['nombre', 'descripcion'],
      },
    },
    tablas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'español, snake_case, singular' },
          grupo: { type: 'string' },
          proposito: { type: 'string' },
          columnas: { type: 'array', items: COLUMNA_SCHEMA },
        },
        required: ['nombre', 'grupo', 'proposito', 'columnas'],
      },
    },
    relaciones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tabla_hija: { type: 'string' },
          columna_fk: { type: 'string' },
          tabla_padre: { type: 'string' },
          cardinalidad: { type: 'string', enum: ['1:N', '1:1', '0..1:N'] },
        },
        required: ['tabla_hija', 'columna_fk', 'tabla_padre', 'cardinalidad'],
      },
    },
    descartes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          que: { type: 'string' },
          por_que: { type: 'string' },
        },
        required: ['que', 'por_que'],
      },
    },
    dudas: { type: 'array', items: { type: 'string' } },
  },
  required: ['enfoque', 'grupos', 'tablas', 'relaciones', 'descartes', 'dudas'],
}

const VERIFICACION_SCHEMA = {
  type: 'object',
  properties: {
    lente: { type: 'string' },
    problemas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severidad: { type: 'string', enum: ['bloqueante', 'importante', 'menor'] },
          tabla: { type: 'string' },
          columna: { type: 'string' },
          descripcion: { type: 'string' },
          propuesta: { type: 'string' },
          evidencia: { type: 'string' },
        },
        required: ['severidad', 'tabla', 'columna', 'descripcion', 'propuesta', 'evidencia'],
      },
    },
    aprobado: { type: 'boolean' },
  },
  required: ['lente', 'problemas', 'aprobado'],
}

const REGLAS = `
REGLAS DEL PROYECTO (obligatorias):
- Base de datos PostgreSQL. Tablas en español, snake_case, singular. Columnas en español snake_case.
- Toda tabla lleva: id BIGINT identity PK, usuario_creacion BIGINT NOT NULL, usuario_actualizacion BIGINT NULL, fecha_creacion TIMESTAMPTZ NOT NULL, fecha_actualizacion TIMESTAMPTZ NULL, estado BOOLEAN NOT NULL, eliminado BOOLEAN NOT NULL. Soft delete siempre.
- Las columnas usuario_creacion / usuario_actualizacion NO se dibujan como relación (evitar líneas). La tabla usuario queda SIN líneas de relación hacia ninguna otra tabla: las FK que apunten a usuario se conservan como columna pero no se dibujan.
- SOLO lo que el prototipo Fusión (página 3) y el PRD necesitan para funcionar. Nada de administración, pagos, reportes, chat, iOS, panel web. Si dudas si algo sobra, sobra.
- El PRD manda sobre las pantallas cuando la pantalla es solo maqueta. Lee el PRD completo antes de opinar.
- La clave se guarda en dos columnas (cifrada y en texto plano) por decisión del PRD sección 10.
- Una sesión activa por usuario (id de sesión + token FCM) según PRD sección 7.
- Cada punto GPS se guarda en base según PRD sección 7 y 8.
- Paradas y colegios guardan coordenada.
- Un alumno: familia, colegio, parada, viaja en ida / vuelta / ambas.
- Avisos push con 4 tipos y preferencias por apoderado.
`

phase('Extraer')
log('Leyendo las 18 pantallas de la página Fusión en 6 grupos')
const extracciones = await parallel(GRUPOS.map(g => () => agent(
`Eres analista de datos. Lee COMPLETOS estos archivos de prototipo (HTML con lógica JS de estado dentro de <script>):
${g.archivos.map(a => DIR + a + '.dc.html').join('\n')}

También lee el PRD: ${PRD}

Grupo: "${g.titulo}".

Para cada pantalla extrae TODOS los datos que se muestran o se capturan (textos, listas, estados de la clase Component, campos de formulario, valores mostrados en tarjetas, horas, contadores, banderas), las acciones del usuario y su efecto en datos (qué fila se crea o qué estado/hora se marca), y los estados o enumeraciones (p. ej. estado de un alumno en el viaje: pendiente / recogido / falta / en_colegio / bajo). Incluye datos implícitos que la pantalla necesita para pintarse (p. ej. coordenada de la casa para el mapa, hora de última ubicación para "sin señal hace X min").
Distingue lo que es dato persistente de lo que es solo maqueta visual. No inventes datos que la pantalla no muestre ni el PRD exija.
Devuelve la extracción en el esquema pedido. Sé exhaustivo: mejor una fila de más con evidencia que una de menos.`,
  { label: `extraer:${g.key}`, phase: 'Extraer', schema: EXTRACCION_SCHEMA }
)))
const extraccionesOk = extracciones.filter(Boolean)
log(`Extracciones listas: ${extraccionesOk.length}/${GRUPOS.length}`)
const extraccionesTxt = JSON.stringify(extraccionesOk)

phase('Diseñar')
const ENFOQUES = [
  { key: 'minimo', prompt: 'ENFOQUE MÍNIMO: parte de cero y agrega una tabla o columna SOLO si una pantalla concreta del prototipo o una frase concreta del PRD la exige. Cada columna cita su pantalla. Prefiere menos tablas; fusiona cuando el prototipo no distingue.' },
  { key: 'backend', prompt: 'ENFOQUE BACKEND: piensa en lo que el servidor NestJS necesita guardar para que las pantallas funcionen de verdad: sesión única por usuario, token FCM, cada punto GPS, cálculo de "está por llegar", horas de cada hito por alumno y por viaje, avisos enviados y leídos, preferencias de aviso. Sin salirte del PRD.' },
  { key: 'pantallas', prompt: 'ENFOQUE TRAZABILIDAD: recorre pantalla por pantalla (las 18) y asegúrate de que cada texto, lista, contador, hora y acción tenga de dónde salir en el modelo. Marca en la justificación de cada columna el archivo de pantalla exacto.' },
]
const modelos = await parallel(ENFOQUES.map(e => () => agent(
`Eres arquitecto de datos. Diseña el modelo de tablas PostgreSQL para el prototipo "Movilidad Escolar" (app Android de transporte escolar para apoderados y conductor).
${e.prompt}

Lee el PRD completo: ${PRD}
Extracciones de las 18 pantallas (JSON): ${extraccionesTxt}
${REGLAS}

Agrupa las tablas en áreas de negocio (p. ej. acceso, familia, colegio y paradas, vehículo y ruta, viaje en curso, ubicación GPS, avisos). Define columnas con tipo PostgreSQL, nulabilidad, PK, FK. Lista relaciones (solo entre tablas de negocio, nunca hacia usuario). Lista lo que descartaste y por qué. Devuelve el esquema pedido.`,
  { label: `diseñar:${e.key}`, phase: 'Diseñar', schema: MODELO_SCHEMA, effort: 'high' }
)))
const modelosOk = modelos.filter(Boolean)
log(`Modelos independientes: ${modelosOk.length}/${ENFOQUES.length}`)

let modelo = await agent(
`Eres arquitecto de datos senior. Tienes ${modelosOk.length} propuestas independientes de modelo de tablas para el mismo prototipo. Sintetiza UN solo modelo final:
- Toma la intersección como base (lo que todas piden es seguro).
- Agrega lo que una sola propuesta pide SOLO si cita una pantalla o sección del PRD concreta y sin eso la pantalla no podría funcionar.
- Rechaza lo que solo "sería útil". Es un prototipo.
- Unifica nombres (español, snake_case, singular). Unifica tipos.
- Toda tabla con las 6 columnas de auditoría más el id.
- Relaciones solo entre tablas de negocio; usuario sin líneas.
- Grupos claros y pocos (5 a 7) para colorear el diagrama.

Lee el PRD: ${PRD}
Propuestas (JSON): ${JSON.stringify(modelosOk)}
Extracciones de pantallas (JSON): ${extraccionesTxt}
${REGLAS}
Devuelve el modelo final en el esquema pedido, con "enfoque" = "sintesis".`,
  { label: 'sintetizar', phase: 'Diseñar', schema: MODELO_SCHEMA, effort: 'high' }
)
if (!modelo) throw new Error('La síntesis no devolvió modelo')
log(`Modelo sintetizado: ${modelo.tablas.length} tablas, ${modelo.relaciones.length} relaciones`)

phase('Verificar')
const LENTES = [
  { key: 'completitud', prompt: 'LENTE COMPLETITUD: recorre las 18 pantallas una por una y busca cualquier dato, contador, hora, estado o acción que NO tenga columna o tabla de donde salir. Busca también lo que el PRD exige y falta (sesión única, token FCM, clave en dos columnas, cada punto GPS, coordenadas, ida/vuelta por alumno, preferencias de aviso, cambiar orden de paradas, hora de entrada y salida del colegio). Intenta REFUTAR que el modelo esté completo.' },
  { key: 'minimalidad', prompt: 'LENTE MINIMALIDAD: para cada tabla y cada columna que no sea de auditoría, exige la pantalla o frase del PRD que la justifica. Lo que no tenga justificación concreta es un problema "importante" con propuesta "eliminar". Busca tablas fusionables y columnas redundantes o derivables. Intenta REFUTAR que el modelo sea mínimo.' },
  { key: 'estandares', prompt: 'LENTE ESTÁNDARES E INTEGRIDAD: revisa nombres (español, snake_case, singular, sin siglas raras), tipos PostgreSQL válidos, las 6 columnas de auditoría más id en toda tabla, nulabilidad coherente con FK, cada FK apunta a tabla existente, cada relación declarada coincide con una columna FK real, ninguna relación toca usuario, sin ciclos raros, sin claves naturales duplicadas. Intenta REFUTAR que el modelo cumpla el estándar.' },
]
const verificaciones = await parallel(LENTES.map(l => () => agent(
`Eres auditor adversarial de modelos de datos. Tu trabajo es encontrar fallas; si no encuentras ninguna con evidencia, aprueba.
${l.prompt}

Lee el PRD: ${PRD}
Archivos de pantallas (léelos si necesitas evidencia): ${GRUPOS.flatMap(g => g.archivos).map(a => DIR + a + '.dc.html').join(', ')}
Extracciones (JSON): ${extraccionesTxt}
Modelo a auditar (JSON): ${JSON.stringify(modelo)}
${REGLAS}
Devuelve los problemas con evidencia concreta (archivo o sección del PRD) y propuesta de arreglo. Sin evidencia no hay problema.`,
  { label: `verificar:${l.key}`, phase: 'Verificar', schema: VERIFICACION_SCHEMA, effort: 'high' }
)))
const verificacionesOk = verificaciones.filter(Boolean)
const problemas = verificacionesOk.flatMap(v => v.problemas.map(p => ({ ...p, lente: v.lente })))
log(`Problemas encontrados: ${problemas.length} (${problemas.filter(p => p.severidad === 'bloqueante').length} bloqueantes)`)

if (problemas.length > 0) {
  const corregido = await agent(
`Eres arquitecto de datos senior. Aplica al modelo las correcciones que tengan evidencia real. Si dos lentes se contradicen (completitud pide agregar, minimalidad pide quitar), gana quien cite una pantalla o sección del PRD concreta; ante empate gana la minimalidad porque es un prototipo. Anota en "dudas" lo que quedó sin resolver y en "descartes" lo que rechazaste de las correcciones y por qué.

Lee el PRD: ${PRD}
Modelo actual (JSON): ${JSON.stringify(modelo)}
Problemas reportados (JSON): ${JSON.stringify(problemas)}
${REGLAS}
Devuelve el modelo corregido completo en el esquema pedido, con "enfoque" = "final".`,
    { label: 'corregir', phase: 'Verificar', schema: MODELO_SCHEMA, effort: 'high' }
  )
  if (corregido) modelo = corregido
}
log(`Modelo final: ${modelo.tablas.length} tablas, ${modelo.relaciones.length} relaciones`)
return { modelo, problemas, extracciones: extraccionesOk }