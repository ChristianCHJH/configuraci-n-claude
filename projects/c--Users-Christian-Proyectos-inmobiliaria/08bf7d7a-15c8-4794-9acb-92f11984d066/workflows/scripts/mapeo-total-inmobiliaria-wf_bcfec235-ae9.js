export const meta = {
  name: 'mapeo-total-inmobiliaria',
  description: 'Mapea todas las epicas del proyecto inmobiliaria a modelo de datos y flujo maestro para dos diagramas drawio',
  phases: [
    { title: 'Mapear', detail: '10 lectores en paralelo, uno por grupo de epicas' },
    { title: 'Consolidar', detail: 'unifica entidades y pasos, deduplica, aplica estandares' },
    { title: 'Criticar', detail: '3 criticos: completitud, integridad relacional, alcance' },
    { title: 'Refinar', detail: 'aplica las criticas y cierra el modelo' },
  ],
}

const REPO = 'c:/Users/Christian/Proyectos/inmobiliaria'
const OUT = 'C:/Users/Christian/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria/08bf7d7a-15c8-4794-9acb-92f11984d066/scratchpad/mapeo'

const ESTANDAR = `
ESTANDARES OBLIGATORIOS DEL USUARIO (CLAUDE.md global), aplican a todo nombre que propongas:
- Tablas: espanol, snake_case, SINGULAR. Ej: cliente, lote, contrato_venta, pago_cuota.
- Columnas: espanol, snake_case. Ej: fecha_vencimiento, monto_total.
- PK siempre: id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY.
- TODA tabla lleva ademas el bloque de auditoria: usuario_creacion BIGINT NOT NULL, usuario_actualizacion BIGINT NULL, fecha_creacion TIMESTAMPTZ NOT NULL, fecha_actualizacion TIMESTAMPTZ NULL, estado BOOLEAN, eliminado BOOLEAN. NO lo repitas en cada entidad: se asume. Solo lista las columnas propias del negocio y las FK.
`

const CONTEXTO = `
Proyecto: sistema de gestion para INMOBILIARIA BL S.A.C. y LIMACO (venta de lotes en cuotas, Peru).
La documentacion viva esta en ${REPO}. Fuentes de verdad: 3-producto/PRD.md y 3-producto/historias/E00..E17.
E17-fuera-alcance.md contiene pedidos que el cliente hizo pero NO estan presupuestados: todo lo que salga de ahi
se marca alcance="fuera". Todo lo demas es alcance="dentro".
`

const SCHEMA_MAPEO = {
  type: 'object',
  additionalProperties: false,
  required: ['archivo', 'entidades_n', 'pasos_n', 'resumen'],
  properties: {
    archivo: { type: 'string', description: 'ruta absoluta del json que escribiste' },
    entidades_n: { type: 'number' },
    pasos_n: { type: 'number' },
    resumen: { type: 'string', description: 'maximo 8 lineas: que entidades clave y que hallazgos raros encontraste' },
  },
}

