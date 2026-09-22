export const meta = {
  name: 'estado-modulos-entrega-1',
  description: 'Inventaria el estado real del codigo por modulo funcional de la Entrega 1 y separa desarrollo de carga de datos',
  phases: [
    { title: 'Inventariar', detail: 'cinco agentes barren el codigo por grupo de modulos' },
    { title: 'Refutar', detail: 'un escéptico intenta tumbar cada "cerrado"' },
  ],
}

const REPO = 'C:/Users/Christian/Proyectos/inmobiliaria-sistema'
const PROD = 'C:/Users/Christian/Proyectos/inmobiliaria/3-producto'
const SP = 'C:/Users/CHRIST~1/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria-sistema/d183a1c8-0585-4ee5-8e5f-8b91140a2366/scratchpad'

const CONTEXTO = `
QUE SE ESTA MIDIENDO
Sistema de gestion inmobiliaria. Hay que reportar, MODULO POR MODULO, cuanto del desarrollo de la ENTREGA 1 esta realmente construido en el codigo, mirando el codigo y no la documentacion.

CODIGO: ${REPO}
- Backend NestJS hexagonal en apps/api/src/modulos/<modulo>/ con subcarpetas dominio/ aplicacion/ infraestructura/persistencia/ api/
- Migraciones en apps/api/src/migraciones/
- Pruebas en apps/api/test/ y archivos *.spec.ts hermanos en dominio/
- Frontend Angular 18 standalone en apps/web/src/app/funcionalidades/<funcionalidad>/
- El menu vivo esta en apps/web/src/app/layout/barra-lateral.component.ts (si una pantalla no esta en el menu ni en un *.rutas.ts, no existe para el usuario)
- Tipos compartidos en packages/contratos/
- Reglas del proyecto en ${REPO}/CLAUDE.md y decisiones en ${REPO}/docs/adr/

BACKLOG: ${PROD}/epicas.md y ${PROD}/historias/E00..E17.
FLUJO DE LA ENTREGA 1: ${SP}/pasos-por-hito.tsv -> columnas id, banda, hito (11-SET o 2-OCT), titulo, escribe (tablas), lee (tablas). Son los 109 pasos que entran a la Entrega 1, ya clasificados en los dos hitos contratados:
- 11-SET = muestra de la semana 5 (viernes 11 de setiembre de 2026): proyectos y lotes, clientes, usuarios y permisos, separacion, contrato y cronograma.
- 2-OCT = Entrega 1 de la semana 8 (viernes 2 de octubre de 2026): registro de pagos y estado de cuenta, mora, vista consolidada de las dos razones sociales, plano interactivo.

COMO SE CALCULA EL PORCENTAJE (obligatorio, identico para todos, sin inventar otra escala)
Cada modulo se puntua sobre 100 con estos cinco pesos. Si una dimension no aplica al modulo, se reparte su peso proporcionalmente entre las que si aplican y se dice en 'notas'.
- 25 esquema: entidad TypeORM + migracion aplicada, con las columnas que el flujo pide
- 25 aplicacion: casos de uso del modulo (crear, listar, obtener, actualizar, dar de baja y los propios del negocio)
- 20 api: endpoints expuestos en el controller
- 20 frontend: pantalla Angular real, enrutada y alcanzable desde el menu
- 10 pruebas: spec de integracion del controller y/o specs de dominio
Puntua lo que EXISTE en el codigo. Media construccion es media puntuacion, no cero ni cien. Cita rutas de archivo concretas.

DESARROLLO NO ES CARGA DE DATOS (esto es central para el reporte)
Separa siempre dos cosas distintas:
(a) DESARROLLO: escribir el codigo que hace posible algo.
(b) CARGA DE DATOS / PUESTA A PUNTO: sentarse a meter la informacion real del cliente en un sistema que ya funciona (sembrar catalogos, dar de alta las dos razones sociales, cargar los ~20 usuarios, subir el Excel de lotes de los 8 tramos, subir el DXF y sus planos, cargar la lista de precios, marcar los lotes bloqueados). Eso no suma ni resta al porcentaje de desarrollo: va en su propia lista, con quien lo hace y de que depende.
Para cada modulo, si tiene trabajo de carga asociado, declaralo en 'carga_de_datos'.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['modulos', 'notas'],
  properties: {
    modulos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['modulo', 'hito', 'epicas', 'porcentaje', 'estado', 'esquema', 'aplicacion', 'api', 'frontend', 'pruebas', 'construido', 'pendiente', 'carga_de_datos', 'evidencia'],
        properties: {
          modulo: { type: 'string', description: 'nombre funcional corto, en español' },
          hito: { type: 'string', enum: ['11-SET', '2-OCT', 'AMBOS'] },
          epicas: { type: 'string', description: 'historias que lo cubren, ej "E02-01, E02-02"' },
          porcentaje: { type: 'integer', minimum: 0, maximum: 100 },
          estado: { type: 'string', enum: ['cerrado', 'avanzado', 'a-medias', 'sin-empezar'] },
          esquema: { type: 'integer', minimum: 0, maximum: 25 },
          aplicacion: { type: 'integer', minimum: 0, maximum: 25 },
          api: { type: 'integer', minimum: 0, maximum: 20 },
          frontend: { type: 'integer', minimum: 0, maximum: 20 },
          pruebas: { type: 'integer', minimum: 0, maximum: 10 },
          construido: { type: 'string', description: 'que existe de verdad, concreto' },
          pendiente: { type: 'string', description: 'que falta para poder llamarlo cerrado' },
          carga_de_datos: { type: 'string', description: 'trabajo de puesta a punto asociado, o "-" si no hay' },
          evidencia: { type: 'string', description: 'rutas de archivo que sustentan el puntaje' },
        },
      },
    },
    notas: { type: 'string' },
  },
}

phase('Inventariar')

const GRUPOS = [
  {
    key: 'plataforma',
    prompt: `TU GRUPO: PLATAFORMA Y ACCESO.
