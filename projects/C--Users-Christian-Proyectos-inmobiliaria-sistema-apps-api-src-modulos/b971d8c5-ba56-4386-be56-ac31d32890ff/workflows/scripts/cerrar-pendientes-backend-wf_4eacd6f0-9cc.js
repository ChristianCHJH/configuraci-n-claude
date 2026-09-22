export const meta = {
  name: 'cerrar-pendientes-backend',
  description: 'Arregla los pendientes del backend de venta y escribe sus pruebas de integracion',
  phases: [
    { title: 'Arreglar', detail: 'los tres defectos reales de flujo' },
    { title: 'Probar', detail: 'pruebas de integracion por modulo' },
  ],
}

const SIS = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const API = `${SIS}/apps/api`

const COMUN = `
PROYECTO: sistema inmobiliario BLP, backend NestJS + TypeORM + PostgreSQL en ${API}.
Rama feat/separacion-contrato-cronograma. Los modulos parametro, precio, separacion y contrato
acaban de construirse y compilan; 576 pruebas unitarias en verde.

REGLAS QUE NO SE NEGOCIAN:
1. CERO COMENTARIOS en el codigo (hay una prueba que lo verifica: test/sin-comentarios.spec.ts).
   Unica excepcion: el "comment:" de una columna TypeORM.
2. Arquitectura hexagonal: api/ · aplicacion/ · dominio/ (puro, con puertos/) ·
   infraestructura/persistencia/. Hay una prueba que lo verifica: test/arquitectura.spec.ts.
3. Todo en espanol, archivos en kebab-case, sin "any".
4. Los repositorios filtran siempre por eliminado: false.
5. Ninguna regla de negocio cablea un numero: sale de ParametrosDelNegocio.
6. El dinero se maneja con aritmetica entera de centimos. Mira contrato/dominio/dinero.ts y
   precio/dominio/decimal-exacto.ts: ya existen, reusalos, no escribas una tercera.

DOCKER NO ESTA LEVANTADO en esta maquina, asi que NO puedes correr las pruebas de integracion.
Si puedes y debes correr las unitarias saltando el arranque de Postgres asi, desde ${API}:
  npx jest --globalSetup=<un js que exporte una funcion async vacia> --globalTeardown=<el mismo> --testPathPattern "..."
Crea ese archivo no-op en un temporal tuyo. Y siempre verifica con:
  npx tsc --noEmit -p ${API}/tsconfig.json
`

