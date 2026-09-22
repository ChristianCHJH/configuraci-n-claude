export const meta = {
  name: 'copropiedad-en-contrato',
  description: 'Evaluar si la copropiedad debe vivir en el contrato (copropietario = cliente con rol) en vez de una tabla copropietario colgada del cliente',
  phases: [
    { title: 'Leer', detail: 'PRD, historias, recorrido y codigo real del repo' },
    { title: 'Disenar', detail: 'tres modelos alternativos con DDL concreto' },
    { title: 'Juzgar', detail: 'tres lentes por modelo: negocio, tecnica, entrega' },
    { title: 'Sintesis', detail: 'recomendacion final y cambios al diagrama' },
  ],
}

const REPO = 'c:/Users/Christian/Proyectos/inmobiliaria'

const REGLA_ORO = `REGLA INNEGOCIABLE: nunca inventes una regla de negocio. Si algo no está escrito en el corpus del proyecto (PRD, historias, actas de sesión, recorrido, código), NO lo asumas: repórtalo explícitamente como "pregunta abierta al cliente". Cita siempre archivo y línea o el código de la regla (RN-xx, RF-xx, E0x-xx, Pxx). Responde en español.`

const HALLAZGOS = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Resumen en 3 frases de lo que encontraste' },
    hechos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hecho: { type: 'string' },
          fuente: { type: 'string', description: 'ruta/archivo.md:linea o codigo RN-xx' },
          cita: { type: 'string', description: 'texto literal del corpus, si aplica' },
          implicacion: { type: 'string', description: 'que implica para modelar la copropiedad' }
        },
        required: ['hecho', 'fuente', 'implicacion']
      }
    },
    preguntas_abiertas: { type: 'array', items: { type: 'string' } }
  },
  required: ['resumen', 'hechos', 'preguntas_abiertas']
}

const DISENO = {
  type: 'object',
  properties: {
    nombre: { type: 'string' },
    ddl: { type: 'string', description: 'DDL PostgreSQL concreto de tablas nuevas o modificadas, con las columnas de auditoria del estandar (usuario_creacion NOT NULL, usuario_actualizacion NULL, fecha_creacion NOT NULL DEFAULT, fecha_actualizacion NULL, estado, eliminado) e id BIGINT GENERATED ALWAYS AS IDENTITY' },
    como_resuelve: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pregunta: { type: 'string' },
          respuesta: { type: 'string' }
        },
        required: ['pregunta', 'respuesta']
      },
      description: 'una entrada por cada una de las 8 preguntas de prueba'
    },
    que_se_rompe: { type: 'array', items: { type: 'string' } },
    costo: { type: 'string', description: 'tablas nuevas, migraciones, pantallas afectadas y estimacion en dias' }
  },
  required: ['nombre', 'ddl', 'como_resuelve', 'que_se_rompe', 'costo']
}

const VEREDICTO = {
  type: 'object',
  properties: {
    lente: { type: 'string' },
    veredicto: { type: 'string', enum: ['SOSTIENE', 'SOSTIENE_CON_AJUSTES', 'REFUTADO'] },
    razon: { type: 'string' },
    fallas: { type: 'array', items: { type: 'string' }, description: 'escenarios concretos donde el modelo falla' },
    ajustes: { type: 'array', items: { type: 'string' } }
  },
  required: ['lente', 'veredicto', 'razon', 'fallas', 'ajustes']
}

