# Checklist — gobernanza y documentación

Reglas del estándar sobre el satélite, su puerta, su registro de gaps y su documentación. Fuentes:
`rules/global-rules.md` (R-), `rules/satellite-repo-rules.md` (S-), `rules/spec-driven-rules.md`
(SD-) del plugin `unimar-core`, el `CLAUDE.md` del proyecto y el documento de Alberto (§10 y §11).

Cada comando se corre desde la raíz del repositorio auditado. Variables que asumen, a pegar delante
en la misma llamada: `BASE=origin/develop`.

## Validadores de unimar-core: qué juzga cada uno

Corren sin `--fix`. Una FALLA es hallazgo con la regla de esta tabla, severidad Alta salvo que la
fila diga otra cosa. Los marcados «aviso» salen 0 aunque encuentren algo: se lee su log.

| Validador | Juzga | Regla |
| --- | --- | --- |
| `validate-madurez.mjs` | Nivel ≥ 2 con evidencia enlazada, nivel < 5 con camino declarado, evidencia que mide lo construido | S-19 |
| `validate-gaps.mjs` | Orden canónico de `GAPS.md`, contadores, fecha de apertura, ningún cierre sin evidencia | S-20 |
| `validate-correspondencia.mjs` | Cada casilla de madurez < 5 tiene al menos un gap en su dimensión | S-19, S-20 |
| `validate-docs.mjs` | UTF-8 sin BOM ni CRLF, texto mutilado (tildes caídas), enlaces relativos y anclas | S-09, S-10, S-30, S-31, SD-06 |
| `validate-mermaid.mjs` | Todo bloque Mermaid declara tipo y cierra sus `subgraph`/`alt`/`loop` | SD-06 |
| `validate-vigencia.mjs` | Ningún pie de copyright fecha su revisión | S-35 (Baja) |
| `validate-retencion-senal.mjs` | Bloque `retencion-senal` de `DECISIONS.md` con las cuatro señales y su piso | S-36 |
| `validate-perfil-artefactos.mjs` | Perfil de artefactos por fase | S-15, ADR-0239 |
| `validate-analisis-estatico.mjs` | Bloque `analisis-estatico`: analizador por runtime, configuración que existe, invocación cableada | S-37, S-44 |
| `validate-ambito-runtime.mjs` | Ámbito de runtime declarado en el front-matter del ADR | S-38 |
| `validate-secciones-prd-historia-tecnica.mjs` | PRD con 13 secciones, historia técnica con 15 | S-39 (Media) |
| `validate-comportamiento-degradado.mjs` | El Blueprint declara qué hace si cada dependencia no responde | S-42 |
| `validate-credencial-en-artefacto.mjs` | Ningún archivo versionado porta una credencial con forma reconocible | S-43 (Crítica) |
| `validate-trazabilidad.mjs` | Ninguna cita `G-NNN` o `ADR-NNNN` cuelga, tampoco en los mensajes de commit sin publicar | SD-02 |
| `validate-satellite-base.mjs` | Historias con Mermaid, sección 2 de actores, sección 3 de requisitos técnicos, historial | S-01 a S-05, S-13 |
| `validate-triaje.mjs` | `DECISIONS.md` triaja todas las reglas; un Override enlaza su ADR | S-15, S-16 |
| `validate-estructura-satelite.mjs` | Raíz `src/`, `CONTRIBUTING.md` con el bucle de retorno, sin `.harness/`, sin marcadores de plantilla | S-16, S-18 |
| `validate-runner.mjs` | `ides` del manifiesto BMAD declara Claude Code y no hay superficie de otro runner | S-17 (Baja) |
| `validate-ubicacion-artefactos.mjs` | Artefactos SDLC en la carpeta de su fase | S-01 a S-05, S-18 |
| `validate-cadena-artefactos.mjs` | Cadena PRD → FS → US → TS + ADR → TSR → RN completa | SD-02, ADR-0178 |
| `validate-demandas.mjs` | Fichas de demanda entre sistemas | ADR-0132 |
| `validate-prd-index.mjs` | `initiatives-index.json` publicado y con todos los PRD | S-25 |
| `validate-vinculacion-estandar.mjs` | Pin del estándar versionado, fijado a etiqueta y que gobierna | S-28 |
| `validate-s24-fase1.mjs` | Artefactos de Fase 1 sin calendario (gantt, fechas de entrega, trimestres) | S-24 |
| `validate-adr-numeracion.mjs` | Dos ADR de ramas distintas no llevan el mismo número (pregunta al remoto) | S-26 |
| `validate-identificadores.mjs` | Tampoco repiten número una regla ni una ficha de gap | S-26, S-20 |
| `validate-criterios.mjs` | Criterios de aceptación con adjetivo vago y sin ancla medible (aviso) | SD-04 (Baja) |
| `validate-gates-locales.mjs` | Puerta local activa, gitleaks, auditoría de dependencias, umbral de cobertura, commitlint (aviso) | S-23 (Media) |
| `validate-suite.mjs` | Modelo Suite → Sistema → PRD (aviso) | ADR-0120 (Baja) |
| `validate-redaccion-log.mjs` | Bloque `redaccion-log` cubre las seis clases de dato personal | S-34 |
| `install-hooks.mjs --check` | git ejecuta de verdad la puerta `pre-push` y no quedan `pre-commit` ni `commit-msg` | S-12 |

