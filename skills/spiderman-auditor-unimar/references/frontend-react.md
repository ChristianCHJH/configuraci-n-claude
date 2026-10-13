# Checklist — frontend React

Criterio de Barry (`unimar-dev-frontend`, RS-WEB-DEV) y de Ororo (`unimar-ui`, RS-UI-UX) aplicado a
la web. Fuentes: ADR-TMS-010 (React 18: es decisión, no hallazgo), ADR-TMS-016 (armazón), ADR-TMS-020
(la regla la decide la API), ADR-0109 (P-FE-01 a P-FE-10), ADR-0110 (P-UX-01 a P-UX-08), ADR-0165
(P-SEC-01 a P-SEC-06), el `CLAUDE.md` del TMS (tooltips) y el documento de Alberto (§4, §5).

Lo visual y lo responsivo de la pantalla levantada no se juzga leyendo código: se delega en
`/spiderman-verificador-pantallas`. Aquí se revisa el código.

La mayoría de estas reglas las muerde `npm run lint` con `src/apps/web/eslint.config.js`
(`no-restricted-imports`, `no-restricted-globals`, `no-restricted-syntax`,
`react/prefer-read-only-props`) y su prueba `src/app/reglas-de-lint.prueba.ts`.

Variables, a pegar delante en la misma llamada: `BASE=origin/develop; WEB=src/apps/web/src`.

## La regla de negocio vive en la API

- **FE-01 · Alta** — La web no calcula lo que el dominio permite: lo lee del modelo de lectura
  (`puedeProgramarse`, `enCurso`, `siguienteHito`). Un predicado de negocio que aparece en la web se
  sube a la API, no se muda de carpeta.
  Fuente: ADR-TMS-020 §1 y §2; Alberto §4.1; §13 error 3. Detecta:
  `git grep -nE '(export )?(const|function) (es|puede|debe|tiene)[A-Z][A-Za-z]*' -- "$WEB" | grep -v '\.prueba\.'`
  y separar los tres niveles: lo que el dominio permite (API), si el formulario está completo (web),
  y la franja de anticipación con sus tres condiciones acumulativas.
- **FE-02 · Alta** — Ninguna copia en la web de una lista, un estado final o un nivel que la API ya
  declara: dos implementaciones del mismo hecho coinciden por casualidad hasta que dejan de hacerlo.
  Fuente: ADR-TMS-020; ADR-TMS-019 D2 (el vocabulario no se reimplementa); G-156; G-178; G-229.
  Detecta: por cada constante nueva de `vocabulario/` o de un gancho, buscar su gemela en la API:
  `git grep -nE "'<VALOR>'" -- src/apps/api/src`.

## Capas y estructura

- **FE-03 · Alta** — Por funcionalidad: `infraestructura/` (esquemas zod, transporte) ← `aplicacion/`
  (ganchos) ← `componentes/`, `paginas/`, `presentacion.tsx`. No existe `api/` en una funcionalidad y
  el sufijo es `.http.ts`, no `.api.ts`.
  Fuente: ADR-TMS-020 §3; Alberto §4.2. Detecta: `npm run lint`;
  `git ls-files "$WEB" | grep -E '\.api\.tsx?$|funcionalidades/[^/]+/api/'`.
- **FE-04 · Alta** — La presentación no conoce el transporte: ni `@/nucleo/api/*` ni
  `infraestructura/` ni un `.http`; el gancho le entrega `mensajeError: string | null`.
  Fuente: ADR-TMS-020; Alberto §4.2. Detecta:
  `git grep -nE "from '[^']*(infraestructura/|nucleo/api|\.http')" -- "$WEB/funcionalidades/*/componentes/*" "$WEB/funcionalidades/*/paginas/*" "$WEB/funcionalidades/*/presentacion.tsx"`
  (un `import type` de un contrato compartido se juzga caso a caso).
