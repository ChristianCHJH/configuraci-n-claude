---
name: spiderman-experto-ux
description: Experto en UX que CRITICA y CALIFICA cualquier interfaz, sin cambiar nada — sitio público, tienda y checkout, SaaS, panel interno, formulario, web móvil, o capturas de cualquier app (también nativa). Funciona en cualquier proyecto o con solo una URL. Captura las pantallas con Playwright, las evalúa con dos evaluadores independientes contra reglas de Nielsen, Shneiderman, Bastien & Scapin, Gerhardt-Powals, Laws of UX, WCAG 2.2, Baymard, patrones engañosos y guías por tipo de producto (tablas, formularios, compra, contenido, móvil, errores, estados), mide lo medible (contraste, tamaño de objetivos, campos sin etiqueta, fugas de texto técnico, foco con teclado), interactúa con la pantalla —pasa el mouse por todo y pulsa cada botón que no escribe, con una red que bloquea cualquier escritura— para encontrar tooltips innecesarios, clics que no hacen nada, acciones que solo aparecen con el mouse, respuestas lentas sin aviso y diálogos sin salida, y publica un informe como artefacto con las capturas anotadas, una nota de 0 a 100 que sale de los hallazgos, y sugerencias críticas priorizadas. SOLO CRITICA Y MUESTRA, nunca modifica código. Úsala cuando el usuario diga "critica el UX", "califica la pantalla", "evalúa la experiencia de uso", "auditoría UX", "revisión experta de UX", "¿qué tan buena es esta pantalla?", "experto UX" o invoque /spiderman-experto-ux, opcionalmente con una URL, ruta, módulo o capturas; con la palabra "rápido" hace una sola pasada.
---

# Spider-Man experto UX

Critica la **experiencia de uso** de pantallas ya construidas y le pone nota,
en **cualquier tipo de interfaz y en cualquier proyecto**: un sitio público, una
tienda, un SaaS, un panel interno, una web móvil, o capturas de una app nativa.
La skill se adapta al producto con un **perfil** (qué tarea importa, qué
dimensiones pesan, qué anchos se miran); las reglas son las mismas.

El entregable es un **artefacto**: cada pantalla con su captura, los problemas
marcados encima, por qué importan y qué haría un experto. Nada se cambia.

Archivos de la skill (rutas relativas a esta carpeta):

| Archivo | Para qué |
| --- | --- |
| [reglas.md](reglas.md) | Los criterios por dimensión, con pisos de severidad y lo que nunca es hallazgo |
| [rubrica.md](rubrica.md) | Perfiles y pesos, severidad, certeza, cómo sale la nota, ejemplos calibrados |
| [evaluador.md](evaluador.md) | El encargo para los dos evaluadores independientes |
| [sonda-ux.js](sonda-ux.js) | Mide en el DOM: contraste, objetivos, etiquetas, fugas, tablas, tipografía |
| [recorrido-teclado.js](recorrido-teclado.js) | Recorre la pantalla con Tab: foco visible, orden, foco oculto |
| [recorrido-interaccion.js](recorrido-interaccion.js) | Pasa el mouse y pulsa cada elemento: tooltips, clics muertos, lentitud, diálogos, lo tapado |
| [plantilla-informe.html](plantilla-informe.html) | El informe: se copia, se llena el JSON y se publica |
| [proyectos-conocidos.md](proyectos-conocidos.md) | Contexto ya guardado de proyectos donde se usó (usuarios, URL, decisiones) |
| [fuentes.md](fuentes.md) | De dónde sale cada regla |

## Regla de oro: solo mirar

- **No se modifica ningún archivo del proyecto.** Lo único que se escribe es la
  carpeta del informe (`.revision-ux/`).
- **En sitios ajenos o en producción**, además: no se escriben datos reales en
  ningún campo, no se aceptan cookies más allá de lo necesario para ver la
  página y no se inicia ninguna compra, registro ni contacto.
- **Se toca todo, no se guarda nada.** Se pasa el mouse por todo lo que
  reacciona y se pulsa todo lo que no escribe: botones, enlaces internos,
  pestañas, filas, menús, diálogos (que se cierran con Esc o **Cancelar**).
  Tres frenos a la vez:
  1. **Red de seguridad**: durante el recorrido se bloquea toda petición al
     servidor que no sea de lectura (POST, PUT, PATCH, DELETE). Si un botón
     intenta escribir, la escritura no llega y queda anotada.
  2. **No se pulsa** lo que por su nombre guarda, borra, envía, paga, aprueba,
     asigna, importa o cierra sesión, ni los enlaces a otros sitios.
  3. **No se envían formularios** ni se suben archivos.

  Lo que solo se ve guardando va a «no probado». Si la app guarda en el propio
  navegador (funciona sin conexión), la red no alcanza: se avisa y se pregunta
  antes de pulsar.
