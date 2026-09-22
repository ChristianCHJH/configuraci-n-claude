export const meta = {
  name: 'clasificar-flujo-entrega-1',
  description: 'Clasifica cada paso del flujo Entrega 1 en Vista previa (sem 5) vs Entrega 1 (sem 8) y define el tratamiento visual del nuevo diagrama',
  phases: [
    { title: 'Clasificar', detail: 'tres lentes independientes: comercial, backlog, PRD' },
    { title: 'Conciliar', detail: 'cruzar las tres y resolver discrepancias con evidencia' },
    { title: 'Disenio', detail: 'dos propuestas de separacion visual + juez' },
  ],
}

const SP = 'C:/Users/CHRIST~1/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria-sistema/d183a1c8-0585-4ee5-8e5f-8b91140a2366/scratchpad'
const DIAG = 'C:/Users/Christian/Proyectos/inmobiliaria/3-producto/diagramas/flujo-proceso-entrega-1.drawio'
const PROD = 'C:/Users/Christian/Proyectos/inmobiliaria/3-producto'

const CONTEXTO = `
CONTEXTO DEL PROYECTO
Sistema de gestion inmobiliaria (dos razones sociales: INMOBILIARIA BL y LIMACO). Repos:
- Producto/backlog: C:/Users/Christian/Proyectos/inmobiliaria/  (3-producto/PRD.md, 3-producto/epicas.md, 3-producto/historias/E00..E17, 3-producto/alcance-negocio.md, 1-comercial/proforma-cliente.md, 1-comercial/contrato.html)
- Codigo: C:/Users/Christian/Proyectos/inmobiliaria-sistema/

EL DIAGRAMA
${DIAG} es un drawio con 11 bandas (B00..B09 y B17) y 128 nodos de proceso con ids n_Pxx.
Ya fue extraido a TSV plano para que NO tengas que parsear XML:
- ${SP}/pasos.tsv   -> columnas: banda, id, col, fila_y, es_entrega2, texto (texto completo del nodo)
- ${SP}/aristas.tsv -> columnas: source, target, label

LAS TRES ENTREGAS CONTRATADAS (tabla 4.1 de 1-comercial/proforma-cliente.md, alcance acumulativo):
- Vista previa, semana 5 (11 set 2026): Proyectos, manzanas y lotes | Clientes y usuarios con permisos por perfil | Separacion con monto y fecha de vigencia | Contrato y cronograma de cuotas automatico
- Entrega 1, semana 8 (2 oct 2026), SUMA: Registro de pagos y estado de cuenta del cliente | Identificacion automatica de clientes en mora | Vista consolidada de las dos razones sociales | Plano interactivo y editor de lotes
- Entrega 2, semana 13 (6 nov 2026): todo lo demas. En el diagrama esos pasos ya estan marcados con el texto "ENTREGA 2" y la columna es_entrega2=SI. ESOS SE VAN A ELIMINAR del diagrama nuevo, no los clasifiques.

TU TAREA
Clasificar cada nodo con es_entrega2 vacio en exactamente una de dos etiquetas:
- "VP5"  = ya se demuestra en la vista previa de la semana 5
- "E1S8" = recien aparece en la Entrega 1 de la semana 8
Regla de oro: el alcance es ACUMULATIVO. Si una funcion aparece en la columna "Vista previa sem 5" de la tabla 4.1, todos sus pasos son VP5. Si recien aparece marcada en "Entrega 1 sem 8", sus pasos son E1S8.
Los nodos terminales (los redondeados tipo "Lote liberado y separacion cerrada"), los rombos de decision y las notas heredan la etiqueta del tramo de flujo al que pertenecen.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['bandas', 'pasos', 'dudosos', 'notas'],
  properties: {
    bandas: {
      type: 'array',
      description: 'etiqueta dominante por banda',
      items: {
        type: 'object', additionalProperties: false,
        required: ['banda', 'etiqueta', 'razon'],
        properties: {
          banda: { type: 'string' },
          etiqueta: { type: 'string', enum: ['VP5', 'E1S8', 'MIXTA'] },
          razon: { type: 'string' },
        },
      },
    },
    pasos: {
      type: 'array',
      description: 'clasificacion de CADA nodo con es_entrega2 vacio, sin faltar ninguno',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'banda', 'etiqueta', 'confianza', 'evidencia'],
        properties: {
          id: { type: 'string' },
          banda: { type: 'string' },
          etiqueta: { type: 'string', enum: ['VP5', 'E1S8'] },
          confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
          evidencia: { type: 'string', description: 'archivo y linea o cita textual que lo respalda' },
        },
      },
    },
    dudosos: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'porque', 'lectura_alternativa'],
        properties: { id: { type: 'string' }, porque: { type: 'string' }, lectura_alternativa: { type: 'string' } },
      },
    },
    notas: { type: 'string' },
  },
}

phase('Clasificar')

const LENTES = [
  {
    key: 'comercial',
    prompt: `${CONTEXTO}

