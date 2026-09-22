export const meta = {
  name: 'retirar-lista-de-precios',
  description: 'Retira la lista de precios del backend y del frontend: el precio se escribe al separar',
  phases: [
    { title: 'Retirar', detail: 'backend y frontend en paralelo' },
    { title: 'Verificar', detail: 'que no quede ni un rastro' },
  ],
}

const SIS = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const API = `${SIS}/apps/api`
const WEB = `${SIS}/apps/web/src/app`

const DECISION = `
LA DECISION DE NEGOCIO QUE HAY QUE APLICAR (la dio Christian, es la autoridad del negocio):

NO EXISTE UNA LISTA DE PRECIOS. Nunca existio y no se va a construir ahora.
La empresa no tiene padron de lotes ni tabla de precios previa: el plano es el inventario y
el lote NACE EN LA SEPARACION (ADR-022, RN-157). Como no hay lote antes de la separacion,
tampoco hay a que aplicarle una lista de precios.

EL PRECIO SE DEFINE EN EL MOMENTO DE LA SEPARACION, con el cliente delante. Lo escribe el
asesor. No se calcula, no se propone desde ninguna tabla, no se deriva de un precio por m2.

La historia E02-07 ("Precio por proyecto y lista de precios") quedo desactualizada por ADR-022,
igual que le paso a E02-08 (carga masiva de lotes), que se retiro el 1 de setiembre. La regla
RN-113 existe en el PRD, pero describe rangos de precio de una reunion, no una tabla cargable:
la pregunta abierta P-N41 dice literal que "la tabla de precios no llego como archivo".

LO QUE QUEDA EN SU LUGAR: tres columnas en la tabla "lote", que la migracion
${API}/src/migraciones/1788134400000-SeparacionContratoYCronograma.ts YA declara asi
(YO ACABO DE EDITARLA, leela para ver el estado actual):
  "precio_base"       NUMERIC(12,2) NULL
  "ajuste_ubicacion"  NUMERIC(12,2) NULL
  "precio_lista"      NUMERIC(12,2) NULL   + CHECK ck_lote_precio_lista (> 0 o NULL)
Las tres las escribe el caso de uso de SOLICITAR SEPARACION con lo que mando el asesor.
Probablemente lleguen las tres con el mismo valor y el ajuste en cero: eso es correcto y
esperado, no es un caso raro que haya que impedir.
La tabla "lista_precio" y la columna "lote.lista_precio_id" YA NO EXISTEN en la migracion.
"contrato_venta.precio_lista" SI SIGUE EXISTIENDO: es el precio del lote congelado al firmar,
que el contrato compara contra el precio pactado. Eso no cambia.
`

const COMUN = `
PROYECTO: sistema inmobiliario BLP. Monorepo ${SIS}, rama feat/separacion-contrato-cronograma.
Backend NestJS + TypeORM + PostgreSQL en ${API}. Frontend Angular 18 en ${WEB}.

LEE ${SIS}/CLAUDE.md ANTES DE EMPEZAR. Es la ley del proyecto. Lo que mas te va a pegar:
- Regla 6: CERO COMENTARIOS. Ni //, ni /* */, ni JSDoc, ni <!-- --> en templates.
  Lo verifica test/sin-comentarios.spec.ts.
- Regla 9: el caso de uso lanza ErrorDominio, nunca una excepcion de Nest.
- Regla 10: contar y agregar es trabajo de la base.
- ADR-001: ningun modulo inyecta el repositorio de otro; se habla por casos de uso exportados.
- Molde hexagonal: dominio/ · aplicacion/ · infraestructura/persistencia/ · api/.
  Lo verifica test/arquitectura.spec.ts, que ademas tiene una lista de entidades importadas
  a mano: si borras o mueves una entity, hay que actualizar esa lista.
- test/cobertura-pruebas.spec.ts falla si un archivo de dominio/ se queda sin su .spec.ts,
  y tambien si sobra un .spec.ts sin su archivo.

${DECISION}

VERIFICA SIEMPRE, y no des por terminado hasta que las tres esten limpias:
  npx tsc --noEmit -p ${API}/tsconfig.json
  cd ${SIS}/apps/web && npx ngc -p tsconfig.app.json
  cd ${API} && npx jest --globalSetup=<no-op> --globalTeardown=<no-op> --testPathPattern "src/modulos|test/(arquitectura|sin-comentarios|cobertura-pruebas)"
El no-op es un .js que exporta una funcion async vacia; crealo en un temporal tuyo.
Docker puede estar arrancando, por eso el no-op.

BORRA ARCHIVOS DE VERDAD con la herramienta de shell (rm). No dejes archivos huerfanos
"por si acaso": lo que no va, se va.
`

