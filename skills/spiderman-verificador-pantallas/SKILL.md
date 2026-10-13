---
name: spiderman-verificador-pantallas
description: Recorre las pantallas de una app web levantada (con Playwright, en varios tamaños de ventana) y reporta los errores visuales y de uso que una revisión de código no ve — desproporciones, contenido cortado, scroll dentro de scroll, páginas que no bajan, listas sin paginación, pantallas que se deforman al achicarse, tablas que no pasan a tarjetas en celular y tablet, cosas repetidas o ilógicas, y la navegación de regreso (que «volver», «Cancelar» y el Atrás del navegador lleven a la pantalla de la que se vino y no a otra). SOLO REPORTA, nunca modifica código. Úsala cuando el usuario diga "revisa las pantallas", "verifica la pantalla", "busca errores visuales", "¿se ve bien?", "revisa el responsive", "revisa la navegación", "el botón atrás no regresa", "no vuelve a donde estaba" o invoque /spiderman-verificador-pantallas, opcionalmente con una URL o ruta.
---

# Spider-Man verificador de pantallas

Revisa **la pantalla ya construida**, no el código. Abre la app en el
navegador, la mide en varios anchos y escribe un reporte de lo que está mal.

## Regla de oro: solo mirar

- **No se modifica ningún archivo del proyecto.** Ni un arreglo "rápido". El
  entregable es el reporte; el arreglo lo decide el usuario después.
- **No se envía ningún formulario** ni se pulsa nada que guarde, apruebe,
  rechace o elimine. Sí se puede escribir en un campo, abrir un menú, cambiar
  de pestaña, abrir un diálogo y cerrarlo sin confirmar, pulsar **Cancelar**,
  los enlaces **«← …»** y el **Atrás** del navegador: ninguno guarda nada.
- Si una pantalla necesita datos para verse mal (cinco lotes, una lista
  larga), se busca un registro que ya los tenga. No se crean datos.

## Las cuatro reglas que se revisan

### Regla A — Desproporción y responsive

1. **Espacio desperdiciado**: un panel con scroll interno o altura fija
   mientras sobra espacio libre al lado o debajo.
2. **Columnas aplastadas**: texto partido palabra por palabra
   (`Mz. / J1 / · Lote / 9`) porque su columna quedó angosta y otra se come
   el ancho.
3. **Contenido cortado**: una columna, botón o texto que se ve a medias
   (`Qui` en vez de `Quitar`) porque el contenedor lo recorta.
4. **Se deforma al achicar**: la pantalla sale de la ventana por la derecha,
   se encima, o el diseño no se reacomoda en tablet ni celular.
5. **Proporción rara**: un campo gigante para un dato corto, una tarjeta
   enorme con dos líneas, alturas desparejas entre elementos hermanos.

### Regla B — Scroll y paginación

1. **Scroll dentro de scroll**: un contenedor con barra propia dentro de otro
   que también tiene barra (o dentro de la página que ya baja).
2. **No se puede bajar**: contenido por debajo del borde de la ventana sin
   ninguna forma de llegar a él.
3. **Scroll horizontal de la página entera**: siempre es un error.
4. **Listas sin paginar**: más de 50 filas cargadas de golpe sin paginador,
   o una tabla que crece sin límite.
5. **El último elemento no se alcanza**: al bajar del todo, el botón final o
   la última fila quedan tapados (por una barra fija, un pie, etc.).

### Regla C — Navegación de regreso («de dónde vengo»)

En diseño de interfaces se llama **navegación de regreso** (*back
navigation*); la línea `Clientes / CESAR ABAD` de arriba es la **miga de pan**
(*breadcrumb*). La regla: **volver lleva a la pantalla de la que se vino, no a
una pantalla fija.** Si entré al contrato desde la ficha del cliente, volver me
deja en la ficha del cliente, no en la lista de contratos.

