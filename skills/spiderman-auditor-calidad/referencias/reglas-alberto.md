# Reglas de calidad de código extraídas del trabajo de Alberto Arroyo (unimar_tms)

Fuente: `git log --all --no-merges --author=aarroyo --author="Alberto Arroyo"` (190 commits; los de código van del 2026-08-20 al 2026-09-23). Se leyeron los cuerpos completos de todos los commits desde el 2026-08-19 y los diffs y configuraciones clave. PRs #100–#118 (merge → rama):
#100 armazon-alineado-ums · #101 cache-index-html · #102 cache-control-duplicado · #103 descriptor-de-marca · #104 diagrama-arquitectura · #105 mermaid-que-no-compila · #106 codigo-sap-en-mantenimientos · #107 refactor/fronteras-y-umbrales · #108 refactor/capas-y-umbrales-api · #109 fix/duplicacion-flaky-y-contraste · #110 feat/validacion-por-esquema · #111 chore/limpieza-medible · #112 docs/respaldo-y-reporte · #113 feat/contrato-de-escritura-y-limpieza · #114 chore/cierre-de-contrato-y-duplicacion · #115 feat/bloqueo-de-servicio-y-tailwind4 · #116 chore/umbrales-y-csp · #117 docs/historias-y-armazon · #118 docs/sello-y-validador-de-prosa.

Solo reglas **no funcionales** (calidad, arquitectura, seguridad, pruebas, mantenibilidad). Rutas relativas a `C:\Christian\unimar_tms`. `API` = `src/apps/api`, `WEB` = `src/apps/web`.

---

## 0. Guardas automáticas que dejó (inventario)

| Guarda | Archivo de configuración | Comando | Qué bloquea |
|---|---|---|---|
| Umbrales ADR-0056 D4 (API) | `API/.eslintrc.cjs` | `npm run lint` (API) | `max-lines-per-function` 50, `max-params` 3, `complexity` 10, `max-depth` 3; `max-lines` 250 (warn); lista de exentos «solo puede encoger» |
| Umbrales D4 (web) | `WEB/eslint.config.js` | `npm run lint` (WEB) | Los mismos cuatro + `max-lines` 250 como **error**; `react/prefer-read-only-props` |
| Capas hexagonales API | `API/.eslintrc.cjs` (overrides `domain/`, `application/`, `api/`, `shared/api`) | `npm run lint` | domain→NestJS/ORM/infra/api/observabilidad; application→ORM/swagger/api/infra/pino/AOP (salvo `@Trace` y `relato`); api→infrastructure/typeorm/mssql; shared/api→shared/infrastructure |
| `process.env` fuera de domain/application | `API/.eslintrc.cjs` (`no-restricted-properties`) | `npm run lint` | Leer el entorno en dominio o caso de uso |
| Migraciones congeladas | `API/.eslintrc.cjs` (`no-restricted-syntax` sobre `Object.values/keys/entries` en `migraciones/**`) | `npm run lint` | CHECK generado desde el enum vivo |
| Import de tipos vacío | `IMPORT_SIN_SIMBOLOS` en ambos ESLint | `npm run lint` | `import type {} from '...'` |
| Fronteras entre módulos | `API/.dependency-cruiser.cjs` | `npm run fronteras` (API) — **sin** `--ignore-known` | shared→modules, módulo→api/application/infrastructure ajenos, naves/flota hoja, sentido del proceso, ciclos |
| Ciclos entre módulos (grafo colapsado) | `API/src/shared/api/sin-ciclos-entre-modulos.spec.ts` | `npm test` (API) | Ciclo módulo↔módulo por ficheros distintos |
| Tablas ajenas en SQL | `API/src/shared/api/tablas-por-modulo.spec.ts` | `npm test` | Un módulo que nombra `dbo.<tabla>` de otro |
| Entidades ORM vs. esquema | `API/src/shared/infrastructure/persistence/entidades-contra-esquema.integracion.spec.ts` | `npm run test:integracion` | Columna mapeada ≠ INFORMATION_SCHEMA |
| Cobertura de autorización | `API/src/shared/seguridad/cobertura-de-rutas.spec.ts` | `npm test` | Ruta sin `@Exige/@Publico/@SoloIdentidad/@ClaveDeSistema` |
| Cobertura de sede | `API/src/shared/api/cobertura-de-sede.spec.ts` | `npm test` | Ruta `servicios|programaciones|viajes/:id` sin `@AcotadaASede` ni motivo |
| Aspectos por capa (prueba de la regla de lint) | `API/src/shared/api/aspectos-por-capa.spec.ts` | `npm test` | Que el `group` del lint deje de cubrir `@Retry/@LogMethod` |
| Comentarios cortos | `API/src/shared/api/comentarios-cortos.spec.ts` + `API/scripts/base-de-comentarios-cortos.mjs` | `npm test`; regenerar base: `node scripts/base-de-comentarios-cortos.mjs` | Bloques de comentario > 2 líneas por encima de la línea base (solo baja) |
| Huella de migración | `API/scripts/huella-de-migracion.mjs` | `node scripts/huella-de-migracion.mjs <migracion.ts>` (antes y después) | Editar una migración publicada cambiando su SQL |
| Módulos registrados | `API/src/app.module.spec.ts` | `npm test` | Módulo que existe en disco y no está en `AppModule` |
| Catálogo de errores con runbook | `API/src/shared/observabilidad/catalogo-de-errores.spec.ts` | `npm test` | `errorCode` sin runbook existente en `docs/05-entrega/runbooks/` |
| Contrato de eventos web | `API/src/modules/observabilidad/api/contrato-de-eventos-web.spec.ts` | `npm test` | DTO que rechaza lo que el paquete emite |
| Piso de cobertura de infraestructura | `API/scripts/piso-de-cobertura.mjs` + `piso-de-cobertura-infraestructura.json` | `npm run test:cobertura:infraestructura` (subir: `...:subir`) | Métrica por debajo del piso; falla cerrado si falta el resumen |
| Carril SQL Server real | `API/jest.integracion.config.js` | `npm run test:integracion` | CAS, idempotencia, append-only, offset |
| Bundle web | `WEB/scripts/verificar-bundle.mjs` | `npm run build` (WEB) | Carril de desarrollo en `dist/`, hash CSP desalineado, sin configs nginx que comprobar |
| Contraste WCAG | `WEB/src/app/armazon/contraste-del-armazon.prueba.ts` (y 29 pruebas de contraste) | `npm test` (WEB) | Par texto/fondo < 4,5:1 |
| Tokens de diseño y efectos | `WEB/eslint.config.js` (`TAMANO_FUERA_DEL_TEMA`, `BOTON_ESCRITO_A_MANO`, `RED_FUERA_DEL_NUCLEO`, `ALMACEN_FUERA_DEL_NUCLEO`, `no-restricted-globals`) | `npm run lint` | `text-[12px]`, `rounded-[9px]`, `border-[1.5px]`, `<button>` crudo, `fetch`/`localStorage` fuera de `nucleo/` |
| Capas de la web (ADR-TMS-020) | `WEB/eslint.config.js` (bloques aplicación / presentación / vocabulario) | `npm run lint` | Presentación→infraestructura; aplicación→componentes; feature→feature; funciones en `vocabulario/` |
| Prosa contra el árbol | `scripts/validar-prosa.mjs` (+ `validar-prosa.prueba.mjs`) | `node scripts/validar-prosa.mjs --estricto` | Rutas, comandos npm, workflows y nombres citados que no existen; sellos caducados |
| Secretos | `.gitleaks.toml` | pre-push (commits del push) / `npm run seguridad:secretos` (raíz) | Credenciales en commits |
| SAST | ruleset `p/owasp-top-ten` | pre-push / `npm run seguridad:sast` (raíz) | Hallazgos OWASP (línea base 0 → puerta) |
| Dependencias | — | `npm audit --omit=dev --audit-level=high` en cada app (pre-push) | Vulnerabilidad alta |
| Chart Helm (dos modos) | `src/infra/tms-helm` | `helm lint` + `helm template` (pre-push) | Plantilla que no renderiza |
| Orquestación | `.husky/pre-push` | `git push` | Encadena lint, `format:revisar`, `fronteras`, `tsc --noEmit`, `test:cobertura`, piso de infra, `test:integracion`, helm, audit, gitleaks, semgrep, `validar-prosa --estricto` |
| Duplicación / código muerto | sin configuración versionada | `npx jscpd` y `npx knip` efímeros (1ebb72b) | Solo medición (G-030 clones, G-036/G-037 muertos) |

