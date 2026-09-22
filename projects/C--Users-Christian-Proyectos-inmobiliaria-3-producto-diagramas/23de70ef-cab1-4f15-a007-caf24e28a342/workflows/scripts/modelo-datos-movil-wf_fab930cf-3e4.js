export const meta = {
  name: 'modelo-datos-movil',
  description: 'Inventariar el esquema real y determinar que tablas y columnas faltan para autenticacion movil y captura de documentos',
  phases: [
    { title: 'Inventario', detail: 'leer el esquema real y los requisitos en paralelo' },
    { title: 'Diseno', detail: 'proponer tablas y columnas faltantes' },
    { title: 'Verificar', detail: 'refutar cada propuesta: ya existe, no hace falta, o es regla inventada' },
  ],
}

const API = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema/apps/api/src'
const DOCS = 'c:/Users/Christian/Proyectos/inmobiliaria'

const DDL_SCHEMA = {
  type: 'object',
  properties: {
    tablas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          proposito: { type: 'string' },
          columnas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                tipo: { type: 'string' },
                nulable: { type: 'boolean' },
                pk: { type: 'boolean' },
                fk_a: { type: 'string' },
                nota: { type: 'string' },
              },
              required: ['nombre', 'tipo'],
            },
          },
          indices_y_unicos: { type: 'array', items: { type: 'string' } },
          migracion_origen: { type: 'string' },
        },
        required: ['nombre', 'columnas'],
      },
    },
    observaciones: { type: 'string' },
  },
  required: ['tablas'],
}

const REQ_SCHEMA = {
  type: 'object',
  properties: {
    requisitos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          texto: { type: 'string' },
          fuente: { type: 'string' },
          implicacion_de_datos: { type: 'string' },
        },
        required: ['id', 'texto', 'fuente'],
      },
    },
    citas_literales: { type: 'array', items: { type: 'string' } },
  },
  required: ['requisitos'],
}

const FORMATO_SCHEMA = {
  type: 'object',
  properties: {
    especificacion: { type: 'string' },
    ejemplo_entidad_json: { type: 'string' },
    ejemplo_columna_json: { type: 'string' },
    ejemplo_relacion_json: { type: 'string' },
    ejemplo_vista_entidad_json: { type: 'string' },
    ejemplo_vista_relacion_json: { type: 'string' },
    ejemplo_texto_json: { type: 'string' },
    reglas_criticas: { type: 'array', items: { type: 'string' } },
  },
  required: ['especificacion', 'ejemplo_entidad_json', 'ejemplo_columna_json', 'ejemplo_relacion_json', 'ejemplo_vista_entidad_json', 'ejemplo_vista_relacion_json'],
}

phase('Inventario')

