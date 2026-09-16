export const meta = {
  name: 'modelo-datos-unitrans-impo',
  description: 'Analiza las pantallas nuevas de UNITRANS y el UML actual para proponer el delta de modelo de datos del flujo impo del conductor',
  phases: [
    { title: 'Lectura', detail: 'pantallas, UML .mdj, historias/reglas, convenciones y backend' },
    { title: 'Diseno', detail: 'una propuesta de modelo por area del flujo movil' },
    { title: 'Critica', detail: 'convenciones, normalizacion y completitud contra las pantallas' },
    { title: 'Sintesis', detail: 'documento de delta de modelo con DDL y diagrama' },
  ],
}

const RAIZ = 'C:/Christian/unimar_tms'

const CONTEXTO_COMUN = `
Proyecto: unimar_tms (TMS de Unimar, deposito temporal de contenedores en Callao/Paita).
Raiz del repo: ${RAIZ}. NUNCA ejecutes git commit/push.

Reglas de casa (CLAUDE.md, obligatorias):
- SQL Server 16. PK uniqueidentifier NONCLUSTERED generado en el dominio (UUID v7), indice CLUSTERED sobre fecha_creacion.
- Columnas de auditoria en toda tabla: usuario_creador NVARCHAR(100) NOT NULL, usuario_actualizador NVARCHAR(100) NULL,
  fecha_creacion DATETIMEOFFSET(3) NOT NULL DEFAULT SYSDATETIMEOFFSET(), fecha_actualizacion DATETIMEOFFSET(3) NULL, ultimo_cambio ROWVERSION.
- estado BIT solo en catalogos; eliminado BIT solo donde una PERSONA quita filas; PROHIBIDO eliminado en tablas append-only (ADR-0012).
- Texto siempre NVARCHAR. Fecha-hora siempre DATETIMEOFFSET(3), nada en UTC, offset -05:00. Dos relojes: fecha_evento (dispositivo) vs fecha_creacion (servidor, nunca en un DTO de entrada).
- Todo constraint e indice con nombre explicito: pk_/fk_/uq_/ck_/df_/ix_ + snake_case en espanol, sin sufijo _id en el nombre de la FK.
- Listas cerradas: CHECK en BD + enum en el dominio.
- Nombres de tablas y columnas en espanol, snake_case, singular.
- El TMS no tiene tabla usuario (identidad en portal corporativo UMS); los usuarios son texto sin FK.

Convencion del UML actual: las FK se llaman id_<tabla> (ej. id_planificacion_servicio_detalle), NO <tabla>_id.

Como leer el modelo UML actual (StarUML) desde bash:
cd /c/Christian/unimar_tms && node -e "const m=JSON.parse(require('fs').readFileSync('unimar_tms_recepcion.mdj','utf8'));const out=[];function walk(o){if(!o||typeof o!=='object')return;if(o._type==='ERDEntity')out.push(o);for(const k in o){const v=o[k];if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}};walk(m);for(const e of out){console.log('== '+e.name+' :: '+(e.documentation||''));(e.columns||[]).forEach(c=>console.log('   '+c.name+' '+(c.type||'')+(c.length?'('+c.length+')':'')+' '+(c.primaryKey?'PK ':'')+(c.foreignKey?'FK ':'')+(c.nullable?'NULL ':'')+' | '+(c.documentation||'').replace(/\\n/g,' ')))}"

Ubicaciones clave:
- Pantallas nuevas del conductor: prototipo-web/src/pages/unitrans/propuestas/ (y subcarpeta final/), datos mock en prototipo-web/src/data/unitransPropuestas.ts
- Historias: docs/01-concepcion/stories/us-tms-0{13,14,15,16,017,018,019,020,021,022,023,026,030,031,032}*.es.md
- PRD: docs/01-concepcion/prd-tms-parte-1-planificacion.es.md y prd-tms-parte-2-resto.es.md
- Diseno de datos: docs/02-diseno/ (modelo-er-tms-sin-maestros-sap.dbml, modelo-datos-planificacion.md, informe-modelo-planificacion.md, auditoria-modelo-datos.md, estructura-columnas-rd-rce.md, restricciones-check-listas-cerradas.md, convencion-nombres-constraints.md)
- ADRs: reference/architecture/adrs/
- Backend implementado: apps/api/src/modules/{recepcion,planificacion,mantenimientos}/

Flujo que hay que sostener (app movil Android del conductor, SOLO IMPORTACION en esta fase):
1. Login del conductor. 2. Ve servicios PLANIFICADOS (asignados) y los acepta o rechaza con motivo, con cuenta regresiva de 30 min; si no responde, caduca y se reasigna.
3. Ve servicios CONFIRMADOS y desde ahi inicia el viaje (uno en curso a la vez).
4. En el viaje marca checkpoints con el dedo (el prototipo muestra DOS: "Ingreso Balanza IP" y "Salida IP"; la historia US-TMS-015 habla de TRES: INGRESO_IP, BALANZA_IP, SALIDA_IP).
5. Al marcar la llegada, BUSCA y CONFIRMA el numero de contenedor que recibio (late binding cita<->contenedor) entre los candidatos de las naves en proceso; si la carga trae alertas (mercancia sensible, SICNI) se le avisan.
6. Pide la GUIA DE REMISION: la genera un sistema externo (servicio SAP que transmite a SUNAT), tarda entre 3 y 10 minutos, es asincrona, puede fallar y entonces escala por una cascada de contingencia (web -> SAP manual -> fisico). El conductor puede salir del puerto con solo haberla pedido; luego la ve y descarga el PDF, tambien desde el historial.
7. Al salir toma UNA FOTO del ticket de peso del puerto (una por viaje hoy; el historial ya muestra tambien fotos de precinto) y marca Salida IP.
8. Historial de viajes cerrados: busca por numero de cita, filtra por rango de fechas, reabre guia y fotos.
9. Notificaciones push: viaje asignado (con acciones aceptar/rechazar) y viaje por comenzar en 1 h (con accion iniciar viaje).
La app corre en el puerto: hay zonas sin senal, asi que las marcas pueden encolarse y reenviarse.
`

