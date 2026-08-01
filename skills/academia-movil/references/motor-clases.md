# Motor de clases — el corazón de la app

Todo lo demás (perfil, hub, dashboard) es una pantalla más. **Esto** es el producto.
Lee este archivo entero antes de tocar `:feature:clase` o `:core:domain/correccion/`.

La fuente de verdad es el motor de la web: `engine/lesson-engine.js`, `engine/exercises.js`,
`engine/exercises-code.js`. Si algo de aquí no coincide con esos archivos, **gana el repo** — ábrelo
y corrige este documento.

---

## 1. Qué llega del servidor

`GET /api/clase/:codigo` devuelve el objeto de la clase tal cual se escribió en el `.js`, volcado a
JSONB. Un objeto de datos puros, sin lógica:

```jsonc
{
  "id": "js-03",
  "module": 1,            // los cursos técnicos usan "module"; el inglés usa "month" + "lesson"
  "level": "Fundamentos", // "A1".."C2" | "Fundamentos" | "Intermedio" | "Avanzado" | "Experto"
  "title": "…",
  "spanish_ratio": 0.7,   // solo inglés, informativo
  "objectives": ["…"],
  "intro": "…",
  "sections": [ … ],      // el cuerpo real
  "qa_bank": [{ "q": "…", "a": "… (HTML)" }],
  "spaced_review": ["m01-l01"]   // opcional: ids de clases previas
}
```

### Los pasos de la clase

La clase se recorre **por pasos**, uno por pantalla, con Anterior/Siguiente. El orden lo arma la app
igual que `lesson-engine.js:114-127`:

```
portada  →  repaso (solo si spaced_review aportó ítems)  →  una sección por paso  →  resumen
```

El repaso toma las primeras 3 secciones de tipo `vocabulary` de cada clase referida, con tope de
6 ítems en total.

---

## 2. Los 7 tipos de sección

`engine/lesson-engine.js:217-265`. Cada uno es un archivo en `:feature:clase/seccion/`.

| `type` | Campos | Notas de render |
|---|---|---|
| `explanation` | `title`, `content` | `content` es **HTML** |
| `vocabulary` | `title`, `items: [{ en, es, audio? }]` | botón de voz por ítem, salvo `audio: false` |
| `example` | `title`, `content` | HTML |
| `code` | `title`, `intro`, `lang` (`js`\|`bash`\|`yaml`, default `js`), `code`, `terminal` (bool), `termTitle`, `caption`, `after` | con `terminal: true` se pinta como consola; las líneas que empiezan con `$ ` son comandos, el resto salida atenuada |
| `machine` | `title`, `intro`, `layout` (1\|2), `lang`, `boxes: [{id,label}]`, `steps: [{ desc, boxes: { <boxId>: [líneas] } }]` | visualizador paso a paso: Anterior / Siguiente / Automático (1400 ms) / Reiniciar |
| `concept` | `ref` (id del banco) y/o inline `term`, `hint`, `body`, `breakdown: [{en,es}]`, `code`, `lang`, `codeCaption`, `example`, `mantra`, `open`; más `lead` | desplegable. Si trae `ref`, se resuelve contra el banco de conceptos del curso y **los campos inline sobrescriben** los del banco |
| `exercise` | `kind` + los campos de la tabla siguiente + `topic` | ver sección 3 |

### El HTML dentro del contenido

`explanation`, `example`, `concept.body` y `qa_bank[].a` traen **HTML** (`<p>`, `<b>`, `<code>`,
`<ul>`, `<li>`). Compose no renderiza HTML.

- **No uses un `WebView`** por sección: mata el rendimiento y rompe el tema.
- Convierte el HTML a `AnnotatedString` con un parser propio en `:core:domain` (o `:core:common`),
  con soporte para el subconjunto que realmente aparece en las clases. Es una función pura → se prueba
  en la JVM.
- Etiqueta desconocida → se pinta su texto plano. **Nunca** se muestra el markup crudo al alumno ni
  se lanza una excepción.

---

## 3. Los 11 tipos de ejercicio

7 del inglés (`engine/exercises.js`) + 4 de los cursos técnicos (`engine/exercises-code.js`).

