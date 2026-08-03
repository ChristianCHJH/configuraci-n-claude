# Plan — Skill de desarrollo móvil + prompt de diseño para la app de la academia

## Contexto

`teacher-english` es la plataforma de estudio de Christian: 4 cursos (inglés con Emily, JavaScript/Docker/Kubernetes con Leo), web 100% estática, y desde el 2026-07-25 con **PostgreSQL multi-alumno + API NestJS en `:3211`**. Esa API se construyó explícitamente pensando en el móvil: el contenido de cada clase se vuelca a una columna JSONB y `GET /api/clase/:codigo` lo devuelve como JSON limpio, justo porque *"una app nativa no puede evaluar JavaScript remoto"*.

Falta la app. Christian ya tiene una app Compose (Adifnex, en `Venta e inventario\android-app\`) que funciona pero arrastra vicios concretos: **cero tests**, sin capa de dominio, `runBlocking` dentro del interceptor de OkHttp, logging `BODY` sin guard de `DEBUG`, `usesCleartextTraffic` activo en release, `isMinifyEnabled = false`, colores hardcodeados sin dark theme y dos patrones distintos de `UiState` en la misma app.

**Qué se construye aquí — dos entregables, ninguna línea de Kotlin todavía:**

1. Un **skill** que fije la arquitectura, SOLID y las buenas prácticas móviles de forma verificable, y que corrija de raíz los vicios heredados.
2. Un **prompt de diseño** listo para pegar en Claude y obtener el diseño visual de la app.

**Decisiones ya tomadas por Christian:** los 4 cursos (técnicos primero, voz en fase 2) · offline-first con Room · hereda la identidad visual de la web adaptada a Material 3 · **sin autenticación por ahora** (selector de perfil, igual que la web) · skill híbrido (mentor + reglamento en `references/`).

---

## Entregable 1 — Skill `academia-movil`

Ruta: `C:\Users\Christian\.claude\skills\academia-movil\`

```
academia-movil/
├── SKILL.md                      ~160 líneas — persona, comandos, reglas de oro, gates
└── references/
    ├── arquitectura.md           capas, módulos Gradle, SOLID aplicado al dominio real
    ├── motor-clases.md           el render engine: 7 secciones + 11 ejercicios
    ├── datos-offline.md          contrato de la API, Room, outbox + WorkManager
    ├── compose-performance.md    recomposición, estabilidad, R8, baseline profiles, medición
    ├── testing.md                pirámide, herramientas y gates de "terminado"
    ├── calidad-seguridad.md      los vicios de Adifnex convertidos en prohibiciones
    └── diseno-tokens.md          DESIGN.md → Material 3 (light + dark)
```

Formato calcado de `profe-dev/SKILL.md`: frontmatter con `name` + `description` solamente, H1 `Nombre — Rol`, secciones `## Inicio` / `## Comandos` / `## Reglas de Oro` / referencia rápida / cierre con saludo. Español de Perú, trato de "tú", **cero voseo** (misma lista negra que ya usan Emily y Leo).

Persona propuesta: **Kai — Arquitecto Móvil**. Hermano de Emily y Leo; no toca contenido de clases, solo la app.

### `SKILL.md` — contenido

**`## Inicio`** — identidad, la ruta del repo (`C:\Users\Christian\Proyectos\teacher-english`) con fallback si no existe, y el bloque *"Antes de actuar, lee siempre"*: `api/src/modulos/**` (el contrato real), `engine/exercises.js` + `engine/exercises-code.js` (la lógica de corrección que hay que replicar), `DESIGN.md`, y la referencia que toque de `references/`.

**`## Comandos`**
| Comando | Qué hace |
|---|---|
| `/academia-movil init` | Crea el esqueleto Gradle multi-módulo, version catalog y CI local. Fija versiones **consultándolas al momento**, nunca de memoria |
| `/academia-movil pantalla <nombre>` | Feature completo: modelo → use case → repo → ViewModel → Composable + sus tests. Nunca UI suelta |
| `/academia-movil ejercicio <kind>` | Añade un renderer de ejercicio. Obliga a los 3 artefactos: composable, test de corrección, screenshot test |
| `/academia-movil auditar` | Corre el checklist de `calidad-seguridad.md` + `compose-performance.md` sobre el código actual y reporta incumplimientos |
| `/academia-movil estado` | Qué pantallas y qué `kind` de ejercicio están hechos vs pendientes, y la cobertura de `:core:domain` |

**`## Reglas de Oro`** — las duras, en el mismo tono de severidad que usa Leo:
- **La regla de dependencias (INNEGOCIABLE)** — `:core:domain` no importa Android, Retrofit, Room ni Compose. Si un import lo viola, el módulo Gradle no compila. Ese es el enforcement, no la buena voluntad.
- **Ningún ejercicio se da por hecho sin sus 2 tests** (corrección + screenshot). Nace de un bug real: `word_order` en la web fue **imposible de acertar** durante meses porque comparaba nodos DOM.
- **Ninguna versión de librería de memoria** — se consultan las estables vigentes y se fijan en `libs.versions.toml`.
- **Nunca romper la web** — la app es un cliente más de la API; si algo falta, se pide, no se cambia el esquema por la libre.
- **Git: JAMÁS commit, push ni PR.** Versiona Christian (regla ya vigente en el proyecto).

### `references/arquitectura.md`

Clean Architecture en 3 capas sobre módulos Gradle, patrón *Now in Android*:

```
:app                  navegación, MainActivity, wiring de Hilt
:core:designsystem    tokens M3, componentes, tema light/dark
:core:common          Result, dispatchers, utilidades puras
:core:domain          modelos + use cases + INTERFACES de repositorio   ← sin dependencias Android
:core:data            implementaciones de repositorio + mappers
:core:database        Room
:core:network         Retrofit + DTOs + envelope
:core:testing         fakes y reglas compartidas
:feature:perfil  :feature:cursos  :feature:clase  :feature:progreso
```

Los `:feature:*` dependen de `:core:domain`, jamás de `:core:network` ni `:core:database`. La separación en módulos es lo que convierte SOLID en un error de compilación en vez de una recomendación.

**SOLID aterrizado a este dominio** (no la definición de manual):
- **S** — un ViewModel por pantalla, un use case por acción, **un renderer por tipo de ejercicio**. `ExerciseRenderer` no valida ni persiste: emite `ResultadoEjercicio(correcta, valor, tema)`.
- **O** — el motor se abre por extensión: agregar un `kind` nuevo es **agregar un archivo y registrarlo**, nunca crecer un `when` de 11 ramas. Es el punto más importante del diseño.
- **L** — todo renderer cumple el mismo contrato y es intercambiable; el paso de clase no sabe qué tipo está pintando.
- **I** — `CatalogoRepository`, `ClaseRepository`, `ProgresoRepository`, `PerfilRepository` separados. Nunca un `AcademiaRepository` dios.
- **D** — el dominio declara las interfaces, `:core:data` las implementa, Hilt las une en `:app`.

Un único patrón de estado en toda la app (`data class XUiState` + `sealed interface` para el contenido), `StateFlow` expuesto siempre con `.asStateFlow()`, `collectAsStateWithLifecycle()` en la UI. Español para el dominio, inglés para lo prestado del framework — igual que Adifnex.

### `references/motor-clases.md` — el corazón

La app no es un CRUD: es un **intérprete de contenido**. Aquí van los contratos, con los datos verificados en el repo.

**7 tipos de sección** (`engine/lesson-engine.js:217-265`): `explanation`, `vocabulary`, `example`, `code`, `machine`, `concept`, `exercise`.
**11 tipos de ejercicio**: `multiple_choice`, `fill_blank`, `matching`, `word_order`, `listening`, `pronunciation`, `short_writing` (inglés) + `code_output`, `terminal`, `code_fill`, `code_order` (técnicos).

Reglas duras que documenta el archivo:
- **Parseo tolerante**: `kotlinx.serialization` polimórfico por el discriminador `type`/`kind`, con ramas `SeccionDesconocida(type)` y `EjercicioDesconocido(kind)`. La web muestra *"Sección desconocida"* y sigue viva; **la app jamás puede crashear** por un `type` que todavía no soporta. Se pinta un aviso y se avanza.
- **`indiceEjercicio` es el índice de la SECCIÓN, no del ejercicio.** Así lo guarda la web (`lesson-engine.js:251-260`) y así está el único `(avance_clase_id, indice_ejercicio)` en la BD. Confundirlos corrompe el progreso ya migrado.
- **La corrección vive en `:core:domain` como funciones puras**, portadas 1:1 desde la web, con sus dos normalizaciones distintas:
  - inglés (`exercises.js:27-29`): minúsculas, sin acentos (NFD), sustituye lo que no sea `[a-z0-9\s']`, colapsa espacios.
  - código (`exercises-code.js:121`): **solo colapsa espacios, case-sensitive**.
- **Barajado estable**: Fisher-Yates que evita devolver el orden original, con semilla en `rememberSaveable`. Si se rebaraja en cada recomposición o al rotar, las opciones bailan bajo el dedo.
- **Voz (fase 2)**: `TextToSpeech` y `SpeechRecognizer` detrás de una interfaz de dominio. Umbral CEFR portado tal cual de `speech.js` (`A1 0.55 … C2 0.90`, fallback `0.6`) y degradación explícita si el dispositivo no trae reconocimiento — la web ya lo hace, la app también.
- Pasos de la clase: `cover` → `review` (si hay `spaced_review`) → una sección por paso → `summary`.

### `references/datos-offline.md`

Contrato verificado de la API (`:3211`, prefijo `/api`, CORS abierto, **sin autenticación**):

| Endpoint | Uso en la app |
|---|---|
| `GET /api/alumno` · `POST /api/alumno` | selector de perfil |
| `GET /api/curso` · `GET /api/curso/:codigo` | hub y roadmap |
| `GET /api/curso/:codigo/concepto` | glosario |
| `GET /api/clase/:codigo` | **el JSONB de la clase** |
| `GET /api/alumno/:id/estado` | dashboard en una sola llamada |
| `GET /api/progreso?alumnoId=&curso=` | progreso completo |
| `POST /api/progreso/respuesta` · `/completar` | escritura, **idempotente** |

Gotchas que el archivo fija como reglas:
- Envelope `{ success, statusCode, message, data }` → un `RespuestaApi<T>` genérico que desenvuelve en `:core:network`; el dominio nunca ve el sobre. Errores: `{ success:false, statusCode, message, error, detail?, codigo? }`.
- **`BIGINT` llega como string** desde el driver `pg` (`"1"`). Los ids se modelan `String`, nunca `Long`. Este bug ya costó un 403 en venta-inventario.
- `clasesTotales` / `clasesDisponibles` también llegan como **string** (son `COUNT(*)`).
- El `ValidationPipe` es `forbidNonWhitelisted: true`: **mandar un campo de más devuelve 400**. Los DTOs de salida se escriben exactos.
- `@SerialName` explícito en cada campo. Nunca depender de que el nombre Kotlin coincida con el JSON (Adifnex depende de eso hoy).

Offline-first:
- **Room es la única fuente de verdad.** Los repos exponen `Flow` desde Room; la red solo escribe en Room. La UI nunca observa a Retrofit.
- El contenido de la clase se guarda como JSON crudo + `fechaSincronia`; se re-descarga solo si cambió.
- **Outbox para el progreso**: cada respuesta entra a una tabla local pendiente y `WorkManager` la envía con backoff exponencial y constraint de red. Reintentar es seguro porque la API hace upsert por `(avance_clase_id, indice_ejercicio)` y **recalcula el puntaje desde cero** — está verificado que repetir no infla.
- **`fechaLocal` la calcula el cliente** con la zona horaria del dispositivo, nunca UTC: de noche en Perú (UTC-5) la fecha UTC ya es "mañana" desde las 19:00 y eso rompería la racha.

### `references/compose-performance.md`

- Prohibido `runBlocking` en cualquier hilo de UI o interceptor de red — es exactamente el pecado de `NetworkModule` en Adifnex.
- Estabilidad: `@Immutable`/`@Stable` en los modelos de UI; `List<T>` es **inestable** → `ImmutableList` de `kotlinx.collections.immutable`. Activar *strong skipping* del compilador de Compose.
- `LazyColumn`/`LazyRow` siempre con `key` estable; `contentType` cuando la lista es heterogénea — que es justo el caso de las secciones de una clase.
- Leer el estado lo más tarde posible: `Modifier.offset { }` y `graphicsLayer` con lambda para animaciones; `derivedStateOf` para lo derivado.
- Release con **R8 + `shrinkResources`** (Adifnex lo tiene apagado) y **Baseline Profile** para el arranque.
- **Medir, no adivinar**: reporte de métricas del compilador de Compose para cazar composables inestables + Macrobenchmark de arranque y de scroll (jank). Un cambio de performance sin medición antes/después no se acepta.

### `references/testing.md`

| Nivel | Qué se prueba | Con qué |
|---|---|---|
| Unit (JVM) | **corrección de los 11 ejercicios**, normalización, umbral CEFR, mappers, parseo tolerante | JUnit + assertk + fakes escritos a mano |
| Datos | repos con Room in-memory y respuestas simuladas del API, incluido el outbox reenviando | Room in-memory + MockWebServer |
| ViewModel | emisiones de estado, errores, offline | Turbine + `runTest` + `TestDispatcher` |
| UI | cada renderer: responde, corrige, muestra la explicación | `createAndroidComposeRule` (Robolectric para que corra en JVM) |
| Visual | **screenshot test por cada `kind`**, light y dark | Roborazzi |
| Rendimiento | arranque y scroll de la clase | Macrobenchmark |

**Gate de "terminado"** (lo que hace verificable el skill): una pantalla no está hecha sin test de ViewModel; un `kind` de ejercicio no está hecho sin test de corrección **y** screenshot; `:core:domain` no baja de 80% de cobertura. Los fakes viven en `:core:testing`, no duplicados por feature.

### `references/calidad-seguridad.md`

Tabla directa *vicio heredado → regla nueva*, para que la corrección sea explícita y no un cambio silencioso:

| En Adifnex hoy | Regla en la app nueva |
|---|---|
| `HttpLoggingInterceptor.Level.BODY` siempre | solo bajo `if (BuildConfig.DEBUG)` |
| `usesCleartextTraffic="true"` en release | Network Security Config por buildType; cleartext solo en debug para `10.0.2.2` |
| `isMinifyEnabled = false` | R8 + `shrinkResources` en release |
| `runBlocking` en el interceptor | prohibido |
| `StateFlow` expuesto sin `.asStateFlow()` | obligatorio |
| Dos patrones de `UiState` distintos | uno solo, documentado |
| Colores hardcodeados, sin dark theme | tokens en `:core:designsystem`, dark obligatorio |
| Sin capa de dominio ni mappers | ambos obligatorios |
| Cero tests | los gates de arriba |

Más: `detekt` + `ktlint` + Android Lint como gate local, `BASE_URL` por `buildConfigField` (patrón que Adifnex sí hace bien: `10.0.2.2` en debug), nada de secretos en git, y accesibilidad — `contentDescription` en todo icono, objetivo táctil ≥48dp, escalado de fuente hasta 200%, TalkBack navegable.

### `references/diseno-tokens.md`

Traducción literal de `DESIGN.md` a Material 3, para que web y app se vean el mismo producto:

- Base: `--spa-bg #ffffff` → `surface`; `--spa-surface #fafbfa` → `surfaceContainerLow`; texto `#1f2421`, secundario `#5c655f`, borde `#e4e8e5`.
- Acento salvia `#6f8c79` → `primary`; correcto `#4f8a5b` / incorrecto `#c0635e` como roles semánticos fijos, con sus fondos tintados.
- **Un acento por curso**, tomado de la paleta extendida ya definida: salvia (inglés), terracota/clay (JavaScript), azul niebla (Docker), lavanda (Kubernetes).
- Reglas heredadas que se mantienen: **iconos vectoriales, jamás emojis**; acento solo para acción primaria, selección y estado, nunca decoración; transiciones 150–250 ms respetando *reduce motion*; prohibido glassmorphism y gradient text.
- **Dark theme obligatorio** — la web no lo tiene y es la única adaptación real: se deriva de los mismos roles, sin inventar colores nuevos.

---

## Entregable 2 — Prompt de diseño

Archivo: `C:\Users\Christian\Proyectos\teacher-english\movil\PROMPT-DISENO.md`

Prompt autocontenido, listo para pegar en Claude, que produce el diseño visual de la app. Incluye:

1. **Contexto de producto** — qué es la academia, quién estudia (Christian, dev peruano), los 4 cursos, y que la clase se recorre **por pasos**, con **corrección inmediata** y **banner de dudas flotante** (el paquete de interacción ya cerrado en `CLAUDE.md`).
2. **Sistema de diseño** — los tokens de la tabla anterior, ya traducidos a Material 3, con la instrucción de no inventar colores.
3. **Inventario de pantallas**: selector de perfil · hub de cursos (nivel + %) · panel de curso (Hoy / Módulos / Progreso / Conceptos) · **clase por pasos** con barra de avance · resumen con puntaje y temas fallados · progreso (temas débiles, racha, siguiente clase) · glosario de conceptos.
4. **Los 7 renderers de sección y los 11 de ejercicio**, cada uno con sus campos reales — es lo que más pantalla ocupa y donde se juega el diseño. Incluye el visualizador `machine` (paso a paso con Anterior/Siguiente/Automático) y el desplegable `concept`.
5. **Estados que casi siempre se olvidan**: sin conexión, sincronizando, clase todavía sin contenido (121 de 128 clases están vacías hoy), error de red, ejercicio ya respondido al volver atrás.
6. **Restricciones**: Material 3, light **y** dark, pulgar alcanzable, accesible (48dp, 200% de fuente, contraste), sin emojis.
7. **Formato de salida esperado**: especificación por pantalla + mockup HTML navegable como artifact para verlo antes de escribir Kotlin.

Se guarda en el repo, no en el chat, para que quede versionado junto al contenido que describe.

---

## Ubicación de la app (cuando se construya)

`C:\Users\Christian\Proyectos\teacher-english\movil\` — dentro del mismo repo. La regla *"abre con doble clic, sin build"* de la web no se rompe: la carpeta es aditiva y el motor estático la ignora por completo. Ventaja sobre el precedente de Adifnex (repo aparte): contenido, API y app viajan en el mismo commit.

## Orden de ejecución

1. `references/` los 7 archivos (el contenido pesado).
2. `SKILL.md` que los orquesta.
3. `movil/PROMPT-DISENO.md`.
4. Documentar en el wiki de Viernes: nueva página `proyectos/teacher-english-movil.md` + entrada en `log.md` e `index.md`.

## Verificación

- **El skill carga**: reiniciar la sesión y comprobar que `academia-movil` aparece en el listado de skills con su `description`; invocar `/academia-movil` y ver que Kai se presenta y lee el repo correcto.
- **Las referencias resuelven**: los enlaces relativos de `SKILL.md` abren cada archivo de `references/`.
- **Anti-voseo**: grep de la lista negra (`vos`, `sos`, `mirá`, `podés`, …) sobre los 8 archivos, cero coincidencias.
- **Los datos del skill son ciertos, no de memoria**: contrastar la lista de 11 `kind` contra `engine/exercises.js` + `engine/exercises-code.js`, y los 10 endpoints contra `api/src/modulos/**/*.controlador.ts`.
- **El prompt funciona**: pegarlo en una sesión limpia de Claude y verificar que produce el mockup navegable de las pantallas listadas sin pedir más contexto.
- **Nada se rompe**: `git status` en `teacher-english` debe mostrar solo `movil/PROMPT-DISENO.md` como archivo nuevo. Sin commit — versiona Christian.
