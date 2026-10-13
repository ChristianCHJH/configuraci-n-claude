# Reglas de crítica UX

Son **criterios de experto, no un checklist que se tilda**, y sirven para
cualquier interfaz: un panel interno, una tienda, un sitio público, una app.
Cada regla dice qué mirar, cómo se ve en una captura y cuándo **no** es
problema. El juicio gana a la letra: si una regla no aplica a esta pantalla, no
se fuerza; si algo daña la tarea y no está aquí, igual es hallazgo (se ata al
principio más cercano).

Algunas reglas dicen **Perfiles:**. Fuera de esos perfiles se miran solo si
la pantalla lo pide (una tienda dentro de un sistema interno sigue siendo una
compra).

Cada regla pertenece a una **dimensión** de la rúbrica ([rubrica.md](rubrica.md)).
El código de la regla (`EF-3`) va en el campo `principio` del hallazgo junto al
principio de origen: `EF-3 · Ley de Fitts`.

**Piso**: severidad mínima cuando la regla se cumple de verdad. Es un piso, no
una sentencia: se puede subir; bajarlo exige escribir por qué en el hallazgo.

---

## EF — Eficiencia de la tarea principal

La pregunta: **¿cuánto le cuesta al usuario la tarea por la que vino?** En
una herramienta de uso diario es la tarea que repite todo el día; en un sitio
público, lo que trae al visitante (comprar, contactar, encontrar un dato).

- **EF-1 · Pasos por tarea repetida.** Contar las interacciones de la tarea
  principal, desde que llega a la pantalla hasta terminarla. Señal: más de 3–4
  para algo que se hace seguido o que es el motivo de la visita; modal →
  elegir → confirmar → cerrar para un cambio de un dato.
  *No es problema*: tareas raras o de alto riesgo donde la fricción protege.
  *Fuente*: Bastien & Scapin (brevedad, acciones mínimas); NN/g, aplicaciones complejas.
- **EF-2 · Trabajo sobre varias filas.** La misma acción se repite fila por fila
  sin selección múltiple ni acción por lote.
  *No es problema*: cuando el proyecto la quitó a propósito. **Buscar la
  decisión antes de sugerirla** (ADR, DECISIONS.md, GAPS.md).
  *Fuente*: NN/g, data tables; Nielsen H7.
- **EF-3 · Objetivo frecuente chico o lejos.** Botón de uso constante de menos
  de 32 px de alto, o al otro extremo de donde está la atención (acción de fila
  pegada al borde derecho en 1920 px).
  *No es problema*: acciones raras. *Fuente*: Ley de Fitts.
- **EF-4 · Teclado.** La tarea principal se puede hacer con teclado: Tab llega
  a todo en orden lógico, Enter activa, Esc cierra el diálogo y el foco vuelve
  a donde estaba. Lo que se repite mucho tiene atajo.
  *Fuente*: Nielsen H7; NN/g, flexibility and efficiency.
- **EF-5 · Densidad útil.** Cuánto de lo que importa entra en la primera vista
  del ancho de trabajo. Señal: cabeceras enormes, tarjetas de cifras
  decorativas o márgenes que empujan lo útil fuera de la vista.
  *No es problema*: en herramientas de uso intensivo, la densidad alta en sí.
  **Ahí nunca se pide «más aire»**: un usuario experto lee mejor una pantalla
  densa. En sitios públicos y de primer uso el riesgo es el contrario: ver
  JE-7.
  *Fuente*: Matthew Ström, UI density; caso «Whitespace killed an enterprise app» (HN).
- **EF-6 · El contexto se conserva.** Al volver del detalle siguen los filtros,
  el orden, la página y la posición. La URL refleja los filtros.
  *Fuente*: Vercel Web Interface Guidelines; NN/g, filters.