Modulos a reportar por separado: (1) cimientos y despliegue (monorepo, Docker, migraciones, respuesta HTTP estandarizada, salud); (2) autenticacion y sesiones (login, refresco, cierre, bloqueo por intentos, recuperacion de contrasena por correo); (3) usuarios; (4) roles y permisos; (5) bitacora de auditoria; (6) archivos; (7) correo.
Mira apps/api/src/modulos/{autenticacion,autorizacion,usuario,bitacora,archivo,correo,salud}/ y apps/web/src/app/funcionalidades/{autenticacion,usuario,rol,permiso,bitacora,mi-cuenta,estado}/. Revisa tambien apps/api/src/comun/ y la infraestructura (docker, infra/).`,
  },
  {
    key: 'administracion',
    prompt: `TU GRUPO: ADMINISTRACION GENERAL.
Modulos a reportar por separado: (1) empresas y razones sociales, con cuentas bancarias, series de comprobante y configuracion del facturador; (2) catalogo de conceptos de cobro y su razon social emisora; (3) parametros generales del negocio y los catalogos base que sostienen la integridad (banco, moneda, medio de pago, tipo de comprobante, tipo de documento, tramos de mora, plantillas, requisitos documentales); (4) porcentaje de comision por asesor.
Mira apps/api/src/modulos/empresa/ y busca en TODO apps/api/src si existen entidades o modulos para concepto_cobro, cuenta_bancaria, serie_comprobante, parametro, banco, moneda, medio_pago, tipo_comprobante, tramo_mora, comision_asesor. Que no exista es un resultado valido y hay que decirlo con claridad. Cruza con los pasos P02, P03, P04 y P05 de ${SP}/pasos-por-hito.tsv y con la historia E01.`,
  },
  {
    key: 'inventario',
    prompt: `TU GRUPO: INVENTARIO COMERCIAL.
Modulos a reportar por separado: (1) jerarquia proyecto-etapa-ampliacion-manzana; (2) lotes (alta unitaria, medidas, area, porcentaje de acciones y derechos, colindancias por lado); (3) tipos de unidad y areas no comercializables; (4) carga masiva de lotes por Excel; (5) lista de precios y precio por lote; (6) bloqueo de lote y reserva de evento; (7) estados del lote, sus transiciones y el historial de cambios de estado.
Mira apps/api/src/modulos/{proyecto,lote}/ completos, apps/api/src/migraciones/1787097600000-InventarioYPlano.ts, apps/web/src/app/funcionalidades/{proyecto,lote}/ y el menu. Verifica si existen colindancia_lote, lista_precio, recargo_ubicacion, precio_lote, bloqueo_lote, reserva_evento, reserva_evento_lote, lote_estado_historial y transicion_estado_lote. Revisa que columnas lee de verdad el Excel de carga masiva (apps/api/src/modulos/lote/dominio/lectura-de-lotes-tabulados.ts). Cruza con los pasos P06 a P10, P15, P141, P142 y con la historia E02.`,
  },
  {
    key: 'plano',
    prompt: `TU GRUPO: PLANO INTERACTIVO.
