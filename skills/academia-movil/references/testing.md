# Pruebas — estrategia y gates

Adifnex tiene **cero tests**: no existen `src/test/` ni `src/androidTest/`. Esta app nace al revés.
No por dogma: porque el motor de ejercicios es lógica pura con muchos casos y **ya produjo un bug
grave en la web** que un solo test unitario habría atrapado el primer día.

---

## 1. Qué se prueba y con qué

| Nivel | Qué cubre | Herramientas | Dónde |
|---|---|---|---|
| **Unit (JVM)** | corrección de los 11 `kind`, normalizaciones, umbral CEFR, similitud, parseo tolerante, mappers, armado de pasos | JUnit + assertk + fakes | `:core:domain`, `:core:data` |
| **Datos** | repositorios contra Room in-memory y respuestas simuladas; outbox que reintenta | Room in-memory + MockWebServer | `:core:data` |
| **ViewModel** | emisiones de estado, errores, modo sin conexión | Turbine + `runTest` + `TestDispatcher` | `:feature:*` |
| **UI** | cada renderer: responde, corrige, muestra la explicación, no deja re-responder | `createAndroidComposeRule` sobre Robolectric | `:feature:*` |
| **Visual** | un screenshot por `kind`, en claro y oscuro | Roborazzi | `:feature:clase` |
| **Rendimiento** | arranque en frío, jank al recorrer la clase | Macrobenchmark | módulo `:benchmark` |

Las pruebas de UI corren con **Robolectric en la JVM**, no en un emulador: se ejecutan en segundos y
se pueden correr en cada cambio. El emulador queda para el humo manual.

---

## 2. Gates de "terminado" (INNEGOCIABLES)

Esto es lo que hace verificable al skill. Si un gate no se cumple, el trabajo **no está hecho**,
aunque se vea bien en pantalla.

### Un `kind` de ejercicio está hecho cuando tiene los 3 artefactos

1. El Composable del renderer.
2. **Test unitario de su corrección** en `:core:domain`, con al menos: respuesta correcta, respuesta
   incorrecta, respuesta vacía, y el caso límite propio del tipo (alternativas múltiples, mayúsculas,
   acentos, orden equivocado, `answer` fuera de rango).
3. **Screenshot test** en claro y oscuro, en los estados sin responder / correcto / incorrecto.

> Este gate existe por un bug concreto: `word_order` guardaba nodos del DOM y comparaba
> `placed.join(" ")` → `"[object HTMLButtonElement]…"`. Los tres ejercicios de ordenar fueron
> **imposibles de acertar** durante meses, incluido el examen del mes, y ensuciaron el progreso
> guardado. Un test de corrección de tres líneas lo habría cazado el primer día.

### Una pantalla está hecha cuando tiene test de ViewModel

Estado inicial, éxito, error, y el camino sin conexión. Con Turbine, comprobando **la secuencia** de
estados, no solo el último.

### `:core:domain` no baja de 80% de cobertura

Es el módulo de lógica pura: no hay excusa de "es difícil de probar". La cobertura de UI **no se
persigue**; ahí lo que vale son los screenshots.

### Ningún `kind` o `type` desconocido puede crashear

Test explícito: alimentar el parser con `{"type":"inventado"}` y `{"kind":"inventado"}` y comprobar
que produce `SeccionDesconocida` / `EjercicioDesconocido` y que la pantalla los pinta como aviso.

---

## 3. Fakes, no mocks

Los dobles de prueba se **escriben a mano** y viven en `:core:testing`, compartidos:

```kotlin
class ClaseRepositoryFalso : ClaseRepository {
    var resultado: Resultado<Clase> = Resultado.Exito(claseDePrueba())
    override suspend fun obtener(codigo: String) = resultado
}
```

Un fake se rompe cuando cambia la interfaz — que es exactamente lo que se quiere. Un mock configurado
con `every { … }` sigue compilando mientras miente. MockK se usa solo para lo que no se puede fakear
razonablemente (una API del framework de Android).

Los datos de prueba se construyen con *builders* con valores por defecto, para que cada test declare
**solo lo que le importa**:

```kotlin
fun ejercicioOpcionMultiple(answer: Int = 0, options: List<String> = listOf("a", "b")) = …
```

---

## 4. Corrutinas en tests

- `runTest` + un `TestDispatcher` **inyectado** (por eso los dispatchers no se hardcodean).
- Regla de JUnit compartida en `:core:testing` que reemplaza el dispatcher principal.
- Turbine para los `Flow`: `awaitItem()`, `awaitComplete()`, `cancelAndIgnoreRemainingEvents()`.
- Cero `Thread.sleep`, cero `delay` real, cero esperas por tiempo. Un test que depende del reloj es un
  test que va a fallar de forma intermitente.

---

## 5. Nombres y forma

Nombre del test = la frase que describe la regla, en español:

```kotlin
@Test
fun `fill_blank acepta una alternativa aunque venga con tilde y mayusculas`() { … }

@Test
fun `code_fill distingue mayusculas porque el codigo es sensible a ellas`() { … }
```

Estructura **preparar / ejecutar / comprobar** separada por líneas en blanco. Una sola razón de fallo
por test. Nada de `assertTrue(a == b)`: se usa la aserción específica para que el mensaje de fallo
diga qué esperaba y qué llegó.

---

## 6. Contra qué se prueba la corrección

Los casos de prueba de los 11 `kind` no se inventan: se derivan de las clases reales que ya existen
en el repo (`lessons/**`) y del comportamiento de `engine/exercises.js` y `engine/exercises-code.js`.

Si la app corrige distinto que la web para la misma entrada, **la app está mal** — el progreso ya
guardado en PostgreSQL se generó con las reglas de la web y tiene que seguir siendo coherente.

Un buen banco inicial: las 26 preguntas de opción múltiple, los 4 `code_fill`, los 3 `word_order` y
los 6 `matching` que hoy existen en `lessons/`.

---

## 7. Qué NO se prueba

- Getters, `data class` sin lógica, mappers triviales de un campo a otro.
- Que Room guarde (eso lo prueba Room). Sí se prueba **la consulta propia** y la migración.
- La biblioteca de terceros. Se prueba el borde: qué hace la app cuando la biblioteca falla.
- Cobertura por la cobertura. Un test que solo sube el número y no describe una regla, sobra.

---

## 8. Verificación local antes de dar algo por hecho

```
./gradlew :core:domain:test              # rápido, corre siempre
./gradlew testDebugUnitTest              # todos los unit + Robolectric
./gradlew verifyRoborazziDebug           # screenshots contra los de referencia
./gradlew detekt lintDebug               # estilo y lint de Android
./gradlew :benchmark:connectedCheck      # solo cuando se toca rendimiento
```

Las capturas de referencia (*golden*) se versionan. Un cambio visual que no era intencional aparece
como test roto, que es justo lo que se busca en un motor que pinta 18 tipos distintos de contenido.