const GRUPOS = [
  { key: 'E00-E01', files: 'historias/E00-cimientos.md y historias/E01-administracion.md', foco: 'usuarios, perfiles y permisos, parametros configurables, bitacora de auditoria, empresas/razones sociales, conceptos de cobro, series de comprobante, comisiones por asesor (E01-09), organigrama asesor-lider' },
  { key: 'E02-E06', files: 'historias/E02-proyectos-lotes.md y historias/E06-plano.md', foco: 'proyecto, etapa, manzana, lote, precio, estados del lote y sus colores, plano, poligonos, leyenda, bloqueos de lote, colindancias, area, acciones y derechos' },
  { key: 'E03-E07', files: 'historias/E03-clientes.md y historias/E07-captura-documentos.md', foco: 'cliente natural y juridico, regimen inversionista y su bloque de lotes, documentos de identidad, tipos de documento configurables, captura desde camara, alerta de deuda' },
  { key: 'E04', files: 'historias/E04-ventas.md', foco: 'separacion, solicitud de separacion, prorroga, contrato de venta, modalidades (contado, credito contado, financiado), cronograma, cuota, resolucion, refinanciamiento, reasignacion de lote, constancia de efectivo, titulacion, contrato de cancelacion, asesor de la venta' },
  { key: 'E05', files: 'historias/E05-cobranzas.md', foco: 'pago, imputacion a cuotas, numero de operacion, tipo de cambio, mora, condonacion, estado de cuenta, cartera, cobranza' },
  { key: 'E08-E09', files: 'historias/E08-facturacion.md y historias/E09-expediente.md', foco: 'boleta, factura, nota de credito, serie y correlativo, razon social emisora, IGV, integracion con el facturador electronico, expediente digital del cliente y sus documentos' },
  { key: 'E10-E11', files: 'historias/E10-portal-cliente.md y historias/E11-avisos.md', foco: 'acceso del cliente al portal, aviso, plantilla de aviso, canal (whatsapp/sms), programacion y cadencia, historial de envios' },
  { key: 'E12-E15', files: 'historias/E12-android.md, historias/E13-carga-inicial.md, historias/E14-reportes.md y historias/E15-puesta-en-marcha.md', foco: 'app android/PWA, carga inicial desde excel, lote de carga y errores, reportes (ventas por asesor, comprobantes por razon social, cobranza, conversion), capacitacion y cierre' },
  { key: 'E16-E17', files: 'historias/E16-gestiones.md y historias/E17-fuera-alcance.md', foco: 'E16 son tramites, casi no genera tablas: revisalo igual. E17 SI importa mucho: cada pedido fuera de alcance necesita sus entidades hipoteticas y sus pasos, TODOS marcados alcance=fuera, con el id E17-xx' },
  { key: 'PRD', files: 'PRD.md', foco: 'reglas de negocio RN-*, requisitos funcionales RF-*, catalogo de estados del lote y del contrato, parametros del sistema, perfiles, montos y plazos. Cruza que no falte ninguna regla que implique una tabla o un paso' },
]

phase('Mapear')
const mapeos = await parallel(GRUPOS.map((g) => () => agent(
  `${CONTEXTO}\n${ESTANDAR}\n\n` +
  `Tu grupo es ${g.key}. Lee COMPLETOS estos archivos bajo ${REPO}/3-producto/: ${g.files}\n` +
  `Foco especifico: ${g.foco}\n\n` +
  `TAREA. Extrae con maximo detalle y SIN inventar nada que no este escrito:\n` +
  `(1) ENTIDADES de base de datos que este material exige. Para cada una: nombre de tabla (estandar de arriba), descripcion de una linea, ` +
  `columnas propias del negocio con tipo postgres, claves foraneas (columna -> tabla.id), enumeraciones o catalogos con sus valores reales si el documento los da, ` +
  `dominio funcional (uno de: administracion, catalogo, cliente, venta, cobranza, facturacion, documentos, comunicacion, reportes, fuera_alcance), ` +
  `alcance ("dentro" o "fuera"), y origen (los ids de historia o RN que la justifican).\n` +
  `(2) PASOS del proceso de negocio que este material define, en orden de ejecucion real. Para cada paso: id corto, nombre imperativo y breve, actor que lo ejecuta ` +
  `(cliente, asesor_lider, administracion, back_office, supervisor, gerencia, sistema, contadora, tercero), bloque funcional al que pertenece, ` +
  `si es una decision (con sus ramas y la condicion de cada rama), que tablas escribe y que tablas lee, alcance, y origen.\n` +
  `(3) REGLAS clave con numero (RN-xx) que condicionen un paso o una columna: montos, plazos, topes, quien autoriza, que es automatico y que es manual.\n\n` +
  `Precision total: los montos, plazos y porcentajes deben salir del documento, citados tal cual (S/ 300, 7 dias, 5 %, 3 meses...). Si algo esta abierto o pendiente, marcalo pendiente=true.\n\n` +
  `Escribe el resultado como JSON en ${OUT}/${g.key}.json con la forma ` +
  `{"grupo":"${g.key}","entidades":[...],"pasos":[...],"reglas":[...]}. Crea la carpeta si no existe. ` +
  `Devuelve solo el resumen segun el esquema.`,
  { label: `mapear:${g.key}`, phase: 'Mapear', schema: SCHEMA_MAPEO, effort: 'high' }
)))

const vivos = mapeos.filter(Boolean)
log(`Mapeo terminado: ${vivos.length}/${GRUPOS.length} grupos · ${vivos.reduce((a, m) => a + (m.entidades_n || 0), 0)} entidades brutas · ${vivos.reduce((a, m) => a + (m.pasos_n || 0), 0)} pasos brutos`)

