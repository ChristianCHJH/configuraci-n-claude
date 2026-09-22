export const meta = {
  name: 'plano-erradicar-dibujo',
  description: 'Mapear el dibujo manual de poligonos, el modelo de datos y las pantallas de plano para erradicar el marcado a mano y unificar el flujo de carga',
  phases: [
    { title: 'Mapear', detail: 'inventario paralelo de front, api, datos, ADRs y pantalla de versiones' },
    { title: 'Verificar', detail: 'que borrar cada pieza no rompa tests, contratos ni migraciones' },
  ],
}

const INVENTARIO = {
  type: 'object',
  additionalProperties: false,
  required: ['hallazgos', 'notas'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ruta', 'que_es', 'clasificacion', 'detalle'],
        properties: {
          ruta: { type: 'string', description: 'ruta relativa al repo, con lineas si aplica' },
          que_es: { type: 'string', description: 'nombre del simbolo, endpoint, columna o bloque de template' },
          clasificacion: {
            type: 'string',
            enum: ['dibujo-manual', 'reasociacion', 'realineacion', 'importacion-dxf', 'lectura-mapa', 'conciliacion', 'otro'],
          },
          detalle: { type: 'string', description: 'que hace exactamente y por que cae en esa clasificacion' },
        },
      },
    },
    notas: { type: 'string', description: 'observaciones que no encajan como hallazgo puntual' },
  },
}

phase('Mapear')

