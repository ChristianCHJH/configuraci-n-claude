export const meta = {
  name: 'decorar-openapi-por-modulo',
  description: 'Agrega los decoradores @Api* y los modelos de respuesta de OpenAPI, un agente por modulo',
  phases: [
    { title: 'Decorar', detail: 'un agente por modulo, archivos disjuntos' },
  ],
}

const RAIZ = 'c:/Christian/unimar_tms/apps/api'

const CONTEXTO = `
Proyecto: unimar_tms. Backend en ${RAIZ} (NestJS 11 + TypeScript estricto, arquitectura hexagonal).
Tarea global: cerrar el hallazgo "Sin OpenAPI". Ya se instalo @nestjs/swagger 11.4.7.

ANTES DE TOCAR NADA, LEE ESTOS DOS ARCHIVOS:
- ${RAIZ}/src/shared/api/documentacion-openapi.ts  (el ayudante compartido: usalo, no lo reinventes)
- ${RAIZ}/src/shared/api/respuesta-api.ts          (la forma del envelope)

El ayudante compartido exporta:
  EtiquetaApi                                  -> constantes para @ApiTags
  MetaDePaginacion, CuerpoDeError              -> clases ya documentadas
  RespuestaDocumentada({ descripcion, estado?, modelo?, forma? })
       forma: 'objeto' (por defecto) | 'lista' | 'pagina'
       modelo: la clase del contenido de 'data'. Si se omite, 'data' queda como objeto libre.
       estado: HttpStatus; por defecto 200. Usa 201 donde el handler tenga @HttpCode(HttpStatus.CREATED).
  ErroresDocumentados(...estadosHttp)          -> documenta el CuerpoDeError en cada estado
  ParametrosDePaginacion(limitePorDefecto)     -> documenta los query 'pagina' y 'limite'

REGLAS OBLIGATORIAS DEL PROYECTO (CLAUDE.md) — se verifican en la revision:
1. TODO lo que nombramos nosotros va en ESPANOL (clases, propiedades nuevas, archivos). Solo queda en
   ingles lo que impone la plataforma: decoradores de Nest/Swagger y sus propiedades
   (description, example, enum, format, nullable, required, type, summary).
2. COMENTARIOS: por defecto NINGUNO. Solo si el "por que" no se deduce leyendo el codigo, y entonces
   una linea. Prohibidos los encabezados decorativos y los separadores de seccion.
3. Prohibido agregar tooltips o cualquier cosa fuera del alcance.
4. Estilo: prettier printWidth 110, comillas simples, trailingComma 'all', punto y coma.
5. TypeScript estricto (strict, noUncheckedIndexedAccess). ESLint exige:
   - tipo de retorno explicito en toda funcion
   - 'import type' para los imports que solo son tipos (consistent-type-imports)
   - prohibido 'any'
6. NO toques domain/, application/ ni infrastructure/. Solo la carpeta api/ de tu modulo.
7. NO cambies comportamiento: ni rutas, ni codigos HTTP, ni validaciones, ni logica. Solo decoradores
   de documentacion y clases nuevas de documentacion.
8. NO agregues @ApiBearerAuth a ningun endpoint: hoy no hay guardia que exija token y seria mentir.
   El esquema de seguridad ya se declara globalmente en shared/api/montar-documentacion.ts.
9. NO ejecutes 'npx tsc', 'npx eslint' ni 'npm test': hay varios agentes trabajando en paralelo y se
   pisan el .tsbuildinfo. La verificacion la corre el orquestador al final.

QUE HAY QUE PRODUCIR EN TU MODULO:

A) MODELOS DE RESPUESTA. Los controladores devuelven interfaces del dominio (o 'unknown'), y Swagger
   no puede inferirlas. Crea las clases de documentacion en 'api/dto/' con el nombre de archivo que se
   te indica. Cada clase DEBE declarar 'implements <InterfazDelDominio>' cuando esa interfaz exista:
   asi, si el dominio cambia, el compilador rompe y la documentacion no se queda vieja.
   - Cada propiedad lleva @ApiProperty (obligatoria) o @ApiPropertyOptional (opcional), SIEMPRE con
     'description' en espanol y 'example' realista del negocio (contenedores, naves, RUC peruano, etc).
   - Como NO usamos el plugin de swagger, hay que declarar 'type' a mano siempre que no sea evidente.
   - Propiedad que puede ser null pero SIEMPRE viene: @ApiProperty({ ..., nullable: true }).
     Propiedad que puede faltar: @ApiPropertyOptional.
   - Fechas con hora: @ApiProperty({ type: String, format: 'date-time', example: '2026-08-16T14:30:00-05:00' }).
     El TMS opera solo en Peru: el offset SIEMPRE es -05:00. Nunca uses 'Z' ni otro offset en los ejemplos.
   - Identificadores: @ApiProperty({ format: 'uuid', example: '0198c500-0000-7000-8000-000000000001' }).
   - Listas cerradas: @ApiProperty({ enum: ElEnumDelDominio }).
   - Si el caso de uso devuelve un Record dinamico y no hay interfaz que implementar, documentalo con
     una 'schema' cruda dentro del decorador en vez de inventar una clase falsa.
   - Cambia el tipo de retorno del handler de 'unknown' a la clase concreta SOLO si el caso de uso ya
     devuelve exactamente esa forma y el cambio compila sin castings. Si no, deja el retorno como esta
     y usa 'modelo:' solo para documentar.

B) DTO DE ENTRADA. A cada propiedad de cada DTO de entrada de tu modulo agregale @ApiProperty o
   @ApiPropertyOptional (description + example, y 'enum' donde haya lista cerrada). No toques ni un
   solo decorador de class-validator ni el orden de las validaciones.

C) CONTROLADOR:
   - @ApiTags(EtiquetaApi.<LA_QUE_TE_TOQUE>) sobre la clase.
   - Por cada handler: @ApiOperation({ summary }) en espanol, imperativo y corto. Agrega
     'description' solo cuando haya algo que el summary no diga (por ejemplo, que el endpoint
     devuelve un archivo, o que la operacion es idempotente).
   - RespuestaDocumentada(...) con la descripcion que ya usa @MensajeRespuesta en ese handler.
   - ErroresDocumentados(...) SOLO con los estados que ese endpoint puede devolver de verdad. Para
     saberlo, LEE el caso de uso y el dominio y mira que codigos de ErrorDominio produce, y mira
     shared/api/traducir-error.ts para el mapeo codigo -> estado. Incluye siempre 500. Incluye 400
     donde haya DTO validado o ParseUUIDPipe. No pongas 401/403: todavia no hay autenticacion.
   - @ApiParam para cada :id (description, format: 'uuid').
   - @ApiQuery para CADA query que el handler lee de verdad (leelas del codigo, no las inventes);
     para 'pagina' y 'limite' usa ParametrosDePaginacion(<el valor por defecto real de ese handler>).
   - Si el handler recibe multipart, agrega @ApiConsumes('multipart/form-data') y un @ApiBody con el
     schema del formulario incluido el campo binario.
   - Si el handler devuelve un archivo con @Res(), documentalo con la respuesta binaria adecuada.

Trabaja solo sobre los archivos que se te asignan. No crees archivos fuera de tu modulo.
Al terminar, devuelve un resumen corto: archivos tocados, clases nuevas y endpoints documentados.
`