// ---------------------------------------------------------------- Fase 1
phase('Lectura')

const ESQ_INFORME = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'hallazgos'],
  properties: {
    resumen: { type: 'string', description: 'Sintesis en espanol, 10-20 lineas' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'detalle', 'evidencia'],
        properties: {
          titulo: { type: 'string' },
          detalle: { type: 'string' },
          evidencia: { type: 'string', description: 'archivo:linea o nombre de tabla/columna' },
        },
      },
    },
  },
}

const LECTORES = [
  {
    clave: 'pantallas',
    prompt: `${CONTEXTO_COMUN}

TAREA: inventario exhaustivo de las PANTALLAS NUEVAS del conductor.
Lee TODOS los archivos de prototipo-web/src/pages/unitrans/propuestas/ (incluida final/), prototipo-web/src/data/unitransPropuestas.ts y prototipo-web/src/router.tsx.
Para CADA pantalla y CADA panel/hoja/dialogo produce:
- que datos MUESTRA (campo por campo, con el nombre que usa el mock)
- que datos CAPTURA el conductor
- que ACCIONES dispara y que transicion de estado implica
- que CONSULTA necesitaria el backend para pintarla (filtros, agrupaciones, ordenes, contadores, rangos de fecha, busquedas)
- que temporizadores o reglas de tiempo aparecen (cuenta regresiva, ventana inmediata, aviso previo)
No propongas todavia tablas. Solo el inventario, exhaustivo y con evidencia archivo:linea.`,
  },
  {
    clave: 'uml',
    prompt: `${CONTEXTO_COMUN}

TAREA: volcado y lectura critica del MODELO UML ACTUAL (unimar_tms_recepcion.mdj).
Usa el comando node de arriba. Entrega:
- lista completa de tablas con su proposito (una linea cada una)
- para las tablas del bloque de planificacion/ejecucion (planificacion, planificacion_servicio_detalle, planificacion_servicio_detalle_carga, planificacion_servicio_detalle_checkpoint, planificacion_servicio_detalle_programacion, checkpoint_servicio, tipo_programacion, conductor, vehiculo_rodante, transportista, instalacion_portuaria, nave, nave_viaje) el detalle columna por columna con tipo, nulabilidad y documentacion
- las tablas de la capa RD (relacion_detallada*, requerimiento_transporte, carga_archivo*) con el detalle de donde vive el numero de contenedor en importacion y en exportacion
- TODA incoherencia que detectes: FKs que apuntan a tablas que no existen en el modelo, tablas sin ultimo_cambio, uso de estado/eliminado que no cumple ADR-0012, columnas que se contradicen con su documentacion
Compara ademas contra docs/02-diseno/modelo-er-tms-sin-maestros-sap.dbml (modelo anterior) y reporta que columnas EXISTIAN ahi y DESAPARECIERON en el .mdj (por ejemplo en la tabla puente servicio-carga y en la bitacora de eventos).`,
  },
  {
    clave: 'reglas',
    prompt: `${CONTEXTO_COMUN}

TAREA: extraer las REGLAS DE NEGOCIO Y REQUISITOS que tocan datos del flujo movil impo.
Lee las historias US-TMS-013, 014, 015, 016, 017, 018, 021, 022, 023, 026, 030, 031, 032 en docs/01-concepcion/stories/ y las secciones del PRD que citan (RN-22, RN-26, RN-31, RN-35, RN-48, RN-49, RN-50 a RN-59, RN-62, RN-63, RN-65, RN-69, RN-70, RN-72, RN-75, RN-82, F-23, F-27, F-28).
Entrega, por cada regla relevante: enunciado, que dato exige persistir, en que momento se captura, quien lo captura, y si hoy tiene o no donde vivir.
Marca explicitamente los PUNTOS ABIERTOS (V-xx, PA-xx) que impiden cerrar el modelo, y las contradicciones entre las historias y lo que muestra el prototipo (por ejemplo: tres checkpoints en la historia contra dos en la pantalla; una foto por viaje contra el historial que muestra dos tipos de foto).`,
  },
  {
    clave: 'convenciones',
    prompt: `${CONTEXTO_COMUN}

TAREA: fijar el MOLDE al que tiene que ajustarse cualquier tabla nueva, y decir que hay ya construido.
1) Lee CLAUDE.md (raiz), reference/architecture/adrs/ (sobre todo 0007, 0009, 0011, 0012, 0013, 0014) y docs/02-diseno/{convencion-nombres-constraints.md,restricciones-check-listas-cerradas.md,manejo-de-errores-de-base-de-datos.md}.
   Entrega el template exacto de tabla (DDL de referencia), la regla de intercalacion, como se declaran las listas cerradas (CHECK + enum) y como se nombran indices filtrados y unicos.
2) Lee apps/api/src/modules/planificacion/ completo y apps/api/src/modules/mantenimientos/infrastructure/persistence/.
   Entrega: que entidades ORM existen hoy, que casos de uso hay, como se materializa el estado del servicio, y si hay algo de la app movil ya empezado (endpoints, DTOs).
3) Revisa docker/sqlserver/crear-base-datos.sql y datos-prueba/ para saber que semillas de catalogo existen.`,
  },
]

