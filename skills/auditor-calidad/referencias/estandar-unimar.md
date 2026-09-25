# Insumo para la skill de auditoría de CALIDAD DE CÓDIGO — estándar Unimar

Fuentes leídas (solo lectura): `C:\Christian\unimar_arch` (núcleo), `C:\Christian\unimar-shells` (librerías crosscutting + tooling), `C:\Christian\unimar_tms` (consumidor). Fecha de lectura: 2026-09-25.

Abreviaturas de ruta:

- `ARCH/` = `C:\Christian\unimar_arch\reference\architecture\`
- `ADR/` = `ARCH/adrs/` (subcarpetas `core/`, `nodejs/`, `android/`, `dotnet/`)
- `CP/` = `ARCH/canonical-patterns/`
- `SHL/` = `C:\Christian\unimar-shells\`
- `TMS/` = `C:\Christian\unimar_tms\` · `API/` = `TMS/src/apps/api/` · `WEB/` = `TMS/src/apps/web/`

Precedencia (CLAUDE.md global + ADR-0127): CLAUDE.md del repo > ADR-TMS (posterior gana) > ADR del núcleo. El TMS **traduce** todo lo PostgreSQL a SQL Server (ADR-TMS-007) y triaja la herencia en `TMS/DECISIONS.md` (Adopt/Extend/Override/N/A). Un auditor debe leer ese triaje antes de acusar una desviación: puede estar declarada.

---

## 1. Reglas de calidad verificables

Formato: **ID · regla · fuente · cómo verificar**. Los `rg` asumen cwd = `API/src` (backend) o `WEB/src` (frontend) salvo que se indique.

### 1.1 Capas hexagonales y dependencias

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-01 | Tres capas + entrada: `domain` (TS puro), `application` (casos de uso), `infrastructure` (adaptadores), `api` (entrada). Dirección Infra → App → Dominio, nunca a la inversa | `ADR/nodejs/0002-arquitectura-limpia-nestjs.es.md`; tabla de tags `type:domain/application/infrastructure/api` en `ARCH/stack-tecnologico-autorizado-nodejs.es.md` | Estructura `modules/*/{domain,application,infrastructure,api}`; `npm run fronteras` (dependency-cruiser) en API |
| ARCH-02 | El dominio tiene **cero** imports de NestJS, TypeORM, SDKs, pino, OTel | ADR-0002 §1; stack Node tag `type:domain` | `rg -n "from '(@nestjs|typeorm|pino|@opentelemetry|axios|mssql)" modules/*/domain` → 0 (excluir `*.spec.ts`) |
| ARCH-03 | Aplicación: solo `@Injectable` de NestJS; sin imports de infraestructura (TypeORM, Redis, HTTP) | ADR-0002 §2; stack Node tag `type:application` | `rg -n "from '(typeorm|@nestjs/typeorm|ioredis|axios)" modules/*/application` → 0; `rg -n "from '\.\./infrastructure" modules/*/application` → 0 |
| ARCH-04 | Infraestructura no contiene lógica de negocio: solo implementa puertos | stack Node tag `type:infrastructure` | Revisión humana: adaptadores sin `if` de regla de negocio; repos sin decisiones de dominio |
| ARCH-05 | AOP (logging, tracing, caché, transacción) fuera de dominio/aplicación: interceptores/middleware/decoradores **solo en infraestructura/entrada**. Prohibido `@Cacheable`, `@OpentelemetrySpan`, `@SentryCapture` en casos de uso | ADR-0002 §4; ADR-0019 §3; ADR-0007 (instrumentación en infra) | `rg -n "@(Cacheable|Span|Trace|SentryCapture|Aspect)" modules/*/{domain,application}` → 0 |
| ARCH-06 | Las fronteras de capa se **imponen por máquina** en CI/puerta local, no por revisión | ADR-0003 (nombra `eslint-plugin-boundaries`); G-434/G-178 en `C:\Christian\unimar_arch\GAPS.md` aceptan como equivalente real `@nx/enforce-module-boundaries`/`no-restricted-imports` | Existe regla ejecutable: TMS usa `API/.dependency-cruiser.cjs` (script `fronteras`) + `no-restricted-imports` en `API/.eslintrc.cjs` y `WEB/eslint.config.js`. Verificar que el pre-push la invoca |
| ARCH-07 | Comunicación entre módulos/contextos por **puerto** declarado en el dominio del dueño; nunca importar la infraestructura de otro módulo | ADR-0015 §2-3; ADR-0098 D9.3; ADR-TMS-015 §3 | dependency-cruiser regla `solo-superficie-publica-ajena`; `rg -n "modules/[a-z-]+/infrastructure" modules --glob '!*.orm-entity.ts'` cruzando módulos |
| ARCH-08 | El dominio no conoce el transporte de eventos: `EventEmitter2`, `@golevelup/nestjs-rabbitmq`, `kafkajs` solo en infraestructura. El dominio importa solo `IEventBusPort` | `ADR/nodejs/0203-concrecion-node-del-puerto-de-eventos-intradominio.es.md` P-EV-01/02 | `rg -n "(EventEmitter2|nestjs-rabbitmq|kafkajs)" modules/*/{domain,application}` → 0 |
| ARCH-09 | `src/` es la raíz de fuente única | `ADR/core/0107-src-raiz-de-fuente-unica.es.md` | Estructura de carpetas |
| ARCH-10 | Frontend en capas: dominio (contratos TS sin React) → infraestructura (fetch/SSE/RxJS) → adaptadores (hooks) → presentación (componentes puros). TMS lo concreta en `infraestructura/ → aplicacion/ → componentes|paginas` | `ADR/core/0109-doctrina-ingenieria-frontend-avanzada.es.md` §2.6; ADR-TMS-020 §3 | `rg -n "fetch\(" WEB/src --glob '!**/infraestructura/**'` → 0; `no-restricted-imports` de `WEB/eslint.config.js` |

### 1.2 Dominio y DDD táctico

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-11 | Primitivas DDD (`AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`) importadas vía **barrel local** re-exportador, no directamente de la librería | `ADR/nodejs/0029-libreria-primitivas-ddd-tactico.es.md` §3 | `rg -n "from '@(nestjslatam|unimar-peru)/.*ddd" modules` → solo en un archivo proxy de `shared/` |
| ARCH-12 | Propiedades de `ValueObject` **`readonly`** (inmutables) | ADR-0029 Restricciones | `rg -n "extends .*ValueObject" -A15` y comprobar `readonly`; revisión |
| ARCH-13 | Cero decoradores ORM (`@Entity`, `@Column`) en clases de dominio | ADR-0029; ADR-0043 §1 | `rg -n "@(Entity|Column|PrimaryColumn|ManyToOne)" modules/*/domain` → 0 |
| ARCH-14 | Un caso de uso modifica **un solo agregado por transacción** (salvo escape D5 declarado en ADR de producto) | `ADR/core/0098-comunicacion-entre-agregados-intra-servicio.es.md` D2, D9.1 | Revisión: casos de uso que llaman `save` de ≥2 repos de agregados distintos en la misma transacción |
| ARCH-15 | Evento de dominio despachado **después** del commit, en proceso, transacción nueva por receptor; nunca antes del commit | ADR-0098 D4, D9.2 | Revisión del despachador (debe ser infraestructura, D8) |
| ARCH-16 | No se muta un agregado ajeno **por su repositorio** desde el caso de uso de otro | ADR-0098 D9.3 | Revisión: inyección de repos de otro agregado en casos de uso mutadores |
| ARCH-17 | Sin bróker/cola para handoff que no sale del proceso | ADR-0098 D4, D9.4 | Revisión |
| ARCH-18 | Evento intra-servicio: tipo nombrado, en pasado, con identidad del emisor; prohibido payload anónimo o `string` mágico | ADR-0098 D7 | `rg -n "publish\(['\"]" modules` → 0 |
| ARCH-19 | Evitar `null` como resultado lógico: objeto vacío tipado u `Optional`/`Result` | `ADR/core/0019-patrones-diseno-tactico-escalabilidad-futura.es.md` §2 | `rg -n "Promise<.*\| null>" modules/*/{domain,application}` (revisión caso a caso: repos de lectura pueden devolver `null` si el puerto lo declara) |
| ARCH-20 | Borrado lógico de agregados; el método de borrado físico **no existe** en el contrato del repositorio; desactivar ≠ eliminar | `ADR/core/0164-el-borrado-es-logico-y-la-clave-natural-no-se-reutiliza.es.md` §2.1, §2.4; en TMS acotado por ADR-TMS-012 | `rg -n "\.(delete|remove)\(" modules/*/infrastructure` → justificar cada uno |

### 1.3 Errores y patrón Result

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-21 | Casos de uso y entidades **devuelven** `Result<T, E>` (neverthrow); no lanzan para errores de negocio | `ADR/nodejs/0038-estrategia-manejo-errores-patron-result.es.md` §1; ADR-0019 §1; `CP/nodejs/cp-08-result-pattern-neverthrow.es.md`; ADR-0056 R6 | `rg -n "throw new" modules/*/{domain,application} --glob '!*.spec.ts'` → 0 (hoy TMS = 0); firmas `Promise<Result<` en `*.caso-uso.ts` |
| ARCH-22 | El dominio no conoce HTTP: sin `HttpException`, sin códigos de estado en dominio/aplicación | ADR-0038 §3.1; ADR-0019 contexto | `rg -n "(HttpException|HttpStatus|BadRequestException|NotFoundException)" modules/*/{domain,application}` → 0 |
| ARCH-23 | `DomainError` por módulo como **unión discriminada** (`type`/código) | CP-08 Reglas | Revisión de `domain/errores*.ts` |
| ARCH-24 | El controlador es el **límite de traducción**: mapea cada `DomainError` a HTTP (400/403/409/422) con un mapeador explícito | ADR-0038 §3.3; CP-08 | Revisión de `api/*.controller.ts`: `result.isErr()` / `match` + tabla de mapeo |
| ARCH-25 | Filtro global solo para fallos de infraestructura no manejados: sin stack trace, con `traceId`, JSON opaco 500 | ADR-0038 §3.4; CLAUDE.md TMS (`HttpExceptionFilter`) | Revisar el filtro global; `rg -n "stack" shared/**/filtro*` |
| ARCH-26 | Transitorio (infra) → reintento con backoff/circuit breaker en adaptador; dominio 100 % agnóstico a resiliencia | `ADR/core/0011-patrones-resiliencia-tolerancia-fallos.es.md` §2-3; ADR-0038 §2 | `rg -n "(p-retry|opossum|pRetry)" modules/*/{domain,application}` → 0 |
| ARCH-26b | Background jobs traducen `err` a reintento con backoff | CP-08 Reglas | Revisión de schedulers/workers |

### 1.4 Persistencia, ORM y migraciones

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-27 | TypeORM **Data Mapper**; **Active Record prohibido** | `ADR/nodejs/0043-estrategia-acceso-datos-orm.es.md` §1 | `rg -n "extends BaseEntity" .` → 0; `rg -n "\.(save|find|remove)\(\)" --glob '*.orm-entity.ts'` → 0 |
| ARCH-28 | Entidad de dominio separada del modelo de persistencia `@Entity` + mapper Entidad↔ORM en infraestructura | ADR-0043 §1; ADR-0002 Consecuencias | Existencia de `*.orm-entity.ts` + `*mapper*`/mapeo en `infrastructure/persistence` |
| ARCH-29 | Todo acceso a datos por repositorio inyectado que implementa un puerto del dominio; SQL nativo solo **oculto tras el puerto** | ADR-0043 §1, §3; ADR-TMS-023 D2-D3 | `rg -n "(getRepository|dataSource\.query|\.query\()" modules/*/{domain,application,api}` → 0 |
| ARCH-30 | `synchronize: true` prohibido en producción; migraciones TS explícitas vía CLI | ADR-0043 Migraciones | `rg -n "synchronize:\s*true" .` → 0 fuera de pruebas |
| ARCH-31 | 3NF por defecto; FK, NOT NULL e índices únicos obligatorios; desnormalizar solo con ADR | `ADR/core/0054-estandares-diseno-normalizacion-base-datos.es.md` §3.1 | Revisión de migraciones |
| ARCH-32 | Riesgo N+1 vigilado (relaciones cargadas) | ADR-0043 Riesgos | Revisión: `find` en bucles, `relations:` masivas |
| ARCH-33 | SQL Server: collation explícita (`CS_AS`), `UNIQUE` con NULL → índice filtrado, `NVARCHAR(MAX)` no indexable, cascadas → `NO ACTION`, `ON CONFLICT` → `MERGE … WITH (HOLDLOCK)` | `ADR/core/0227-el-motor-pasa-a-sql-server-y-la-capa-que-lo-desacopla-se-ratifica.es.md` §2.2-2.3; CLAUDE.md TMS | `rg -n "MERGE" --glob '*.ts' -A2 | rg -v HOLDLOCK`; `rg -n "COLLATE" migraciones` |
| ARCH-34 | Auditoría a nivel fila (creador/fecha/actualizador/versión) y bitácora append-only sin `UPDATE/DELETE` | `ADR/core/0016-pista-auditoria-inmutable-negocio.es.md`; en TMS concretado por CLAUDE.md (`EntidadAuditableOrm`, `EntidadAppendOnlyOrm`) | Toda `*.orm-entity.ts` extiende una de las dos clases base |
| TMS-local | PK UUID v7 del dominio, `NONCLUSTERED`; nombres de constraints explícitos; `DATETIMEOFFSET(3)`; `CHECK` desde enum enumerando miembros; migración publicada no se edita | CLAUDE.md TMS; ADR-TMS-011/013/014 | Lint propio del TMS (ver `docs/02-diseno/restricciones-check-listas-cerradas.md`); `rg -n "Object\.values\(" src/**/migraciones` → 0 |

### 1.5 DTOs, validación y API

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-35 | Validación de entrada con **class-validator** en DTOs + `ValidationPipe`; Zod **solo** para contratos de API externos | stack Node fila «Validación» (`ARCH/stack-tecnologico-autorizado-nodejs.es.md`) | `rg -n "from 'zod'" API/src` → solo en adaptadores de APIs externas |
| ARCH-36 | Documentación OpenAPI v3 vía decoradores Swagger de NestJS | stack Node fila «Documentación API» | `rg -L "@ApiTags|@ApiOperation" api/*.controller.ts` |
| ARCH-37 | REST-only para la API de satélite-producto; GraphQL/gRPC solo con ADR local y trigger T-API-01..04 | `ADR/core/0122-api-rest-only-satelites-producto.es.md` §2 | `rg -n "graphql|@grpc" package.json` → 0 |
| ARCH-38 | Autorización en el servidor, por objeto (IDOR/BOLA) y por función (BFLA), en cada endpoint; la UI solo oculta | `ADR/core/0165-seguridad-frontend-owasp-2025.es.md` §2.1; `ADR/nodejs/0012-autorizacion-avanzada-rbac-abac.es.md` | Todo controlador/handler con guard de permiso (TMS tiene prueba que lo impone, G-014) |
| ARCH-39 | Consultas parametrizadas siempre; validación de cliente es usabilidad, el servidor re-valida | ADR-0165 §2.5 | `rg -n "query\(\`[^\`]*\\$\{" API/src` → 0 (interpolación en SQL) |
| TMS-local | Envoltura HTTP estándar (`TransformInterceptor` + `HttpExceptionFilter`), mensajes en español; `ultimo_cambio` nunca en DTO de entrada (viaja por `If-Match`) | CLAUDE.md TMS | `rg -n "ultimoCambio" **/dto/*entrada*` → 0 |

### 1.6 Clean Code, nombres y umbrales (ADR-0056)

Fuente única: `ADR/core/0056-convenciones-nombre-diseno-empresarial.es.md` (supersede a 0049). D1: Clean Code es **suelo, no techo**; solo D2 es vinculante.

| ID | Regla | Cómo verificar (Node / Android) |
|---|---|---|
| ARCH-40 (R1) | Nombres que comunican intención; sin identificadores de 1 letra salvo índice de bucle o lambda de una línea | `id-length` (parcial) / detekt `VariableMinLength`; fondo = revisión humana |
| ARCH-41 (R2) | Sin notación húngara ni prefijo/sufijo de tipo; sin abreviaturas fuera del glosario; casing del lenguaje | `@typescript-eslint/naming-convention` / detekt `ClassNaming`, `FunctionNaming` |
| ARCH-42 (R3) | Sin números mágicos: literal con significado de negocio → constante nombrada (admitidos `-1,0,1` y pruebas) | `@typescript-eslint/no-magic-numbers` / detekt `MagicNumber` (única regla 100 % máquina) |
| ARCH-43 (R4) | Una función hace una cosa. Umbrales que **bloquean** (D4): líneas/función **> 50**, parámetros **> 3**, complejidad **> 10**, anidamiento **> 3** | ESLint `max-lines-per-function`, `max-params`, `complexity`, `max-depth` / detekt `LongMethod`, `LongParameterList`, `CyclomaticComplexMethod`, `NestedBlockDepth` (escribir las 4 claves: los defectos de detekt son más laxos, ADR-0241 §2.4) |
| ARCH-44 (R5) | Comentarios solo para el porqué; código comentado se borra; un porqué no evidente enlaza su ADR/gap | detekt `ForbiddenComment` (solo TODO/FIXME); resto humano. En TMS se endurece: comentarios mínimos, sin separadores decorativos (CLAUDE.md) |
| ARCH-45 (R6) | Errores como valor; excepción nunca como control de flujo | Tipado + ADR-0038 + `strictNullChecks` |
| ARCH-46 | Superar un umbral D4 **no** es violación automática si la revisión lo justifica por escrito; cumplirlos **no** acredita R4 | ADR-0056 D4-D5 |
| ARCH-47 | Todo repo declara su analizador por runtime en `DECISIONS.md` entre `<!--analisis-estatico:inicio/fin-->` (6 columnas; `avisa`/`sin-analizador`/`propios` exigen G-NNN abierto) | `ADR/core/0210-el-analizador-estatico-se-declara-por-runtime.es.md`; `C:\Christian\unimar_arch\.harness\data\analisis-estatico.json`; `node $UNIMAR_CORE/scripts/validate-analisis-estatico.mjs` |
| ARCH-48 | Umbral `propios` = trinquete con valor vigente ≤ techo, que caduca y solo se renueva si bajó | `ADR/core/0225-el-trinquete-declara-su-valor-y-su-descenso.es.md` §2.3-2.5 | Tabla contigua en `DECISIONS.md` |

### 1.7 TypeScript estricto

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-49 | `tsconfig`: `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` | `ADR/nodejs/0003-estandares-estrictos-typescript.es.md` | Leer `tsconfig.json` de API y WEB |
| ARCH-50 | ESLint obligatorio: `no-explicit-any` error, `explicit-function-return-type` error, `no-floating-promises` error | ADR-0003 | Leer `API/.eslintrc.cjs`, `WEB/eslint.config.js` (TMS los tiene) |
| ARCH-51 | Frontend además: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`, `noFallthroughCasesInSwitch` | ADR-0109 §2.9, P-FE-05 | `WEB/tsconfig.json` |
| ARCH-52 | `any` prohibido (usar `unknown` + estrechar); todo `as`, `@ts-ignore`, `@ts-expect-error` lleva comentario con lo que el autor sabe y el compilador no | ADR-0109 P-FE-05 | `rg -n "as [A-Z]\w+" -B1` sin comentario; `rg -n "@ts-(ignore|expect-error)"` |
| ARCH-53 | `tsc --noEmit` obligatorio como comprobación de tipos; el transformador de pruebas debe preservar `emitDecoratorMetadata` | `ADR/nodejs/0217-el-transformador-de-typescript-se-obliga-por-resultado.es.md` D1, D3 (Borrador: orientativo) | Script `typecheck` cableado en pre-push |

### 1.8 Pruebas

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-54 | Pirámide: unitarias (Jest, sin E/S), integración (Testcontainers contra motor real), e2e (supertest vía `TestingModule`) | `ADR/core/0018-piramide-pruebas-gates-calidad.es.md`; `ADR/core/0053-estrategia-pruebas-integracion-e2e.es.md` | Existencia de las tres capas; TMS declara E2E ausente (G-009) |
| ARCH-55 | Cobertura mínima corporativa **70 %** como puerta binaria | ADR-0018 §4 | `jest --coverage` con `coverageThreshold`; TMS: 80 % domain/application por módulo + 70 % global |
| ARCH-56 | Dominio: pruebas **basadas en estado**, **prohibidos mocks y stubs** | `ADR/core/0052-estrategia-aislamiento-pruebas-unitarias.es.md` §3.2 | `rg -n "jest\.(fn|mock|spyOn)" modules/*/domain --glob '*.spec.ts'` → 0 |
| ARCH-57 | Aplicación: pruebas solitarias; stubs para entrada, mocks solo para efectos no observables; **mockear interfaces, nunca clases concretas**; una verificación de interacción por prueba | ADR-0052 §3.2, §4 | `rg -n "jest\.mock\(" modules/*/application` (mock de módulo = sospecha); revisión de `toHaveBeenCalled` múltiples |
| ARCH-58 | Infraestructura: integración con Testcontainers (motor real, no SQLite/in-memory); reset de BD entre pruebas | ADR-0053 §3.1, §3.3 | `jest.integracion.config.js`; `rg -n "testcontainers|sqlite" test/` |
| ARCH-59 | E2E con JWT real o simulado para ejercer RBAC/ABAC | ADR-0053 §3.2 | Revisión |
| ARCH-60 | Frontend: Vitest + RTL; consultar por rol/texto accesible (no `data-testid`/clase); red simulada con **MSW** (no parchear `fetch`); Playwright para E2E | ADR-0109 §2.2, §2.12 | `rg -n "getByTestId|querySelector\(" WEB/src --glob '*.test.tsx'` → 0; `rg -n "global\.fetch\s*=|vi\.spyOn\(.*fetch"` → 0 |
| SHELL-01 | Corrección de defecto ⇒ existe una prueba que fallaba antes y pasa ahora | `SHL/docs/desarrollo/pruebas.es.md` «Criterios» | Revisión del diff |
| SHELL-02 | Pruebas que pasan sin probar nada (catch que nunca corre, solo verificar `ArgumentNull`) son hallazgo | `SHL/docs/desarrollo/pruebas.es.md` «Pruebas que pasan sin probar nada» | Revisión: `expect` dentro de `catch` sin `expect.assertions` |

### 1.9 Frontend (React)

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-61 | Estado de servidor en **React Query**; no copiarlo a `useState` | `ADR/nodejs/0004-resiliencia-frontend-offline.es.md`; ADR-0109 §2.7 | `rg -n "useState\(.*data" WEB/src` (revisión) |
| ARCH-62 | Sin contenedor de estado global de terceros (Redux/Zustand/Jotai) sin ADR | ADR-0109 §2.7 | `rg -n "(redux|zustand|jotai)" WEB/package.json` → 0 |
| ARCH-63 | `useEffect` solo sincroniza con sistemas externos; no deriva ni carga datos al montar | ADR-0109 P-FE-08 | `rg -n "useEffect" -A5 WEB/src | rg "fetch|setState"` (revisión) |
| ARCH-64 | Toda suscripción (`EventSource`, WS, RxJS, listener, timer) se limpia en el desmontaje; un leak es bloqueante | ADR-0109 P-FE-04 | `useEffect` con `addEventListener`/`setInterval` sin `return () =>` |
| ARCH-65 | Estados con uniones discriminadas (`loading|success|error`), sin estados imposibles | ADR-0109 P-FE-01 | Revisión de tipos de estado |
| ARCH-66 | Toda frontera valida en runtime con esquema (HTTP, storage, URL, postMessage, SSE/WS, env) | ADR-0109 P-FE-06 | `rg -n "as \w+Dto|\.json\(\) as" WEB/src` → 0 fuera de `infraestructura/` con zod |
| ARCH-67 | Claves de lista estables de dominio (nunca índice en listas que se reordenan); error boundary por región | ADR-0109 §2.7 | `rg -n "key=\{(i|index|idx)\}" WEB/src` → 0 |
| ARCH-68 | Estilos consumen **tokens semánticos**, nunca valores crudos (color/espaciado/tipografía) | ADR-0109 P-FE-03; `ADR/core/0110-sistema-diseno-material-3-tokens.es.md` P-UX-01; DESIGN.md del repo | `rg -n "#[0-9a-fA-F]{3,6}|\[[0-9]+px\]" WEB/src --glob '*.tsx'` |
| ARCH-69 | Accesibilidad WCAG 2.2 AA: contraste 4.5:1, foco visible, objetivos 48×48, operable por teclado; `eslint-plugin-jsx-a11y` + pasada de axe | ADR-0110 §2.3; ADR-0109 §2.12 | Plugin en `WEB/eslint.config.js`; axe en pruebas |
| ARCH-70 | Con React Compiler activo no se escribe `useMemo/useCallback/memo` a mano; `eslint-plugin-react-hooks` activo y en verde | ADR-0109 P-FE-07 | Condicional: TMS usa React 18 (ADR-TMS-010) → solo aplica `react-hooks` |
| ARCH-71 | Plataforma antes que dependencia (`Intl`, `AbortController`, `structuredClone`, `<dialog>`); una dependencia nueva declara por qué y cuánto pesa | ADR-0109 P-FE-10 | Diff de `package.json` |
| ARCH-72 | Presupuestos CWV p75 campo: LCP < 2,5 s, INP < 200 ms, CLS < 0,1; presupuesto de bundle declarado | ADR-0109 P-FE-09 | No verificable estáticamente; `width/height` en `<img>`, `loading="lazy"` |
| TMS-local | Sin `title` (tooltip) salvo pedido; `aria-label` sí | CLAUDE.md TMS | `rg -n " title=" WEB/src` → 0 |

### 1.10 Seguridad

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-73 | Gates locales: secretos (gitleaks), SAST (eslint-plugin-security / analizadores), auditoría de dependencias, lint, pruebas + umbral de cobertura, formato de commits | `ADR/core/0106-seguridad-calidad-local-first.es.md` §2.1; `node $UNIMAR_CORE/scripts/validate-gates-locales.mjs` | Leer `TMS/.husky/pre-push` |
| ARCH-74 | Ningún control de seguridad depende de servicio del proveedor (CodeQL/GitHub Secret Scanning retirados) | ADR-0106 P-LOCAL-02 (supersede ADR-0005) | Que el pre-push sea autosuficiente |
| ARCH-75 | Cero secretos en el bundle; todo `VITE_*` es público | ADR-0165 §2.3 | `rg -n "VITE_\w*(KEY|SECRET|TOKEN|PASSWORD)" WEB` → 0 |
| ARCH-76 | Token de sesión en memoria/closure, no en `localStorage` sin cifrar | ADR-0109 §2.5; ADR-0165 §2.7 | `rg -n "localStorage\.(set|get)Item\(.*(token|jwt)" -i WEB/src` → 0 |
| ARCH-77 | `dangerouslySetInnerHTML` solo con DOMPurify; bloquear `javascript:`/`data:` en `href/src` externos; comprobar `origin` en `message` | ADR-0165 §2.5 | `rg -n "dangerouslySetInnerHTML" WEB/src` |
| ARCH-78 | CSP estricta (nonce/hash, sin `unsafe-inline/eval`), HSTS, `nosniff`, Referrer/Permissions-Policy; CORS con origen explícito; sin source maps en prod | ADR-0165 §2.2 | `WEB/nginx.conf`, config CORS en `main.ts` |
| ARCH-79 | SSRF: allow-list para URLs de usuario que el backend solicita | ADR-0165 §2.1 | Revisión de clientes HTTP con URL dinámica |
| ARCH-80 | Sin criptografía propia; contraseñas Argon2id/bcrypt en servidor; autenticación delegada a UMS | ADR-0165 §2.3, §2.7 | `rg -n "createCipher|md5|sha1" API/src` |
| SHELL-03 | Reglas de `eslint-plugin-security` promovidas **a error** una a una (el preset `recommended` las deja en `warn`) | `SHL/eslint.config.mjs` (comentario G-017) | Verificar que la config no se limita a `extends: security.configs.recommended` |

### 1.11 Logging y observabilidad

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-81 | Logger **pino** JSON; Winston/Bunyan rechazados | stack Node filas «Logs Estructurados»; ADR-0007 | `rg -n "(winston|bunyan|console\.log)" API/src --glob '!*.spec.ts'` → 0 |
| ARCH-82 | Cada entrada lleva `traceId`, `spanId`, `tenantId`, `userId`; propagación W3C `traceparent` | `ADR/nodejs/0007-observabilidad-telemetria-loki-opentelemetry.es.md` regla 4-5; CP-06 | Revisión del serializador de pino |
| ARCH-83 | Dato personal nunca en el log: piso de 6 clases (`credencial`, `token_de_sesion`, `cabecera_de_autenticacion`, `documento_de_identidad`, `contacto_de_persona`, `medio_de_pago`) cubierto en `redact`, declarado entre `<!--redaccion-log:inicio/fin-->`. Nº de contenedor/manifiesto/DAM NO se redacta | `ADR/core/0193-el-dato-personal-no-llega-al-log.es.md`; `C:\Christian\unimar_arch\.harness\data\clases-dato-prohibidas-en-log.json`; `CP/nodejs/cp-06-logging-pino-seguro-pii.es.md` | `node $UNIMAR_CORE/scripts/validate-redaccion-log.mjs`; `rg -n "redact" API/src` |
| ARCH-84 | Contexto de petición por CLS: dominio sin contexto; aplicación `IRequestContext` solo lectura; infraestructura `IContextAccessor` | `CP/nodejs/cp-05-propagacion-contexto-cls.es.md` «Reglas por capa» | `rg -n "ClsService" modules/*/{domain,application}` → 0 |
| ARCH-85 | Telemetría solo hacia un Collector OTel (neutral al proveedor); spans manuales en casos de uso desde fuera (infra) | ADR-0007 reglas 2-3 | `rg -n "@opentelemetry" modules/*/{domain,application}` → 0 |

### 1.12 Dependencias y cadena de suministro

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-86 | Versiones **exactas** en `dependencies` y `devDependencies` (sin `^`/`~`); `peerDependencies` con rango | `ADR/core/0009-gestion-vulnerabilidades-dependencias-estrictas.es.md` §1; `SHL/tools/verificar-fijacion-npm.mjs`; `SHL/.npmrc` (`save-exact=true`, `engine-strict=true`) | `rg -n '"[\^~][0-9]' API/package.json WEB/package.json` → 0 |
| ARCH-87 | `npm audit --audit-level=high` bloquea; excepciones con gap y **fecha de caducidad** | ADR-0009 §3; ADR-0106 §2.1; `SHL/tools/verificar-dependencias.mjs` + `SHL/security/vulnerabilidades-aceptadas.json` | Pre-push |
| ARCH-88 | `npm ci` en CI/release; lockfile versionado; SBOM en build; desconfiar de `postinstall`/typosquatting; acciones de CI fijadas por SHA | ADR-0165 §2.4 | `rg -n "uses: .*@v[0-9]" .github/workflows` → debería ser SHA |
| ARCH-89 | Tecnología fuera del stack autorizado ⇒ ADR (S-07). Rechazadas explícitas: ESLint v8, Winston, Mocha/Ava, Sequelize, excepciones como control de flujo, Turborepo/Lerna | `ARCH/stack-tecnologico-autorizado-nodejs.es.md` | Cruce `package.json` vs tabla |

### 1.13 Android (UNITRANS)

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| ARCH-90 | 100 % Kotlin, Compose, MVVM + Clean; lógica en UseCases puros sin `android.*` | `ADR/android/0042-arquitectura-movil-canonica-android.es.md` §3.B | `rg -n "import android\." app/**/dominio` → 0 |
| ARCH-91 | Offline-first: la UI observa `Flow` de Room (fuente única); la red rellena Room vía WorkManager; nunca API → UI sin BD | ADR-0042 §3.C; `CP/android/cp-09-repositorio-offline-first-room.es.md` | Revisión de ViewModels que llaman Retrofit directo |
| ARCH-92 | Errores: `sealed class Result<T>` en dominio | stack Android; `CP/android/cp-11-manejo-errores-result-sealed.es.md` | `rg -n "sealed (class|interface) Result"` |
| ARCH-93 | detekt 1.23.8 **bloquea** con las 4 claves D4 escritas (50/3/10/3) + ktlint 1.6.0 para formato; Kotlin 2.1.21; JDK 21 | `ADR/android/0241-el-runtime-android-nombra-su-analizador-su-version-de-kotlin-y-su-serializador.es.md` §2.2-2.5 | `detekt.yml` existe; tarea Gradle con `ignoreFailures=false`. TMS hoy declara `sin-analizador (G-197)` |
| ARCH-94 | Tokens en almacenamiento seguro; PII en Room con SQLCipher; DataStore (no SharedPreferences); Kotlinx Serialization (no Gson/Moshi); Hilt | stack Android; `CP/android/cp-10-almacenamiento-seguro-tokens.es.md` | `rg -n "SharedPreferences|com.google.gson|Moshi"` → 0 |

### 1.14 Tooling propio de shells (reglas SHELL)

| ID | Regla | Fuente | Cómo verificar |
|---|---|---|---|
| SHELL-04 | Complejidad ciclomática como **error**, con umbral fijado sobre la medición real (trinquete que solo baja); en shells = 19 | `SHL/reference/architecture/adrs/SHL-008-medicion-de-complejidad-ciclomatica.es.md`; `SHL/eslint.config.mjs` | `complexity: ['error', N]` en la config |
| SHELL-05 | Avisos de lint congelados con `--max-warnings=N` (trinquete) | `SHL/package.json` (`eslint . --max-warnings=160`); `SHL/docs/desarrollo/pruebas.es.md` | Script `lint` |
| SHELL-06 | Cobertura como **trinquete por proyecto** (suelo que solo sube; holgura 3 pts avisa para subirlo); falla si un proyecto no produce informe | `SHL/quality/umbrales-cobertura.json`; `SHL/tools/verificar-cobertura.mjs` | TMS equivalente: `API/scripts/piso-de-cobertura.mjs` + `piso-de-cobertura-infraestructura.json` |
| SHELL-07 | Parámetro no usado a propósito se prefija con `_` | `SHL/eslint.config.mjs` (`no-unused-vars` con `argsIgnorePattern: '^_'`) | Config ESLint |
| SHELL-08 | «Sin gates de mentira»: un analizador configurado que no ejecuta (preset en `warn`, regla que no corre) es peor que no tenerlo | SHL-008 §2; ADR-0184 del núcleo | Comprobar que cada regla declarada **falla** con un caso de prueba |
| SHELL-09 | Los ejemplos `typescript` de los README compilan | `SHL/tools/verificar-ejemplos-readme.mjs` | Solo librerías |
| SHELL-10 | Commits sustantivos citan `G-NNN` o `ADR-NNNN` | `SHL/tools/verificar-mensaje-commit.sh` | No aplica en TMS (commits los hace Christian) |

---

## 2. Decisiones pre-resueltas (no se discuten en auditoría)

Una auditoría puede señalar **incumplimiento** de estas decisiones, no proponer reemplazarlas. Proponer la alternativa exige ADR (S-07).

| # | Decisión | ADR fuente | Porqué técnico | Alternativas descartadas y por qué |
|---|---|---|---|---|
| D-01 | Arquitectura hexagonal (puertos y adaptadores) en NestJS | ADR-0002 | Dominio probable en ms sin framework; extraíble a otro host; fronteras imponibles por lint | «Servicio `@Injectable` con lógica» de los tutoriales NestJS: acopla dominio a framework, obliga a bootstrap de módulo para probar negocio. Coste aceptado: mapeo Entidad↔ORM y curva de aprendizaje |
| D-02 | Errores como valor: patrón Result con **neverthrow** | ADR-0038; ADR-0019 §1; stack Node; CP-08; ADR-0056 R6 | El compilador obliga a tratar la rama de fallo; separa negocio (Result, 4xx) de infraestructura (reintento/500) | `try/catch`/excepciones como control de flujo: invisibles al tipo, manejo disperso, no distingue transitorio de negocio (fila «rechazadas» del stack). Coste aceptado: ruido sintáctico |
| D-03 | TypeORM con **Data Mapper**; Active Record prohibido | ADR-0043 §1 | Permite Entidad de dominio separada de `@Entity`; mejor integración NestJS | Prisma: esquema monolítico dificulta separación hexagonal, motor Rust, multi-esquema débil. MikroORM: ecosistema menor/curva (alternativa válida, no elegida). Knex: sin relaciones, mapeo manual (solo escape analítico). Sequelize: rechazado. Drizzle: **autorizado** como par de TypeORM (stack), no descartado |
| D-04 | SQL nativo solo tras el puerto del repositorio (escape de rendimiento) | ADR-0043 §3; TMS lo acota a 3 casos en ADR-TMS-023 | El ORM genera consultas pobres en JOINs complejos | Usar SQL crudo libremente: TMS lo declara deuda fuera de «sentencia decide / compare-and-set / lectura compuesta» |
| D-05 | Primitivas DDD de librería (`@nestjslatam/ddd` → hoy `@unimar-peru/shells-nest-ddd`) tras barrel local | ADR-0029; `SHL/src/libs/ddd/nest/core/README.md` | Evita miles de líneas de boilerplate (igualdad de VO, recolección de eventos) | Escribir las primitivas a mano en cada repo: duplicación. Importar directo: lock-in (de ahí el barrel) |
| D-06 | `IUnitOfWork` para la atomicidad + **una transacción = un agregado** | ADR-0019 §4; ADR-0098 D2 | Consistencia del agregado sin bloquear el modelo ni congelar la extracción a microservicios | Transacción multi-agregado (opción B): deadlocks, frontera congelada. Bróker para todo (D): «monolito distribuido» hacia dentro. Outbox obligatorio (E): no implementable en todos los motores |
| D-07 | Eventos entre agregados: despacho en proceso **post-commit**; Outbox opcional según motor | ADR-0098 D4, D6; ADR-0033 (catálogo, sin mandato) | Entre agregados del mismo proceso no hay red ni contrato que versionar | Ver D-06. Outbox universal rechazado por incumplible en MongoDB |
| D-08 | Bus de eventos tras `IEventBusPort`, implementación elegida por configuración (`EVENT_BUS_IMPL`: in-memory/RabbitMQ/Kafka) | ADR-0015; ADR-0203 | Cambiar transporte sin tocar dominio | No lo dice explícitamente; Kafka exige justificación (ADR-0112 §2.3) |
| D-09 | Validación de DTO con **class-validator**; Zod solo en contratos externos (en frontend Zod en toda frontera) | stack Node fila «Validación»; ADR-0109 §2.9 | Integración nativa con `ValidationPipe` | Zod en backend general: rechazado salvo contratos de API externos. El ADR no argumenta más |
| D-10 | REST-only; CQRS vive en la capa de aplicación, no en el protocolo | ADR-0122 | Un solo nivel de API basta para SPA propia | GraphQL (split de protocolo de ADR-UMS-059): solo con trigger T-API-01..04 documentado |
| D-11 | TypeScript estricto + ESLint con `no-explicit-any`, `explicit-function-return-type`, `no-floating-promises` | ADR-0003; ADR-0109 §2.9 | Elimina errores null/undefined en compilación | TS «modo indistinto» y JS puro: rechazados (stack). Coste aceptado: verbosidad |
| D-12 | ESLint v10 + Prettier v3 (flat config) | stack Node fila «Linting y Formateo» | v8 sin mantenimiento desde 2024-09 | ESLint v8, Rome, Biome rechazados. **ADR requerido: No** (se puede cambiar de versión sin ADR) |
| D-13 | Umbrales Clean Code D4 = 50 / 3 / 10 / 3 como puerta (no el ideal del libro) | ADR-0056 D4 | Suelo binario; entre ideal y umbral opina la revisión | Umbral en el ideal (20 líneas): convierte cada fusión en negociación. Configuración canónica repartida por el núcleo: descartada por ADR-0210 §4 (cada repo calibra y lo declara) |
| D-14 | Pruebas: Jest (backend), Testcontainers (integración con motor real), supertest (e2e), Vitest + RTL + Playwright + MSW (frontend) | ADR-0018, 0052, 0053, 0109 §2.2 | Paridad con producción; pruebas a prueba de refactor | Mocha/Ava rechazados; BD en memoria / SQLite para probar adaptadores: dialectos, concurrencia y falsa confianza (ADR-0053 §2). Mocks en dominio: prohibidos (ADR-0052) |
| D-15 | Stubs > mocks; mockear interfaces, nunca clases | ADR-0052 §4 | Pruebas que no se rompen al refactorizar | «Mocking-itis» e interacción frágil descritos como antipatrones |
| D-16 | Seguridad y calidad **local-first** (pre-push), CI solo repite | ADR-0106 (supersede 0005); ADR-0170; ADR-TMS-018 | La postura no se apaga con la cuota del CI | CodeQL-servicio, Secret Scanning y Dependabot de GitHub como puerta: retirados; reintroducirlos exige ADR que extienda 0106. `pre-commit`/`commit-msg`: retirados por ADR-0170 (un commit es privado; el push es la afirmación) |
| D-17 | Fijación exacta de versiones + `npm audit` high | ADR-0009 | Builds reproducibles byte a byte | Rangos semver `^`/`~`: no deterministas |
| D-18 | Estado de servidor en React Query; Context segmentado para lo global mínimo | ADR-0004; ADR-0109 §2.7 | Stale-while-revalidate, optimistic updates, retry | Redux/Zustand/Jotai: no autorizados sin ADR. `useEffect` + `useState` para cargar: prohibido (P-FE-08) |
| D-19 | Tokens semánticos (Material 3, Style Dictionary) — en TMS, DESIGN.md | ADR-0110 | Un solo origen de estilo; CSP estricta posible | Valores crudos en componentes: prohibidos (P-UX-01, P-FE-03) |
| D-20 | pino + OpenTelemetry (Collector neutral) | ADR-0007; stack Node | JSON nativo, 5-10× más rápido que Winston; sin lock-in | Winston (solo si se justifica), Bunyan, Application Insights SDK |
| D-21 | Resiliencia: p-retry / opossum / p-timeout / p-limit en adaptadores | ADR-0011; stack Node | Evita cascadas de fallos | BullMQ sin capa de abstracción rechazado |
| D-22 | Borrado lógico de agregados; clave natural de «cosa real» no se reutiliza | ADR-0164; en TMS matizado por ADR-TMS-012 (`eliminado` solo donde una persona quita filas) | Una consulta histórica debe tener respuesta única | Borrado físico «por si acaso»: se retira del contrato del repo |
| D-23 | Android: Kotlin + Compose + MVVM/Clean + Hilt + Room offline-first + Retrofit + detekt | ADR-0042; ADR-0241; stack Android | Operar desconectado en campo | Flutter/React Native (coste aceptado por misión crítica); RxJava, XML Views, Koin, Gson/Moshi, Android Lint como única puerta: rechazados |
| D-24 | Motor SQL Server (TMS) con capa de datos desacoplada | ADR-TMS-007; ADR-0227 (núcleo ratifica el desacople) | El motor puede cambiar por decisión ajena a la arquitectura | PostgreSQL es la referencia del núcleo; el TMS la sobrescribe con ADR de producto (ADR-0051 lo admite) |
| D-25 | Monorepo con Nx (núcleo) | ADR-0001; ADR-0066 | Grafo, caché, tags de alcance | Turborepo, Lerna rechazados. TMS no usa Nx (dos apps con su `package.json`) — no se exige |

Decisiones del **TMS** que tampoco se discuten (ver CLAUDE.md del repo): GUID v7 del dominio con PK `NONCLUSTERED`; auditoría con `ROWVERSION`; `If-Match` solo donde hay dos editores; `DATETIMEOFFSET(3)` con offset `-05:00`; nombres explícitos de constraints; todo el código en español; comentarios mínimos; sin tooltips; retiro del bloqueo pesimista (ADR-TMS-025).

---

## 3. Tooling de calidad que ofrecen los shells (y el núcleo)

`unimar-shells` es un **monorepo de librerías** (.NET + TS + NestJS), no un armazón de app. Su tooling es el ejemplo de referencia citado por el núcleo (ADR-0210 §4, ADR-0225).

| Pieza | Ruta | Qué hace / umbral |
|---|---|---|
| ESLint flat (v10) | `SHL/eslint.config.mjs` | `js.recommended` + `typescript-eslint/recommended`; **todas** las reglas de `eslint-plugin-security` promovidas a `error` (salvo `detect-object-injection` en `warn`); `no-explicit-any` en `warn` (83 heredados, G-033); `no-unused-vars` con `^_`; **`complexity: ['error', 19]`** (trinquete SHL-008); pruebas: `no-non-null-assertion` off |
| Script lint | `SHL/package.json` | `eslint . --max-warnings=160` (trinquete de avisos) |
| tsconfig base | `SHL/tsconfig.base.json` | `strict`, `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `emitDecoratorMetadata`, `module/moduleResolution node16`, `types: ["node"]` |
| npm | `SHL/.npmrc` | `save-exact=true`, `engine-strict=true` |
| Fijación npm | `SHL/tools/verificar-fijacion-npm.mjs` | deps/devDeps exactas; peers **con** rango; workspace exacto |
| Dependencias vulnerables | `SHL/tools/verificar-dependencias.mjs` + `SHL/security/vulnerabilidades-aceptadas.json` | `npm audit` + `dotnet list --vulnerable`; excepción no declarada o caducada ⇒ falla |
| Cobertura (trinquete) | `SHL/tools/verificar-cobertura.mjs` + `SHL/quality/umbrales-cobertura.json` | Suelo por proyecto (p. ej. `shells-nest-ddd` 98/94 líneas/ramas), holgura 3 pts; falla si falta informe. Lee `coverage/coverage-summary.json` (Jest) y cobertura XML (.NET) |
| Mensaje de commit | `SHL/tools/verificar-mensaje-commit.sh` | Commit sustantivo cita G-NNN/ADR-NNNN |
| Ejemplos de README | `SHL/tools/verificar-ejemplos-readme.mjs`, `...-dotnet.mjs` | Compila bloques de código de los README |
| Orden de publicación | `SHL/tools/verificar-orden-de-publicacion.mjs` | Ningún paquete queda fuera de `publicacion.yml` |
| Puerta local | `SHL/.husky/pre-push` | Validadores del estándar (plugin `unimar-core`) + §9: mensajes, fijación npm, `npm run lint`, `nx affected build/test`, ejemplos, orden de publicación |
| lint-staged | `SHL/.lintstagedrc.json` | Solo markdownlint (lint-staged ya no se usa en pre-push) |
| CI | `SHL/.github/workflows/{gobernanza,seguridad,lockfiles,publicacion}.yml`, `dependabot.yml` | Repite la puerta; `seguridad.yml` restaura con `--locked-mode`/`npm ci` y corre `verificar-dependencias.mjs` |
| .NET | `SHL/Directory.Build.props`, `Directory.Packages.props`, `.editorconfig` | Analizadores Roslyn, categoría Security = error, `TreatWarningsAsErrors`, `Nullable enable` |
| Validadores del núcleo | `C:\Christian\unimar_arch\.harness\scripts\validate-*.mjs` (vía plugin `unimar-core`) | Relevantes a calidad de código: `validate-analisis-estatico.mjs` (S-37/S-44), `validate-gates-locales.mjs` (S-23, aviso: puerta activa, gitleaks, audit, coverage, commitlint), `validate-redaccion-log.mjs` (S-34), `validate-secretos.mjs`, `validate-credencial-en-artefacto.mjs` (S-43) |

