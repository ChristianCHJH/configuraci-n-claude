# Checklist de auditoría — app Android UNITRANS

Evalúa cada dimensión con las preguntas guía. Registra hallazgos con evidencia `archivo.kt:línea` y
cierra cada dimensión con **nota 1–10 y semáforo** (🟢 🟡 🔴).

---

## 1. Arquitectura, capas y DDD en móvil

- ¿Existen capas claras UI → (Dominio) → Datos, con flujo unidireccional y única fuente de verdad
  por tipo de dato? ¿El repositorio es el único punto de entrada a la capa de datos? ¿Algún
  ViewModel llega directo a Retrofit, a Room o a Firebase?
- ¿Las dependencias apuntan hacia adentro? ¿El dominio está libre de `android.*`, Retrofit, Room y
  Compose? **Revisa los imports reales, no los nombres de las carpetas.**
- ¿Hay modelo por capa (DTO de red, entidad de persistencia, modelo de dominio, estado de interfaz)
  con mapeadores explícitos, o el DTO llega hasta la pantalla?
- **DDD con criterio**: la app es un cliente; los bounded contexts viven en el backend. Verifica
  lenguaje ubicuo en los nombres (viaje, servicio, planificación, terminal, conductor, contenedor,
  ticket de peso, punto de control), objetos de valor para datos con reglas (placa, RUC, número de
  contenedor), validación temprana, reglas de negocio fuera de composables y ViewModels.
  **Detecta**: dominio anémico con toda la lógica en el ViewModel, entidades de persistencia usadas
  como dominio, reimplementación innecesaria de reglas del servidor, casos de uso de una línea,
  interfaces con una sola implementación sin razón de prueba, capas copiadas del backend que en
  móvil no aportan.
- ¿El error está **modelado** (`sealed`, `Result` de dominio) o cruzan excepciones entre capas y hay
  `try/catch` genéricos en la interfaz?
- Organización de paquetes: ¿por funcionalidad, por capa o mezcla? ¿Es consistente? ¿Los límites
  entre funcionalidades son claros?
- ¿Hay README de arquitectura o ADRs propios del móvil? ¿Los nombres, enums y contratos son
  coherentes con el backend?

## 2. Modularización y compilación (Gradle)

- Módulo único frente a multi-módulo. Dependencias entre módulos sin ciclos, `api` frente a
  `implementation`. **Di qué cuesta hoy el módulo único** (tiempo de compilación, imposibilidad de
  aislar, acoplamiento invisible) y a partir de qué tamaño deja de ser sostenible.
- Catálogo de versiones y complementos de convención, o configuración duplicada en cada módulo.
- Versiones: Kotlin 2.x con K2, Compose BOM, AGP, KSP en vez de kapt; librerías obsoletas o con
  vulnerabilidades conocidas.
- **Requisitos vigentes de Google Play**: nivel de API objetivo mínimo exigido en la fecha de la
  auditoría (Play sube el listón cada 31 de agosto; verifica cuál rige hoy y compáralo con el
  `targetSdk` del proyecto), soporte de páginas de 16 KB si hay librerías nativas, políticas de
  permisos. `minSdk` justificado.
- Entornos: tipos de compilación y variantes, configuración por ambiente (desarrollo, calidad,
  producción). URLs base y claves fuera del código y de los recursos.
- Entrega: R8 activo (`isMinifyEnabled`, `isShrinkResources`) con reglas de conservación correctas
  para serialización y reflexión, firma, App Bundle, `versionCode`/`versionName` gestionados.
- Calidad automatizada: lint de Android, ktlint o detekt, reglas de lint de Compose, avisos
  tratados como error, integración continua que compile y pruebe.

## 3. Jetpack Compose

- **Elevación de estado**: composables sin estado y reutilizables; el patrón de ruta que conecta el
  ViewModel y pantalla pura y previsualizable. ¿Se pasan ViewModels a composables hijos? ¿El estado
  se recolecta con `collectAsStateWithLifecycle`?