const LECTORES = [
  {
    label: 'lee:prd-reglas',
    prompt: `${REGLA_ORO}

Estás en el repositorio ${REPO} (Windows). Lee ${REPO}/3-producto/PRD.md.

Busca y extrae TODO lo que el negocio dijo sobre:
- copropiedad, copropietario, firmantes del contrato, propietario principal (RN-90, RF-C06)
- quién recibe la comunicación, el cronograma y el acceso al portal
- si una misma persona puede tener más de un contrato, o ser copropietaria en uno y titular sola en otro
- si el cliente se registra por proyecto, por razón social o es único en el sistema
- unicidad del documento de identidad, duplicados de cliente entre las dos razones sociales
- cualquier regla que hable de "cartera", "conteo de clientes", "cliente inversionista" y bloques

Usa Grep sobre el PRD con términos como: copropi, firman, principal, titular, portal, cartera, duplicad, documento.

Devuelve los hechos con su cita literal y qué implica cada uno para decidir si el copropietario debe ser una fila de la tabla cliente o una tabla aparte.`
  },
  {
    label: 'lee:historias',
    prompt: `${REGLA_ORO}

Estás en el repositorio ${REPO} (Windows). Lee las historias en ${REPO}/3-producto/historias/ — al menos E03-clientes.md, E04-ventas.md, E10-portal-cliente.md, y cualquier otra que mencione copropiedad, firmantes o separación (usa Glob y Grep sobre la carpeta completa).

Extrae:
- los criterios de aceptación literales que tocan copropiedad, firmantes y propietario principal
- cómo se arma el contrato (E04-03) y qué datos del copropietario se imprimen
- qué pasa en la separación (¿la separación tiene un solo cliente o varios?)
- qué dice E10 sobre quién entra al portal cuando hay copropietarios
- si alguna historia describe el flujo de "agregar copropietario": ¿en qué pantalla y en qué momento del ciclo ocurre?

Ese último punto es el central: el usuario sostiene que la copropiedad se declara al armar el contrato, no al crear la ficha del cliente. Busca evidencia a favor y en contra en las historias.`
  },
  {
    label: 'lee:codigo-y-bd',
    prompt: `${REGLA_ORO}

Estás en el repositorio ${REPO} (Windows). Explora el código real, no la documentación.

1. Encuentra las migraciones SQL o TypeORM existentes (busca carpetas migraciones/migrations, archivos .sql) y lista qué tablas existen HOY.
2. Revisa ${REPO}/apps/api/src/modulos/ (o la ruta equivalente) y lista los módulos existentes.
3. Busca 'cliente_id' en todo el código: qué tablas lo tienen, cuáles tienen FK real y cuáles son BIGINT huérfanos (en especial lote.cliente_id).
4. Busca si ya existe alguna tabla puente o de rol en el proyecto (nombres tipo *_detalle, *_participante, *_rol) y qué convención de nombres usa el proyecto para ellas.
5. Revisa si hay entidades TypeORM de contrato, separación o venta ya escritas.
6. Reporta el estándar de auditoría real que usan las tablas existentes.

Devuelve el estado técnico real: qué está construido, qué no, y qué costaría técnicamente meter una tabla puente entre contrato y cliente.`
  },
  {
    label: 'lee:recorrido-y-hitos',
    prompt: `${REGLA_ORO}

Estás en el repositorio ${REPO} (Windows). Lee ${REPO}/3-producto/diagramas/modelo-cliente-y-captacion.md completo y busca el mapa del recorrido / bandas / pasos (archivos que mencionen P18, P24, P102, banda B01, B02, B04) — usa Glob y Grep en 3-producto/ y 4-plan/.

Extrae:
- qué se entrega el 11 de setiembre (vista previa) y qué el 2 de octubre (Entrega 1)
- qué banda construye 'separacion' y cuál 'contrato_venta', y en qué fecha
- si el 11 de setiembre existe alguna pantalla de contrato o separación funcionando
- los pasos del recorrido donde aparece el copropietario: ¿en el alta del cliente o en el armado del contrato?
- el estado de la deuda técnica listada (lote.cliente_id sin FK, no existe módulo cliente)

El punto crítico a resolver: si la copropiedad se modela colgada del contrato, y contrato_venta es banda B04 (no construida el 11 set), ¿qué se puede mostrar en la vista previa del 11 de setiembre? Reporta las fechas exactas y qué depende de qué.`
  }
]

const PREGUNTAS_PRUEBA = [
  '1. Juan es copropietario del lote A junto a su esposa, y además compra solo el lote B. ¿Cómo se representa? ¿Aparece dos veces?',
  '2. RN-90 dice que al sistema entra un solo propietario principal, con quien se hace toda la comunicación y que es el único con acceso al portal (E10). ¿El modelo lo garantiza?',
  '3. La alerta de deuda busca por número de documento, no por cliente_id. Si el copropietario tiene deuda en otro proyecto, ¿la alerta lo detecta?',
  '4. lote.cliente_id apunta a un solo cliente. Con copropiedad, ¿a quién apunta?',
  '5. El 11 de setiembre hay vista previa de clientes pero contrato_venta es banda B04 (no construida). ¿Dónde se registra la copropiedad ese día?',
  '6. La separación (banda B02) ocurre antes del contrato. ¿La copropiedad se declara ya en la separación o solo en el contrato?',
  '7. La lista /clientes y el conteo de cartera: ¿el copropietario aparece ahí? ¿es deseable o es ruido?',
  '8. El contrato debe imprimir a todos los firmantes con nombre, DNI, dirección, estado civil y celular (RN-90). ¿De dónde salen esos datos en este modelo?'
]

