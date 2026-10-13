# Checklist — backend NestJS hexagonal

Criterio de Hal (`unimar-dev-backend-nodejs`, RS-NODE-BACKEND) aplicado a la API. Fuentes: ADR-0002
(arquitectura limpia NestJS), ADR-0112 (P-NB-01 a P-NB-04), ADR-0038 (errores como Result),
ADR-0056 (D2 reglas R1 a R6, D4 umbrales), ADR-TMS-004, ADR-TMS-015, ADR-TMS-020, el `CLAUDE.md`
del TMS y el documento de Alberto (§2, §3, §6.5, §9). Persistencia y SQL están en
[base-de-datos-sqlserver.md](base-de-datos-sqlserver.md); identidad y sede en
[seguridad-y-observabilidad.md](seguridad-y-observabilidad.md).

Casi todo lo de este archivo ya lo muerde una herramienta: `npm run lint` (`.eslintrc.cjs`),
`npm run fronteras` (`.dependency-cruiser.cjs`) o una spec. Lo primero es correrlas (paso 2). El
grep sirve para ubicar la línea y para revisar el diff cuando la herramienta no corrió.

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; MIG=$API/shared/infrastructure/persistence/migraciones`.

## Capas dentro de un módulo

- **BE-01 · Alta** — `domain/` no importa NestJS, TypeORM, `mssql`, `express`, `pino`,
  `@opentelemetry/*`, `observabilidad/`, `infrastructure/` ni `api/`.
  Fuente: ADR-0002; ADR-0112 P-NB-03; Alberto §2.1. Detecta: `npm run lint`;
  `git grep -nE "from '(@nestjs|typeorm|mssql|express|pino|@opentelemetry)|/(infrastructure|api|observabilidad)/" -- "$API/modules/*/domain/*" "$API/shared/domain/*" | grep -v '\.spec\.ts'`.
- **BE-02 · Alta** — `application/` no importa ORM ni driver, `@nestjs/swagger`, `api/` ni
  `infrastructure/`; de AOP solo `@Trace`.
  Fuente: Alberto §2.1; ADR-TMS-019 D2.1. Detecta:
  `git grep -nE "from '(typeorm|mssql|express|@nestjs/swagger|@nestjs/typeorm)|/(infrastructure|api)/" -- "$API/modules/*/application/*"`;
  `git grep -nE '@(LogMethod|Retry)\(' -- "$API/modules/*/application/*" "$API/modules/*/domain/*"`.
- **BE-03 · Alta** — `api/` no importa `infrastructure/`, `typeorm`, `mssql` ni `@nestjs/typeorm`,
  y ningún controlador escribe SQL: habla con el caso de uso o con un puerto.
  Fuente: Alberto §2.1 (G-032). Detecta:
  `git grep -nE "from '(typeorm|mssql|@nestjs/typeorm)|/infrastructure/|\.query\(" -- "$API/modules/*/api/*" | grep -v '\.spec\.ts'`.
  Excepción nombrada: la prueba de edición concurrente monta el repositorio real sobre un
  `DataSource` falso; la exclusión llega a ese fichero y a ninguno más.
- **BE-04 · Alta** — `shared/api/` no alcanza `shared/infrastructure/` ni el ORM: si las dos capas
  lo necesitan, sube a `shared/domain`.
  Fuente: Alberto §2.1 (G-093). Detecta:
  `git grep -nE "from '(typeorm|mssql)|shared/infrastructure|\.\./infrastructure/" -- "$API/shared/api/*" | grep -v '\.spec\.ts'`.
- **BE-05 · Alta** — Cada una de las cuatro capas tiene su regla en la configuración del linter: una
  regla que cubre tres de cuatro deja pasar la cuarta.
  Fuente: Alberto §13 error 14. Detecta: `grep -nE "files: \[.*(domain|application|api)" src/apps/api/.eslintrc.cjs`
  y comprobar que `domain`, `application`, `api` y `shared/api` tienen su `no-restricted-imports`.

## Fronteras entre módulos (ADR-TMS-015)

- **BE-06 · Alta** — `shared` no importa de `modules/**`.
  Fuente: ADR-TMS-015 §3 (`shared-no-importa-de-modules`). Detecta: `npm run fronteras`;
  `git grep -nE "from '[^']*modules/" -- "$API/shared/*"`.
- **BE-07 · Alta** — De otro módulo solo se importa `domain/**` y `*.orm-entity.ts`; lo demás
  colabora por puerto en `domain/puertos` provisto por token.
  Fuente: ADR-TMS-015 §3 (`solo-superficie-publica-ajena`). Detecta: `npm run fronteras`;
  `git grep -nP "from '\.\./\.\./(?!shared/)[a-z-]+/(application|api|infrastructure)/" -- "$API/modules/*" | grep -v orm-entity`.
- **BE-08 · Alta** — El puerto compartido no importa TypeORM: la transacción viaja como
  `Transaccion = unknown` y el adaptador la fija en `EntityManager`.
  Fuente: ADR-TMS-015 §3; ADR-0002. Detecta:
  `git grep -nE "EntityManager|from 'typeorm'" -- "$API/modules/*/domain/*"`.
- **BE-09 · Alta** — `naves` y `flota` son hoja: solo importan de `shared`.
  Fuente: ADR-TMS-015 §3 (`naves-y-flota-son-hoja`). Detecta:
  `git grep -nE "(recepcion|relacion-detallada|planificacion)/" -- "$API/modules/naves/*" "$API/modules/flota/*"`.
- **BE-10 · Alta** — El sentido del proceso fija el de los `import` (`recepcion` →
  `relacion-detallada` → `planificacion`) y no hay ciclos.
  Fuente: ADR-TMS-015 §3 (`planificacion-no-importa-de-recepcion-ni-de-relacion-detallada`,
  `relacion-detallada-no-importa-de-recepcion`, `sin-ciclos`). Detecta: `npm run fronteras`.
- **BE-11 · Alta** — Una migración solo importa `modules/*/domain/listas-cerradas.ts`.
  Fuente: ADR-TMS-015 §3 (`migraciones-solo-listas-cerradas`). Detecta:
  `git grep -nE "from '[^']*modules/" -- "$MIG/*" | grep -v listas-cerradas`.
- **BE-12 · Alta** — No hay lista de violaciones toleradas: una arista o está declarada con su
  razón en una regla, o es una violación.
  Fuente: Alberto §2.2 (G-024). Detecta: `grep -n 'ignore-known' src/apps/api/package.json`;
  `git ls-files '*known-violations*'`.
- **BE-13 · Media** — Los módulos se cortan por contexto de dominio, no por el menú de la web: cada
  módulo es dueño de sus entidades.
  Fuente: ADR-TMS-015 §1. Detecta: `git diff --name-status $BASE...HEAD -- "$API/modules/" | grep -E '^A.*\.module\.ts'`
  y leer qué entidades registra y de quién son.

## Umbrales y tipado

- **BE-14 · Alta** — Los cuatro umbrales de ADR-0056 D4 bloquean: `max-lines-per-function` 50,
  `max-params` 3, `complexity` 10, `max-depth` 3; y `max-lines` 250 por fichero.
  Fuente: ADR-0056 D4; S-37; Alberto §3. Detecta: `npm run lint`;
  `git diff $BASE...HEAD -- src/apps/api/.eslintrc.cjs | grep -nE '^[-+].*(max-|complexity)'` (un
  umbral que sube es hallazgo).
- **BE-15 · Alta** — La lista de exención de umbrales solo encoge: ningún fichero entra en ella.
  Fuente: Alberto §1 y §3; G-025. Detecta:
  `git diff $BASE...HEAD -- src/apps/api/.eslintrc.cjs | grep -nE "^\+.*(files:|'src/)"`.
- **BE-16 · Alta** — Nada silencia un validador: ni `eslint-disable`, ni `@ts-ignore`, ni
  `nosemgrep` sin su porqué en la misma línea; `@ts-expect-error` solo como aserción de contrato.
  Fuente: Alberto §1 («el remedio nunca es silenciar el validador»); ADR-0109 P-FE-05. Detecta:
  `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^\+.*(eslint-disable|@ts-ignore|@ts-expect-error|nosemgrep)'`.
