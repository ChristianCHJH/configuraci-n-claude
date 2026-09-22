export const meta = {
  name: 'frontend-separacion-contrato',
  description: 'Construye las 7 pantallas Angular de separacion, contrato, cronograma, parametros y precios',
  phases: [
    { title: 'Construir', detail: 'un agente por funcionalidad, carpetas disjuntas' },
    { title: 'Revisar', detail: 'coherencia con la API real y con el prototipo' },
  ],
}

const SIS = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const DOCS = 'c:/Users/Christian/Proyectos/inmobiliaria'
const WEB = `${SIS}/apps/web/src/app`

const COMUN = `
PROYECTO: sistema inmobiliario BLP. Frontend Angular 17+ en ${WEB}.
Estas en la rama feat/separacion-contrato-cronograma. El backend de estos modulos YA ESTA
CONSTRUIDO en esta misma rama y compila: no lo toques, consumelo.

LEE ESTOS ARCHIVOS ANTES DE ESCRIBIR UNA LINEA. Son el patron que hay que copiar EXACTAMENTE:
- ${WEB}/funcionalidades/cliente/cliente-lista/cliente-lista.component.ts
- ${WEB}/funcionalidades/cliente/cliente-formulario/cliente-formulario.component.ts
- ${WEB}/funcionalidades/cliente/cliente-ficha/cliente-ficha.component.ts
- ${WEB}/funcionalidades/cliente/servicios/cliente.service.ts
- ${WEB}/funcionalidades/cliente/modelos/cliente.modelo.ts
- ${WEB}/funcionalidades/cliente/cliente.rutas.ts
- ${WEB}/core/services/api.service.ts
- ${WEB}/compartido/componentes/chip-estado.component.ts
- ${WEB}/compartido/componentes/paginador.component.ts
- ${WEB}/compartido/componentes/dialogo.component.ts
- ${SIS}/apps/web/tailwind.config.js  (los tokens: marca-*, tinta-*, lienzo, superficie,
  borde, acento-500, rounded-tarjeta, rounded-control)
- ${SIS}/packages/contratos/src/venta.ts  (los enums que el backend usa: EstadoSeparacion,
  ModalidadVenta, EstadoContrato, EstadoCuota, LadoColindancia, RolFirmante, CLAVES_PARAMETRO)

REGLAS QUE NO SE NEGOCIAN:
1. CERO COMENTARIOS en el codigo. Ni //, ni /* */, ni JSDoc, ni <!-- --> en el template.
   Hay una prueba automatica que lo verifica y tiene que quedar en verde.
2. Componentes standalone, ChangeDetectionStrategy.OnPush, signals para el estado local,
   template inline en el decorador, como TODOS los componentes de cliente.
3. Control flow moderno OBLIGATORIO: @if / @for (track ...) / @switch. Prohibido *ngIf y *ngFor.
4. Tailwind con los tokens del proyecto. Prohibido hardcodear colores hex: usa marca-500,
   tinta-suave, borde, lienzo, superficie, etc. Prohibido styleUrls con CSS propio.
5. Todo en espanol: clases, metodos, variables, archivos en kebab-case.
6. Tipado explicito, prohibido "any". Los modelos van en modelos/*.modelo.ts y extienden
   ColumnasAuditoria como hace cliente.modelo.ts.
7. Los servicios usan ApiService (listar/obtener/crear/actualizar/eliminar) e inject().
8. Nada de emojis en la interfaz. Los iconos son SVG lineales de 1.75 de trazo, como los que
   ya usan los componentes de cliente.

EL DISENO YA ESTA HECHO. Estas pantallas se disenaron y aprobaron como prototipo. Tu trabajo
es implementarlas, no reinventarlas. Los archivos del prototipo son HTML plano legible:
- ${DOCS}/6-prototipo/design-venta/Main.dc.html            -> bandeja de separaciones
- ${DOCS}/6-prototipo/design-venta/SeparacionNueva.dc.html -> separar un lote
- ${DOCS}/6-prototipo/design-venta/SeparacionFicha.dc.html -> ficha de la separacion
- ${DOCS}/6-prototipo/design-venta/ContratoNuevo.dc.html   -> generar el contrato
- ${DOCS}/6-prototipo/design-venta/ContratoFicha.dc.html   -> contrato y cronograma
- ${DOCS}/6-prototipo/design-venta/Parametros.dc.html      -> parametros del negocio
- ${DOCS}/6-prototipo/design-venta/ListaPrecios.dc.html    -> lista de precios
LEE EL TUYO. Respeta su estructura, su jerarquia, sus textos y su intencion de UX.
Los colores del prototipo se traducen a los tokens de Tailwind: #2E5C8A=marca-500,
#1B3A5C=marca-700, #0F2540=marca-900, #E8EFF7=marca-100, #F7FAFD=marca-50, #6B7480=tinta-suave,
#9AA3AE=tinta-tenue, #E3E6EB=borde, #F6F7F9=lienzo, #C4703A=acento-500.
IGNORA la barra lateral del prototipo: ya existe en el shell de la aplicacion.
Los datos del prototipo son de ejemplo: la pantalla real los pide a la API.

DECISIONES DE UX DEL PROTOTIPO QUE HAY QUE CONSERVAR:
- La vigencia SIEMPRE se dice en dias ("vence en 2 dias"), no solo la fecha.
- Lo que queda congelado (firmantes, colindancias del contrato) se marca como congelado.
- Un solo boton primario por pantalla.
- Ninguna pantalla pide un dato que el sistema ya sabe.
- Los estados de carga, vacio y error se dibujan, no se omiten.

ESCRIBE LOS ARCHIVOS CON Write. No devuelvas codigo en tu respuesta: devuelve un resumen de
que archivos creaste, que endpoints consumes y que decisiones tomaste.
NO EDITES ${WEB}/app.routes.ts NI ${WEB}/layout/barra-lateral.component.ts: de eso me encargo
yo al integrar, y si los tocas pisas a los otros agentes. Deja tus rutas exportadas en tu
propio archivo *.rutas.ts y dime como se llama la constante.
`

