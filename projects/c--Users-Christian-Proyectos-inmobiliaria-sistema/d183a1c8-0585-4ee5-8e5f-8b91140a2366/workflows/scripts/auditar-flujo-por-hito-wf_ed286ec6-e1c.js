export const meta = {
  name: 'auditar-flujo-por-hito',
  description: 'Auditoria adversarial del drawio generado: topologia del flujo, clasificacion de frontera y legibilidad visual',
  phases: [
    { title: 'Auditar', detail: 'cuatro auditores con lentes distintos' },
    { title: 'Refutar', detail: 'un escéptico intenta tumbar cada hallazgo' },
  ],
}

const NUEVO = 'C:/Users/Christian/Proyectos/inmobiliaria/3-producto/diagramas/flujo-proceso-entrega-1-por-hito.drawio'
const VIEJO = 'C:/Users/Christian/Proyectos/inmobiliaria/3-producto/diagramas/flujo-proceso-entrega-1.drawio'
const SP = 'C:/Users/CHRIST~1/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria-sistema/d183a1c8-0585-4ee5-8e5f-8b91140a2366/scratchpad'

const CONTEXTO = `
QUE SE AUDITA
Se genero ${NUEVO} a partir de ${VIEJO} con estas transformaciones deterministas:
1. Se borraron los 19 pasos marcados "ENTREGA 2" (P14 P21 P22 P23 P52 P53 P66 P67 P68 P69 P70 P71 P72 P79 P86 P88 P90 P91 P137) y toda arista que los tocaba.
2. Por cada arista viva -> paso borrado se coso una arista nueva hasta el primer paso vivo que le seguia, saltando cadenas enteras de pasos borrados. La etiqueta que sobrevive es la del PRIMER tramo (la que salia del paso vivo). Aristas paralelas entre el mismo par se fusionaron en una sola con las etiquetas unidas por " · ".
3. Los 109 pasos supervivientes se re-fluyeron: dentro de cada banda se conservo el orden de lectura original (fila, luego columna) y se reasignaron a una grilla de 6 columnas sin huecos.
4. Cada paso se pinto por HITO: relleno MACIZO teal (#B7E4D8, borde #0F766E) = MUESTRA del 11 de setiembre (semana 5); relleno HUECO blanco (#FFFFFF, borde #C2410C) = ENTREGA 1 del 2 de octubre (semana 8). Ademas cada paso abre su texto con un chip "11 SET · VISTA PREVIA" o "2 OCT · ENTREGA 1". Las aristas se pintaron del color del hito, y las que cruzan de una fecha a otra van punteadas.
5. A la izquierda hay cuatro corchetes verticales, uno por tramo contiguo de bandas: MIXTA[B00..B04], todo-2-OCT[B05..B08], todo-11-SET[B09], todo-2-OCT[B17]. Cada banda lleva medidores con el conteo de pasos por fecha.
El reparto final es 45 pasos del 11 de setiembre y 64 del 2 de octubre.

ARCHIVOS DE APOYO (TSV planos, para no parsear XML):
- ${SP}/pasos.tsv   -> banda, id, col, fila_y, es_entrega2, texto (del diagrama ORIGINAL, los 128 nodos)
- ${SP}/aristas.tsv -> source, target, label (las 185 aristas ORIGINALES)
- ${SP}/prueba.reporte.txt -> las 17 reconexiones, el conteo por banda, las filas resultantes y el hito asignado a cada paso

EL PROYECTO
Backlog e historias en C:/Users/Christian/Proyectos/inmobiliaria/3-producto/ (PRD.md, epicas.md, historias/E00..E17), plan en 4-plan/, comercial en 1-comercial/proforma-cliente.md (tabla 4.1: que ve el cliente en cada entrega).
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['hallazgos', 'veredicto'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['gravedad', 'donde', 'problema', 'evidencia', 'arreglo'],
        properties: {
          gravedad: { type: 'string', enum: ['bloqueante', 'alto', 'medio', 'menor'] },
          donde: { type: 'string', description: 'id de paso, arista o elemento del diagrama' },
          problema: { type: 'string' },
          evidencia: { type: 'string', description: 'lo que verificaste en el archivo o en el backlog' },
          arreglo: { type: 'string' },
        },
      },
    },
    veredicto: { type: 'string' },
  },
}

phase('Auditar')

const AUDITORES = [
  {
    key: 'topologia',
    prompt: `${CONTEXTO}

TU LENTE: TOPOLOGIA DEL FLUJO.
Compara el grafo del diagrama nuevo contra el original. Busca SOLO cosas verificables:
- un paso vivo que perdio toda entrada o toda salida y quedo colgado
- un rombo de decision que perdio una de sus ramas y ahora tiene una sola salida (deja de ser decision)
- un rombo cuyas salidas quedaron sin rotulo o con rotulos contradictorios tras la fusion de aristas paralelas
- una arista cosida que afirma algo falso: dice que de A se pasa directo a B cuando lo que hacia el paso borrado era esencial para que ese paso tenga sentido
- una etiqueta de arista que sobrevivio pero que describe una condicion que evaluaba un paso borrado
Lee ${SP}/aristas.tsv y ${SP}/prueba.reporte.txt. Cita ids concretos. No inventes problemas: si el flujo se lee bien, dilo.`,
  },
  {
    key: 'clasificacion',
    prompt: `${CONTEXTO}