- **No se crean datos.** Si una pantalla necesita datos para verse, se busca un
  registro que ya los tenga.

## Cómo critica un experto

Reglas claras, no rígidas: el criterio manda sobre el checklist.

1. **Primero la meta, después el elemento.** Toda crítica responde: ¿cuál es la
   tarea?, ¿qué elemento la afecta?, ¿funciona?, ¿por qué no? Sin tarea, no hay
   hallazgo (Connor e Irizarry).
2. **Solo lo que se ve.** Se afirma lo que está en la captura o lo que midió la
   sonda. Lo interactivo que no se pudo ver se declara «no probado», no se
   supone. Las auditorías de IA sin esta disciplina dan 80 % de falsos
   positivos (Baymard).
3. **Comprobar antes de sugerir.** Antes de pedir un buscador, una miga o un
   filtro, buscarlo en la captura y en el DOM. Antes de pedir algo que el
   proyecto quitó, buscar la decisión (ADR, DECISIONS.md, CLAUDE.md).
4. **El producto manda.** Cada interfaz se juzga por su propia tarea y su
   propio usuario. Una herramienta de uso intensivo se juzga por la tarea
   repetida y se protege su densidad; un sitio público, por lo que entiende un
   visitante nuevo en segundos y por la confianza que da; una compra, por lo
   que hace perder o abandonar. Nunca se pide una tendencia visual.
5. **Concreto o nada.** «El botón Asignar de la fila», no «algunos elementos».
   Prohibido «considerar», «explorar», «podría mejorarse».
6. **Una causa, un hallazgo.** El mismo defecto en cinco pantallas es uno, con
   cinco marcas.
7. **No rellenar.** Si la pantalla está bien, el informe es corto y lo dice.
   Siempre se nombra lo que funciona, para que nadie lo rompa al arreglar.
8. **Las sugerencias respetan el proyecto.** Si el `CLAUDE.md`, el sistema de
   diseño o una decisión escrita prohíben algo (por ejemplo, los tooltips), no
   se sugiere: se busca otra salida.

## Pasos

### 1. Contexto, antes de abrir el navegador

1. **¿Hay ficha?** Si el directorio de trabajo o la URL coinciden con un
   proyecto de [proyectos-conocidos.md](proyectos-conocidos.md), leer su ficha:
   ya trae usuarios, URL, perfiles y decisiones.
2. **Si hay repositorio**, leer lo que exista: `CLAUDE.md`, `README`,
   `DESIGN.md` / `DESIGN.json` o los tokens del tema, el PRD o la historia, las
   decisiones (`DECISIONS.md`, ADR). Del `package.json` y las rutas sale qué
   tipo de producto es.
3. **Si solo hay una URL** (un sitio ajeno, una página pública), el contexto
   sale de la propia página: qué ofrece, a quién le habla, qué quiere que haga
   el visitante.
4. Fijar cuatro datos: **quién** la usa, la **tarea principal**, con qué
   **frecuencia**, en qué **dispositivo**. Si no se pueden deducir, una sola
   pregunta con `AskUserQuestion`; si el usuario no sabe, se declaran como
   supuestos en el informe.
5. Elegir el **perfil** de la rúbrica ([rubrica.md](rubrica.md) §1) y anotar las
   decisiones del proyecto que tocan la pantalla.

### 2. Alcance y acceso

- La URL o ruta que dio el usuario. Si dijo un módulo o «todas», listar las
  rutas del frontend y proponer **3 a 5 pantallas por informe**; más se parte
  en varios informes.
- La URL base: la del usuario o la del proyecto levantado. Si no responde,
  pedir que levante la app y parar.
- Login: credenciales de desarrollo en la documentación o la semilla; si no
  hay, pedirlas. No se inventan.
- **Si el usuario da capturas en vez de URL**: se saltan los pasos 3 y 5; lo
  que exige DOM o interacción queda como `probable` o «no probado», y la
  dimensión de accesibilidad se marca `evaluada: false` salvo lo que se vea.

### 3. Capturas

