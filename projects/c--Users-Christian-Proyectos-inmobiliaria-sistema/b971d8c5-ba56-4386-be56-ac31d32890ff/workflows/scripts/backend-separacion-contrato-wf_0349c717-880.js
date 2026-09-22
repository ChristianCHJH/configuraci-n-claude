export const meta = {
  name: 'backend-separacion-contrato',
  description: 'Construye los 4 modulos NestJS de separacion, contrato, cronograma, precios y parametros',
  phases: [
    { title: 'Construir', detail: 'un agente por modulo, carpetas disjuntas' },
    { title: 'Revisar', detail: 'compilar mentalmente contra el patron y el esquema' },
  ],
}

const REPO = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'

const COMUN = `
PROYECTO: sistema inmobiliario BLP. Monorepo en ${REPO}.
Estas en la rama feat/separacion-contrato-cronograma. Backend NestJS 10 + TypeORM + PostgreSQL.

LEE ESTOS ARCHIVOS ANTES DE ESCRIBIR UNA SOLA LINEA. Son el patron que hay que copiar EXACTAMENTE:
- ${REPO}/apps/api/src/modulos/cliente/cliente.module.ts
- ${REPO}/apps/api/src/modulos/cliente/api/cliente.controller.ts
- ${REPO}/apps/api/src/modulos/cliente/api/tipo-documento.controller.ts
- ${REPO}/apps/api/src/modulos/cliente/api/dto/crear-cliente.dto.ts
- ${REPO}/apps/api/src/modulos/cliente/api/dto/listar-clientes.dto.ts
- ${REPO}/apps/api/src/modulos/cliente/aplicacion/crear-cliente.caso-uso.ts
- ${REPO}/apps/api/src/modulos/cliente/aplicacion/listar-clientes.caso-uso.ts
- ${REPO}/apps/api/src/modulos/cliente/dominio/puertos/cliente.repositorio.ts
- ${REPO}/apps/api/src/modulos/cliente/dominio/criterios/filtro-clientes.ts
- ${REPO}/apps/api/src/modulos/cliente/dominio/identidad-del-cliente.ts  (regla de dominio pura)
- ${REPO}/apps/api/src/modulos/cliente/dominio/identidad-del-cliente.spec.ts  (como se prueba)
- ${REPO}/apps/api/src/modulos/cliente/infraestructura/persistencia/cliente.entity.ts
- ${REPO}/apps/api/src/modulos/cliente/infraestructura/persistencia/cliente.repositorio.typeorm.ts
- ${REPO}/apps/api/src/comun/persistencia/entidad-base.ts
- ${REPO}/apps/api/src/comun/dominio/error-dominio.ts
- ${REPO}/apps/api/src/comun/http/mensaje.decorador.ts
- ${REPO}/apps/api/src/comun/http/transform.interceptor.ts
- ${REPO}/apps/api/src/comun/autorizacion/permisos.decorador.ts
- ${REPO}/packages/contratos/src/venta.ts   (los enums y claves que YA escribi para ti)
- ${REPO}/packages/contratos/src/autorizacion.ts  (los permisos nuevos ya estan)
- ${REPO}/apps/api/src/migraciones/1788134400000-SeparacionContratoYCronograma.ts
  (EL ESQUEMA REAL. Tus entidades deben calzar columna por columna con esta migracion.
   NO inventes columnas que no esten ahi, NO omitas ninguna.)

REGLAS QUE NO SE NEGOCIAN:
1. CERO COMENTARIOS en el codigo. Ni //, ni /* */, ni JSDoc. El nombre carga la explicacion.
   La UNICA excepcion es el "comment:" de una columna TypeORM, que viaja al DDL.
2. Arquitectura hexagonal, mismas carpetas que cliente:
   api/ (controller + dto/) · aplicacion/ (*.caso-uso.ts) · dominio/ (reglas puras,
   puertos/, criterios/) · infraestructura/persistencia/ (*.entity.ts + *.repositorio.typeorm.ts)
3. Las entidades extienden EntidadBase y NO declaran las 6 columnas de auditoria.
   Llevan @Entity() y @Auditable().
4. Los indices unicos parciales van como @Index(...) en la entity con su "where", copiando el
   nombre EXACTO que la migracion ya creo.
5. Todo en espanol: nombres de clase, metodo, variable y archivo. Archivos en kebab-case.
6. Nada de "any". Tipado explicito.
7. Los casos de uso lanzan DatoInvalido / NoEncontrado / Conflicto de comun/dominio/error-dominio.
8. Los controladores llevan @Permisos(...) con los codigos de PERMISOS que correspondan y
   @Mensaje('...') en cada endpoint.
9. Toda regla de negocio que se pueda expresar como funcion pura va en dominio/ con su .spec.ts
   al lado. Los .spec.ts de dominio NO tocan la base de datos.
10. Los repositorios filtran SIEMPRE por eliminado: false.

ESCRIBE LOS ARCHIVOS CON LA HERRAMIENTA Write. No devuelvas codigo en tu respuesta:
devuelve solo un resumen de que archivos creaste y que decisiones tomaste.
`

