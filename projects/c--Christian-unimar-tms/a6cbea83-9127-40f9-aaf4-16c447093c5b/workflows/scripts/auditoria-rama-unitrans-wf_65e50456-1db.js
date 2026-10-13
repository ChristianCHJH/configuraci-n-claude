export const meta = {
  name: 'auditoria-rama-unitrans',
  description: 'Audita lo construido en feature/unitrans-android contra la arquitectura refactorizada en develop',
  phases: [
    { title: 'Norma', detail: 'extraer el estandar vigente de develop (ADRs, gates, codigo ejemplar)' },
    { title: 'Auditoria', detail: 'un auditor por dimension sobre el codigo nuevo' },
    { title: 'Verificacion', detail: 'refutacion adversarial de cada hallazgo' },
    { title: 'Sintesis', detail: 'critico de completitud y consolidacion' },
  ],
}

const RAIZ = 'C:/Christian/unimar_tms'
const BASE = 'origin/develop'

const CONTEXTO = `
Repositorio: ${RAIZ} (monorepo TMS de Unimar). Trabajas en LECTURA PURA: no edites, no escribas, no crees ficheros, no hagas commit.

Situacion:
- La rama base ${BASE} (commit 5da1158) contiene el codigo YA REFACTORIZADO por el desarrollador Alberto Arroyo (autor git "aarroyo" / "Alberto Arroyo Raygada"). Ese codigo es EL ESTANDAR.
- La rama actual feature/unitrans-android agrega, encima de esa base, la funcionalidad UNITRANS (app Android del conductor + endpoints, controladores, casos de uso, puertos, adaptadores y tablas nuevas en la API).
- El codigo nuevo esta en DOS sitios y hay que auditar LOS DOS:
  1) commits: \`git diff ${BASE}..HEAD\`
  2) arbol de trabajo sin commitear: \`git status --porcelain\` y \`git diff\` (hay ~93 ficheros modificados/nuevos sin commitear, incluidos controladores y casos de uso enteros)
  Para ver ficheros nuevos sin commitear usa \`git status --porcelain\` y leelos directamente con cat.

Comandos utiles (bash, ya estas en Windows con Git Bash):
  cd ${RAIZ} && git diff --stat ${BASE}..HEAD
  cd ${RAIZ} && git status --porcelain
  cd ${RAIZ} && git show ${BASE}:ruta/al/fichero   # ver como estaba en el estandar
  cd ${RAIZ} && git log ${BASE} --oneline --author=aarroyo | head -40

Documentos normativos (leelos, no los supongas):
  ${RAIZ}/CLAUDE.md                                       (reglas de modelado SQL Server, estilo, espanol, comentarios)
  ${RAIZ}/reference/architecture/adrs/TMS-0*.es.md         (ADR-TMS-004 a 020)
  ${RAIZ}/src/apps/api/.eslintrc.cjs                       (umbrales D4 y reglas de frontera por capa)
  ${RAIZ}/src/apps/api/.dependency-cruiser.cjs             (fronteras entre modulos, ADR-TMS-015)
  ${RAIZ}/CONTRIBUTING.md , ${RAIZ}/GAPS.md , ${RAIZ}/DEUDAS.md

Hechos ya verificados por el orquestador, no los repitas ni los contradigas sin evidencia:
- \`npx eslint "src/**/*.ts"\` en src/apps/api pasa limpio sobre 422 ficheros. Los umbrales D4 (max-lines-per-function 50, max-params 3, complexity 10, max-depth 3) y las reglas no-restricted-imports por capa NO estan siendo violadas de forma que ESLint detecte.
- La puerta \`npm run fronteras\` (dependency-cruiser) NO se puede ejecutar en esta maquina: exige Node >=22 y hay Node 20.17.0 instalado. Verifica las fronteras a mano con grep.
- Un grep de imports cruzados entre modulos fuera de domain/ y *.orm-entity.ts no dio resultados en src/modules.

Por tanto: NO pierdas tiempo re-reportando lo que ESLint ya cubre. Busca lo que las herramientas NO ven: decisiones de diseno, patrones que el estandar aplica y el codigo nuevo no, responsabilidades mal repartidas, contratos incoherentes, invariantes de negocio sin proteger, y normas escritas en ADR/CLAUDE.md que el codigo nuevo incumple.

Regla de evidencia: todo hallazgo debe citar (a) el fichero y linea del codigo nuevo, (b) la norma exacta (ADR + seccion, o linea de CLAUDE.md, o regla del gate), y (c) cuando exista, el fichero de ${BASE} que hace lo correcto. Sin las tres cosas, no lo reportes.
Todo en espanol.
`