Carpeta: `.revision-ux/AAAA-MM-DD-HHmm/capturas/` en la raíz del proyecto. Sin
proyecto (solo una URL), en el directorio de trabajo o en el scratchpad de la
sesión: el artefacto solo publica archivos que estén bajo uno de los dos.

Ventanas según el perfil y el uso real:

| Perfil | Ventanas | Ancho de trabajo |
| --- | --- | --- |
| Operativa, formulario, consulta | 1366 × 768 y 1920 × 1080; más 768 y 390 si se usa en tablet o celular | 1366 |
| Pública, compra, primer uso | 390 × 844 y 1440 × 900; más 768 × 1024 si importa la tablet | 390 |
| App móvil (web) | 390 × 844 y 360 × 780 | 390 |

El **ancho de trabajo** es donde se capturan los estados y se corren las
mediciones: el que más usa la gente de ese producto.

Por cada pantalla y ventana, con `mcp__playwright__*`:

1. `browser_resize`, `browser_navigate`, `browser_wait_for` hasta que se vaya
   el cargando.
2. **Validar antes de seguir**: no está en blanco, es la pantalla correcta, los
   datos cargaron, no hay un error tapando. Si falla, se recaptura; nunca se
   critica una captura mala.
3. `browser_take_screenshot` de la ventana como `<pantalla>-<ancho>.png`. Si la
   página baja, otra con `fullPage` como `<pantalla>-<ancho>-completa.png`.
   Pasar la ruta absoluta en `filename`; si la herramienta la guarda en otro
   lado, moverla a `capturas/`.
4. **Estados**, solo los que se alcanzan sin guardar, en el ancho de trabajo:
   pasar el mouse o tocar un elemento; abrir el menú, el diálogo o el
   formulario principal y cerrarlo con Cancelar; una búsqueda o un filtro sin
   resultados (estado vacío); un dato inválido en un campo y salir con Tab
   (validación); en compra, el carrito o el primer paso del checkout sin pagar.
   Cada uno como `<pantalla>-<estado>-<ancho>.png`.
5. Anotar lo que no se pudo capturar y por qué: va a «no probado».

### 4. Dos evaluadores independientes (antes de medir)

Lanzar los dos evaluadores de [evaluador.md](evaluador.md) con `Agent`, **en
paralelo, en un solo mensaje y en segundo plano**, con las rutas absolutas de
las capturas. No ven la sonda ni lo que piensa el agente principal: así no se
anclan. Mientras trabajan, seguir con el paso 5.

**Modo rápido** (el usuario dijo «rápido»): sin evaluadores. El agente
principal evalúa las capturas con [reglas.md](reglas.md) **antes** de correr la
sonda, y el informe dice `"pasadas": 1`.

### 5. Mediciones

Una vez por pantalla, en el ancho de trabajo:

1. `browser_evaluate` con el contenido completo de [sonda-ux.js](sonda-ux.js)
   (leer el archivo y pasarlo entero como función).
2. `browser_run_code_unsafe` con [recorrido-teclado.js](recorrido-teclado.js).
   Tras el recorrido, una captura con el foco puesto:
   `<pantalla>-foco-<ancho>.png`. En un perfil de celular el teclado pesa
   menos, pero el foco visible se revisa igual.
3. `browser_console_messages`: los errores de consola son evidencia de
   estados rotos.

| Campo de la sonda | Regla | Cuándo NO es hallazgo |
| --- | --- | --- |
| `contrasteBajo` | AC-1 | `fondoIncierto: true` y en la captura se lee bien; texto de un control deshabilitado |
| `textoMuyChico` | AC-7 | Marcas de agua o adornos; las notas legales de una compra **sí** cuentan |
| `objetivosChicos` | AC-4, EF-3 | Controles del navegador; enlaces dentro de un párrafo |
| `botonesBajosParaUsoIntensivo` | EF-3 | Botones de uso raro |
| `camposSinEtiqueta`, `botonesSinNombre` | AC-6, CA-6 | Casi nunca |
| `conTitleVisual` | Regla del proyecto | Solo es hallazgo si el proyecto prohíbe los tooltips |
| `botonesDeColor` | JE-1 | El mismo botón repetido por fila |
| `deshabilitados` | ER-8 | Cuando al lado se ve qué falta |
| `textoTruncado` | CA-5 | Texto que se puede abrir completo con un gesto visible |
| `fugas` | LE-2 | `true` / `false` que son parte de un texto legítimo; textos en inglés en un producto en inglés |
| `tablas[].columnasNumericasMalAlineadas` | JE-3 | Códigos que parecen números (n.º de pedido, placa, código postal) |
| `tablas[].encabezadoFijo: false` | JE-3 | La tabla cabe entera en la ventana |
| `tipografia`, `formaDeBotones` | CO-2 | Variaciones que el sistema de diseño define a propósito |
| `camposConTecladoIncorrecto` | AD-4 | Pantalla que solo se usa en escritorio (baja a Baja, no desaparece: también afecta el autocompletado) |
| `barrasFijas.porcentajeDeLaVentana` | AD-6 | Menos de ~25 % y sin tapar la acción principal |
| `casillasPremarcadas` | CF-7 | Filtros, preferencias de vista, «Recordarme», o un valor sin costo a favor de la persona |
| `enlacesVagos` | JE-8 | Un único «Ver más» junto a un título que ya dice qué abre |
| `buscador` | EF-8 | Sitios de pocas páginas; herramientas sin catálogo |
| `resumen.sinIndicadorDeFoco` (teclado) | AC-5 | Elementos que la captura de foco muestra marcados |
| `resumen.saltosDeOrdenSospechosos` | EF-4 | Un salto a un panel lateral que sí es el orden lógico |

