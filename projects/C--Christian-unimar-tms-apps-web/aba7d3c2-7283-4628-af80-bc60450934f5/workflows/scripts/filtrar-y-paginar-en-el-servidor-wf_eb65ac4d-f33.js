export const meta = {
  name: 'filtrar-y-paginar-en-el-servidor',
  description: 'Mueve filtro y paginacion del navegador al servidor en las pantallas que los hacen en memoria',
  phases: [
    { title: 'Backend', detail: 'filtros nuevos donde el servidor no los tiene' },
    { title: 'Frontend', detail: 'cada pantalla pide al servidor en vez de filtrar el lote' },
    { title: 'Verificar', detail: 'revision adversarial del resultado' },
  ],
}

const API = 'c:/Christian/unimar_tms/apps/api'
const WEB = 'c:/Christian/unimar_tms/apps/web'

const REGLAS = `
REGLAS OBLIGATORIAS DEL PROYECTO (CLAUDE.md). Se verifican en la revision:
1. TODO lo que nombramos nosotros va en ESPANOL: variables, funciones, clases, archivos, columnas.
   Solo queda en ingles lo que impone la plataforma (decoradores de Nest/Swagger y sus propiedades,
   propiedades de librerias como className/children/queryKey, el prefijo 'use' de los hooks).
2. COMENTARIOS: por defecto NINGUNO. Solo si el "por que" no se deduce leyendo el codigo, y entonces
   una linea corta. Prohibidos encabezados decorativos y separadores de seccion.
3. PROHIBIDO agregar 'title' o cualquier tooltip por iniciativa propia.
4. Arquitectura hexagonal: domain / application / infrastructure / api. El caso de uso NO conoce el
   ORM ni HTTP; el SQL vive en el adaptador; el controlador solo desenvuelve.
5. Errores como valor con neverthrow. Nada de throw como control de flujo.
6. Tiempo: DATETIMEOFFSET(3) y offset SIEMPRE -05:00. Un literal SQL de fecha va con su offset
   ('2026-08-16 00:00:00 -05:00'); sin el, SQL Server asume +00:00 y el filtro se corre 5 horas en
   silencio. El backend nunca acepta una fecha-hora sin offset.
7. SQL: parametros, jamas concatenacion de valores en la cadena.
8. Estilo backend: prettier printWidth 110, comillas simples, punto y coma. Estilo frontend: igual
   pero SIN punto y coma.
9. TypeScript estricto (strict, noUncheckedIndexedAccess). ESLint exige tipo de retorno explicito,
   'import type' para tipos, y prohibe 'any'.
10. NO ejecutes 'npx tsc', 'npx eslint', 'npm test' ni 'npm run build': hay varios agentes en
    paralelo y se pisan. La verificacion la corre el orquestador al final.
`

const CONTRATO = `
CONTRATO DE PAGINACION YA IMPLEMENTADO (no lo cambies, usalo):
${API}/src/shared/api/consulta-paginada.ts exporta pagina(consulta), limite(consulta, porDefecto),
texto(consulta, clave), booleano(consulta, clave), entero(consulta, clave), LIMITE_MAXIMO = 100 y el
tipo Consulta. El limite se recorta al tope de 100. Los controladores ya lo usan.

La respuesta paginada viaja en el envelope estandar con
meta: { total, page, limit, totalPages } — 'total' son las filas que cumplen el FILTRO, sin paginar.

Para documentar en OpenAPI usa los ayudantes de
${API}/src/shared/api/documentacion-openapi.ts: RespuestaDocumentada, ErroresDocumentados,
ParametrosDePaginacion(porDefecto), EtiquetaApi. Mira como lo hacen los controladores existentes.
`

const ESQUEMA_ETAPA = {
  type: 'object',
  properties: {
    resumen: { type: 'string' },
    archivos: { type: 'array', items: { type: 'string' } },
    contrato: { type: 'string', description: 'Query params exactos que quedaron expuestos' },
    riesgos: { type: 'array', items: { type: 'string' } },
  },
  required: ['resumen', 'archivos', 'contrato', 'riesgos'],
}