- **Estado de interfaz inmutable** (`data class` o `sealed interface`) que cubra cargando, con
  datos, vacío, con error, sin conexión y refrescando, sin banderas contradictorias
  (`isLoading && error != null`). ¿Cómo se modelan los eventos de una sola vez, navegar o mostrar un
  aviso? Detecta `SharedFlow` sin repetición que pierde eventos, y eventos guardados como estado que
  nunca se consumen y reaparecen al rotar.
- **Efectos secundarios**: uso correcto de `LaunchedEffect` y sus llaves, `DisposableEffect`,
  `rememberUpdatedState`, `SideEffect`. Ninguna lógica de negocio ni escritura de estado dentro de
  la composición. Ninguna corrutina lanzada desde un composable hacia el ViewModel.
- **Recomposición y estabilidad**: salto fuerte activo, tipos estables (`@Immutable`, `@Stable`,
  colecciones inmutables de Kotlin), `remember` con llaves, `derivedStateOf` donde corresponde,
  lambdas estables, listas perezosas con `key` y `contentType`, sin cálculos costosos ni creación de
  objetos dentro del composable. ¿Alguien miró los reportes del compilador de Compose?
- **API de los composables**: `modifier` como primer parámetro opcional, aplicado al nodo raíz;
  orden de modificadores correcto; API de ranuras; nombres en PascalCase; valores por defecto
  sensatos; sin `Context` innecesario.
- **Tema**: Material 3 y el esquema de color, tipografía y formas del tema. Sin colores, tamaños ni
  fuentes escritos a mano en la pantalla. Modo oscuro. Color dinámico decidido a propósito. Si hay
  sistema de diseño corporativo, ¿el tema es su única fuente?
- **Previsualizaciones** por estado (cargando, error, vacío, con datos), con parámetros de
  previsualización, en modo oscuro y con fuente grande.
- **Plataforma actual**: borde a borde e insets manejados; retroceso predictivo; disposición
  adaptativa por clase de tamaño de ventana si aplica.
- **Accesibilidad e internacionalización**: descripción de contenido, semántica, áreas táctiles de
  al menos 48dp, contraste bajo sol; **todos los textos en `strings.xml`**, plurales incluidos, nada
  escrito dentro del composable; terminología en español coherente con el dominio.
- **Interoperabilidad**: ¿queda algo de Views, Fragments o XML? ¿Está justificado y aislado?

## 4. Kotlin idiomático y clean code

- Seguridad ante nulos sin `!!`; `sealed interface` para estados y errores; `data class` inmutables
  con `val`; `value class` para identificadores; enum frente a sellado usados con criterio.
- Visibilidad mínima (`internal`, `private`); colecciones expuestas como inmutables; objetos
  singleton sin estado mutable global.
- Funciones cortas con un solo nivel de abstracción; nombres que revelan intención; sin código
  muerto ni comentado; sin duplicación; sin clases cajón de sastre (`Utils`, `Helper`, `Manager`);
  sin números ni cadenas mágicas.
- Excepciones: sin `catch (e: Exception)` silencioso; `CancellationException` nunca tragada; errores
  registrados con contexto.
- Consistencia de formato y convenciones; `TODO`/`FIXME` sin dueño ni ticket.
- Abuso de funciones de extensión, funciones de ámbito encadenadas o genéricos innecesarios.

## 5. Concurrencia: corrutinas y Flow

- **Concurrencia estructurada**: `viewModelScope` o ámbitos inyectados; cero `GlobalScope`; cero
  `runBlocking` en producción — **revisa en especial el interceptor y el autenticador de OkHttp**;
  sin `Thread` ni `Handler` manuales.
- Despachadores inyectados y no `Dispatchers.IO` escrito a mano; repositorios seguros para el hilo
  principal, con el cambio de contexto en la capa correcta y no en el ViewModel.
- `Flow`: `StateFlow` con `stateIn(scope, WhileSubscribed(5_000), inicial)`; `distinctUntilChanged`;
  operadores correctos (`combine`, `flatMapLatest`); sin recolectar en `init` sin necesidad; sin
  suscripciones filtradas.