- **BE-17 · Media** — Sin `any`, retorno explícito, sin promesas flotantes, `import type` para tipos.
  Fuente: Alberto §3; ADR-0003. Detecta: `npm run lint`;
  `git grep -nE ':\s*any\b|\bas any\b|<any>' -- "$API/*" | grep -v '\.spec\.ts'`.
- **BE-18 · Media** — Una función hace una cosa: pasar los umbrales no acredita R4; más de tres
  parámetros se agrupan en un objeto con nombre (`Escritura`, `Paginacion`).
  Fuente: ADR-0056 D2 R4 y D4; Alberto §3 y §6.2. Detecta: juicio en el diff; métodos con cuatro
  argumentos o con varios niveles de abstracción.
- **BE-19 · Baja** — Sin números mágicos con significado de negocio: constante con nombre.
  Fuente: ADR-0056 D2 R3. Detecta:
  `git diff $BASE...HEAD -U0 -- "$API" | grep -nE '^\+.*[^0-9.][2-9][0-9]{1,}[^0-9]' | grep -vE 'spec|const [A-Z_]+ ='`.

## Errores, contratos y respuestas

- **BE-20 · Media** — Errores como valor (`Result`/neverthrow) en `domain/` y `application/`; una
  excepción no es control de flujo.
  Fuente: ADR-0038; ADR-0056 D2 R6; ADR-TMS-004. Detecta:
  `git grep -nE '\bthrow new\b' -- "$API/modules/*/domain/*" "$API/modules/*/application/*" | grep -v '\.spec\.ts'`
  (candidatos: lanzar dentro de una transacción para que revierta es legítimo, ver BD-23).