const MODULOS = [
  {
    key: 'salud',
    prompt: `${CONTEXTO}

TU MODULO: salud. Etiqueta: EtiquetaApi.SALUD.
Archivos que te tocan:
- ${RAIZ}/src/modules/salud/api/salud.controller.ts
- NUEVO: ${RAIZ}/src/modules/salud/api/dto/estado-salud.dto.ts

La interfaz 'EstadoSalud' hoy vive suelta dentro del controlador. Muevela al archivo nuevo como clase
documentada (nombre en espanol, por ejemplo 'EstadoDeSalud' con su clase anidada para 'baseDatos'),
usala como tipo de retorno del handler y borra la interfaz del controlador.`,
  },
  {
    key: 'recepcion',
    prompt: `${CONTEXTO}

TU MODULO: recepcion. Etiqueta: EtiquetaApi.RECEPCION.
Archivos que te tocan:
- ${RAIZ}/src/modules/recepcion/api/carga-archivo.controller.ts
- ${RAIZ}/src/modules/recepcion/api/dto/cargar-archivo.dto.ts
- NUEVO: ${RAIZ}/src/modules/recepcion/api/dto/respuestas-carga-archivo.dto.ts

Los tres handlers devuelven 'unknown'. Lee ${RAIZ}/src/modules/recepcion/application/consultar-cargas.caso-uso.ts
y ${RAIZ}/src/modules/recepcion/application/ingestar-reporte.caso-uso.ts (y el dominio del modulo) para
saber la forma real de: el listado paginado de cargas, el detalle fila por fila, y el resultado de la ingesta.
El POST es multipart/form-data con el campo binario 'archivo' mas los campos de CargarArchivoDto;
documentalo con @ApiConsumes y @ApiBody. Ese POST puede fallar con 409 cuando el archivo ya se cargo
(codigo ARCHIVO_YA_CARGADO) y con 413 si pasa el limite de 10 MB.`,
  },
  {
    key: 'relacion-detallada',
    prompt: `${CONTEXTO}

TU MODULO: relacion-detallada. Etiqueta: EtiquetaApi.RELACION_DETALLADA.
Archivos que te tocan:
- ${RAIZ}/src/modules/relacion-detallada/api/consolidado-nave.controller.ts
- ${RAIZ}/src/modules/relacion-detallada/api/clasificacion-carga.controller.ts
- ${RAIZ}/src/modules/relacion-detallada/api/dto/iniciar-planificacion.dto.ts
- ${RAIZ}/src/modules/relacion-detallada/api/dto/clasificar-carga.dto.ts
- NUEVO: ${RAIZ}/src/modules/relacion-detallada/api/dto/respuestas-consolidado-nave.dto.ts
- NUEVO: ${RAIZ}/src/modules/relacion-detallada/api/dto/respuestas-clasificacion-carga.dto.ts

Lee ${RAIZ}/src/modules/relacion-detallada/domain/consolidado-nave.ts para NaveConsolidada,
CargaDeRelacion, AlcanceCargas, FiltrosDeCarga y las opciones de filtro; y
${RAIZ}/src/modules/relacion-detallada/domain/clasificacion-carga.ts mas
${RAIZ}/src/modules/relacion-detallada/application/clasificar-carga.caso-uso.ts para el catalogo de
clasificaciones y el resultado de guardarlas.
Ojo con estos handlers:
- 'cargas', 'cargasDeLaNave' y 'cargasEnExcel' leen los query 'pagina', 'limite', 'documento', 'rd',
  'tipo', 'clasificacion', 'cambio', 'buscar' y 'alcance'. Documentalos uno por uno con su significado.
  'alcance' es una lista cerrada de dos valores: VERSION y NAVE.
- 'cargasEnExcel' responde un .xlsx binario con Content-Disposition, NO el envelope. Documentalo como
  respuesta binaria (content 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  schema { type: 'string', format: 'binary' }) y no uses RespuestaDocumentada ahi.
- El PUT de clasificaciones exige el valor cuando la marca lo lleva (IMO sin clase, o REFRIG sin
  temperatura, devuelven 400). Que el summary/description lo diga.`,
  },
  {
    key: 'planificacion',
    prompt: `${CONTEXTO}

TU MODULO: planificacion. Etiqueta: EtiquetaApi.PLANIFICACION.
Archivos que te tocan:
- ${RAIZ}/src/modules/planificacion/api/servicio-transporte.controller.ts
- ${RAIZ}/src/modules/planificacion/api/dto/asignar-viaje.dto.ts
- ${RAIZ}/src/modules/planificacion/api/dto/registrar-programacion.dto.ts
- NUEVO: ${RAIZ}/src/modules/planificacion/api/dto/respuestas-planificacion.dto.ts

Lee ${RAIZ}/src/modules/planificacion/domain/servicio-transporte.ts (ServicioTransporte, ResumenServicios,
CargaVinculable, FiltrosDeServicio), ${RAIZ}/src/modules/planificacion/domain/programacion.ts
(ProgramacionRegistrada), ${RAIZ}/src/modules/planificacion/domain/asignacion-viaje.ts (ViajeAsignado),
${RAIZ}/src/modules/planificacion/domain/listas-cerradas.ts y
${RAIZ}/src/modules/planificacion/application/consultar-servicios.caso-uso.ts (OpcionesDeServicio).
Los query de 'servicios' son 'pagina', 'limite', 'fase', 'operacion', 'ip', 'estado', 'buscar'.
Los de 'cargas' son 'operacion', 'buscar', 'suelta' (booleano como texto 'true') y 'limite'.
El POST de programacion y el PUT de viaje pueden fallar con 400 por regla de negocio, 404 si el
servicio no existe y 409 si el estado no admite la operacion: confirmalo leyendo los casos de uso y
documenta solo lo que sea cierto.`,
  },
  {
    key: 'mantenimientos-viaje',
    prompt: `${CONTEXTO}

TU MODULO: mantenimientos (parte de viaje). Etiqueta: EtiquetaApi.MANTENIMIENTOS.
Archivos que te tocan (NO toques ningun otro archivo de mantenimientos, hay otro agente en paralelo):
- ${RAIZ}/src/modules/mantenimientos/api/maestras-viaje.controller.ts
- ${RAIZ}/src/modules/mantenimientos/api/dto/guardar-maestras-viaje.dto.ts
- ${RAIZ}/src/modules/mantenimientos/api/dto/cambiar-estado.dto.ts
- NUEVO: ${RAIZ}/src/modules/mantenimientos/api/dto/respuestas-maestras-viaje.dto.ts

Son tres controladores en el mismo archivo: TransportistaController, ConductorController y
VehiculoRodanteController. Lee ${RAIZ}/src/modules/mantenimientos/domain/maestras-viaje.ts para
Transportista, Conductor y VehiculoRodante, y ${RAIZ}/src/modules/mantenimientos/api/consulta-listado.ts
para los query reales del listado ('pagina', 'limite', 'buscar', 'estado'), incluidos sus valores por
defecto. Lee tambien ${RAIZ}/src/modules/mantenimientos/domain/errores.ts y el caso de uso
gestionar-maestra.caso-uso.ts para saber que estados HTTP puede devolver cada operacion (por ejemplo
CLAVE_REPETIDA -> 409, MAESTRA_NO_EXISTE -> 404, RUC_INVALIDO -> 400).
El RUC del transportista es de 11 digitos y el documento del conductor de 8 a 12: que los ejemplos y
las descripciones lo reflejen.
'cambiar-estado.dto.ts' lo compartes con el otro agente pero lo documentas TU: hazlo generico, sirve
para todas las maestras.`,
  },
  {
    key: 'mantenimientos-naves',
    prompt: `${CONTEXTO}

TU MODULO: mantenimientos (parte de naves e instalaciones). Etiqueta: EtiquetaApi.MANTENIMIENTOS.
Archivos que te tocan (NO toques ningun otro archivo de mantenimientos, hay otro agente en paralelo;
en particular NO abras ni edites maestras-viaje.controller.ts, guardar-maestras-viaje.dto.ts ni
cambiar-estado.dto.ts, aunque los uses como referencia mental):
- ${RAIZ}/src/modules/mantenimientos/api/nave.controller.ts
- ${RAIZ}/src/modules/mantenimientos/api/instalacion-portuaria.controller.ts
- ${RAIZ}/src/modules/mantenimientos/api/dto/guardar-nave.dto.ts
- ${RAIZ}/src/modules/mantenimientos/api/dto/guardar-instalacion-portuaria.dto.ts
- NUEVO: ${RAIZ}/src/modules/mantenimientos/api/dto/respuestas-naves.dto.ts

'cambiar-estado.dto.ts' NO es tuyo: usalo tal cual en los @Body, no lo edites.
Lee ${RAIZ}/src/modules/mantenimientos/domain/maestras-viaje.ts (Nave, InstalacionPortuaria) y
${RAIZ}/src/modules/mantenimientos/domain/nave-viaje.ts (NaveViaje) para las formas de respuesta, y
${RAIZ}/src/modules/mantenimientos/api/consulta-listado.ts para los query reales del listado.
El viaje de nave tiene muchas fechas (eta, etb, etd, tb, td, cutoffDry, cutoffRefrigerado, fechaZarpe):
documenta cada una con lo que significa en la operacion portuaria, no repitiendo la sigla. Todas son
ISO 8601 con offset -05:00 y todas pueden venir en null.
Lee tambien ${RAIZ}/src/modules/mantenimientos/domain/errores.ts para los estados HTTP posibles
(por ejemplo VINCULO_INACTIVO cuando el viaje apunta a una nave o instalacion dada de baja).`,
  },
]

phase('Decorar')
const resultados = await parallel(
  MODULOS.map((m) => () =>
    agent(m.prompt, { label: `decorar:${m.key}`, phase: 'Decorar' }).then((r) => ({ modulo: m.key, resumen: r })),
  ),
)

return resultados.filter(Boolean)