const MODULOS = [
  {
    key: 'parametro',
    label: 'modulo:parametro',
    prompt: `${COMUN}

TU MODULO: ${REPO}/apps/api/src/modulos/parametro/

Es la tabla "parametro" de la migracion: clave, valor, proyecto_id (NULL = global).
Guarda los valores configurables del negocio (los 7 dias de vigencia, los S/ 300 minimos,
el recargo del 10 % anual, etc). Las claves validas estan en CLAVES_PARAMETRO de venta.ts.

CONSTRUYE:
- Entity Parametro con el indice unico parcial idx_parametro_clave_proyecto.
- Puerto + repositorio TypeORM: listar, buscarPorId, buscarPorClave(clave, proyectoId),
  listarVigentes(), nuevo, guardar.
- Dominio: un modulo "lectura-de-parametros.ts" con funciones PURAS que, dada la lista de
  filas de parametro y una clave y un proyectoId, resuelvan el valor con la precedencia
  correcta: la fila del proyecto gana sobre la global; si no hay ninguna, es un error de
  configuracion, no un valor por defecto cableado. Expon helpers tipados:
  numeroDe(...), enteroDe(...), decimalDe(...). Con su .spec.ts.
- Un servicio de aplicacion ParametrosDelNegocio (Injectable) que los demas modulos inyectan
  para leer un parametro. Debe EXPORTARSE del ParametroModule: separacion y contrato lo usan.
  Metodos: entero(clave, proyectoId?), decimal(clave, proyectoId?), texto(clave, proyectoId?).
  Si la clave no existe lanza DatoInvalido diciendo que falta configurar ese parametro.
- Casos de uso: ListarParametros, ActualizarParametro (solo cambia "valor"; validar que el
  valor sea del tipo que la clave espera), CrearParametroDeProyecto (el override por proyecto),
  DarDeBajaParametroDeProyecto.
  NO se puede crear ni borrar un parametro global: las claves son una lista cerrada.
- Controller ParametroController en 'parametros' con @Permisos(PERMISOS.PARAMETROS_GESTIONAR):
  GET / (listar, agrupables por seccion en el front), PATCH /:id, POST /, DELETE /:id.
- parametro.module.ts exportando ParametrosDelNegocio.`,
  },
  {
    key: 'precio',
    label: 'modulo:precio',
    prompt: `${COMUN}

TU MODULO: ${REPO}/apps/api/src/modulos/precio/

Son las tablas "lista_precio" y "lote_colindancia" de la migracion, mas las dos columnas
nuevas de "lote": precio_lista y lista_precio_id.

CONSTRUYE:
- Entities ListaPrecio y LoteColindancia con sus indices unicos parciales
  (idx_lista_precio_proyecto_vigencia, idx_lista_precio_vigente, idx_lote_colindancia_lado),
  copiando los nombres EXACTOS de la migracion.
- Puertos + repositorios TypeORM de ambas.
- Dominio (funciones PURAS, cada una con su .spec.ts):
  * "calculo-del-precio.ts": dada una lista de precios y un lote (areaM2, esEsquina,
    esFrenteParque, esInteriorSinVistaMar, esZonaPremiumClub) devuelve el desglose
    { precioBase, recargoEsquina, recargoFrenteParque, ajusteInterior, recargoZonaPremium,
      precioLista }. Todo con dinero como string decimal, NUNCA con number de punto flotante:
    usa aritmetica sobre enteros de centimos o strings. Redondeo a 2 decimales.
    Si la lista no tiene precio_m2, el precio no se puede calcular: dilo como error.
  * "vigencia-de-la-lista.ts": que lista rige en una fecha dada; una lista nueva cierra la
    anterior poniendole vigencia_hasta el dia antes.
  * "colindancias-del-lote.ts": los cuatro lados de LADOS_DEL_LOTE, cual falta, y si la suma
    de medidas es coherente. Devuelve motivos de rechazo, no booleanos sueltos.
- Casos de uso: ListarListasDePrecio, ObtenerListaVigente(proyectoId), CrearListaDePrecio
  (cierra la anterior en la misma operacion), ActualizarListaDePrecio (solo si no tiene
  lotes vendidos con ella), CalcularPrecioDeLote(loteId) que devuelve el desglose,
  ListarColindanciasDelLote, GuardarColindanciasDelLote (reemplaza los 4 lados de una vez).
- Controllers: ListaPrecioController en 'listas-precio' con @Permisos(PERMISOS.PRECIOS_GESTIONAR),
  y LoteColindanciaController en 'lotes/:loteId/colindancias' con
  @Permisos(PERMISOS.INVENTARIO_GESTIONAR).
- precio.module.ts exportando CalcularPrecioDeLoteCasoUso y ListarColindanciasDelLoteCasoUso
  (separacion y contrato los necesitan).

OJO: la entity Lote ya existe en modulos/lote/. Agregale las DOS columnas nuevas
(precioLista y listaPrecioId) siguiendo su estilo; no la reescribas.`,
  },
  {
    key: 'separacion',
    label: 'modulo:separacion',
    prompt: `${COMUN}

TU MODULO: ${REPO}/apps/api/src/modulos/separacion/

Son las tablas "separacion", "separacion_prorroga" y "lote_estado_historial".

EL FLUJO, que tienes que respetar:
SOLICITADA -> (aprobar) VIGENTE -> (generar contrato) CONCRETADA
SOLICITADA -> (rechazar) RECHAZADA
VIGENTE -> (vence el plazo) VENCIDA -> (liberar) LIBERADA
VIGENTE o VENCIDA -> (prorrogar) VIGENTE con nueva fecha_vigencia

REGLAS DE NEGOCIO:
- El monto minimo sale del parametro separacion_monto_minimo. Los dias de vigencia, de
  separacion_dias_vigencia. NUNCA cablees 300 ni 7: pidelos a ParametrosDelNegocio
  (inyecta el servicio del modulo parametro, que ya lo exporta).
- fecha_vigencia = fecha de aprobacion + dias de vigencia. Se fija AL APROBAR, no al solicitar.
- Un lote no puede tener dos separaciones que lo tomen a la vez (estados SOLICITADA o VIGENTE).
  La migracion ya tiene el indice unico parcial idx_separacion_lote_tomado; ademas hay que
  dar un mensaje claro con Conflicto antes de que reviente el indice.
- Al solicitar: el lote pasa al estado SEPARACION_SOLICITADA. Al aprobar: a SEPARADO.
  Al rechazar/liberar/vencer: vuelve a DISPONIBLE. Al concretar: lo mueve el modulo contrato.
  CADA cambio de estado escribe una fila en lote_estado_historial con el motivo y la
  separacion_id. Los codigos de estado_lote que existen hoy son: SIN_INFORMACION,
  MORA_TRES_CUOTAS, RESERVADO_EVENTO, PAGADO_TOTALMENTE, FINANCIADO, SEPARADO,
  SEPARACION_SOLICITADA, INVERSIONISTA, ZONA_PREMIUM_CLUB, DISPONIBLE. Usa esos, no inventes.
- Al solicitar tambien se congela lote.precio_lista con el precio calculado
  (inyecta CalcularPrecioDeLoteCasoUso del modulo precio) y lote.cliente_id.
- Prorroga: monto minimo del parametro prorroga_monto_minimo; la nueva fecha_vigencia es la
  anterior + 7 dias. Si las prorrogas acumuladas superan prorroga_semanas_maximas hace falta
  usuario_autoriza_gerencia_id, si no se rechaza con DatoInvalido.
- Una separacion vencida se detecta comparando fecha_vigencia con hoy: NO hay proceso
  programado en esta entrega, el estado VENCIDA se calcula al listar y al operar.

CONSTRUYE:
- Entities Separacion, SeparacionProrroga, LoteEstadoHistorial con sus indices exactos.
- Puertos + repositorios TypeORM.
- Dominio con .spec.ts para cada uno:
  * "estados-de-la-separacion.ts": la matriz de transiciones legales y el motivo de rechazo
    cuando una transicion no es legal.
  * "vigencia-de-la-separacion.ts": calcular fecha_vigencia, dias restantes, si esta vencida
    en una fecha dada, y el texto de cuantos dias faltan.
  * "monto-de-la-separacion.ts": motivo de rechazo si el monto es menor al minimo.
  * "tope-de-prorrogas.ts": cuantas lleva, si excede el tope, si exige gerencia.
- Casos de uso: ListarSeparaciones (con filtros por estado, lote, cliente y "por vencer",
  paginado como listar-clientes), ObtenerSeparacion, SolicitarSeparacion, AprobarSeparacion,
  RechazarSeparacion, LiberarSeparacion, ProrrogarSeparacion, ListarProrrogasDeLaSeparacion,
  ListarHistorialDelLote.
- Un servicio MovimientoDeEstadoDelLote (Injectable, en aplicacion/) que centralice
  "mover el lote a este estado dejando fila en el historial". Exportalo: contrato lo usa.
- Controllers: SeparacionController en 'separaciones'. Los endpoints de consulta con
  @Permisos(PERMISOS.VENTAS_VER), los de registro con VENTAS_GESTIONAR, y aprobar/rechazar/
  prorrogar con VENTAS_APROBAR. Usa @Permisos a nivel de metodo donde haga falta.
- separacion.module.ts importando ParametroModule y PrecioModule, exportando
  ObtenerSeparacionCasoUso y MovimientoDeEstadoDelLote.`,
  },
  {
    key: 'contrato',
    label: 'modulo:contrato',
    prompt: `${COMUN}

TU MODULO: ${REPO}/apps/api/src/modulos/contrato/

Son las tablas "contrato_venta", "contrato_firmante", "contrato_colindancia", "cronograma",
"cuota", "cuota_postergacion", "contrato_resolucion" y "plantilla_contrato".

EL NUCLEO ES EL CALCULO DEL CRONOGRAMA. Hazlo bien:
- total = precio_pactado + recargo_financiamiento
- recargo_financiamiento = solo si modalidad es FINANCIADO:
  saldo * (financiamiento_recargo_anual / 100) * (numero_cuotas / 12), redondeado a 2 decimales.
  Si es CONTADO el recargo es 0 y numero_cuotas debe caber en credito_contado_meses_maximos.
- saldo_financiado = precio_pactado - cuota_inicial
- monto_por_cuota = (saldo_financiado + recargo_financiamiento) / numero_cuotas
- La suma de las cuotas TIENE que dar exactamente el total: la diferencia por redondeo se
  ajusta en la ULTIMA cuota. Esto es obligatorio y va probado.
- La cuota numero 0 es la cuota inicial, vence el dia del contrato, y nace con
  monto_pagado = el monto de la separacion (RN-07: la separacion se imputa a la inicial),
  con estado PARCIAL o PAGADA segun corresponda.
- Las cuotas 1..N vencen el dia_vencimiento de cada mes siguiente. Si el dia no existe en ese
  mes se usa el ultimo dia del mes. El dia por defecto sale del parametro
  cuota_dia_vencimiento_defecto.
- numero_cuotas no puede superar financiamiento_plazo_maximo_meses.
- cuota_inicial no puede ser menor que cuota_inicial_minima del proyecto.
TODO EL DINERO EN STRING DECIMAL O ENTEROS DE CENTIMOS. Prohibido sumar precios con
numeros de punto flotante de JavaScript.

MAS REGLAS:
- El contrato nace DE UNA SEPARACION VIGENTE. Al generarlo: la separacion pasa a CONCRETADA
  y el lote pasa a FINANCIADO (si es financiado) o PAGADO_TOTALMENTE (si es contado y ya se
  pago todo; si no, FINANCIADO). Usa el servicio MovimientoDeEstadoDelLote que exporta el
  modulo separacion, para que quede fila en lote_estado_historial con contrato_venta_id.
- precio_lista se copia congelado desde lote.precio_lista. Si precio_pactado != precio_lista,
  motivo_diferencia_precio es obligatorio (la migracion ya tiene el CHECK, pero da un
  DatoInvalido con mensaje claro antes).
- Los firmantes se COPIAN de la ficha del cliente al crear el contrato y ya no se refrescan:
  el titular sale del cliente, los demas se agregan a mano. Siempre exactamente un TITULAR.
- Las colindancias se PROPONEN desde lote_colindancia (inyecta ListarColindanciasDelLote del
  modulo precio) y se congelan en contrato_colindancia. Los cuatro lados son obligatorios.
- numero_contrato se asigna al firmar, correlativo por empresa, formato CV-AAAA-NNNN.

CONSTRUYE:
- Todas las entities con sus indices exactos de la migracion.
- Puertos + repositorios TypeORM.
- Dominio con .spec.ts para cada uno (esta es la parte mas importante del modulo):
  * "calculo-del-cronograma.ts": dado precio pactado, cuota inicial, numero de cuotas,
    modalidad, recargo anual, dia de vencimiento, fecha del contrato y monto ya imputado de
    la separacion, devuelve MontosDelCronograma + CuotaProyectada[]. Probado a fondo:
    que la suma cuadre, el ajuste en la ultima cuota, meses con menos dias, contado sin recargo.
  * "vencimientos-mensuales.ts": la serie de fechas.
  * "coherencia-del-contrato.ts": motivos de rechazo (precio distinto sin motivo, inicial mayor
    al precio, cuotas fuera de plazo, contado con demasiadas cuotas, inicial bajo el minimo).
  * "firmantes-del-contrato.ts": exactamente un titular, ordenes sin repetir, datos minimos.
  * "estados-del-contrato.ts": VIGENTE -> RESUELTO | CANCELADO y que transicion es legal.
  * "numero-de-contrato.ts": el formato y el siguiente correlativo.
  * "saldo-de-la-cuota.ts": estado de la cuota segun monto y monto_pagado.
- Casos de uso: ListarContratos, ObtenerContrato, GenerarContratoDesdeSeparacion (la operacion
  gorda: crea contrato + firmantes + colindancias + cronograma + cuotas y concreta la
  separacion, todo en una transaccion), ActualizarContrato (solo mientras no este firmado),
  FirmarContrato (asigna numero y fecha), ResolverContrato, ObtenerCronogramaDelContrato,
  ListarCuotas, PostergarCuota, ListarPlantillas, RegistrarPlantilla.
- Controllers: ContratoController en 'contratos', CronogramaController en
  'contratos/:contratoId/cronograma', PlantillaContratoController en 'plantillas-contrato'.
  Permisos: consulta VENTAS_VER, escritura VENTAS_GESTIONAR.
- contrato.module.ts importando ParametroModule, PrecioModule, SeparacionModule y ClienteModule.

La transaccion de GenerarContratoDesdeSeparacion tiene que ser real: usa el DataSource /
QueryRunner de TypeORM o el patron transaccional que ya use el repo si lo encuentras.`,
  },
]