const [frontDibujo, apiDibujo, modeloDatos, adrs, pantallaVersiones] = await parallel([
  () => agent(
    `Repo: sistema inmobiliario, monorepo npm. Frontend en apps/web (Angular 18 standalone).

Objetivo: inventariar TODA la funcionalidad de DIBUJAR o MARCAR poligonos A MANO sobre el mapa del plano, para erradicarla. El cliente decidio que el sistema nunca dibuja geometria: la geometria SIEMPRE viene del DXF que manda el ingeniero.

Lee a fondo estos archivos completos (no solo grep):
- apps/web/src/app/funcionalidades/plano/plano-mapa/plano-mapa.component.ts
- apps/web/src/app/funcionalidades/plano/plano-recarga/plano-recarga.component.ts
- apps/web/src/app/funcionalidades/plano/plano-versiones/plano-versiones.component.ts
- apps/web/src/app/funcionalidades/plano/servicios/plano.service.ts
- apps/web/src/app/funcionalidades/plano/modelos/plano.modelo.ts
- apps/web/src/app/funcionalidades/plano/plano.rutas.ts

Busca ademas en todo apps/web cualquier otra referencia a poligono, marcar, dibujar, reasociar, realineacion, vertice, coordenada, svg path editable, drag de puntos.

Clasifica cada hallazgo:
- "dibujo-manual": el usuario crea o edita geometria con el mouse/teclado. ESTO SE ERRADICA.
- "reasociacion": el usuario cambia a que lote apunta un poligono ya dibujado por el DXF. NO es dibujar; marcalo aparte.
- "lectura-mapa": solo pinta/lee lo que vino del DXF. SE CONSERVA.
- "importacion-dxf" / "conciliacion" / "realineacion" / "otro" segun corresponda.

Se exhaustivo y literal: cita rutas con numero de linea. Si NO existe dibujo manual en el front, dilo explicitamente en notas en vez de inventar hallazgos.`,
    { label: 'front:dibujo-manual', phase: 'Mapear', schema: INVENTARIO },
  ),

  () => agent(
    `Repo: sistema inmobiliario, monorepo npm. Backend en apps/api (NestJS 10 + TypeORM, arquitectura hexagonal por modulo).

Objetivo: inventariar en el BACKEND toda la superficie que soporta MARCAR o DIBUJAR poligonos a mano, y separarla de la que solo importa geometria del DXF. El cliente decidio que el sistema nunca dibuja: la geometria siempre viene del DXF.

Recorre completo apps/api/src/modulos/plano/ (dominio, aplicacion, infraestructura, api) y lee entero cada archivo relevante. Presta atencion especial a:
- poligono-lote.controller.ts y todos sus endpoints
- reasociar-poligono.caso-uso.ts y reasociacion-poligono.entity.ts
- poligono-lote.entity.ts (columnas: fechaMarcado, estadoRealineacion, esNoComercializable, etc.)
- el enum EstadoRealineacion en packages/contratos
- geometria-plano.ts y su spec
- recarga-plano (iniciar/confirmar/descartar/diferencias)

Clasifica cada endpoint, caso de uso, columna y entidad:
- "dibujo-manual": permite crear o modificar coordenadas desde HTTP. SE ERRADICA.
- "reasociacion": cambia el loteId de un poligono existente sin tocar geometria.
- "realineacion": estado que dice si el dibujo calza con el lote (POR_DIVIDIR, CALZA...).
- "importacion-dxf": lee el DXF y crea poligonos.
- "lectura-mapa" / "conciliacion" / "otro".

Para cada uno indica quien lo consume (busca referencias cruzadas en apps/web, packages/contratos y apps/api/test). Cita rutas con numero de linea. Se exhaustivo.`,
    { label: 'api:dibujo-manual', phase: 'Mapear', schema: INVENTARIO },
  ),

  () => agent(
    `Repo: sistema inmobiliario. PostgreSQL 16 + TypeORM 0.3. Migraciones en apps/api/src/migraciones/.

Objetivo: analizar el MODELO DE DATOS de la geometria del plano para responder una pregunta concreta de producto:

  "Hoy un poligono SOLO existe atado a un lote de la base (poligono_lote.lote_id). El cliente quiere que el mapa dibuje TAMBIEN los poligonos del DXF que no encontraron lote, pintados en gris y no clicables, en vez de dejar el mapa en blanco. Que hace falta cambiar en el esquema para eso?"

Lee completos:
- apps/api/src/modulos/plano/infraestructura/persistencia/poligono-lote.entity.ts
- apps/api/src/modulos/plano/infraestructura/persistencia/plano-version.entity.ts
- apps/api/src/modulos/plano/infraestructura/persistencia/recarga-plano-diferencia.entity.ts
- apps/api/src/migraciones/1787097600000-InventarioYPlano.ts (busca ahi las tablas poligono_lote, plano_version, reasociacion_poligono, recarga_plano*)
- apps/api/src/modulos/plano/dominio/extraccion-dxf.ts (que devuelve exactamente por cada figura del DXF)

Reporta como hallazgos:
1. La definicion actual exacta de poligono_lote: cada columna, nullable o no, sus FK, sus indices y sus CHECK.
2. Que impide hoy guardar geometria sin lote (constraint concreto, con su nombre si aparece en la migracion).
3. Que informacion trae extraerLotesDelDxf por figura (manzana rotulada, numero, coordenadas, vendible, revisar) y cual de esos campos sobrevive hoy y cual se descarta.
4. Las opciones de esquema para permitir un poligono huerfano, con su costo: (a) lote_id nullable en poligono_lote, (b) tabla nueva poligono_sin_lote, (c) otra. Para cada una: que indices/CHECK/unicidad se rompen o hay que rehacer.

El proyecto obliga: id BIGINT GENERATED ALWAYS AS IDENTITY, columnas de auditoria, borrado logico, indices unicos parciales con WHERE eliminado = false. Ten eso en cuenta al proponer.

Cita rutas con numero de linea. Se preciso con los nombres reales de columnas y constraints.`,
    { label: 'datos:poligono-sin-lote', phase: 'Mapear', schema: INVENTARIO },
  ),

  () => agent(
    `Repo: sistema inmobiliario. Documentacion de decisiones en docs/adr/.

Objetivo: identificar que ADRs vigentes gobiernan el modulo de plano y cuales quedarian contradichos por estos tres cambios de producto:

  A. El sistema NUNCA dibuja geometria a mano. Toda la geometria viene del DXF del ingeniero. Se erradica el marcado manual de poligonos.
  B. Subir una version de DXF e importar sus poligonos pasan a ser UNA SOLA accion, no dos clics.
  C. El mapa dibuja tambien los poligonos que no encontraron lote, en gris y no clicables, en vez de quedar en blanco.

Lista los archivos de docs/adr/ y lee completos los que toquen plano, poligonos, mapa, coloreado, lotes o inventario. Presta atencion a ADR-010 (la UI lo cita como el ADR del coloreado por estado de venta) y a cualquiera que hable de planos o versiones.

Lee tambien CLAUDE.md en la raiz (la seccion "Como evolucionan estas reglas") para saber el procedimiento exacto que el proyecto exige al cambiar una decision.

Reporta como hallazgos: cada ADR relevante con su numero, titulo, estado (vigente/superado), y que parrafo concreto queda afectado por A, B o C. Cita el texto literal del parrafo afectado. En notas: el procedimiento que manda CLAUDE.md para cambiar esto y si hace falta ADR nuevo o enmienda de uno existente.`,
    { label: 'adr:decisiones-afectadas', phase: 'Mapear', schema: INVENTARIO },
  ),

  () => agent(
    `Repo: sistema inmobiliario. Frontend Angular 18 en apps/web.

Objetivo: preparar el rediseno de la tabla "Historial de versiones" de la pantalla /planos/:id/versiones. El cliente quiere que cada fila del historial muestre, ademas de lo que ya muestra, la conciliacion entre el plano y los lotes registrados: cuantos poligonos trajo el DXF, cuantos calzaron con un lote registrado, y cuantos lotes quedaron sin dibujo. Y un mensaje verde cuando todo calza.

Averigua exactamente que datos existen HOY y cuales faltan:

1. Lee apps/web/src/app/funcionalidades/plano/plano-versiones/plano-versiones.component.ts entero. Documenta la tabla actual: cada columna, de que campo sale.
2. Lee el tipo PlanoVersion en apps/web/.../modelos/plano.modelo.ts y en packages/contratos. Que campos trae hoy el GET /planos/:id/versiones?
3. Lee apps/api/src/modulos/plano/aplicacion/listar-versiones-de-plano.caso-uso.ts y su repositorio typeorm. Devuelve algun conteo de poligonos? Hace join?
4. Lee el tipo ResumenImportacion en packages/contratos y el caso de uso importar-poligonos-del-dxf.caso-uso.ts. Que cifras calcula y cuales tira.
5. Busca en apps/api si existe algun metodo del repositorio de poligonos que cuente por version (contarDeVersion, listarDeVersion, etc.) en poligono-lote.repositorio.typeorm.ts y su puerto.
6. Lee apps/api/src/modulos/lote/aplicacion/listar-ids-de-lotes-del-tramo.caso-uso.ts y listar-lotes-pintados.caso-uso.ts.

Reporta como hallazgos, con ruta y linea: que dato ya existe y se puede mostrar sin tocar backend, y que dato exige un cambio de API (di cual: nuevo campo en la respuesta, nuevo endpoint, o join nuevo).`,
    { label: 'ui:historial-conciliacion', phase: 'Mapear', schema: INVENTARIO },
  ),
])