- **EF-7 · Valores por defecto.** El formulario llega con lo predecible ya
  puesto (sede del usuario, fecha de hoy, lo usado la última vez).
  *Fuente*: Nielsen H5; Tesler (la complejidad la absorbe el sistema).
- **EF-8 · Buscador a la vista.** *Perfiles: pública, compra, consulta.* Un
  sitio con mucho contenido o un catálogo muestra una caja de búsqueda abierta
  arriba, no solo la lupa, de unos 27 caracteres de ancho. La sonda lo resume
  en `buscador`.
  *No es problema*: sitios de pocas páginas.
  *Fuente*: NN/g, search visible and simple (la caja visible subió el uso 91 %).
- **EF-9 · Bienvenida que estorba.** *Perfiles: primer uso, app móvil.*
  Tutorial de 4 o 5 pantallas sin «Omitir», marcas de ayuda superpuestas que
  tapan la interfaz, o pedir calificación o compra antes de usar.
  *No es problema*: cuando recoge datos imprescindibles o explica una función
  nueva de verdad, de a una y en contexto.
  *Fuente*: NN/g, mobile app onboarding; Apple HIG, onboarding.

## ES — Estado y respuesta del sistema

La pregunta: **¿el usuario sabe siempre qué pasa, dónde está y qué cambió?**

- **ES-1 · Dónde estoy.** Título de la pantalla, ítem del menú marcado, miga
  que coincide con el título.
- **ES-2 · Filtros a la vista.** Se ve qué filtros están aplicados, cuántos
  resultados hay y cómo limpiarlos, sin abrir un panel.
  *Piso*: Media si un filtro activo esconde filas sin decirlo.
  *Fuente*: NN/g, data tables y filters.
- **ES-3 · Carga.** Mientras carga se dice que carga: nunca «Sin registros»
  durante la espera. Menos de 1 s, nada; de 2 a 10 s, indicador; más de 10 s o
  por lotes, progreso («3 de 50»). El botón que envía muestra que trabaja y no
  admite doble clic.
  *Fuente*: NN/g, response times y progress indicators; Doherty.
- **ES-4 · Vacío.** Distingue «no hay datos» de «el filtro no encontró nada» y
  dice qué hacer en cada caso.
  *Fuente*: NN/g, empty states.
- **ES-5 · Confirmación de lo hecho.** Tras guardar o asignar se ve qué cambió:
  aviso específico («Viaje asignado a J. Pérez») y la fila actualizada.
  Casi siempre es **no probado** (probarlo exige guardar): se revisa en el
  código y se dice así.
  *Fuente*: Shneiderman, cerrar el diálogo.
- **ES-6 · La fila en la que trabajo.** La fila con el cursor o abierta en el
  detalle queda marcada; al volver se reconoce cuál era.
- **ES-7 · Lo urgente se ve sin leer.** Vencido, fuera de plazo, rechazado o
  bloqueado se distinguen de un vistazo, con texto o ícono además del color, y
  con el dato ya calculado («vence en 2 h» en vez de una fecha para restar).
  *Piso*: Alta cuando lo urgente es la razón de ser de la pantalla.
  *Fuente*: Gerhardt-Powals (fusionar datos); Von Restorff; WCAG 1.4.1.

## ER — Prevención y recuperación de errores

La pregunta: **¿qué tan fácil es equivocarse, y qué tan caro sale?**

- **ER-1 · Destructivo o irreversible.** Quitar, anular o enviar a un tercero
  pide confirmación **que nombra qué y cuántos** («Quitar 3 viajes de la cita
  4521»), con botón-verbo y sin «Sí» por defecto; o permite deshacer.
  *Piso*: Alta si no hay confirmación ni deshacer.
  *No es problema*: acciones triviales y reversibles (confirmar todo entrena a
  pulsar sin leer). *Fuente*: NN/g, confirmation dialogs; Nielsen H5.
- **ER-2 · Separación.** La acción destructiva no está pegada a la frecuente ni
  tiene su mismo estilo.