phase('Construir')
const construidos = await parallel(
  MODULOS.map((m) => () => agent(m.prompt, { label: m.label, phase: 'Construir', effort: 'high' }))
)

log('Cuatro modulos escritos. Revisando coherencia entre ellos y contra el esquema.')

phase('Revisar')
const revision = await agent(
  `${COMUN}

Los cuatro modulos ya estan escritos en disco:
- ${REPO}/apps/api/src/modulos/parametro/
- ${REPO}/apps/api/src/modulos/precio/
- ${REPO}/apps/api/src/modulos/separacion/
- ${REPO}/apps/api/src/modulos/contrato/

TU TAREA: revisarlos LEYENDO LOS ARCHIVOS REALES y ARREGLAR lo que este mal. Puedes editar.

Revisa, en este orden:
1. COHERENCIA CON EL ESQUEMA: cada entity contra la migracion 1788134400000. Columna por
   columna: nombre, tipo, nulabilidad, longitud. Los nombres de indice exactos.
   Una entity que declare una columna que la migracion no tiene, o al reves, es un fallo.
2. IMPORTS ENTRE MODULOS: separacion importa de parametro y precio; contrato importa de
   parametro, precio, separacion y cliente. Verifica que lo que un modulo importa este
   realmente EXPORTADO por el otro (mira los "exports" de cada .module.ts).
   Verifica que no haya dependencia circular.
3. COMENTARIOS: borra TODO comentario que hayan dejado. Ni //, ni /* */, ni JSDoc.
   La unica excepcion es el "comment:" de una columna TypeORM.
4. TIPOS: ningun "any". Los import de tipo con "import type" donde el patron de cliente lo usa.
5. DINERO: ninguna suma de precios con floats. Si encuentras "parseFloat" o aritmetica de
   punto flotante sobre montos, arreglalo.
6. Que ningun caso de uso cablee un numero que deberia salir de ParametrosDelNegocio
   (300, 7, 10, 42, 6, 15, 3, 30). Buscalos.

Arregla lo que encuentres. Al final devuelve la lista de lo que arreglaste y de lo que
quedo pendiente porque no supiste resolverlo.

===== RESUMEN DE LO QUE CONSTRUYO CADA AGENTE =====
${MODULOS.map((m, i) => `--- ${m.key} ---\n${construidos[i] || '(sin resultado)'}`).join('\n\n')}`,
  { label: 'revisar:coherencia', phase: 'Revisar', effort: 'high' }
)

return { construidos, revision }