const ESQUEMA_HALLAZGOS = {
  type: 'object',
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          archivo: { type: 'string' },
          linea: { type: 'integer' },
          norma: { type: 'string', description: 'ADR + seccion, linea de CLAUDE.md, o regla del gate que se incumple' },
          ejemplar_en_develop: { type: 'string', description: 'fichero de origin/develop que hace lo correcto, o cadena vacia si no hay' },
          que_hace_el_codigo: { type: 'string' },
          que_manda_la_norma: { type: 'string' },
          consecuencia: { type: 'string', description: 'que se rompe en la practica' },
          gravedad: { type: 'string', enum: ['alta', 'media', 'baja'] },
          arreglo: { type: 'string' },
        },
        required: ['titulo', 'archivo', 'linea', 'norma', 'que_hace_el_codigo', 'que_manda_la_norma', 'consecuencia', 'gravedad', 'arreglo'],
      },
    },
  },
  required: ['hallazgos'],
}

const ESQUEMA_VEREDICTO = {
  type: 'object',
  properties: {
    refutado: { type: 'boolean' },
    razon: { type: 'string' },
    gravedad_corregida: { type: 'string', enum: ['alta', 'media', 'baja'] },
  },
  required: ['refutado', 'razon'],
}

phase('Norma')
log('Extrayendo el estandar vigente de develop en tres frentes')

const NORMAS = [
  {
    clave: 'arquitectura',
    prompt: `Extrae el estandar de ARQUITECTURA del backend tal como quedo en ${BASE} tras las refactorizaciones de aarroyo.
Lee ADR-TMS-005, ADR-TMS-015, ADR-TMS-018, ADR-TMS-020, .eslintrc.cjs y .dependency-cruiser.cjs.
Lee ademas, como codigo ejemplar, un modulo completo ya refactorizado: src/apps/api/src/modules/flota y src/apps/api/src/modules/relacion-detallada (estructura de carpetas, como se declara un puerto en domain/puertos, como se provee por token en el .module.ts, como se nombra un adaptador, como se estructura un caso de uso, como devuelve errores, como se estructura un controlador y sus DTO).
Devuelve una LISTA NUMERADA de reglas concretas y contrastables (no prosa) que cualquier codigo nuevo del backend debe cumplir, cada una con el fichero de ${BASE} que la ejemplifica.`,
  },
  {
    clave: 'datos',
    prompt: `Extrae el estandar de MODELO DE DATOS Y MIGRACIONES tal como quedo en ${BASE}.
Lee la seccion de modelado de ${RAIZ}/CLAUDE.md entera, ADR-TMS-011, 012, 013, 014, y docs/02-diseno/restricciones-check-listas-cerradas.md si existe.
Lee como codigo ejemplar las ultimas migraciones de ${BASE}: \`git show ${BASE} --stat\` y lista src/apps/api/src/shared/infrastructure/persistence/migraciones/ en ${BASE}; abre 3 o 4 completas (una que crea tabla, una que altera, una que siembra un catalogo) y extrae el patron literal: PK NONCLUSTERED, indice clustered sobre fecha_creacion, columnas de auditoria, ROWVERSION, nombres de constraints, DATETIMEOFFSET(3), intercalacion explicita, CHECK generado desde el enum, forma del down().
Devuelve una LISTA NUMERADA de reglas contrastables con su ejemplar.`,
  },
  {
    clave: 'observabilidad-seguridad',
    prompt: `Extrae el estandar de OBSERVABILIDAD NARRATIVA (ADR-TMS-019 / ADR-0096 perfil B) y de SEGURIDAD E IDENTIDAD (ADR-TMS-017) tal como quedo en ${BASE}.
Lee ADR-TMS-017 y ADR-TMS-019 completos, src/apps/api/src/shared/observabilidad/ y src/apps/api/src/shared/seguridad/ en ${BASE}.
Mira los commits de aarroyo: 494f18d, a70b46f, ab51bb8, 51c2033, d7fceb7 (observabilidad), a234eb7 y 288baff ("el autor de cada escritura sale de la sesion, no del cuerpo"), 573c17b ("la sede filtra en toda lectura"), fa375c9 (autorizacion contra UMS, aislamiento por sede). Usa \`git show <sha> --stat\` y \`git show <sha> -- <fichero>\` para ver el patron exacto que introdujeron.
Extrae: como narra un caso de uso que escribe (etapas, decisiones, efectos), donde se registra el error y donde NO, que campos estan prohibidos en el relato, como se obtiene el autor y la sede de la sesion, como se declaran los permisos en permisos-tms.ts y como se prueba la cobertura de rutas, y el catalogo de errorCode con runbook.
Devuelve una LISTA NUMERADA de reglas contrastables con su ejemplar.`,
  },
]