phase('Retirar')

const TAREAS = [
  {
    key: 'backend',
    label: 'retirar:backend',
    prompt: `${COMUN}

TU TRABAJO: sacar la lista de precios del backend.

1. EL MODULO ${API}/src/modulos/precio/ SE DESARMA.
   Hoy tiene dos cosas: lista_precio (que se va entera) y lote_colindancia (que se queda,
   porque las colindancias del lote si existen y el contrato las necesita).
   - Borra todo lo de lista_precio: entity, repositorio, puerto, criterios, casos de uso
     (ListarListasDePrecio, ObtenerListaVigente, CrearListaDePrecio, ActualizarListaDePrecio,
     CalcularPrecioDeLote), el controller lista-precio.controller.ts, sus DTO, y el dominio
     calculo-del-precio.ts y vigencia-de-la-lista.ts con sus .spec.ts.
   - MUEVE lote_colindancia al modulo ${API}/src/modulos/lote/: su entity, su repositorio, su
     puerto, su controller (LoteColindanciaController en 'lotes/:loteId/colindancias'), sus DTO,
     sus casos de uso (ListarColindanciasDelLote, GuardarColindanciasDelLote) y el dominio
     colindancias-del-lote.ts con su .spec.ts. Ajusta todos los imports relativos, que cambian
     de profundidad.
   - decimal-exacto.ts (la aritmetica de centesimas) la usa lote_colindancia: muevela tambien
     a lote/dominio/ con su .spec.ts, salvo que ya no la use nadie, en cuyo caso borrala.
   - Borra la carpeta modulos/precio/ entera y PrecioModule de app.module.ts.
   - LoteModule debe exportar ListarColindanciasDelLoteCasoUso, porque contrato lo inyecta.
   - El permiso PRECIOS_GESTIONAR deja de tener duenno: quitalo de
     ${SIS}/packages/contratos/src/autorizacion.ts, de la migracion 1788134400000 (del INSERT
     de permisos y del rol_permiso, y de su down) y de donde aparezca.
     OJO: el codigo se llama PRECIOS_GESTIONAR. Revisa que no quede referenciado en ningun
     controller. Los otros cuatro permisos nuevos se quedan.

2. lote.entity.ts (${API}/src/modulos/lote/infraestructura/persistencia/lote.entity.ts):
   - quita listaPrecioId
   - deja precioLista y agrega precioBase y ajusteUbicacion, los tres numeric(12,2) nullable,
     con el "comment:" que la migracion ya escribe (copialo textual de la migracion)
   - agrega el CHECK ck_lote_precio_lista como corresponda si la entity declara checks

3. EL MODULO separacion (${API}/src/modulos/separacion/) YA NO CALCULA EL PRECIO.
   Hoy SolicitarSeparacionCasoUso inyecta CalcularPrecioDeLoteCasoUso y con eso congela
   lote.precio_lista. Eso se acabo.
   - El DTO SolicitarSeparacionDto recibe ahora precioBase, ajusteUbicacion y precioLista como
     importes en STRING decimal (el modulo ya tiene el patron: mira api/dto/monto.ts y
     PATRON_DE_MONTO, reusalo, no escribas otro).
     precioBase y precioLista obligatorios; ajusteUbicacion opcional, y si no viene es "0".
   - Regla de dominio nueva, en separacion/dominio/, con su .spec.ts: precio_lista tiene que
     ser igual a precio_base + ajuste_ubicacion. Si no cuadra, DatoInvalido con un mensaje
     que diga los tres numeros. Usa aritmetica entera de centimos, como todo el dinero de este
     repo. Que el ajuste sea cero y los tres valores iguales es el caso NORMAL, no un error.
   - SolicitarSeparacionCasoUso escribe los tres campos en el lote al crear la separacion,
     junto a lo que ya escribia (cliente_id y el movimiento de estado).
   - Quita la dependencia de PrecioModule del SeparacionModule; ahora depende de LoteModule
     para las colindancias si es que las usaba.

4. El modulo contrato sigue leyendo lote.precio_lista para congelarlo en contrato_venta:
   eso NO cambia. Solo revisa que no se haya quedado inyectando nada del modulo precio, y que
   las colindancias las pida ahora al modulo lote.

5. Actualiza test/arquitectura.spec.ts: la lista de entidades importadas a mano tiene que
   perder ListaPrecio y apuntar LoteColindancia a su ruta nueva.

6. Si ${API}/test/precio.spec.ts existe, reescribelo o borralo segun corresponda: lo de
   lista_precio se va; lo de colindancias, si estaba ahi, muevelo a test/lote.spec.ts
   (creandolo si no existe, con la forma de test/cliente.spec.ts).

7. Actualiza test/separacion.spec.ts: solicitar una separacion ahora manda los tres importes;
   agrega el caso de que precio_lista no cuadre con base + ajuste y de que el ajuste en cero
   con los tres iguales SI funciona.`,
  },
  {
    key: 'frontend',
    label: 'retirar:frontend',
    prompt: `${COMUN}

TU TRABAJO: sacar la lista de precios del frontend.

1. BORRA ${WEB}/funcionalidades/lista-precio/ ENTERA (modelos, servicios, los dos componentes
   y lista-precio.rutas.ts).

2. ${WEB}/app.routes.ts: quita el bloque de la ruta 'listas-precio'.
   NO toques las otras rutas nuevas (separaciones, contratos, parametros): esas se quedan.

3. ${WEB}/layout/barra-lateral.component.ts:
   - quita el enlace 'listasPrecio' del grupo Inventario
   - quita su entrada del mapa EXIGIDO
   - quita el icono @case ('precios') del @switch, que ya no lo usa nadie
   Deja intactos los enlaces 'separaciones', 'contratos' y 'parametros'.

4. ${WEB}/funcionalidades/separacion/separacion-formulario/separacion-formulario.component.ts
   ES EL CAMBIO IMPORTANTE. Hoy la pantalla pide GET /listas-precio/lote/:loteId y muestra el
   precio ya calculado como un dato de solo lectura ("Precio por m2 · Precio base · Recargo
   esquina · Precio de lista"). Ese endpoint ya no existe.
   Ahora el precio SE ESCRIBE. Reemplaza ese bloque por tres campos editables:
     Precio base        (obligatorio)
     Ajuste por ubicacion  (opcional, arranca en 0, admite negativo)
     Precio del lote    (obligatorio) — se propone como base + ajuste mientras el usuario no lo
                         toque a mano, y queda editable
   El bloque debe explicar en una linea que el precio se acuerda con el cliente en este momento,
   que es de lo que se trata: es la primera vez que el lote tiene precio.
   Muestra el aviso cuando precio del lote no cuadra con base + ajuste, con el mismo criterio
   que el backend, calculando en CENTIMOS ENTEROS (el helper enCentimos() ya existe en
   ${WEB}/funcionalidades/separacion/modelos/vigencia-de-la-separacion.ts: reusalo).
   Los tres viajan en el POST /separaciones como strings decimales.
   Quita del servicio de referencias lo que servia solo para pedir el precio.

5. Barre TODO el frontend buscando restos: "listaPrecio", "listasPrecio", "listas-precio",
   "PRECIOS_GESTIONAR", "precioM2", "recargoEsquina", "recargoFrenteParque",
   "ajusteInteriorSinVistaMar", "recargoZonaPremiumClub", "vigenciaDesde" de lista.
   Si aparece en ${WEB}/funcionalidades/lote/ o en cualquier otro lado, limpialo.
   El campo lote.precioLista SI se queda, y ahora lo acompanan precioBase y ajusteUbicacion:
   actualiza ${WEB}/funcionalidades/lote/modelos/lote.modelo.ts si declara esos campos.

6. En la ficha de la separacion y en el formulario de contrato, donde se muestre el precio del
   lote, sigue mostrandose: sale de lote.precioLista, que ahora se lleno al separar. Revisa que
   ningun texto de la interfaz siga diciendo "lista de precios", "precio de tabla", "precio por
   m2" o "lista vigente", porque eso ya no es cierto. Cambialo por "precio del lote".`,
  },
]