- **FE-05 · Media** — Una funcionalidad no importa de otra; algo sube a `compartido/` solo si dos o
  más funcionalidades lo usan de verdad, y baja si deja de ser así.
  Fuente: Alberto §4.2 y §4.3. Detecta:
  `git grep -nE "from '[^']*funcionalidades/" -- "$WEB/funcionalidades/*"`; por cada archivo nuevo
  de `compartido/`, `git grep -l '<nombre>' -- "$WEB/funcionalidades" | cut -d/ -f5 | sort -u`.
  Tampoco sube a `app/`: `app/` mira a todo y nadie mira a `app/` (README de la web, ADR-TMS-020).
  Una funcionalidad que importa `@/app/*` cierra un ciclo app → funcionalidad → app que el lint no
  ve si sus grupos prohibidos no incluyen `@/app/*` (O35). Detecta:
  `git grep -nE "from '@/app/" -- "$WEB/funcionalidades/*"`, y que `eslint.config.js` lo prohíba con
  su caso en `reglas-de-lint.prueba.ts`.
  DRY dentro de la web: un gancho que reimplementa lo que ya resuelve una utilidad de `compartido/`
  (V25, `consultasDeMaestra`) es hallazgo de DIS-01.
- **FE-06 · Baja** — Una capa vacía está prohibida: se estrena cuando tiene qué poner dentro.
  Fuente: Alberto §4.2. Detecta: carpetas de capa nuevas en el diff con solo `index.ts` o `.gitkeep`.
- **FE-07 · Alta** — `vocabulario/` guarda listas de códigos cerradas y nada más: no importa nada de
  fuera ni declara funciones, flechas ni clases.
  Fuente: ADR-TMS-020; Alberto §4.4. Detecta:
  `git grep -nE "^import|function |=>|\bclass " -- "$WEB/vocabulario/*"`.
- **FE-08 · Alta** — La red y el almacenamiento salen solo por `nucleo/`: ni `fetch`, ni
  `localStorage`, ni `sessionStorage`, tampoco con `window.` delante.
  Fuente: Alberto §4.5; P-FE-06. Detecta:
  `git grep -nE '\b(window\.)?(fetch|localStorage|sessionStorage)\b' -- "$WEB" | grep -vE "$WEB/nucleo/|\.prueba\."`.
- **FE-09 · Media** — Un solo catálogo de pantallas declara ruta, título, etiqueta, grupo, icono e
  `import()`; el enrutador y el grafo de desarrollo derivan de él.
  Fuente: Alberto §4.5. Detecta:
  `git grep -nE "path: ['\"]/" -- "$WEB" | grep -vE 'catalogo-de-pantallas|\.prueba\.'`.

## Tokens, componentes y contrato

- **FE-10 · Media** — Tamaño de letra, radio y grosor de borde salen del tema: ningún valor arbitrario
  entre corchetes ni color hexadecimal en el markup.
  Fuente: Alberto §4.5; P-FE-03; P-UX-01. Detecta:
  `git grep -nE '\b(text|rounded|border|leading|tracking|p[xytrbl]?|m[xytrbl]?|gap)-\[[^]]+\]' -- "$WEB/*.tsx"`;
  `git grep -nE '#[0-9a-fA-F]{3,8}\b' -- "$WEB/*.tsx"`.
  Excepción decidida: la escala de `z-[…]` del armazón (ADR-TMS-016 §1).
- **FE-11 · Media** — El botón de la aplicación es `<Boton>` o `<BotonDeTexto>` de
  `compartido/componentes/boton`.
  Fuente: Alberto §4.5 (regla `BOTON_ESCRITO_A_MANO`). Detecta:
  `git grep -nE '<button\b' -- "$WEB/*.tsx" | grep -vE 'compartido/componentes/boton|\.prueba\.'`
  y contrastar con las exclusiones de `eslint.config.js`.
- **FE-12 · Media** — Una lista cerrada que puede crecer sin la web no se valida con `z.enum` en el
  cable (`estado` sigue `z.string()`); se compara contra la constante del vocabulario.
  Fuente: Alberto §4.5. Detecta: `git grep -nE 'z\.enum\(' -- "$WEB"` y preguntar si esa lista la
  controla otro sistema.
- **FE-13 · Baja** — El esquema de escritura se deriva del de lectura con `pick` y `safeExtend`.
  Fuente: Alberto §4.5. Detecta: `git diff $BASE...HEAD -- "$WEB/*infraestructura*" | grep -nE '^\+.*z\.object\('`
  en esquemas de escritura.