**Lo que NO existe en el estándar:** `jscpd` (duplicación), `knip`, `madge`, SonarQube (descartado en SHL-002 por dependencia de infraestructura). `dependency-cruiser` solo aparece en prosa (ADR-0001) y el corpus nombra `eslint-plugin-boundaries` sin configuración real (G-434); la imposición real medida es `@nx/enforce-module-boundaries` (unimar-scm) y **dependency-cruiser en TMS** (`API/.dependency-cruiser.cjs`: `shared-no-importa-de-modules`, `migraciones-solo-listas-cerradas`, `solo-superficie-publica-ajena`, `naves-y-flota-son-hoja`, `planificacion-no-importa-de-…`, `sin-ciclos`). Si la skill quiere medir duplicación, es tooling **propio**, no del estándar: presentarlo como recomendación, no como incumplimiento.

Filosofía transversal del tooling (útil para el tono de la skill): medir antes de fijar (SD-05); una puerta nace verde o se aprende a saltar (SD-06); los umbrales son **trinquetes** que solo aprietan; un gate que no ejecuta es peor que no tenerlo.

---

## 4. Patrones de diseño nombrados o impuestos

| Patrón | Estado | Fuente |
|---|---|---|
| Hexagonal / Puertos y Adaptadores | Impuesto | ADR-0002; stack Node (tags Nx) |
| Repository (puerto en dominio, impl. en infra) | Impuesto | ADR-0043 §1; ADR-0002; `SHL/src/libs/ddd/nest/core/src/core/repositories/` (`repository-read`/`repository-write` interfaces: separación lectura/escritura) |
| Data Mapper (Entidad ↔ modelo ORM) | Impuesto; Active Record prohibido | ADR-0043 |
| Adapter (infra implementa puertos: `TypeOrmUserRepository`, `BcryptPasswordHasher`) | Impuesto | ADR-0002 |
| Result / Railway Oriented Programming | Impuesto | ADR-0038; ADR-0019 §1; CP-08 (Node); CP-11 (Android) |
| Unit of Work (`IUnitOfWork`) | Impuesto (alcance: un agregado) | ADR-0019 §4; ADR-0098 D2 |
| Aggregate Root / Entity / Value Object / Domain Event | Impuesto | ADR-0029; `SHL/src/libs/ddd/nest/core` (`DddAggregateRoot`, `DddValueObject`, `DomainEvent`) |
| Null Object / Optional (evitar `null`) | Impuesto | ADR-0019 §2 |
| Decorator / AOP en el borde (interceptores, middleware) | Impuesto fuera de dominio/app | ADR-0002 §4; ADR-0019 §3; `@nestjslatam/aop*` y `SHL/src/libs/aop` (.NET), CP-04 (.NET) |
| Strategy por configuración (implementación del bus por `EVENT_BUS_IMPL`, motor por `DB_ENGINE`) | Impuesto donde aplica | ADR-0015/0203; ADR-0227 §2.2 |
| Event-Driven intra-dominio (publish/subscribe tras `IEventBusPort`) | Impuesto entre contextos | ADR-0015; ADR-0203 |
| Despacho post-commit en proceso | Impuesto entre agregados | ADR-0098 D4 |
| Transactional Outbox | Catálogo, **opcional** según motor | ADR-0033; ADR-0098 D6 |
| CQRS | Solo en capa de aplicación; matriz de aplicabilidad **pendiente** (ADR sin decisión) | ADR-0122 §2.2; ADR-0034 |
| Saga | Nombrado para distribuido | ADR-0035 (no leído en detalle) |
| Circuit Breaker / Retry con backoff / Timeout / Bulkhead | Impuesto en adaptadores externos | ADR-0011; stack Node (opossum, p-retry, p-timeout, p-limit) |
| Stale-While-Revalidate / Optimistic Update / Background Sync | Impuesto en frontend | ADR-0004 |
| Discriminated union para estados | Impuesto | ADR-0109 P-FE-01 |
| Error Boundary por región | Impuesto | ADR-0109 §2.7 |
| Business Rules / Broken Rules manager, State Transition manager, Tracking State | Ofrecidos por la librería | `SHL/src/libs/ddd/nest/core/src/*.manager.ts` |
| Factory (.NET) | Ofrecido por la librería | `SHL/src/libs/factory/dotnet` |
| Context propagation (CLS / AsyncLocalStorage) | Impuesto | CP-05; ADR-0012 |
| Offline-first con Room como fuente única (Android) | Impuesto | ADR-0042 §3.C; CP-09 |
| Compare-and-set en el `WHERE` (TMS) | Decisión local | ADR-TMS-023 D2; ADR-TMS-025 |