- Cancelación cooperativa, plazos de espera, reintentos con retroceso exponencial, idempotencia.
- **Condiciones de carrera**: renovación concurrente del portador (debe ser de vuelo único, un
  `Deferred` compartido o un `Mutex` de corrutinas, **nunca bloqueando hilos de OkHttp**); doble
  envío de una acción, por ejemplo aceptar dos veces el mismo servicio o subir dos veces la foto.
- Trabajo en segundo plano: WorkManager para lo diferible y garantizado; servicio en primer plano
  con su tipo declarado si hay seguimiento; restricciones de segundo plano de Android 14 en
  adelante.

## 6. Red, datos y persistencia

- **HTTP**: un solo cliente de OkHttp por inyección; plazos explícitos; interceptores de
  autorización, cabeceras y registro **solo en depuración**; manejo del 401 y de la renovación sin
  interbloqueo; mapeo del error HTTP y de red a error de dominio; **sin decidir nada leyendo el
  texto del mensaje**.
- **Serialización**: kotlinx.serialization o Moshi; DTOs con nulabilidad honesta (lo opcional del
  backend es nulable con valor por defecto); el DTO nunca sale de la capa de datos.
- **Contrato con la API**: versionado, enums desconocidos tolerados sin tumbar la app, fechas
  ISO-8601 **con offset** (`-05:00`, ver ADR TMS-013) usando `java.time` o `kotlinx-datetime`, nunca
  `SimpleDateFormat` ni `Date`.
- **Persistencia**: Room con entidades distintas del dominio, DAOs que exponen `Flow`, migraciones
  versionadas y probadas, índices. DataStore en vez de `SharedPreferences`. ¿Qué se persiste y por
  qué?
- **Offline y sincronización — la pregunta que manda**: ¿qué hace la app cuando el conductor entra a
  la zona sin señal a mitad de un viaje? Estrategia offline-first, cola de acciones pendientes,
  resolución de conflictos, idempotencia con clave de origen, aviso de «datos posiblemente
  desactualizados». **Si la app pierde el gesto del conductor es un DEFECTO de severidad alta, no
  una mejora.**
- Paginación para listas grandes; caché de imágenes; tamaño de las cargas útiles; **compresión de la
  foto antes de subirla** y su costo en memoria.
- Firebase: registro y renovación del token de mensajería y su envío al backend; permiso de
  notificaciones en Android 13 y posteriores; canales; comportamiento en primer y segundo plano;
  `google-services.json` fuera de repositorios públicos.

## 7. Navegación y ciclo de vida

- Actividad única. Rutas con tipos (`@Serializable`) frente a cadenas mágicas; pila de retroceso
  predecible; enlaces profundos definidos y verificados. Si el proyecto sigue en Navigation 2,
  **verifica el estado de madurez de Navigation 3 en la fecha de la auditoría** antes de
  recomendarlo, y di qué costaría migrar.
- Navegación disparada por estado o evento del ViewModel, no por lógica suelta en la composición.
  Sin el controlador de navegación filtrándose a capas inferiores.
- Supervivencia a la muerte del proceso y al cambio de configuración: `SavedStateHandle`,
  `rememberSaveable` para filtros, desplazamiento y formularios. **Si el sistema mata la app con el
  conductor a medio formulario, ¿qué se pierde?**
- Permisos en tiempo de ejecución (cámara, ubicación, notificaciones): flujo correcto,
  justificación, denegación permanente manejada, mínimos en el manifiesto.
- Sin fugas de `Context`, `Activity` o `View` en ViewModels ni en singletons.

## 8. Inyección de dependencias

Hilt, Koin u otro, usado de forma consistente; módulos por capa; ámbitos correctos; interfaces
declaradas en dominio e implementadas en datos; **sin localizadores de servicio manuales, sin
objetos globales con estado, sin parámetros con valor por defecto que construyen su propia
dependencia**. Todo reemplazable por un doble en pruebas. Evalúa el costo real de introducir un
framework frente a seguir así, y **nombra las tres costuras que hoy no se pueden falsear**.

## 9. Pruebas