- **FE-14 · Media** — Las claves de react-query declaran su raíz una vez; ningún prefijo literal
  repetido.
  Fuente: Alberto §4.5; §13 error 6. Detecta:
  `git grep -nE "queryKey: \['" -- "$WEB" | grep -v '\.prueba\.'`.
- **FE-15 · Alta** — Ausente y vacío no son lo mismo: la web no manda `[]` cuando quiso decir «no lo
  toco».
  Fuente: Alberto §4.5. Detecta: `git diff $BASE...HEAD -- "$WEB" | grep -nE '^\+.*\?\? \[\]'` en
  cuerpos de mutación.
- **FE-16 · Baja** — Las props se declaran `readonly` y el componente recibe `Readonly<…>`.
  Fuente: Alberto §4.5; G-181. Detecta: `npm run lint` (`react/prefer-read-only-props`).

## React y TypeScript

- **FE-17 · Media** — `useEffect` sincroniza con sistemas externos: no deriva estado ni carga datos
  al montar; lo remoto lo trae react-query.
  Fuente: ADR-0109 P-FE-08. Detecta:
  `git grep -nE -A4 'useEffect\(' -- "$WEB/*.tsx" "$WEB/*.ts" | grep -E 'set[A-Z][A-Za-z]*\(|fetch\(|clienteHttp'`.
  También cuenta el efecto que empuja un valor derivado al padre por una prop (`onCambiar(`,
  `on[A-Z]…(`), y el que serializa con `JSON.stringify` para esquivar sus dependencias (V24):
  `git grep -nE -A6 'useEffect\(' -- "$WEB" | grep -E 'on[A-Z][A-Za-z]*\(|JSON\.(stringify|parse)'`.
- **FE-18 · Media** — Sin `any`; `as`, `@ts-ignore` y `@ts-expect-error` solo con su porqué escrito
  (los `@ts-expect-error` del contrato de escritura son aserciones intencionales).
  Fuente: ADR-0109 P-FE-05. Detecta:
  `git grep -nE ':\s*any\b|\bas any\b|@ts-ignore|@ts-expect-error' -- "$WEB"`. El `as` sin porqué
  no es solo `as any`: `Object.fromEntries(…) as {…}` o `as SegunLaFila<…>` también (O35, V34).
  Súmale `git grep -nE '\bas [A-Z{(\[]' -- "$WEB" | grep -vE 'as const|\.prueba\.|import '`.
- **FE-19 · Alta** — Toda frontera se valida en runtime antes de tiparla: respuestas HTTP con zod,
  `sessionStorage`, parámetros de ruta y variables de entorno. Se valida la forma y se devuelve el
  objeto original, porque `z.object` poda lo que no declara.
  Fuente: ADR-0109 P-FE-06; Alberto §5. Detecta:
  `git grep -nE 'JSON\.parse\(|as [A-Z][A-Za-z]*(Dto|Respuesta)\b' -- "$WEB" | grep -v '\.prueba\.'`.
- **FE-20 · Media** — El estado de la interfaz cubre cargando, vacío, error y con datos con uniones
  discriminadas, sin banderas contradictorias.
  Fuente: ADR-0109 P-FE-01. Detecta: juicio en los ganchos de `aplicacion/` que el diff toca.
- **FE-21 · Media** — Un `catch` o un `fetch` cuyo fallo no deja rastro: nada de `catch {}` ni de
  `.catch(() => null)` que siga como si nada; mensaje genérico al usuario y detalle al log.
  Fuente: ADR-0165 P-SEC-04; Alberto §13 error 11. Detecta:
  `git grep -nE 'catch \{\s*\}|catch \([a-zA-Z_]*\) \{\s*\}|\.catch\(\(\) => (null|undefined|\{\s*\})\)' -- "$WEB"`.
- **FE-22 · Baja** — `target` y `lib` del `tsconfig` coinciden con lo que se usa: un método de ES2022
  con `target` ES2020 compila por accidente.
  Fuente: Alberto §9. Detecta: `grep -nE '"(target|lib)"' src/apps/web/tsconfig*.json`.

