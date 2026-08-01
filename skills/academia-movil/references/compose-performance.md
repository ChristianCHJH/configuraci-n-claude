# Rendimiento en Compose

Compose es declarativo: la función se vuelve a ejecutar cuando cambia lo que lee. Casi todos los
problemas de rendimiento son el mismo problema — **algo se recompone más veces de las que debería**,
o **el trabajo pesado ocurre en el hilo equivocado**.

---

## 1. Prohibiciones

### `runBlocking` — prohibido fuera de los tests

Sin excepciones. Es el pecado que arrastra Adifnex en `NetworkModule`: lee el token con
`runBlocking { sessionManager.tokenAccesoFlow.first() }` **dentro de un interceptor de OkHttp**,
bloqueando el hilo de red en cada petición.

Cuando haga falta un valor persistido de forma síncrona, se resuelve con una **caché en memoria**
poblada por una corrutina al arrancar, o se sube la lectura a la capa `suspend` que ya está en una
corrutina. Nunca bloqueando.

### Otras prohibiciones

- Trabajo pesado dentro de un `@Composable` (parsear JSON, ordenar listas grandes, leer disco).
  El cuerpo de un Composable se ejecuta muchas veces: va en el ViewModel o en `remember`.
- `Modifier` creado dentro de un bucle sin `remember`.
- Estado mutable global observable desde varios sitios (`object Estado { var x by mutableStateOf() }`).
- `collectAsState()` — se usa **`collectAsStateWithLifecycle()`**, si no la pantalla sigue trabajando
  en segundo plano.
- `LaunchedEffect(Unit)` para algo que depende de un parámetro: la clave debe ser el parámetro.

---

## 2. Estabilidad

Compose salta la recomposición de un Composable si sus parámetros son **estables**. Un parámetro
inestable lo obliga a recomponerse siempre, aunque nada haya cambiado.

- `List<T>`, `Map<K,V>` y `Set<T>` de la stdlib son **inestables** (la interfaz no garantiza
  inmutabilidad). Se usa `ImmutableList` de `kotlinx.collections.immutable` en todos los modelos de UI.
- Los `data class` de solo lectura con propiedades estables ya son estables; los que envuelvan algo
  externo se marcan `@Immutable`.
- Activar el **strong skipping mode** del compilador de Compose: relaja mucho estas reglas, pero **no
  las anula** — sigue siendo mejor que los modelos sean estables de verdad.
- Las lambdas que capturan estado cambiante rompen el salto. Se pasan referencias a método
  (`viewModel::responder`) o se estabilizan con `rememberUpdatedState`.

Aplica muy directo aquí: la lista de secciones de una clase y la de opciones de un ejercicio son
listas que se pasan a Composables en cada paso.

---

## 3. Listas

La clase es una lista de secciones heterogéneas; el roadmap es una lista larga de clases.

```kotlin
LazyColumn {
    items(
        items = secciones,
        key = { it.id },              // estable y único: sin esto se recrea todo al reordenar
        contentType = { it.tipo },    // reutiliza composables del mismo tipo
    ) { … }
}
```

- `key` **siempre**. `contentType` **siempre que la lista sea heterogénea**, que es el caso.
- Nunca un `LazyColumn` dentro de otro `LazyColumn` en el mismo eje.
- Nada de `.height(IntrinsicSize.Min)` en listas: fuerza doble medición.

---

## 4. Leer el estado lo más tarde posible

Si un valor cambia muchas veces por segundo (una animación, un scroll), leerlo en la fase de
composición recompone todo el árbol. Leerlo en la fase de layout o dibujo no.

```kotlin
// mal: recompone en cada frame
Box(Modifier.offset(x = desplazamiento.dp))

// bien: solo relayout
Box(Modifier.offset { IntOffset(desplazamiento.roundToInt(), 0) })
```

Lo mismo con `graphicsLayer { alpha = … }` frente a `Modifier.alpha(…)`, y `drawBehind` frente a
`Modifier.background(colorCalculado)`.

`derivedStateOf` para lo derivado: por ejemplo, "¿ya se puede habilitar Siguiente?" calculado a partir
del estado del ejercicio, para que el botón no se recomponga con cada tecla escrita.

---

## 5. Compilación de release

Adifnex sale a producción con `isMinifyEnabled = false`. Aquí no:

```kotlin
release {
    isMinifyEnabled = true
    isShrinkResources = true
    proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
}
```

Con `kotlinx.serialization` las reglas de R8 vienen del propio plugin, así que no hay que mantener a
mano un archivo frágil de `-keep` (otra razón para no usar Gson).

**Baseline Profile** con la librería oficial: mejora el arranque en frío y el primer scroll de forma
medible. Se genera con un test de Macrobenchmark que recorre el flujo real — abrir la app, elegir
perfil, abrir una clase, avanzar tres pasos — y se regenera cuando el flujo cambia de forma
importante.

---

## 6. Medir, no adivinar

**Un cambio de rendimiento sin medición antes y después no se acepta.** Es la regla que separa
optimizar de tocar por si acaso.

| Qué | Con qué | Cuándo |
|---|---|---|
| Composables inestables y saltables | reporte de métricas del compilador de Compose | antes de optimizar nada |
| Recomposiciones por pantalla | Layout Inspector (contador de recomposición) | cuando una pantalla se siente lenta |
| Arranque en frío | Macrobenchmark `StartupTimingMetric` | en cada release |
| Jank al recorrer la clase | Macrobenchmark `FrameTimingMetric` | tras tocar el reproductor |
| Memoria y fugas | LeakCanary en debug | siempre activo en debug |

El reporte del compilador es el primer paso porque dice **qué** es inestable y por qué; sin él, se
optimiza a ciegas.

---

## 7. Presupuestos

- Arranque en frío hasta la primera pantalla útil: **< 1,5 s** en un gama media.
- Recorrer la clase: **0 frames perdidos** en un dispositivo de referencia.
- Abrir una clase ya descargada: **instantáneo** — viene de Room, no de la red.
- El parseo del JSON de la clase ocurre en `Dispatchers.Default`, nunca en el principal.

---

## 8. Imágenes y recursos

Hoy el contenido es texto y código, sin imágenes remotas. Si aparecen: **Coil**, con tamaño explícito
y placeholder; jamás cargar un bitmap en el hilo principal. Los iconos son vectoriales
(`ImageVector`), nunca PNG a varias densidades ni emojis.
