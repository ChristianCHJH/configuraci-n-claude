---
name: spiderman-tonto
description: Revisa que una web (cualquier proyecto, cualquier pantalla) cumpla las reglas mínimas vitales que hasta el más tonto debería cumplir, empezando por la primera y más importante — cero llamadas innecesarias al backend, todo a demanda. Busca consultas que se disparan solas al montar una pantalla o abrir un modal, buscadores sin espera de tecleo, catálogos descargados enteros, datos que se piden dos veces, peticiones repetidas y envíos dobles; y que ninguna pantalla diga el mismo dato dos veces (información redundante), que corrige de frente; y que no se reinvente lo que el proyecto ya tiene (toast, alertas, avisos, confirmaciones, validaciones, mensajes de error, botones, tablas). Mira el código y, si la app está levantada, el panel de red y la pantalla. Reporta con archivo:línea; las reglas 1 a 5 solo se corrigen si se lo piden, la 6 se corrige sin esperar. Úsala cuando el usuario diga "spiderman tonto", "revisa las llamadas", "consume por las puras", "llama al backend sin que lo pida", "revisa el modal", "reglas mínimas de la web", "información redundante", "se repite el dato", "dice lo mismo dos veces" o invoque /spiderman-tonto, opcionalmente con una ruta, pantalla o componente.
---

# Spider-Man tonto

Las reglas que **cualquier** web tiene que cumplir. Se aplica en el proyecto
donde se invoque, sea React, Angular, Vue o lo que sea. Si el usuario da una
ruta, pantalla o componente, se revisa eso; si no, todo el frontend.

## Modo de trabajo

1. **Solo revisar.** No se toca código salvo que el usuario diga "corrige",
   "arréglalo" o equivalente después de ver el reporte. **Excepción: la
   Regla 6** (información redundante) se corrige de frente, sin pedir permiso,
   y se reporta lo que se quitó.
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

## Regla 6 — Un dato, un lugar: cero información redundante (SE CORRIGE DE FRENTE)

Una pantalla dice cada dato **una sola vez**. Si el mismo dato aparece dos o
más veces en la misma vista —aunque cambie la redacción o el formato—, sobra.
Ejemplo real: el recuadro «Próxima cuota · vence el 21/10/2026» y, debajo de
la barra de avance, «próximo vencimiento el 21 de octubre de 2026»: misma
fecha dos veces. Otro: una nota «La cuota inicial trae descontados los
S/ 300.00 de la separación» encima de la tabla cuando la fila de la cuota 0 ya
dice «S/ 300.00 vinieron de la separación».

### 6.1 Qué cuenta como redundancia

- La misma fecha, monto, estado, nombre o contador en dos bloques de la misma
  vista (recuadro de resumen + texto suelto + pie de tabla).
- Una nota o franja de ayuda que repite lo que ya dice una fila, un chip o una
  columna.
- El título dicho tres veces: barra superior + migas + `h1` + enlace de regreso
  con el mismo nombre.
- El estado como chip **y** como texto al lado; el nombre del registro en la
  cabecera **y** en la primera tarjeta debajo.
- Una columna que repite lo que dice otra (código y nombre iguales, tipo que ya
  dice el título de la sección).
- Un texto de ayuda que repite la etiqueta del campo.
- El mismo total en el resumen lateral y en el pie de la tabla de al lado.

### 6.2 Qué NO cuenta

- Un dato en el listado y en su ficha de detalle: son pantallas distintas.
- Un dato que aparece dos veces porque cada aparición sirve a una acción
  distinta (el monto en la fila y el mismo monto prellenado en el formulario
  que la fila abre).
- La etiqueta de un campo y su placeholder, si el placeholder aporta un
  ejemplo o un formato.

### 6.3 Cómo se corrige

1. **Se queda la aparición más visible o la que da más contexto** (la que está
   junto a la acción, la que el ojo lee primero). Se borra la otra entera, no
   se reescribe.
2. Si al quitar la redundancia queda un contenedor vacío (una franja, un `div`
   con padding), se quita también: no se deja una banda en blanco.
3. Se borra el código que solo alimentaba lo que se quitó (el método, el
   `computed`, el import), y se verifica que nada más lo usaba.
4. Si la redundancia viene de los **datos** (filas duplicadas en un catálogo),
   no se tapa en la pantalla: se reporta para una migración de datos.
5. Si quitar algo pierde información que **no** estaba en el otro lugar (por
   ejemplo, la línea decía también «2 cuotas vencidas» y el recuadro no), se
   avisa en el reporte qué dato desapareció y dónde podría ir.
6. Se compila y se corren las pruebas del componente tocado. Si una prueba
   afirmaba el texto quitado, se ajusta la prueba.

Reporte de la Regla 6: una línea por redundancia corregida (pantalla, qué se
repetía, qué quedó, `archivo:línea`), y aparte lo que no se corrigió y por qué.

## Regla 7 — Reutilizar antes de inventar

Si el proyecto ya tiene la pieza, se usa la pieza. Nada de un toast, una
alerta, un diálogo de confirmación, una validación o un mensaje de error
escritos a mano en una pantalla cuando ya existe uno compartido.

1. **Antes de revisar, inventariar lo que existe.** Buscar en la carpeta de
   compartidos (`compartido/`, `shared/`, `components/ui/`, `common/`) y en el
   historial (`git log -i --grep="alerta\|toast\|aviso\|confirm\|faltante"`) qué
   piezas hay: notificaciones (toast/snackbar), alertas y avisos, confirmación,
   marcado de campos faltantes, traducción del error del servidor a mensaje,
   botones, tablas, selectores con buscador, paginador, estados vacíos.
2. **Hallazgos:**
   - un `alert()`, un `MessageService`/`toast` llamado directo, un banner o un
     `div` de error armado en la plantilla, donde hay un servicio o componente
     compartido de aviso;
   - una validación de formulario propia (obligatorios, «falta completar»,
     formato de DNI, teléfono, correo, montos) que ya resuelve una pieza
     compartida o un validador existente;
   - el mensaje de error del servidor leído a mano (`err.error.message`) donde
     hay una función que lo traduce;
   - una copia de estilos de un componente compartido (botón, chip, tabla) en
     vez de usarlo;
   - dos componentes nuevos que hacen lo mismo que uno que ya existe.
3. **Cómo se reporta:** qué se reinventó, qué pieza existente lo cubre
   (`archivo`) y el cambio en una línea. Si la pieza existente no alcanza, se
   dice qué le falta: se extiende la compartida, no se crea otra paralela.
4. **El texto de validación sigue a la regla del servidor.** Si la pantalla
   dice «entre 6 y 15 dígitos» y el servidor exige otra cosa, es hallazgo: el
   mensaje y la regla salen del mismo lugar.

## Cómo reportar

```
Regla 1.1 — Selector de placa consulta al abrir el modal
Dónde: src/.../use-maestras-de-viaje.ts:27
Pantalla: abro «Agregar servicio» y sin tocar nada salen 3 peticiones /activos
Arreglo: habilitar la consulta al hacer clic en el selector
```

Cerrar con: cuántas reglas se incumplen, cuál arreglar primero y cuánto toma.