const FUNCIONALIDADES = [
  {
    key: 'recepcion',
    backend: `${REGLAS}${CONTRATO}

TU TRABAJO (backend, modulo recepcion de ${API}):
La bandeja 'GET /carga-archivo' hoy solo pagina: no filtra nada. El navegador se trae 200 filas y
filtra en memoria, y por eso el conteo del pie miente. Hay que mover ese filtro al servidor.

Filtros que el servidor tiene que aceptar, con estos nombres exactos de query:
- origen   -> EXCEL | SAP
- estado   -> el estado del proceso de la carga (mira el enum del dominio para los valores reales)
- desde    -> dia en formato YYYY-MM-DD, INCLUSIVE
- hasta    -> dia en formato YYYY-MM-DD, INCLUSIVE
- buscar   -> texto parcial sobre el nombre del archivo, el usuario, el id y el id de requerimiento

Ojo con las fechas: la columna es DATETIMEOFFSET(3) y todo se guarda con offset -05:00, que es el dia
de Lima. Filtra de forma que el indice sirva (comparando la columna contra limites con offset), no
envolviendo la columna en un CAST que la vuelva no sargable. 'hasta' es INCLUSIVE: el 16 tiene que
incluir todo el 16.

Recorre la cadena completa: el puerto en domain/puertos/consulta-de-cargas.ts (un tipo para los
filtros), el caso de uso, el adaptador
${API}/src/modules/recepcion/infrastructure/persistence/consulta-de-cargas.typeorm.ts (el SQL, y el
COUNT tiene que contar CON el filtro aplicado, si no 'total' sigue mintiendo), y el controlador.
Documenta cada query nuevo con @ApiQuery y agrega o ajusta las pruebas del controlador
(${API}/src/modules/recepcion/api/carga-archivo.controller.spec.ts) para que fallen si un filtro deja
de llegar al caso de uso.

Un filtro que no viene es null y no restringe nada. Un filtro con un valor que no existe en la lista
cerrada no puede reventar la consulta: decide y justifica que hace (ignorarlo o devolver vacio).

DEVUELVE en 'contrato' la lista exacta de query params con sus valores validos.`,
    frontend: `${REGLAS}

TU TRABAJO (frontend, ${WEB}): la pantalla de carga de archivo.

Archivos: ${WEB}/src/funcionalidades/carga-archivo/ (pagina bandeja-carga-archivo.tsx, y api/*.ts).

Hoy la pantalla pide LOTE_SERVIDOR = 200 filas y hace TODO en memoria: filtra por origen, estado,
rango de fechas y busqueda, y despues pagina con slice(). El pie dice cuantas filas hay del lote, no
cuantas hay de verdad. Eso es lo que hay que cerrar.

El backend YA quedo listo en esta misma tanda y acepta los filtros. Este es el contrato que dejo:
{{CONTRATO}}

Que tiene que quedar:
- La pantalla manda pagina, limite y los filtros al servidor. Se acabo el LOTE_SERVIDOR de 200 y se
  acabo el slice() en memoria.
- El limite lo elige la persona usuaria con el selector que ya existe; respeta ese control.
- El pie tiene que decir la verdad: el total sale de meta.total, que ya viene filtrado.
- La caja de busqueda NO puede disparar una peticion por tecla. Ponle un retardo (unos 300 ms) antes
  de consultar. Si ya hay un patron de retardo en el repositorio, reusalo; si no, escribe un hook en
  espanol y dejalo donde se pueda reusar.
- Cambiar cualquier filtro vuelve a la pagina 1.
- Las query keys de React Query tienen que incluir pagina, limite y los filtros, para que cada
  combinacion tenga su entrada en cache. Mira como lo hace
  ${WEB}/src/funcionalidades/planificacion-citas/api/planificacion-citas.consultas.ts, que ya filtra
  en el servidor, y sigue ESE patron.
- Al cambiar de pagina o de filtro no puede parpadear la tabla en vacio si ya hay datos; mira si el
  repositorio usa placeholderData/keepPreviousData y sigue lo que ya haya.

Actualiza las pruebas de la pantalla (bandeja-carga-archivo.prueba.tsx) para que verifiquen que el
filtro viaja al servidor (el servidor simulado puede leer la URL de la peticion) en vez de verificar
que se filtro en memoria. NO borres aserciones ni marques pruebas como omitidas.`,
  },
  {
    key: 'relacion-detallada',
    backend: `${REGLAS}${CONTRATO}

TU TRABAJO (backend, modulo relacion-detallada de ${API}):
'GET /relacion-detallada/naves' hoy solo pagina. El navegador se trae 200 naves, filtra en memoria
por operacion, instalacion portuaria y busqueda, y ademas ARMA EL SELECTOR de instalaciones con lo
que vino en ese lote. Las dos cosas se rompen en cuanto hay mas de 200 naves.

1. Filtros que el servidor tiene que aceptar, con estos nombres exactos de query:
   - operacion -> IMPORTACION | EXPORTACION
   - ip        -> codigo de la instalacion portuaria; ademas el valor especial SIN_INSTALACION para
                  quedarse con las naves que no tienen ninguna
   - buscar    -> texto parcial sobre el nombre de la nave, el viaje y el manifiesto
   El COUNT tiene que contar CON el filtro aplicado.

2. Un endpoint nuevo para poblar el selector sin depender del lote:
   'GET /relacion-detallada/naves/opciones' que devuelva las instalaciones portuarias presentes en el
   consolidado y si hay naves sin instalacion. Fijate en como esta resuelto
   'GET /relacion-detallada/:id/cargas/opciones' y sigue ese mismo patron y estilo.
   CUIDADO con el orden de las rutas en el controlador: 'naves/opciones' no puede quedar capturada
   por otra ruta con parametro.

Recorre la cadena completa: el dominio (${API}/src/modules/relacion-detallada/domain/consolidado-nave.ts
ya tiene un tipo de filtros para las cargas; para las naves hace falta el suyo), el puerto
domain/puertos/consulta-consolidado-nave.ts, el caso de uso, el adaptador con el SQL, y el
controlador con sus @ApiQuery y su modelo de respuesta documentado. Agrega pruebas de controlador que
fallen si un filtro deja de llegar al caso de uso.

DEVUELVE en 'contrato' la lista exacta de query params y la forma exacta que devuelve el endpoint
nuevo de opciones.`,
    frontend: `${REGLAS}

TU TRABAJO (frontend, ${WEB}): la pantalla de consolidado por nave.

Archivos: ${WEB}/src/funcionalidades/consolidado-nave/ (pagina consolidado-nave.tsx y api/*.ts).

Hoy pide LOTE_SERVIDOR = 200 naves, filtra en memoria por operacion, instalacion y busqueda, pagina
con slice(), y ARMA EL SELECTOR de instalaciones recorriendo las naves del lote. Las tres cosas se
rompen pasadas 200 naves.

El backend YA quedo listo en esta misma tanda. Este es el contrato que dejo:
{{CONTRATO}}

Que tiene que quedar:
- Filtro y paginacion al servidor. Se acaba el LOTE_SERVIDOR y el slice().
- El selector de instalaciones se puebla con el endpoint de opciones, no con las filas de la pagina.
  Conserva la opcion de "sin instalacion" si el servidor dice que hay naves asi.
- El pie dice la verdad, con meta.total.
- La busqueda con retardo (unos 300 ms), sin una peticion por tecla.
- Cambiar cualquier filtro vuelve a la pagina 1.
- Query keys jerarquicas que incluyan pagina, limite y filtros. Sigue el patron de
  ${WEB}/src/funcionalidades/planificacion-citas/api/planificacion-citas.consultas.ts.
- Las filas desplegables (las versiones de cada nave) tienen que seguir funcionando igual.

Actualiza consolidado-nave.prueba.tsx para verificar que el filtro viaja al servidor. NO borres
aserciones ni marques pruebas como omitidas.`,
  },
  {
    key: 'mantenimientos',
    backend: null,
    frontend: `${REGLAS}

TU TRABAJO (frontend, ${WEB}): las seis pantallas de mantenimientos.

El marco compartido ${WEB}/src/funcionalidades/mantenimientos/compartido/marco-mantenimiento.tsx
recibe todas las filas y filtra en memoria por busqueda y por estado. Ademas NO PAGINA: pinta todas
las filas que pasan el filtro. Cada pantalla
(conductores, transportistas, vehiculos-rodantes, naves, naves-viaje, instalaciones-portuarias) pide
LOTE_SERVIDOR = 200.

El backend YA acepta los filtros desde antes, y ahora recorta el limite al tope de 100:
  GET /mantenimientos/<maestra>?pagina=1&limite=50&buscar=<texto>&estado=true|false
  'estado' ausente = todas; 'true' = activas; 'false' = inactivas.
  La respuesta trae meta: { total, page, limit, totalPages }, con 'total' ya filtrado.
Confirmalo leyendo ${API}/src/modules/mantenimientos/api/ antes de escribir nada.

Que tiene que quedar:
- El marco deja de filtrar en memoria: la busqueda y el estado suben como parametros de la consulta.
- El marco PAGINA. Hoy no hay paginacion en estas pantallas: hay que agregarla, y tiene que verse
  igual que la de las pantallas que ya paginan. Mirate
  ${WEB}/src/funcionalidades/planificacion-citas/paginas/planificacion-citas.tsx y reusa su forma
  (los mismos controles, el mismo pie); si el control de paginacion se puede extraer a
  ${WEB}/src/compartido/componentes para que lo usen las dos, mejor — pero solo si sale limpio y sin
  cambiar como se ve ninguna de las dos.
- El pie dice la verdad, con meta.total.
- La busqueda con retardo (unos 300 ms), sin una peticion por tecla.
- Cambiar busqueda o estado vuelve a la pagina 1.
- Query keys que incluyan pagina, limite, busqueda y estado. Sigue el patron de
  ${WEB}/src/funcionalidades/planificacion-citas/api/planificacion-citas.consultas.ts.
- Ojo: al cambiar el estado de una ficha (activar/desactivar) hay que invalidar la consulta de la
  pagina en la que estamos, no una key vieja.

Las seis pantallas comparten el marco, asi que el grueso del cambio va ahi. Actualiza
mantenimientos.prueba.tsx y guardar-maestra.prueba.tsx para verificar que el filtro viaja al
servidor. NO borres aserciones ni marques pruebas como omitidas.`,
  },
]