const [authDDL, clienteDDL, requisitos, formato, convenciones] = await parallel([
  () => agent(
    `Lee el codigo real en ${API}. Objetivo: inventariar EXACTAMENTE el esquema de PostgreSQL de AUTENTICACION Y AUTORIZACION tal como esta construido hoy.

Lee las migraciones en ${API}/migraciones/ (especialmente 1786838400000-AutenticacionYAutorizacion.ts, 1786924800000-SesionesConsultables.ts, 1787011200000-RecuperacionDeContrasena.ts, 1787270400000-EndurecerAutenticacion.ts, 1787529600000-UsuarioDniYTelefono.ts, 1787875200000-UnCambioDeRolCierraLasSesiones.ts, 1723600000000-EsquemaInicial.ts) y las entidades TypeORM en ${API}/modulos/usuario/, ${API}/modulos/autenticacion/, ${API}/modulos/autorizacion/, ${API}/modulos/bitacora/.

Para CADA tabla (usuario, token_refresco, log_sesion, intento_acceso, token_recuperacion, rol, permiso, rol_permiso, usuario_rol, usuario_permiso, bitacora y cualquier otra que encuentres en ese ambito) reporta el nombre exacto, cada columna con su tipo SQL exacto, si es nulable, si es PK, a que tabla apunta si es FK, indices y unicos.

Presta atencion especial a: como se emite y revoca el token de refresco, si hay algun campo que identifique el dispositivo o el user-agent, si log_sesion guarda IP o dispositivo, y si existe cualquier cosa parecida a un token de notificaciones push. NO inventes: si algo no existe, dilo explicitamente en observaciones.`,
    { label: 'ddl:autenticacion', phase: 'Inventario', schema: DDL_SCHEMA }
  ),

  () => agent(
    `Lee el codigo real en ${API}. Objetivo: inventariar EXACTAMENTE el esquema de PostgreSQL de CLIENTE, DOCUMENTOS y ARCHIVOS tal como esta construido hoy.

Lee la migracion ${API}/migraciones/1788048000000-ClienteYExpediente.ts y las entidades en ${API}/modulos/cliente/ (cliente.entity.ts, documento-cliente.entity.ts, tipo-documento.entity.ts) y ${API}/modulos/archivo/ (archivo.entity.ts). Revisa tambien el modulo ${API}/modulos/archivo/ completo y cualquier caso de uso de subida de archivos (busca 'subir', 'almacen', 'AlmacenDe').

Para CADA tabla reporta nombre exacto, cada columna con tipo SQL exacto, nulabilidad, PK, FK, indices y unicos.

Presta atencion especial a: que guarda hoy documento_cliente (cara del documento, recorte aplicado, metricas de calidad de la foto, intentos, geolocalizacion, quien capturo, con que dispositivo), que guarda archivo (ruta, tipo mime, tamano, hash), y si existe algun campo de validacion de calidad de imagen. NO inventes: si algo no existe, dilo explicitamente en observaciones.`,
    { label: 'ddl:cliente-documentos', phase: 'Inventario', schema: DDL_SCHEMA }
  ),

  () => agent(
    `Lee la documentacion de producto en ${DOCS}. Objetivo: extraer TODOS los requisitos que tienen consecuencia sobre el modelo de datos para dos cosas y solo dos: (1) que un asesor INICIE SESION desde la aplicacion movil Android, y (2) que ese asesor CREE UN CLIENTE Y CAPTURE LA FOTO DE SUS DOCUMENTOS desde el movil.

Archivos a leer: ${DOCS}/3-producto/PRD.md (busca RN-149, RN-161, RN-162, RF-X01, RF-X05, RF-X06, y toda la seccion 3.12), ${DOCS}/3-producto/historias/E03-clientes.md, ${DOCS}/3-producto/historias/E07-captura-documentos.md, ${DOCS}/3-producto/historias/E12-android.md, ${DOCS}/3-producto/historias/E00-cimientos.md (E00-05, E00-07, E00-08), ${DOCS}/3-producto/historias/E11-avisos.md (notificaciones push), ${DOCS}/5-arquitectura/nota-validacion-de-la-foto-del-documento.md, ${DOCS}/5-arquitectura/ADR-001-monolito-y-repositorios.md.

Para cada requisito da su identificador (RN-xx, RF-xx, E07-02, etc), el texto que lo respalda y que implica en terminos de datos que haya que guardar.

REGLA DURA: no inventes requisitos ni umbrales. Si algo parece necesario pero NINGUN documento lo pide, NO lo listes como requisito; menciona la ausencia por separado. Incluye citas literales de los documentos.`,
    { label: 'requisitos:movil', phase: 'Inventario', schema: REQ_SCHEMA }
  ),

  () => agent(
    `Objetivo: producir la especificacion EXACTA del formato de archivo .mdj de StarUML para diagramas entidad-relacion, de modo que otro agente pueda GENERAR un .mdj valido desde cero que StarUML abra sin errores.

Analiza el archivo real: c:/Users/Christian/Proyectos/inmobiliaria/3-producto/diagramas/modelo-cliente-y-captacion.mdj  (es JSON; usa python con json para inspeccionarlo, NO lo leas entero con Read porque son 155KB).

Extrae y reporta:
1. La jerarquia completa: Project -> ownedElements -> ERDDataModel -> ownedElements (ERDDiagram + ERDEntity...).
2. El JSON COMPLETO Y LITERAL de UNA ERDEntity con todas sus claves (incluidas columns y su _parent), de UNA ERDColumn (con tipo, primaryKey, foreignKey, nullable, referenceTo), y de UNA ERDRelationship (con end1/end2, cardinality, identifying).
3. El JSON COMPLETO Y LITERAL de UNA ERDEntityView (con sus subViews: nameCompartment, columnCompartment y los ERDColumnView), de UNA ERDRelationshipView (con tail/head, points, lineStyle) y de UN UMLTextView.
4. Las reglas criticas para que el archivo abra bien: como se forman los _id, como funcionan las referencias {"\$ref": "..."}, que campos son obligatorios, como se posicionan las vistas (left, top, width, height), como se enlaza cada vista con su modelo (campo model), y si las relaciones se guardan como ownedElements de la entidad origen.

Copia JSON literal real del archivo, no lo parafrasees. Es la parte mas importante de tu respuesta.`,
    { label: 'formato:mdj', phase: 'Inventario', schema: FORMATO_SCHEMA }
  ),

  () => agent(
    `Lee c:/Users/Christian/Proyectos/inmobiliaria-sistema/CLAUDE.md y c:/Users/Christian/Proyectos/inmobiliaria-sistema/docs/adr/ (todos los ADR, especialmente ADR-003-migraciones-y-datos.md y cualquiera sobre autenticacion o seguridad).

Objetivo: reportar las CONVENCIONES OBLIGATORIAS del proyecto para crear tablas nuevas en PostgreSQL: nombres (idioma, singular/plural, snake_case), tipo de la PK, columnas de auditoria obligatorias y su nulabilidad exacta, soft delete, uso de timestamptz, convenciones de indices y de nombres de FK, y como se escriben las migraciones.

Reporta tambien cualquier decision ya tomada sobre sesiones, tokens, dispositivos, notificaciones push o multiempresa que condicione tablas nuevas. Cita textualmente las reglas.`,
    { label: 'convenciones', phase: 'Inventario', schema: { type: 'object', properties: { convenciones: { type: 'string' }, plantilla_tabla: { type: 'string' }, decisiones_relevantes: { type: 'array', items: { type: 'string' } } }, required: ['convenciones'] } }
  ),
])