const informes = await parallel(
  LECTORES.map((l) => () =>
    agent(l.prompt, { label: `leer:${l.clave}`, phase: 'Lectura', schema: ESQ_INFORME })
      .then((r) => ({ clave: l.clave, ...r })),
  ),
)

const base = informes
  .filter(Boolean)
  .map((i) => `\n===== INFORME ${i.clave.toUpperCase()} =====\n${i.resumen}\n\nHallazgos:\n${(i.hallazgos || []).map((h) => `- [${h.titulo}] ${h.detalle} (evidencia: ${h.evidencia})`).join('\n')}`)
  .join('\n')

log(`Lectura cerrada: ${informes.filter(Boolean).length}/4 informes`)

// ---------------------------------------------------------------- Fase 2
phase('Diseno')

const ESQ_DISENO = {
  type: 'object',
  additionalProperties: false,
  required: ['area', 'resumen', 'tablas_nuevas', 'columnas_nuevas', 'ddl', 'decisiones', 'preguntas_abiertas'],
  properties: {
    area: { type: 'string' },
    resumen: { type: 'string' },
    tablas_nuevas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nombre', 'proposito', 'cardinalidad', 'append_only', 'lleva_estado', 'lleva_eliminado', 'justificacion_estado_eliminado'],
        properties: {
          nombre: { type: 'string' },
          proposito: { type: 'string' },
          cardinalidad: { type: 'string', description: 'con quien se relaciona y en que cardinalidad' },
          append_only: { type: 'boolean' },
          lleva_estado: { type: 'boolean' },
          lleva_eliminado: { type: 'boolean' },
          justificacion_estado_eliminado: { type: 'string', description: 'ADR-0012: responde las dos preguntas' },
        },
      },
    },
    columnas_nuevas: {
      type: 'array',
      description: 'columnas que se agregan a TABLAS YA EXISTENTES del UML',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tabla', 'columna', 'tipo', 'nulable', 'porque'],
        properties: {
          tabla: { type: 'string' },
          columna: { type: 'string' },
          tipo: { type: 'string' },
          nulable: { type: 'boolean' },
          porque: { type: 'string' },
        },
      },
    },
    ddl: { type: 'string', description: 'CREATE TABLE / ALTER TABLE completos para SQL Server 16, con todos los constraints e indices nombrados' },
    decisiones: {
      type: 'array',
      description: 'decisiones de normalizacion y desnormalizacion con su porque',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['decision', 'tipo', 'porque', 'alternativa_descartada'],
        properties: {
          decision: { type: 'string' },
          tipo: { type: 'string', enum: ['normalizacion', 'desnormalizacion', 'catalogo', 'integridad', 'indexacion'] },
          porque: { type: 'string' },
          alternativa_descartada: { type: 'string' },
        },
      },
    },
    preguntas_abiertas: { type: 'array', items: { type: 'string' } },
  },
}

