export const meta = {
  name: 'verificar-detalle-construccion',
  description: 'Comprueba contra el repositorio actual que las afirmaciones del documento de detalle siguen siendo ciertas',
  phases: [
    { title: 'Verificar', detail: 'cuatro verificadores toman un tramo de puntos cada uno' },
    { title: 'Refutar', detail: 'un escéptico valida cada desviación reportada' },
  ],
}

const DOC = 'C:/Users/Christian/Proyectos/inmobiliaria/4-plan/estado-de-construccion-detalle.md'
const REPO = 'C:/Users/Christian/Proyectos/inmobiliaria-sistema'

const CONTEXTO = `
QUE SE VERIFICA
${DOC} es una foto del estado del codigo tomada el 26 de agosto de 2026 sobre el commit 5eb4c51 del
repositorio ${REPO}. Tiene 33 puntos numerados (2.1 a 2.16, 3.1 a 3.11, 4.1 a 4.6) mas dos secciones
finales (5 huecos transversales, 6 duplicados). Cada punto trae: porcentaje, desglose por dimension,
que esta construido, que falta, carga de datos asociada, por que bajo el puntaje y una lista de rutas
de archivo bajo el titulo "Donde mirar".

El documento existe para que alguien pueda retomar cualquier modulo SIN volver a auditar el repositorio.
Por eso lo unico que importa es: LO QUE DICE, ¿ES CIERTO HOY?

TU TAREA
Abri el documento, tomate los puntos que te tocan (abajo) y verifica cada afirmacion concreta contra
el codigo REAL de ${REPO}. Interesan solo las afirmaciones comprobables:
- una ruta citada en "Donde mirar" que no existe o cambio de nombre
- una tabla, entidad, caso de uso, endpoint o pantalla que el documento da por existente y no existe
- una tabla que el documento da por INEXISTENTE y que si existe (o nacio despues)
- un conteo equivocado (numero de casos de uso, de endpoints, de columnas, de pruebas)
- una afirmacion sobre el comportamiento del codigo que al abrir el archivo resulta falsa
- un desglose que no cuadra con el porcentaje (esquema+aplicacion+api+frontend+pruebas debe sumar el %)

NO reportes: diferencias de redaccion, de tono, ni juicios sobre si el porcentaje "deberia" ser otro.
Solo hechos verificables que el documento afirma y el codigo desmiente.

Empeza corriendo: cd ${REPO} && git log --oneline -3 && git status --short
Si el repositorio avanzo desde 5eb4c51, decilo: puede explicar por si solo varias diferencias.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['desviaciones', 'confirmados', 'notas'],
  properties: {
    desviaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['punto', 'afirmacion', 'realidad', 'evidencia', 'gravedad'],
        properties: {
          punto: { type: 'string', description: 'el indice, ej "2.5"' },
          afirmacion: { type: 'string', description: 'lo que el documento dice, citado' },
          realidad: { type: 'string', description: 'lo que el codigo dice hoy' },
          evidencia: { type: 'string', description: 'archivo y linea que lo demuestra' },
          gravedad: { type: 'string', enum: ['alto', 'medio', 'menor'] },
        },
      },
    },
    confirmados: { type: 'array', items: { type: 'string' }, description: 'indices de los puntos que verificaste y estan correctos' },
    notas: { type: 'string' },
  },
}

phase('Verificar')

const TRAMOS = [
  { key: 'plataforma', puntos: '4.1 a 4.6 (transversal: bitacora, cimientos, archivos, clientes, separacion, contrato) y los puntos 2.1, 2.3 y 2.6 (autenticacion, correo, usuarios)' },
  { key: 'administracion', puntos: '2.4, 2.8, 2.11, 2.14, 2.15 (roles y permisos, empresas, parametros, conceptos de cobro, comision por asesor)' },
  { key: 'inventario', puntos: '2.2, 2.5, 2.7, 2.9, 2.10, 2.12, 2.13, 2.16 (jerarquia, carga masiva, tipos de unidad, lotes, estados, bloqueos, precios, inversionista)' },
  { key: 'plano-y-dinero', puntos: '3.1 a 3.11 (todo el bloque 2: plano, DXF, visor, recarga, filtros, pagos, vouchers, mora, comprobantes, titulacion, tipo de cambio)' },
]

const verificaciones = await parallel(
  TRAMOS.map((t) => () =>
    agent(`${CONTEXTO}\n\nTE TOCAN LOS PUNTOS: ${t.puntos}\n\nVerifica cada uno abriendo los archivos. Se exhaustivo con las rutas de "Donde mirar": abrilas todas.`, {
      label: `verifica:${t.key}`,
      phase: 'Verificar',
      schema: SCHEMA,
    }).then((r) => ({ tramo: t.key, ...r })),
  ),
)

const vivas = verificaciones.filter(Boolean)
const todas = vivas.flatMap((v) => (v.desviaciones || []).map((d) => ({ ...d, tramo: v.tramo })))
log(`${todas.length} desviaciones brutas; ${vivas.flatMap((v) => v.confirmados || []).length} puntos confirmados`)

phase('Refutar')

const REFUTA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reales', 'descartadas', 'veredicto'],
  properties: {
    reales: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['punto', 'que_corregir', 'texto_sugerido', 'gravedad'],
        properties: {
          punto: { type: 'string' },
          que_corregir: { type: 'string' },
          texto_sugerido: { type: 'string', description: 'como deberia quedar la frase' },
          gravedad: { type: 'string', enum: ['alto', 'medio', 'menor'] },
        },
      },
    },
    descartadas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['punto', 'porque'],
        properties: { punto: { type: 'string' }, porque: { type: 'string' } },
      },
    },
    veredicto: { type: 'string', description: 'se puede confiar en el documento tal como esta, o no' },
  },
}

const refutado = await agent(
  `${CONTEXTO}

Cuatro verificadores revisaron el documento y reportaron estas desviaciones:

${todas.map((d, i) => `${i + 1}. [punto ${d.punto} · ${d.gravedad} · ${d.tramo}]\n   dice: ${d.afirmacion}\n   realidad: ${d.realidad}\n   evidencia: ${d.evidencia}`).join('\n\n') || '(ninguna)'}

Notas de los verificadores:
${vivas.map((v) => `[${v.tramo}] ${v.notas}`).join('\n\n')}

TU TAREA: eres el escéptico. Abri vos mismo cada archivo citado y confirma o descarta cada desviacion.
Descarta las que sean interpretacion, las que el documento ya matiza en otra frase, y las que el propio
verificador no pudo sustentar con archivo y linea.
Para las reales, escribi como deberia quedar la frase corregida, en el mismo tono del documento (español,
directo, sin adornos).
Al final deci si el documento se puede usar tal como esta o si hay que corregirlo antes.`,
  { label: 'refutador', phase: 'Refutar', schema: REFUTA_SCHEMA, effort: 'high' },
)

return { refutado, brutas: todas.length, confirmados: [...new Set(vivas.flatMap((v) => v.confirmados || []))].sort() }