- **ER-3 · Entrada acotada.** Lista cerrada → selector; fecha → selector de
  fecha; formato esperado dicho antes de escribir; el ancho del campo sugiere
  el largo del dato.
  *Fuente*: Adam Silver, Form design; Baymard.
- **ER-4 · Validación.** En el campo, al salir de él (no mientras se escribe),
  con el mensaje junto al campo que **nombra el problema exacto** («El correo
  necesita una @», no «Revise los campos» ni un borde rojo sin texto). Al
  enviar, un resumen de errores arriba con enlace a cada campo. Lo escrito no
  se borra y el error se va al corregir.
  *Fuente*: Wroblewski, inline validation (+22 % de éxito); Adam Silver;
  Baymard, mensajes de error adaptativos; GOV.UK, error summary.
- **ER-5 · Mensaje de error.** En español llano, dice qué pasó y cómo salir,
  sin códigos ni culpar a la persona.
  *Piso*: Alta si el error no dice cómo seguir.
  *Fuente*: Nielsen H9; NN/g, error message guidelines.
- **ER-6 · Otra persona llegó antes.** Si alguien cambió el registro mientras
  tanto, el mensaje lo dice y ofrece recargar, sin pisar el trabajo ajeno.
- **ER-7 · Salida siempre.** Todo diálogo tiene Cancelar, × y Esc. Cerrar con
  datos escritos avisa antes de perderlos.
  *Fuente*: Nielsen H3.
- **ER-8 · Botón apagado sin motivo.** Un botón deshabilitado que no dice qué
  falta para activarlo.
  *No es problema*: cuando al lado se ve qué falta. *Fuente*: Adam Silver.
- **ER-9 · Búsqueda sin resultados.** Dice que no hubo resultados, repite la
  consulta, deja el texto en la caja para corregirlo y ofrece salidas:
  ortografía, categorías, lo más buscado, contacto. Sin chistes.
  *Piso*: Alta en una tienda: un callejón sin salida es una venta perdida.
  *Fuente*: NN/g, search no results; Baymard, no results page.

## JE — Jerarquía y lectura rápida

La pregunta: **¿el ojo llega primero a lo que importa?**

- **JE-1 · Una acción principal.** Un solo botón relleno destacado por vista;
  las secundarias con borde, las terciarias como texto. La sonda lo cuenta en
  `botonesDeColor`.
  *No es problema*: el mismo botón repetido en cada fila de una tabla.
  *Fuente*: Refactoring UI; Ley de Hick.
- **JE-2 · Orden por importancia.** Las columnas y bloques van por importancia
  para la tarea. La primera columna identifica la fila con algo legible por una
  persona, nunca con un GUID.
  *Fuente*: NN/g, data tables.
- **JE-3 · Tabla que se escanea.** Encabezado fijo si la tabla es más alta que
  la ventana; números alineados a la derecha con cifras de ancho fijo; filas
  distinguibles (línea, cebra o resalte al pasar); el dato con más peso que su
  etiqueta. La sonda lo mide en `tablas`.
- **JE-4 · Grupos que se leen como grupos.** Etiqueta pegada a su campo; lo
  relacionado junto; separación clara entre bloques.
  *Fuente*: Gestalt, proximidad y región común.
- **JE-5 · Ruido.** Decoración, íconos de adorno junto a cifras, tarjetas de
  números sin meta ni comparación, gráficos que no ayudan a decidir.
  *Fuente*: Nielsen H8; Stephen Few, errores de dashboards.
- **JE-6 · Énfasis inflado.** Si todo es rojo, negrita o etiqueta, nada destaca.
- **JE-7 · Primer vistazo.** *Perfiles: pública, compra, primer uso.* Sin
  hacer scroll, en el ancho de trabajo, se entiende **qué es, para quién y qué
  hacer**: una frase concreta y de 1 a 4 entradas a las tareas principales.
  Señal: un eslogan abstracto («Impulsamos tu futuro») sobre una foto de stock
  y ningún llamado a la acción; o diez ofertas compitiendo.
  *No es problema*: marcas que todo el mundo conoce; páginas internas profundas.
  *Fuente*: NN/g, homepage usability y cuánto se quedan los usuarios (se
  deciden en unos 10 segundos).