phase('Consolidar')
const SCHEMA_CONS = {
  type: 'object',
  additionalProperties: false,
  required: ['entidades_n', 'pasos_n', 'bloques', 'resumen'],
  properties: {
    entidades_n: { type: 'number' },
    pasos_n: { type: 'number' },
    bloques: { type: 'array', items: { type: 'string' }, description: 'nombres de los bloques funcionales del flujo, en orden' },
    resumen: { type: 'string' },
  },
}
const cons = await agent(
  `${CONTEXTO}\n${ESTANDAR}\n\n` +
  `Lee TODOS los json de ${OUT}/ (uno por grupo de epicas). Consolida en un solo modelo coherente.\n\n` +
  `A) MODELO DE DATOS -> escribe ${OUT}/modelo-datos.json con {"entidades":[...],"relaciones":[...]}.\n` +
  `- Deduplica: si dos grupos describieron la misma tabla con nombres distintos, unificala y quedate con el nombre mas fiel al negocio y al estandar.\n` +
  `- Cada entidad: {tabla, descripcion, dominio, alcance, columnas:[{nombre,tipo,nota}], fks:[{columna,referencia_tabla}], catalogos_valores:[...], origen:[...]}.\n` +
  `- Cada relacion: {desde_tabla, hacia_tabla, cardinalidad:"1:N"|"N:1"|"1:1"|"N:M", etiqueta, alcance}. Resuelve las N:M con su tabla puente explicita.\n` +
  `- Verifica integridad: ninguna FK puede apuntar a una tabla que no existe en la lista; ninguna entidad huerfana sin relacion salvo catalogos y parametros.\n` +
  `- Las entidades que solo existen por un pedido de E17 van con alcance="fuera" y dominio="fuera_alcance", y su origen debe decir el E17-xx.\n\n` +
  `B) FLUJO MAESTRO -> escribe ${OUT}/flujo-maestro.json con {"bloques":[...],"pasos":[...]}.\n` +
  `- Es UN flujo de proceso de punta a punta, del primer contacto con el cliente hasta la escritura, incluyendo el carril del inversionista y los ramales de excepcion.\n` +
  `- Bloques funcionales en orden, cada uno con {id, nombre, color_sugerido, descripcion}. Piensa los bloques como secciones pintadas: cliente y captacion, separacion, cuota inicial, contrato y cronograma, cobranza mensual, comprobantes, mora e incumplimiento, cancelacion y titulacion, inversionista, documentos y expediente, avisos y portal, fuera de alcance.\n` +
  `- Cada paso: {id, bloque, orden, tipo:"inicio"|"accion"|"decision"|"fin"|"nota", nombre (breve, imperativo, sin relleno), actor, detalle (una linea con el dato duro: monto, plazo, regla), tablas_escribe:[...], tablas_lee:[...], siguiente:[{destino_id, condicion}], alcance, origen:[...]}.\n` +
  `- Los ids deben ser estables y unicos, tipo P01, P02... y para los de fuera de alcance X01, X02...\n` +
  `- CRITICO: cada tabla nombrada en tablas_escribe/tablas_lee TIENE que existir en modelo-datos.json con ese mismo nombre exacto. Ese es el puente entre los dos diagramas.\n` +
  `- Ningun paso puede quedar sin siguiente salvo los de tipo fin.\n\n` +
  `Devuelve solo el resumen segun el esquema.`,
  { label: 'consolidar', phase: 'Consolidar', schema: SCHEMA_CONS, effort: 'high' }
)
log(`Consolidado: ${cons ? cons.entidades_n : 0} entidades · ${cons ? cons.pasos_n : 0} pasos`)

