# Plan: Horario único, botón flotante en vivo y hora de inicio en los reportes

## Contexto

App Android nativa (Kotlin + Jetpack Compose, Material 3) del Mazda. Hoy conviven
**dos sistemas de "horario" separados** que el usuario considera lo mismo:

1. **Recordatorio diario** (pantalla *Ajustes*): una sola hora (ej. 20:00) que, vía
   `RecordatorioScheduler` (WorkManager) + `RecordatorioWorker`, dispara una
   notificación "No olvides registrar tu abono". Config en `Configuracion` prefs
   (`recordatorioActivo/Hora/Minuto`).
2. **Horarios de detección** (pantalla *Recorridos*): ventanas con días + rango
   horario (ej. L-V 06:30–08:30) que, vía `DeteccionScheduler` (alarmas) +
   `DeteccionHorario`, encienden/apagan la detección de vehículo por GPS. Config en
   Room (`VentanaHorarioEntity`).

Además, al iniciar un recorrido no hay indicador flotante en vivo, y los reportes
muestran solo la fecha (sin hora).

### Objetivo (decisiones del usuario)

- **Un solo horario**: eliminar el "recordatorio diario" de hora única. Las
  **ventanas horarias** son la única configuración. Durante una ventana activa:
  - Arriba se mantiene **el mensaje persistente** (la notificación en curso), que
    ahora incluye el recordatorio de registrar el abono.
  - Aparece el **botón flotante** "listo para iniciar", visible **durante toda la
    ventana** (no solo cuando el GPS detecta viaje). Al empezar a manejar pasa a
    mostrar **km y tiempo en vivo**.
- Botón flotante visible **sobre cualquier pantalla** de la app; al tocarlo lleva a
  **Recorridos**.
- **Reportes con hora**: historial de Recorridos y de Abonos muestran fecha **+
  hora**.

## Cambios

### 1. Unificar el horario: eliminar el recordatorio de hora única

- **`MazdaApp.kt`** (líneas 24-32): quitar el bloque que llama
  `RecordatorioScheduler.programar(...)` y su import.
- **`ui/ajustes/AjustesViewModel.kt`**: quitar las llamadas a
  `RecordatorioScheduler.programar/cancelar` (líneas 24-30) y su import. `guardar()`
  solo persiste la config.
- **`ui/ajustes/AjustesScreen.kt`**: eliminar la `TarjetaSeccion("Recordatorio
  diario")` completa (líneas 105-144) y los estados/campos asociados
  (`recordatorio`, `hora`, `minuto` — líneas 62-64, 71-73) y su uso en el
  `Configuracion(...)` del botón Guardar (líneas 152-154). Quedan "Plan de abonos"
  y "Respaldo".
- **`data/prefs/ConfiguracionRepository.kt`**: quitar los campos
  `recordatorioActivo/Hora/Minuto` de `Configuracion` (líneas 20-22), sus `Keys`
  (30-32) y su lectura/escritura (39-41, 49-51). Las claves viejas en DataStore se
  ignoran solas.
- **Borrar** `notifications/RecordatorioScheduler.kt` y
  `notifications/RecordatorioWorker.kt` (quedan sin uso). `NotificationHelper`
  puede conservar `CHANNEL_ID/NOTIF_ID` aunque queden sin uso (sin churn extra).

### 2. El mensaje persistente incluye el recordatorio de abono

El servicio en primer plano ya muestra una notificación en curso mientras la
ventana está activa (`RecorridoTrackingService`, `irAlFrente`/`actualizarNotificacion`,
canal `CHANNEL_TRACKING`). Ajustar los textos para que ese "mensaje que siempre
aparece" durante la ventana lleve el recordatorio del abono:

- Estado "en ventana, sin viaje" (hoy "Atento a tu manejo / Detectará tu viaje",
  líneas 167, 185): cambiar a algo como título "Atento a tu manejo" y texto
  "Recuerda registrar tu abono de hoy." (unifica recordatorio + detección).
- Estado "midiendo recorrido" (línea 147): se mantiene "Midiendo recorrido…". Los
  km en vivo en la notificación son mejora opcional (ver abajo).

### 3. Formato del cronómetro en vivo — `util/Formato.kt`

`Long.aDuracion()` solo da minutos. Agregar:

```kotlin
/** Milisegundos -> "1:23:45" o "12:05" (mm:ss). Para cronómetro en vivo. */
fun Long.aCronometro(): String {
    val totalSeg = this / 1000
    val h = totalSeg / 3600
    val m = (totalSeg % 3600) / 60
    val s = totalSeg % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
}
```

### 4. Botón flotante global — `ui/MazdaAppScreen.kt`

- Obtener el `RecorridosViewModel` vía `viewModel(factory = AppViewModelProvider.Factory)`
  y `collectAsState()` sobre `enCurso` (línea 26 del VM) y `ventanas` (línea 29).