- **JE-8 · Texto que se escanea.** *Perfiles: pública, compra, primer uso.*
  Subtítulos que se distinguen y dan la idea en sus dos primeras palabras, lo
  importante en los primeros párrafos, listas en vez de bloques largos, enlaces
  que dicen a dónde llevan. La sonda cuenta `enlacesVagos` («Leer más», «Clic
  aquí» repetidos).
  *No es problema*: lectura comprometida (un artículo largo que se lee entero).
  *Fuente*: NN/g, patrón F y layer-cake.

## CA — Carga mental y reconocimiento

La pregunta: **¿qué tiene que recordar o calcular el usuario por su cuenta?**

- **CA-1 · Reconocer, no recordar.** Lo que se necesita para decidir está a la
  vista; nadie tiene que acordarse de un código visto en otra pantalla.
  *Fuente*: Nielsen H6.
- **CA-2 · Botones de solo ícono.** Acciones que no son universales (× cerrar,
  lupa buscar) sin texto visible: el usuario adivina.
  *Fuente*: Nielsen H6; NN/g, icon usability.
- **CA-3 · El sistema calcula.** El usuario no resta fechas, suma pesos ni
  compara contra el plazo de cabeza: el dato llega calculado.
  *Fuente*: Gerhardt-Powals; Tesler.
- **CA-4 · Demasiadas opciones a la vez.** Más de ~7 opciones planas sin
  agrupar en un punto de decisión, o un formulario con todos los campos
  opcionales a la vista.
  *Fuente*: Ley de Hick; revelado progresivo.
- **CA-5 · Truncado sin salida.** Texto cortado con «…» sin forma de leerlo
  completo. La sonda lo lista en `textoTruncado`.
  *Piso*: Alta si el dato cortado se usa para decidir.
- **CA-6 · Etiqueta visible.** El placeholder no es etiqueta: desaparece al
  escribir. La etiqueta va arriba del campo, y obligatorios u opcionales se
  marcan de una sola forma en todo el formulario. La sonda lo marca en `camposSinEtiqueta` con `soloPlaceholder`.
  *Fuente*: Baymard; WCAG 3.3.2.
- **CA-7 · Navegación a la vista.** En escritorio, el menú principal visible,
  no escondido en una hamburguesa; en celular, visible si son 4 enlaces o
  menos.
  *Fuente*: NN/g, hamburger menus (escondido se usó 27 % de las veces contra
  48–50 % visible, y las tareas fueron más lentas).
- **CA-8 · Menús que orientan.** El menú marca dónde está la persona; los
  submenús se anuncian con una flecha y se abren con clic, no con hover; sin
  cascadas de varios niveles.
  *Fuente*: NN/g, menu design.

## CO — Consistencia y convenciones

La pregunta: **¿lo que se parece se comporta igual, en esta pantalla y en las demás?**

- **CO-1 · Mismo nombre, misma acción.** Un verbo por acción en todo el
  sistema; dos nombres para lo mismo es hallazgo.
- **CO-2 · Mismo componente, mismo aspecto.** Alturas de botón, radios,
  tamaños de letra y colores salen del sistema de diseño del proyecto. La
  sonda resume `formaDeBotones` y `tipografia`.
- **CO-3 · Mismo patrón de edición.** Cosas equivalentes no se editan una en
  modal, otra en línea y otra en página aparte.
- **CO-4 · Convenciones.** Cerrar, guardar y buscar donde la gente los busca;
  casilla para elegir, interruptor para encender.
  *Fuente*: Ley de Jakob.
