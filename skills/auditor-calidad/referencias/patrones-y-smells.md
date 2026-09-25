# Patrones GoF y code smells aplicados a unimar_tms

Insumo para una skill que audita calidad de código. Fuente: refactoring.guru (catálogo de patrones, catálogo de smells y técnicas de refactor). Inspección de solo lectura del repo `C:\Christian\unimar_tms` el 2026-09-25, rama `feature/maestras-sap`.

Ámbitos:
- **API**: `src/apps/api/src` (NestJS, hexagonal: `domain/ application/ infrastructure/ api/`)
- **Web**: `src/apps/web/src` (React + React Query + Zod)
- **Android**: `apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans` (Kotlin + Compose)

Contexto que cambia el umbral de la auditoría:
- La API (`src/apps/api/.eslintrc.cjs:29-32`) y la web (`src/apps/web/eslint.config.js:86-92`) **ya imponen por lint** `max-lines-per-function: 50`, `max-params: 3`, `complexity: 10`, `max-depth: 3` y `max-lines: 250` (en la web). La función más larga de producción en TS mide 67 líneas (`planificacion/domain/errores.ts:155`, un mapeo exhaustivo). Ninguna tiene 5 o más parámetros.
- **Android no tiene detekt ni ktlint.** Es donde hoy aparecen los smells de tamaño.

---

## 1. Los 22 patrones GoF frente al TMS

Leyenda de «¿Aplica?»: **Ya se usa** = hay una implementación real (con la ruta) · **Sí** = encaja en un punto concreto y todavía no está · **No** = hoy no hay un problema que lo justifique.

### Creacionales