1. **Volver va a otra pantalla**: el «←», la miga o el Cancelar llevan a una
   pantalla fija (la lista del módulo) aunque se haya entrado desde otra.
   Se prueba **por cada entrada distinta** a la pantalla, no una sola vez.
2. **El regreso no nombra el origen**: dice «← Contratos» cuando se vino del
   cliente. Tiene que decir a dónde va a llevar («← CESAR ABAD ABAD»).
3. **Atrás del navegador en bucle**: después de volver, el Atrás del navegador
   regresa a la pantalla que se acaba de dejar (ida y vuelta infinita) en vez
   de seguir hacia la anterior.
4. **El formulario queda en el historial**: después de Cancelar (o de guardar),
   el Atrás del navegador reabre el formulario.
5. **El origen se pierde a mitad de camino**: al cambiar de pestaña dentro de
   la ficha, o al recargar la página, el regreso vuelve a la pantalla fija.
6. **El acceso no se nota**: la única forma de abrir el detalle es un texto
   enlazado que parece un dato (un número de contrato en gris). Debe haber un
   botón o enlace visible («Ver contrato»), como en las otras tablas.

### Regla D — Responsivo: celular y tablet

La pantalla tiene que **usarse** en celular (390) y tablet (768 y 1024), no
solo no romperse. Lo que se decide acá es el estándar que ya se aplicó en
`inmobiliaria-sistema` (rama `feat/pantallas-responsivas`):

1. **Tabla con scroll horizontal propio** en celular o tablet: error. Por
   debajo del ancho donde la tabla ya no cabe, cada fila pasa a **tarjeta**
   (una columna en celular, dos en tablet) con la etiqueta de cada dato. En
   `inmobiliaria-sistema` se hace con `TABLA_APILABLE_EN_CELULAR`,
   `TABLA_APILABLE_HASTA_ESCRITORIO` (tarjetas bajo 1024) o
   `TABLA_APILABLE_HASTA_PANTALLA_ANCHA` (tarjetas bajo 1280), de
   `compartido/tabla-apilable.ts`.
2. **Tabla que se muestra como tabla y aun así se desplaza de lado**: error.
   Su ancho mínimo tiene que caber en el ancho útil de ese tamaño. Ojo: a
   1280 el menú lateral se abre y deja **menos** espacio que a 1024.
3. **Lista y detalle lado a lado** (bandejas por validar): donde no caben las
   dos, se muestra una u otra con un botón para volver a la lista. El detalle
   que aparece debajo de la lista, fuera de vista, es error.
4. **Control cortado**: pestañas, controles segmentados o filas de botones que
   dejan una opción a medias (`Yap` en vez de `Yape`). Se parten en líneas o
   se desplazan con una señal visible de que hay más.
5. **Dato partido sin sentido**: correo o código partido letra por letra, o un
   monto con `S/` arriba y el número abajo. Un correo se parte en la `@`; un
   monto, una fecha o un código no se parten.
6. **Hueco entre tarjetas** porque una grilla de alto fijo estira sus filas.
7. **Menú lateral en celular**: se abre como cajón y se cierra; nunca tapa la
   pantalla sin forma de cerrarlo.

Qué pantallas se miran con datos: si una tabla está vacía, el apilado no se ve;
se busca un registro que la llene (regla de oro: no se crean datos). La que
queda sin datos se anota como **no probada con datos**.

### Además, al pasar — redundante o ilógico

Solo lo que salte a la vista mientras se revisan A, B y D, sin buscarlo aparte:
título que contradice a la miga (`Separar un lote` vs `Separar 5 lotes`),
botones o títulos repetidos, la misma información mostrada dos veces en la
misma vista, un botón activo que no puede hacer nada, un texto que no se
entiende.

## Pasos

### 1. Qué pantallas y dónde

- Si el usuario dio una URL o ruta, esa. Si no, preguntar una sola vez cuáles;
  "todas" significa leer las rutas del frontend (`*.rutas.ts`,
  `app.routes.ts`, `router/`) y armar la lista.