const normas = await parallel(NORMAS.map(n => () =>
  agent(`${CONTEXTO}\n\n${n.prompt}`, { label: `norma:${n.clave}`, phase: 'Norma' })
))

const NORMA = normas.filter(Boolean).map((t, i) => `### NORMA ${NORMAS[i].clave}\n${t}`).join('\n\n')
log('Norma consolidada. Arrancan los auditores por dimension.')

const DIMENSIONES = [
  {
    clave: 'fronteras-modulo',
    prompt: `DIMENSION: fronteras de modulo y ubicacion de simbolos (ADR-TMS-015).
Todo lo nuevo de UNITRANS se metio dentro del modulo \`planificacion\`. Pregunta si eso es correcto:
- Hay agregados nuevos (oferta de viaje, dispositivo del conductor, documento de servicio, checkpoint) que quiza son otro contexto de dominio y no planificacion. ADR-TMS-015 elimino \`mantenimientos\` justamente por agrupar agregados ajenos bajo un nombre que no era un contexto.
- Revisa si algun simbolo nuevo deberia estar en shared/ (lo usan dos modulos) o al reves, si algo bajo a shared/ que no es compartido. Mira en particular el movimiento \`almacen-de-archivos\` de modules/recepcion a shared/ que aparece sin commitear: valida si cumple la regla 1 (shared no importa de modules) y si el puerto quedo bien ubicado.
- Verifica a mano que ningun fichero nuevo importe api/, application/ o infrastructure/ de otro modulo, ni cree ciclos entre ficheros.
- Verifica que la colaboracion entre modulos sea por puerto declarado + token, no por import directo de clase.
Reporta solo violaciones o ubicaciones equivocadas con evidencia.`,
  },
  {
    clave: 'capas-hexagonal',
    prompt: `DIMENSION: regla de dependencia dentro del modulo (hexagonal domain/application/infrastructure/api).
Audita TODOS los ficheros nuevos de src/apps/api/src/modules/planificacion (commiteados y sin commitear) y contesta, por fichero:
- ¿La logica de negocio esta en domain/ o se filtro al controlador o al adaptador? Busca reglas de decision (transiciones de estado, caducidad de oferta, validez de un gesto, orden de checkpoints) escritas en un controlador, en un caso de uso o dentro de SQL en vez de en el dominio.
- ¿Los adaptadores TypeORM contienen decisiones de negocio en el SQL que el dominio no puede ver ni probar?
- ¿Los casos de uso orquestan, o hacen de todo?
- ¿Los puertos de domain/puertos/unitrans.ts son un puerto por colaboracion, o un cajon de sastre?
Presta atencion especial a ofertas-de-viaje.typeorm.ts (291 lineas), emisor-de-ofertas.ts (189), asignador-viaje.typeorm.ts y unitrans.controller.ts (164).`,
  },
  {
    clave: 'solid',
    prompt: `DIMENSION: SOLID y diseno orientado a objetos.
Sobre el codigo nuevo del backend (controladores unitrans*, casos de uso nuevos, adaptadores nuevos, dominio nuevo):
- SRP: controladores o casos de uso que hacen mas de una cosa; ficheros que mezclan lectura y escritura; clases con razones de cambio multiples. Ojo con los CUATRO controladores unitrans nuevos (unitrans.controller.ts, unitrans-dispositivos, unitrans-carga, unitrans-conductor, unitrans-viaje): ¿por que cinco?, ¿el corte es por agregado o improvisado?
- OCP/DIP: dependencias a clases concretas en vez de a puertos; \`new\` de un adaptador dentro de un caso de uso; tokens de inyeccion mal declarados en planificacion.module.ts.
- LSP/ISP: puertos con metodos que algunas implementaciones no pueden cumplir; interfaces gordas.
- Duplicacion: logica repetida entre los adaptadores nuevos y los que ya existian en ${BASE} (mapeos, armado de fechas, resolucion de conductor, marca de checkpoint). Compara contra lo que ${BASE} ya tenia resuelto.
Reporta con nombre de clase/metodo y linea.`,
  },
  {
    clave: 'observabilidad',
    prompt: `DIMENSION: observabilidad narrativa (ADR-TMS-019, perfil B de ADR-0096).
El estandar dice que los casos de uso que ESCRIBEN narran su transaccion: etapas, decisiones y efectos; que el error se registra una sola vez y en el filtro de excepciones (D4, prohibido log-and-throw); que el desenlace lo emite el middleware; que hay un catalogo de errorCode con runbook y una prueba que falla si un codigo queda sin catalogar.
Audita CADA caso de uso nuevo que escribe (registrar-dispositivo, responder-viaje, caducar-ofertas, cerrar-viaje, carga-del-viaje, documentos-del-viaje, y cualquier otro nuevo en application/):
- ¿Narra? Compara literalmente contra un caso de uso de ${BASE} que si narra (busca cual con grep de \`relato\` en ${BASE}).
- ¿Los errores nuevos de domain/errores.ts tienen errorCode catalogado y runbook, o se agregaron sin pasar por el catalogo?
- ¿Hay log-and-throw, console.log, o registro del error fuera del filtro?
- ¿Se filtra dato personal (nombre, DNI, telefono, placa, ubicacion GPS del conductor) hacia el relato o los logs?
Este es el punto donde mas probable es que lo nuevo se haya saltado el estandar: se exhaustivo.`,
  },
  {
    clave: 'seguridad-identidad',
    prompt: `DIMENSION: identidad, autoria y aislamiento por sede (ADR-TMS-017 y los commits a234eb7, 288baff, 573c17b, fa375c9 de aarroyo).
El estandar dice: el autor de toda escritura sale de la SESION, nunca del cuerpo de la peticion; la sede/sucursal filtra en TODA lectura; los permisos se declaran en shared/seguridad/permisos-tms.ts y hay una prueba de cobertura de rutas que falla si una ruta queda sin permiso; la postura es fallar cerrado.
Audita los endpoints nuevos de UNITRANS:
- ¿De donde sale \`usuario_creador\` en cada escritura nueva? Si sale de un DTO, del cuerpo, o de una cabecera no autenticada, es hallazgo grave.
- ¿Las lecturas del conductor filtran por sede? ¿Un conductor puede pedir el viaje de otro conductor cambiando un id en la URL? Busca IDOR.
- Se agrego \`modo-de-seguridad.ts\` y se toco \`permisos-tms.ts\` y \`cobertura-de-rutas.spec.ts\`: ¿el modo nuevo abre una puerta que ADR-TMS-017 cierra? ¿Los cinco controladores nuevos estan todos cubiertos por permiso, o alguno quedo publico?
- El decorador nuevo \`gesto-del-conductor.decorador.ts\` y \`GestoDelTelefono\`: ¿que confia del telefono? ¿Se confia en el reloj del dispositivo para una decision del servidor (ADR-TMS-013 dice que fecha_creacion la sella el servidor)?
- ¿El registro de dispositivo permite que un telefono se haga pasar por otro conductor?`,
  },
  {
    clave: 'contrato-http',
    prompt: `DIMENSION: contrato HTTP y DTO.
El estandar de ${BASE}: respuestas envueltas por TransformInterceptor + HttpExceptionFilter con la forma { success, statusCode, message, data }; DTOs con class-validator; documentacion OpenAPI 3.1 con @ApiProperty; versionado en /api/v1; paginacion con tope de 100; validacion por esquema compartido con la web (commit 0e3aa49).
Audita los DTO y controladores nuevos de UNITRANS (api/dto/unitrans.dto.ts, respuestas-unitrans.dto.ts, viaje-del-conductor.dto.ts, respuestas-viaje-del-conductor.dto.ts y los cinco controladores):
- ¿Todos los DTO de entrada validan con class-validator, o hay campos sin decorador que entran crudos?
- ¿Los DTO de salida estan documentados con @ApiProperty como los de ${BASE}?
- ¿Las rutas nuevas cuelgan de /api/v1 y siguen la convencion de nombres de las existentes?
- ¿Hay listados sin paginacion o sin tope?
- ¿Algun DTO de entrada acepta \`ultimo_cambio\`, \`fecha_creacion\`, \`usuario_creador\` o el rowversion, que CLAUDE.md prohibe explicitamente?
- ¿Los codigos de estado son los correctos (409 para conflicto, 400 para If-Match malformado)?
- ¿La respuesta de error dice que hacer, en espanol?`,
  },
  {
    clave: 'migraciones',
    prompt: `DIMENSION: migraciones y modelo de datos.
Audita las SIETE migraciones nuevas de la rama (1789948800000 a 1790467200000) fichero por fichero contra la seccion de modelado de CLAUDE.md y los ADR-TMS-011/012/013/014:
- PK UNIQUEIDENTIFIER NONCLUSTERED con nombre pk_<tabla>, GUID generado en el dominio (nunca NEWID()/NEWSEQUENTIALID() por defecto).
- Indice CLUSTERED sobre fecha_creacion.
- Las cinco columnas de auditoria completas, con usuario_actualizador y fecha_actualizacion NULABLES y ultimo_cambio ROWVERSION.
- Todo constraint e indice con nombre explicito segun ADR-TMS-014 (pk_, fk_, uq_, ck_, df_, ix_), en minuscula y snake_case, sin sufijo _id en la FK.
- DATETIMEOFFSET(3) con precision explicita; nada de DATETIME2 ni UTC; literales con offset -05:00.
- NVARCHAR siempre; nunca CHAR, NCHAR ni VARCHAR.
- estado/eliminado solo donde su pregunta tiene respuesta (ADR-TMS-012): ¿se colaron por costumbre en alguna tabla transaccional o append-only?
- Intercalacion fijada explicitamente (dev Linux / prod Windows).
- CHECK de lista cerrada generado desde el enum de domain/listas-cerradas.ts, no copiado a mano.
- ¿Existe down() y revierte de verdad?
- Nombres de tabla y columna en espanol, snake_case, singular.
Compara con una migracion ejemplar de ${BASE}. Reporta cada desviacion con la linea del SQL.`,
  },
  {
    clave: 'concurrencia',
    prompt: `DIMENSION: concurrencia, bloqueo y idempotencia.
CLAUDE.md define con mucho detalle DOS mecanismos: el testigo por fila (ultimo_cambio ROWVERSION + If-Match, 409 al chocar, 400 si el If-Match esta malformado) para seis tablas maestras, y el bloqueo con caducidad (bloqueado_por / bloqueado_hasta, 120 s, renovacion cada 30 s, ck_planificacion_servicio_viaje_bloqueado) para planificacion_servicio_viaje.
Audita el codigo nuevo:
- Las tablas nuevas que introdujo la rama: ¿entran en la tabla de alcance de CLAUDE.md? ¿La decision tomada (verificar o no) esta justificada por quien ejecuta el UPDATE, como manda la regla?
- \`ofertas-de-viaje.typeorm.ts\` y \`asignador-viaje.typeorm.ts\`: dos conductores aceptando la misma oferta a la vez, o un despachador reasignando mientras el conductor acepta. ¿Hay carrera? ¿El UPDATE es compare-and-set o un read-then-write?
- \`caducar-ofertas.caso-uso.ts\`: ¿quien lo dispara? ¿Puede caducar una oferta que el conductor acaba de aceptar?
- CLAUDE.md menciona \`clave_origen\` como idempotencia del conductor: ¿esta implementada de verdad, con constraint unico, o solo comprobada en codigo (que es una carrera)?
- ¿El bloqueo con caducidad de planificacion_servicio_viaje sigue funcionando despues de que la rama amplio esa tabla (migracion AmpliarPlanificacionServicioViaje)?
- ¿Alguna escritura nueva sobre planificacion_servicio_viaje se salta la exigencia del bloqueo vigente dentro de su transaccion?`,
  },
  {
    clave: 'transacciones',
    prompt: `DIMENSION: transacciones y consistencia.
El estandar de ${BASE} (commit 51c2033, "una accion del usuario es una sola transaccion, no seis") dice que una accion del usuario es UNA transaccion.
Audita los flujos nuevos de UNITRANS: aceptar/rechazar viaje, registrar dispositivo, declarar contenedor, subir documento, marcar checkpoint, cerrar viaje.
- ¿Cada flujo abre UNA transaccion, o hace varias escrituras sueltas que pueden quedar a medias?
- ¿El manejador de transaccion viaja por el puerto como \`Transaccion = unknown\` (patron de ADR-TMS-015) o el puerto conoce \`EntityManager\` de TypeORM?
- ¿Hay escrituras al sistema de ficheros (almacen-de-archivos, foto del documento) mezcladas dentro de una transaccion de base de datos? ¿Que pasa si el commit falla despues de escribir el fichero?
- ¿Se revierte de verdad ante error, o hay \`catch\` que se tragan el fallo y dejan el estado partido?`,
  },
  {
    clave: 'pruebas',
    prompt: `DIMENSION: pruebas.
El estandar de ${BASE}: pre-push con cobertura, cada caso de uso con su .spec, las ramas de error cubiertas (commit 715a94b "las ramas de error que trajo el relato quedan cubiertas"), y una prueba de cobertura de rutas que falla si una ruta queda sin permiso.
Audita:
- Lista los ficheros nuevos de application/, api/ e infrastructure/persistence/ y di CUALES NO TIENEN .spec. Se concreto: da la lista.
- De los que si tienen, ¿cubren las ramas de error o solo el camino feliz?
- ¿Hay algun controlador nuevo sin prueba de contrato?
- ¿La prueba \`cobertura-de-rutas.spec.ts\` se modifico para dejar pasar rutas nuevas en vez de darles permiso? Compara con ${BASE} usando git diff.
- ¿Alguna prueba nueva prueba el mock en vez del comportamiento?`,
  },
  {
    clave: 'android',
    prompt: `DIMENSION: la app Android UNITRANS (apps/unitrans-android).
Lee ADR-TMS-009 y el README de la app. Audita el codigo Kotlin nuevo y modificado (buena parte esta SIN COMMITEAR: usa git status).
- Arquitectura por capas: datos/ (Api, Dtos, Repositorio, Mapeo, Modelos) frente a ui/ (pantallas, componentes, estado). ¿La UI llama a la red directamente en algun sitio? ¿Los DTO de red se filtran hasta la pantalla en vez de mapearse a modelos de dominio?
- Se borro DatosMock.kt y EstadoBandeja.kt y aparecieron ModeloViaje, ModeloConductor, EstadoDeCarga, MensajesDeError: ¿la migracion de mock a red quedo completa o hay restos?
- Manejo de error y de red: ErrorDeApi.kt, ¿se maneja sin conexion, timeout, 401, 409? ¿El conductor ve un mensaje en espanol que dice que hacer, como exige el estandar del backend?
- ¿Hay secretos, URLs de produccion o tokens en ConstantesDeLaApp.kt o en el AndroidManifest?
- Permisos nuevos en AndroidManifest y rutas_de_archivos.xml (FileProvider para la camara): ¿el alcance es minimo?
- Estilo: CLAUDE.md exige nombres en espanol y casi ningun comentario. ¿Se cumple?
- ¿La app confia en el reloj del telefono para algo que decide el servidor?`,
  },
  {
    clave: 'estilo-y-gobernanza',
    prompt: `DIMENSION: estilo obligatorio y gobernanza documental.
CLAUDE.md impone: todo en espanol salvo lo que impone la plataforma; comentarios los minimos (prohibido el que repite el codigo, los encabezados decorativos y los separadores de seccion); prohibido agregar \`title\`/tooltip por iniciativa propia.
Y el estandar de gobernanza de ${BASE}: cada decision de arquitectura nueva se escribe como ADR; los hallazgos abiertos van a GAPS.md; la deuda a DEUDAS.md.
Audita:
- Barre el codigo nuevo (backend y Android) buscando identificadores en ingles que no vengan impuestos por la plataforma, y comentarios prohibidos. Da ejemplos con fichero y linea, no una impresion general.
- La rama tomo decisiones de arquitectura nuevas: oferta de viaje con caducidad, registro de dispositivo del conductor, gesto del telefono, documentos de servicio con vigencia, modo de seguridad. ¿Alguna de esas quedo SIN ADR? El ultimo ADR es TMS-020. Comprueba si se agrego alguno en esta rama (\`git diff ${BASE}..HEAD --stat -- reference/\`).
- ¿Se modifico CLAUDE.md, GAPS.md o DEUDAS.md para acomodar el codigo nuevo en vez de al reves? Mira \`git diff CLAUDE.md GAPS.md DEUDAS.md\` y juzga si el cambio documenta un hecho o relaja una regla.
- ¿Los mensajes de error nuevos estan en espanol y dicen que hacer?`,
  },
]