const AREAS = [
  {
    clave: 'asignacion',
    titulo: 'Asignacion, aceptacion, rechazo y caducidad',
    encargo: `Modela el ciclo asignar -> aceptar / rechazar / caducar del servicio al conductor.
Tiene que sostener: la pantalla de Servicios Planificados con cuenta regresiva por fila, el motivo de rechazo obligatorio y elegido de una lista, la reasignacion (el mismo servicio se ofrece a otro conductor despues de un rechazo o de una caducidad), el indicador de rechazos por conductor (RN-35) y la tolerancia de 30 minutos (RN-48/RN-82).
Piensa bien: hoy planificacion_servicio_detalle guarda conductor/placa/transportista como columnas planas, asi que una reasignacion PISA el dato anterior y se pierde a quien se le ofrecio antes y por que dijo que no.
Decide si el motivo de rechazo es catalogo o texto libre, y si la caducidad es un checkpoint, un valor de respuesta, o las dos cosas.
Revisa si el catalogo checkpoint_servicio (SIN_CITA, SIN_ASIGNAR, PRECITA, ASIGNADO, RECHAZADO, ANULADO, CONFIRMADO, ...) alcanza o hay que agregarle codigos.`,
  },
  {
    clave: 'checkpoints',
    titulo: 'Bitacora de checkpoints marcados en el celular',
    encargo: `Modela lo que pasa cuando el conductor marca un hito con el dedo, dentro del puerto, a veces sin senal.
Hoy planificacion_servicio_detalle_checkpoint solo tiene id, id_planificacion_servicio_detalle, id_checkpoint_servicio, usuario_creador y fecha_creacion.
Tiene que sostener: los dos relojes (fecha_evento del dispositivo vs fecha_creacion del servidor, regla explicita de CLAUDE.md), la fuente del hito (CONDUCTOR / ACCESOS / SAP / SISTEMA: no todos los marca el conductor), la geolocalizacion de la marca, la IDEMPOTENCIA de un reenvio desde una cola offline (que pasa si el celular manda dos veces la misma marca), la regla de que un checkpoint no se remarca y de que la secuencia no admite saltos, y la trazabilidad forense (version de app, dispositivo).
Resuelve tambien la contradiccion tres checkpoints (historia US-TMS-015) contra dos botones (prototipo): di como se modela para que la app pueda cambiar de opinion sin migrar datos.
Discute si la regla de secuencia se defiende en BD, en el dominio, o en ambos.`,
  },
  {
    clave: 'contenedor',
    titulo: 'Vinculo contenedor <-> servicio y dato de carga',
    encargo: `Modela el late binding cita <-> contenedor de importacion (RN-72) y el dato de carga que captura el conductor (RN-56, RN-58: bultos y peso bruto validados contra lo manifestado).
Hoy existe planificacion_servicio_detalle_carga (puente m:n con solo ids y eliminado) y el numero de contenedor de importacion vive en relacion_detallada_carga_importacion.equipo.
Responde: como consulta la app los contenedores CANDIDATOS de su servicio si planificacion_servicio_detalle no apunta a la nave/viaje ni a la relacion detallada; que columnas le faltan al puente para distinguir el vinculo PLANIFICADO del confirmado en CAMPO y para guardar bultos/peso del viaje; como se registra que el conductor cambio el contenedor respecto del planificado; y donde viven las alertas de carga que la pantalla muestra (mercancia sensible, SICNI) sabiendo que existe el catalogo clasificacion_carga y la puente relacion_detallada_carga_clasificacion.
Evalua explicitamente si conviene desnormalizar el codigo de contenedor y/o la nave sobre el servicio, y con que justificacion.`,
  },
  {
    clave: 'documentos',
    titulo: 'Fotos y documentos del servicio',
    encargo: `Modela la captura de la foto del ticket de peso del puerto (US-TMS-018) sabiendo que HOY es una por viaje pero que el historial del prototipo ya muestra tambien una foto de precinto, y que manana pueden ser mas tipos.
Resuelve: donde vive el binario (NO en la BD: mira como lo hace carga_archivo con ruta_archivo y hash_contenido), como se garantiza "una foto de ticket por viaje" sin cablear la regla en la forma de la tabla, que pasa cuando el conductor repite la foto antes de guardar y que pasa si la reemplaza despues, los metadatos que hacen falta (hora de captura del dispositivo, geolocalizacion, tamano, mime, hash), y si hace falta un catalogo de tipo de documento.
Justifica tabla contra columna: por que NO una columna ruta_foto_ticket en planificacion_servicio_detalle.`,
  },
  {
    clave: 'guia',
    titulo: 'Guia de remision emitida por un sistema externo',
    encargo: `Modela la GRE Remitente (US-TMS-021 y US-TMS-022). Hechos duros: la arma y transmite un servicio de SAP que el TMS solo consume (RN-69), tarda entre 3 y 10 minutos (es ASINCRONA: el conductor pide y sigue su viaje, y sale del puerto con solo haberla pedido), puede fallar y NO se reintenta desde la app, y entonces escala por la cascada web -> SAP manual -> fisico (RN-55), y el documento emitido por contingencia tiene que llegarle igual al conductor (F-27).
El boton es inteligente: Generar si no existe, Ver si existe (RN-54). Desde el historial se reabre el PDF de viajes ya cerrados.
Modela: el estado del pedido, la identidad del documento emitido (serie/numero), la via por la que se emitio, el PDF, el error devuelto, y la bitacora de cada invocacion al servicio externo (peticion, respuesta, codigo, cuando) para poder auditar la cascada.
Decide cardinalidad servicio <-> guia (1:1? 1:N por reintentos y contingencias?) y como se sabe cual es la vigente. Considera la idempotencia: dos pulsaciones de Generar no pueden producir dos GRE ante SUNAT.`,
  },
  {
    clave: 'movil',
    titulo: 'Dispositivo, notificaciones e identidad del conductor',
    encargo: `Modela lo que la app necesita fuera del viaje: el registro del dispositivo del conductor con su token push (las dos notificaciones del prototipo: viaje asignado con acciones aceptar/rechazar, y viaje por comenzar en 1 h con accion iniciar viaje), el envio y acuse de esas notificaciones (US-TMS-026), y los datos del conductor y su unidad que muestra el menu lateral: nombre, BREVETE (licencia), transportista, placa de TRACTO y placa de CARRETA.
Hoy conductor no tiene brevete y vehiculo_rodante es una sola placa con un id_conductor colgado, y planificacion_servicio_detalle guarda una sola columna placa.
Resuelve: como se representan tracto y carreta (dos vehiculos en un viaje) sin romper la foto historica que ya guarda el servicio; si hace falta catalogo de tipo de vehiculo; y donde vive el token push sabiendo que el TMS no tiene tabla usuario (D-08, la identidad la da UMS).
Decide si la notificacion se persiste (outbox) o se dispara y se olvida, y justifica.`,
  },
]

