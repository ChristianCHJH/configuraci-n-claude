# Arquitectura — capas, módulos y SOLID

Referencia obligatoria antes de crear cualquier archivo `.kt`.

---

## 1. La idea en una frase

La app **no es un CRUD**: es un **intérprete de contenido**. Descarga un JSON que describe una clase
(secciones y ejercicios) y lo pinta. Por eso la arquitectura se organiza alrededor de dos ejes:
**qué se puede extender sin tocar lo existente** (los tipos de sección/ejercicio) y **qué nunca puede
depender de Android** (las reglas de corrección).

---

## 2. Módulos Gradle

Multi-módulo desde el día 1. No es ceremonia: es lo que convierte SOLID en un **error de compilación**
en vez de una recomendación que se erosiona con las prisas.

```
:app                    navegación raíz, MainActivity, wiring de Hilt
:core:designsystem      tokens M3, tema light/dark, componentes base
:core:common            Result, dispatchers, utilidades puras
:core:domain            modelos + casos de uso + INTERFACES de repositorio   ← CERO Android
:core:data              implementaciones de repositorio + mappers + sincronización
:core:database          Room: entidades, DAOs, migraciones
:core:network           Retrofit, DTOs, envelope, serialización
:core:testing           fakes, reglas y dispatchers de prueba compartidos
:feature:perfil         selector de alumno
:feature:cursos         hub + panel de curso
:feature:clase          el reproductor de clases (el módulo más grande)
:feature:progreso       dashboard, temas débiles, racha
```

### Regla de dependencias (INNEGOCIABLE)

```
:app  ──►  :feature:*  ──►  :core:domain  ◄──  :core:data  ──►  :core:network
                    │                                     └──►  :core:database
                    └──►  :core:designsystem
```

- **`:core:domain` no importa NADA**: ni `android.*`, ni Compose, ni Retrofit, ni Room, ni Hilt.
  Es un módulo Kotlin puro (`java-library` + `kotlin("jvm")`). Sus tests corren en la JVM, en milisegundos.
- **Un `:feature:*` jamás importa `:core:network` ni `:core:database`.** Si necesita datos, pide un
  repositorio del dominio. Si te ves tentado a saltar la capa, el diseño del caso de uso está mal.
- **Los `:feature:*` no se importan entre sí.** Si dos features necesitan lo mismo, sube al `:core`.
- `:core:data` es el único que conoce a la vez la red y la base local. Ahí vive la decisión de
  "¿sirvo de caché o voy a la red?", en un solo lugar.

Cuando Gradle rechaza un import, el diseño se defendió solo. Esa es toda la intención.

---

## 3. Estructura interna de cada módulo

```
core/domain/src/main/kotlin/pe/academia/core/domain/
├── modelo/          Clase, Seccion, Ejercicio, Curso, Progreso, ResultadoEjercicio…
├── repositorio/     CatalogoRepository, ClaseRepository, ProgresoRepository, PerfilRepository
├── correccion/      funciones puras de corrección y normalización (el corazón)
└── casouso/         ObtenerClaseUseCase, RegistrarRespuestaUseCase, CompletarClaseUseCase…

feature/clase/src/main/kotlin/pe/academia/feature/clase/
├── ClaseViewModel.kt
├── ClaseUiState.kt
├── ClasePantalla.kt          el Composable con estado (recibe el ViewModel)
├── ClaseContenido.kt         el Composable sin estado (recibe el UiState) ← el que se testea
├── seccion/                  un archivo por tipo de sección
└── ejercicio/                un archivo por tipo de ejercicio
```

Paquete raíz: `pe.academia.movil`. Nombres de dominio **en español** (`Clase`, `Ejercicio`,
`registrarRespuesta`, `temasDebiles`), inglés solo para lo prestado del framework (`uiState`,
`Loading`, `Modifier`). Es la misma convención que ya usa Adifnex y que Christian lee cómodo.

---

## 4. SOLID aterrizado a este dominio

No la definición de manual: qué significa **aquí**.

### S — Responsabilidad única

- Un ViewModel por pantalla. Nada de un `AcademiaViewModel` que sirva a tres pantallas.
- Un caso de uso por acción del usuario, no por entidad.
- **Un renderer por tipo de ejercicio.** Un renderer pinta y avisa; **no valida, no persiste, no navega**.
  Emite `ResultadoEjercicio(correcta, valor, tema)` hacia arriba y se olvida.
- La corrección vive en `:core:domain/correccion/`, no dentro del Composable. Un Composable que
  compara strings es un Composable que no se puede probar sin arrancar Android.

### O — Abierto/cerrado (el punto más importante del diseño)

Hay 11 tipos de ejercicio y van a ser más. **Agregar uno debe ser agregar un archivo**, nunca hacer
crecer un `when` de 11 ramas repartido por media app.

```kotlin
// :feature:clase/ejercicio/RendererEjercicio.kt
fun interface RendererEjercicio<E : Ejercicio> {
    @Composable
    fun Pintar(ejercicio: E, estado: EstadoEjercicio, onResultado: (ResultadoEjercicio) -> Unit)
}

// Registro: un mapa poblado por Hilt con @IntoMap. Añadir un kind = añadir una @Provides.
@Composable
fun EjercicioHost(ejercicio: Ejercicio, …) {
    val renderer = LocalRegistroEjercicios.current[ejercicio::class]
        ?: return EjercicioNoSoportado(ejercicio.kind)   // nunca crashea
    renderer.Pintar(…)
}
```

