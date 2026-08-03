# Calidad, seguridad y accesibilidad

---

## 1. Lo que se corrige de Adifnex

Adifnex (`Venta e inventario\android-app\`) funciona y tiene cosas muy bien hechas — el
`TokenAuthenticator` con sus cuatro guardas contra bucles y `dagger.Lazy` para romper el ciclo es
mejor de lo que se ve en la mayoría de apps. Pero arrastra vicios concretos. Esta tabla existe para
que la corrección sea **explícita**, no un cambio silencioso:

| En Adifnex hoy | Regla en esta app | Por qué |
|---|---|---|
| `HttpLoggingInterceptor.Level.BODY` siempre activo | solo bajo `if (BuildConfig.DEBUG)`, y `Level.NONE` en release | en release imprime cuerpos completos al logcat: cualquier app puede leer datos del alumno |
| `usesCleartextTraffic="true"` en el manifiesto | Network Security Config **por buildType**: cleartext solo en debug y solo para `10.0.2.2` | permite tráfico HTTP en producción, abierto a manipulación en red |
| `isMinifyEnabled = false` en release | R8 + `shrinkResources` activos | APK más grande, más lenta y con nombres legibles |
| `runBlocking` dentro del interceptor de OkHttp | **prohibido** (ver `compose-performance.md`) | bloquea el hilo de red en cada petición |
| `StateFlow` expuesto sin `.asStateFlow()` | `.asStateFlow()` obligatorio | la UI puede escribir el estado del ViewModel |
| Dos patrones de `UiState` (sealed y data class) | **uno solo**, documentado en `arquitectura.md` | dos formas de hacer lo mismo se copian y multiplican |
| Sin `@SerializedName` / `@SerialName` en los modelos | `@SerialName` explícito en cada campo | con R8 activo, ofuscar rompe el parseo en silencio |
| Colores hardcodeados en las pantallas, sin dark theme | tokens en `:core:designsystem`; **cero `Color(0xFF…)` fuera de ahí** | `LoginScreen` pinta con literales inline y no respeta el tema |
| Sin capa de dominio ni mappers: los DTO llegan a la UI | dominio y mappers obligatorios | un cambio del servidor se propaga hasta el Composable |
| `Result<T>` + `runCatching`, error como `String` | `Resultado<T>` con `MensajeError` tipado | `it.message` no permite decidir ni traducir |
| Cero tests | los gates de `testing.md` | |

---

## 2. Seguridad

Hoy **no hay autenticación** y no se agrega. Aun así:

- **Nada de secretos en git.** Ni claves, ni contraseñas, ni el keystore. Van en
  `local.properties` (ignorado) o variables de entorno, y se leen desde Gradle.
  Precedente a no repetir: la contraseña `academia_local` está en texto plano en el
  `docker-compose.yml` del proyecto — sirve para local, pero no se replica en la app.
- **Network Security Config por buildType.** En release: solo HTTPS, sin excepciones de dominio.
- **Nada sensible al logcat.** Ni el `alumnoId`, ni correos, ni cuerpos de respuesta en release.
- **DataStore para las preferencias** (alumno activo, curso actual). Cuando exista login,
  las credenciales van cifradas — hoy no hay nada que cifrar.
- `android:allowBackup` y `dataExtractionRules` decididos a conciencia, no por defecto.
- **Permisos al mínimo**: `INTERNET` ahora; `RECORD_AUDIO` recién en la fase de voz, pedido en
  contexto (cuando el alumno toca el botón del micrófono) y con camino alterno si lo niega.
- Dependencias: revisar avisos de vulnerabilidades antes de subir una versión mayor.

---

## 3. Estilo y análisis estático

- **ktlint** para el formato — no se discute el formato en revisión, lo decide la herramienta.
- **detekt** para complejidad, funciones largas, `TODO` olvidados y *code smells*.
- **Android Lint** en modo `warningsAsErrors` para el módulo `:app`.
- Los tres corren antes de dar cualquier cosa por hecha:
  `./gradlew detekt lintDebug` debe salir limpio.

Reglas propias que conviene activar en detekt: prohibir `runBlocking`, prohibir
`Dispatchers.IO` hardcodeado, prohibir `println`, prohibir `!!`.

---

## 4. Convenciones de código

- **Español para el dominio**, inglés para lo prestado del framework. `registrarRespuesta`,
  `temasDebiles`, `claseActual`; pero `uiState`, `Modifier`, `LaunchedEffect`. Es la convención que
  ya usa Adifnex y que se lee natural.
- Nada de abreviaturas crípticas: `ejercicio`, no `ej`; `respuesta`, no `resp`.
- Sin `!!`. Sin `lateinit` fuera de tests. Sin `Any` en firmas públicas.
- Sin comentarios que repiten el código. Los comentarios explican **por qué**, no qué.
- Un archivo por tipo público. `ClaseViewModel.kt` contiene `ClaseViewModel`.
- Version catalog (`libs.versions.toml`) obligatorio: ninguna versión escrita a mano en un
  `build.gradle.kts`.
- **Las versiones se consultan al momento de fijarlas**, nunca se escriben de memoria. Kotlin, AGP,
  Compose BOM y las librerías se mueven rápido, y una combinación inventada no compila.

---

## 5. Accesibilidad

`DESIGN.md` ya lo pide para la web; en móvil es más exigible todavía.

- **`contentDescription` en todo icono con significado**; `null` explícito en los decorativos.
  Un icono sin descripción es invisible para TalkBack.
- **Objetivo táctil ≥ 48dp** aunque el icono se vea de 24. Los botones de un ejercicio se tocan a
  ciegas, en el micro.
- **Escalado de fuente hasta 200%** sin que se corte ni se solape nada. Se prueba con la fuente
  grande de Android, no solo con la de por defecto. Nada de alturas fijas en `dp` para texto.
- **Contraste ≥ 4.5:1** para el texto normal. Los tokens ya lo cumplen (ver `diseno-tokens.md`);
  el riesgo aparece al inventar colores fuera del sistema.
- **El color nunca es el único indicador.** Correcto/incorrecto llevan icono y texto además del
  color: hay daltonismo, y hay pantallas con sol de frente.
- **Navegable con TalkBack** de principio a fin de una clase. El orden de lectura debe seguir el
  orden visual; se agrupa con `Modifier.semantics(mergeDescendants = true)` donde toque.
- **Respetar "reducir movimiento"** del sistema: las animaciones se acortan o se desactivan.
- Estados anunciados: cuando un ejercicio se corrige, TalkBack debe decir si estuvo bien o mal, no
  solo cambiar un color.

---

## 6. Manejo de errores visible

- Nunca una pantalla en blanco. Sin datos → estado vacío con explicación y acción.
- Nunca un mensaje técnico crudo al alumno. `MensajeError` se traduce a una frase entendible;
  el detalle va al log.
- Toda operación que puede fallar ofrece **reintentar**.
- Un fallo de red no pierde lo que el alumno ya respondió: entra al outbox (ver `datos-offline.md`).

---

## 7. Git

**JAMÁS commit, push ni PR.** El versionado lo hace Christian — es regla vigente del proyecto
`teacher-english` y de sus otros repos.

Al cerrar un trabajo, recordarle qué commitear y con qué prefijo: `feat:`, `fix:`, `docs:`,
`content:` (este último solo para clases, que no las toca esta app).
