# Datos — contrato del API, Room y sincronización offline

---

## 1. El servidor

API NestJS 10 + TypeORM + PostgreSQL 16, en Docker.

| Pieza | Dónde | Nota |
|---|---|---|
| API | `:3211`, prefijo global `/api` | CORS abierto (`origin: true`) |
| PostgreSQL | `:5439` | 5432 lo ocupa otro proyecto |
| Web | `:8899` | la app **no** la usa |

`BASE_URL` por `buildConfigField`, nunca hardcodeada en el código:

```kotlin
debug   { buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:3211/api/\"") }
release { buildConfigField("String", "BASE_URL", "\"…\"") }   // cuando exista servidor
```

`10.0.2.2` es el `localhost` del host visto desde el emulador. En un teléfono físico hay que usar la
IP de la máquina en la red local — que es una razón más para no hardcodear.

**Hoy no hay autenticación.** La columna `contrasena_hash` existe en la tabla `usuario` pero está
vacía y no se usa. El modelo es: el alumno elige su perfil, la app guarda el `id` y lo manda como
`alumnoId` en cada petición. **No agregues cabeceras `Authorization`, ni interceptor de token, ni
pantalla de login.** Cuando toque, se planifica aparte.

---

## 2. Endpoints

| Método | Ruta | Uso en la app |
|---|---|---|
| GET | `/api/alumno` | lista de perfiles |
| POST | `/api/alumno` | registrar perfil (`nombre` 2-120, `correo?`, `avatarColor?`). **409** si el correo ya existe |
| GET | `/api/curso` | hub: 4 cursos con totales |
| GET | `/api/curso/:codigo` | roadmap: módulos + clases |
| GET | `/api/curso/:codigo/concepto` | glosario del curso |
| GET | `/api/clase/:codigo` | **el contenido de la clase** (el JSONB) |
| GET | `/api/alumno/:id/estado` | dashboard completo en una llamada |
| GET | `/api/progreso?alumnoId=&curso=` | progreso completo del curso |
| POST | `/api/progreso/respuesta` | registrar respuesta — **idempotente** |
| POST | `/api/progreso/completar` | marcar clase terminada |

`GET /api/alumno/:id/estado` devuelve de una sola vez `cursos[]`, `temasDebiles[]` y
`siguienteClase[]`. El dashboard se arma con esa única llamada: no la descompongas en varias.

### Cuerpos de escritura

```jsonc
// POST /api/progreso/respuesta
{ "alumnoId": 2, "curso": "javascript", "clase": "js-01",
  "indiceEjercicio": 12,          // ← índice de la SECCIÓN (ver motor-clases.md §5)
  "correcta": true,
  "valor": 2,                     // number | string | array — se guarda como JSONB
  "tema": "console-log",
  "fechaLocal": "2026-07-25" }    // ← la calcula el cliente

// POST /api/progreso/completar
{ "alumnoId": 2, "curso": "javascript", "clase": "js-01" }
```

---

## 3. El envelope

Éxito:

```json
{ "success": true, "statusCode": 200, "message": "Operación exitosa", "data": { } }
```

Error:

```json
{ "success": false, "statusCode": 400, "message": "Error de validación",
  "error": "BadRequestException", "detail": ["…"], "codigo": "…" }
```

`detail` solo aparece en errores de validación; `codigo` solo si la excepción lo trae. Nunca hay
stack traces.

```kotlin
@Serializable
data class RespuestaApi<T>(
    @SerialName("success")    val exito: Boolean,
    @SerialName("statusCode") val codigoEstado: Int,
    @SerialName("message")    val mensaje: String,
    @SerialName("data")       val datos: T? = null,
    @SerialName("detail")     val detalle: List<String>? = null,
    @SerialName("codigo")     val codigo: String? = null,
)
```

El sobre se abre en `:core:network` y **el dominio nunca lo ve**: los repositorios devuelven
`Resultado<T>` con el modelo de dominio ya mapeado.

---

## 4. Gotchas del servidor (reglas duras)

### `BIGINT` llega como String

El driver `pg` devuelve las columnas `BIGINT` como **String** (`"1"`), porque un int64 no siempre cabe
en un `number` de JavaScript. Los ids se modelan **`String`** en los DTOs, nunca `Long`.

> Este error ya costó caro en venta-inventario: un `403 "pertenece a otro negocio"` porque
> `"1" !== 1` en una comparación estricta. Es el mismo mecanismo.