const disenos = (await parallel(
  AREAS.map((a) => () =>
    agent(
      `${CONTEXTO_COMUN}

Ya se leyo el repo. Estos son los informes de la fase de lectura, usalos como base y verifica en el codigo lo que necesites:
${base}

TU AREA: ${a.titulo}

${a.encargo}

ENTREGA: el modelo de datos de TU AREA solamente, en el molde de la casa. DDL de SQL Server 16 con todos los constraints e indices nombrados segun la convencion, columnas de auditoria completas, PK NONCLUSTERED e indice CLUSTERED sobre fecha_creacion, CHECK para toda lista cerrada.
Usa la convencion de FK del UML actual: id_<tabla>.
Para cada tabla nueva responde las dos preguntas del ADR-0012 antes de poner estado o eliminado.
Se explicito sobre normalizacion: donde normalizas y por que, donde DESNORMALIZAS (foto historica, estado cacheado) y por que, y que alternativa descartaste.
No invadas las otras areas: si necesitas algo de otra area, decilo como dependencia en preguntas_abiertas.`,
      { label: `disenar:${a.clave}`, phase: 'Diseno', schema: ESQ_DISENO },
    ).then((r) => ({ clave: a.clave, ...r })),
  ),
)).filter(Boolean)

log(`Diseno cerrado: ${disenos.length}/6 areas`)