TU LENTE: LA CLASIFICACION 11-SET / 2-OCT ES DEFENDIBLE ANTE EL CLIENTE.
Toma el hito asignado a cada paso (final de ${SP}/prueba.reporte.txt) y trata de REFUTARLO contra el backlog y la proforma. Busca:
- un paso del 11 de setiembre que dependa de un dato que solo existe el 2 de octubre (imposible de demostrar en la muestra)
- un paso del 2 de octubre que la proforma prometa explicitamente para la semana 5
- inconsistencias dentro de una misma cadena: A del 11 set alimenta a B del 11 set pero pasa por C del 2 oct
Presta atencion especial a: P03, P09, P17, P19, P20, P30, P32, P34, P35, P36, P41, P143, P144, P145 y a la banda B09 entera (inversionista, que quedo entera del 11 de setiembre y rompe la contiguidad del corte).
Cita historia y linea. Se especifico.`,
  },
  {
    key: 'visual',
    prompt: `${CONTEXTO}

TU LENTE: LEGIBILIDAD Y RIESGO DE MALENTENDIDO EN LA REUNION.
Lee el XML de ${NUEVO} (los estilos, no solo el texto). Evalua:
- si "hueco" puede leerse como "no incluido" o "por definir" en vez de "llega el 2 de octubre", y si las mitigaciones puestas (chip dentro del nodo, borde naranja de 3px, texto de leyenda, medidores) bastan
- si perder el color pastel por banda en los nodos (ahora solo el fondo de banda lo lleva) hace que se pierda la identidad de etapa
- si algun elemento nuevo (corchetes laterales, medidores, leyenda) puede solaparse, quedar fuera de pagina o competir con el contenido
- si el chip HTML (span con background inline) es seguro en drawio o conviene el fallback de texto plano
- si las 26 aristas punteadas de cruce de fecha saturan el dibujo
Se concreto sobre que cambiar.`,
  },
  {
    key: 'fidelidad',
    prompt: `${CONTEXTO}

TU LENTE: FIDELIDAD Y PERDIDA DE INFORMACION.
El diagrama nuevo es un documento que se le muestra al cliente. Verifica:
- que no se haya perdido informacion que el original si daba y que el lector necesite (la nota de alcance del original, avisos, notas al pie)
- que el pie/leyenda del nuevo diga la verdad sobre lo que se quito
- que ningun texto de paso quedo contradiciendo su propio chip de fecha (ej: un paso pintado "11 SET" cuyo texto dice "en la Entrega 1 ...", o un paso que menciona una tabla o pantalla de Entrega 2)
- que no haya quedado en el texto de algun paso una referencia a un paso borrado (Pxx que ya no existe)
Lee ${SP}/pasos.tsv para los textos completos. Reporta cada caso con el id.`,
  },
]

const auditorias = await parallel(
  AUDITORES.map((a) => () =>
    agent(a.prompt, { label: `audita:${a.key}`, phase: 'Auditar', schema: SCHEMA }).then((r) => ({ lente: a.key, ...r })),
  ),
)

const vivas = auditorias.filter(Boolean)
const todos = vivas.flatMap((a) => (a.hallazgos || []).map((h) => ({ ...h, lente: a.lente })))
log(`${todos.length} hallazgos brutos de ${vivas.length} auditores`)

phase('Refutar')

const REFUTA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['confirmados', 'descartados', 'resumen'],
  properties: {
    confirmados: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['gravedad', 'donde', 'problema', 'arreglo', 'decide_el_humano'],
        properties: {
          gravedad: { type: 'string', enum: ['bloqueante', 'alto', 'medio', 'menor'] },
          donde: { type: 'string' },
          problema: { type: 'string' },
          arreglo: { type: 'string' },
          decide_el_humano: { type: 'boolean', description: 'true si el arreglo cambia el contenido del proceso y no solo el dibujo' },
        },
      },
    },
    descartados: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['donde', 'porque_no_es_real'],
        properties: { donde: { type: 'string' }, porque_no_es_real: { type: 'string' } },
      },
    },
    resumen: { type: 'string' },
  },
}

const refutado = await agent(
  `${CONTEXTO}

Cuatro auditores reportaron estos hallazgos sobre ${NUEVO}:

${todos.map((h, i) => `${i + 1}. [${h.lente}/${h.gravedad}] ${h.donde}: ${h.problema}\n   evidencia: ${h.evidencia}\n   arreglo propuesto: ${h.arreglo}`).join('\n\n')}

TU TAREA: eres el escéptico. Ve al archivo y a las fuentes y trata de REFUTAR cada hallazgo. Por defecto asume que un hallazgo es falso hasta que lo confirmes tu mismo abriendo el archivo. Descarta los que no se sostienen, los duplicados y los que son cuestion de gusto.
Para los que sobrevivan, marca decide_el_humano=true cuando el arreglo cambie el CONTENIDO del proceso (partir un paso en dos, reescribir el texto de un paso, borrar un paso que el original no marcaba como Entrega 2, agregar una flecha que no existe en el original) y false cuando sea puro dibujo (color, posicion, leyenda, estilo).
Ordena los confirmados de mas grave a menos.`,
  { label: 'refutador', phase: 'Refutar', schema: REFUTA_SCHEMA, effort: 'high' },
)

return refutado