const resultados = await pipeline(
  FUNCIONALIDADES,
  (funcionalidad) => {
    if (funcionalidad.backend === null) return { contrato: 'El servidor ya aceptaba los filtros.' }
    return agent(funcionalidad.backend, {
      label: `backend:${funcionalidad.key}`,
      phase: 'Backend',
      schema: ESQUEMA_ETAPA,
    })
  },
  (backend, funcionalidad) =>
    agent(funcionalidad.frontend.replace('{{CONTRATO}}', backend?.contrato ?? 'sin cambios'), {
      label: `frontend:${funcionalidad.key}`,
      phase: 'Frontend',
      schema: ESQUEMA_ETAPA,
    }).then((frontend) => ({ funcionalidad: funcionalidad.key, backend, frontend })),
)

phase('Verificar')

const ESQUEMA_VEREDICTO = {
  type: 'object',
  properties: {
    correcto: { type: 'boolean' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archivo: { type: 'string' },
          problema: { type: 'string' },
          gravedad: { type: 'string', enum: ['alto', 'medio', 'bajo'] },
        },
        required: ['archivo', 'problema', 'gravedad'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['correcto', 'hallazgos', 'resumen'],
}

const utiles = resultados.filter(Boolean)

const LENTES = [
  {
    key: 'verdad-del-conteo',
    prompt: `Lente: EL CONTEO Y LA PAGINACION DICEN LA VERDAD. Corre 'git diff' y 'git status' en
c:/Christian/unimar_tms. Comprueba leyendo el codigo y el SQL: que el COUNT del servidor cuente CON
el filtro aplicado en cada listado tocado; que el pie de cada pantalla salga de meta.total y no del
largo del arreglo local; que no quede ningun slice() ni filter() de paginacion o filtrado en las
pantallas tocadas; que no quede ningun lote de 200. Busca especificamente los casos borde: la ultima
pagina, un filtro que no devuelve nada, y cambiar de filtro estando en una pagina alta. Intenta
REFUTAR que este cerrado.`,
  },
  {
    key: 'fechas-y-sql',
    prompt: `Lente: FECHAS Y SQL. Corre 'git diff' en c:/Christian/unimar_tms/apps/api. El TMS opera
solo en Peru con offset fijo -05:00 y las columnas son DATETIMEOFFSET(3). Comprueba: que ningun
literal de fecha en SQL quede sin offset (sin el, SQL Server asume +00:00 y el filtro se corre 5
horas en silencio); que 'hasta' sea INCLUSIVE de verdad, incluida la ultima milesima del dia; que no
haya concatenacion de valores dentro de la cadena SQL (tiene que ser todo por parametro); y que el
filtro no vuelva la columna no sargable envolviendola en funciones. Escribe tu mismo las consultas de
prueba que hagan falta para convencerte. Intenta REFUTAR.`,
  },
  {
    key: 'peticiones-y-cache',
    prompt: `Lente: PETICIONES Y CACHE DEL FRONT. Corre 'git diff' en c:/Christian/unimar_tms/apps/web.
Comprueba: que la caja de busqueda tenga retardo real y no dispare una peticion por tecla; que las
query keys incluyan pagina, limite y TODOS los filtros (si falta uno, dos filtros distintos comparten
entrada de cache y se muestran datos de otro filtro); que cambiar un filtro vuelva a la pagina 1 y no
deje pidiendo una pagina que ya no existe; que invalidar tras una mutacion alcance la consulta de la
pagina actual; y que no parpadee la tabla en vacio al cambiar de pagina. Intenta REFUTAR.`,
  },
  {
    key: 'estilo',
    prompt: `Lente: REGLAS DEL PROYECTO. Corre 'git diff' en c:/Christian/unimar_tms.
${REGLAS}
Busca: nombres en ingles que deberian ir en espanol, comentarios que sobran, tooltips agregados sin
pedirlo, logica de negocio que se colo al controlador o al caso de uso conociendo el ORM, duplicacion
de algo que ya existia en compartido/, pruebas debilitadas u omitidas, y codigo muerto (constantes
que quedaron sin uso, como los LOTE_SERVIDOR). Intenta REFUTAR que cumpla.`,
  },
]

const veredictos = await parallel(
  LENTES.map((lente) => () =>
    agent(
      `${lente.prompt}\n\nContexto de lo que reportaron quienes implementaron:\n${JSON.stringify(utiles, null, 2)}`,
      { label: `verificar:${lente.key}`, phase: 'Verificar', schema: ESQUEMA_VEREDICTO },
    ).then((v) => ({ lente: lente.key, ...v })),
  ),
)

return { implementacion: utiles, veredictos: veredictos.filter(Boolean) }