Modulos a reportar por separado: (1) plano y versiones de imagen; (2) geometria de poligonos e importacion del DXF; (3) visor con coloreado por estado y leyenda; (4) filtros, ficha rapida del lote y exportacion del plano; (5) recarga de version del plano con superposicion, diferencias y reasociacion.
Mira apps/api/src/modulos/plano/ completo, apps/web/src/app/funcionalidades/plano/ completo (plano-mapa, plano-versiones, plano-recarga), y los ADR 010 y 015 en ${REPO}/docs/adr/. Cruza con los pasos P11, P12, P13, P17, P146, P147, P148 y con la historia E06 (E06-01 a E06-13). Ojo: el editor de poligonos a mano se elimino a proposito (ADR-015) y la geometria entra por DXF; eso NO es un hueco, es una decision, pero E06-09 (exportar) y E06-13 (reserva de evento) si hay que verificarlos.`,
  },
  {
    key: 'comercial',
    prompt: `TU GRUPO: CLIENTE, VENTA Y DINERO.
Modulos a reportar por separado: (1) clientes y copropietarios; (2) cliente inversionista y bloques; (3) separacion, su vigencia y sus prorrogas; (4) contrato de venta, colindancias congeladas y cronograma de cuotas; (5) registro de pagos e imputacion; (6) vouchers y control de duplicados; (7) mora, penalidad, resolucion y devolucion; (8) comprobantes; (9) cancelacion y titulacion; (10) tipo de cambio diario.
Busca en TODO apps/api/src y apps/web/src si existe algo de esto. Es muy probable que la mayoria no exista: confirmalo mirando, lista los modulos que hay en apps/api/src/modulos/ y di con precision cuales de estos diez no tienen ni una linea. No des por construido nada que no puedas abrir. Cruza con las bandas B01 a B09 de ${SP}/pasos-por-hito.tsv y con las historias E03, E04, E05, E07 y E08.`,
  },
]

const inventarios = await parallel(
  GRUPOS.map((g) => () =>
    agent(`${CONTEXTO}\n\n${g.prompt}`, { label: `inventario:${g.key}`, phase: 'Inventariar', schema: SCHEMA }).then((r) => ({
      grupo: g.key,
      ...r,
    })),
  ),
)

const vivos = inventarios.filter(Boolean)
const todos = vivos.flatMap((i) => (i.modulos || []).map((m) => ({ ...m, grupo: i.grupo })))
log(`${todos.length} modulos inventariados por ${vivos.length} agentes`)

phase('Refutar')

const REFUTA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['correcciones', 'confirmados', 'huecos_transversales', 'resumen'],
  properties: {
    correcciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['modulo', 'porcentaje_reportado', 'porcentaje_corregido', 'estado_corregido', 'porque'],
        properties: {
          modulo: { type: 'string' },
          porcentaje_reportado: { type: 'integer' },
          porcentaje_corregido: { type: 'integer' },
          estado_corregido: { type: 'string', enum: ['cerrado', 'avanzado', 'a-medias', 'sin-empezar'] },
          porque: { type: 'string' },
        },
      },
    },
    confirmados: { type: 'array', items: { type: 'string' }, description: 'modulos cuyo puntaje sobrevivio la refutacion' },
    huecos_transversales: {
      type: 'array',
      items: { type: 'string' },
      description: 'piezas que ningun modulo reclama como suyas y que sin embargo el flujo necesita',
    },
    resumen: { type: 'string' },
  },
}

const refutado = await agent(
  `${CONTEXTO}

Cinco agentes inventariaron el codigo y reportaron estos modulos:

${todos.map((m) => `- ${m.modulo} [${m.hito}] ${m.porcentaje}% (${m.estado}) esquema=${m.esquema}/25 app=${m.aplicacion}/25 api=${m.api}/20 front=${m.frontend}/20 pruebas=${m.pruebas}/10\n    construido: ${m.construido}\n    pendiente: ${m.pendiente}\n    carga: ${m.carga_de_datos}\n    evidencia: ${m.evidencia}`).join('\n')}

TU TAREA: eres el escéptico. Por defecto NO creas ningun puntaje: abrelo y verificalo.
1. Ataca especialmente todo modulo declarado 'cerrado' o con 85% o mas. Un modulo NO esta cerrado si le falta la pantalla en el frontend, si no tiene prueba, si la entidad no tiene las columnas que el flujo pide, o si un caso de uso del negocio no existe. Corrige el numero hacia abajo con evidencia.
2. Ataca tambien los ceros: si alguien reporto 0% comprueba que de verdad no existe nada, porque a veces la pieza vive dentro de otro modulo con otro nombre.
3. Detecta modulos duplicados entre agentes (la misma cosa reportada dos veces con nombres distintos) y dilo.
4. Lista los huecos transversales: piezas que el flujo de ${SP}/pasos-por-hito.tsv necesita y que ningun modulo reclamo.
Devuelve solo las correcciones reales, no reescribas los que estan bien.`,
  { label: 'refutador', phase: 'Refutar', schema: REFUTA_SCHEMA, effort: 'high' },
)

return { modulos: todos, refutado, notas: vivos.map((v) => ({ grupo: v.grupo, notas: v.notas })) }