### 5b. Recorrido de interacción

Lo que una captura quieta no muestra: qué pasa al pasar el mouse y al pulsar.
Una vez por pantalla, en el ancho de trabajo, con
[recorrido-interaccion.js](recorrido-interaccion.js):

1. Leer el archivo, reemplazar las constantes de arriba (`PANTALLA`, `CARPETA`
   con la ruta absoluta de `capturas/`, `DESDE`, `CANTIDAD`) y pasarlo entero a
   `browser_run_code_unsafe`.
2. Recorre de a 30 elementos (unos 75 segundos). Si devuelve `siguienteDesde`,
   repetir con ese `DESDE`. Más de 90 elementos por pantalla: parar y anotar
   el resto como «no probado». Si la herramienta corta por tiempo, bajar
   `CANTIDAD` a 15.
3. Deja capturas propias en `capturas/`: `<pantalla>-int-base.png` (página
   completa) y una por evento notable (`-hover`, `-dialogo`, `-desplegable`,
   `-error`, `-tapado`). Se suman a `pantallas[].capturas` del informe; la
   marca sale de `zonaPagina` (en la base) o `zonaVentana` (en las demás).
4. Mirar cada captura antes de convertir una línea del `resumen` en hallazgo.

| Campo del `resumen` | Regla | Cuándo NO es hallazgo |
| --- | --- | --- |
| `tooltips` | IN-1 | Botón de solo ícono, si el proyecto permite tooltips |
| `accionesQueSoloAparecenConHover` | IN-2, AD-5 | Atajos que también están a la vista en otro lado |
| `clicsSinEfecto` | IN-3 | Un elemento que en la captura no parece clickeable y solo hereda el cursor de su contenedor |
| `clickeablesSinRespuestaAlHover` | IN-4 | Botones que ya se ven como botones; pantallas táctiles |
| `conAparienciaDeBotonSinPuntero` | IN-4 | El sistema de diseño lo decide así para toda la app |
| `lentosSinIndicador` | IN-5 | Una respuesta lenta solo por el entorno de desarrollo: repetir antes de anotarla |
| `dialogosQueNoCierranConEscape`, `focoQueNoVuelveAlCerrar`, `desplegablesQueNoCierranConEscape` | IN-6 | Un diálogo de confirmación crítica que exige elegir |
| `clickeablesSinRolNiTeclado` | IN-7 | Un contenedor que solo hereda el clic de un botón que sí tiene rol |
| `tapadosPorOtroElemento` | IN-8 | Lo tapa un diálogo que el propio recorrido dejó abierto |
| `saltanAlPasarElMouse` | IN-9 | Casi nunca |
| `escriturasBloqueadas` | IN-10 | El botón se llamaba de forma que anunciaba la escritura |
| `erroresDeConsola`, `dialogosNativos` | IN-11 | Errores causados por la propia red de seguridad (se dicen como provocados) |
| `noPulsados` | — | Van a «no probado» con su motivo |

### 5c. Verificar y juntar

Cuando vuelven los evaluadores ([rubrica.md](rubrica.md) §5):

1. **Agrupar** por causa raíz y unir las marcas.
2. **Verificar cada hallazgo** abriendo la captura con `Read`: si no se ve, se
   descarta o baja a `probable`. Pasarlo por «Lo que nunca es hallazgo» de
   [reglas.md](reglas.md).