const hechos = await parallel(
  TAREAS.map((t) => () => agent(t.prompt, { label: t.label, phase: 'Retirar', effort: 'high' }))
)

log('Backend y frontend limpiados. Barriendo restos.')

phase('Verificar')
const barrido = await agent(
  `${COMUN}

Los dos agentes ya retiraron la lista de precios del backend y del frontend.

TU TAREA: barrer el monorepo entero y no dejar UN SOLO RASTRO. Puedes editar y borrar.

1. Busca en TODO ${SIS} (excluyendo node_modules, dist, .angular, out-tsc, .git) estas cadenas:
     lista_precio · listaPrecio · ListaPrecio · listas-precio · LISTA_PRECIO
     PRECIOS_GESTIONAR · precio_m2 · precioM2
     recargo_esquina · recargoEsquina · recargo_frente_parque · recargoFrenteParque
     ajuste_interior_sin_vista_mar · ajusteInteriorSinVistaMar
     recargo_zona_premium_club · recargoZonaPremiumClub
     CalcularPrecioDeLote · PrecioModule · calculo-del-precio · vigencia-de-la-lista
   Cada aparicion: o se limpia, o justificas por escrito por que se queda.
   OJO con los falsos positivos legitimos que NO se tocan:
     - contrato_venta.precio_lista y contratoVenta.precioLista (el precio congelado al firmar)
     - lote.precio_lista / precioLista, lote.precio_base / precioBase,
       lote.ajuste_ubicacion / ajusteUbicacion (las tres columnas nuevas)
     - lote.es_esquina, es_frente_parque, es_interior_sin_vista_mar, es_zona_premium_club
       (las banderas del lote, que existen desde antes y se quedan)

2. Verifica que la migracion 1788134400000 no cree ya lista_precio, que su down no la borre,
   y que el permiso PRECIOS_GESTIONAR no aparezca ni en el INSERT ni en el rol_permiso ni en
   el down. Si quedo algo, arreglalo.

3. Corre las tres verificaciones y dejalas en verde:
     npx tsc --noEmit -p ${API}/tsconfig.json
     cd ${SIS}/apps/web && npx ngc -p tsconfig.app.json
     cd ${API} && npx jest --globalSetup=<no-op> --globalTeardown=<no-op> --testPathPattern "src/modulos|test/(arquitectura|sin-comentarios|cobertura-pruebas)"

4. Reporta: que limpiaste, que dejaste a proposito y con que motivo, y si algo quedo roto que
   no supiste arreglar.

===== LO QUE REPORTO CADA AGENTE =====
${TAREAS.map((t, i) => `--- ${t.key} ---\n${hechos[i] || '(sin resultado)'}`).join('\n\n')}`,
  { label: 'verificar:sin-rastros', phase: 'Verificar', effort: 'high' }
)

return { hechos, barrido }