log(`${DIMENSIONES.length} dimensiones en auditoria; cada hallazgo se refuta antes de sobrevivir`)

phase('Auditoria')

const resultados = await pipeline(
  DIMENSIONES,
  d => agent(`${CONTEXTO}\n\n${NORMA}\n\n${d.prompt}\n\nDevuelve como mucho 10 hallazgos, los mas graves primero. Prefiere pocos hallazgos solidos a muchos flojos. Si una dimension esta limpia, devuelve la lista vacia y no inventes nada.`,
    { label: `audita:${d.clave}`, phase: 'Auditoria', schema: ESQUEMA_HALLAZGOS, effort: 'high' }),
  (res, d) => {
    const hallazgos = (res && res.hallazgos ? res.hallazgos : []).slice(0, 10)
    if (!hallazgos.length) return []
    return parallel(hallazgos.map((h, i) =>
      () => parallel(['¿existe de verdad en el codigo, tal como se describe?', '¿la norma citada dice de verdad lo que el hallazgo afirma?'].map((lente, j) =>
        () => agent(`${CONTEXTO}\n\nEres un refutador adversarial. Tu trabajo es TUMBAR este hallazgo, no confirmarlo.

HALLAZGO (dimension ${d.clave}):
${JSON.stringify(h, null, 2)}

LENTE ASIGNADA: ${lente}

Abre el fichero citado y la norma citada y comprueba. Motivos legitimos para refutar: el codigo no dice lo que el hallazgo afirma; la linea o el fichero no existen; la norma citada no aplica a ese caso o dice otra cosa; ya hay una excepcion declarada por diseno que lo cubre (mira las exenciones nombradas de .eslintrc.cjs y .dependency-cruiser.cjs, y las excepciones escritas en los ADR); el patron que se critica es el MISMO que ${BASE} ya usa (comprueba con git show ${BASE}:fichero); o el hallazgo es una preferencia sin norma detras.
Ante la duda, refuta. Si sobrevive, ajusta la gravedad a lo que la evidencia sostiene.`,
          { label: `refuta:${d.clave}:${i}:${j}`, phase: 'Verificacion', schema: ESQUEMA_VEREDICTO })
      )).then(votos => {
        const vivos = votos.filter(Boolean)
        const refutado = vivos.length > 0 && vivos.some(v => v.refutado)
        const grav = vivos.map(v => v.gravedad_corregida).filter(Boolean)
        return { ...h, dimension: d.clave, sobrevive: !refutado, votos: vivos, gravedad: grav[0] || h.gravedad }
      })
    ))
  }
)