const propuestas = disenos
  .map(
    (d) => `\n===== AREA ${d.area || d.clave} =====\n${d.resumen}

TABLAS NUEVAS:
${(d.tablas_nuevas || []).map((t) => `- ${t.nombre}: ${t.proposito} | cardinalidad: ${t.cardinalidad} | append-only: ${t.append_only} | estado: ${t.lleva_estado} | eliminado: ${t.lleva_eliminado} | ${t.justificacion_estado_eliminado}`).join('\n')}

COLUMNAS NUEVAS EN TABLAS EXISTENTES:
${(d.columnas_nuevas || []).map((c) => `- ${c.tabla}.${c.columna} ${c.tipo}${c.nulable ? ' NULL' : ' NOT NULL'} — ${c.porque}`).join('\n')}

DDL:
${d.ddl}

DECISIONES:
${(d.decisiones || []).map((x) => `- (${x.tipo}) ${x.decision} — porque: ${x.porque} — descartado: ${x.alternativa_descartada}`).join('\n')}

PREGUNTAS ABIERTAS:
${(d.preguntas_abiertas || []).map((p) => `- ${p}`).join('\n')}`,
  )
  .join('\n')

// ---------------------------------------------------------------- Fase 3
phase('Critica')

const ESQ_CRITICA = {
  type: 'object',
  additionalProperties: false,
  required: ['veredicto', 'hallazgos'],
  properties: {
    veredicto: { type: 'string' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['gravedad', 'objetivo', 'problema', 'correccion'],
        properties: {
          gravedad: { type: 'string', enum: ['bloqueante', 'alta', 'media', 'baja'] },
          objetivo: { type: 'string', description: 'tabla, columna o decision criticada' },
          problema: { type: 'string' },
          correccion: { type: 'string', description: 'la correccion concreta, en DDL si aplica' },
        },
      },
    },
  },
}