## Seguridad en el cliente

- **FE-23 · Alta** — El carril de desarrollo no existe en producción: la constante la resuelve
  `vite.config.ts` desde `command`, no `import.meta.env.DEV`, y `verificar-bundle.mjs` revisa `dist/`.
  Fuente: Alberto §5. Detecta: `git grep -n 'import.meta.env.DEV' -- "$WEB" | grep -vE '\.prueba\.|^\S+:\s*\*'`;
  `grep -n 'verificar-bundle' src/apps/web/package.json`.
- **FE-24 · Alta** — Salir es salir: `salir()` deja la identidad en `null`, nunca reemite la de
  desarrollo.
  Fuente: Alberto §5. Detecta: `git grep -n -A8 'function salir\|salir =' -- "$WEB/nucleo"`.
- **FE-25 · Crítica** — Todo lo que llega al bundle es público: ningún secreto en `VITE_*` ni en el
  código de cliente; el portador vive en memoria, nunca en `localStorage`.
  Fuente: ADR-0165 P-SEC-02; ADR-0109. Detecta:
  `git grep -niE 'VITE_[A-Z_]*(KEY|SECRET|TOKEN|CLAVE|PASSWORD)' -- src/apps/web`;
  `git grep -niE '(localStorage|sessionStorage)\.setItem\([^)]*(token|portador|jwt)' -- "$WEB"`.
- **FE-26 · Alta** — Ocultar una opción no es control de acceso: toda decisión que la web oculta la
  vuelve a comprobar la API.
  Fuente: ADR-0165 P-SEC-01; RS-UI-UX (prohibido). Detecta: por cada condición de permiso nueva en
  la web, su `@Exige` o `@AcotadaASede` en el controlador (ver SEG-03 y SEG-04).
- **FE-27 · Alta** — `dangerouslySetInnerHTML` solo con DOMPurify; `target="_blank"` con
  `rel="noopener noreferrer"`; todo listener de `postMessage` verifica `event.origin`.
  Fuente: ADR-0165 P-SEC-05; ADR-0153. Detecta:
  `git grep -nE 'dangerouslySetInnerHTML|target="_blank"|addEventListener\(.message' -- "$WEB" | grep -v '\.prueba\.'`.

## Accesibilidad y experiencia

- **FE-28 · Media** — El contraste lo fija una prueba que lee `estilos.css`, no la revisión visual;
  un texto translúcido del color del fondo no llega a AA.
  Fuente: ADR-0110 P-UX-02; Alberto §4.6. Detecta: `contraste-del-armazon.prueba.ts` en verde; un
  par de color nuevo en `estilos.css` sin su caso en la prueba.
- **FE-29 · Media** — El aviso de un campo aparece tras visitarlo, con `aria-invalid` y
  `aria-describedby`, y la prueba lo busca por descripción accesible; el adorno va con `aria-hidden`.
  Fuente: Alberto §4.6. Detecta:
  `git diff $BASE...HEAD -- "$WEB/*.tsx" | grep -nE '^\+.*<(input|select|textarea)'` y comprobar
  los dos atributos en el mismo control.
- **FE-30 · Media** — Todo overlay atrapa el foco, cierra con Escape y devuelve el foco al
  disparador; toda animación respeta `prefers-reduced-motion`; nada de `outline-none` sin
  `focus-visible`.
  Fuente: ADR-0110 P-UX-07 y P-UX-08. Detecta:
  `git grep -nE 'animate-|transition' -- "$WEB/*.tsx" | grep -v motion-reduce`;
  `git grep -n 'outline-none' -- "$WEB/*.tsx" | grep -v focus-visible`.
- **FE-31 · Baja** — Ningún `title` como tooltip salvo que la persona usuaria lo pidiera para ese
  elemento; `aria-label` sí donde la accesibilidad lo exige.
  Fuente: `CLAUDE.md` del TMS §3 («Tooltips: ninguno»). Detecta: `git grep -nE '\btitle=' -- "$WEB/*.tsx"`.