TU LENTE: EL DOCUMENTO COMERCIAL.
Lee 1-comercial/proforma-cliente.md completo (sobre todo la seccion 4.1 y las clausulas de entregables) y 1-comercial/contrato.html.
Clasifica desde lo que se le PROMETIO AL CLIENTE que veria el 11 de setiembre. Si algo no esta prometido para la semana 5, es E1S8.
Cita numero de linea del archivo comercial en cada evidencia.`,
  },
  {
    key: 'backlog',
    prompt: `${CONTEXTO}

TU LENTE: EL BACKLOG.
Lee 3-producto/epicas.md (seccion "Que contiene cada entrega") y TODAS las historias en 3-producto/historias/E00..E09 que tengan marca de sprint o de entrega.
Mapea cada nodo del TSV a la historia (Exx-yy) que lo implementa, y de la historia deduce la entrega. Pon el codigo de historia en la evidencia.
Si una banda entera corresponde a una epica que recien entra en la semana 8, di eso en bandas[].razon.`,
  },
  {
    key: 'prd',
    prompt: `${CONTEXTO}

TU LENTE: EL PRD Y EL ALCANCE DE NEGOCIO.
Lee 3-producto/PRD.md y 3-producto/alcance-negocio.md.
Clasifica desde la dependencia funcional: que necesita estar vivo para que el flujo de la semana 5 se pueda demostrar de punta a punta (un cliente, un lote, una separacion, un contrato y su cronograma) y que es estrictamente posterior.
Presta atencion especial a los casos limite: el pago de la separacion, el pago de la cuota inicial y los pasos del plano dentro de la banda B00 y B01.`,
  },
]

const clasificaciones = await parallel(
  LENTES.map((l) => () =>
    agent(l.prompt, { label: `lente:${l.key}`, phase: 'Clasificar', schema: SCHEMA })
      .then((r) => ({ lente: l.key, ...r })),
  ),
)

const vivas = clasificaciones.filter(Boolean)
log(`${vivas.length}/3 lentes respondieron`)

phase('Conciliar')

const porPaso = {}
for (const c of vivas) {
  for (const p of c.pasos || []) {
    porPaso[p.id] = porPaso[p.id] || { id: p.id, banda: p.banda, votos: [] }
    porPaso[p.id].votos.push(`${c.lente}=${p.etiqueta}(${p.confianza})`)
  }
}
const filas = Object.values(porPaso)
const discordes = filas.filter((f) => new Set(f.votos.map((v) => v.split('=')[1].split('(')[0])).size > 1)
log(`${filas.length} pasos con voto, ${discordes.length} en discordia`)

const CONCILIA_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['final', 'reglas_de_banda', 'advertencias'],
  properties: {
    final: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'etiqueta', 'razon'],
        properties: { id: { type: 'string' }, etiqueta: { type: 'string', enum: ['VP5', 'E1S8'] }, razon: { type: 'string' } },
      },
    },
    reglas_de_banda: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['banda', 'etiqueta', 'excepciones'],
        properties: {
          banda: { type: 'string' },
          etiqueta: { type: 'string', enum: ['VP5', 'E1S8', 'MIXTA'] },
          excepciones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    advertencias: { type: 'array', items: { type: 'string' } },
  },
}

const conciliado = await agent(
  `${CONTEXTO}

Tres analistas clasificaron los pasos con lentes distintos (comercial, backlog, PRD). Este es el tablero de votos:

${filas.map((f) => `${f.id} [${f.banda}] ${f.votos.join(' | ')}`).join('\n')}

PASOS EN DISCORDIA (${discordes.length}): ${discordes.map((d) => d.id).join(', ') || 'ninguno'}