log(`Inventario listo. Auth: ${authDDL?.tablas?.length ?? 0} tablas. Cliente/archivos: ${clienteDDL?.tablas?.length ?? 0} tablas. Requisitos: ${requisitos?.requisitos?.length ?? 0}.`)

const ctx = `
=== ESQUEMA ACTUAL — AUTENTICACION Y AUTORIZACION ===
${JSON.stringify(authDDL, null, 1)}

=== ESQUEMA ACTUAL — CLIENTE, DOCUMENTOS Y ARCHIVOS ===
${JSON.stringify(clienteDDL, null, 1)}

=== REQUISITOS DE PRODUCTO ===
${JSON.stringify(requisitos, null, 1)}

=== CONVENCIONES OBLIGATORIAS DEL PROYECTO ===
${JSON.stringify(convenciones, null, 1)}
`

phase('Diseno')

const PROPUESTA_SCHEMA = {
  type: 'object',
  properties: {
    tablas_nuevas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          bloque: { type: 'string', description: 'autenticacion-movil | captura-documento | notificaciones' },
          por_que_hace_falta: { type: 'string' },
          requisito_que_la_respalda: { type: 'string' },
          columnas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                tipo: { type: 'string' },
                nulable: { type: 'boolean' },
                pk: { type: 'boolean' },
                fk_a: { type: 'string' },
                para_que: { type: 'string' },
              },
              required: ['nombre', 'tipo', 'para_que'],
            },
          },
          indices_y_unicos: { type: 'array', items: { type: 'string' } },
          relaciones: { type: 'array', items: { type: 'string' } },
        },
        required: ['nombre', 'bloque', 'por_que_hace_falta', 'columnas'],
      },
    },
    columnas_nuevas_en_tablas_existentes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tabla: { type: 'string' },
          columna: { type: 'string' },
          tipo: { type: 'string' },
          nulable: { type: 'boolean' },
          fk_a: { type: 'string' },
          por_que_hace_falta: { type: 'string' },
          requisito_que_la_respalda: { type: 'string' },
        },
        required: ['tabla', 'columna', 'tipo', 'por_que_hace_falta'],
      },
    },
    lo_que_ya_existe_y_no_hay_que_tocar: { type: 'array', items: { type: 'string' } },
    decisiones_que_debe_tomar_el_cliente: { type: 'array', items: { type: 'string' } },
  },
  required: ['tablas_nuevas', 'columnas_nuevas_en_tablas_existentes', 'lo_que_ya_existe_y_no_hay_que_tocar'],
}