- **BE-21 · Media** — Respuesta HTTP estandarizada por `TransformInterceptor` y `HttpExceptionFilter`
  globales; `@Res()` solo para binarios con su porqué.
  Fuente: `CLAUDE.md` del TMS, «Formato de respuesta HTTP». Detecta:
  `git grep -nE 'useGlobalInterceptors|useGlobalFilters|APP_INTERCEPTOR|APP_FILTER' -- "$API"`;
  `git grep -n '@Res()' -- "$API" | grep -v '\.spec\.ts'`.
- **BE-22 · Media** — Mensajes al usuario en español; 400 para forma inválida (también un `If-Match`
  mal formado), 409 para conflicto o testigo desactualizado; nunca stack trace en producción.
  Fuente: `CLAUDE.md` del TMS («Cómo viaja el valor»); skill `contratos-api`. Detecta:
  `git diff $BASE...HEAD -- "$API" | grep -nE "^\+.*(Exception\('|message: ')[A-Z][a-z]+ [a-z]+ (not|is|was|must)"`.
  El mensaje usa el mismo nombre que la pantalla: si la web dice «cuenta UMS», la API no dice
  «cuenta de UNITRANS» (V3). Por cada mensaje nuevo, su término frente al rótulo de la web.
- **BE-23 · Alta** — Un cambio de contrato entre API y web entra en dos pasos: primero el servidor
  acepta la forma nueva y conserva la vieja, después se exige la nueva.
  Fuente: ADR-TMS-015; Alberto §2.3; ADR-TMS-025 D3. Detecta:
  `git diff $BASE...HEAD -- "$API/*controller.ts" "$API/*dto*.ts" | grep -nE '^-.*(@(Get|Post|Put|Patch|Delete)\(|^-\s+[a-zA-Z]+[?!]?: )'`.
- **BE-24 · Alta** — Ausente y vacío no son lo mismo: omitir una lista conserva, mandarla vacía
  desvincula. Un `?? []` en el controlador o el caso de uso los funde y borra datos.
  Fuente: Alberto §4.5. Detecta:
  `git grep -nE '\?\? \[\]' -- "$API/modules/*/api/*" "$API/modules/*/application/*" | grep -v '\.spec\.ts'`.
- **BE-25 · Alta** — Ningún `...cuerpo` ni `...dto` llega a una escritura: el `SET` no puede recibir
  campos que nadie declaró.
  Fuente: `CLAUDE.md` del TMS (`ultimo_cambio`); ADR-TMS-009 1.1.0. Detecta:
  `git grep -nE '\.\.\.(cuerpo|dto|body|entrada)\b' -- "$API" | grep -v '\.spec\.ts'`.
- **BE-26 · Media** — DTO de entrada con `class-validator`; el portal es estricto y los DTO que solo
  consume UNITRANS llevan `@ContratoDelTelefono()`.
  Fuente: ADR-TMS-004; ADR-TMS-009 1.1.0 (G-150). Detecta: `contrato-unitrans.spec.ts` y
  `tuberia-de-validacion.spec.ts` en verde;
  `git grep -L '@ContratoDelTelefono' -- "$API/modules/*/api/dto/*unitrans*"` (solo cuentan los DTO
  de entrada; los de respuesta no llevan la marca). Un DTO con discriminante (`modo`, `tipo`) lo
  exige y rechaza la carga útil que no le corresponde (DEF-01); una lista que arma un `IN` lleva
  `@ArrayMaxSize` (DEF-02).
- **BE-27 · Alta** — No se responde éxito sobre un trabajo que no se hizo: cero filas movidas, cero
  servicios creados o un archivo que no se escribió son error, no `201`.
  Fuente: Alberto §6.5; §13 error 8. Detecta:
  `git grep -nE 'affected|rowsAffected' -- "$API" | grep -v '\.spec\.ts'` y comprobar que cada
  llamador decide sobre el cero.
- **BE-28 · Alta** — La regla de negocio la decide el dominio y viaja publicada en el modelo de
  lectura (`puedeProgramarse`, `enCurso`, `siguienteHito`), no la reconstruye la web.
  Fuente: ADR-TMS-020 §1; G-156; G-208; G-229. Detecta: en el diff, un predicado nuevo de la web
  (ver FE-01) sin su campo en el DTO de lectura de la API.