phase('Verificar')

const inventarios = [frontDibujo, apiDibujo, modeloDatos, adrs, pantallaVersiones].filter(Boolean)
const candidatosABorrar = inventarios
  .flatMap((inv) => inv.hallazgos ?? [])
  .filter((h) => h.clasificacion === 'dibujo-manual' || h.clasificacion === 'reasociacion')

log(`Candidatos a erradicar: ${candidatosABorrar.length}`)

const IMPACTO = {
  type: 'object',
  additionalProperties: false,
  required: ['veredicto', 'rompe', 'huerfanos', 'recomendacion'],
  properties: {
    veredicto: {
      type: 'string',
      enum: ['borrar-limpio', 'borrar-con-arrastre', 'conservar'],
      description: 'borrar-limpio: nada mas lo usa. borrar-con-arrastre: hay que borrar tambien lo listado en huerfanos. conservar: el cliente lo necesita aunque parezca dibujo manual.',
    },
    rompe: {
      type: 'array',
      description: 'tests, specs de arquitectura, contratos o migraciones que fallarian al borrarlo',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ruta', 'por_que'],
        properties: { ruta: { type: 'string' }, por_que: { type: 'string' } },
      },
    },
    huerfanos: {
      type: 'array',
      description: 'simbolos, tipos, columnas o archivos que quedarian sin uso y hay que borrar en el mismo commit',
      items: { type: 'string' },
    },
    recomendacion: { type: 'string' },
  },
}

const verificado = await parallel(
  candidatosABorrar.slice(0, 6).map((c) => () =>
    agent(
      `Repo: sistema inmobiliario, monorepo npm (apps/api NestJS, apps/web Angular, packages/contratos).

Un inventario previo marco esta pieza como candidata a ERRADICAR porque parece soportar el dibujo manual de poligonos:

  Ruta: ${c.ruta}
  Que es: ${c.que_es}
  Clasificacion previa: ${c.clasificacion}
  Detalle: ${c.detalle}

Contexto de la decision del cliente: el sistema NUNCA dibuja geometria. El plano lo hace el ingeniero en AutoCAD, la municipalidad se lleva ese plano, y el sistema solo consume el DXF. Todo lo que permita crear o editar geometria desde la app sobra. PERO: corregir a que lote apunta un poligono que el DXF si dibujo NO es dibujar geometria, y podria ser necesario porque el emparejamiento por texto rotulado es fragil.

Tu trabajo es ADVERSARIAL: intenta demostrar que borrar esta pieza ROMPE algo o que NO deberia borrarse.

1. Lee el archivo completo.
2. Busca TODAS las referencias al simbolo en apps/api, apps/web, packages/contratos y apps/api/test. Usa grep sobre el nombre exacto y sobre variantes.
3. Revisa apps/api/test/arquitectura.spec.ts y apps/api/test/cobertura-pruebas.spec.ts: hay reglas mecanicas que fallan si desaparece un archivo de dominio o su spec hermano.
4. Revisa si alguna columna suya vive en una migracion ya corrida (apps/api/src/migraciones/): borrarla exige migracion nueva, no editar la vieja.
5. Decide: es dibujo manual de verdad, o es lectura/importacion/reasociacion disfrazada?

Se estricto. Si tienes duda de si el cliente lo necesita, veredicto "conservar" y explica por que en recomendacion.`,
      { label: `verificar:${c.que_es}`, phase: 'Verificar', schema: IMPACTO },
    ).then((v) => ({ candidato: c, impacto: v })),
  ),
)

return {
  frontDibujo,
  apiDibujo,
  modeloDatos,
  adrs,
  pantallaVersiones,
  erradicacionVerificada: verificado.filter(Boolean),
  totalCandidatos: candidatosABorrar.length,
}
