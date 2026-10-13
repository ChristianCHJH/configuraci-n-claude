# Checklist — diseño, defensiva y efectos (criterio de revisión de Alberto)

Es la cuarta capa del paso 3, el **Design Hunter**. Los otros checklists preguntan «¿cumple el
estándar?». Este pregunta lo que pregunta Alberto al revisar un PR: «¿qué puede salir mal y qué va a
costar mantenerlo?». Fuente: la revisión de aarroyor al PR #125 del TMS (2026-10-01, `feature/maestras-sap`),
que cubrió diez ejes: POO, programación defensiva, side effects, clean code, YAGNI/KISS/DRY/SOLID,
patrones, IoC, transaccionalidad y observabilidad, estándar del TMS, seguridad y pruebas. La auditoría
previa de la misma rama no vio 77 de sus 94 observaciones. El análisis está en
`C:\Users\Christian\Unimar\revision-pr125-vs-auditor.md`.

Casi nada de esto lo atrapa un grep. La detección da por dónde empezar a leer, no el hallazgo. Cada
ítem cita la observación del PR #125 que lo motivó: sirve de ejemplo de lo que hay que encontrar.

**Fuente en el reporte:** `Alberto PR#125 · eje DRY` (o el eje que toque). Si además hay una regla escrita (R-, S-, ADR,
`CLAUDE.md`), va primero esa. Sin regla escrita pero con escenario, el tipo es **Riesgo**, no se
descarta (paso 4).

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; WEB=src/apps/web/src`.

## DRY: una regla, una definición

- **DIS-01 · Alta** — Una regla de negocio está escrita una sola vez **dentro de la misma
  aplicación**, no solo entre web y API: la misma condición en dos adaptadores (O20, «conductor sin
  cuenta UMS no recibe oferta», tres copias y una invertida), la misma validación con dos criterios
  (V8, peso con tres decimales), la misma clave de recalada en dos sentencias (V20) o la misma tabla
  `Record<Estado, …>` en dos funcionalidades (V23).
  Detecta: por cada código de error, predicado, columna de `WHERE` o constante nueva del diff, su
  gemelo en la misma aplicación:
  `git diff $BASE...HEAD -U0 -- src/apps | grep -oE "[A-Z][A-Z_]{6,}" | sort -u` y, por cada uno,
  `git grep -c '<VALOR>' -- src/apps`. Más de un sitio que **decide** con él es candidato.
- **DIS-02 · Media** — Un bloque repetido entre dos escrituras se extrae cuando el PR toca las dos
  copias (V6, «leer catálogo, recorrer hitos, insertar marcas, cerrar» en dos adaptadores). Que el
  PR edite las dos copias en el mismo commit es la señal.
  Detecta: `git diff $BASE...HEAD --stat` y, entre los archivos con cambios gemelos, comparar
  los hunks.

## SOLID, patrones e IoC

- **DIS-03 · Media** — Un mismo patrón se aplica de una sola forma en el módulo: si cinco
  sincronizadores heredan y dos componen, sobran dos formas (V14).
  Detecta: `git grep -nE 'extends [A-Z][A-Za-z]+(Sincronizador|Base|Abstract)' -- "$API"` frente a
  las clases hermanas del mismo directorio.
- **DIS-04 · Media** — Un puerto que el PR crea lo usan también los de casa: si el módulo sigue
  inyectando la clase concreta, el puerto solo existe a medias (V2). Un puerto tiene una
  responsabilidad: no mezcla la operación autónoma con la que se une a una transacción ajena (V5).
  Detecta: por cada `Symbol(` o token nuevo, `git grep -n '<Clase>' -- "$API/modules/*/application/*"`.
- **DIS-05 · Media** — Sin parámetro booleano que cambie el comportamiento: el flag que apaga una
  regla en un canal (O18, `exigirDatosDeCargaSuelta: false` en el portal) es una regla sin nombre.
  Se parte en dos funciones con nombre, o el flag lleva su porqué y una prueba por valor.
  Detecta: `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^\+.*\b(exigir|permitir|saltar|omitir|forzar|validar|con|sin)[A-Z][A-Za-z]*: (true|false)\b'`.
- **DIS-06 · Media** — `@Global()`, un valor por omisión de una prop inyectada o un registro
  implícito que esconde el cableado lleva su porqué escrito (V22, prop con defecto `SinCargaSuelta`).
  Ojo: el `@Global()` de V15 era necesario (quitarlo rompe `naves-y-flota-son-hoja`). Ahí el
  hallazgo es solo que falta el porqué, no el decorador.
  Detecta: `git diff $BASE...HEAD -- src/apps | grep -nE '^\+.*(@Global\(\)|= Sin[A-Z]|\?\? Sin[A-Z])'`.
- **DIS-07 · Baja** — Cohesión: cada archivo guarda lo que su nombre dice. Una función que ejecuta
  consultas no vive en un archivo de constantes SQL (V10), y el DTO que llena una persona no vive
  en el archivo de los DTO de SAP (V18).
  Detecta: por cada archivo tocado, su nombre frente a lo que el diff le añade.

## KISS, YAGNI y clean code

- **DIS-08 · Media** — Código muerto tras retirar una función: cuando el diff borra una pantalla,
  una ruta o un CRUD, se buscan sus restos (ramas, variantes, constantes, rutas `/activas`, campos
  que el listado ya no pinta). Ejemplos: V19 (`loQueLlega`, `cambiarEstado`), V26 (variantes
  `neutro`/`exito` de `Boton`) y el #19 del reporte del 29/09.
  Detecta: por cada símbolo exportado de un archivo tocado,
  `git grep -c '\b<simbolo>\b' -- src/apps`. Si solo aparece en su definición y en su prueba, está
  muerto.
- **DIS-09 · Media** — Un estado, una fuente: el paso de un asistente partido entre estado local y
  gancho (V21), o una máquina de estados repartida en constantes sueltas (V11), se juntan en una
  unión discriminada o en una tabla de transiciones.
  Detecta: juicio en los ganchos y en los archivos de dominio que el diff toca.
- **DIS-10 · Media** — Una conversión `as` anula la comprobación justo donde se usa. Va con su
  porqué, o se reemplaza por un tipo guardia o por `satisfies` (V9, V34, O35).
  Detecta: `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^\+.*\bas (const\b)?[A-Z{(\[]' | grep -v 'as const'`.
- **DIS-11 · Baja** — El prototipo no reimplementa la lógica de la web real: un modal de 766 líneas
  en `src/apps/prototipo-web` es una segunda implementación que nadie mantiene (V35).
  Detecta: `git diff --stat $BASE...HEAD -- src/apps/prototipo-web`.

## Programación defensiva

- **DEF-01 · Alta** — Una entrada ambigua falla cerrada. El discriminante (`modo`, `tipo`,
  `operacion`) es obligatorio y una carga útil que no le corresponde es 400. Un valor por omisión
  en el mapeo convierte un olvido en una acción irreversible (O17: llega `citas` sin `modo`, se
  inicia la RD sin cita y no hay vuelta atrás).
  Detecta: `git grep -nE "^\s+(modo|tipo|operacion)\?:" -- "$API/*dto*.ts"`;
  `git grep -nE "\?\? (Modo|Tipo)[A-Za-z]*\.|\?\? '[A-Z_]+'" -- "$API/modules/*/api/*"`.
- **DEF-02 · Alta** — Una validación de frontera está completa:
  - Rango real, no solo forma: `31/02` y `99:99` no pasan (O34).
  - El tope que impone la API se publica a la web, que lo muestra antes de enviar (O34, 1000 citas).
  - Toda lista que arma un `IN (@0…@n)` lleva `@ArrayMaxSize` (V7).
  - Un texto que no se entiende bloquea el envío en vez de descartarse en silencio (O34).

  Detecta: `git grep -nE -A3 '@IsArray\(' -- "$API/*dto*.ts"` y comprobar `@ArrayMaxSize` en cada
  bloque; en el diff de la web, cada expresión regular de fecha u hora y si detrás hay una
  comprobación de rango; cada constante `MAXIMO_*` de la API y si la web la recibe.
- **DEF-03 · Alta** — Una compuerta de negocio aplica en todos los canales que llegan al mismo
  estado (app, portal, SAP, bandeja). Si un canal la salta, consta por qué y hay una prueba por canal
  (O18: el portal marca `SALIDA_IP` sin los datos de la carga suelta).
  Detecta: por cada regla nueva de evidencia o de estado, `git grep -n '<funcion de la regla>' -- "$API"`
  y comprobar que la llaman todos los caminos que escriben ese estado.
- **DEF-04 · Alta** — Dos rutas que el contrato declara equivalentes se comportan igual. El
  `PUT activo:false` y el `DELETE` dan de baja con las mismas exigencias (O23).
  Detecta: en el contrato (`docs/02-diseno/*contrato*`), frases «equivale a», «igual que», «mismo
  efecto», y comparar los dos caminos en el código.
- **DEF-05 · Alta** — El candado está en el tipo, no en una convención. Un campo que solo un caso de
  uso puede escribir (`usuario_ums`, ADR-TMS-024 D1) no está en el tipo genérico de escritura de la
  maestra (O29).
  Detecta: por cada columna que el `CLAUDE.md` o un ADR reserva a un flujo, su nombre en los tipos
  `Datos*` del dominio: `git grep -nE 'usuarioUms|horasLibres' -- "$API/modules/*/domain/*"`.
- **DEF-06 · Media** — Un tope que corta en silencio dice que cortó: `TOP n` o `take: n` en una lista
  «completa» para un selector deja fuera filas sin aviso (O28, 500 activos frente a la flota entera
  de SAP).
  Detecta: `git grep -nE 'TOPE_|TOP \(?@?[0-9]|take: [0-9]' -- "$API"` y mirar quién lo consume.
- **DEF-07 · Baja** — La consulta de una URL se arma con `URLSearchParams`, nunca concatenando
  (V33).
  Detecta: `git grep -nE '[?&][a-zA-Z]+=\$\{' -- "$WEB"`.

## Efectos laterales

- **EFE-01 · Alta** — Una escritura idempotente no escribe si nada cambió. El `PUT` que reenvía lo
  mismo no estampa `usuario_actualizador` ni `fecha_actualizacion`, no sube `ultimo_cambio` ni repite
  efectos como `alDesactivar` (O21). En las filas con testigo (`conductor`, `instalacion_portuaria`)
  un `UPDATE` inocuo de SAP le devuelve un 409 a la persona que estaba editando.
  Detecta: en cada `PUT`/sincronizador, ¿compara lo leído con lo normalizado antes del `UPDATE`?
- **EFE-02 · Media** — La invalidación de caché se acota a lo que el consumidor lee: escribir
  transportistas no tira la caché del consolidado de naves (O22).
  Detecta: `git grep -nE 'Invalidacion|invalidar|generacion' -- "$API/shared/cache"` y la lista de
  rutas que la disparan frente a las tablas que la caché lee.
- **EFE-03 · Media** — Un efecto destructivo derivado de un gesto pequeño se avisa o se confirma.
  Dejar el correo en blanco desvincula la cuenta y da de baja los aparatos sin confirmar nada (V32).
  Detecta: por cada formulario del diff, ¿un valor vacío dispara una baja o una desvinculación?

## Transaccionalidad y narración

- **TRX-01 · Crítica** — Una llamada saliente que emite algo irreversible (documento fiscal, pago,
  aviso) reintenta con la **misma** clave de idempotencia después de un timeout. Si el código abre una
  clave nueva en cada intento, el contrato no puede prometer deduplicación (O16: guía de remisión
  con un `idSolicitud` nuevo por pedido; XMS puede emitirla dos veces). Contrastar también con los
  gaps abiertos: G-189 ya lo registraba.
  Detecta: `git grep -nE 'idSolicitud|idempot|claveIdempotencia' -- "$API"` y seguir qué valor viaja
  en el reintento tras `sinRespuesta`.
- **TRX-02 · Media** — Un efecto irreversible se narra después del commit, no dentro de la
  transacción (V4, `narrarOfertas` dentro del creador). Generaliza OBS-13 a todo
  `registrarEfecto`.
  Detecta: `git grep -nE -B10 'registrarEfecto|narrar[A-Z]' -- "$API/modules/*/infrastructure/*" | grep -E '\.transaction\('`.
- **TRX-03 · Media** — Cada escritura deja su `registrarEfecto` y cada rechazo por referencia deja
  rastro (etapa `fallida` o `registrarDecision`). Si falta, la pregunta de soporte «¿por qué no llegó
  este conductor de SAP?» no tiene respuesta en el relato (O24, ADR-TMS-019).
  Detecta: casos de uso nuevos de `application/` sin `registrarEfecto` ni `fallida`:
  `git grep -L 'registrarEfecto' -- "$API/modules/*/application/*.caso-uso.ts"`.

## Cambio de premisa

- **PRE-01 · Alta** — Cuando el PR cambia **quién escribe** una tabla o **cuánto crece** (SAP pasa a
  escribir las maestras, carga masiva, conciliación periódica), se revisa lo existente que dependía
  de la premisa vieja, aunque esté fuera del diff: caché (O22), topes (O28), testigo `ultimo_cambio`
  y su 409 en la web (O21, O37), límite de ritmo por sujeto. Lo encontrado fuera del diff entra como
  Preexistente con la severidad de su escenario nuevo.
  Detecta: por cada tabla cuyo escritor cambia en el diff, `git grep -n '<tabla>' -- src/apps` y
  revisar quién la lee, la cachea, la limita o la versiona.

## Al corregir: los gemelos

- **GEM-01 · Alta** — Un arreglo busca el mismo defecto en la carpeta, el archivo o el canal de al
  lado. El commit `37edc558` sacó `paquete` de la purga de `robocopy /MIR` y dejó el almacén de
  adjuntos, la carpeta vecina, con el mismo defecto (O1, 🔴). Un commit de remedio también se
  audita: `10862472` atendió la auditoría del 29/09 e introdujo O35, V25 y V34.
  Detecta: `git log --format='%h %s' $BASE..HEAD | grep -iE 'fix|remedi|audit|arregl'` y pasar el
  Blind Hunter sobre cada uno.