El único `when` legítimo sobre el `kind` está en el **parseo** (`:core:network`), porque ahí es donde
el discriminador del JSON se convierte en tipo. De ahí para arriba, polimorfismo.

### L — Sustitución de Liskov

Todos los renderers cumplen el mismo contrato y son intercambiables: el paso de la clase **no sabe**
qué tipo está pintando. Si un renderer necesitara que el host lo trate distinto (por ejemplo, ocultarle
el botón "Siguiente"), eso va en el `EstadoEjercicio` que recibe, no en un `if (ejercicio is X)` del host.

### I — Segregación de interfaces

Cuatro repositorios pequeños, no un `AcademiaRepository` dios:

| Interfaz | Qué expone |
|---|---|
| `PerfilRepository` | alumnos, alumno activo |
| `CatalogoRepository` | cursos, roadmap, conceptos |
| `ClaseRepository` | el contenido de una clase |
| `ProgresoRepository` | progreso, registrar respuesta, completar, estado |

Un ViewModel que solo lee el catálogo no debe compilar contra métodos de escritura de progreso.

### D — Inversión de dependencias

`:core:domain` **declara** las interfaces. `:core:data` las implementa. Hilt las une en `:app` con
`@Binds`. Consecuencia práctica: los tests del dominio y de los ViewModels no necesitan Room ni
Retrofit — usan fakes de `:core:testing`.

---

## 5. Un solo patrón de estado

Adifnex tiene dos patrones distintos en la misma app (`sealed class LoginUiState` y
`data class DashboardUiState`). Aquí hay **uno**, y no se discute:

```kotlin
data class ClaseUiState(
    val cargando: Boolean = false,
    val clase: Clase? = null,
    val pasoActual: Int = 0,
    val error: MensajeError? = null,
    val sincronizando: Boolean = false,
)
```

- `data class` de estado por pantalla, con valores por defecto.
- `sealed interface` **solo** para el contenido que sí es excluyente (por ejemplo `EstadoEjercicio`:
  `SinResponder` / `Respondido(correcta, explicacion)`).
- `StateFlow` siempre expuesto con **`.asStateFlow()`** — nunca el `MutableStateFlow` desnudo.
- En la UI: **`collectAsStateWithLifecycle()`**, nunca `collectAsState()`.
- Errores como **modelo tipado** (`MensajeError`), no `String?`. Un `String?` no se puede traducir
  ni reintentar.

```kotlin
@HiltViewModel
class ClaseViewModel @Inject constructor(
    private val obtenerClase: ObtenerClaseUseCase,
    private val registrarRespuesta: RegistrarRespuestaUseCase,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ClaseUiState())
    val uiState: StateFlow<ClaseUiState> = _uiState.asStateFlow()
}
```

---

## 6. Composables con estado vs sin estado

Por cada pantalla, dos funciones:

```kotlin
@Composable
fun ClasePantalla(viewModel: ClaseViewModel = hiltViewModel(), onSalir: () -> Unit) {
    val estado by viewModel.uiState.collectAsStateWithLifecycle()
    ClaseContenido(estado = estado, onResponder = viewModel::responder, onSalir = onSalir)
}

@Composable
fun ClaseContenido(estado: ClaseUiState, onResponder: (ResultadoEjercicio) -> Unit, onSalir: () -> Unit)
```

La de abajo **no conoce el ViewModel**: es la que se prueba y la que se fotografía en los screenshot
tests. Un Composable que llama a un repositorio o a un caso de uso es un bug de arquitectura.

---

## 7. Navegación

`navigation-compose` con rutas tipadas (no strings sueltos por ahí). El `NavHost` vive en `:app`;
cada feature expone su `NavGraphBuilder.pantallaX(...)` como extensión, para que `:app` no conozca
los internos del feature.

Los ViewModels se inyectan con `hiltViewModel()` como parámetro por defecto del Composable — el
patrón que Adifnex ya hace bien — y la comunicación hacia arriba es por callbacks (`onSalir: () -> Unit`),
nunca pasando el `NavController` a un feature.

---

## 8. Errores y resultado

`:core:common` define el tipo de resultado y **todos** los repositorios lo devuelven:

```kotlin
sealed interface Resultado<out T> {
    data class Exito<T>(val dato: T) : Resultado<T>
    data class Fallo(val error: MensajeError) : Resultado<Nothing>
}

sealed interface MensajeError {
    data object SinConexion : MensajeError
    data class DelServidor(val codigo: Int, val mensaje: String) : MensajeError
    data class Validacion(val detalles: List<String>) : MensajeError
    data class Inesperado(val causa: Throwable) : MensajeError
}
```

Adifnex usa `Result<T>` de Kotlin con `runCatching`, que borra el tipo del error y obliga a leer
`it.message`. Aquí el error es un modelo: la UI puede decidir si muestra "sin internet, lo guardo y
lo mando después" o "el servidor respondió 400".

**Nunca** un `catch (e: Exception) {}` vacío. Nunca `throw` cruzando capas hacia la UI.

---

## 9. Concurrencia

- Los dispatchers se **inyectan** desde `:core:common` (`@Dispatcher(IO)`), jamás `Dispatchers.IO`
  hardcodeado — si no, los tests no son deterministas.
- El trabajo pesado (parsear el JSON de una clase) va a `Dispatchers.Default`, no al hilo principal.
- **`runBlocking` está prohibido** fuera de los tests. Sin excepciones. Ver `compose-performance.md`.
- Llamadas independientes en paralelo con `async`/`await` — Adifnex lo hace bien en su dashboard y
  ese patrón se conserva.