- La URL base: la que el usuario diga, o la del proyecto levantado
  (en `inmobiliaria-sistema` es `http://127.0.0.1:8380`). Si no responde,
  pedir que levante la app y parar.
- Si redirige al login: buscar credenciales de demo en la documentación o la
  semilla del proyecto; si no hay, pedirlas. No inventar.

### 2. Recorrer cada pantalla en cinco anchos

| Nombre | Ventana |
| --- | --- |
| Escritorio grande | 1920 × 1080 |
| Laptop | 1366 × 768 |
| Tablet horizontal | 1024 × 768 |
| Tablet vertical | 768 × 1024 |
| Celular | 390 × 844 |

Por cada pantalla y cada ancho, con las herramientas `mcp__playwright__*`:

1. `browser_resize` al ancho y `browser_navigate` a la ruta (o recargar).
2. `browser_wait_for` hasta que desaparezca el cargando.
3. `browser_evaluate` con el contenido de [sonda.js](sonda.js) (leer el
   archivo y pasarlo entero como función). Devuelve medidas, no opiniones.
4. `browser_take_screenshot` de la ventana visible, guardada como
   `<pantalla>-<ancho>.png` en la carpeta del reporte.
5. Bajar hasta el fondo (`browser_press_key` `End`, o scroll dentro del
   contenedor principal) y otra captura si cambia algo: así se ve la regla
   B.5.
6. Mirar la captura **uno mismo**. La sonda encuentra candidatos; la captura
   confirma. Un hallazgo sin captura que lo muestre no entra al reporte.

### 2b. Recorrer la navegación de regreso (regla C)

Una sola vez, en el ancho de laptop (1366 × 768); no hace falta en los cinco.

1. **Mapa de entradas.** Por cada pantalla de detalle o formulario, listar
   **todas** las pantallas que llevan a ella: buscar en el frontend los
   enlaces y navegaciones hacia su ruta (`routerLink`, `router.navigate`,
   `href`). Una pantalla con tres entradas son tres recorridos.
2. **Un recorrido por entrada.** Copiar [recorrido-de-regreso.js](recorrido-de-regreso.js),
   llenar `BASE` y `RECORRIDOS` (origen, qué se pulsa para entrar, ruta de
   destino, qué se pulsa para volver, texto esperado) y pasarlo entero a
   `browser_run_code_unsafe`. Por cada recorrido entra desde una antesala,
   vuelve, y pulsa Atrás del navegador: detecta C.1, C.2 y C.3.
3. **A mano**, lo que el script no cubre: cambiar de pestaña dentro de la
   ficha y recargar (`location.reload()`) antes de volver (C.5); pulsar
   Cancelar en cada formulario y después Atrás del navegador (C.4); mirar si
   el acceso al detalle se distingue a simple vista (C.6).
4. **Lo que no se puede probar sin guardar** (el Atrás después de guardar un
   formulario) se revisa en el código: tras guardar, la navegación debe
   reemplazar el formulario en el historial (`replaceUrl: true` o el
   mecanismo del proyecto). Se reporta como «verificado en código», nunca como
   probado en pantalla.
5. Si no hay datos para una entrada (no hay separaciones, no hay contrato sin
   firmar), se anota como **no probada** en el reporte, con el motivo. No se
   crean datos para probarla.

En `inmobiliaria-sistema` el mecanismo ya existe y toda pantalla nueva debe
usarlo: `RegresoService` (`desdeAqui`, `volver`, `irTrasGuardar`,
`cambiarRutaSinPerderElOrigen`), `<app-regreso>` para la miga y
`<app-boton-de-regreso>` para las pantallas de «no encontrado». Una pantalla
que vuelve con un `routerLink` fijo a su lista, sin pasar por él, es hallazgo
C.1 aunque hoy tenga una sola entrada.

### 3. Leer la sonda con criterio