phase('Arreglar')
const ARREGLOS = [
  {
    key: 'flujo',
    label: 'arreglar:flujo-del-lote',
    prompt: `${COMUN}

Arregla DOS defectos reales del modulo contrato (${API}/src/modulos/contrato/).

DEFECTO 1 — Un contrato resuelto deja el lote colgado.
ResolverContratoCasoUso cambia el estado del contrato a RESUELTO pero NO mueve el lote ni
escribe en lote_estado_historial: el lote se queda en FINANCIADO para siempre y nadie lo puede
volver a vender. Tiene que devolver el lote a DISPONIBLE dejando la fila del historial con el
motivo y el contrato_venta_id, usando el servicio MovimientoDeEstadoDelLote que exporta el
modulo separacion (mira como lo usa GenerarContratoDesdeSeparacionCasoUso).
Ademas hay que decidir y dejar escrito que pasa con la separacion asociada: una separacion
CONCRETADA cuyo contrato se resolvio no vuelve a estar vigente. Se queda CONCRETADA; el lote
queda DISPONIBLE y una venta nueva empieza por una separacion nueva. Implementalo asi.
Cubrelo con casos en el dominio (estados-del-contrato.ts o donde corresponda).

DEFECTO 2 — La numeracion del contrato no es atomica.
FirmarContratoCasoUso lee ultimoNumeroDelAnio() y despues hace save(): dos firmas a la vez
chocan contra el indice unico idx_contrato_venta_numero y salen como error 500.
Arreglalo de verdad. La opcion mas simple que sirve: dentro de la transaccion, tomar un
lock sobre las filas de la empresa (SELECT ... FOR UPDATE sobre contrato_venta de esa empresa
y ese anio, o un pg_advisory_xact_lock con la empresa y el anio como clave) antes de calcular
el siguiente numero. Elige una, implementala y explica en tu resumen por que.
Alternativa aceptable: reintentar ante la violacion del unico, con un tope de intentos.
Lo que NO se acepta es dejarlo como esta.

Al terminar: tsc limpio y las unitarias del modulo contrato en verde.`,
  },
  {
    key: 'concepto',
    label: 'arreglar:concepto-de-cobro',
    prompt: `${COMUN}

Arregla UN defecto y cierra UNA deuda.

DEFECTO — cuota.conceptoCobroId siempre queda en NULL.
La migracion 1788134400000 siembra dos conceptos por empresa, CUOTA_INICIAL y CUOTA_MENSUAL,
en la tabla concepto_cobro (que pertenece al modulo empresa,
${API}/src/modulos/empresa/). Pero el modulo contrato no los resuelve al generar el
cronograma, asi que todas las cuotas nacen sin concepto y despues no se les puede emitir
comprobante.
Resuelvelo respetando ADR-001 (un modulo no inyecta el repositorio de otro): el modulo empresa
debe exportar un caso de uso que, dada una empresa y un codigo de concepto, devuelva el
concepto; contrato lo inyecta. Mira como precio expone CalcularPrecioDeLoteCasoUso y como
lote expone ContarLotesConListaDePrecioCasoUso: mismo patron.
La cuota numero 0 lleva CUOTA_INICIAL; las cuotas 1..N llevan CUOTA_MENSUAL.
Si la empresa no tiene el concepto sembrado, la generacion del contrato debe fallar con un
mensaje claro que diga que falta configurar ese concepto de cobro en la empresa, NO dejar la
cuota sin concepto en silencio.

DEUDA — dos indices que la entity no refleja.
- idx_parametro_clave_proyecto es NULLS NOT DISTINCT
- idx_lote_estado_historial_lote es ("lote_id", "fecha_creacion" DESC)
TypeORM 0.3 no sabe expresar ni lo uno ni lo otro con @Index. Con synchronize: false no rompe
nada, pero la entity miente respecto al DDL. Declara esa excepcion de forma explicita: mira
${API}/test/arquitectura.spec.ts y agrega ahi la lista de indices declarados-en-la-migracion
-y-no-en-la-entity, con el motivo, de modo que la prueba falle si alguien agrega uno nuevo sin
declararlo. Si el repo tiene carpeta de ADRs (busca docs/arquitectura o similar), escribe
tambien la nota corta ahi.

Al terminar: tsc limpio y las unitarias en verde.`,
  },
]

const arreglos = await parallel(
  ARREGLOS.map((a) => () => agent(a.prompt, { label: a.label, phase: 'Arreglar', effort: 'high' }))
)

log('Arreglos aplicados. Escribiendo las pruebas de integracion.')