- Determinar si estamos dentro de una ventana activa reutilizando la lógica pura
  ya existente: `DeteccionHorario.dentroDeVentana(ventanas, LocalDateTime.now())`
  (esa función ya filtra `activo`). Recomputar con un **ticker**.
- **Ticker de 1 s** (sirve para el cronómetro y para reevaluar la ventana):

```kotlin
var ahora by remember { mutableStateOf(System.currentTimeMillis()) }
LaunchedEffect(Unit) { while (true) { ahora = System.currentTimeMillis(); delay(1000) } }
val enVentana = DeteccionHorario.dentroDeVentana(ventanas, /* LocalDateTime desde 'ahora' */)
val visible = enCurso != null || enVentana
```

- Envolver el contenido del `Scaffold` en un `Box` y, si `visible`, dibujar un pill
  flotante (`Surface`/`Card` redondeado y elevado, `primaryContainer`) alineado
  abajo a la derecha por encima del `NavigationBar`
  (`Modifier.align(Alignment.BottomEnd)` + padding):
  - Si `enCurso != null`: **km en vivo** `enCurso!!.distanciaMetros.div(1000).aKm()`
    + **cronómetro** `(ahora - enCurso!!.inicioMillis).aCronometro()`.
  - Si solo `enVentana`: "Atento a tu manejo" + "0.00 km" (listo para iniciar),
    cronómetro en 0 o icono de play.
- **onClick** → navegar a `Destino.RECORRIDOS.ruta` con el mismo patrón del
  `NavigationBar` (líneas 72-78).
- Extraer un composable privado `PillRecorrido(...)` para legibilidad.

### 5. Hora en los reportes

- **`ui/recorridos/RecorridosScreen.kt`** línea 238: `inicioMillis.aFecha()` →
  `inicioMillis.aFechaHora()` (helper ya existe, `Formato.kt` línea 21). Actualizar
  import `aFecha` → `aFechaHora` (línea 53).
- **`ui/abonos/AbonosScreen.kt`** línea 87: `abono.fechaMillis.aFecha()` →
  `aFechaHora()`. Actualizar import (línea 40).
- (Opcional) En la tarjeta "Recorrido en curso" de Recorridos (líneas 84-104)
  añadir el mismo cronómetro en vivo con `aCronometro()`.

## Mejora opcional (no requerida)

Enriquecer la notificación del servicio con los km en vivo en cada callback de
ubicación (`RecorridoTrackingService.callbackUbicacion`). No crear overlay tipo
"burbuja sobre otras apps" (requiere `SYSTEM_ALERT_WINDOW`).

## Archivos a modificar

- `MazdaApp.kt` — quitar programación del recordatorio diario.
- `ui/ajustes/AjustesViewModel.kt` — quitar `RecordatorioScheduler`.
- `ui/ajustes/AjustesScreen.kt` — quitar sección "Recordatorio diario".
- `data/prefs/ConfiguracionRepository.kt` — quitar campos `recordatorio*`.
- `notifications/RecordatorioScheduler.kt`, `notifications/RecordatorioWorker.kt` — **borrar**.
- `tracking/RecorridoTrackingService.kt` — textos de notificación (recordatorio de abono en ventana).
- `util/Formato.kt` — nuevo `aCronometro()`.
- `ui/MazdaAppScreen.kt` — pill flotante global (en curso o en ventana) + ticker + navegación.
- `ui/recorridos/RecorridosScreen.kt` — `aFecha()` → `aFechaHora()` (línea 238 + import); opcional cronómetro.
- `ui/abonos/AbonosScreen.kt` — `aFecha()` → `aFechaHora()` (línea 87 + import línea 40).

## Verificación

1. Compilar: `./gradlew assembleDebug` (o Android Studio).
2. En *Ajustes*: confirmar que ya **no existe** la sección "Recordatorio diario";
   solo quedan "Plan de abonos" y "Respaldo".
3. En *Recorridos*: crear una ventana que **incluya la hora actual** (ej. ahora–+30min).
   - Verificar que aparece el **botón flotante** "Atento a tu manejo · 0.00 km"
     sobre cualquier pestaña (Resumen/Gastos), durante toda la ventana.
   - Verificar que arriba (notificación) aparece el **mensaje persistente** con el
     recordatorio de abono.
4. Tocar **Iniciar recorrido** (o simular manejo): el pill pasa a **km + cronómetro
   en vivo**; el tiempo corre cada segundo y los km suben al moverse (simular GPS en
   emulador).
5. Tocar el pill → abre **Recorridos**. Detener → el pill vuelve a "Atento…" si
   sigue la ventana, o desaparece si la ventana terminó.
6. Historial de **Recorridos**: cada fila muestra **fecha + hora de inicio**
   (ej. "30 jun 2026, 06:42 · 12 min").
7. Historial de **Abonos**: cada fila muestra **fecha + hora** (ej. "30 jun 2026, 14:05 · nota").