| `kind` | Campos | Qué se guarda como `valor` |
|---|---|---|
| `multiple_choice` | `question`, `options[]`, `answer` (índice), `explanation`, `topic` | índice elegido (number) |
| `fill_blank` | `prompt` (el `___` es el hueco), `answer` (String o String[] alternativas), `explanation`, `topic` | texto tecleado |
| `matching` | `instruction`, `pairs: [{left,right}]`, `explanation`, `topic` | array con lo elegido |
| `word_order` | `instruction`, `words[]`, `answer` (String o String[]), `explanation`, `topic` | frase armada |
| `listening` | `audioText` (o `audio`), `question` (default "¿Qué escuchaste?"), `options[]`, `answer` (índice), `explanation`, `topic` | índice |
| `pronunciation` | `target`, `es` (pista), `topic` (default `"pronunciation"`) | transcripción escuchada. **No usa `explanation`** |
| `short_writing` | `prompt`, `answer?`, `sample`, `explanation`, `topic` | texto escrito. **Sin `answer` siempre cuenta como correcto** |
| `code_output` | `code`, `lang`, `caption`, `question` (default "¿Qué imprime?"), `options[]`, `answer` (índice), `explanation`, `topic` | índice |
| `terminal` | `command` (o `code`), `title`, `question` (default "¿Qué muestra?"), `options[]`, `answer` (índice), `explanation`, `topic` | índice |
| `code_fill` | `instruction`, `code` (con `___`), `lang`, `answer` (String o String[]), `explanation`, `topic` | texto tecleado |
| `code_order` | `instruction`, `lines[]` (en el orden correcto), `lang`, `explanation`, `topic` | líneas unidas con `\n` |

`topic` es **obligatorio** en todos: es lo que alimenta el etiquetado de errores, los temas débiles y
el repaso espaciado. Si un ejercicio llega sin `topic`, se registra la respuesta igual pero se avisa
en el log — no se inventa un tema.

---

## 4. Parseo tolerante (regla dura)

El JSON viene de contenido escrito a mano por Emily y Leo, que **evoluciona más rápido que la app**.
Hoy hay 128 clases y 121 todavía sin contenido; los tipos nuevos van a aparecer.

```kotlin
@Serializable
@JsonClassDiscriminator("type")
sealed interface SeccionDto {
    @Serializable @SerialName("explanation") data class Explicacion(...) : SeccionDto
    …
}
```

- Configura el `Json` con **`ignoreUnknownKeys = true`** y un **serializador por defecto** para el
  discriminador desconocido → `SeccionDesconocida(type)` / `EjercicioDesconocido(kind)`.
- La UI pinta un aviso discreto ("Esta sección todavía no se ve en la app") y **deja avanzar**.
- **La app jamás puede crashear por un `type` o `kind` que no conoce.** La web muestra
  "Sección desconocida: X" y sigue viva; la app hace lo mismo. Esto es un test obligatorio.
- Un campo que falta no rompe: valores por defecto en el DTO, exactamente los mismos defaults que usa
  la web (`question` de `code_output` = "¿Qué imprime?", etc.).

---

## 5. El índice que se manda al servidor (regla dura)

> **`indiceEjercicio` es el índice de la SECCIÓN dentro de `sections[]`, no un contador de ejercicios.**

Así lo guarda la web (`lesson-engine.js:251-260`) y así está el índice único
`(avance_clase_id, indice_ejercicio)` en PostgreSQL. Si la app numera los ejercicios de 0 a N por su
cuenta, **pisa el progreso ya migrado** de Christian y los datos quedan mezclados sin forma fácil de
distinguirlos.

Práctico: al recorrer `sections`, el ejercicio de la posición 12 del array manda `indiceEjercicio: 12`,
aunque sea el cuarto ejercicio de la clase.

---

## 6. Corrección — funciones puras en `:core:domain`

La corrección **no vive en el Composable**. Vive en `:core:domain/correccion/`, es pura, y es lo
primero que se prueba.

### Las dos normalizaciones (no son la misma)

```kotlin
/** Inglés: exercises.js:27-29 — fill_blank, matching, word_order, short_writing */
fun normalizarTexto(entrada: String): String =
    entrada.lowercase()
        .let { java.text.Normalizer.normalize(it, java.text.Normalizer.Form.NFD) }
        .replace(Regex("\\p{Mn}+"), "")            // quita los diacríticos
        .replace(Regex("[^a-z0-9\\s']"), " ")      // deja letras, dígitos, espacios y apóstrofo
        .replace(Regex("\\s+"), " ")
        .trim()

/** Código: exercises-code.js:121 — code_fill, code_order. SENSIBLE A MAYÚSCULAS. */
fun normalizarCodigo(entrada: String): String =
    entrada.replace(Regex("\\s+"), " ").trim()
```

Confundirlas rompe los ejercicios en las dos direcciones: `console.log` corregido con la normalización
del inglés se convierte en `console log` y deja de distinguir mayúsculas; una respuesta en inglés
corregida con la de código exige la tilde exacta.

### Respuestas con alternativas

`answer` puede ser un String **o** un array de alternativas válidas. En Kotlin se modela siempre como
`List<String>` (un String se envuelve en lista de uno) y se acepta si **alguna** normaliza igual.