const ANGULOS = [
  { key: 'minimo', prompt: 'Diseña el conjunto MINIMO SUFICIENTE. Tu sesgo: cada tabla nueva es un costo; si una columna en una tabla existente resuelve el caso, esa es la respuesta. Justifica por que cada tabla nueva no podia ser una columna.' },
  { key: 'operativo', prompt: 'Diseña pensando en la operacion real y el soporte: administracion tiene que poder responder "quien capturo esta foto, desde que telefono, en que intento y donde". Prioriza trazabilidad y auditoria sin caer en inventar reglas de negocio.' },
  { key: 'seguridad', prompt: 'Diseña desde la seguridad y el ciclo de vida de la sesion movil: un telefono robado, un asesor dado de baja, un token de refresco que hay que revocar por dispositivo, un cambio de rol que cierra sesiones. Prioriza el control del dispositivo y la revocacion.' },
]

const propuestas = await parallel(ANGULOS.map(a => () => agent(
  `Eres arquitecto de datos del sistema inmobiliario. Tienes el esquema PostgreSQL REAL ya construido y los requisitos de producto.

${ctx}

TAREA: determinar que tablas NUEVAS y que columnas NUEVAS en tablas existentes hacen falta para cubrir, y solo esto:
  (1) que un asesor inicie sesion desde la app Android nativa (Kotlin + Jetpack Compose),
  (2) que ese asesor cree un cliente y capture la foto de sus documentos desde el movil, con la validacion de calidad corriendo en el telefono.

ANGULO QUE TE TOCA: ${a.prompt}

REGLAS DURAS, no negociables:
- Toda tabla o columna que propongas tiene que estar respaldada por un requisito real de la documentacion o por una necesidad tecnica evidente del flujo. Si no hay respaldo, NO la propongas: mandala a "decisiones_que_debe_tomar_el_cliente".
- PROHIBIDO inventar reglas de negocio: nada de umbrales, plazos, limites de intentos, politicas de caducidad o cantidades que no aparezcan en la documentacion.
- Respeta las convenciones del proyecto al pie de la letra: nombres en español snake_case singular, PK BIGINT GENERATED ALWAYS AS IDENTITY, y las columnas de auditoria obligatorias (usuario_creacion NOT NULL, usuario_actualizacion NULL, fecha_creacion NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion NULL, estado BOOLEAN NOT NULL DEFAULT true, eliminado BOOLEAN NOT NULL DEFAULT false) con timestamptz.
- Antes de proponer algo, VERIFICA que no exista ya en el esquema actual. Lista en "lo_que_ya_existe_y_no_hay_que_tocar" lo que la app movil va a reutilizar tal cual.
- Piensa especificamente en: registro del equipo movil (que telefono es, de quien, cuando se vio por ultima vez), vinculo entre el token de refresco y ese equipo, token de notificaciones push si la documentacion lo pide, y todo lo que la captura de la foto tenga que dejar registrado.`,
  { label: `diseno:${a.key}`, phase: 'Diseno', schema: PROPUESTA_SCHEMA, effort: 'high' }
)))

const vivas = propuestas.filter(Boolean)
log(`${vivas.length} propuestas de diseño. Consolidando y verificando.`)

phase('Verificar')