phase('Criticar')
const SCHEMA_CRIT = {
  type: 'object',
  additionalProperties: false,
  required: ['hallazgos'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severidad', 'que_falta', 'donde', 'correccion'],
        properties: {
          severidad: { type: 'string', enum: ['bloqueante', 'importante', 'menor'] },
          que_falta: { type: 'string' },
          donde: { type: 'string' },
          correccion: { type: 'string' },
        },
      },
    },
  },
}
const LENTES = [
  { key: 'completitud', prompt: `Eres el critico de COMPLETITUD. Relee TODAS las historias en ${REPO}/3-producto/historias/ y ${REPO}/3-producto/PRD.md y comparalo contra ${OUT}/modelo-datos.json y ${OUT}/flujo-maestro.json. Busca lo que se perdio: reglas de negocio sin tabla ni paso, historias enteras no representadas, estados que nadie guarda, catalogos sin entidad, casos de excepcion olvidados (reasignacion de lote, cartera sin informacion, pagos en dolares, efectivo, condonacion, prorroga, refinanciamiento, resolucion, notas de credito, lotes de inversionista, sorteo, zona premium). Se implacable: lista TODO lo que falta.` },
  { key: 'integridad', prompt: `Eres el critico de INTEGRIDAD RELACIONAL Y ESTANDARES. Revisa ${OUT}/modelo-datos.json: FKs que apuntan a tablas inexistentes, N:M sin tabla puente, tablas en plural o en ingles, nombres que no son snake_case singular en espanol, columnas de auditoria repetidas donde no tocan, entidades duplicadas con otro nombre, catalogos que deberian ser tabla y estan como texto libre, y cardinalidades mal puestas. Verifica tambien que cada tabla citada en ${OUT}/flujo-maestro.json exista exactamente igual en el modelo.` },
  { key: 'alcance', prompt: `Eres el critico de ALCANCE. Lee ${REPO}/3-producto/historias/E17-fuera-alcance.md completo y ${REPO}/4-plan/segunda-etapa.md si existe. Verifica en ${OUT}/modelo-datos.json y ${OUT}/flujo-maestro.json que TODO lo de E17 este presente y marcado alcance="fuera" con su id E17-xx, y que nada que si esta contratado quedo marcado como fuera por error. Los 14 pedidos de E17 deben poder verse en los diagramas, pintados aparte.` },
]
const criticas = await parallel(LENTES.map(l => () => agent(
  `${CONTEXTO}\n${ESTANDAR}\n\n${l.prompt}\n\nDevuelve los hallazgos segun el esquema, ordenados por severidad.`,
  { label: `criticar:${l.key}`, phase: 'Criticar', schema: SCHEMA_CRIT, effort: 'high' }
)))
const todos = criticas.filter(Boolean).flatMap(c => c.hallazgos || [])
log(`Criticas: ${todos.length} hallazgos (${todos.filter(h => h.severidad === 'bloqueante').length} bloqueantes)`)

phase('Refinar')
const SCHEMA_FIN = {
  type: 'object',
  additionalProperties: false,
  required: ['entidades_n', 'pasos_n', 'entidades_fuera_n', 'pasos_fuera_n', 'dominios', 'resumen'],
  properties: {
    entidades_n: { type: 'number' },
    pasos_n: { type: 'number' },
    entidades_fuera_n: { type: 'number' },
    pasos_fuera_n: { type: 'number' },
    dominios: { type: 'array', items: { type: 'string' } },
    resumen: { type: 'string', description: 'que se corrigio y como quedo el modelo, maximo 12 lineas' },
  },
}
const fin = await agent(
  `${CONTEXTO}\n${ESTANDAR}\n\n` +
  `Corrige ${OUT}/modelo-datos.json y ${OUT}/flujo-maestro.json aplicando estos hallazgos de los criticos:\n\n` +
  JSON.stringify(todos, null, 1) +
  `\n\nReglas al corregir:\n` +
  `- Aplica TODOS los bloqueantes e importantes. Los menores, solo si no rompen nada.\n` +
  `- No borres nada que ya estaba bien. Solo agrega lo que falta y corrige lo que esta mal nombrado o mal relacionado.\n` +
  `- Reverifica al final, tabla por tabla, que toda FK apunte a una tabla existente y que toda tabla citada en el flujo exista en el modelo con el nombre exacto.\n` +
  `- Reverifica que todo paso no-final tenga siguiente y que ningun id se repita.\n` +
  `- Deja los dos archivos escritos, completos y validos como JSON.\n\n` +
  `Devuelve el resumen final segun el esquema.`,
  { label: 'refinar', phase: 'Refinar', schema: SCHEMA_FIN, effort: 'high' }
)

return {
  modelo: `${OUT}/modelo-datos.json`,
  flujo: `${OUT}/flujo-maestro.json`,
  final: fin,
  hallazgos_aplicados: todos.length,
}