- **CO-5 · Color con significado fijo.** Rojo es peligro, error o vencido;
  verde es correcto.
  *Piso*: Alta si un color contradice su significado (rojo en una acción normal,
  verde en un error).
- **CO-6 · Formatos uniformes.** Fechas, horas, montos y unidades se escriben
  igual en toda la pantalla.

## LE — Lenguaje del usuario

La pregunta: **¿la pantalla habla como habla quien la usa?**

- **LE-1 · Vocabulario del usuario.** Las palabras de quien la usa (del
  negocio, si es interna; del público, si es abierta), no nombres de columna,
  jerga técnica ni la jerga interna de la empresa.
  *Fuente*: Nielsen H2.
- **LE-2 · Fugas técnicas.** `undefined`, `null`, `NaN`, GUID, códigos de enum
  (`SERVICIO_YA_CAMBIO`), fechas ISO crudas o textos en inglés. La sonda los
  lista en `fugas`.
  *Piso*: Media; Alta si aparece en un dato que se usa para decidir.
- **LE-3 · Botones con verbo.** «Asignar viaje», no «Aceptar» ni «OK». La
  confirmación nombra el objeto.
- **LE-4 · Ayuda donde hace falta.** Un campo difícil lleva una línea de ayuda
  visible bajo el campo.
- **LE-5 · Ortografía y estilo.** Tildes, mayúscula solo al inicio, el mismo
  tono en toda la pantalla.

## CF — Confianza y transparencia

*Perfiles: pública, compra, primer uso, app móvil, y cualquier pantalla que
pida dinero, datos personales o un compromiso.*

La pregunta: **¿la persona sabe con quién trata, cuánto le va a costar y qué
está aceptando?**

- **CF-1 · Quién está detrás.** Organización real a la vista (dirección,
  contacto fácil), autor con nombre y fecha en el contenido que lo pide, y
  cero descuido: errores de tipeo, enlaces o imágenes rotas.
  *Fuente*: Stanford Web Credibility Guidelines.
- **CF-2 · Precio a la vista.** El costo base y los cargos extra se ven antes
  de pedir datos o pago; el precio no está escondido detrás de un formulario.
  *No es problema*: servicios a medida que al menos muestran un rango.
  *Fuente*: NN/g, trustworthy design.
- **CF-3 · Envío y total sin sorpresas.** La ficha de producto da el costo de
  envío (mínimo, estimado o rango) y el paso de pago muestra el total completo
  con envío, impuestos y cargos.
  *Piso*: Alta si un cargo aparece recién al final.
  *Fuente*: Baymard (los costos extra son la primera causa de abandono, 40 %;
  el 64 % busca el envío en la ficha).
- **CF-4 · Sin muro de cuenta.** Comprar como invitado está a la vista, no
  escondido bajo el inicio de sesión; crear cuenta se ofrece al final. Nada
  exige registrarse antes de mostrar lo que ofrece.
  *No es problema*: servicios privados por naturaleza (banca, correo).
  *Fuente*: Baymard, guest checkout (exigir cuenta: 18 % de abandono); NN/g,
  login walls.
- **CF-5 · Pedir lo justo.** Solo los datos necesarios: a un checkout le
  alcanzan unos 8 campos y el promedio ronda 11. Señales de exceso: nombre
  partido en dos campos, «Dirección 2» o cupón abiertos por defecto,
  facturación separada del envío por defecto.
  *Fuente*: Baymard, checkout form fields.
- **CF-6 · Permisos en su momento.** Ubicación, notificaciones o cámara se
  piden al usar la función y con un motivo concreto, no al abrir la app ni
  «para una mejor experiencia».
  *Fuente*: Apple HIG, privacy.