const CONSOLIDADO_SCHEMA = PROPUESTA_SCHEMA

const consolidado = await agent(
  `Eres el arquitecto jefe. Tres arquitectos diseñaron en paralelo, cada uno desde un angulo distinto (minimo, operativo, seguridad), el conjunto de tablas y columnas que faltan para la autenticacion movil y la captura de documentos.

${ctx}

=== PROPUESTA A (minimo suficiente) ===
${JSON.stringify(vivas[0] ?? {}, null, 1)}

=== PROPUESTA B (trazabilidad operativa) ===
${JSON.stringify(vivas[1] ?? {}, null, 1)}

=== PROPUESTA C (seguridad y ciclo de vida de sesion) ===
${JSON.stringify(vivas[2] ?? {}, null, 1)}

TAREA: consolidar una sola propuesta. Reglas:
- Fusiona lo que las tres coinciden. Donde discrepen, quedate con lo que este respaldado por un requisito documentado; si el respaldo es debil, mandalo a "decisiones_que_debe_tomar_el_cliente".
- Elimina duplicados y unifica nombres de tabla y de columna.
- Cada tabla queda asignada a un bloque: "autenticacion-movil", "captura-documento" o "notificaciones".
- Verifica una por una que ninguna tabla ni columna propuesta ya exista en el esquema actual.
- Asegura que TODA tabla nueva lleve las seis columnas de auditoria obligatorias, salvo que haya una razon explicita para no llevarlas (y entonces dila).
- El resultado tiene que ser suficiente para dibujar un diagrama entidad-relacion completo: cada FK declarada con su tabla destino.`,
  { label: 'consolidar', phase: 'Verificar', schema: CONSOLIDADO_SCHEMA, effort: 'high' }
)

const VEREDICTO_SCHEMA = {
  type: 'object',
  properties: {
    veredictos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          elemento: { type: 'string' },
          tipo: { type: 'string', description: 'tabla | columna' },
          refutado: { type: 'boolean' },
          motivo: { type: 'string', description: 'ya existe | no hace falta para el alcance | regla de negocio inventada | choca con las convenciones | sobrevive' },
          detalle: { type: 'string' },
        },
        required: ['elemento', 'tipo', 'refutado', 'motivo'],
      },
    },
    faltantes_detectados: { type: 'array', items: { type: 'string' }, description: 'cosas necesarias que la propuesta NO cubre' },
  },
  required: ['veredictos'],
}

const LENTES = [
  { key: 'ya-existe', prompt: 'Tu unico trabajo es demostrar que el elemento YA EXISTE en el esquema actual o que una tabla/columna existente ya lo cubre. Lee el codigo real en el repositorio si hace falta para comprobarlo. Refuta todo lo que ya este resuelto.' },
  { key: 'regla-inventada', prompt: 'Tu unico trabajo es cazar REGLAS DE NEGOCIO INVENTADAS: umbrales, plazos, maximos de intentos, politicas de caducidad, estados o clasificaciones que NINGUN documento del cliente respalda. Busca el respaldo en la documentacion; si no lo encuentras, refuta. Un umbral sin respaldo del cliente no se rebaja: se borra.' },
  { key: 'alcance', prompt: 'Tu unico trabajo es refutar lo que se sale del alcance declarado: la app movil solo hace iniciar sesion y crear clientes con captura de documentos. Todo lo que sirva a ventas, cobranzas, plano, reportes, portal del cliente o funciones futuras, refutalo por fuera de alcance.' },
  { key: 'convenciones', prompt: 'Tu unico trabajo es refutar lo que choca con las convenciones obligatorias del proyecto: nombres en español snake_case singular, PK BIGINT IDENTITY (nunca SERIAL), las seis columnas de auditoria con la nulabilidad exacta, timestamptz, soft delete. Tambien refuta tipos de dato mal elegidos y FK mal apuntadas.' },
]