const FRENTES = [
  {
    key: 'separacion',
    label: 'front:separacion',
    prompt: `${COMUN}

TU FUNCIONALIDAD: ${WEB}/funcionalidades/separacion/

Implementa TRES pantallas: Main.dc.html (bandeja), SeparacionNueva.dc.html y
SeparacionFicha.dc.html del prototipo.

API QUE CONSUMES (lee los controller y los DTO reales antes de tipar nada):
- ${SIS}/apps/api/src/modulos/separacion/api/separacion.controller.ts
- ${SIS}/apps/api/src/modulos/separacion/api/historial-del-lote.controller.ts
- ${SIS}/apps/api/src/modulos/separacion/api/dto/  (todos)
- ${SIS}/apps/api/src/modulos/separacion/aplicacion/listar-separaciones.caso-uso.ts
  (para saber la forma exacta de lo que devuelve el listado)
Endpoints: GET /separaciones, GET /separaciones/:id, GET /separaciones/:id/prorrogas,
POST /separaciones, POST /separaciones/:id/aprobacion, POST /separaciones/:id/rechazo,
POST /separaciones/:id/liberacion, POST /separaciones/:id/prorrogas,
GET /lotes/:loteId/historial-estado.
Para el precio del lote al separar: GET /listas-precio/lote/:loteId (modulo precio).

CONSTRUYE:
- modelos/separacion.modelo.ts
- servicios/separacion.service.ts
- separacion-lista/separacion-lista.component.ts — la bandeja: las cuatro tarjetas de resumen
  arriba, los chips de filtro por estado, la tabla con la columna de vigencia en dias y color
  (verde vigente, ambar por vencer, rojo vencida), y el paginador compartido.
- separacion-formulario/separacion-formulario.component.ts — separar un lote: los tres pasos,
  el bloque del lote con su precio calculado, el buscador de cliente, el monto con la vigencia
  que se recalcula al escribir (el minimo y los dias salen de GET /parametros si tienes
  permiso, y si no del mensaje de error del backend: NO cablees 300 ni 7), y el adjunto del
  voucher.
- separacion-ficha/separacion-ficha.component.ts — la ficha: la cabecera de estado con los dias
  restantes, los datos del lote y el cliente, el deposito, la linea de tiempo con el historial,
  y las acciones segun el estado (aprobar y rechazar solo si esta SOLICITADA; prorrogar y
  liberar solo si esta VIGENTE o VENCIDA; generar contrato solo si esta VIGENTE, y ese boton
  navega a /contratos/nuevo con la separacion en la ruta).
  Aprobar, rechazar, liberar y prorrogar piden confirmacion con el dialogo compartido.
- separacion.rutas.ts con SEPARACION_RUTAS: '' -> lista, 'nueva' -> formulario, ':id' -> ficha.

El calculo de dias restantes y el texto de vigencia va en un archivo aparte reutilizable
(modelos/ o un helper puro), no repetido en tres componentes.`,
  },
  {
    key: 'contrato',
    label: 'front:contrato',
    prompt: `${COMUN}

TU FUNCIONALIDAD: ${WEB}/funcionalidades/contrato/

Implementa DOS pantallas: ContratoNuevo.dc.html y ContratoFicha.dc.html del prototipo.

API QUE CONSUMES (lee los controller y los DTO reales antes de tipar nada):
- ${SIS}/apps/api/src/modulos/contrato/api/contrato.controller.ts
- ${SIS}/apps/api/src/modulos/contrato/api/cronograma.controller.ts
- ${SIS}/apps/api/src/modulos/contrato/api/plantilla-contrato.controller.ts
- ${SIS}/apps/api/src/modulos/contrato/api/dto/  (todos)
- ${SIS}/apps/api/src/modulos/contrato/dominio/calculo-del-cronograma.ts
  (IMPORTANTE: la vista previa del cronograma en la pantalla de generar contrato debe dar
   EXACTAMENTE los mismos numeros que este calculo del backend. Lee como funciona y reusa la
   misma logica desde @inmobiliaria/contratos si esta expuesta ahi; si no lo esta, llama al
   backend para previsualizar en vez de recalcular mal en el navegador. NO improvises una
   segunda formula que se desvie de la del servidor.)
Endpoints: GET /contratos, GET /contratos/:id, POST /contratos, PATCH /contratos/:id,
POST /contratos/:id/firma, POST /contratos/:id/resolucion,
GET /contratos/:contratoId/cronograma, GET /contratos/:contratoId/cronograma/cuotas,
POST /contratos/:contratoId/cronograma/cuotas/:cuotaId/postergaciones,
GET /plantillas-contrato.

CONSTRUYE:
- modelos/contrato.modelo.ts (contrato, firmante, colindancia, cronograma, cuota, plantilla)
- servicios/contrato.service.ts y servicios/cronograma.service.ts
- contrato-formulario/contrato-formulario.component.ts — generar el contrato desde una
  separacion: los pasos, el precio pactado contra el de lista con el motivo obligatorio cuando
  difieren, la modalidad como dos tarjetas radio, la cuota inicial y el numero de cuotas, los
  firmantes (el titular viene del cliente y se puede agregar conyuge o copropietario), las
  colindancias propuestas desde el lote, y a la derecha la VISTA PREVIA del cronograma que se
  recalcula al cambiar los campos, con el total y las primeras cuotas.
- contrato-ficha/contrato-ficha.component.ts — el contrato: la cabecera con estado, total,
  pagado y por pagar; la barra de avance; el cronograma completo con la cuota inicial
  resaltada; los firmantes y las colindancias congeladas al costado. Acciones: firmar (si no
  tiene numero), descargar, resolver.
- contrato-lista/contrato-lista.component.ts — el listado de contratos con su paginador.
- contrato.rutas.ts con CONTRATO_RUTAS: '' -> lista, 'nuevo' -> formulario (acepta
  ?separacionId=), ':id' -> ficha, ':id/editar' -> formulario.

El dinero se muestra con font-mono y tabular-nums, como hace cliente-lista con los numeros.
Nunca hagas aritmetica de dinero con numeros de punto flotante en el navegador.`,
  },
  {
    key: 'configuracion',
    label: 'front:parametros-y-precios',
    prompt: `${COMUN}

TUS FUNCIONALIDADES (dos carpetas, las dos son tuyas):
- ${WEB}/funcionalidades/parametro/
- ${WEB}/funcionalidades/lista-precio/

Implementa DOS pantallas: Parametros.dc.html y ListaPrecios.dc.html del prototipo.

API QUE CONSUMES (lee los controller y los DTO reales antes de tipar nada):
- ${SIS}/apps/api/src/modulos/parametro/api/parametro.controller.ts
- ${SIS}/apps/api/src/modulos/parametro/api/dto/
- ${SIS}/apps/api/src/modulos/parametro/aplicacion/listar-parametros.caso-uso.ts
  (devuelve seccion, tipoEsperado, origen y vigenteEnLaConsulta por fila: usalos, no
   recalcules la precedencia en el navegador)
- ${SIS}/apps/api/src/modulos/precio/api/lista-precio.controller.ts
- ${SIS}/apps/api/src/modulos/precio/api/dto/
- ${SIS}/apps/api/src/modulos/precio/dominio/calculo-del-precio.ts
Endpoints: GET /parametros, POST /parametros, PATCH /parametros/:id, DELETE /parametros/:id,
GET /listas-precio, GET /listas-precio/vigente/:proyectoId, GET /listas-precio/lote/:loteId,
POST /listas-precio, PATCH /listas-precio/:id.

CONSTRUYE, en funcionalidades/parametro/:
- modelos/parametro.modelo.ts, servicios/parametro.service.ts
- parametro-lista/parametro-lista.component.ts — la pantalla de parametros: el aviso de arriba
  sobre que cambiar un parametro no toca lo ya emitido, y las tablas agrupadas por seccion
  (la seccion viene del backend). Cada fila con su valor editable en linea, la columna de
  alcance (global o el nombre del proyecto), y de donde sale la regla. El boton de guardar
  manda solo las filas que cambiaron. Validar el valor contra tipoEsperado antes de mandar.
  Un global no se puede borrar: no dibujes esa accion en esas filas.
- parametro.rutas.ts con PARAMETRO_RUTAS.

CONSTRUYE, en funcionalidades/lista-precio/:
- modelos/lista-precio.modelo.ts, servicios/lista-precio.service.ts
- lista-precio-ficha/lista-precio-ficha.component.ts — la lista vigente del proyecto con su
  precio por m2 y los cuatro ajustes por ubicacion editables, al lado la tabla de "como queda
  el precio" con lotes de ejemplo del proyecto (pidelos a la API, no los inventes), el aviso
  de que cambiar el precio no cambia lo ya vendido, y abajo la tabla de listas anteriores.
- lista-precio-formulario/lista-precio-formulario.component.ts — nueva lista de precios, que
  al guardar cierra la anterior.
- lista-precio.rutas.ts con LISTA_PRECIO_RUTAS.

Si para "como queda el precio" no existe un endpoint que devuelva varios lotes tasados, usa
GET /listas-precio/lote/:loteId sobre unos pocos lotes del proyecto, o di en tu resumen que
falta ese endpoint en vez de inventarte los numeros.`,
  },
]