| Campo de la sonda | Regla | Cuándo NO es error |
| --- | --- | --- |
| `scrollDentroDeScroll` | B.1 | Un menú desplegable o un diálogo con lista larga |
| `scrollConEspacioLibre` | A.1 | Nunca: si sobra espacio, la altura fija sobra |
| `recortados` | A.3 | Un carrusel, una animación, un `truncate` con `title` |
| `textoAplastado` | A.2 | Casi nunca |
| `desbordeHorizontalDePagina`, `salenPorLaDerecha` | A.4, B.3 | Nunca |
| `inalcanzables`, `paginaBloqueada` | B.2 | Un diálogo cerrado que sigue en el DOM |
| `listasLargasSinPaginar` | B.4 | Un catálogo corto fijo (estados, tipos) |
| `titulos` vs `ultimaMiga`, `*Repetidos` | Además | Botones repetidos por fila de una tabla |
| Línea `FALLA` de `recorrido-de-regreso.js` | C.1–C.3 | Pantalla con una sola entrada posible y regreso a su padre natural |
| `tablasConScrollHorizontal` | D.1, D.2 | Nunca en 390, 768, 1024 ni 1280 |
| `controlesConScrollHorizontal` | D.4 | Una tira de pestañas que se desplaza y lo muestra |
| `datosPartidos` | D.5 | Un texto largo de verdad (dirección, observación) |

### 4. Escribir el reporte

Carpeta: `.revision-pantallas/AAAA-MM-DD-HHmm/` en la raíz del proyecto, con
`REPORTE.md` y las capturas. Si la carpeta no está en `.gitignore`, decirlo
al final — no editar el `.gitignore`.

```markdown
# Revisión de pantallas — AAAA-MM-DD

| # | Severidad | Pantalla | Ancho | Regla | Qué pasa |
| --- | --- | --- | --- | --- | --- |
| 1 | Alta | /separaciones/nueva | 1920 | B.1 | Lista de lotes con scroll dentro del panel que también baja |
| 2 | Alta | /contratos/:id desde /clientes/:id/lotes | 1366 | C.1 | «← Contratos» lleva a la lista y no al cliente del que se vino |

## 1. Scroll dentro de scroll en «Los lotes»

- **Dónde**: /separaciones/nueva, 1920 × 1080 y 1366 × 768
- **Qué se ve**: la lista muestra 4 de 5 lotes con barra propia, y el panel
  entero tiene otra barra, con 400 px libres debajo.
- **Evidencia**: ![](separaciones-nueva-1920.png) · sonda:
  `div.max-h-64.overflow-y-auto`, 180 px ocultos, 420 px libres debajo.
- **Sugerencia** (no aplicada): quitar la altura máxima de la lista y dejar
  que el panel use el alto de la ventana.
```

Severidad:

- **Bloqueante**: no se puede usar — un botón inalcanzable, datos que no se
  pueden ver de ninguna forma.
- **Alta**: se usa con esfuerzo — scroll anidado, columna cortada, texto
  aplastado ilegible, volver que lleva a otra pantalla (C.1, C.3, C.4).
- **Media**: se ve mal pero se entiende — espacio desperdiciado,
  desproporción, regreso que no nombra el origen o lo pierde (C.2, C.5),
  acceso al detalle que no se nota (C.6).
- **Baja**: detalle — repetido, texto confuso, miga que no coincide.

Orden: severidad, luego pantalla. Un mismo defecto en varios anchos es **un**
hallazgo con la lista de anchos, no cinco. En la regla C, el ancho es siempre
1366 y la columna «Pantalla» dice `destino desde origen`.

El reporte cierra con la tabla de **recorridos de regreso**: cada entrada
probada con OK / FALLA, y las no probadas con su motivo.

### 5. Responder en el chat

Corto: la ruta del `REPORTE.md`, cuántos hallazgos por severidad y los tres
más graves en una línea cada uno. Cerrar ofreciendo arreglar uno concreto
("¿Arreglo el #1?"). No pegar el reporte en el chat.
