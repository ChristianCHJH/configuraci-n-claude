# Checklist — seguridad y observabilidad

Identidad, sede, secretos, superficie expuesta, datos personales en logs y trazas. Fuentes:
ADR-TMS-017 (fallar cerrado), ADR-TMS-019 (trazabilidad narrativa), ADR-TMS-021 (API en Internet
abierto), ADR-TMS-022 (correlación con XMS), ADR-0165 (P-SEC), ADR-0106 (P-LOCAL), ADR-0193 y S-34
(dato personal fuera del log), S-36 (retención por señal), S-42 (comportamiento degradado), S-43
(credencial en artefacto), la skill `seguridad-aplicaciones` del plugin y el documento de Alberto
(§5, §7).

Regla del auditor: un secreto se reporta con archivo:línea y tipo, **nunca con su valor**.

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; WEB=src/apps/web/src`.

## Puertas de seguridad a correr (paso 2)

```bash
gitleaks git --log-opts="origin/develop..HEAD" --config .gitleaks.toml --redact --no-banner
semgrep --config p/owasp-top-ten --error --quiet --metrics=off src/
(cd src/apps/api && npm audit --omit=dev --audit-level=high)
(cd src/apps/web && npm audit --omit=dev --audit-level=high)
node "$UNIMAR_CORE/scripts/validate-credencial-en-artefacto.mjs"
node "$UNIMAR_CORE/scripts/validate-redaccion-log.mjs"
(cd src/apps/api && npx --no-install jest src/shared/seguridad/cobertura-de-rutas.spec.ts src/shared/api/cobertura-de-sede.spec.ts)
```

Sin `gitleaks` o sin `semgrep` instalados, la puerta es NO EJECUTADA: ADR-TMS-018 D3 acepta que el
`pre-push` las omita con aviso, pero el reporte no las da por buenas.

## Identidad y autoría

- **SEG-01 · Crítica** — El autor de una escritura sale de la sesión (`@Autor()`, `@Escribe()`),
  nunca del cuerpo: un DTO de entrada que declara `usuario` responde 400.
  Fuente: ADR-TMS-017 D4; Alberto §5; §13 error 4; G-071; G-089. Detecta:
  `git grep -nE '^\s+(usuario|autor|firmante)[?!]?:' -- "$API/*dto*.ts"`;
  `git grep -nE 'cuerpo\.usuario\b|dto\.usuario\b|body\.usuario\b' -- "$API"`.
  (Los campos `usuarioCreador` y `usuarioActualizador` de los DTO de respuesta son lectura.)
- **SEG-02 · Crítica** — La sede sale del portador (`sedeDeLaPeticion()`, `exigirSede()`), nunca del
  cuerpo; sin sede, 403 en el borde, antes de archivar nada.
  Fuente: Alberto §5; G-163. Detecta:
  `git grep -nE '^\s+(idSucursal|sucursal|idSede|sede)[?!]?:' -- "$API/*dto*.ts"`.
- **SEG-03 · Crítica** — Toda ruta declara quién puede usarla: `@Exige`, `@Publico` o
  `@SoloIdentidad`; una clase con `@Exige` declara `@ApiBearerAuth`.
  Fuente: Alberto §5; ADR-TMS-021 D3. Detecta: `cobertura-de-rutas.spec.ts` en verde (lee el fuente
  del disco); por cada `@(Get|Post|Put|Patch|Delete)(` nuevo del diff, su decorador.
- **SEG-04 · Crítica** — Aislamiento por sede: las rutas que actúan sobre un servicio o una cita por
  su identificador llevan `@AcotadaASede` (404 sobre lo ajeno), y toda lectura —también resúmenes,
  contadores y bultos— filtra por `sedeParaFiltrar()`, una sola función.
  Fuente: G-118; G-163; Alberto §6.5; ADR-TMS-021 D6; ADR-0010. Detecta:
  `cobertura-de-sede.spec.ts` en verde; en el diff, cada `SELECT` nuevo sobre tablas con sucursal sin
  `sedeParaFiltrar`: `git diff $BASE...HEAD -- "$API" | grep -nE '^\+.*(FROM|JOIN) (dbo\.)?[a-z_]+'`.
- **SEG-05 · Crítica** — Fallar cerrado: `GUARD_MODO` vale `bloqueo` por omisión; `auditoria` es
  herramienta de migración e incoherente con `NODE_ENV=production`; `AUTENTICACION=false` en
  producción aborta el arranque (`exigirCoherenciaDeSeguridad`). Sin UMS no se entra.
  Fuente: ADR-TMS-017 D1 a D3; Alberto §5; §13 error 5. Detecta:
  `git grep -nE "GUARD_MODO|AUTENTICACION|exigirCoherenciaDeSeguridad" -- "$API" | grep -v '\.spec\.ts'`
  y leer el valor por omisión.
- **SEG-06 · Alta** — Ningún valor por omisión falla abierto: permiso, bandera o comprobación que
  ante la duda dice que sí.
  Fuente: ADR-0165 P-SEC-04; Alberto §13 error 5. Detecta:
  `git grep -nE "(\?\?|\|\|) true\b|catch[^{]*\{[^}]*return true" -- "$API" | grep -v '\.spec\.ts'`
  (un `estado ?? true` de una maestra nueva es dato, no permiso: se descarta al leerlo). Fallar
  abierto también es escuchar en todas las interfaces o entrar como `sa` por omisión (V41, INF-15):
  `git grep -nE "'0\.0\.0\.0'|=0\.0\.0\.0|DB_USUARIO=sa\b" -- src/apps '*.env*'`.
- **SEG-07 · Crítica** — El portador vale para el TMS o no vale: se exige `aud` (`UMS_AUDIENCIA`) y
  que `sys_suite` sea la del TMS; un token sin `sys_suite` se rechaza.
  Fuente: ADR-TMS-021 D2; Alberto §5. Detecta:
  `git grep -nE 'UMS_AUDIENCIA|sys_suite|audience' -- "$API/shared/seguridad/*"` y su diff.
- **SEG-08 · Crítica** — El carril `@ClaveDeSistema` (`x-api-key`) es excepción acotada a dos rutas:
  sin valor por omisión fuera de `development` y `test`, 32 caracteres o más, rechaza el prefijo
  `desarrollo-`, rota con `*_CLAVE_ANTERIOR`.
  Fuente: ADR-TMS-021 D7; G-144; G-145. Detecta:
  `git grep -n '@ClaveDeSistema(' -- "$API" | grep -v '\.spec\.ts'` (debe dar 2) y el diff de
  `clave-de-sistema.ts`.

## Superficie expuesta

- **SEG-09 · Alta** — El límite de ritmo cuenta clientes: `API_SALTOS_DE_PROXY` en cero por omisión;
  `ThrottlerGuard` antes de verificar y `LimiteDeRitmoPorSujeto` después de `GuardUms`.
  Fuente: ADR-TMS-021 D4; Alberto §5. Detecta:
  `git grep -nE "trust proxy|API_SALTOS_DE_PROXY|LimiteDeRitmoPorSujeto|SkipThrottle" -- "$API"`.
- **SEG-10 · Alta** — Helmet global antes de cualquier ruta; ninguna concesión de CSP o CORS
  (`unsafe-inline`, `unsafe-eval`, origen `*`) sin la medición que la justifique.
  Fuente: Alberto §5; §13 error 13; ADR-0165 §2.2. Detecta:
  `git grep -nE "helmet|unsafe-inline|unsafe-eval|origin: '\*'|origin: true" -- src/apps`. Las
  cabeceras de la web se comprueban en **cada** despliegue: el nginx del chart y el `web.config` de
  IIS (INF-12, O3).
- **SEG-11 · Alta** — Ningún stage de Docker corre como root (`USER node`); la web sirve con
  `nginx-unprivileged`.
  Fuente: Alberto §5. Detecta: `grep -nE '^(FROM|USER)' src/apps/*/Dockerfile`.
- **SEG-12 · Crítica** — Ningún archivo versionado porta una credencial, y un secreto se busca en los
  commits que se publican, no solo en el árbol.
  Fuente: S-43; S-23; ADR-0106; Alberto §5. Detecta: la puerta `gitleaks` de arriba;
  `validate-credencial-en-artefacto.mjs`;
  `git ls-files | grep -iE '(^|/)\.env$|(^|/)secretos/|\.(pem|pfx|p12|key|jks|keystore)$'`
  (un certificado público de CA no es secreto: se descarta al leerlo).
- **SEG-13 · Alta** — Archivos subidos: el tipo se deduce por bytes mágicos (JPEG, PNG, WebP, PDF) y
  es el que se guarda; el nombre lo genera el servidor; hay cuota; la descarga sale con el MIME
  guardado, sin el nombre original y acotada a sede o dueño.
  Fuente: G-159; G-135; G-160; skill `seguridad-aplicaciones` (02). Detecta:
  `git grep -nE 'originalname|\.mimetype' -- "$API" | grep -v '\.spec\.ts'` y comprobar que no
  decide el tipo ni la ruta de almacenamiento.
- **SEG-14 · Alta** — El cliente saliente exige `https` fuera de `development` y `test`, no sigue
  redirecciones, acota el cuerpo y el tiempo, y pasa por `enviarConCorrelacion`.
  Fuente: G-164; ADR-TMS-019 D1; ADR-TMS-022. Detecta:
  `git grep -nE '\bfetch\(|axios|http\.request\(' -- "$API" | grep -vE 'cliente-http-saliente|\.spec\.ts'`.
  Si la llamada emite algo irreversible, el reintento tras un timeout lleva la **misma** clave de
  idempotencia, o el contrato no promete deduplicar (TRX-01, O16).
- **SEG-15 · Alta** — Dependencias: `npm audit --omit=dev --audit-level=high` limpio; un `overrides`
  se acota por rama del árbol y se justifica con el salto mínimo.
  Fuente: Alberto §9; S-23; ADR-0165 P-SEC-03. Detecta: la puerta de arriba;
  `git diff $BASE...HEAD -- '*package.json' | grep -nA3 '"overrides"'`.
- **SEG-16 · Media** — Acciones del CI fijadas por SHA y lockfile versionado.
  Fuente: ADR-0165 P-SEC-03. Detecta:
  `grep -nE 'uses: [^@]+@' .github/workflows/*.yml | grep -vE '@[0-9a-f]{40}'`;
  `git ls-files '*package-lock.json'`.
- **SEG-17 · Baja** — Un valor de `.env` con `#` va entrecomillado: dotenv lo corta en el primer `#`.
  Fuente: Alberto §9. Detecta: `grep -nE "^[A-Z_]+=[^\"'].*#" .env.example`.

## Datos personales y observabilidad

- **OBS-01 · Crítica** — El dato personal no llega al log: el saneador recorre a cualquier
  profundidad y su lista delimitada por `redaccion-log` cubre las seis clases del piso (credencial,
  token, cabecera de autenticación, documento de identidad, contacto, medio de pago).
  Fuente: S-34; ADR-0193; Alberto §7; G-218. Detecta: `validate-redaccion-log.mjs`;
  `git grep -niE "(logger|log|console)\.(info|warn|error|debug|log)\([^)]*(dni|documento|telefono|correo|email|password|token|brevete|tarjeta)" -- src/apps | grep -vE '\.spec\.|\.prueba\.'`.
- **OBS-02 · Alta** — Las bitácoras tampoco guardan el dato personal en claro (DNI y brevete del
  intento de guía van redactados).
  Fuente: G-172; ADR-0193. Detecta: por cada `INSERT` nuevo en una bitácora, qué columnas con dato
  personal escribe y si pasan por `redaccion-del-intento.ts` o equivalente.
- **OBS-03 · Media** — El desenlace de cada petición se emite siempre: el middleware escucha
  `finish` y `close`.
  Fuente: ADR-TMS-019 D3; Alberto §7. Detecta: `git grep -nE "on\('(finish|close)'" -- "$API"`.
- **OBS-04 · Media** — El error se registra una vez, donde se maneja: prohibido registrar y relanzar.
  Fuente: ADR-TMS-019 D4. Detecta:
  `git grep -nE -B2 '^\s*throw ' -- "$API" | grep -E '\.(error|warn)\(' | grep -v '\.spec\.ts'`.
- **OBS-05 · Alta** — El caso de uso narra con `@Trace({ name })`; `@LogMethod` y `@Retry` arman
  mecanismo y se quedan en `infrastructure/`.
  Fuente: ADR-TMS-019 D2.1; Alberto §7. Detecta:
  `git grep -nE '@(LogMethod|Retry)\(' -- "$API/modules/*/application/*" "$API/modules/*/domain/*"`.
  Ese grep solo encuentra lo prohibido presente. Falta lo obligatorio ausente: cada escritura deja
  su `registrarEfecto` y cada rechazo por una referencia que no existe deja etapa `fallida` o
  `registrarDecision` (TRX-03, O24).
- **OBS-06 · Media** — El localizador `TX-AAAA-NNNNNN` se acuña una vez por acción del usuario, de
  una secuencia de SQL Server; no se vuelve a acuñar, y si la secuencia falla la petición sigue con
  el identificador local.
  Fuente: ADR-TMS-019 D5; ADR-TMS-022 D2; G-217. Detecta:
  `git grep -nE "acunar|acuñar|NEXT VALUE FOR" -- "$API" | grep -v '\.spec\.ts'`.
- **OBS-07 · Media** — Cada `errorCode` nuevo resuelve a un runbook que existe, y lo comprueba una
  prueba.
  Fuente: Alberto §7. Detecta: `git diff $BASE...HEAD -- "$API" | grep -oE "errorCode: '[A-Z_]+'"` y
  buscar su runbook en `docs/`.
- **OBS-08 · Media** — La métrica no lleva el identificador de transacción como etiqueta.
  Fuente: Alberto §7. Detecta:
  `git grep -nE "(labels|attributes)[^;]*(transaction|transaccion|TX-)" -- "$API" | grep -v '\.spec\.ts'`.
- **OBS-09 · Media** — Retención por señal declarada en `DECISIONS.md` (bloque `retencion-senal`,
  cuatro señales, `pista_auditoria` siete años y _append-only_) y aplicada en el chart; el desenlace,
  los errores y la auditoría no se muestrean.
  Fuente: S-36; ADR-0197; Alberto §7; G-219. Detecta: `validate-retencion-senal.mjs`;
  `grep -n 'retencion' src/infra/tms-helm/*.yaml`.
- **OBS-10 · Media** — El salto a XMS lleva `traceparent` y `baggage` con `unimar.transaction.id`,
  `unimar.transaction.parent_id` y `unimar.user.id`; la vuelta se registra como efecto `llamadaHttp`
  con objetivo `xms`.
  Fuente: ADR-TMS-022 D1 a D3; ADR-TMS-019 D1. Detecta:
  `git grep -nE "baggage|traceparent|registrarEfecto" -- "$API" | grep -v '\.spec\.ts'`.
- **OBS-11 · Media** — Una acción del usuario en la web es una transacción, no una por petición: se
  abre por navegación y cada escritura cuelga como hija.
  Fuente: Alberto §7; ADR-TMS-019. Detecta: diff de `src/apps/web/src/nucleo/observabilidad/`.
- **OBS-12 · Media** — Cada dependencia declara qué pasa si no responde (Blueprint, bloque
  `comportamiento-degradado`); la identidad falla cerrado.
  Fuente: S-42; ADR-0234; ADR-TMS-017. Detecta: `validate-comportamiento-degradado.mjs`; una
  dependencia nueva en el diff sin fila en el bloque.
- **OBS-13 · Media** — El aviso al teléfono va fuera de la transacción y no hace fallar el caso de
  uso; los tokens que FCM ya no reconoce se dan de baja.
  Fuente: commit `396e919` (G-205). Detecta: `git grep -nE -B6 'mensajero|MensajeroPush' -- "$API/modules/*/application/*"`
  y comprobar que no se llama dentro de un `.transaction(`. Vale para todo efecto irreversible, no
  solo el push: narrar las ofertas dentro de la transacción las da por hechas antes del commit
  (TRX-02, V4). Los envíos de una lista no van en serie dentro de la petición (V1, BE-34).