### El bug que originó estas reglas

En la web, `word_order` guardaba **nodos del DOM** en el array de palabras colocadas y comparaba
`placed.join(" ")`, lo que producía `"[object HTMLButtonElement]…"`. Los **3 ejercicios de ordenar
eran imposibles de acertar**, incluido el examen del mes, y guardaban basura en el progreso.

La lección, convertida en regla: **el estado de un ejercicio guarda datos, nunca elementos de UI.**
En Compose eso significa `List<String>` en el `rememberSaveable`, no referencias a nada dibujable.
Y por eso cada `kind` necesita su test de corrección antes de darse por hecho.

---

## 7. Barajado estable

Las opciones se barajan con Fisher-Yates y, si el resultado quedó igual al original, se vuelve a
barajar (`shuffleDistinct`, `exercises.js:45`) — si no, a veces la primera opción es la correcta y se
regala la respuesta.

**En Compose el barajado se calcula una sola vez:**

```kotlin
val semilla = rememberSaveable(ejercicio.id) { Random.nextLong() }
val opciones = remember(semilla) { barajarDistinto(ejercicio.opciones, Random(semilla)) }
```

Con `rememberSaveable` sobrevive a la rotación y a la muerte del proceso. Barajar en cada
recomposición hace que las opciones **bailen bajo el dedo** del alumno: es un bug de usabilidad grave
y muy fácil de introducir.

---

## 8. Estado del ejercicio y corrección inmediata

El paquete de interacción está cerrado: **corrección inmediata**. El alumno responde → feedback al
instante con la explicación → recién ahí se habilita Siguiente.

```kotlin
sealed interface EstadoEjercicio {
    data object SinResponder : EstadoEjercicio
    data class Respondido(val correcta: Boolean, val explicacion: String?) : EstadoEjercicio
}
```

- Un ejercicio ya respondido **no se puede volver a responder** al navegar hacia atrás: se muestra en
  modo lectura con la respuesta dada y su feedback. (En la web esto fue un bug corregido.)
- Enviar incompleto no debe costar el punto: si faltan campos, el botón está deshabilitado con un
  hint, no se envía una respuesta incorrecta.
- Nada de diálogos bloqueantes tipo `alert()`. El feedback es inline, junto al problema.

---

## 9. Voz (fase 2 — inglés)

Detrás de una interfaz de dominio, para que `:core:domain` no toque Android:

```kotlin
interface ServicioVoz {
    val soportaSintesis: Boolean
    val soportaReconocimiento: Boolean
    suspend fun hablar(texto: String, velocidad: Float = 0.92f)
    fun cancelar()
    suspend fun escucharUnaVez(): Resultado<List<String>>   // alternativas
}
```

Implementación en `:core:data` con `TextToSpeech` (`Locale.US`, velocidad `0.92`) y `SpeechRecognizer`
(`en-US`, `maxAlternatives = 3`).

### Umbral de pronunciación (portado tal cual de `engine/speech.js:17-19`)

```kotlin
val UMBRAL_POR_NIVEL = mapOf(
    "A1" to 0.55, "A2" to 0.62, "B1" to 0.70,
    "B2" to 0.78, "C1" to 0.85, "C2" to 0.90,
)
const val UMBRAL_POR_DEFECTO = 0.6   // niveles fuera de la tabla (Fundamentos, Intermedio…)
```

Similitud = `1 - distanciaLevenshtein / longitudMayor` sobre el texto normalizado. Función pura en
`:core:domain`, con tests.

### Degradación (obligatoria)

- Sin reconocimiento de voz: el ejercicio se convierte en un botón "Escuché y continúo" que registra
  `correcta = true` con valor `"(sin reconocimiento)"`. Exactamente lo que hace la web.
- Sin síntesis: `listening` muestra un aviso y deshabilita el botón, sin romper la clase.
- Permiso de micrófono denegado: mensaje claro y camino alterno, nunca un bucle de permisos.
- La voz se corta (`cancelar()`) en **cada cambio de paso** y cuando la pantalla pierde el foco. En la
  web fue un bug: el audio seguía sonando después de avanzar.

---

## 10. Al terminar la clase

1. Se envía `POST /api/progreso/completar` con `alumnoId`, `curso`, `clase`.
2. La pantalla de resumen muestra puntaje, total y **los temas fallados por nombre** — no un número
   suelto. Ese etiquetado por tema es lo que después alimenta el dashboard y el repaso espaciado.
3. El puntaje que se muestra es el que devuelve el servidor, no uno calculado en el cliente: la API
   recalcula desde cero en cada respuesta y es la única autoridad.
