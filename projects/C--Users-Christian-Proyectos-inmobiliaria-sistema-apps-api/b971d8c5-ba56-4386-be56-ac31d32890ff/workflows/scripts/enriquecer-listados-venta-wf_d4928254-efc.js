export const meta = {
  name: 'enriquecer-listados-venta',
  description: 'Enriquece los listados de contratos y separaciones y expone lo que el front necesita',
  phases: [{ title: 'Enriquecer', detail: 'listados y endpoints faltantes' }],
}

const SIS = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const API = `${SIS}/apps/api`
const WEB = `${SIS}/apps/web/src/app`

const COMUN = `
PROYECTO: sistema inmobiliario BLP. Monorepo ${SIS}, rama feat/separacion-contrato-cronograma.
Backend NestJS + TypeORM + PostgreSQL en ${API}. Frontend Angular 18 en ${WEB}.
Los modulos parametro, precio, separacion y contrato acaban de construirse y estan en verde.

LEE ${SIS}/CLAUDE.md ANTES DE EMPEZAR. Es la ley del proyecto. Lo que mas te va a pegar:
- Regla 6: CERO COMENTARIOS. Ni //, ni /* */, ni JSDoc, ni <!-- --> en templates.
  Lo verifica test/sin-comentarios.spec.ts.
- Regla 10: contar, sumar y agrupar es trabajo de la base. Un find() seguido de .length o de
  un reduce es un COUNT escrito en el idioma equivocado. Una consulta por elemento de un
  arreglo es un N+1. El agregado vive detras de su PROPIO puerto
  (ResumenXRepositorio, ConteoDeYRepositorio), no colgado del repositorio de la entidad.
  Y el COUNT vuelve como bigint: hay que castear ::int en el SQL.
- Regla 9: el caso de uso lanza ErrorDominio (NoEncontrado, Conflicto, DatoInvalido,
  ReglaDeNegocio), nunca una excepcion de Nest.
- ADR-001: ningun modulo inyecta el repositorio de otro; se habla por casos de uso exportados.
- Molde hexagonal: dominio/ · aplicacion/ · infraestructura/persistencia/ · api/.
  Lo verifica test/arquitectura.spec.ts.
- Los BIGINT vuelven como string del driver pg.

Referencia de como se hace un listado enriquecido bien hecho en este repo:
- ${API}/src/modulos/cliente/aplicacion/listar-clientes.caso-uso.ts
- ${API}/src/modulos/empresa/  (busca ahi el patron de puerto de agregado, si existe)

Verifica siempre con:
  npx tsc --noEmit -p ${API}/tsconfig.json
  cd ${SIS}/apps/web && npx ngc -p tsconfig.app.json
Y las unitarias saltando Postgres (Docker puede no estar listo), desde ${API}:
  npx jest --globalSetup=<js con funcion async vacia> --globalTeardown=<el mismo> --testPathPattern "..."
Crea ese no-op en un temporal tuyo.
`

phase('Enriquecer')