## Puerta y vinculación al estándar

- **GOB-01 · Alta** — El pin del estándar está versionado, fijado a una etiqueta `unimar-core-x.y.z`
  y gobierna el checkout del CI.
  Fuente: S-28; ADR-0180. Detecta: `validate-vinculacion-estandar.mjs`;
  `git ls-files .github/workflows/gobernanza.yml`;
  `grep -nE 'STANDARD_REF:|env.STANDARD_REF' .github/workflows/gobernanza.yml`.
- **GOB-02 · Media** — El pin no quedó atrás de la última etiqueta publicada.
  Fuente: S-28; ADR-0195 (deriva del pin). Detecta:
  `git ls-remote --tags --refs https://github.com/unimar-peru/unimar-marketplace.git 'unimar-core-*' | sed 's#.*/##' | sort -V | tail -1`
  frente a `STANDARD_REF`; o `node "$UNIMAR_CORE/scripts/check-upstream.mjs"`.
- **GOB-03 · Alta** — La puerta local corre de verdad: `core.hooksPath` apunta a `.husky` y no hay
  hooks retirados.
  Fuente: S-12; ADR-0170; ADR-TMS-018 D1. Detecta: `git config --get core.hooksPath`;
  `node "$UNIMAR_CORE/scripts/install-hooks.mjs" --check`; `ls .husky`.
- **GOB-04 · Media** — `pre-push` y CI encadenan los mismos validadores.
  Fuente: S-12 («encadena los mismos validadores»). Detecta:
  `diff <(grep -oE 'validate-[a-z0-9-]+\.mjs' .husky/pre-push | sort -u) <(grep -oE 'validate-[a-z0-9-]+\.mjs' .github/workflows/gobernanza.yml | sort -u)`.
- **GOB-05 · Alta** — La puerta no muta el árbol: sin `--fix` ni `git add` en hooks ni workflows.
  Fuente: S-12; S-20; ADR-TMS-018; Alberto §11. Detecta:
  `grep -nE -- '--fix|git add' .husky/* .github/workflows/*.yml`.
- **GOB-06 · Alta** — Sin copia del estándar en el satélite: ni `.harness/` ni `inherited.lock`.
  Fuente: S-16. Detecta: `git ls-files .harness inherited.lock | head`.
- **GOB-07 · Alta** — La rama no toca la zona protegida del estándar.
  Fuente: S-16; S-21 (`hook-guard-standard.mjs`). Detecta:
  `git diff --name-only $BASE...HEAD -- .harness .claude/agents .claude/settings.json`.
- **GOB-08 · Media** — Los gates de calidad y seguridad están cableados en local: gitleaks,
  auditoría de dependencias, linters, pruebas con umbral de cobertura que falla por debajo y
  commitlint sobre el rango que se publica.
  Fuente: S-23; ADR-0106 P-LOCAL-01; ADR-TMS-018. Detecta: `validate-gates-locales.mjs`;
  `grep -nE 'gitleaks|npm audit|semgrep|commitlint|test:cobertura' .husky/pre-push`.
- **GOB-09 · Media** — El analizador estático está declarado por runtime (Node.js, .NET, Android)
  en `DECISIONS.md` y su invocación está cableada; un umbral propio declara valor, techo y descenso.
  Fuente: S-37; S-44; ADR-0056 D4. Detecta: `validate-analisis-estatico.mjs`;
  `sed -n '/analisis-estatico:inicio/,/umbrales-propios:fin/p' DECISIONS.md`.

