# Checklist — Android Kotlin (UNITRANS)

La auditoría completa de la app la hace la skill `/auditor-movil` (catorce dimensiones, OWASP MASVS,
Compose, corrutinas, Gradle). Este archivo cubre lo que el **estándar Unimar** y los ADR del TMS
le exigen a la app y a su frontera con la API, para que el reporte de Peter no quede ciego cuando el
alcance toca `apps/unitrans-android/**`. Gradle (`libs.versions.toml`, `*.gradle.kts`) y la
configuración de red (`res/xml/*`) **sí** se revisan aquí: el PR #125 subió una dependencia de
seguridad a alfa y nadie la miró (AND-10).

Si el alcance toca más que esta frontera, deja escrito en el reporte:
«Auditoría de la app pendiente: `/auditor-movil apps/unitrans-android`».

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; APP=apps/unitrans-android; API=src/apps/api/src`.

## Ítems

- **AND-01 · Media** — El código de la app vive bajo `src/`, la raíz de fuente única; si no, la
  excepción consta en `DECISIONS.md`.
  Fuente: S-18; ADR-0107; ADR-TMS-009 («UNITRANS sale del monorepo Node»). Detecta:
  `git ls-files "$APP" | head -1` y `grep -n 'unitrans-android' DECISIONS.md`.
- **AND-02 · Media** — El runtime `android` declara su analizador estático (Detekt y ktlint, con los
  umbrales de ADR-0056 D4: `LongMethod` 50, `LongParameterList` 3, `CyclomaticComplexMethod` 10,
  `NestedBlockDepth` 3); `sin-analizador` exige un gap abierto.
  Fuente: S-37; S-44; ADR-0056 D3 y D4. Detecta:
  `sed -n '/analisis-estatico:inicio/,/analisis-estatico:fin/p' DECISIONS.md`;
  `git ls-files "$APP" | grep -iE 'detekt|ktlint'`. En el TMS consta `sin-analizador (G-197)`: es
  «Conocido», no hallazgo nuevo, mientras G-197 siga abierto.
- **AND-03 · Alta** — La app es lector tolerante del contrato: todo DTO de entrada que solo consume
  UNITRANS lleva `@ContratoDelTelefono()` en la API, y `contrato-unitrans.spec.ts` (que lee las rutas
  del Kotlin) sigue en verde tras el cambio.
  Fuente: ADR-TMS-009 1.1.0; G-150. Detecta: `git diff --name-only $BASE...HEAD -- "$APP" | grep -E 'red/|Dtos'`
  y correr `(cd src/apps/api && npx --no-install jest src/modules/planificacion/api/contrato-unitrans.spec.ts)`.
- **AND-04 · Alta** — La app no convierte zonas horarias: pinta el offset que recibe y manda el
  suyo; el reloj del teléfono viaja como `fecha_evento`, nunca como `fecha_creacion`.
  Fuente: ADR-TMS-013 D2 y D4. Detecta:
  `git grep -nE 'ZoneId|TimeZone|withZoneSameInstant|toInstant\(|UTC' -- "$APP"`.
- **AND-05 · Alta** — El autor y la sede no viajan en el cuerpo de ningún gesto: los pone la API
  desde la sesión.
  Fuente: ADR-TMS-017 D4; ADR-TMS-009 1.1.0 («lo que no cambia»). Detecta:
  `git grep -nE '(usuario|autor|idSucursal|sede)\s*[:=]' -- "$APP/*Dtos*.kt" "$APP/*GestoDelTelefono.kt"`.
- **AND-06 · Alta** — Un gesto reenviado es idempotente: lleva su clave de origen y la API responde
  con lo ya escrito (`repetida: true`).
  Fuente: commit `e1bb9a1` (G-225, G-174); ADR-TMS-024 D2 (idempotencia del `PUT`). Detecta:
  `git grep -nE 'claveOrigen|clave_origen|idempot' -- "$APP"`.
- **AND-07 · Media** — Errores como valor (`sealed` `Result`), no excepciones que cruzan capas.
  Fuente: ADR-0056 D2 R6; stack Android del estándar; CP-11. Detecta:
  `git grep -nE 'catch \(e: Exception\)|runCatching' -- "$APP"` y leer qué hace cada rama.
- **AND-08 · Media** — Todo identificador en español, salvo lo que impone Android o Compose.
  Fuente: `CLAUDE.md` del TMS, «Todo en español». Detecta:
  `git diff $BASE...HEAD -U0 -- "$APP" | grep -nE '^\+.*\bfun (get|set|handle|load|fetch|update)[A-Z]'`.
- **AND-09 · Crítica** — Ningún secreto en el código ni en los recursos; el portador no se guarda en
  claro. Un certificado público de CA para UAT no es secreto.
  Fuente: S-43; ADR-0165 P-SEC-02. Detecta:
  `git grep -niE '(api[_-]?key|secret|password|clave)\s*=\s*"' -- "$APP"`; el detalle MASVS lo cubre
  `/auditor-movil`.

- **AND-10 · Alta** — Ninguna dependencia del camino de la sesión sale de una versión alfa, beta o
  `rc` sin el motivo escrito en el commit: `security-crypto` protege el almacén del portador (O32,
  `1.0.0` → `1.1.0-alpha06` sin mención).
  Fuente: ADR-0165 P-SEC-03; GOB-12. Detecta:
  `git diff $BASE...HEAD -- "$APP/gradle/libs.versions.toml" "$APP/*.gradle.kts" | grep -nE '^\+.*(alpha|beta|rc|SNAPSHOT)'`.
- **AND-11 · Media** — La configuración de red de cada tipo de build confía en un nombre, no en una
  IP. Si se ata a una IP, consta por qué y qué pasa cuando cambia: reinstalar el APK (V36). El tipo
  `uat` no es depurable y no escribe el token de Firebase en el log (reporte del 29/09, #21).
  Fuente: Alberto PR#125 V36; `docs/05-entrega/entornos-tms.md`. Detecta:
  `git grep -nE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' -- "$APP/app/src/*/res/xml/*" "$APP/*.gradle.kts"`;
  `git grep -nE 'isDebuggable = true|Log\.[dive]\([^)]*(token|Token)' -- "$APP"`.
- **AND-12 · Media** — Diseño en Kotlin con la misma vara que en la API (DIS-01, DIS-08): un mapa
  de pendientes reimplementado al lado del que ya existe (V38), o el KDoc que explicaba un porqué
  borrado (BE-36).
  Detecta: `git diff $BASE...HEAD -U0 -- "$APP" | grep -nE '^-\s*(/\*\*|\*|//)'`.

## No verificable desde esta máquina

Si Kotlin no compila aquí (G-197 lo registra en el TMS), cualquier afirmación sobre si la app
compila o pasa sus pruebas va a «No verificado». No se instala el SDK de Android para auditar.