---

## 5. Tensiones y desviaciones que la skill debe conocer (para no acusar mal ni callar)

1. **Rangos `^` en TMS.** `API/package.json` usa `^` (p. ej. `"typeorm": "^0.3.20"`, `"@nestjs/common": "^11.1.18"`) → incumple ADR-0009 §1 salvo que `DECISIONS.md` lo declare. Verificar antes de reportar.
2. **ESLint v8 en la API del TMS** (`"eslint": "^8.57.1"`, `.eslintrc.cjs` legado) mientras el stack rechaza v8 y pide v10 flat. La web sí usa flat config (`eslint.config.js`). El cambio de versión no exige ADR (fila «ADR requerido: No»).
3. **ADRs del núcleo no triajados por el TMS**: 0029, 0038, 0043, 0052, 0056, 0098, 0109, 0164, 0165, 0193 no aparecen en la tabla de herencia de `TMS/DECISIONS.md` (el triaje lista 0002, 0003, 0005, 0007, 0008, 0010-0012, 0014-0016, 0018, 0020, 0030-0032, 0036, 0047, 0050, 0051, 0053, 0093, 0111). El TMS los cumple en la práctica (p. ej. 0 `throw new` en domain/application), pero no los declara.
4. **Fronteras**: el corpus nombra `eslint-plugin-boundaries` (ADR-0002/0003) pero ningún repo lo usa (G-434). Aceptar como cumplimiento cualquier imposición ejecutable (dependency-cruiser en TMS).
5. **ADR-0029 dice «0 dependencias»**, pero `@unimar-peru/shells-nest-ddd` declara `@nestjs/cqrs` como peer (lo usa `DddAggregateRoot`): importarlo en `domain/` choca con ADR-0002 («cero NestJS en dominio»). El TMS no lo usa hoy.
6. **Fila SWC del stack Node** («Compilador → SWC, tsc rechazado») contradicha por ADR-0217 (Borrador): no auditar por usar `tsc`/`nest build`; sí exigir `tsc --noEmit`.
7. **Cobertura**: ADR-0018 fija 70 % global; ADR-0056 CA-6 y D4 no estaban configurados en ningún repo al escribirse (TMS sí los configura: `max-lines-per-function 50`, `max-params 3`, `max-depth 3`, `complexity 10`). Un umbral distinto no es violación si está declarado como `propios` con G-NNN y trinquete (ADR-0210/0225).
8. **ADR-0034 (CQRS)** y **CP-07 (health checks)** son «pendientes»: no son norma aplicable.
9. **ADR-0005** está Supersedido (no auditar CodeQL); **ADR-0049** Supersedido por 0056; **ADR-SHL-002** Retirado.
10. **Frontend TMS en React 18** (ADR-TMS-010) aunque el núcleo fija React 19/Router v8 (ADR-0131): es override local; las reglas de React Compiler/Actions de ADR-0109 §2.7-2.8 son condicionales y no aplican.