3. **Afinar la marca**: si el elemento aparece en la sonda, usar su
   `zonaVentana` (captura de ventana) o `zonaPagina` (captura completa).
4. **Sumar lo medido y lo recorrido** que los evaluadores no vieron, solo después de mirarlo
   en la captura.
5. **Severidad final** con la tabla de impacto × frecuencia y los pisos.
6. Numerar `id` del 1 en adelante, de más a menos grave.
7. Juntar **lo que funciona** (2 a 4), **lo no probado** y **2 a 4 preguntas**
   para el equipo cuya respuesta cambiaría una severidad.

### 6. El informe (artefacto)

1. Cargar la skill `artifact-design` (lo exige la herramienta). La plantilla ya
   cumple su contrato: **no se rediseña**, solo se llena.
2. Copiar [plantilla-informe.html](plantilla-informe.html) a
   `.revision-ux/AAAA-MM-DD-HHmm/informe.html`.
3. Cambiar el `<title>` por un nombre: `Crítica UX de <módulo o pantalla>`.
4. Reemplazar el JSON de `<script id="datos-informe">`, sin `esEjemplo`:

   | Campo | Contenido |
   | --- | --- |
   | `producto`, `titulo`, `fecha`, `perfil` | Qué se evaluó y con qué perfil |
   | `contexto` | `usuarios`, `tareaPrincipal`, `dispositivo` |
   | `nota` | `veredicto` (2–3 frases: qué tan bien sirve a la tarea y el problema de fondo), `confianza` (`alta`, `media`, `baja`), `pasadas` (2, o 1 en modo rápido) |
   | `dimensiones` | Las diez de la rúbrica, con `clave`, `nombre`, `peso` del perfil, `motivo` de una línea y `"evaluada": false` en las que no se pudieron ver. **Sin puntaje: lo calcula la plantilla** |
   | `pantallas` | `id`, `nombre`, `ruta`, `capturas[]` con `id`, `archivo` (`capturas/<archivo>.png`), `ventana`, `descripcion` |
   | `hallazgos` | `id`, `severidad`, `titulo`, `dimension`, `principio`, `pantalla` (o `null` si es de todo el sistema), `marcas[]` con `captura`, `x`, `y`, `ancho`, `alto` en %, `queSeVe`, `porQueImporta`, `sugerencia`, `evidencia`, `certeza`, `esfuerzo` |
   | `loQueFunciona`, `noProbado`, `preguntas`, `metodo` | Como en el ejemplo de la plantilla |
   | `anterior` | Opcional: `{ "fecha", "nota" }` si hay un informe previo de la misma pantalla en `.revision-ux/` |

5. Validar el JSON antes de publicar:
   `node -e "const h=require('fs').readFileSync('<informe.html>','utf8');JSON.parse(h.split('id=\"datos-informe\">')[1].split('</script>')[0])"`.
6. Publicar con `Artifact`: `file_path` el `informe.html`, `files` con cada
   captura (`"capturas/x.png": ".revision-ux/<fecha>/capturas/x.png"`),
   `icon: "review"` y una `description` de una frase.
7. Si `.revision-ux/` no está en el `.gitignore`, decirlo al final. No editar
   el `.gitignore`.

### 7. Respuesta en el chat

Corta. Primera línea: el enlace al informe. Después la nota con su banda,
cuántos hallazgos por severidad y los tres más graves en una línea cada uno.
Cerrar con una sola acción concreta («Abre el informe y mira el #1»). No se
pega el informe ni el JSON en el chat. No se ofrece arreglar nada: esta skill
solo critica; si el usuario quiere arreglar, lo pide aparte.

## Proyectos con contexto guardado

[proyectos-conocidos.md](proyectos-conocidos.md) guarda, por proyecto, lo que
no se deduce de la pantalla: quién la usa, la URL, el perfil de cada módulo y
las decisiones que no se critican sin daño visible. Si el proyecto no está, el
contexto sale del paso 1 y la skill funciona igual. Al terminar el primer
informe de un proyecto nuevo, se ofrece en una línea agregar su ficha.

## Con otras skills

- `spiderman-verificador-pantallas` revisa lo mecánico (scroll anidado,
  responsive, navegación de regreso). Esta skill no repite su recorrido: si
  una captura muestra uno de esos defectos, se anota y se sugiere correr esa
  skill para el detalle.
- `impeccable` critique juzga estética, marca y «cara de IA». Esta skill juzga
  si la interfaz deja hacer la tarea: se complementan.