- **CF-7 · Patrones engañosos.** Diseño que empuja a la persona contra su
  propio interés. Se reconocen en la captura:
  - **avergonzar al que rechaza**: «No, prefiero pagar más»;
  - **preselección**: casilla marcada de seguro, boletín o donación, o un
    producto agregado solo al carrito (la sonda lista `casillasPremarcadas`);
  - **urgencia o escasez falsas**: un contador que se reinicia al recargar,
    «solo quedan 2» igual en todos los productos;
  - **botones desparejos**: «Aceptar» grande y de color frente a «Rechazar»
    como enlace gris, o condiciones en texto de bajo contraste;
  - **redacción trampa**: dobles negaciones, casillas que alternan aceptar y
    rechazar;
  - **difícil de cancelar**: alta en un clic, baja por teléfono o con el
    enlace escondido;
  - **insistencia**: un aviso que vuelve después de rechazarlo; publicidad
    disfrazada de contenido.

  *Piso*: Alta; Bloqueante si cobra algo que la persona no eligió.
  *No es problema*: la jerarquía normal entre acción principal y secundaria
  (Guardar / Cancelar); un valor por defecto sin costo y a favor de la persona
  (facturación igual al envío); una urgencia real y verificable.
  *Fuente*: deceptive.design; Ley de Servicios Digitales de la UE, art. 25;
  Reino Unido, CCR 2013 reg. 40 (una casilla premarcada no es consentimiento).

## AC — Accesibilidad verificable (WCAG 2.2 AA)

Solo lo que se mide en la pantalla o en el DOM; el resto va a «no probado».

- **AC-1 · Contraste de texto.** 4.5:1, o 3:1 en texto grande (24 px, o 18.66
  px en negrita). Medido por la sonda en `contrasteBajo`; si `fondoIncierto` es
  true, se confirma mirando la captura.
  *Piso*: Alta en texto que se lee para trabajar; Media en texto accesorio.
  *Fuente*: WCAG 1.4.3.
- **AC-2 · Contraste de lo que no es texto.** Bordes de campos, íconos con
  significado y anillo de foco a 3:1 contra el fondo. *Fuente*: WCAG 1.4.11.
- **AC-3 · No solo color.** Un estado comunicado solo con color, sin texto ni
  ícono.
  *Piso*: Alta. *Fuente*: WCAG 1.4.1.
- **AC-4 · Tamaño de objetivo.** 24 × 24 px como mínimo, o separado lo
  suficiente (`objetivosChicos` ya aplica la excepción del espaciado).
  *Fuente*: WCAG 2.5.8.
- **AC-5 · Foco visible.** Al tabular se ve dónde está el foco, y ninguna barra
  fija lo tapa (`recorrido-teclado.js`).
  *Piso*: Alta si el foco no se ve. *Fuente*: WCAG 2.4.7 y 2.4.11.
- **AC-6 · Nombre de los controles.** Botón de ícono sin nombre accesible;
  campo sin etiqueta asociada (`botonesSinNombre`, `camposSinEtiqueta`).
  *Piso*: Alta. *Fuente*: WCAG 4.1.2 y 1.3.1.
- **AC-7 · Letra legible.** Datos de trabajo por debajo de 12 px
  (`textoMuyChico`). No es criterio WCAG: es legibilidad en lectura sostenida.
- **AC-8 · Movimiento que no se detiene.** Carrusel o animación que avanza
  sola más de 5 segundos sin forma de pausarla.
  *Fuente*: WCAG 2.2.2; NN/g, auto-forwarding.

## AD — Adaptación al dispositivo

Cuenta cuando la pantalla se usa de verdad en tablet o celular; si no, la
dimensión va «fuera» con su motivo. El detalle mecánico del responsive (scroll
anidado, tablas que pasan a tarjetas, controles cortados) lo revisa
`spiderman-verificador-pantallas`: aquí se califica el resultado, no se repite
el recorrido.

- **AD-1 · Sin scroll horizontal de página** en ningún ancho, ni a 320 px.
  *No es problema*: tablas de datos, mapas y barras de herramientas.
  *Fuente*: WCAG 1.4.10.