- Pirámide real: unitarias de dominio, mapeadores y ViewModels (utilidades de corrutinas en pruebas,
  regla de despachador principal, Turbine para flujos); **dobles antes que simulacros**; persistencia
  en memoria para DAOs y migraciones; servidor web simulado para la capa de red.
- Pruebas de interfaz en Compose con semántica o etiquetas de prueba, pruebas de captura de
  pantalla, pruebas de navegación; macrobenchmark y perfiles de línea base si hay problema de
  rendimiento.
- Cobertura razonable de lo crítico (ingreso, aceptar y rechazar, marcado de puntos de control,
  captura del ticket, sincronización). Pruebas deterministas, rápidas, con nombre descriptivo, que
  corran en integración continua.
- **Cuenta y clasifica lo que hay**, y di cuál es la primera prueba que escribirías mañana.

## 10. Rendimiento y estabilidad

- Arranque: inicialización perezosa, sin trabajo pesado en el arranque de la aplicación; perfiles de
  línea base; tamaño del paquete.
- Compose: tirones en listas, imágenes sin tamaño, recomposición excesiva.
- Memoria: detección de fugas y modo estricto en depuración; flujos y mapas de bits cerrados;
  escuchas dadas de baja.
- Observabilidad: reporte de fallos; registro estructurado apagado en entrega; **sin datos
  personales ni tokens en el registro**; analítica de los eventos clave.

## 11. Seguridad (referencia: OWASP MASVS)

- Sin secretos en código, en la configuración de compilación, en recursos ni en el historial de git.
  **Token en almacenamiento cifrado** (Keystore con DataStore cifrado o preferencias cifradas), nunca
  en texto plano. Revisa `allowBackup` y las reglas de extracción de datos: un respaldo automático
  puede llevarse el portador fuera del teléfono.
- Solo HTTPS; configuración de seguridad de red sin tráfico en claro; fijado de certificados
  evaluado; validación de entradas.
- `android:exported` correcto; proveedor de archivos para lo que sale hacia otra app; WebView
  endurecida si existe; enlaces profundos verificados.
- R8 y ofuscación en entrega; integridad del dispositivo solo si el riesgo lo justifica; permisos
  mínimos; librerías de terceros vigentes.
- **Qué ve un atacante con el teléfono del conductor en la mano.**

## 12. Producto, operación y documentación

- Estados de carga, error, vacío y sin conexión con acción de reintento; prevención del doble toque
  en acciones críticas; sesión expirada resuelta con reingreso limpio; versión mínima forzada o
  actualización dentro de la app.
- Proceso de entrega: canales de prueba, firma gestionada, notas de versión, versionado semántico;
  integración y entrega continuas.
- README con instalación, entornos, cómo correr las pruebas y convenciones; ADRs del móvil; glosario
  del dominio compartido con el backend.

## 13. Convenciones del repositorio

Español en identificadores, archivos y carpetas; **comentarios al mínimo** (el proyecto lo exige,
pero contrasta antes con el ADR TMS-019 de trazabilidad narrativa antes de marcar un comentario como
sobrante); prohibición de tooltips salvo pedido explícito; nombre de persona para quién y de acción
para cuándo; coherencia con el contrato de respuesta HTTP del backend (`success`, `statusCode`,
`message`, `data`, `meta`).

## 14. Anti-patrones a buscar de una pasada

`!!` · `GlobalScope` · `runBlocking` · `Dispatchers.IO` escrito a mano · `Thread.sleep` ·
`catch (e: Exception)` vacío · registro con tokens · LiveData mezclado con Flow sin razón ·
`mutableStateOf` público en el ViewModel · `Context` o `Activity` en el ViewModel · lógica de
negocio en el composable · `object` con estado mutable · clases `Utils`/`Helper`/`Manager` · textos,
colores y medidas escritos a mano · URL base fija en el código · `SimpleDateFormat` ·
`SharedPreferences` para el token · `AsyncTask` o `Handler` · ViewModels de más de 300 líneas ·
composables de más de 150 líneas · ViewModel pasado a un hijo · `collect` sin ciclo de vida ·
`LaunchedEffect(Unit)` cargando datos que deberían vivir en el ViewModel · composables que navegan
por su cuenta.