## Decisiones, ADR y trazabilidad

- **GOB-10 · Media** — `DECISIONS.md` triaja todas las reglas S-01 a S-44 (S-41 no existe) con
  operación canónica; todo Override enlaza su ADR.
  Fuente: S-15; S-16. Detecta: `validate-triaje.mjs`; `grep -oE '^\| S-[0-9]+' DECISIONS.md | sort -u | wc -l`.
- **GOB-11 · Media** — El ADR local se llama `ADR-<SIGLA>-NNN` (nunca `ADR-NNNN`) y lleva el
  front-matter del núcleo (`adr`, `estado`, `supersede`, `deprecia_reglas`).
  Fuente: S-15; S-27. Detecta:
  `for f in reference/architecture/adrs/*.md; do head -1 "$f" | grep -q '^---' || echo "sin front-matter: $f"; done`.
- **GOB-12 · Alta** — Una decisión técnica nueva (librería, motor, patrón, topología) tiene ADR
  aceptado antes que el código, y toda dependencia nueva está en el stack autorizado del proyecto.
  Fuente: SD-03; S-06; S-07; R-06; RS-DEV (prohibido). Detecta:
  `git diff $BASE...HEAD -- '*package.json' | grep -E '^\+\s+"[@a-z]'` y contrastar con
  `reference/architecture/stack/stack-tecnologico-autorizado-tms.es.md` y los ADR. También Gradle:
  `git diff $BASE...HEAD -- '*libs.versions.toml' '*.gradle.kts' | grep -nE '^\+.*(alpha|beta|rc|SNAPSHOT)'`
  (AND-10).
- **GOB-13 · Media** — Un ADR aceptado se enmienda por su historial, con la razón; no se edita en
  silencio.
  Fuente: Alberto §1 («si la premisa cambia, la decisión cambia y consta») y §10. Detecta:
  `git diff $BASE...HEAD -- reference/architecture/adrs/` y comprobar que el diff añade fila a su
  historial o nota de enmienda.
- **GOB-14 · Media** — Una cita a otro repositorio se califica `<repositorio>#<id>`; una cita
  local resuelve en este repositorio.
  Fuente: SD-02. Detecta: `validate-trazabilidad.mjs`;
  `git log --format=%B $BASE..HEAD | grep -oE '\b(ADR-[0-9]{4}|G-[0-9]{3})\b' | sort -u` y buscar
  cada una en `GAPS.md` o `reference/`.
- **GOB-15 · Media** — La especificación precede al código: el cambio de comportamiento tiene
  historia, gap o ADR, y el commit lo cita.
  Fuente: SD-01; SD-02. Detecta: `git log --format='%h %s%n%b' $BASE..HEAD | grep -cE 'G-[0-9]{3}|US-TMS-|HT-|ADR-TMS-'`
  frente al número de commits de la rama.
- **GOB-16 · Alta** — Dos ramas no reclaman el mismo número de ADR, regla o gap.
  Fuente: S-26. Detecta: `validate-adr-numeracion.mjs`; `validate-identificadores.mjs`.

## Registro de gaps y madurez

- **GOB-17 · Media** — Todo hallazgo del cambio está en `GAPS.md` con dimensión, criticidad y
  complejidad, y no solo en el cuerpo del PR.
  Fuente: SD-07; S-20. Detecta: `git diff $BASE...HEAD -- GAPS.md` frente a los problemas que el
  propio diff admite (comentarios «pendiente», `TODO`, «queda para después»):
  `git diff $BASE...HEAD | grep -nE '^\+.*(TODO|FIXME|pendiente|queda para)'`.
  Los pendientes de una auditoría anterior de la misma rama también cuentan. Si la descripción del
  PR dice «quedan N pendientes anotados», esos N están en `GAPS.md`, no en un reporte fuera del
  repositorio (R1.2: decía 11 y `GAPS.md` seguía en 53, igual que develop).
- **GOB-18 · Alta** — Cerrar un gap exige evidencia enlazada: commit, PR o ADR.
  Fuente: SD-05; S-20; Alberto §10. Detecta: `validate-gaps.mjs`; en el diff de `GAPS.md`, cada
  fila que pasa a `Cerrado` cita un hash, PR o ADR.
- **GOB-19 · Baja** — No se abre un gap por algo que se cierra en el mismo cambio.
  Fuente: Alberto §10. Detecta: en el diff de `GAPS.md`, filas que nacen ya cerradas.