const OPCIONES = [
  {
    clave: 'A-statu-quo',
    titulo: 'Tabla copropietario colgada de cliente (modelo actual del diagrama)',
    detalle: 'copropietario(id, cliente_id FK, nombre, tipo_documento_id, numero_documento, direccion, estado_civil, celular). El copropietario NO es un cliente: es un dato satélite de la ficha del titular, existente solo para imprimirse en el contrato.'
  },
  {
    clave: 'B-participantes-contrato',
    titulo: 'Propuesta del usuario: el copropietario ES un cliente y la copropiedad se declara en el contrato',
    detalle: 'Se elimina la tabla copropietario. Toda persona es una fila de cliente. Una tabla puente cuelga del contrato de venta y lista a sus participantes con un rol (TITULAR / COPROPIETARIO), apuntando a cliente_id. La copropiedad es una propiedad del contrato, no de la persona: la misma persona puede ser copropietaria en un contrato y titular única en otro. Diseña el nombre de tabla, las columnas, las restricciones (un solo TITULAR por contrato) y los índices.'
  },
  {
    clave: 'C-participantes-operacion',
    titulo: 'Variante: los participantes cuelgan de la operación de venta desde la separación, no del contrato',
    detalle: 'Igual que B (copropietario = cliente), pero el conjunto de participantes se declara antes: en la separación (banda B02), y el contrato lo hereda. Evalúa también si conviene un "grupo de compra" reutilizable entre separación y contrato, o si eso es sobre-ingeniería. Considera además cómo se registra la copropiedad el 11 de setiembre si ni separación ni contrato existen todavía.'
  }
]

const LENTES = [
  {
    clave: 'negocio',
    prompt: 'LENTE NEGOCIO. Evalúa si el modelo cumple literalmente RN-90, RF-C06, E03-01, E04-03 y E10 tal como están escritos en el corpus. Sé adversarial: intenta REFUTAR el modelo encontrando un requisito escrito que no cumple, o una regla que obliga a inventar algo que el cliente nunca dijo. Si el modelo obliga a asumir una regla que no está en el corpus, eso es una refutación. Presta atención especial a: "al sistema entra solo el propietario principal" — ¿un copropietario que es fila de cliente viola esa frase o no? Argumenta ambas lecturas y decide.'
  },
  {
    clave: 'tecnica',
    prompt: 'LENTE TÉCNICA. Evalúa integridad referencial, unicidad, consultas y rendimiento. Sé adversarial: busca la consulta que se vuelve imposible o cara, la FK que queda ambigua, el índice único que ya no se puede poner, el caso de duplicado de persona. Cubre en concreto: numero_documento único por tipo, lote.cliente_id, la búsqueda de deuda por documento (alerta_deuda_cliente.documento_consultado), la ficha del cliente en menos de 3 segundos (criterio A6), y la impresión del contrato con todos los firmantes. Verifica que el DDL propuesto cumpla el estándar del proyecto (id IDENTITY, auditoría con usuario_actualizacion y fecha_actualizacion NULABLES, soft delete).'
  },
  {
    clave: 'entrega',
    prompt: 'LENTE ENTREGA. Evalúa si el modelo se puede construir a tiempo. Sé adversarial: busca la dependencia que rompe el cronograma. Datos duros: la vista previa es el 11 de setiembre de 2026 y la Entrega 1 el 2 de octubre de 2026; contrato_venta es banda B04 y separacion es banda B02, ninguna construida en la banda B01. Hoy es 3 de setiembre de 2026. Pregunta clave: si la copropiedad vive en el contrato, ¿qué se le muestra al cliente el 11 de setiembre en la pantalla de cliente? ¿Queda un hueco visible en la demo? ¿Existe un camino de migración por etapas que empiece simple y no obligue a rehacer? Cuantifica el costo en días.'
  }
]

phase('Leer')
log('Leyendo el corpus del proyecto: PRD, historias, código y recorrido')
const lecturas = await parallel(LECTORES.map(l => () => agent(l.prompt, { label: l.label, phase: 'Leer', schema: HALLAZGOS })))
const contexto = JSON.stringify(lecturas.filter(Boolean), null, 1)

log('Contexto reunido. Diseñando y juzgando los tres modelos en paralelo')

