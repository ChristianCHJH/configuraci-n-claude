---
name: spiderman-tonto
description: Revisa que una web (cualquier proyecto, cualquier pantalla) cumpla las reglas mínimas vitales que hasta el más tonto debería cumplir, empezando por la primera y más importante — cero llamadas innecesarias al backend, todo a demanda. Busca consultas que se disparan solas al montar una pantalla o abrir un modal, buscadores sin espera de tecleo, catálogos descargados enteros, datos que se piden dos veces, peticiones repetidas y envíos dobles. Mira el código y, si la app está levantada, el panel de red. Reporta con archivo:línea; solo corrige si se lo piden. Úsala cuando el usuario diga "spiderman tonto", "revisa las llamadas", "consume por las puras", "llama al backend sin que lo pida", "revisa el modal", "reglas mínimas de la web" o invoque /spiderman-tonto, opcionalmente con una ruta, pantalla o componente.
---

# Spider-Man tonto

Las reglas que **cualquier** web tiene que cumplir. Se aplica en el proyecto
donde se invoque, sea React, Angular, Vue o lo que sea. Si el usuario da una
ruta, pantalla o componente, se revisa eso; si no, todo el frontend.

## Modo de trabajo

1. **Solo revisar.** No se toca código salvo que el usuario diga "corrige",
   "arréglalo" o equivalente después de ver el reporte.
2. **Código primero.** Buscar cada regla en el código con evidencia
   `archivo:línea`.
3. **Red después, si la app está levantada.** Abrir la pantalla con Playwright
   o Chrome, abrir el modal o el formulario **sin tocar nada más**, y contar
   las peticiones que salieron. Toda petición que salió sin un gesto del
   usuario es un hallazgo de la Regla 1.
4. En desarrollo, React `StrictMode` monta dos veces y cancela la primera
   petición: las `(canceled)` no son el hallazgo; que la petición **exista**
   sin que el usuario la pidiera, sí.
5. **Reporte corto**: una tabla por regla incumplida (dónde, qué pasa desde la
   pantalla, arreglo en una línea). Lo que cumple no se lista.

## Regla 1 — Cero llamadas innecesarias: todo a demanda (LA MÁS IMPORTANTE)

Abrir una pantalla, un modal o una pestaña **no** consulta nada que el usuario
todavía no pidió. Si la persona entra a registrar solo una cita y nunca abre el
selector de placa, esa consulta de placas no debió salir.

### 1.1 Nada se consulta al montar si no se va a mostrar ya

- Un selector, combo, autocompletado o panel desplegable consulta **cuando el
  usuario hace clic o empieza a escribir**, no al abrirse el modal.
- Prohibido `useQuery(..., { enabled: true })` / `useEffect(() => fetch…, [])`
  / `ngOnInit` con `subscribe` para datos de un selector que aún está cerrado.
- La consulta se habilita con el gesto: `enabled: abierto && texto.length >= 1`.
- Excepción: lo que la pantalla **pinta apenas abre** (el listado principal,
  el detalle del registro que se está viendo). Eso sí carga al entrar.

### 1.2 Buscador: espera a que el usuario deje de escribir

- Empieza a buscar desde **1 carácter** escrito.
- Espera **1 segundo sin teclear** antes de disparar la búsqueda (debounce).
  Cada tecla nueva reinicia la espera. Nunca una petición por tecla.
- La búsqueda va **al servidor** con el texto y un tope (`?buscar=…&limite=10`),
  no descargando el catálogo entero para filtrarlo en el navegador.
- Si el usuario sigue escribiendo y sale una búsqueda nueva, la anterior se
  **cancela** (`AbortSignal`), para que una respuesta vieja no pise a la nueva.
- «Buscando…» aparece **solo cuando la petición sale**, no mientras el
  usuario escribe: durante la espera del debounce no se anuncia nada. Si no
  hay resultados, lo dice.
- El aviso de «Buscando…» va siempre en el mismo lugar (donde va la lista),
  nunca encima de otro control como la X del campo.
- Texto vacío = no se consulta nada.

### 1.3 Lo que ya llegó no se vuelve a pedir

- Si una respuesta ya trae un dato, no se hace otra llamada para obtenerlo.
  Ejemplo: el vehículo ya trae su transportista y su conductor → no se consulta
  el catálogo de transportistas para pintar el nombre.
- Dos componentes que necesitan lo mismo comparten la misma consulta (misma
  `queryKey` o mismo servicio con caché), no hacen dos.
- Nada de llamadas en bucle por fila (N+1 desde el front): si la tabla tiene
  50 filas, no son 50 peticiones; es una que trae todo o el backend lo une.

### 1.4 Caché con criterio

- Un catálogo que casi no cambia no se vuelve a pedir cada vez que se abre el
  modal: `staleTime` razonable o caché del servicio.
- Revisar `refetchOnWindowFocus` / `refetchOnMount` en catálogos: volver a la
  pestaña no debe disparar diez peticiones.

## Regla 2 — Listas: paginadas en el servidor

- Ninguna tabla ni selector descarga "todos los registros". Endpoints tipo
  `/activos` o `/todos` que devuelven el catálogo completo son sospechosos en
  cuanto el catálogo puede crecer (vehículos, conductores, clientes).
- Paginación y filtros viajan al servidor (`pagina`, `limite`, `buscar`).

## Regla 3 — Un gesto, una petición

- El botón de guardar se deshabilita mientras la petición está en vuelo: doble
  clic no crea dos registros.
- Un `submit` no dispara además un `onClick` que también guarda.
- Navegar o cerrar el modal cancela lo que quedó en vuelo y ya no sirve.

## Regla 4 — Estados visibles

- Toda consulta a demanda muestra **cargando**, **vacío** y **error** en
  palabras del usuario, en el idioma de la app. Nunca un spinner eterno ni un
  error técnico (`500`, `TypeError`, stack).

## Regla 5 — Lo pesado carga cuando se usa

- Un modal, una pestaña o una ruta pesada se carga cuando se abre
  (`lazy`, import dinámico), no con la página principal.
- Imágenes y listas largas fuera de pantalla no se cargan hasta que se ven.

## Cómo reportar

```
Regla 1.1 — Selector de placa consulta al abrir el modal
Dónde: src/.../use-maestras-de-viaje.ts:27
Pantalla: abro «Agregar servicio» y sin tocar nada salen 3 peticiones /activos
Arreglo: habilitar la consulta al hacer clic en el selector
```

Cerrar con: cuántas reglas se incumplen, cuál arreglar primero y cuánto toma.