phase('Construir')
const construidos = await parallel(
  FRENTES.map((f) => () => agent(f.prompt, { label: f.label, phase: 'Construir', effort: 'high' }))
)

log('Tres frentes escritos. Revisando contra la API real.')

phase('Revisar')
const revision = await agent(
  `${COMUN}

Las tres funcionalidades ya estan escritas en disco:
- ${WEB}/funcionalidades/separacion/
- ${WEB}/funcionalidades/contrato/
- ${WEB}/funcionalidades/parametro/
- ${WEB}/funcionalidades/lista-precio/

TU TAREA: revisarlas LEYENDO LOS ARCHIVOS REALES y ARREGLAR lo que este mal. Puedes editar.

Revisa, en este orden:
1. CONTRA LA API REAL. Cada llamada del servicio contra el controller y el DTO del backend:
   la ruta, el metodo, el nombre de cada campo del cuerpo, y la forma de la respuesta.
   Un campo que el front manda y el DTO no acepta lo rechaza el ValidationPipe: es un fallo.
   Un campo que el front lee y el backend no devuelve sale undefined en pantalla: es un fallo.
   Los controllers estan en ${SIS}/apps/api/src/modulos/{separacion,contrato,parametro,precio}/api/.
2. SINTAXIS ANGULAR: ningun *ngIf ni *ngFor. Todo @if / @for con track. Todos los componentes
   standalone con OnPush. Ningun "any".
3. COMENTARIOS: borra TODO comentario del codigo y de los templates.
4. TOKENS: ningun color hex hardcodeado en las clases. Todo con los tokens de Tailwind del
   proyecto. Busca "#" en los template y en los [style].
5. ESTADOS: cada pantalla que carga datos dibuja cargando, vacio y error. Si falta alguno, agregalo.
6. DINERO: ninguna aritmetica de dinero con floats en el navegador.

Arregla lo que encuentres. Al final devuelve la lista de lo que arreglaste y de lo que quedo
pendiente porque no supiste resolverlo, y dime el nombre exacto de la constante de rutas de
cada funcionalidad para que yo las cablee en app.routes.ts.

===== RESUMEN DE CADA AGENTE =====
${FRENTES.map((f, i) => `--- ${f.key} ---\n${construidos[i] || '(sin resultado)'}`).join('\n\n')}`,
  { label: 'revisar:front', phase: 'Revisar', effort: 'high' }
)

return { construidos, revision }