const todos = resultados.flat().filter(Boolean)
const confirmados = todos.filter(h => h.sobrevive)
const descartados = todos.filter(h => !h.sobrevive)
log(`${todos.length} hallazgos auditados; ${confirmados.length} sobreviven a la refutacion, ${descartados.length} caen`)

phase('Sintesis')

const critico = await agent(`${CONTEXTO}\n\n${NORMA}\n\nSe auditaron estas dimensiones: ${DIMENSIONES.map(d => d.clave).join(', ')}.
Hallazgos confirmados hasta ahora:
${JSON.stringify(confirmados.map(h => ({ dimension: h.dimension, titulo: h.titulo, archivo: h.archivo, gravedad: h.gravedad })), null, 2)}

Eres el critico de completitud. Contesta: ¿que se quedo sin mirar? Busca especificamente incumplimientos que ninguna de esas dimensiones habria encontrado. Revisa por tu cuenta el codigo nuevo y devuelve hallazgos NUEVOS que no esten ya en la lista. Se exigente con la evidencia: fichero, linea, norma.`,
  { label: 'critico-completitud', phase: 'Sintesis', schema: ESQUEMA_HALLAZGOS, effort: 'high' })

const extra = (critico && critico.hallazgos ? critico.hallazgos : []).slice(0, 8)
const extraVerificados = extra.length
  ? (await parallel(extra.map((h, i) => () =>
      agent(`${CONTEXTO}\n\nRefuta adversarialmente este hallazgo. Ante la duda, refuta.\n${JSON.stringify(h, null, 2)}`,
        { label: `refuta:critico:${i}`, phase: 'Verificacion', schema: ESQUEMA_VEREDICTO })
        .then(v => (v && !v.refutado) ? { ...h, dimension: 'completitud', sobrevive: true } : null)
    ))).filter(Boolean)
  : []

const finales = confirmados.concat(extraVerificados)

const informe = await agent(`${CONTEXTO}\n\nEres el sintetizador. Estos son los hallazgos CONFIRMADOS de la auditoria de la rama feature/unitrans-android contra el estandar de ${BASE}:

${JSON.stringify(finales, null, 2)}

Y estos fueron descartados por refutacion (no los reportes, solo usalos para no repetirlos):
${JSON.stringify(descartados.map(h => ({ titulo: h.titulo, razon: h.votos.map(v => v.razon)[0] })), null, 2)}

Escribe un informe en espanol, ordenado por gravedad, agrupado por tema. Para cada hallazgo: que se hizo, que manda el estandar de develop (con el ADR o la linea de CLAUDE.md), donde esta el fichero ejemplar que lo hace bien, y como se arregla. Al final, una seccion "Lo que si esta alineado" con lo que el codigo nuevo hace bien respecto del estandar, y una seccion "Riesgo si se mergea tal cual".
No propongas cambios de codigo concretos mas alla de una linea por hallazgo: el usuario pidio diagnostico, no arreglo.`,
  { label: 'informe', phase: 'Sintesis', effort: 'high' })

return { total: todos.length, confirmados: finales.length, descartados: descartados.length, hallazgos: finales, informe }