const items = [
  ...(consolidado?.tablas_nuevas ?? []).map(t => ({ tipo: 'tabla', nombre: t.nombre, cuerpo: JSON.stringify(t, null, 1) })),
  ...(consolidado?.columnas_nuevas_en_tablas_existentes ?? []).map(c => ({ tipo: 'columna', nombre: `${c.tabla}.${c.columna}`, cuerpo: JSON.stringify(c, null, 1) })),
]

log(`Verificando ${items.length} elementos con 4 lentes adversariales cada uno.`)

const verificado = await pipeline(
  items,
  item => parallel(LENTES.map(l => () => agent(
    `Eres un revisor adversarial. Por defecto REFUTA si tienes dudas.

${ctx}

ELEMENTO PROPUESTO (${item.tipo}):
${item.cuerpo}

LENTE QUE TE TOCA: ${l.prompt}

Puedes leer el codigo en c:/Users/Christian/Proyectos/inmobiliaria-sistema/apps/api/src y la documentacion en c:/Users/Christian/Proyectos/inmobiliaria para comprobar tus afirmaciones. Da un solo veredicto, sobre este elemento, desde tu lente. Si sobrevive tu lente, pon refutado=false y motivo "sobrevive".`,
    { label: `verificar:${l.key}:${item.nombre}`, phase: 'Verificar', schema: VEREDICTO_SCHEMA }
  ))).then(vs => {
    const vivos = vs.filter(Boolean).flatMap(v => v.veredictos ?? [])
    const refutaciones = vivos.filter(v => v.refutado)
    return {
      elemento: item.nombre,
      tipo: item.tipo,
      cuerpo: item.cuerpo,
      refutaciones: refutaciones.map(r => ({ motivo: r.motivo, detalle: r.detalle })),
      sobrevive: refutaciones.length === 0,
      faltantes: vs.filter(Boolean).flatMap(v => v.faltantes_detectados ?? []),
    }
  })
)

const vivos = verificado.filter(Boolean)
const sobreviven = vivos.filter(v => v.sobrevive)
const caidos = vivos.filter(v => !v.sobrevive)

const critico = await agent(
  `Eres el critico de completitud. Revisa si falta algo para que la app Android pueda (1) autenticar a un asesor y (2) crear un cliente capturando la foto de sus documentos.

${ctx}

=== PROPUESTA CONSOLIDADA ===
${JSON.stringify(consolidado, null, 1)}

=== ELEMENTOS REFUTADOS POR LOS REVISORES ===
${JSON.stringify(caidos.map(c => ({ elemento: c.elemento, refutaciones: c.refutaciones })), null, 1)}

=== FALTANTES QUE LOS REVISORES MENCIONARON ===
${JSON.stringify([...new Set(vivos.flatMap(v => v.faltantes))], null, 1)}

Pregunta que tienes que responder: ¿que falta? Recorre el flujo completo de punta a punta —el asesor abre la app, se autentica, el servidor le responde, el asesor crea un cliente, apunta la camara, toma la foto del documento, el telefono la valida, la foto sube, administracion la revisa— y di en que paso el modelo de datos se queda corto.

No inventes reglas de negocio. Si algo hace falta pero nadie lo pidio, dilo como pregunta para el cliente, no como tabla.`,
  { label: 'critico-completitud', phase: 'Verificar', schema: { type: 'object', properties: { huecos: { type: 'array', items: { type: 'object', properties: { paso: { type: 'string' }, que_falta: { type: 'string' }, propuesta: { type: 'string' }, respaldo: { type: 'string' } }, required: ['paso', 'que_falta'] } }, preguntas_para_el_cliente: { type: 'array', items: { type: 'string' } } }, required: ['huecos'] }, effort: 'high' }
)

return {
  esquema_actual: { autenticacion: authDDL, cliente_documentos: clienteDDL },
  requisitos,
  convenciones,
  formato_mdj: formato,
  propuesta_consolidada: consolidado,
  verificacion: {
    sobreviven: sobreviven.map(v => ({ elemento: v.elemento, tipo: v.tipo })),
    refutados: caidos.map(v => ({ elemento: v.elemento, tipo: v.tipo, refutaciones: v.refutaciones })),
  },
  critico_de_completitud: critico,
}