const CRITICOS = [
  {
    clave: 'convenciones',
    prompt: `Eres el auditor de cumplimiento del estandar de la casa. Tu trabajo es REFUTAR, no aplaudir.
Revisa CADA tabla y CADA columna propuesta contra CLAUDE.md y los ADRs 0011/0012/0013/0014 y contra docs/02-diseno/convencion-nombres-constraints.md y restricciones-check-listas-cerradas.md (leelos, no confies en tu memoria).
Busca: tipos prohibidos (VARCHAR, CHAR, DATETIME2, IDENTITY), fechas sin offset o sin precision (3), auditoria incompleta, ultimo_cambio faltante o sobrante, estado/eliminado puestos sin responder las dos preguntas del ADR-0012, eliminado en tablas append-only, constraints o indices sin nombre o mal nombrados, sufijo _id en el nombre de una FK, listas cerradas sin CHECK, nombres en ingles, columnas que repiten lo que ya dice otra tabla, PK que no sea NONCLUSTERED o falta del indice clustered sobre fecha_creacion.
Se literal y exigente: cada incumplimiento es un hallazgo con su correccion en DDL.`,
  },
  {
    clave: 'normalizacion',
    prompt: `Eres un modelador de datos escentico. Tu trabajo es REFUTAR el conjunto de propuestas como sistema, no como piezas sueltas.
Busca: dos areas que inventaron la MISMA tabla con nombres distintos; tablas que sobran porque una columna en una tabla existente alcanza; columnas que sobran porque son derivables de una bitacora; desnormalizaciones sin justificacion (o justificadas de boquilla) y normalizaciones que van a costar caro en la consulta que la pantalla necesita; claves naturales sin unique; cardinalidades mal declaradas; ciclos de FK; datos que quedan huerfanos; catalogos que deberian ser un CHECK y CHECKs que deberian ser catalogo.
Revisa ademas dos agujeros heredados del UML actual y di si las propuestas los agravan: las FK id_tipo_carga e id_estado_carga de relacion_detallada_carga apuntan a tablas que NO existen en el modelo, y planificacion_servicio_detalle no tiene camino a la nave/viaje del servicio.
Para cada hallazgo da la correccion concreta.`,
  },
  {
    clave: 'completitud',
    prompt: `Eres el critico de completitud. Tu trabajo es encontrar lo que FALTA, recorriendo las pantallas del prototipo una por una (leelas en prototipo-web/src/pages/unitrans/propuestas/, incluida final/, y prototipo-web/src/data/unitransPropuestas.ts).
Para CADA dato que la pantalla muestra o captura, y para CADA consulta que necesita (filtros por terminal, contadores, agrupaciones, orden, busqueda por numero de cita, rangos de 7/30 dias, minutos faltantes, un solo viaje en curso a la vez, historial de viajes cerrados con guia y fotos), verifica que el modelo propuesto + el UML actual puedan resolverla. Di cual NO se puede y que falta.
Revisa tambien el flujo completo de punta a punta buscando estados imposibles: que pasa si el conductor rechaza despues de aceptar, si marca salida sin haber pedido guia, si pide guia y nunca sale, si el servicio se anula con el viaje en curso, si el mismo contenedor se vincula a dos servicios, si dos conductores tienen el mismo servicio.
Cada hallazgo con su correccion.`,
  },
]

const criticas = (await parallel(
  CRITICOS.map((c) => () =>
    agent(
      `${CONTEXTO_COMUN}

Estos son los informes de lectura del repo:
${base}

Estas son las propuestas de modelo a criticar:
${propuestas}

${c.prompt}`,
      { label: `criticar:${c.clave}`, phase: 'Critica', schema: ESQ_CRITICA },
    ).then((r) => ({ clave: c.clave, ...r })),
  ),
)).filter(Boolean)

const criticaTexto = criticas
  .map((c) => `\n===== CRITICA ${c.clave.toUpperCase()} =====\nVeredicto: ${c.veredicto}\n${(c.hallazgos || []).map((h) => `- (${h.gravedad}) ${h.objetivo}: ${h.problema}\n  CORRECCION: ${h.correccion}`).join('\n')}`)
  .join('\n')