### Los contadores también son String

`clasesTotales` y `clasesDisponibles` de `GET /api/curso` son `COUNT(*)` → llegan como `"128"`.
Se parsean explícitamente en el mapper, no se asume número.

### `forbidNonWhitelisted: true`

El `ValidationPipe` global rechaza cualquier campo que no esté declarado en el DTO del servidor:
**mandar un campo de más devuelve 400**, no lo ignora. Los cuerpos de escritura se escriben exactos,
sin campos "por si acaso".

### `@SerialName` explícito, siempre

En cada propiedad de cada DTO, aunque el nombre coincida. Adifnex depende hoy de que el nombre Kotlin
sea idéntico al del JSON, así que ofuscar o renombrar un campo rompe la app en silencio.

### Serialización

`kotlinx.serialization`, no Gson. Razones concretas: soporta jerarquías selladas con discriminador
(que es exactamente lo que necesita el motor de clases), falla en compilación y no por reflexión, y
no arrastra reglas de ProGuard frágiles cuando R8 esté activo.

---

## 5. Offline-first

### La regla

> **Room es la única fuente de verdad. La UI nunca observa a Retrofit.**

Los repositorios exponen `Flow<T>` desde Room; la red solo escribe en Room. Así la pantalla se pinta
igual con o sin internet, y una llamada que falla no deja la pantalla vacía.

```kotlin
override fun observarCursos(): Flow<List<Curso>> =
    cursoDao.observarTodos().map { it.map(CursoEntity::aDominio) }

override suspend fun refrescarCursos(): Resultado<Unit> = …   // red → Room
```

### Tablas locales

| Tabla | Guarda | Nota |
|---|---|---|
| `alumno` | perfiles | el activo se guarda en DataStore, no en Room |
| `curso`, `modulo`, `clase` | catálogo | `clase.contenido` como **String JSON crudo** |
| `concepto` | glosario | |
| `progreso_clase`, `progreso_tema`, `sesion` | espejo del progreso del servidor | |
| `respuesta_pendiente` | **outbox** de escrituras | ver abajo |

`clase.contenido` se guarda como texto y se parsea al abrir la clase, no al descargarla: guardar el
JSON crudo hace que un cambio en el modelo de la app no invalide la caché entera.

Se re-descarga solo si cambió: el endpoint devuelve `fechaSincronia`, que se compara con la guardada.

### El outbox (patrón obligatorio para el progreso)

Cada respuesta del alumno:

1. Se escribe **primero** en Room (`progreso_clase` + `respuesta_pendiente`). La UI reacciona al instante.
2. `WorkManager` toma las pendientes y las envía, con `NetworkType.CONNECTED` y backoff exponencial.
3. Al confirmar, se borra la fila del outbox.

**Reintentar es seguro**: la API hace upsert por `(avance_clase_id, indice_ejercicio)`, incrementa
`intentos` y **recalcula el puntaje desde cero** con dos `COUNT`. Está verificado que repetir no infla
el puntaje y que pasar de correcta a incorrecta lo baja. Por eso el outbox puede reintentar sin miedo,
y por eso no hace falta inventar un id de idempotencia.

El orden importa dentro de una misma clase: se envían en orden de creación.

### `fechaLocal` la calcula el cliente

```kotlin
val fechaLocal = LocalDate.now(ZoneId.systemDefault()).toString()   // "2026-07-25"
```

**Nunca UTC.** En Perú (UTC-5), a partir de las 19:00 la fecha UTC ya es la de mañana: usar UTC
rompería o inflaría la racha de estudio. El servidor guarda esa fecha tal cual en `sesion_estudio`.

Si una respuesta queda en el outbox y se envía dos días después, se manda **la `fechaLocal` con la que
se creó**, no la de hoy. La racha refleja cuándo estudió, no cuándo hubo señal.

---

## 6. Estados de red en la UI

Tres estados distintos, no uno:

| Estado | Qué se muestra |
|---|---|
| Sin conexión, con datos en caché | banner discreto "Sin conexión — estás viendo lo descargado" y todo funciona |
| Sin conexión, sin caché | pantalla vacía con explicación y botón de reintentar |
| Con pendientes por enviar | indicador "N respuestas por sincronizar", que desaparece solo |

Un fallo de red **jamás** bloquea al alumno ni le hace perder lo respondido.