---

## 1. Capas / arquitectura hexagonal (API)

### AL-01 · La capa de presentación no toca la persistencia
- **Categoría:** capas/hexagonal
- **Antipatrón:** SQL crudo dentro del controlador de salud (5 sitios) y el controlador de consolidado importando el exportador Excel de `infrastructure/`.
- **Forma correcta:** el controlador habla con el caso de uso o con un **puerto** del dominio (`SondaDeBaseDatos`, `ExportadorDeCargas`); el adaptador en `infrastructure/` es el único que ve `DataSource`. Las afirmaciones del spec del controlador se mudan al spec del adaptador; el del controlador prueba orquestación contra un doble del puerto.
- **Porqué:** el ESLint protegía `domain/` y `application/` pero no `api/`: la frontera se aplicaba en dos capas de cuatro.
- **Evidencia:** `03150e4 refactor(api): la capa de presentación deja de tocar la persistencia` (PR #108).
- **Detección:** `grep -rnE "from '.*(infrastructure|typeorm|mssql|@nestjs/typeorm)" API/src/modules/*/api --include=*.ts | grep -v spec`
- **Guarda:** override `src/modules/*/api/**` en `API/.eslintrc.cjs`; única exclusión nombrada: `flota/api/edicion-concurrente.spec.ts`.

### AL-02 · `shared/api` no alcanza `shared/infrastructure`; lo puro sube a `shared/domain`
- **Categoría:** capas/hexagonal
- **Antipatrón:** `clasificarErrorSql` y `ultimoCambioNormalizado` vivían en infraestructura y los usaba el borde HTTP.
- **Forma correcta:** una función que no abre conexión ni toca el ORM es vocabulario del dominio → `shared/domain`.
- **Porqué:** «la frontera se aplicaba en cuatro sitios de cinco».
- **Evidencia:** `a004bfc chore(api): limpieza medible…` (G-093, PR #111); registrado en `03150e4`.
- **Detección:** `grep -rn "infrastructure" API/src/shared/api --include=*.ts | grep -v spec`
- **Guarda:** override `src/shared/api/**` en `API/.eslintrc.cjs`.

### AL-03 · Dominio y aplicación sin framework, ORM ni mecanismo de observabilidad
- **Categoría:** capas/hexagonal
- **Antipatrón:** caso de uso que importa pino/OpenTelemetry/`@LogMethod`/`@Retry`; dominio que importa NestJS o TypeORM.
- **Forma correcta:** el caso de uso **narra** con la fachada `shared/observabilidad/relato` y puede usar `@Trace({ name })` (nombra la etapa); `@LogMethod` (necesita sink) y `@Retry` (cambia el flujo) van en `infrastructure/`. Línea: «¿el decorador ARMA el mecanismo o solo NOMBRA lo que pasa?».
- **Porqué:** ADR-0096/ADR-TMS-019 D2.1; `@LogMethod` solo ve excepciones y los casos de uso devuelven `Result`, así que marcaría como completada una etapa fallida.
- **Evidencia:** `5f869fc feat(api): la linea entre los aspectos la fija el linter, no la revision`; `8145ed6 feat(api): el logging estandar de las escrituras pasa por AOP`; `a70b46f feat(observabilidad): los siete casos de uso…`.
- **Detección:** `grep -rnE "from '(pino|@opentelemetry|@nestjslatam/aop(\.nestjs|\.aspects)?)'" API/src/modules/*/application`
- **Guarda:** overrides `domain/` y `application/` de `API/.eslintrc.cjs` + `aspectos-por-capa.spec.ts` (ejecuta la regla sobre ficheros temporales: «una regla de linter sin prueba es una intención»).

### AL-04 · El entorno se lee al componer el módulo, no en dominio ni caso de uso
- **Categoría:** capas/configuración
- **Antipatrón:** `process.env.X` dentro de `domain/` o `application/`; configuración suelta sin validar.
- **Forma correcta:** configuración tipada y validada al arrancar (`shared/configuracion`); la decisión llega por un puerto/política inyectada.
- **Porqué:** el dominio recibe la decisión, no la variable; permite probar ambos lados del interruptor sin tocar el entorno global.
- **Evidencia:** `61594b6 refactor(api): puertos entre modulos, configuracion tipada…`; `1b39129 fix: corregir la revisión del PR #122` («process.env prohibido en domain/ y application/»); `62568f7` (G-025 parcial).
- **Detección:** `grep -rn "process.env" API/src/modules/*/{domain,application} API/src/shared/domain | grep -v spec`
- **Guarda:** `no-restricted-properties` en `API/.eslintrc.cjs` (excluye solo `politica-de-prueba.ts`).

### AL-05 · Entre módulos, solo puertos y superficie pública
- **Categoría:** capas/fronteras
- **Antipatrón:** un módulo que importa `application/`/`infrastructure/` de otro o escribe tablas de otro por SQL crudo (`planificacion` escribiendo `dbo.conductor`).
- **Forma correcta:** el dueño declara un puerto en `domain/puertos` y lo provee por token (`RESOLUTOR_DE_RECALADA`, `CREADOR_DE_SERVICIOS_DESDE_RELACION`, `CuentaUmsDelConductor`, `AparatosDelConductor`); de otro módulo solo se importa `domain/**` y `*.orm-entity.ts`.
- **Porqué:** ADR-TMS-015 reglas 2–4; acoplamiento oculto y ciclos.
- **Evidencia:** `87bf79f refactor(modulos): reorganizar la API por contextos…`; `61594b6`; `6607938 fix: aislamiento por sede…` (G-143); `9f2afb4` (G-161).
- **Detección:** `npm run fronteras` en API.
- **Guarda:** `API/.dependency-cruiser.cjs` (`solo-superficie-publica-ajena`, `naves-y-flota-son-hoja`, sentido del proceso).

### AL-06 · Ningún módulo nombra en SQL las tablas de otro
- **Categoría:** capas/fronteras (persistencia)
- **Antipatrón:** `planificacion` con `JOIN dbo.relacion_detallada…`; también el nombre de tabla en una constante interpolada (`dbo.${tabla}`) invisible a dependency-cruiser.
- **Forma correcta:** vista del dueño con `SCHEMABINDING` (`v_carga_para_planificar`…) o puerto.
- **Porqué:** las fronteras de `import` no ven el acoplamiento que viaja dentro de las cadenas SQL.
- **Evidencia:** `62568f7 fix: vistas para planificar…` (G-183); `583007e fix: sin tablas ajenas en el SQL de cada módulo…` (G-231, 18→0 aristas); `1fc99dc` (G-233).
- **Detección:** `grep -rnE "dbo\.[a-z_]+" API/src/modules/<mod>` contrastado con el mapa `TABLAS_POR_MODULO`.
- **Guarda:** `tablas-por-modulo.spec.ts` (exige cero tablas ajenas).

### AL-07 · Sin listas de violaciones toleradas; toda excepción va nombrada, con razón y alcance mínimo
- **Categoría:** capas/fronteras (gobernanza de reglas)
- **Antipatrón:** `depcruise --ignore-known` con un `.dependency-cruiser-known-violations.json` que mezclaba deuda con excepciones legítimas y crecía en silencio.
- **Forma correcta:** o la arista está declarada como regla con su razón y alcance de un solo fichero (`migraciones-solo-listas-cerradas` → solo `domain/listas-cerradas.ts`), o es violación. Comprobar con sondas que la puerta se pone roja.
- **Evidencia:** `83639e3 refactor(fronteras): la lista de violaciones toleradas desaparece` (PR #107); `759a0a7` retira el permiso que apuntaba al fichero borrado.
- **Detección:** `grep -rn "ignore-known\|known-violations" . --include=*.json --include=*.cjs`
- **Guarda:** script `fronteras` sin `--ignore-known`.

### AL-08 · Sin ciclos (ni entre ficheros ni entre módulos, ni siquiera de tipos)
- **Categoría:** capas/fronteras
- **Antipatrón:** `lista-de-opciones` importa el tipo de `selector-buscable`, que importa el componente: ciclo sostenido «por ser de tipos».
- **Forma correcta:** el tipo compartido a su propio módulo (`OpcionBuscable`).
- **Evidencia:** `7d75032 refactor(web): el selector buscable deja de saber de maestras`; reglas `sin-ciclos` y sentido del proceso (`87bf79f`, `61594b6`).
- **Guarda:** `sin-ciclos` en dependency-cruiser + `sin-ciclos-entre-modulos.spec.ts`.

### AL-09 · Lo que dos módulos necesitan sube a `shared`, no se cruza la frontera
- **Categoría:** capas/fronteras
- **Antipatrón:** `relacion-detallada` importando `transaccion-con-resultado.ts` de `planificacion/infrastructure`; `recepcion` importando `ProveedorDeContexto` de otro módulo.
- **Forma correcta:** subir a `shared/infrastructure/persistence/` o `shared/seguridad/`.
- **Evidencia:** `d821184 fix(api): sin sucursal no se sella…`; `94e9631 fix(recepcion): la sede de la ingesta sale de la sesión…`.
- **Guarda:** dependency-cruiser (`solo-superficie-publica-ajena`).

### AL-10 · ORM por defecto; SQL crudo solo si la sentencia decide, y aislado con su porqué
- **Categoría:** persistencia
- **Antipatrón:** adaptadores que mezclan SQL crudo y ORM sin regla (hasta en líneas consecutivas del mismo método); `INSERT` planos y `UPDATE` por PK en crudo.
- **Forma correcta:** ORM predeterminado. SQL crudo admitido en tres casos —el `WHERE` lleva la semántica de concurrencia, compare-and-set, lecturas compuestas más legibles— **siempre** en un módulo `sentencias-*.ts` con el porqué al lado (ADR-TMS-023).
- **Evidencia:** `4bc4178 refactor(api): el ORM es lo predeterminado y el SQL crudo se justifica`; `1fc99dc` (69→39 plantillas crudas fuera de `sentencias-*`).
- **Detección:** `grep -rnE "\.query\(" API/src/modules --include=*.ts | grep -v "sentencias-\|spec"`
- **Guarda:** ninguna automática (solo medición y ADR-TMS-023).

### AL-11 · Toda tabla tiene entidad ORM y se compara contra el esquema real
- **Categoría:** persistencia
- **Antipatrón:** seis tablas sin entidad ORM, escritas con SQL a mano.
- **Evidencia:** `1fc99dc fix: entidades ORM para toda tabla…` (G-148).
- **Guarda:** `entidades-contra-esquema.integracion.spec.ts` (33 entidades vs. `INFORMATION_SCHEMA`).

### AL-12 · Si ya existe un puerto, no se envuelve en un caso de uso que solo reenvía
- **Categoría:** capas / código superfluo
- **Antipatrón:** caso de uso de listado de motivos que solo reenviaba al puerto.
- **Evidencia:** `e1bb9a1 fix: reenvíos cruzados…` (G-155).
- **Detección:** revisión de casos de uso cuyo `ejecutar` es un único `return this.puerto.x(...)`.

---

## 2. Transacciones, errores y concurrencia

### AL-13 · Un `err` dentro de la transacción tiene que revertir
- **Categoría:** transacciones / Result
- **Antipatrón:** `dataSource.transaction(async g => { …; return err(x) })`: TypeORM solo revierte si el cuerpo **lanza**; devolver `err` confirma lo ya escrito (autorización y planificación huérfanas).
- **Forma correcta:** `enTransaccion(dataSource, cuerpo)` (`API/src/shared/infrastructure/persistence/transaccion-con-resultado.ts`): convierte el `err` en excepción dentro y lo devuelve como `err` fuera. Aplicarlo en **todos** los adaptadores transaccionales.
- **Evidencia:** `573c17b fix(planificacion): la sede filtra en toda lectura y el error revierte de verdad` (G-074); `d821184` (G-073).
- **Detección:** `grep -rn "\.transaction(" API/src/modules --include=*.ts | grep -v spec` (todo uso directo es sospechoso).
- **Guarda:** `transaccion-con-resultado.spec.ts` (no hay lint que prohíba el uso directo).

### AL-14 · Nada responde éxito sobre un trabajo que no se hizo
- **Categoría:** manejo de errores
- **Antipatrón:** creador que devuelve cero servicios en silencio; almacén que registra el fallo y devuelve `null` que nadie comprueba (201 con ruta nula); catch mudos; `fetch` sin mirar `respuesta.ok`.
- **Forma correcta:** devolver `Result`/`err` tipado (`REQUERIMIENTO_SIN_SUCURSAL`) y cortar el flujo; los `catch` registran; el cliente web verifica `ok` y avisa.
- **Evidencia:** `d821184` (G-073, G-080); `56bb24d` (G-031, 3 catch mudos); `40ef5c0 fix(observabilidad): los eventos del navegador vuelven a llegar a Loki`.
- **Detección:** `grep -rnE "catch *(\([^)]*\))? *\{ *\}" src/apps`; funciones de almacén que retornan `null` en el `catch`.

### AL-15 · Catálogo de errores exhaustivo por compilación
- **Categoría:** complejidad / errores
- **Antipatrón:** `errores.ts` con 126 líneas y complejidad 26 (switch gigante).
- **Forma correcta:** tabla para errores sin datos + `switch` para los que usan campos; ambas mitades fallan en compilación si aparece un error sin traducir; errores agrupados por subdominio (`errores-de-la-guia.ts`, `errores-del-recorrido.ts`…). Cada `errorCode` tiene runbook existente.
- **Evidencia:** `03150e4`; `ab51bb8` (catálogo con runbooks).
- **Guarda:** `max-lines-per-function`/`complexity` + `catalogo-de-errores.spec.ts`.

### AL-16 · Reintento de interbloqueo sobre la transacción entera, con predicado de clasificación
- **Categoría:** concurrencia / resiliencia
- **Antipatrón:** víctima de deadlock (1205) sale como 500; o reintentar una sentencia dentro de la transacción ya deshecha; filtrar por clase de error (no distingue deadlock de clave duplicada).
- **Forma correcta:** `@Retry` en los adaptadores que abren transacción, con predicado construido sobre `clasificarErrorSql`.
- **Evidencia:** `dab0416 feat(api): el interbloqueo de SQL Server se reintenta solo`; `a2c10a2` (ANOTAR_INTENTO sin interbloqueo).

### AL-17 · Concurrencia: estado de partida en el `WHERE` (compare-and-set) y 409
- **Categoría:** concurrencia
- **Antipatrón:** `ultimo_cambio ROWVERSION` como «columna decorativa» que ningún repositorio compara; `UPDATE` que pisa sin comprobar el estado leído.
- **Forma correcta:** en maestras editadas por personas: testigo en el cuerpo de la lectura y vuelta por `If-Match` (nunca en un DTO de entrada; 400 si la forma es mala, 409 si no coincide). En el servicio: compare-and-set en cada escritura (`SERVICIO_YA_CAMBIO`, `HITO_YA_MARCADO`). Contar filas afectadas.
- **Evidencia:** `779ea54 feat(maestras): el bloqueo optimista deja de ser una columna decorativa`; `854a1e2` (paso B); `1b39129`; `a2c10a2` (G-204).
- **Detección:** `UPDATE` sin comprobación de filas afectadas; `ultimoCambio` en DTO de entrada: `grep -rn "ultimoCambio" API/src/**/dto`.

### AL-18 · Reenvíos idempotentes y carrera cubierta
- **Categoría:** concurrencia / idempotencia
- **Antipatrón:** el reenvío que se cruza con su gemelo falla o duplica.
- **Forma correcta:** clave de origen única + respuesta con lo ya escrito y `repetida: true` (`reenvio-cruzado.ts`); `UPDLOCK, HOLDLOCK` donde hace falta; pruebas de carrera contra SQL Server real.
- **Evidencia:** `e1bb9a1 fix: reenvíos cruzados…` (G-225/G-174); `a2c10a2` (G-210, G-211).

### AL-19 · Los efectos externos se narran con lo que movió la transacción, fuera de ella y sin tumbar el caso de uso
- **Categoría:** transacciones / efectos
- **Antipatrón:** «testigo global» para decidir a quién avisar; notificaciones dentro de la transacción.
- **Forma correcta:** leer las filas afectadas con `OUTPUT` y avisar con ellas fuera de la transacción; el fallo del aviso no falla la operación; archivo subido se borra si la escritura falla.
- **Evidencia:** `e1bb9a1` (G-188); `9f2afb4` (G-221/G-166, G-135); `396e919` (G-205).

---

## 3. Seguridad

### AL-20 · El autor y la sede salen de la sesión, nunca del cuerpo
- **Categoría:** seguridad
- **Antipatrón:** 21 escrituras que tomaban el autor de `cuerpo.usuario` (suplantación de firma); DTO con `idSucursal`/`idUnidadNegocio`; constantes que inventaban sede.
- **Forma correcta:** `@Autor()` / `@Escribe()` (autor + testigo en un `Escritura`) / `@Sede()` leen la identidad publicada por el guard; 401/403 en el borde si falta. Retiro del campo en dos pasos (aceptar y descartar → borrar).
- **Evidencia:** `a234eb7 fix(seguridad): el autor de cada escritura sale de la sesión…`; `94e9631`; `288baff chore(tms): el autor sale de la sesión en las once escrituras…` (PR #113/#114).
- **Detección:** `grep -rnE "cuerpo\.usuario|idSucursal|usuario_creador.*dto" API/src/modules/*/api` ; DTO con propiedad `usuario`.
- **Guarda:** pruebas de controlador; sin lint dedicado.

### AL-21 · Toda ruta decide su autorización y su sede
- **Categoría:** seguridad
- **Antipatrón:** 57 decoradores de ruta y cero guards; una ruta nueva sin decorar compila y arranca.
- **Forma correcta:** `GuardUms` global; cada ruta con `@Exige(permiso)`, `@Publico()`, `@SoloIdentidad()` o `@ClaveDeSistema(...)`; `@AcotadaASede` en rutas con `:id` de servicio; `@ApiBearerAuth` a nivel de clase.
- **Evidencia:** `fa375c9`; `c550a45` (G-014); `036c37c` (`@SoloIdentidad`); `1f16701`; `6607938` (G-118).
- **Guarda:** `cobertura-de-rutas.spec.ts` y `cobertura-de-sede.spec.ts`.

### AL-22 · Fallar cerrado: valores por defecto seguros y arranque que se niega
- **Categoría:** seguridad / configuración
- **Antipatrón:** `GUARD_MODO` por defecto `auditoria` (registra y deja pasar); CORS que cae en `true` sin variable; claves de integradores con valor por omisión; `sedeParaFiltrar()` que devuelve nulo; token sin `aud`.
- **Forma correcta:** default `bloqueo`; `CORS_ORIGENES` obligatorio; claves ≥ 32 caracteres sin default fuera de dev/test y rechazo del prefijo `desarrollo-`; `AUTENTICACION=false` o `auditoria` + `NODE_ENV=production` abortan el arranque; exigir `UMS_AUDIENCIA`; portador sin sede → 403 antes de leer.
- **Evidencia:** `0567e11 fix(seguridad): cierra los seis hallazgos…`; `49ff158`; `1f5009a`; `1f16701`; `a004bfc` (ADR-TMS-017).
- **Detección:** `grep -rnE "\?\? *(true|'auditoria')|\|\| *'\*'" API/src`

### AL-23 · CSP sin concesiones y cabeceras de seguridad verificadas en el artefacto
- **Categoría:** seguridad / frontend
- **Antipatrón:** `style-src 'unsafe-inline'` y orígenes de Google Fonts mantenidos por una razón falsa; `add_header` en `server` (nginx no lo hereda a un `location` con los suyos); helmet montado después de las rutas.
- **Forma correcta:** `style-src 'self'`; `script-src` con hash; fuentes servidas desde el propio origen; cabeceras dentro de cada `location`; helmet antes de cualquier ruta; CSP relajada solo en `/api/docs`. Medir con navegador y **control positivo** (un `style` a mano sí dispara).
- **Evidencia:** `41da98a chore(seguridad): la CSP se queda sin concesiones…` (PR #116); `854a1e2`; `0567e11` (hallazgo 6); `3b5f1c1`; `f893e26 fix(api): helmet se aplica antes que las rutas`.
- **Detección:** `grep -rn "unsafe-inline\|fonts.googleapis" src/apps/web src/infra`
- **Guarda:** `verificar-bundle.mjs` recalcula el hash CSP.

### AL-24 · El carril de desarrollo no puede llegar al bundle de producción
- **Categoría:** seguridad / build
- **Antipatrón:** confiar en `import.meta.env.DEV` (Vite lo deriva de `NODE_ENV`); `salir()` que reemitía la identidad de desarrollo (escalada).
- **Forma correcta:** constante `__MODO_DESARROLLO__` resuelta desde el subcomando (`command`) en `vite.config.ts`; grep del `dist/` después de cada build; salir = `null`.
- **Evidencia:** `0567e11` (hallazgos 1 y 4); `44c3b29`.
- **Guarda:** `WEB/scripts/verificar-bundle.mjs` (parte de `npm run build`).

### AL-25 · Lo que viene del almacenamiento del cliente o de la red se valida con esquema
- **Categoría:** seguridad / validación
- **Antipatrón:** grafo de permisos en `sessionStorage` comprobado con `typeof token === 'string'`; respuestas GET sin validar.
- **Forma correcta:** Zod para la forma (devolviendo el objeto original si `z.object` poda campos necesarios); zod en el transporte.
- **Evidencia:** `0567e11` (hallazgo 3); `56bb24d`; `1b39129` («esquemas zod en el transporte»).

### AL-26 · Datos personales redactados a cualquier profundidad; archivos por bytes mágicos
- **Categoría:** seguridad / privacidad
- **Antipatrón:** `redact` de pino (llega a un nivel); DNI y brevete en la bitácora de intentos; usar el nombre original del archivo; confiar en el MIME declarado.
- **Forma correcta:** saneador recursivo sin acentos/mayúsculas (`campos-prohibidos.ts`, clases incluidas `medio_de_pago`); tipo deducido por bytes mágicos y persistido; nombre interno propio.
- **Evidencia:** `ab51bb8`; `e1bb9a1` (G-172); `a209d65` (G-218); `1f5009a` (G-159); `9f2afb4`.

### AL-27 · Cliente HTTP saliente endurecido
- **Categoría:** seguridad
- **Forma correcta:** https obligatorio fuera de dev/test, sin seguir redirecciones, cuerpo acotado; el texto crudo del tercero va a la bitácora y a la persona un mensaje propio con código de soporte.
- **Evidencia:** `e1bb9a1` (G-164/G-176, G-178).

### AL-28 · Límite de ritmo primero y probado; proxy declarado
- **Categoría:** seguridad
- **Forma correcta:** throttler como primer `APP_GUARD`; techo propio en rutas anónimas que escriben; `trust proxy` por `API_SALTOS_DE_PROXY`; cubo por sujeto después del guard. Un `@Throttle` sin prueba «se borra en el primer refactor».
- **Evidencia:** `3b5f1c1`; `1f16701`.

### AL-29 · Infraestructura sin privilegios y cadena de suministro vigilada
- **Categoría:** seguridad / infra
- **Forma correcta:** `USER node` en el stage base; `nginx-unprivileged`; `proxy_set_header Host $proxy_host`; gitleaks sobre los commits del push; semgrep como puerta con línea base 0; `npm audit` alto.
- **Evidencia:** `c8e4d9b build(seguridad): línea base del SAST en cero…`; `c550a45`.
- **Guarda:** `.husky/pre-push`, `.gitleaks.toml`.

---

## 4. Validación y contratos

### AL-30 · Los formularios validan contra el mismo esquema que la API
- **Categoría:** validación / frontend
- **Antipatrón:** cada formulario decidía a mano si podía enviarse (`datos.codigo.trim() !== ''`), permitiendo lo que el DTO rechaza.
- **Forma correcta:** esquema de escritura derivado del de lectura con `pick` + `safeExtend`; `@ts-expect-error` que falla la compilación si la garantía se rompe; aviso tras visitar el campo con `aria-invalid`/`aria-describedby`.
- **Evidencia:** `0e3aa49 feat(web): los formularios validan contra el mismo esquema que la API` (PR #110); `854a1e2` (G-033/G-041).

### AL-31 · Ausente ≠ vacío ≠ «no tocar»
- **Categoría:** validación / contratos
- **Antipatrón:** `?? []` en el controlador que convierte campo ausente en lista vacía (borra cargas); PUT que reutiliza el DTO de alta (omitir `estado` = reactivar); PATCH que exige todo.
- **Forma correcta:** `null`/`undefined` = conservar, lista vacía = desvincular; DTO de actualización propio; `PATCH` parcial que rechaza el cuerpo vacío; `PUT` que exige los campos aunque valgan `null`.
- **Evidencia:** `8eec211 fix(planificacion): omitir la lista de cargas deja de borrarlas`; `a234eb7` (G-075); `a209d65` (G-216); `e1bb9a1` (G-175).
- **Detección:** `grep -rn "?? \[\]" API/src/modules/*/api`

### AL-32 · Fecha-hora siempre con offset, en el borde y en todo el camino
- **Categoría:** validación / tiempo
- **Antipatrón:** `@IsISO8601({strict:true})` acepta `2026-08-16` (se guarda el día anterior); `Date` crudo al escribir; captadores locales sobre medianoche UTC de Excel; `split('/')`/`replace(', ')` sobre texto formateado por `Intl`; `datetime2` en parámetros.
- **Forma correcta:** `@EsFechaHoraConOffset` en todo campo fecha-hora; `comoHoraDelTms` en un solo sitio; `partesEnLima` + `formatToParts`; getters UTC para celdas de Excel; la API exige al arrancar que el motor estampe `-05:00`; `TZ=America/Lima` fijado en la prueba que lo necesita.
- **Evidencia:** `a234eb7` (G-076); `96ba7fe fix(recepcion): la fecha de Excel se guardaba un dia antes…`; `ae0d1f6 refactor(web): un instante solo tiene día y hora visto desde una zona`; `9f2afb4` (G-138); `396e919`; `6607938` (8116 por datetime2); `a2c10a2` (G-213).
- **Detección:** `grep -rn "IsISO8601" API/src | grep -v EsFechaHoraConOffset`; `grep -rnE "\.split\('/'\)|replace\(', '" WEB/src/**/fecha*`; `new Date()` en adaptadores de escritura.

### AL-33 · Parseo numérico de entrada sin ambigüedad de separadores
- **Categoría:** validación
- **Antipatrón:** guardia de miles con dos condiciones que dejaba pasar `26,607` → `parseFloat` = 26,607 kg (mil veces menos).
- **Evidencia:** `96ba7fe` (primera prueba del repo, ejecutada en rojo antes del arreglo).

### AL-34 · Sellar el hecho en vez de deducirlo de una ausencia
- **Categoría:** modelado / validación
- **Antipatrón:** «es suelta» = `contenedor IS NULL`; `suelta BIT` que colapsa tres tipos; operación deducida con `CASE WHEN i.id IS NOT NULL` repetido en nueve consultas; clave única de recalada sin terminal.
- **Forma correcta:** columna sellada (`tipo_carga NVARCHAR(20)` + CHECK, `operacion`), la regla que la clasifica en `recepcion/domain` y en la comparación de reingesta.
- **Evidencia:** `1236479 refactor(modelo): sellar los hechos que el esquema deducia`; `b222814 fix: el sello tipo_carga decide qué es carga suelta en toda la API`.

### AL-35 · Cambios de contrato en dos pasos (A/B) y compatibilidad explícita
- **Categoría:** contratos / despliegue
- **Antipatrón:** renombrar un parámetro partido entre ramas → filtro que devuelve todo sin error; retirar un campo que la web desplegada aún envía (400 en cada guardado con `forbidNonWhitelisted`).
- **Forma correcta:** paso A: el servidor atiende ambas formas (el nuevo manda, el viejo `deprecated` en Swagger); paso B: se retira y las pruebas de humo se **invierten** (afirman 404). Orden de despliegue declarado.
- **Evidencia:** `420d8d0 fix(planificacion): atender los dos nombres del filtro de cargas`; `779ea54`; `854a1e2`; `a234eb7`; `3bba3c1`.

### AL-36 · DTO del teléfono tolerante, portal estricto
- **Categoría:** validación
- **Forma correcta:** `@ContratoDelTelefono()` marca los DTO de `/unitrans`; la tubería descarta el campo desconocido ahí y sigue con `forbidNonWhitelisted` en el portal.
- **Evidencia:** `583007e` (G-150).

---

## 5. Migraciones y base de datos

### AL-37 · Las migraciones congelan su lista: enumerar miembros, nunca `Object.values(Enum)`
- **Categoría:** migraciones
- **Antipatrón:** CHECK generado con `Object.values(CodigoCheckpoint)` = enum de HOY; una migración vieja prohibía el valor que su propia semilla insertaba y la cadena no corría desde cero.
- **Forma correcta:** `checkListaCerrada('t','c',[Enum.A, Enum.B])` — si alguien borra un miembro la migración deja de **compilar**. Ampliar = migración nueva.
- **Evidencia:** `d82c78a fix(migraciones): la cadena no podia correr sobre una base nueva`; `609a0c0 fix(migraciones): congelar las listas cerradas…` (PR #93).
- **Detección:** `grep -rnE "Object\.(values|keys|entries)" API/src/shared/infrastructure/persistence/migraciones`
- **Guarda:** `no-restricted-syntax` en el override de migraciones de `API/.eslintrc.cjs`.

### AL-38 · Una migración publicada no se edita; si se toca, su SQL debe ser idéntico
- **Categoría:** migraciones
- **Forma correcta:** huella SHA-256 de `up()` y `down()` antes y después (`scripts/huella-de-migracion.mjs`), citada en el commit por migración; la prosa larga va a `docs/02-diseno/decisiones-en-las-migraciones.es.md`. Migraciones fuera de umbrales de complejidad por diseño (son historial).
- **Evidencia:** `583007e` (diez migraciones con su huella); `03150e4`; `API/README.md` «Una migración publicada no se edita».
- **Guarda:** `huella-de-migracion.mjs` (manual) + override de ESLint.

### AL-39 · La cadena de migraciones corre desde una base vacía y se verifica contra SQL Server real
- **Categoría:** migraciones / pruebas
- **Forma correcta:** base efímera por corrida con todas las migraciones; subir, bajar y volver a subir las nuevas; comparar el esquema resultante (objetos, CHECK carácter por carácter).
- **Evidencia:** `d82c78a`; `609a0c0`; `6607938` (G-192); `583007e`.
- **Guarda:** `npm run test:integracion` (pre-push si el motor responde).

### AL-40 · Rellenos de datos no inventan: lanzan ante la ambigüedad
- **Categoría:** migraciones
- **Evidencia:** `94e9631` (`SucursalObligatoriaEnElRequerimiento` lanza si hay nulos conviviendo con otra sede).

### AL-41 · Bitácoras append-only protegidas por la base
- **Categoría:** base de datos / auditoría
- **Forma correcta:** disparadores `INSTEAD OF UPDATE, DELETE` en las tablas append-only.
- **Evidencia:** `1f5009a` (G-222).

### AL-42 · DDL solo en migraciones; columnas muertas se retiran
- **Categoría:** base de datos / código muerto
- **Antipatrón:** la aplicación creando secuencias; `id_tipo_carga`/`id_estado_carga` sin FK y siempre NULL; `codigo_nave_sap` muerta.
- **Evidencia:** `494f18d` (SEQUENCE por migración: el usuario de la API no ejecuta DDL); `1236479`.

---

## 6. Complejidad y tamaño

### AL-43 · Umbrales D4 como puerta, y la lista de exentos solo encoge
- **Categoría:** complejidad
- **Antipatrón:** `eslint.config.js` fijaba umbrales y los apagaba para 36 ficheros; `ModalNaveViaje` 230 líneas; modal de versiones 279 líneas/complejidad 38; `ejecutar` de ingesta 147 líneas.
- **Forma correcta:** 50 líneas/función (incluye JSX), 3 parámetros, complejidad 10, profundidad 3, 250 líneas/fichero. Cada fichero arreglado sale de la lista; nada entra; el código nuevo que incumple se arregla, no se exime.
- **Técnicas usadas:** partir en hook + componentes; extraer `admitir`/`persistir`; mover decoradores de OpenAPI a su propio fichero (`cargar` 77→<50 sin tocar lógica); agrupar parámetros en objeto (`Escritura`, `Paginacion`, descriptor en fixtures); partir controladores por responsabilidad (`programacion.controller`, `edicion-del-servicio.controller`); `use-mantenimiento.ts` para el bloque repetido.
- **Evidencia:** `d38764a`; `9591ba5 refactor(web): la lista de exentos de umbrales baja de 36 a 16` (PR #107); `03150e4` (34→20); `41da98a` (36→28); `9f2afb4` (web sin exentos); `10d0b31`; `fa375c9`; `effde09`.
- **Detección:** `npx eslint . --rule 'max-lines-per-function:[error,50]'…` o simplemente `npm run lint`; revisar crecimiento de la lista `overrides[0].files`.
- **Guarda:** ambos ESLint.

### AL-44 · Una exención es una regla con razón, no una lista de nombres
- **Categoría:** complejidad / gobernanza
- **Antipatrón:** nueve ficheros de prueba exentos «por el mismo motivo».
- **Forma correcta:** `max-lines-per-function: off` para `**/*.prueba.{ts,tsx}` (un `describe` es contenedor), manteniendo `max-lines` sobre el fichero. Excepciones por diseño con comentario del porqué (migraciones, `edicion-concurrente.spec.ts`).
- **Evidencia:** `7e94384 refactor(web): las listas de exención se cierran, y una era un umbral mal aplicado`.

### AL-45 · Comentarios cortos; la prosa larga va a docs
- **Categoría:** estilo / mantenibilidad
- **Forma correcta:** bloques de comentario ≤ 2 líneas con texto; la línea base por fichero solo baja.
- **Evidencia:** `583007e` (G-169/G-179).
- **Guarda:** `comentarios-cortos.spec.ts` + `scripts/base-de-comentarios-cortos.mjs`.

---

## 7. Duplicación y fuente única

### AL-46 · Una regla se escribe en un solo sitio
- **Categoría:** duplicación
- **Antipatrón:** filtro de sede solo en `listar` y no en resumen/contadores; checkpoint que avanza en un sitio y se borra en otro; `USUARIO_SISTEMA` pisando al usuario.
- **Forma correcta:** `condicionDeSede` única para los cuatro caminos de lectura; `checkpointSegunElViaje` decide en un solo sitio; un ayudante por hecho (`siguienteHito`, «otro viaje abierto»).
- **Evidencia:** `573c17b` (G-072, G-078, G-079); `9f2afb4` (G-166).

### AL-47 · Las reglas de negocio viven en la API; la web lee banderas
- **Categoría:** duplicación / capas
- **Antipatrón:** `esProgramable`/`esAsignable` en la web (sin pruebas) duplicando `exigirQueEncajen`; tope de 20 viajes escrito en ambos lados; tabla de estados finales en la web; carpeta `dominio/` en la web.
- **Forma correcta:** la API publica `puedeProgramarse`, `enCurso`, `hitosMarcables`, `siguienteHito`, topes; la web tiene `vocabulario/` con listas y **cero funciones**.
- **Evidencia:** `3bba3c1`; `cfaaa32`; `2f401f1 refactor(web): el vocabulario deja de llamarse dominio, y una regla lo sella`; `62568f7` (G-229); `9f2afb4` (G-156); `e1bb9a1`; `1f5009a` (G-208).
- **Guarda:** bloque `src/vocabulario/**` de `WEB/eslint.config.js` (prohíbe `FunctionDeclaration`, arrows y clases).

### AL-48 · Claves y catálogos derivados de una raíz, con exhaustividad por tipo
- **Categoría:** duplicación
- **Antipatrón:** prefijos de react-query repetidos (3, 5 y 7 veces) cuya divergencia rompe la invalidación en silencio; dos listas de pantallas (enrutador y sesión de desarrollo); nombres de icono como `string`; versión escrita en el JSX; lista de operaciones copiada cinco veces.
- **Forma correcta:** `RAIZ` por archivo y claves derivadas; `catalogo-de-pantallas.ts` único con tabla exhaustiva por tipo; `NombreDeIcono` derivado del catálogo; `__VERSION_TMS__` desde `package.json`.
- **Evidencia:** `eb37e2d`; `dc644ad` (G-055, G-085); `281061c`; `3bba3c1`.

### AL-49 · Extraer solo lo que de verdad se reutiliza (≥ 2 funcionalidades); no unir por coincidencia de la herramienta
- **Categoría:** duplicación
- **Antipatrón:** `compartido/m3/` usado solo por `sesion/`; unir bloques que jscpd ve seguidos pero son campos independientes.
- **Forma correcta:** criterio aplicado en ambas direcciones (subir `maestras`, bajar M3); se dejan clones a propósito (imports, migraciones, bloque de auditoría de DTO que cambia OpenAPI). Sí se extrae: `colaDeConsulta`, campo de búsqueda, `Tabla`, `CuerpoConEstados`, `useMaestrasDeViaje`, `alElegirVehiculo`, `use-mantenimiento`, sello de auditoría en la base de maestras, `RepositorioMaestra`.
- **Evidencia:** `cbedf4d`; `cfaaa32`; `288baff` (G-030 88→69); `c7c7fae` (87→76); `80b078a`; `478f2fd`; `462485b`; `80ea6b0`; `62568f7` (202→171).
- **Detección:** `npx jscpd src/apps --min-lines 10` (no versionado).

---

## 8. Frontend

### AL-50 · Presentación solo pinta; la lógica vive en `aplicacion/` (ViewModel en hooks)
- **Categoría:** frontend / capas
- **Antipatrón:** modales y páginas con estado, consultas y mutaciones dentro; ViewModel dentro del `.tsx`.
- **Forma correcta:** `infraestructura/` (cable), `aplicacion/` (hooks sin JSX, resuelve el error a texto, probados con `renderHook`), `componentes/`/`paginas/` solo vista; `app/` arriba; features no se importan entre sí; red y almacenamiento solo por `nucleo/`.
- **Evidencia:** `3bba3c1` (ADR-TMS-020); `6ab8de7`; `80ea6b0`; `d50af8d`; `98242fa`; `56bb24d`.
- **Guarda:** bloques de aplicación/presentación y `no-restricted-globals` en `WEB/eslint.config.js`.

### AL-51 · Tokens de diseño; nada de valores arbitrarios ni controles a mano
- **Categoría:** frontend / consistencia visual
- **Antipatrón:** 8 tamaños de letra en 214 sitios (pares a medio píxel); `rounded-[9px]` ×14; `border-[1.5px]` ×25; `rgba()` crudo; tres grises para la misma cabecera; 21 botones escritos a mano; `mb-[18px]`.
- **Forma correcta:** escala en `@theme` (`text-rotulo/apunte/dato/control`), `border-(length:--borde-fino)`, `<Boton>`/`<BotonDeTexto>`, `<Tabla>`.
- **Evidencia:** `fc7f929`; `7e94384`; `80b078a`; `9e2ae80`; `0e3aa49`; `3bba3c1`.
- **Guarda:** `TAMANO_FUERA_DEL_TEMA` y `BOTON_ESCRITO_A_MANO` en `WEB/eslint.config.js`. Detección extra: `grep -rnE "#[0-9a-fA-F]{3,6}|rgba?\(" WEB/src --include=*.tsx`.

### AL-52 · Props de solo lectura
- **Categoría:** frontend / tipado
- **Evidencia:** `9e2ae80`; `1fc99dc` (799 props en 88 `.tsx`).
- **Guarda:** `react/prefer-read-only-props: error`.

### AL-53 · Un módulo exporta componentes o no-componentes, no ambos
- **Categoría:** frontend / Fast Refresh
- **Evidencia:** `ef9c1e1 refactor(web): useSesion sale del proveedor a su propio módulo`; `cbedf4d` (`ids-de-accesibilidad.ts`).
- **Guarda:** `react-refresh/only-export-components` (warn).

### AL-54 · La pantalla no afirma datos que ya no corresponden
- **Categoría:** frontend / estado
- **Antipatrón:** `placeholderData` previo con la consulta deshabilitada; selección que sobrevive a paginado/filtro; `useEffect` de montaje que pisa una preferencia; efectos en el cuerpo del render.
- **Evidencia:** `b4d561c`; `effde09`; `0567e11` (hallazgo 5, P-FE-08).

### AL-55 · Búsqueda con retardo en todas las cajas y mínimo de caracteres; cancelación no es error
- **Categoría:** frontend / rendimiento
- **Antipatrón:** cajas sin debounce (11 consultas por contenedor tecleado); abortar una petición publicaba «API caída» y gastaba el límite de ritmo; revalidación del grafo en bucle apretado.
- **Forma correcta:** retardo común; ≥ 2 caracteres; relanzar el `AbortError` original; piso de 30 s en la revalidación.
- **Evidencia:** `b4d561c` (G-086); `6607938`; `583007e`; `dc644ad` (G-084, G-087).

### AL-56 · Accesibilidad medida por prueba
- **Categoría:** frontend / a11y
- **Forma correcta:** contraste AA calculado desde `estilos.css` componiendo capas alfa; adornos con `aria-hidden`; errores de campo por descripción accesible.
- **Evidencia:** `c7c7fae` (G-049); `0e3aa49` (G-096).
- **Guarda:** pruebas de contraste de la web + `eslint-plugin-jsx-a11y`.

### AL-57 · Cabeceras de caché correctas para una SPA
- **Categoría:** frontend / HTTP
- **Antipatrón:** `expires 30d` + `add_header Cache-Control` = dos cabeceras `Cache-Control`; `index.html` sin política (heurística) → despliegue que se ve viejo.
- **Forma correcta:** una sola `public, max-age=2592000, immutable` para bundles con hash; `no-cache` en `index.html`.
- **Evidencia:** `2126368 fix(web): una sola cabecera Cache-Control en los estaticos` (PR #102); `556d8b5` (PR #101).
- **Detección:** `grep -n "expires\|Cache-Control" WEB/nginx.conf src/infra/tms-helm -r`

---

## 9. Pruebas

### AL-58 · Una prueba flaky se arregla en la causa, nunca subiendo el plazo
- **Categoría:** pruebas flaky
- **Antipatrón:** `waitFor` de 1 s gastando 300 ms de debounce; `aplicacion-de-prueba` con `init()` sin `listen()` (un puerto por petición, respuestas cruzadas bajo carga); nueve `import()` dinámicos en el plazo por defecto.
- **Forma correcta:** inyectar el retardo por contexto (0 en la prueba que no lo mide); `listen()`; plazo propio solo cuando uno corto no detecta nada que uno largo deje pasar, con la razón al lado. Demostrar el arreglo con A/B bajo carga, no con repeticiones.
- **Evidencia:** `c7c7fae … el retardo de búsqueda deja de robar plazo` (PR #109, G-092); `854a1e2` (G-099); `0e3aa49` (G-097); `4d38ed1`.
- **Detección:** `grep -rn "timeout:\|{ timeout" WEB/src API/src --include=*.prueba.* --include=*.spec.ts`

### AL-59 · Una prueba debe fallar sin el cambio y afirmar comportamiento, no implementación
- **Categoría:** calidad de pruebas
- **Antipatrón:** ayudantes que afirmaban sobre parámetros posicionales del SQL; spec que afirmaba el defecto (`idsCargas: []`); prueba renombrada para describir el desvío; lote construido a mano que nunca vio el 400; prueba de la defensa secundaria en vez de la que protege; fixture simétrico (exceljs escribe y lee) que no reproduce el bug; fixture aplanado.
- **Forma correcta:** verificar en rojo antes del arreglo; probar contra el DTO real con la configuración de `main.ts`; probar el artefacto (`dist/`); las reglas de lint también se prueban.
- **Evidencia:** `96ba7fe`; `4bc4178`; `8eec211`; `689849b` (G-067); `40ef5c0`; `0567e11` (hallazgo 7); `0ad8f9d`; `30153cc`; `5f869fc`.

### AL-60 · Pisos de cobertura que fallan cerrado y solo suben
- **Categoría:** pruebas / cobertura
- **Antipatrón:** glob que medía `*.integracion.spec.ts` como fuentes al 0 %; ramas nuevas sin prueba (80 % → 60,86 %); piso que reescribe su JSON.
- **Evidencia:** `9f2afb4` (G-193); `62568f7`; `715a94b`.
- **Guarda:** `test:cobertura:infraestructura` + `piso-de-cobertura.mjs`; `coverageThreshold` de jest/vitest en `test:cobertura`.

### AL-61 · Lo que depende del motor se prueba contra el motor
- **Categoría:** pruebas
- **Forma correcta:** carril `test:integracion` con base efímera; los dobles verifican la forma del SQL, no que SQL Server lo acepte.
- **Evidencia:** `6607938` (G-192, destapó el 8116 de `datetime2`); `d3c7c60`.

---

## 10. Código muerto, nombres y tipado

### AL-62 · Limpieza medible: exports, dependencias, alias y artefactos
- **Categoría:** código muerto
- **Antipatrón:** 43 símbolos exportados sin uso externo; cuatro dependencias muertas; alias de importación que compilaban pero no resolvían en ejecución; 100 specs en `dist`; `fijarLocalizador` sin uso; `import type {}` vacío.
- **Forma correcta:** comprobar cada candidato antes de borrar (`dotenv` y `@types/multer` estaban vivos); `tsconfig.build.json` excluye specs.
- **Evidencia:** `a004bfc chore(api): limpieza medible…` (PR #111); `396e919`; `1236479`.
- **Detección:** `npx knip`; `npx ts-prune`.
- **Guarda:** `IMPORT_SIN_SIMBOLOS`, `@typescript-eslint/no-unused-vars`.

### AL-63 · Sin conversiones forzadas ni imports a las tripas de paquetes
- **Categoría:** tipado
- **Antipatrón:** `as unknown as` para el `Buffer` de exceljs; imports de `@nestjs/swagger/dist/...` y `typeorm/query-builder/...`; `Array.prototype.at` con `lib` ES2020; `@types` heredados del azar.
- **Forma correcta:** adaptador que comprueba en ejecución; usar la superficie pública (`exports`); `types` y `esModuleInterop` explícitos.
- **Evidencia:** `a004bfc` (G-040); `6049172 build: las tres aplicaciones suben a Node 24 y TypeScript 6`.
- **Detección:** `grep -rn "as unknown as" src/apps/*/src`; `grep -rnE "from '[^']+/dist/" src/apps/*/src`.
- **Guarda:** `@typescript-eslint/no-explicit-any` (parcial).

### AL-64 · Nombres que distinguen conceptos
- **Categoría:** nombres
- **Antipatrón:** `consulta.ts` vs `consultas.ts` sin relación; carpeta `dominio/` en la web que invitaba a reintroducir reglas.
- **Forma correcta:** nombrar por lo que exporta (`cola-de-consulta.ts`) o guarda (`vocabulario/`); un sufijo significa una sola cosa en todo el repo.
- **Evidencia:** `efdfebc refactor(web): dos archivos ya no se distinguen por una s`; `2f401f1`.

---

## 11. Rendimiento y operación

### AL-65 · Caché con invalidación por construcción
- **Categoría:** rendimiento
- **Antipatrón:** consolidado de 605 líneas de SQL reejecutado en cada filtro; repartir `invalidar()` por casos de uso («lo que se olvida es siempre el sexto»).
- **Forma correcta:** clave con **todos** los argumentos (incluida la sede) + número de generación; un interceptor sube la generación en toda escritura exitosa (las fallidas no invalidan); almacén sustituible en `cache.module.ts`.
- **Evidencia:** `2243f6c perf(api): caché de lectura del consolidado…` (177 ms → 2 ms).

### AL-66 · La sonda de readiness pregunta una sola cosa
- **Categoría:** operación
- **Antipatrón:** readiness con cuatro consultas (versión, intercalación, conteos) y pública.
- **Forma correcta:** `SELECT 1`; diagnóstico en `/salud/detalle` con `@SoloIdentidad()`.
- **Evidencia:** `036c37c refactor(api): la sonda de readiness pregunta una sola cosa`.

### AL-67 · Observabilidad: el error se registra una vez; cada escritura se narra
- **Categoría:** observabilidad
- **Antipatrón:** log-and-throw (`logException: true`); CRUD de maestras con «etapas contadas: 0»; una traza por petición en vez de por acción; niveles `aviso` vs `warn` desalineados; sin desenlace al abortar; métrica con id de transacción como etiqueta.
- **Forma correcta:** el filtro HTTP registra el error una sola vez; `narrar()` en la clase base de maestras; transacción por navegación con hijas por escritura; desenlace en `finish` y `close`; métricas sin cardinalidad por petición.
- **Evidencia:** `8145ed6`; `0ad8f9d`; `51c2033`; `494f18d`; `d7fceb7`.

---

## 12. Dependencias, build y puertas

### AL-68 · Dependencias reproducibles y parches mínimos
- **Categoría:** dependencias
- **Antipatrón:** paquetes por ruta relativa `file:` fuera del contexto de Docker; tarballs locales en el lock; override global que degrada otro camino.
- **Forma correcta:** versión publicada en el registro; override acotado por major y justificado; el salto mínimo que cierra el aviso.
- **Evidencia:** `daea880`; `2d54682`; `246a248`; `0c69be0`; `06c3414`.

### AL-69 · Una puerta que no comprueba lo dice, y una que no comprueba nada falla
- **Categoría:** gobernanza de guardas
- **Forma correcta:** los pasos opcionales avisan al degradarse («un hook que calla lo que no comprobó miente»); `verificar-bundle.mjs` falla si no encuentra ninguna configuración; toda regla nueva se comprueba «que muerde» con una sonda; un gate nuevo nace como aviso hasta línea base 0 y después bloquea.
- **Evidencia:** `c550a45`; `c8e4d9b`; `e1283a7`; `03150e4`; `83639e3`.

### AL-70 · La prosa se contrasta contra el árbol
- **Categoría:** documentación verificable
- **Antipatrón:** documentación que cita rutas, nombres de base (`tms_db`) o workflows que no existen; `@ApiBody` que anunciaba un campo que devolvía 400; descripción de Swagger falsa.
- **Evidencia:** `e1283a7 feat(gobernanza): la prosa se contrasta contra el árbol…`; `1b685f5`; `288baff`; `3b5f1c1`.
- **Guarda:** `node scripts/validar-prosa.mjs --estricto` (pre-push) + su prueba.

---

## Patrones de diseño mencionados o aplicados

| Patrón | Explícito / implícito | Dónde (evidencia) |
|---|---|---|
| **Arquitectura hexagonal (Ports & Adapters)** | Explícito | Capas domain/application/infrastructure/api; puertos `SondaDeBaseDatos`, `ExportadorDeCargas` (`03150e4`); puertos entre módulos por token (`61594b6`, `6607938`, `9f2afb4`); ADR-TMS-015 |
| **Repository / Data Mapper** | Explícito | `RepositorioMaestra` (`62568f7`), repositorios TypeORM, entidades ORM por tabla (`1fc99dc`); ADR-TMS-023 |
| **Adapter** | Explícito | Adaptador del `Buffer` de exceljs con comprobación en ejecución (`a004bfc`); adaptadores de persistencia; cliente XMS (`e1bb9a1`) |
| **Result / Either (neverthrow)** | Explícito | Casos de uso devuelven `Result`; `enTransaccion` traduce `err`↔excepción (`573c17b`); `guardar` devuelve resultado (`d821184`); razón para no poner `@LogMethod` en casos de uso (`8145ed6`) |
| **Strategy (mapa de estrategia)** | Explícito | «mapa de estrategia para clasificaciones con valor» (`478f2fd`); tabla de errores + switch exhaustivo (`03150e4`) |
| **Decorator / AOP** | Explícito | `@Retry`, `@LogMethod`, `@Trace` (`dab0416`, `8145ed6`, `5f869fc`); decoradores de parámetro `@Autor`, `@Escribe`, `@Sede`; `@AcotadaASede`, `@Exige`, `@SoloIdentidad`, `@ContratoDelTelefono` |
| **Interceptor** | Explícito | Invalidación de caché por generación (`2243f6c`); `TransformInterceptor` |
| **Guard / Chain of responsibility** | Explícito | `GuardUms`, `GuardDeSedeDelServicio`, throttler como primer `APP_GUARD` (`3b5f1c1`, `6607938`) |
| **Facade** | Explícito | `relato` (fachada sin dependencias para narrar), `trazas-w3c.ts` como fachada durante la migración (`494f18d`, `a70b46f`) |
| **Template Method** | Implícito | `GestionarMaestraCasoUso`, clase base de las seis maestras con `narrar()` en un solo sitio (`0ad8f9d`); sello de auditoría en la base (`288baff`) |
| **Parameter Object** | Implícito | `Escritura` (autor + testigo, `779ea54`), `Paginacion`, `peticion` (`.eslintrc.cjs`), descriptor en `opcion()` (`10d0b31`) — impuesto por `max-params: 3` |
| **Optimistic concurrency / Compare-and-set** | Explícito | `ROWVERSION` + `If-Match` (`779ea54`, `854a1e2`); CAS en cada escritura del servicio (`1b39129`, ADR-TMS-024) |
| **Lease (arriendo con caducidad)** | Explícito | Reserva del servicio 2 min renovable (`71cef88`); luego retirado por negocio (ADR-TMS-025) |
| **Idempotency key** | Explícito | `clave_origen`, reenvío cruzado con `repetida: true` (`e1bb9a1`, `a2c10a2`) |
| **Retry con predicado** | Explícito | Reintento de interbloqueo sobre la transacción entera (`dab0416`) |
| **Cache-aside con invalidación generacional** | Explícito | `cache-por-generacion.ts` (`2243f6c`) |
| **Expand/Contract (Parallel Change, paso A/B)** | Explícito | Alias `mantenimientos/*`, retiro de `usuario`, `suelta`→`sinContenedor`, `If-Match` (`420d8d0`, `779ea54`, `854a1e2`, `a234eb7`) |
| **MVVM / ViewModel en hooks (Container–Presentational)** | Explícito | «tenían su ViewModel dentro del .tsx. Pasan a sesion/aplicacion/ como hooks sin JSX» (`6ab8de7`, `80ea6b0`, `d50af8d`, ADR-TMS-020) |
| **Registry / Single Source of Truth** | Implícito | `catalogo-de-pantallas.ts` del que derivan enrutador y sesión de desarrollo (`dc644ad`); `RAIZ` de claves react-query (`eb37e2d`); enum único para CHECK y 400 (`83639e3`, `609a0c0`) |
| **Special Case / Null Object** | Implícito | `identidadDeDesarrollo()` / `sesionDeDesarrollo()`: satisface la autorización en vez de saltarla (`fa375c9`, `44c3b29`) |
| **Sink / Observer** | Explícito | `sink-aop.ts` traduce ganchos del aspecto a `registrarEtapa` (`dab0416`) |
| **Factory** | Implícito | Fábrica del localizador `TX-AAAA-NNNNNN` desde SEQUENCE, inyectada por clase concreta (`494f18d`) |
| **Health Check (readiness vs. diagnóstico)** | Explícito | `036c37c` (`micro-use-health-checks`) |
| **Rate Limiter / Throttling** | Explícito | `3b5f1c1`, `1f16701` |
| **Fail-closed / Secure by default** | Explícito | ADR-TMS-017, `0567e11`, `1f5009a` |
| **Transactional Outbox (parcial)** | Implícito | Avisos emitidos fuera de la transacción con las filas que devolvió `OUTPUT`, sin tumbar el caso de uso (`e1bb9a1`, `396e919`) |
| **Anti-Corruption Layer** | Implícito | Vistas `SCHEMABINDING` del dueño como contrato de lectura entre módulos (`62568f7`, `583007e`); mensaje propio en lugar del texto crudo de XMS (`e1bb9a1`) |