## Configuración, dependencias y runtime

- **BE-29 · Media** — `process.env` se lee al componer el módulo y entra por un puerto; el dominio y
  el caso de uso reciben la decisión, no la variable.
  Fuente: G-153; G-025; regla `no-restricted-properties` de `.eslintrc.cjs`. Detecta:
  `git grep -n 'process\.env' -- "$API/modules/*" "$API/shared/domain/*" | grep -v '\.spec\.ts'`.
- **BE-30 · Media** — Nada de imports a las tripas de paquetes ajenos (`/dist/`, `/lib/`,
  `/internal/`); se corrige por la superficie pública, no relajando `moduleResolution`.
  Fuente: Alberto §9. Detecta:
  `git grep -nE "from '[@a-z][^']*/(dist|lib|internal|build)/" -- 'src/apps/*.ts' 'src/apps/*.tsx'`.
- **BE-31 · Alta** — Dependencias internas por versión publicada, nunca `file:../`.
  Fuente: Alberto §9. Detecta: `git grep -nE '"file:' -- '*package.json'`.
- **BE-32 · Media** — Node 24 y TypeScript 6 en las tres aplicaciones; `target` y `lib` alineados
  con lo que se emite.
  Fuente: Alberto §9; `CLAUDE.md` del TMS (stack). Detecta:
  `grep -n '"node"' src/apps/*/package.json`; `grep -nE '"(target|lib)"' src/apps/*/tsconfig*.json`.
- **BE-33 · Media** — El event loop no se bloquea: nada síncrono de E/S o CPU en el camino de una
  petición.
  Fuente: ADR-0112 P-NB-04. Detecta:
  `git grep -nE 'readFileSync|writeFileSync|execSync|pbkdf2Sync|scryptSync' -- "$API" | grep -vE 'spec|migraciones|main\.ts'`.
- **BE-34 · Media** — Sin `await` de E/S dentro de un bucle que crece con los datos (N+1 remoto).
  Fuente: skill `diseno-de-codigo` (matriz, «consulta o llamada HTTP dentro de un bucle»); skill
  `resiliencia-operacion` (05). Detecta:
  `git grep -nE -B4 'await [^;]*\.(query|find|findOne|findBy|save|insert|update|enviar)\(' -- "$API" | grep -E 'for \(|forEach|\.map\('`.
  Ese grep solo ve verbos conocidos; súmale todo `await` dentro de un `for … of` del diff, sea cual
  sea el método (`mandar(`, `enviarADispositivos(`, `avisar(`), sobre todo si es una llamada saliente
  dentro de la petición HTTP (V1):
  `git grep -nE -A6 'for \(const [a-zA-Z]+ of ' -- "$API" | grep -E 'await ' | grep -v '\.spec\.ts'`.

## Nombres y comentarios

- **BE-35 · Baja** — Todo identificador y nombre de archivo en español, salvo lo que impone la
  plataforma (`handle`, `queryKey`, prefijo `use`).
  Fuente: `CLAUDE.md` del TMS, «Todo en español». Detecta:
  `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^\+.*\b(function|const|class|let) (get|set|create|update|delete|handle|process|fetch|load|save|build|check)[A-Z]'`;
  `git diff --name-only --diff-filter=A $BASE...HEAD | grep -E '(service|helper|utils|manager|handler)\.tsx?$'`.
- **BE-36 · Baja** — Comentarios solo con el porqué no deducible, una o dos líneas; sin banderas de
  sección, sin JSDoc que repite la firma, sin código comentado.
  Fuente: `CLAUDE.md` del TMS §2; ADR-0056 D2 R5; `comentarios-cortos.spec.ts` (G-169, G-179).
  Detecta: `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^\+\s*(//\s*[-=─━#*]{3,}|/\*\*\s*$|//\s*(import|const|return|await) )'`;
  la spec `comentarios-cortos.spec.ts` en verde (su base solo baja).
  La regla pide comentarios **mínimos**, no cero: borrar un porqué no deducible también es hallazgo.
  Cuenta como porqué una decisión contraintuitiva, una limitación de librería o un orden que no se
  puede alterar. En el PR #125 se fueron 171 líneas de comentario, entre ellas por qué UMS manda
  `scope` como cadena o como arreglo (O30). Que la base de `comentarios-cortos` baje no lo
  justifica. Detecta: `git diff $BASE...HEAD -U0 -- src/apps | grep -nE '^-\s*(//|\*)'`, y leer cada
  bloque borrado cuyo código siguió vivo.