const TAREAS = [
  {
    key: 'contratos',
    label: 'enriquecer:listado-de-contratos',
    prompt: `${COMUN}

PROBLEMA: GET /contratos devuelve la entidad ContratoVenta pelada, sin el nombre del cliente ni
el codigo del lote. La bandeja de contratos del front no los puede mostrar sin hacer N+1 en el
navegador, asi que hoy la pantalla lista numeros de contrato sin decir de quien son.

ARREGLALO EN EL BACKEND, no en el navegador.
- ${API}/src/modulos/contrato/aplicacion/listar-contratos.caso-uso.ts debe devolver, por fila,
  ademas de lo que ya devuelve: el nombre del cliente (usa nombreParaMostrar de
  @inmobiliaria/contratos, que ya existe y ya lo usa cliente), su documento, el codigo del lote
  y el de su manzana, y el nombre del proyecto.
- Hazlo con UNA consulta con joins en el repositorio, no con un find() por fila ni con un
  Promise.all(map(...)). Es literalmente el ejemplo de la regla 10.
- Define el tipo de la fila enriquecida (ContratoListado o similar) y exportalo del caso de uso,
  como hace listar-clientes.caso-uso.ts con ClienteListado.

DESPUES actualiza el front para que lo use:
- ${WEB}/funcionalidades/contrato/modelos/contrato.modelo.ts y
  ${WEB}/funcionalidades/contrato/contrato-lista/contrato-lista.component.ts
- La bandeja debe mostrar cliente y lote en columnas propias, y quitar el codigo que hoy resuelve
  esos nombres a mano si lo hay.

MISMO PROBLEMA, MISMA SOLUCION, en el listado de separaciones:
- ${API}/src/modulos/separacion/aplicacion/listar-separaciones.caso-uso.ts
- Hoy el front (${WEB}/funcionalidades/separacion/) resuelve lote, cliente, asesor y manzana con
  un forkJoin de consultas por id, y se degrada a "Lote 12 / Usuario 7" cuando el usuario no
  tiene permiso de inventario o de usuarios. Eso es un N+1 con permisos prestados.
  El listado debe traer ya resueltos: codigo del lote y de la manzana, nombre y documento del
  cliente, y nombre del asesor. Una consulta con joins.
- Limpia del front el servicio de referencias que ya no haga falta y las degradaciones
  ("Usuario 7") que dejan de aplicar. Si algo de ese servicio sigue siendo necesario para el
  formulario, dejalo; solo quita lo que muere con el listado enriquecido.

No inventes columnas nuevas en la base: todo sale de joins sobre lo que ya existe.`,
  },
  {
    key: 'precios',
    label: 'enriquecer:listas-de-precio',
    prompt: `${COMUN}

Cierra tres huecos chicos del modulo precio y su pantalla.

HUECO 1 — ContarLotesConListaDePrecioCasoUso existe y ningun controller lo expone.
La pantalla de listas de precios quiere la columna "lotes vendidos con esta lista" en el
historial, y hoy no puede. Exponlo. Lo natural es que GET /listas-precio devuelva el conteo por
fila, no un endpoint aparte: una sola consulta agregada para todas las listas de la pagina
(GROUP BY lista_precio_id con ::int), NO una consulta por lista. Regla 10: el agregado va
detras de su propio puerto.

HUECO 2 — no existe GET /listas-precio/:id.
La accion "Ver" del historial no tiene a donde ir. Agrega el endpoint y su caso de uso, con
NoEncontrado si no existe.

HUECO 3 — la tabla "como queda el precio" del prototipo.
La pantalla quiere mostrar como queda el precio de unos cuantos lotes del proyecto con los
valores de la lista. Hoy el front tendria que llamar GET /listas-precio/lote/:loteId una vez por
lote, que es el N+1 otra vez. Agrega un endpoint que tase VARIOS lotes de un proyecto con una
lista dada, en una sola consulta, devolviendo el desglose por lote. Piensa bien la forma de la
ruta: es una consulta sobre la lista, no sobre los lotes.
El calculo lo hace la funcion pura que ya existe en
${API}/src/modulos/precio/dominio/calculo-del-precio.ts: no escribas una segunda formula.

DESPUES actualiza el front:
- ${WEB}/funcionalidades/lista-precio/  (modelos, servicio y los dos componentes)
- La ficha debe llenar la tabla "como queda el precio" con el endpoint nuevo, y el historial
  debe mostrar la columna de lotes y tener la accion Ver funcionando.

Cada funcion pura nueva de dominio/ lleva su .spec.ts hermano: lo exige
test/cobertura-pruebas.spec.ts y falla la suite si falta.`,
  },
]

const hechos = await parallel(
  TAREAS.map((t) => () => agent(t.prompt, { label: t.label, phase: 'Enriquecer', effort: 'high' }))
)

return { hechos }