| Patrón | Problema que resuelve | ¿Aplica? | Dónde se usa / dónde encajaría | Señal de que falta | Cuándo NO usarlo |
|---|---|---|---|---|---|
| [Factory Method](https://refactoring.guru/design-patterns/factory-method) | Decidir qué clase concreta crear sin que quien la usa lo sepa | Ya se usa | `planificacion.module.ts:136` `emisorDeGuias()` y `:142` `mensajeroPush()` eligen el adaptador HTTP/Firebase o el inactivo según la configuración (`useFactory`). En Android, `GestoDelTelefono.nuevo()` (`datos/GestoDelTelefono.kt:36`) | `if (config.x) new A() else new B()` repetido en varios constructores o casos de uso | Cuando hay una sola implementación y no se prevé otra: `new` directo o el proveedor de Nest basta |
| [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory) | Crear familias de objetos que deben ir juntos | No | No hay familias de productos (p. ej., un juego de adaptadores SAP de prueba frente a uno real que deban cambiar en bloque). Nest DI ya cubre el cambio por entorno | Varios `useFactory` que siempre se cambian juntos según el mismo flag | Casi siempre en un CRUD/TMS: el contenedor DI hace este trabajo |
| [Builder](https://refactoring.guru/design-patterns/builder) | Armar un objeto complejo paso a paso | Ya se usa (librería) | El `QueryBuilder` de TypeORM en `infrastructure/persistence/*.typeorm.ts`. En las pruebas, `shared/infrastructure/persistence/constructor-falso.ts:41` | Constructores o fábricas de prueba con más de 3 parámetros opcionales, o *fixtures* copiados y pegados entre specs | En objetos de dominio con 3 o 4 campos: un literal o un `crear()` son más claros |
| [Prototype](https://refactoring.guru/design-patterns/prototype) | Clonar un objeto existente en lugar de construirlo | No | El dominio es inmutable (`readonly`, `{ ...obj }` o `copy()` en Kotlin): el lenguaje ya da la clonación | Copias manuales campo por campo de objetos grandes | En TS y Kotlin: spread y `data class.copy()` lo resuelven |
| [Singleton](https://refactoring.guru/design-patterns/singleton) | Una sola instancia con acceso global | Ya se usa (implícito) | Los proveedores de Nest tienen alcance *singleton* por defecto. En Kotlin: `object AvisosDeOferta` (`avisos/AvisosDeOferta.kt:20`), `object AvisosDeGuia` y el `apiUnitrans` global que usa por defecto `RepositorioViajes.kt:33` | Una clase con `static instancia` escrita a mano en la API: es un antipatrón frente al DI | Nunca escribirlo a mano en NestJS. En Android, preferir la inyección por constructor, porque el `object` global dificulta las pruebas |

### Estructurales

| Patrón | Problema que resuelve | ¿Aplica? | Dónde se usa / dónde encajaría | Señal de que falta | Cuándo NO usarlo |
|---|---|---|---|---|---|
| [Adapter](https://refactoring.guru/design-patterns/adapter) | Hacer que una interfaz ajena calce con la que espera tu código | Ya se usa (es el núcleo hexagonal) | Los puertos están en `modules/*/domain/puertos/*.ts` (unos 38). Los adaptadores: `*.typeorm.ts`, `planificacion/infrastructure/emisor-de-guias/emisor-de-guias.http.ts`, `shared/infrastructure/mensajeria/mensajero-push.firebase.ts`, `recepcion/infrastructure/excel/lector-reporte-excel.ts`. En Android: `datos/MapeoDeViajes.kt` (DTO de red → modelo) | Un caso de uso o dominio que importa `typeorm`, `axios`, `firebase-admin` o `exceljs` | Envolver una librería cuyo contrato ya es estable y que solo usa la infraestructura |
| [Bridge](https://refactoring.guru/design-patterns/bridge) | Separar dos ejes que varían por su cuenta para no multiplicar subclases | No | No hay jerarquías cruzadas (p. ej., tipo de documento × medio de envío) | Clases llamadas `XPorY`, `XPorZ`… que crecen como producto cartesiano | Con un solo eje de variación, Strategy o Adapter bastan |
| [Composite](https://refactoring.guru/design-patterns/composite) | Tratar igual una hoja y un grupo en un árbol | No (marginal) | El menú de la web (`app/armazon/menu-de-navegacion.tsx:79`, `GrupoDesplegable`) es un árbol de dos niveles resuelto con componentes, que en React es suficiente | Código recursivo que pregunta «¿es grupo o es hoja?» en varios sitios | Con árboles de profundidad fija 1 o 2 |
| [Decorator](https://refactoring.guru/design-patterns/decorator) | Añadir comportamiento envolviendo, sin tocar la clase | Ya se usa | Interceptores de Nest: `shared/api/transform.interceptor.ts`, `shared/cache/invalidacion-de-cache.interceptor.ts`, `shared/observabilidad/nombre-de-transaccion.interceptor.ts`. Decoradores de parámetro: `shared/api/ultimo-cambio.decorador.ts`, `shared/api/escritura.decorador.ts` | Logging, caché, métricas o reintentos copiados dentro de cada método de caso de uso o repositorio | Para lógica de negocio: el decorador esconde reglas que deben leerse en el caso de uso |
| [Facade](https://refactoring.guru/design-patterns/facade) | Dar una puerta simple a un subsistema complejo | Ya se usa | Cada `*.caso-uso.ts` es la fachada de su flujo ante el controlador. En la web, `nucleo/api/cliente-http.ts` (`obtener`, `enviarJson`, `parchearJson`). En Android, `datos/RepositorioViajes.kt` ante Retrofit | Controladores o componentes que orquestan 3 o más repositorios o servicios directamente | Cuando la fachada solo reenvía llamadas 1 a 1 (smell *Middle Man*) |
| [Flyweight](https://refactoring.guru/design-patterns/flyweight) | Compartir estado para ahorrar memoria con millones de objetos | No | El volumen del TMS (filas de Excel, bandejas paginadas) no lo justifica | Perfilado con presión de memoria por objetos repetidos | Siempre, salvo medición real de memoria |
| [Proxy](https://refactoring.guru/design-patterns/proxy) | Controlar el acceso a otro objeto (caché, carga diferida, permisos) | Ya se usa (variantes) | La caché de React Query en la web. Los guards de Nest como proxy de protección: `shared/seguridad/guard-ums.ts`, `planificacion/api/guard-de-sede-del-servicio.ts`. Invalidación de caché: `shared/cache/invalidacion-de-cache.interceptor.ts` | Consultas repetidas a un maestro que no cambia, o comprobaciones de permiso copiadas en cada caso de uso | Si solo delega sin controlar nada |

### De comportamiento

| Patrón | Problema que resuelve | ¿Aplica? | Dónde se usa / dónde encajaría | Señal de que falta | Cuándo NO usarlo |
|---|---|---|---|---|---|
| [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) | Pasar una petición por una cadena de manejadores | Ya se usa (framework) | La canalización de Nest: middleware (`shared/observabilidad/trazabilidad.middleware`), guards, pipes (`shared/api/tuberia-de-validacion.ts`), interceptores y el filtro (`shared/api/http-exception.filter.ts`) | Un método con una cadena de `if (!validarA) return; if (!validarB) return;…` que se reutiliza con variantes | Validaciones de negocio de un solo flujo: `Result` + `andThen` de neverthrow ya lo encadena |
| [Command](https://refactoring.guru/design-patterns/command) | Convertir una acción en objeto (encolar, reintentar, deshacer) | Ya se usa (ligero) / Sí en Android si llega el modo sin conexión | Los casos de uso con `ejecutar()` y el `useMutation` de React Query. En Android, `GestoDelTelefono` (fecha del evento + `claveOrigen` idempotente) ya es la mitad de un comando. **Encajaría** en una cola de reenvío sin conexión (hoy no hay Room ni cola) | Pedidos que se pierden sin señal, o reintentos escritos a mano en cada ViewModel | Mientras no haya cola, historial ni deshacer |
| [Iterator](https://refactoring.guru/design-patterns/iterator) | Recorrer una colección sin exponer su estructura | No (lo da el lenguaje) | `for…of`, generadores, `Sequence` y `Flow` de Kotlin. La paginación ya va en `ResultadoPaginado` | Bucles con índices sobre estructuras internas expuestas | Escribirlo a mano en TS o Kotlin |
| [Mediator](https://refactoring.guru/design-patterns/mediator) | Centralizar la comunicación entre muchos componentes | Ya se usa (implícito) | El contenedor DI de Nest. En la web, el contexto de sesión (`nucleo/sesion/proveedor-sesion.tsx`) y React Query como bus de datos entre pantallas | Componentes hermanos que se pasan callbacks en cadena (*prop drilling* de 3 o más niveles), o modales que se llaman entre sí | Si solo hay 2 participantes |
| [Memento](https://refactoring.guru/design-patterns/memento) | Guardar y restaurar el estado de un objeto | No | No hay deshacer. `rememberSaveable` (Compose) y los borradores de formulario de la web cubren lo necesario | Pedido de «deshacer» o de «restaurar borrador» sobre un objeto de dominio | Sin requisito de deshacer |
| [Observer](https://refactoring.guru/design-patterns/observer) | Avisar a varios interesados cuando algo cambia | Ya se usa | Android: `MutableSharedFlow` en `avisos/AvisosDeOferta.kt:21` y `AvisosDeGuia`; `StateFlow` en los ViewModels (`ui/estado/Modelo*.kt`). En la web, las suscripciones de React Query. En la API **no** hay eventos de dominio: los efectos (push, bitácora) se llaman en línea | Un caso de uso de la API que, tras escribir, llama a 3 o más efectos secundarios independientes (push, correo, bitácora) | En la API, mientras los efectos deban ir en la misma transacción o sean 1 o 2: los eventos esconden el flujo |
| [State](https://refactoring.guru/design-patterns/state) | Cambiar el comportamiento según el estado interno | Ya se usa (por tablas) / Sí cuando llegue el recorrido de exportación | `planificacion/domain/recorrido-del-viaje.ts` modela la máquina de checkpoints con tablas (`DEDUCIDOS`, `SIGUE_EN_CURSO`, `posicion()`), no con clases por estado. Es correcto mientras el recorrido sea lineal | `switch (estado)` repetido en 3 o más funciones, o transiciones que dependen del estado **y** de la operación | Con máquinas lineales pequeñas, una tabla `Record<Estado, …>` es más legible que una clase por estado |
| [Strategy](https://refactoring.guru/design-patterns/strategy) | Intercambiar algoritmos que resuelven lo mismo de formas distintas | Ya se usa / Sí (oportunidad 1) | `EMISOR_DE_GUIAS` (`emisor-de-guias.http.ts` o `emisor-de-guias.inactivo.ts`) y `MENSAJERO_PUSH` (firebase o inactivo; también es *Null Object*). Estrategia por tabla: `PERFIL_DE_OPERACION` en `recepcion/domain/reporte-detallado.ts:431`. **Falta** para IMPORTACION/EXPORTACION en planificación y en la web | `if (operacion === IMPORTACION) … else …` disperso en muchos archivos | Con 2 variantes que no crecen y viven en un solo archivo: un ternario basta |
| [Template Method](https://refactoring.guru/design-patterns/template-method) | Fijar el esqueleto de un algoritmo y dejar variar pasos | Ya se usa | `shared/maestras/gestionar-maestra.caso-uso.ts:9` (`normalizar` abstracto) y `shared/maestras/repositorio-maestra.typeorm.ts:34`. En la persistencia: `EntidadConCreacionOrm → EntidadAuditableOrm / EntidadAppendOnlyOrm` | 3 o más casos de uso o repositorios con el mismo esqueleto copiado y 1 o 2 pasos distintos | Si la jerarquía pasa de 2 niveles, o una subclase sobrescribe «para no hacer nada» (*Refused Bequest*): preferir composición |
| [Visitor](https://refactoring.guru/design-patterns/visitor) | Añadir operaciones a una jerarquía sin tocarla | No | Las uniones discriminadas de TS con `switch` exhaustivo (p. ej., `ErrorPlanificacion` en `planificacion/domain/errores.ts`) cumplen su función con verificación del compilador | Una jerarquía de clases estable con muchas operaciones nuevas | En TS y Kotlin con `sealed`/uniones: el `switch`/`when` exhaustivo es el Visitor idiomático |

---

## 2. Code smells: cómo detectarlos en este stack

Umbral «TS» = API + web (ya lo vigila el lint; la skill debe reportar sobre todo los `eslint-disable` y las excepciones por *override*). Umbral «KT» = Android (sin lint: la skill mide).

| Smell | Detección (umbral / grep) | Técnica recomendada |
|---|---|---|
| [Long Method](https://refactoring.guru/smells/long-method) | TS: más de 50 líneas (lo impone el lint); buscar `eslint-disable.*max-lines-per-function`. KT: `@Composable` o `fun` de más de 60 líneas (script de llaves, o detekt `LongMethod`) | [Extract Method](https://refactoring.guru/extract-method), [Decompose Conditional](https://refactoring.guru/decompose-conditional), [Replace Method with Method Object](https://refactoring.guru/replace-method-with-method-object). En Compose: extraer sub-composables |
| [Large Class](https://refactoring.guru/smells/large-class) | Archivo de más de 250 líneas sin contar specs ni migraciones (`wc -l`), clase con más de 15 métodos públicos, módulo Nest con más de 40 proveedores | [Extract Class](https://refactoring.guru/extract-class), [Extract Subclass](https://refactoring.guru/extract-subclass), [Extract Interface](https://refactoring.guru/extract-interface) |
| [Primitive Obsession](https://refactoring.guru/smells/primitive-obsession) | `codigo: String`, `tipo: string` o `estado: string` cuando ya existe un enum. Grep: `rg "\((String|string)\) -> Unit|: string; // (estado|tipo|codigo)"`, y `rg "=== '[A-Z_]{4,}'"` en la web | [Replace Data Value with Object](https://refactoring.guru/replace-data-value-with-object), [Replace Type Code with Class](https://refactoring.guru/replace-type-code-with-class), [Introduce Parameter Object](https://refactoring.guru/introduce-parameter-object) |
| [Long Parameter List](https://refactoring.guru/smells/long-parameter-list) | TS: más de 3 (lint `max-params`). KT: más de 5 parámetros sin contar `modifier` (`rg -U "fun \w+\(\n(\s+\w+:.*\n){6,}"`) | [Introduce Parameter Object](https://refactoring.guru/introduce-parameter-object), [Preserve Whole Object](https://refactoring.guru/preserve-whole-object), [Replace Parameter with Method Call](https://refactoring.guru/replace-parameter-with-method-call) |
| [Data Clumps](https://refactoring.guru/smells/data-clumps) | El mismo trío o par de parámetros en 3 o más firmas (p. ej., `idServicio, gesto`; `numero, instalacionPortuaria, fecha`). Grep de la tupla en firmas | [Extract Class](https://refactoring.guru/extract-class), [Introduce Parameter Object](https://refactoring.guru/introduce-parameter-object) |
| [Switch Statements](https://refactoring.guru/smells/switch-statements) | El mismo discriminante evaluado en 3 o más archivos: `rg "operacion (===|!==) (OperacionServicio\.)?'?(IMPORTACION|EXPORTACION)"`. **No es smell** un `switch` exhaustivo **único** sobre una unión discriminada | [Replace Conditional with Polymorphism](https://refactoring.guru/replace-conditional-with-polymorphism), [Replace Type Code with State/Strategy](https://refactoring.guru/replace-type-code-with-state-strategy). En TS: una tabla `Record<Enum, Politica>` |
| [Temporary Field](https://refactoring.guru/smells/temporary-field) | Propiedades opcionales (`?:` o `\| null`) de una clase o *state* que solo se llenan en un flujo | [Extract Class](https://refactoring.guru/extract-class), [Introduce Null Object](https://refactoring.guru/introduce-null-object) |
| [Refused Bequest](https://refactoring.guru/smells/refused-bequest) | Subclase de `GestionarMaestraCasoUso` o de `RepositorioMaestraTypeorm` que sobrescribe con `throw` o con un cuerpo vacío | [Replace Inheritance with Delegation](https://refactoring.guru/replace-inheritance-with-delegation) |
| [Divergent Change](https://refactoring.guru/smells/divergent-change) | Un archivo que aparece en commits de temas distintos (`git log --format= --name-only \| sort \| uniq -c \| sort -rn`), p. ej. `planificacion.module.ts` | [Extract Class](https://refactoring.guru/extract-class) |
| [Shotgun Surgery](https://refactoring.guru/smells/shotgun-surgery) | Un cambio de negocio que toca 5 o más archivos de capas o apps distintas (p. ej., una nueva operación). Medir con el mismo grep de *Switch Statements* | [Move Method](https://refactoring.guru/move-method), [Move Field](https://refactoring.guru/move-field), [Inline Class](https://refactoring.guru/inline-class) |
| [Parallel Inheritance Hierarchies](https://refactoring.guru/smells/parallel-inheritance-hierarchies) | Cada `*Orm` con su `*Dto` y su `*Red` (Kotlin) que se agregan siempre juntos | [Move Method](https://refactoring.guru/move-method). Suele ser aceptable en hexagonal: es separación deliberada de capas |
| [Comments](https://refactoring.guru/smells/comments) | Comentario que explica *qué* hace el código. El repo ya tiene `scripts/base-de-comentarios-cortos.mjs`; buscar además `// ──`, `/** Campo ... */` sobre campos autoexplicativos | [Extract Method](https://refactoring.guru/extract-method), [Rename Method](https://refactoring.guru/rename-method), [Introduce Assertion](https://refactoring.guru/introduce-assertion) |
| [Duplicate Code](https://refactoring.guru/smells/duplicate-code) | `npx jscpd src/apps --min-lines 8 --ignore "**/*.spec.ts,**/migraciones/**"`. En Android, `jscpd --format kotlin`. Grep de bloques típicos: `rg -c "usuarioCreador!:" --glob "*.dto.ts"` | [Extract Method](https://refactoring.guru/extract-method), [Pull Up Field](https://refactoring.guru/pull-up-field), [Extract Superclass](https://refactoring.guru/extract-superclass), [Form Template Method](https://refactoring.guru/form-template-method) |
| [Lazy Class](https://refactoring.guru/smells/lazy-class) | Clase o archivo de menos de 15 líneas que solo reenvía, o un puerto con una implementación que nadie cambia | [Inline Class](https://refactoring.guru/inline-class), [Collapse Hierarchy](https://refactoring.guru/collapse-hierarchy). Ojo: un puerto de hexagonal **no** es Lazy Class aunque tenga una sola implementación |
| [Data Class](https://refactoring.guru/smells/data-class) | Entidad de dominio sin comportamiento cuyas reglas viven en el caso de uso que la manipula. **No aplica** a DTOs ni a entidades ORM | [Move Method](https://refactoring.guru/move-method), [Encapsulate Field](https://refactoring.guru/encapsulate-field) |
| [Dead Code](https://refactoring.guru/smells/dead-code) | `npx ts-prune` o `npx knip` en API y web; en Android, la advertencia *unused* del compilador o detekt `UnusedPrivateMember`. Buscar enums o columnas sin referencias | Borrar ([Remove Parameter](https://refactoring.guru/remove-parameter), [Inline Class](https://refactoring.guru/inline-class)) |
| [Speculative Generality](https://refactoring.guru/smells/speculative-generality) | Genéricos `<T, U, V>` con un solo uso, clases abstractas con una sola hija, parámetros siempre iguales, *flags* de configuración sin segundo valor | [Collapse Hierarchy](https://refactoring.guru/collapse-hierarchy), [Inline Class](https://refactoring.guru/inline-class), [Remove Parameter](https://refactoring.guru/remove-parameter) |
| [Feature Envy](https://refactoring.guru/smells/feature-envy) | Una función que usa 4 o más propiedades de otro objeto y ninguna del suyo; en TS, casos de uso que calculan reglas con los campos de la entidad | [Move Method](https://refactoring.guru/move-method), [Extract Method](https://refactoring.guru/extract-method) |
| [Inappropriate Intimacy](https://refactoring.guru/smells/inappropriate-intimacy) | `rg "from '\.\./\.\./(\w+)/(domain\|infrastructure)"` entre módulos distintos; imports de `infrastructure` desde `domain` o `application` | [Move Method](https://refactoring.guru/move-method), [Hide Delegate](https://refactoring.guru/hide-delegate), [Change Bidirectional Association to Unidirectional](https://refactoring.guru/change-bidirectional-association-to-unidirectional) |
| [Message Chains](https://refactoring.guru/smells/message-chains) | `rg "\.\w+\.\w+\.\w+\.\w+"` en TS y KT, excluyendo *builders*, `MaterialTheme.colorScheme.x` y cadenas fluidas de TypeORM o de Flow | [Hide Delegate](https://refactoring.guru/hide-delegate), [Extract Method](https://refactoring.guru/extract-method) |
| [Middle Man](https://refactoring.guru/smells/middle-man) | Clase cuyos métodos son en su mayoría `return this.x.metodo(...)` 1 a 1, p. ej. métodos de caso de uso que solo llaman al repositorio | [Remove Middle Man](https://refactoring.guru/remove-middle-man). En hexagonal, tolerar los casos de uso de lectura triviales |
| [Incomplete Library Class](https://refactoring.guru/smells/incomplete-library-class) | *Helpers* repetidos alrededor de una librería (TypeORM, Retrofit, dayjs) | [Introduce Foreign Method](https://refactoring.guru/introduce-foreign-method), [Introduce Local Extension](https://refactoring.guru/introduce-local-extension) |
| [Alternative Classes with Different Interfaces](https://refactoring.guru/smells/alternative-classes-with-different-interfaces) | Dos adaptadores que hacen lo mismo con nombres distintos (p. ej., dos maneras de leer un archivo) | [Rename Method](https://refactoring.guru/rename-method), [Extract Superclass](https://refactoring.guru/extract-superclass) |

**Qué NO debe marcar la skill como smell en este repo:**
- Un `switch` exhaustivo único sobre una unión discriminada: `planificacion/domain/errores.ts:155`, `web/.../planificacion-citas/presentacion.tsx:127`, `web/.../use-inicio-de-planificacion.ts:90`.
- Las tablas declarativas largas de columnas en `recepcion/domain/reporte-detallado.ts`.
- Los puertos con una sola implementación.
- Los DTOs sin comportamiento.
- Las listas de callbacks moderadas de Compose, hasta unas 6.

---

## 3. Oportunidades reales observadas

Por honestidad: la API y la web están muy saneadas, porque el lint ya corta el tamaño y la aridad, hay adaptadores, Template Method y Strategy por proveedor, y los errores van tipados de forma exhaustiva. Las oportunidades de mayor valor están en el **tipo de operación disperso** y en **Android**, que no tiene lint de tamaño.

### 1. IMPORTACION/EXPORTACION disperso → Strategy por tabla (el más valioso)
- **Smell:** [Switch Statements](https://refactoring.guru/smells/switch-statements) + [Shotgun Surgery](https://refactoring.guru/smells/shotgun-surgery).
- **Dónde está el condicional.**
  - API: `planificacion/domain/asignacion-viaje.ts:56` (`checkpointDestino`), `:62` (`viajeCompleto`), `reglas-de-la-oferta.ts:66` (`laOperacionOfrece`), `recorrido-del-viaje.ts:207`, `reglas-de-la-guia.ts:116` y `servicio-manual.ts:44`.
  - Web: `planificacion-citas/aplicacion/use-formulario-servicio.ts:101,118,158,166,167`, `componentes/modal-asignar-viaje.tsx:82`, `componentes/selectores-del-viaje.tsx:120` y `consolidado-nave/presentacion.tsx:42`.
- **Patrón:** [Strategy](https://refactoring.guru/design-patterns/strategy) en forma de `Record<OperacionServicio, PoliticaDeOperacion>`, con campos como `ofrece`, `checkpointDestino`, `recursosCompletos()`, `permiteGuia` y `eligeCarga`. Técnica: [Replace Conditional with Polymorphism](https://refactoring.guru/replace-conditional-with-polymorphism). El precedente ya existe en el repo: `recepcion/domain/reporte-detallado.ts:431` (`PERFIL_DE_OPERACION`).
- **Cuándo hacerlo:** hoy son 2 valores. Conviene hacerlo **cuando se implemente el recorrido de exportación** (`RECORRIDO_DE_EXPORTACION_PENDIENTE`, `recorrido-del-viaje.ts:207`), no antes.

### 2. Android: bandejas con el mismo `when` Cargando/Fallo/Vacío/Lista
- **Smell:** [Duplicate Code](https://refactoring.guru/smells/duplicate-code).
- **Dónde:** `ui/pantallas/PantallaConfirmados.kt:114`, `PantallaHistorial.kt:99` y `PantallaPlanificados.kt:128`, más una variante en `PantallaNotificaciones.kt:71`.
- **Propuesta:** un composable genérico `ContenidoDeBandeja(estado, textoVacio, alReintentar) { lista -> … }`. Es un [Template Method](https://refactoring.guru/design-patterns/template-method) en versión funcional, con [Extract Method](https://refactoring.guru/extract-method) y [Form Template Method](https://refactoring.guru/form-template-method).

### 3. Android: el hito viaja como `String` aunque existe `enum class Hito`
- **Smell:** [Primitive Obsession](https://refactoring.guru/smells/primitive-obsession).
- **Dónde:** el enum está en `datos/ConstantesDeLaApp.kt:27`, y sin embargo se pasa texto en `ui/pantallas/PantallaViaje.kt:203,265,308` (`alMarcar: (String) -> Unit`), `ui/estado/ModeloViaje.kt:142` (`marcar(idServicio, codigo: String)`) y `datos/RepositorioViajes.kt:83`.
- **Propuesta:** pasar `Hito` y convertir a `codigo` solo en el borde de red. Técnica: [Replace Type Code with Class](https://refactoring.guru/replace-type-code-with-class).

### 4. Android: parámetros excesivos en `CuerpoDelViaje`
- **Smell:** [Long Parameter List](https://refactoring.guru/smells/long-parameter-list).
- **Dónde:** `ui/pantallas/PantallaViaje.kt:200`, con 10 parámetros (7 callbacks), y `RequisitosYSalida`, `:305`, con 6.
- **Propuesta:** [Introduce Parameter Object](https://refactoring.guru/introduce-parameter-object), con `data class AccionesDelViaje(alMarcar, alAbrirContenedor, …)`.
- **Matiz:** Compose tolera las listas de lambdas. El valor está en que las 6 o 7 acciones bajan juntas por 2 niveles, que es un *Data Clump*.

### 5. Android: composables largos sin límite de lint
- **Smell:** [Long Method](https://refactoring.guru/smells/long-method).
- **Dónde:**
  - `ui/componentes/DialogosViaje.kt:320`: `HojaMotivoRechazo`, unas 110 líneas.
  - `:158`: `DialogoIniciarViaje`, unas 79.
  - `:243`: `DialogoConfirmarContenedor`, unas 76.
  - `:89`: `DialogoAceptar`, unas 68.
  - `ui/componentes/PanelCargaSuelta.kt:70`: `PanelDatosCargaSuelta`, unas 93, con 6 estados `rememberSaveable` que piden un *state holder*.
- **Propuesta:** [Extract Method](https://refactoring.guru/extract-method) en sub-composables, y agregar detekt (`LongMethod: 60`, `LongParameterList: 6`) para igualar la vara de la API y la web.

### 6. Android: `RepositorioViajes` hace de todo y se instancia en concreto
- **Smell:** [Large Class](https://refactoring.guru/smells/large-class) moderada + [Divergent Change](https://refactoring.guru/smells/divergent-change).
- **Dónde:** `datos/RepositorioViajes.kt:33` tiene unos 22 métodos públicos (ofertas, viaje en curso, carga, documentos, guía, historial, perfil, avisos). Se crea con `RepositorioViajes()` por defecto en `ui/estado/ModeloBandejas.kt:19`, `ModeloConductor.kt:18`, `ModeloViaje.kt:41` y `avisos/RegistroDelAparato.kt:31`.
- **Propuesta:** [Extract Class](https://refactoring.guru/extract-class) por capacidad (ofertas, viaje, documentos y guía, conductor) y [Extract Interface](https://refactoring.guru/extract-interface) para poder usar dobles de prueba.
- **Prioridad:** media, porque el archivo mide 221 líneas y cada método es corto.

### 7. API: bloque de auditoría de los DTOs repetido
- **Smell:** [Duplicate Code](https://refactoring.guru/smells/duplicate-code).
- **Dónde:**
  - `flota/api/dto/auditoria-de-maestra.dto.ts:4` ya abstrae `usuarioCreador … ultimoCambio` (`AuditoriaDeMaestra`), pero la clase vive en `flota`.
  - `naves/api/dto/respuestas-naves.dto.ts:52,125,349` repite el bloque en `NaveDto`, `InstalacionPortuariaDto` y un tercer DTO, incluida la descripción de `If-Match` (`:82,155,379`).
  - `planificacion/api/dto/tipo-descripcion-carga.dto.ts:77` y `respuestas-servicio-transporte.dto.ts:205` repiten al menos parte del bloque.
- **Propuesta:** mover la clase a `shared/api` y aplicar [Extract Superclass](https://refactoring.guru/extract-superclass) y [Pull Up Field](https://refactoring.guru/pull-up-field).
- **Matiz:** revisar antes que el Swagger conserve las descripciones propias de cada DTO («Usuario que registró la nave»).

### Buscado sin hallazgo relevante
- **API y web:** no hay métodos de más de 67 líneas ni funciones con 5 o más parámetros. Tampoco hay `switch` repetidos sobre el estado del viaje: la máquina de checkpoints está centralizada en tablas en `recorrido-del-viaje.ts`.
- **Visitor, Flyweight, Bridge, Abstract Factory, Memento y Prototype:** no hay un problema que los justifique. Recomendarlos sería sobreingeniería.
- **Observer en la API** (eventos de dominio): hoy no hace falta. Los efectos van en línea y en transacción. Pasaría a hacer falta si un caso de uso llega a disparar 3 o más efectos independientes.