- **AD-2 · Tabla que se usa en celular** pasa a tarjetas con etiqueta por dato.
- **AD-3 · Objetivo táctil.** Lo que se toca seguido mide 44 × 44 pt (Apple)
  o 48 × 48 dp (Android); el mínimo de WCAG es 24 px. Lo principal cerca del
  centro de la pantalla, lo peligroso lejos de lo frecuente.
  *Fuente*: Apple HIG; Android, accesibilidad; Hoober, cómo se sostiene el
  celular (49 % con una mano).
- **AD-4 · Teclado según el dato.** Correo con teclado de correo, teléfono y
  números con teclado numérico, `autocomplete` en datos personales, sin
  autocorrección en nombres y correos. La sonda lo revisa en
  `camposConTecladoIncorrecto`.
  *Fuente*: GOV.UK, text input; Baymard, mobile keyboards; WCAG 1.3.5.
- **AD-5 · Nada que dependa del hover.** Acciones o requisitos que solo
  aparecen al pasar el mouse no existen en una pantalla táctil.
  *Fuente*: NN/g, tooltip guidelines; WCAG 1.4.13.
- **AD-6 · Barras fijas que comen la pantalla.** Cabecera, barra inferior,
  aviso de cookies y chat flotante, juntos, tapan buena parte de la vista o
  la acción principal. La sonda suma su alto en `barrasFijas`.
  *Piso*: Alta si tapan el botón de la tarea.
  *Fuente*: NN/g, sticky headers; WCAG 2.4.11.
- **AD-7 · Gestos con alternativa.** Deslizar, pellizcar o arrastrar tienen una
  alternativa de un toque (flechas, botón).
  *Fuente*: WCAG 2.5.1 y 2.5.7.

---

## IN — Comportamiento al interactuar

Lo que solo aparece **pasando el mouse y pulsando**: no se ve en una captura
quieta. Lo detecta [recorrido-interaccion.js](recorrido-interaccion.js), que
pasa el mouse por todo lo que reacciona y pulsa todo lo que no escribe. Estas
reglas no tienen dimensión propia: cada una dice a cuál suma.

- **IN-1 · Tooltip innecesario.** Un tooltip que repite el texto visible del
  botón («Exportar» sobre «Exportar»), o que aparece en un elemento cuya
  etiqueta ya lo dice todo. El tooltip es la excepción, no el acompañamiento.
  *Dimensión*: jerarquía (ruido). *Piso*: Baja; Media si tapa datos o sale en
  cada fila; si el proyecto prohíbe los tooltips, al menos Media.
  *No es problema*: un botón de solo ícono sin texto visible (aunque mejor
  ponerle texto), si el proyecto los permite.
  *Fuente*: NN/g, tooltip guidelines.
- **IN-2 · Solo con el mouse encima.** Acciones de la fila, requisitos de un
  campo o datos que solo aparecen al pasar el mouse. En pantalla táctil no
  existen y con teclado no se descubren.
  *Dimensión*: carga. *Piso*: Media; Alta si es la acción principal o un dato
  para decidir.
  *Fuente*: NN/g, tooltip guidelines; WCAG 1.4.13.
- **IN-3 · Parece clickeable y no hace nada.** Cursor de mano, cambio al pasar
  el mouse o aspecto de enlace, y al pulsar no pasa nada; o un enlace a `#`.
  Una fila que se ilumina y no abre nada entra aquí.
  *Dimensión*: consistencia. *Piso*: Media; Alta si es donde la gente espera
  abrir el detalle.
  *Fuente*: Nielsen H4; Norman, significantes.
- **IN-4 · Clickeable que no lo parece.** Funciona, pero nada lo anuncia: ni
  aspecto de botón, ni cursor de mano, ni cambio al pasar el mouse.
  *Dimensión*: carga. *Piso*: Baja; Media si es la única forma de llegar a algo.
  *No es problema*: botones que ya se ven como botones (fondo, borde); el
  cambio al pasar el mouse no hace falta en pantallas táctiles.