- **FE-32 · Baja** — Cada página pinta su `EncabezadoDePagina`; la cabecera es de ancho completo y la
  escala de capas es la del ADR.
  Fuente: ADR-TMS-016 §1 a §3. Detecta: `git diff --name-only --diff-filter=A $BASE...HEAD -- "$WEB/*paginas*"`
  y buscar `EncabezadoDePagina` en cada una.
- **FE-33 · Media** — El título y los textos de una pantalla dicen lo que hace hoy: una pantalla que
  pasó a solo lectura no se sigue llamando «Mantenimiento de …» (V27), ni en su catálogo ni en el
  README.
  Fuente: Alberto PR#125 V27; GOB-23. Detecta: por cada pantalla cuyas acciones de escritura el diff
  retira, su título en `catalogo-de-pantallas.ts` y en la página.
- **FE-34 · Media** — Un aviso de error se anuncia (`role="alert"`) y no depende solo del color ni de
  un texto `sr-only`. Si la fila queda en rojo, el motivo se lee en pantalla (O34, V30, WCAG 1.4.1 y
  3.3.1).
  Fuente: ADR-0110; Alberto PR#125. Detecta:
  `git grep -nE 'mensajeError|AvisoDe|Aviso[A-Z]' -- "$WEB/*.tsx" | grep -v 'role="alert"'`;
  `git grep -n 'sr-only' -- "$WEB/*.tsx"` y comprobar que el mismo texto existe a la vista.
- **FE-35 · Media** — Un control deshabilitado dice por qué, en texto visible: el botón «Añadir
  viaje» apagado al llegar al máximo, o porque las opciones no cargaron, necesita su línea de ayuda
  (O38, WCAG 3.3.2). El botón de una fila tiene un nombre accesible propio de esa fila, no el mismo
  en todas (V29). Prohibido resolverlo con `title` (FE-31).
  Fuente: ADR-0110; Alberto PR#125. Detecta: `git diff $BASE...HEAD -- "$WEB" | grep -nE '^-.*(de [0-9N]+|ya existe|no se puede)'`
  (textos de ayuda borrados) y `git grep -nE 'disabled=\{' -- "$WEB/*.tsx"` en los componentes del diff.

## Escribir desde un modal

El modal que guarda es donde se cruzan el estado del servidor, el de la pantalla y el testigo
`ultimo_cambio`. Cada ítem salió del PR #125.

- **FE-36 · Media** — El error de una mutación no sobrevive al modal: se instancia dentro del modal
  o se llama a `reset()` al abrir. Si no, el modal de la RD nueva nace con el error de la anterior
  (O33).
  Detecta: `git grep -nE 'use[A-Z][A-Za-z]*\(\)' -- "$WEB/*paginas*"` en ganchos de mutación cuyo
  `mensajeError` se pinta dentro de un modal, y `git grep -n 'reset()' -- "$WEB"`.
- **FE-37 · Media** — Con el envío en curso el modal no se cierra (Escape, la X y «Cancelar»
  respetan `isPending`), o el error que llegue con el modal cerrado se muestra en la página (O33). El
  control que dispara la escritura se deshabilita mientras está en vuelo (V31).
  Detecta: en cada modal del diff que guarda, `isPending` o su equivalente en el `onClose` y en el
  `disabled` del botón.
- **FE-38 · Alta** — Tras un 409 por testigo, el modal toma la fila viva del listado (su
  `ultimoCambio` nuevo), conserva lo escrito y deja reintentar. Si guarda una foto de la fila al
  abrir, cada Guardar repite el 409 hasta cerrar y reabrir (O37). Con SAP como segundo escritor de la
  misma fila, el 409 deja de ser raro (PRE-01).
  Fuente: `CLAUDE.md` del TMS («la UI pide recargar»); BD-08. Detecta:
  `git grep -nE 'enEdicion|filaEnEdicion|ultimoCambio' -- "$WEB/funcionalidades"` y seguir de dónde
  sale la fila que va a `If-Match`.
- **FE-39 · Media** — Un vacío que dispara un efecto destructivo (desvincular la cuenta, dar de baja
  aparatos) se avisa o se confirma antes de guardar (V32, EFE-03).
  Detecta: en cada formulario del diff, qué hace el servidor cuando el campo llega vacío.