phase('Probar')
const PRUEBAS = [
  {
    key: 'separacion',
    label: 'probar:separacion',
    prompt: `${COMUN}

Escribe ${API}/test/separacion.spec.ts: la prueba de INTEGRACION del modulo separacion.

LEE PRIMERO, y copia su forma exactamente:
- ${API}/test/cliente.spec.ts  (la prueba de integracion mas reciente y parecida)
- ${API}/test/utilidades/  (todas: como se levanta la app, como se autentica, como se siembra)

Cubre el flujo completo por HTTP, no por llamadas directas a los casos de uso:
1. Solicitar una separacion sobre un lote disponible: 201, el lote queda en
   SEPARACION_SOLICITADA, lote.precio_lista quedo congelado, y hay fila en lote_estado_historial.
2. Solicitar una segunda separacion sobre el MISMO lote: 409 con mensaje claro, no un 500 del
   indice unico.
3. Solicitar con monto por debajo del minimo del parametro: 400.
4. Aprobar: el estado pasa a VIGENTE, fecha_vigencia = hoy + separacion_dias_vigencia, el lote
   pasa a SEPARADO y hay otra fila de historial.
5. Rechazar una solicitada: el lote vuelve a DISPONIBLE.
6. Aprobar una que ya esta aprobada: 409 o 400 por transicion ilegal, nunca 500.
7. Prorrogar una vigente: la fecha_vigencia se corre 7 dias y aparece en GET /:id/prorrogas.
8. Prorrogar por encima de prorroga_semanas_maximas sin autorizacion de gerencia: se rechaza.
9. Liberar una vigente: LIBERADA y el lote DISPONIBLE.
10. Los permisos: un usuario sin VENTAS_APROBAR no puede aprobar (403) pero si puede listar
    si tiene VENTAS_VER.
11. GET /separaciones con filtro por estado y la paginacion.

No inventes utilidades nuevas si las que hay sirven. No toques codigo de produccion:
si encuentras un defecto, escribe la prueba que lo demuestra, marcala y REPORTALO en tu
resumen en vez de callarlo.`,
  },
  {
    key: 'contrato',
    label: 'probar:contrato',
    prompt: `${COMUN}

Escribe ${API}/test/contrato.spec.ts: la prueba de INTEGRACION del modulo contrato.

LEE PRIMERO, y copia su forma exactamente:
- ${API}/test/cliente.spec.ts
- ${API}/test/utilidades/  (todas)

Cubre por HTTP:
1. Generar un contrato desde una separacion VIGENTE: 201. Verifica en la base que quedaron
   el contrato, sus firmantes (exactamente un TITULAR), sus cuatro colindancias congeladas,
   el cronograma y las N+1 cuotas.
2. Que la SUMA de las cuotas es EXACTAMENTE precio_pactado + recargo_financiamiento.
   Esta es la prueba mas importante del modulo: hazla con varios juegos de numeros que no
   dividan exacto (por ejemplo 48000 con 7 cuotas, 33333.33 con 13 cuotas).
3. Que la cuota 0 nace con monto_pagado igual al monto de la separacion.
4. Que la separacion quedo CONCRETADA y el lote quedo FINANCIADO, con fila en
   lote_estado_historial que apunta al contrato.
5. Generar contrato desde una separacion que NO esta vigente: se rechaza.
6. Precio pactado distinto al de lista sin motivo: 400.
7. Cuota inicial por debajo de cuota_inicial_minima del proyecto: 400.
8. Numero de cuotas por encima de financiamiento_plazo_maximo_meses: 400.
9. Contado con mas cuotas que credito_contado_meses_maximos: 400.
10. Firmar: asigna numero con el formato CV-AAAA-NNNN y el correlativo avanza por empresa.
11. Resolver: el contrato queda RESUELTO y el lote vuelve a DISPONIBLE con su fila de historial.
12. GET /contratos/:id/cronograma y /cuotas devuelven lo esperado.
13. Los permisos: sin VENTAS_GESTIONAR no se puede generar (403).

No toques codigo de produccion: si encuentras un defecto, escribe la prueba que lo demuestra,
marcala y REPORTALO en tu resumen.`,
  },
  {
    key: 'configuracion',
    label: 'probar:parametro-y-precio',
    prompt: `${COMUN}

Escribe DOS archivos:
- ${API}/test/parametro.spec.ts
- ${API}/test/precio.spec.ts

LEE PRIMERO, y copia su forma exactamente:
- ${API}/test/cliente.spec.ts
- ${API}/test/utilidades/  (todas)

parametro.spec.ts cubre por HTTP:
1. GET /parametros devuelve las 13 claves sembradas por la migracion, con su seccion y su
   tipo esperado.
2. PATCH cambia el valor y el cambio se ve en la siguiente lectura.
3. PATCH con un valor del tipo equivocado (texto donde va un entero): 400.
4. POST crea un override por proyecto y esa fila gana sobre la global al leerla.
5. POST repetido para la misma clave y proyecto: 409.
6. POST sin proyectoId: 400, porque un global no se crea desde la pantalla.
7. DELETE sobre una fila global: 400. Sobre un override: funciona.
8. Sin PARAMETROS_GESTIONAR: 403.

precio.spec.ts cubre por HTTP:
1. POST crea una lista de precios; una segunda lista para el mismo proyecto cierra la anterior
   poniendole vigencia_hasta el dia antes, y solo queda una abierta.
2. GET /listas-precio/vigente/:proyectoId devuelve la abierta.
3. GET /listas-precio/lote/:loteId devuelve el desglose y el precio calculado. Comprueba la
   aritmetica con un lote esquina y con uno interior: los importes tienen que cuadrar al centimo.
4. Un lote sin area, o una lista sin precio_m2: error claro, no un cero.
5. Las colindancias: POST /lotes/:loteId/colindancias guarda los cuatro lados y reemplaza los
   anteriores; con un lado repetido o faltante se rechaza.
6. Los permisos de PRECIOS_GESTIONAR e INVENTARIO_GESTIONAR.

No toques codigo de produccion: si encuentras un defecto, escribe la prueba que lo demuestra,
marcala y REPORTALO en tu resumen.

===== LO QUE SE ACABA DE ARREGLAR (por si toca lo tuyo) =====
${arreglos.filter(Boolean).join('\n\n---\n\n')}`,
  },
]

const pruebas = await parallel(
  PRUEBAS.map((p) => () => agent(p.prompt, { label: p.label, phase: 'Probar', effort: 'high' }))
)

return { arreglos, pruebas }