- **IN-5 · Respuesta lenta sin aviso.** Más de 1 segundo entre el clic y el
  cambio, sin indicador de carga ni botón ocupado.
  *Dimensión*: estado. *Piso*: Media; Alta si invita a pulsar dos veces una
  acción que escribe.
  *Fuente*: NN/g, response times; Ley de Doherty.
- **IN-6 · Diálogo o menú sin salida estándar.** No se cierra con Esc, no
  tiene botón de cerrar, o al cerrarlo el foco no vuelve al botón que lo abrió.
  *Dimensión*: errores. *Piso*: Media; Alta si no hay ninguna forma de cerrarlo.
  *Fuente*: WAI-ARIA APG, patrón de diálogo modal; Nielsen H3.
- **IN-7 · Clickeable sin rol ni teclado.** Un `div` o `span` que responde al
  clic pero no tiene rol ni se alcanza con Tab.
  *Dimensión*: accesibilidad. *Piso*: Media; Alta si es la única forma de
  hacer la tarea.
  *Fuente*: WCAG 2.1.1 y 4.1.2.
- **IN-8 · Tapado por otro elemento.** Un botón que no se puede pulsar porque
  una barra fija, un aviso de cookies o un chat flotante queda encima.
  *Dimensión*: eficiencia (adaptación si pasa solo en celular). *Piso*: Alta;
  Bloqueante si es la acción principal.
  *Fuente*: WCAG 2.4.11.
- **IN-9 · Salta al pasar el mouse.** El elemento cambia de tamaño (negrita,
  borde más grueso) y empuja a sus vecinos.
  *Dimensión*: consistencia. *Piso*: Baja.
- **IN-10 · Escribe sin avisar.** Un botón cuyo nombre no anuncia que guarda
  («Procesar», «Listo») dispara una escritura al servidor sin confirmación. El
  recorrido la bloquea y la anota en `escriturasBloqueadas`.
  *Dimensión*: errores. *Piso*: Media; Alta si es irreversible (ver ER-1).
- **IN-11 · Se rompe al usarlo.** Errores de consola que aparecen al pulsar,
  o diálogos nativos del navegador (`alert`, `confirm`) en vez de los del
  sistema de diseño.
  *Dimensión*: errores (consistencia si es solo el `confirm` nativo).
  *Piso*: Media si algo visible se rompe; Baja para el `confirm` nativo.

El estado de error que aparece porque el recorrido **bloqueó** una escritura
sí se critica (ER-5: ¿el mensaje explica qué pasó y cómo seguir?), pero se
dice que fue provocado por la revisión.

---

## Lo que nunca es hallazgo

- Un gusto sin consecuencia: «se ve anticuado», «los colores no me gustan».
  Si no se puede decir qué tarea empeora y para quién, no entra.
- Una tendencia visual: glassmorphism, modo oscuro, animaciones, «más moderno».
- Una cifra de abandono o de uso citada como si fuera de este producto: los
  números de Baymard o NN/g explican **por qué** importa, no miden esta pantalla.
- Algo que ya existe en la pantalla: antes de sugerir un buscador, una miga o
  un filtro, buscarlo en la captura y en el DOM.
- Algo que el proyecto decidió a propósito y dejó escrito (ADR, CLAUDE.md,
  DESIGN.md), salvo que la decisión esté causando daño visible: entonces se
  critica nombrando la decisión.
- Una sugerencia que viola las reglas del proyecto (`CLAUDE.md`, sistema de
  diseño, ficha de [proyectos-conocidos.md](proyectos-conocidos.md)). Si el
  proyecto prohíbe los tooltips, un texto cortado o un ícono que no se entiende
  se resuelve con texto visible, más ancho o un detalle desplegable.