const evaluadas = await pipeline(
  OPCIONES,
  (op) => agent(`${REGLA_ORO}

Estás en el repositorio ${REPO}. Eres arquitecto de datos. Diseña en detalle esta opción de modelado de la COPROPIEDAD inmobiliaria:

## Opción ${op.clave}: ${op.titulo}
${op.detalle}

## Contexto real del proyecto (extraído del corpus por agentes lectores)
${contexto}

## Estándar obligatorio de PostgreSQL de este usuario
- id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY (nunca SERIAL)
- Toda tabla lleva: usuario_creacion BIGINT NOT NULL, usuario_actualizacion BIGINT (nulable), fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TIMESTAMPTZ (nulable), estado BOOLEAN NOT NULL DEFAULT true, eliminado BOOLEAN NOT NULL DEFAULT false
- Nombres en español, snake_case, singular
- Sin comentarios en el código; el DDL sí puede llevar los del template

## Tu entrega
1. El DDL completo de las tablas que se crean o se modifican en esta opción.
2. Una respuesta concreta a CADA una de estas 8 preguntas de prueba:
${PREGUNTAS_PRUEBA.join('\n')}
3. Qué se rompe o se complica con esta opción.
4. El costo real: tablas, migraciones, pantallas afectadas, días de trabajo.

Diseña esta opción de la mejor forma posible — argumenta a su favor, no la sabotees. Otro agente la va a atacar después.`, { label: `disenar:${op.clave}`, phase: 'Disenar', schema: DISENO }),
  (diseno, op) => parallel(LENTES.map(lente => () => agent(`${REGLA_ORO}

Estás en el repositorio ${REPO}. Eres un evaluador ADVERSARIAL. Tu trabajo es intentar refutar este diseño, no aprobarlo. Si tras el intento honesto sigue en pie, dilo.

${lente.prompt}

## Modelo bajo evaluación — opción ${op.clave}: ${op.titulo}
${op.detalle}

## Diseño propuesto
${JSON.stringify(diseno, null, 1)}

## Contexto real del proyecto
${contexto}

Puedes leer archivos del repositorio para verificar cualquier afirmación del diseño; no confíes en ella sin comprobarla. Si el diseño cita una regla o una fecha, verifica que exista tal como la cita.

Devuelve tu veredicto: REFUTADO si encuentras una falla que invalida el modelo, SOSTIENE_CON_AJUSTES si sobrevive pero necesita cambios concretos, SOSTIENE si aguanta el ataque.`, { label: `juzgar:${op.clave}:${lente.clave}`, phase: 'Juzgar', schema: VEREDICTO })))
    .then(vs => ({ opcion: op, diseno: diseno, veredictos: vs.filter(Boolean) }))
)

const utiles = evaluadas.filter(Boolean)

phase('Sintesis')
const sintesis = await agent(`${REGLA_ORO}

Estás en el repositorio ${REPO}. Eres el arquitecto que decide. Tres modelos de copropiedad fueron diseñados y atacados por tres evaluadores adversariales cada uno.

## El planteamiento del usuario (Christian, dueño del producto)
Christian revisó el diagrama actual y objetó la tabla \`copropietario\`. Su argumento textual, reconstruido: el copropietario no deja de ser un cliente; la relación de copropiedad no es con el cliente sino con el CONTRATO, porque después ese mismo copropietario puede tener otro contrato donde él compra solo. Propone que al armar el expediente o la parte de ventas se diga "en este contrato, cliente principal = cliente id 1, copropietario = cliente id 2". Sostiene que la tabla \`copropietario\` no tiene sentido.

## Resultados completos del panel
${JSON.stringify(utiles, null, 1)}

## Contexto real del proyecto
${contexto}

## Tu entrega — en español, honesta y sin adornos
1. **Veredicto sobre la propuesta de Christian**: ¿tiene razón? Sí, no, o parcialmente — y por qué, con la evidencia del corpus.
2. **El modelo recomendado**, con su DDL final listo para pegar (estándar PostgreSQL del proyecto: IDENTITY, auditoría con campos de actualización nulables, español snake_case singular).
3. **La respuesta a la pregunta de la fecha**: qué se hace el 11 de setiembre de 2026 si contrato_venta no existe hasta la banda B04. Da el camino por etapas concreto.
4. **Qué cambia exactamente** en 3-producto/diagramas/modelo-cliente-y-captacion.md: qué secciones se reescriben, cuáles se borran, qué tabla nueva se documenta, y si el conteo de "15 tablas" cambia.
5. **Preguntas abiertas al cliente**: lo que NO se puede decidir sin preguntarle al negocio. Sé estricto: si el corpus no lo dice, va aquí y no se inventa.
6. **Los contraargumentos honestos**: qué pierde el proyecto si adopta la propuesta de Christian.

Escribe la respuesta como texto en markdown, completa y accionable.`, { label: 'sintesis', phase: 'Sintesis' })

return { sintesis: sintesis, evaluadas: utiles }