- **GOB-20 · Media** — `MADUREZ.md`: nivel ≥ 2 con evidencia, nivel < 5 con su gap.
  Fuente: S-19. Detecta: `validate-madurez.mjs`; `validate-correspondencia.mjs`.

## Documentación

- **GOB-21 · Alta** — Enlaces relativos y anclas resuelven; UTF-8 sin BOM ni CRLF; tildes intactas.
  Fuente: SD-06; S-09; S-10; R-03. Detecta: `validate-docs.mjs`;
  `git ls-files --eol | grep -E 'w/(crlf|mixed)'`.
- **GOB-22 · Media** — Todo Mermaid compila; un `;` dentro del texto de un mensaje corta el bloque.
  Fuente: SD-06; Alberto §10. Detecta: `validate-mermaid.mjs`;
  `git grep -nE '^\s*[A-Za-z0-9_]+\s*(->>|-->>|->|-->|-x|--x|-\))[+-]?\s*[A-Za-z0-9_]+\s*:.*;' -- '*.md'`.
- **GOB-23 · Media** — La prosa no afirma lo que el árbol desmiente: rutas, `npm run X`, workflows,
  nombres que la configuración declara, y cifras con sello vencido.
  Fuente: Alberto §10; G-102. Detecta: `node scripts/validar-prosa.mjs --estricto` y su banco
  `node scripts/validar-prosa.prueba.mjs`. `validar-prosa` solo juzga rutas, comandos y sellos. Lo
  que no ve se coteja a mano en cada documento que el diff toca:
  - **Nombres sin enlace.** Cada migración citada por nombre existe con ese timestamp (O31: la
    historia técnica citaba cuatro que no existen y cuyos timestamps son de otras).
  - **Promesas de un contrato.** «Reintenta con el mismo `idSolicitud`» o «`activo:false` equivale
    al `DELETE`» se comprueban en el código (O16, O23).
  - **Comentarios que describen una regla.** «El portal comparte las reglas del recorrido» se
    comprueba contra lo que hace la función (O18).
  - **Un arreglo que deja dos reglas del mismo documento en contradicción** (O23: la regla 5 del
    contrato chocó con la 9 tras el arreglo `5aee1c9e`).

  `git diff $BASE...HEAD -- '*.md' | grep -oE '1[0-9]{12}-[A-Za-z]+' | sort -u` y, por cada uno,
  `git ls-files "*<nombre>*"`.
- **GOB-24 · Baja** — Una cifra que debe mantenerse al día lleva sello
  `<!-- sello: AAAA-MM-DD · ruta, ruta -->`.
  Fuente: Alberto §10. Detecta: `git diff $BASE...HEAD -- '*.md' | grep -E '^\+.*[0-9]{2,} (pruebas|suites|tablas|migraciones|rutas)'`
  y comprobar el sello en esa sección. Cada migración nueva tiene su fila, con su reversibilidad, en
  la tabla de migraciones de `docs/05-entrega/preparacion-de-la-entrega-tms.es.md`. Si el PR trae
  migraciones y ese documento no cambia, es hallazgo (R1.6: la tabla terminaba en `1792713600000` y
  el PR traía nueve más).
- **GOB-25 · Media** — Documentación solo en español, sin pares bilingües.
  Fuente: S-09; SD-08; R-04. Detecta: `git ls-files '*.en.md' '*.en.*'`.
- **GOB-26 · Media** — markdownlint sobre el corpus versionado entero, no sobre el diff.
  Fuente: S-18 (`.markdownlint.json` sin divergencia); Alberto §11. Detecta:
  `npx --yes markdownlint-cli@0.39.0 --config .markdownlint.json $(git ls-files '*.md')`.
- **GOB-27 · Media** — Historias funcionales y épicas con Mermaid, actores en la sección 2 y
  requisitos técnicos en la sección 3; todo artefacto con historial de cambios.
  Fuente: S-02 a S-05; S-13; R-28 a R-30. Detecta: `validate-satellite-base.mjs`.
- **GOB-28 · Media** — Artefactos de Fase 1 sin calendario: sin `gantt`, fechas de entrega ni
  trimestres.
  Fuente: S-24. Detecta: `validate-s24-fase1.mjs`.

## Estructura del repositorio y commits