Dudosos reportados:
${vivas.flatMap((c) => (c.dudosos || []).map((d) => `[${c.lente}] ${d.id}: ${d.porque} -> alternativa: ${d.lectura_alternativa}`)).join('\n') || '(ninguno)'}

Notas de cada lente:
${vivas.map((c) => `[${c.lente}] ${c.notas}`).join('\n\n')}

TU TAREA: producir la clasificacion FINAL de los ${filas.length} pasos. Para cada discordia, ve a los archivos fuente y resuelve con evidencia, no por mayoria ciega. Devuelve tambien la regla por banda (etiqueta dominante + lista de ids que son la excepcion dentro de esa banda), que es lo que se va a usar para pintar el diagrama.
Advierte de todo lo que quede genuinamente ambiguo: eso se le va a preguntar al humano.`,
  { label: 'conciliar', phase: 'Conciliar', schema: CONCILIA_SCHEMA, effort: 'high' },
)

phase('Disenio')

const DIS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mecanismo', 'detalle_visual', 'leyenda', 'riesgos'],
  properties: {
    mecanismo: { type: 'string' },
    detalle_visual: { type: 'string', description: 'estilos drawio concretos: fillColor, strokeColor, dashed, contenedores, posiciones' },
    leyenda: { type: 'string' },
    riesgos: { type: 'array', items: { type: 'string' } },
  },
}

const PROP = `${CONTEXTO}

El diagrama nuevo debe: (1) NO contener ningun paso de Entrega 2, con el flujo reconectado para que siga leyendose de corrido; (2) distinguir de un golpe de vista lo que entra en la Vista previa de la semana 5 de lo que recien entra en la Entrega 1 de la semana 8.

El diagrama original tiene 11 bandas horizontales apiladas (una por etapa del negocio, ancho 2950, x=40), y dentro de cada banda los pasos van en una grilla de 6 columnas (x = 260, 710, 1160, 1610, 2060, 2510; ancho 380). Cada banda tiene su propio color pastel de fondo y sus nodos usan ese color.

Propone UN mecanismo visual concreto y detallado (estilos drawio literales) para la distincion semana 5 / semana 8. Se explicito sobre que pasa cuando una MISMA banda tiene pasos de las dos entregas (caso real: B00 y B01).`

const propuestas = await parallel([
  () => agent(`${PROP}\n\nTU ANGULO: la distincion tiene que sobrevivir a la impresion en blanco y negro y a un proyector malo. Prioriza forma, borde y etiqueta sobre color.`, { label: 'disenio:robusto', phase: 'Disenio', schema: DIS_SCHEMA }),
  () => agent(`${PROP}\n\nTU ANGULO: el lector es el CLIENTE en una reunion, no un ingeniero. Prioriza que en tres segundos entienda "esto lo veo el 11 de setiembre / esto el 2 de octubre". Puedes usar contenedores grandes, bandas laterales o marcos.`, { label: 'disenio:cliente', phase: 'Disenio', schema: DIS_SCHEMA }),
])

const juez = await agent(
  `Dos propuestas de tratamiento visual para el mismo diagrama drawio:

PROPUESTA A (robusta):
${JSON.stringify(propuestas[0], null, 1)}

PROPUESTA B (orientada al cliente):
${JSON.stringify(propuestas[1], null, 1)}

Restriccion dura: el diagrama tiene 11 bandas horizontales apiladas y al menos dos de ellas (B00 configuracion, B01 cliente) contienen pasos de AMBAS entregas, asi que "un cubo grande arriba y otro abajo" NO es aplicable sin reordenar los pasos. Cualquier mecanismo debe funcionar con pasos de las dos entregas conviviendo dentro de una misma banda.

Elige el mecanismo definitivo, injertando lo mejor de la otra propuesta. Devuelve la especificacion final lista para implementar: estilos drawio literales (fillColor, strokeColor, strokeWidth, dashed, fontStyle), como se marca cada nodo, si hay contenedores y donde, y como es la leyenda.`,
  { label: 'juez-disenio', phase: 'Disenio', schema: DIS_SCHEMA, effort: 'high' },
)

return { conciliado, juez, discordes: discordes.map((d) => ({ id: d.id, votos: d.votos })), totalClasificados: filas.length }