const totalHallazgos = criticas.reduce((n, c) => n + (c.hallazgos || []).length, 0)
log(`Critica cerrada: ${totalHallazgos} hallazgos sobre ${disenos.length} areas`)

// ---------------------------------------------------------------- Fase 4
phase('Sintesis')

const ESQ_SINTESIS = {
  type: 'object',
  additionalProperties: false,
  required: ['ruta_documento', 'tablas_nuevas', 'columnas_nuevas', 'resumen_ejecutivo', 'preguntas_abiertas', 'hallazgos_descartados'],
  properties: {
    ruta_documento: { type: 'string' },
    tablas_nuevas: { type: 'array', items: { type: 'string' } },
    columnas_nuevas: { type: 'array', items: { type: 'string' }, description: 'formato tabla.columna' },
    resumen_ejecutivo: { type: 'string', description: 'para leer en el terminal: que falta y como se logra, 25-40 lineas en espanol' },
    preguntas_abiertas: { type: 'array', items: { type: 'string' } },
    hallazgos_descartados: { type: 'array', items: { type: 'string' }, description: 'criticas que NO aplicaste y por que' },
  },
}

const sintesis = await agent(
  `${CONTEXTO_COMUN}

Eres el arquitecto que cierra el analisis. Tienes los informes de lectura, seis propuestas de modelo y tres criticas adversariales.

INFORMES DE LECTURA:
${base}

PROPUESTAS:
${propuestas}

CRITICAS:
${criticaTexto}

TAREA: aplica las criticas (o rechazalas con argumento) y ESCRIBE el documento final en ${RAIZ}/docs/02-diseno/modelo-datos-ejecucion-unitrans.md, en espanol, siguiendo el estilo de los otros documentos de docs/02-diseno/ (leete uno antes de escribir, por ejemplo modelo-datos-planificacion.md, para copiar tono y estructura).

El documento debe tener, en este orden:
1. Para que es esto y que alcance cubre (impo, app del conductor).
2. El flujo del conductor de punta a punta, paso por paso, diciendo en cada paso QUE SE ESCRIBE en la base.
3. Que hay hoy en el UML: el bloque de planificacion/ejecucion tal como esta, y por que no alcanza. Una lista clara de agujeros.
4. LAS TABLAS NUEVAS, una seccion por tabla: proposito, cardinalidad, columnas con tipo y nulabilidad, y el DDL completo (SQL Server 16, constraints e indices nombrados). Marca cada una como BLOQUE NUEVO.
5. LAS COLUMNAS NUEVAS sobre tablas existentes, agrupadas por tabla, cada una con su ALTER TABLE y su porque. Marca cada una como COLUMNA NUEVA.
6. Un diagrama Mermaid erDiagram del bloque de ejecucion movil que muestre lo existente y lo nuevo (marca lo nuevo en el nombre de la relacion o con una convencion clara y explicada en una leyenda).
7. Decisiones de normalizacion y desnormalizacion, en tabla: decision, tipo, por que, alternativa descartada.
8. Las semillas de catalogo que hay que insertar (codigos de checkpoint, motivos de rechazo, tipos de documento, etc.).
9. Reglas que se defienden en BD contra reglas que se defienden en el dominio, y por que cada una donde esta.
10. Preguntas abiertas para el negocio, numeradas, cada una con quien la responde y que bloquea.
11. Cambios que NO se hacen ahora y por que (fuera de alcance).

Reglas de escritura: espanol, sin adornos, sin comentarios decorativos en el DDL, tablas de markdown donde ayuden. Coherencia total de nombres con el UML actual (FKs id_<tabla>). Si una critica era correcta, aplicala; si no, dila en hallazgos_descartados con el argumento.
NO ejecutes git. Solo escribe ese archivo.
Devuelve el resumen ejecutivo para el terminal.`,
  { label: 'sintetizar', phase: 'Sintesis', schema: ESQ_SINTESIS, effort: 'high' },
)

return sintesis