- **GOB-29 · Media** — `src/` es la raíz de fuente única: no hay código ejecutable fuera de `src/`
  salvo configuración y herramientas de gobernanza.
  Fuente: S-18; ADR-0107. Detecta:
  `git ls-files | grep -E '\.(ts|tsx|js|kt|kts|cs)$' | grep -vE '^(src|scripts|\.husky|\.github|_bmad|\.claude)/' | cut -d/ -f1-2 | sort | uniq -c`
  y contrastar con `DECISIONS.md` (en el TMS, `apps/unitrans-android` está fuera de `src/`).
- **GOB-30 · Baja** — `CONTRIBUTING.md` documenta el bucle de retorno al núcleo.
  Fuente: S-18. Detecta: `validate-estructura-satelite.mjs`; `grep -n 'núcleo' CONTRIBUTING.md`.
- **GOB-31 · Baja** — Los mensajes de commit de la rama cumplen Conventional Commits.
  Fuente: S-23 (formato de commits); Alberto §10. Detecta:
  `for c in $(git rev-list $BASE..HEAD); do git log -1 --format=%B $c | npx --no-install commitlint || echo "commit $c"; done`
  (requiere `node_modules` en la raíz). Sin `node_modules`, no se da por NO EJECUTADA sin más: el
  respaldo es
  `git log --no-merges --format='%h %s' $BASE..HEAD | grep -vE '^[0-9a-f]+ (feat|fix|docs|refactor|test|chore|perf|build|ci|style|revert)(\([^)]+\))?!?: '`
  (R1.5: 36 de 183 commits como «up» o «data maestra»). También se revisan el nombre de la rama
  (`feature/TMS-*`) y el título del PR.
- **GOB-32 · Baja** — `CODEOWNERS` existe en `main` y en `develop`: GitHub lo lee de la rama destino.
  Fuente: Alberto §10. Detecta: `MSYS_NO_PATHCONV=1 git show origin/main:.github/CODEOWNERS` y
  `MSYS_NO_PATHCONV=1 git show origin/develop:.github/CODEOWNERS`.
- **GOB-33 · Baja** — Un solo runner de agente versionado (Claude Code) y BMAD en la versión del
  manifiesto.
  Fuente: S-17; ADR-0219. Detecta: `validate-runner.mjs`; `git ls-files .opencode .agents | head`.

## El PR como entregable

Se revisan en el paso 6 (cierre antes del PR), o cuando el alcance es un PR abierto.

- **GOB-34 · Alta** — La descripción del PR no afirma lo que el árbol desmiente. Afirmaciones que
  se cayeron en el PR #125:
  - «Las pruebas contra la base real las valida el CI» (R1.1): el único workflow es `gobernanza.yml`.
  - «Quedan 11 pendientes anotados» (R1.2): no estaban en `GAPS.md`.
  - Casillas del checklist sin marcar e «Issue relacionado» sin número (R1.4).

  Fuente: Alberto PR#125 R1; GOB-23. Detecta: cada frase de la descripción que nombre CI, pruebas,
  gaps, migraciones o cifras, contra `.github/workflows/`, `GAPS.md` y el diff.
- **GOB-35 · Media** — El PR tiene un solo propósito revisable. Si mezcla cambios independientes,
  como maestras, carga suelta, Android, infraestructura y un plan de pruebas de 5,9 MB, el reporte
  recomienda partirlo y dice qué partes no dependen de las otras (R1.7). Un binario generado
  grande en el diff (`.xlsx`, matrices CSV) se cuestiona.
  Fuente: Alberto PR#125 R1.7. Detecta: `git diff --stat $BASE...HEAD | tail -1`;
  `git diff --name-only $BASE...HEAD | cut -d/ -f1-3 | sort | uniq -c | sort -rn | head`;
  `git diff --numstat $BASE...HEAD | awk '$1=="-"'` (binarios).
- **GOB-36 · Alta** — El reporte dice qué se rompe al fusionar y cómo desplegar:
  - Una ruta que queda en 403 hasta que otro sistema cierre su gap (G-117: sin
    `ServiceAccount`, nadie puede dar de alta maestras).
  - Migraciones que retiran columnas y su orden frente a otras ramas.
  - Contratos nuevos con terceros (SAP, XMS) que necesitan fecha de salida acordada (R1.8, R1.9).

  Fuente: Alberto PR#125 R1.8; ADR-TMS-024. Detecta: gaps abiertos que el código del diff da por
  cerrados (`git grep -nE 'G-[0-9]{3}' -- src/apps` frente a su estado en `GAPS.md`) y rutas nuevas
  hacia o desde otro sistema.
