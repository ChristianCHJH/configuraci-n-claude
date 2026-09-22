export const meta = {
  name: 'auditoria-inmobiliaria-vs-normas-unimar',
  description: 'Audita apps/api, apps/web y packages/contratos contra las normas NestJS-Hexagonal y React de la suite Unimar',
  phases: [
    { title: 'Auditar', detail: '7 auditores en paralelo, uno por bloque normativo' },
    { title: 'Verificar', detail: 'un verificador adversarial por bloque, confirma cada hallazgo contra el archivo real' },
  ],
}

const RAIZ = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const NORMA_BK = 'C:/Users/CHRIST~1/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria-sistema/257ac33d-479d-41ed-8864-b28f4be2c833/scratchpad/norma-backend.md'
const NORMA_FE = 'C:/Users/CHRIST~1/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria-sistema/257ac33d-479d-41ed-8864-b28f4be2c833/scratchpad/norma-frontend.md'

const CONTEXTO = `
CONTEXTO DEL TRABAJO
====================
Repositorio a auditar: ${RAIZ}  (monorepo npm workspaces)
  - apps/api            NestJS 10 + TypeORM 0.3 + PostgreSQL 16
  - apps/web            Angular 18 standalone + Tailwind + PrimeNG
  - packages/contratos  tipos compartidos
  - apps/api/src/migraciones  migraciones TypeORM (capa DB)

Las normas de referencia son dos documentos del proyecto hermano unimar_tms.
Aunque fueron escritos para ese proyecto, aquí se usan como VARA DE MEDIR de
buenas prácticas. Léelos completos antes de auditar:
  - Norma backend:  ${NORMA_BK}
  - Norma frontend: ${NORMA_FE}

El repositorio auditado tiene su propio CLAUDE.md y sus ADR en docs/adr/.
Léelos cuando necesites saber si una desviación está declarada o no: una
desviación DECLARADA en un ADR sigue siendo una desviación frente a la norma
Unimar, pero baja de severidad y debes decirlo en la columna correspondiente.

REGLAS DEL INFORME
==================
- Solo REPORTAS. No editas ni corriges NINGÚN archivo. Prohibido usar Write/Edit.
- Cada hallazgo necesita EVIDENCIA REAL: ruta relativa al repo + número de línea
  que abriste y leíste. Nada de "probablemente", nada de memoria.
- Si algo de la norma SÍ se cumple, no lo reportes. Solo violaciones.
- Un hallazgo = una regla incumplida. Si la misma regla se rompe en 40 archivos,
  es UN hallazgo con un archivo de ejemplo y el conteo real en 'alcance'.
- Cuenta el alcance con comandos (grep -rc, find | wc -l). Nada de estimaciones.
- Severidad:
  CRITICO = riesgo de seguridad, pérdida de datos, o rompe la regla estructural
            que sostiene toda la arquitectura (dirección de capas, errores).
  ALTO    = incumplimiento sistemático de una regla vinculante de la norma.
  MEDIO   = incumplimiento acotado, o falta de una práctica obligatoria.
  BAJO    = detalle de estilo o de convención.
- El texto del informe va en ESPAÑOL, con tildes correctas.
`

const ESQUEMA_HALLAZGOS = {
  type: 'object',
  additionalProperties: false,
  required: ['hallazgos'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severidad', 'area', 'regla', 'que_pasa', 'evidencia', 'alcance'],
        properties: {
          severidad: { type: 'string', enum: ['CRITICO', 'ALTO', 'MEDIO', 'BAJO'] },
          area: { type: 'string', description: 'Backend | Frontend | DB | Monorepo' },
          regla: { type: 'string', description: 'Sección y regla exacta de la norma que se incumple, p.ej. "Backend §5 — Errores como valor (ADR-0038)"' },
          que_pasa: { type: 'string', description: 'Una o dos frases en español: qué hace el código y por qué eso incumple la regla' },
          evidencia: { type: 'string', description: 'ruta/relativa.ts:linea (uno o dos ejemplos concretos, separados por coma)' },
          alcance: { type: 'string', description: 'Cuántos archivos u ocurrencias, contado con grep/find. p.ej. "83 ocurrencias en 61 casos de uso"' },
          declarada_en_adr: { type: 'string', description: 'ADR o regla del CLAUDE.md del repo que declara esta desviación, o "no" si no está declarada' },
        },
      },
    },
  },
}

const ESQUEMA_VERIFICACION = {
  type: 'object',
  additionalProperties: false,
  required: ['confirmados'],
  properties: {
    confirmados: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severidad', 'area', 'regla', 'que_pasa', 'evidencia', 'alcance', 'veredicto'],
        properties: {
          severidad: { type: 'string', enum: ['CRITICO', 'ALTO', 'MEDIO', 'BAJO'] },
          area: { type: 'string' },
          regla: { type: 'string' },
          que_pasa: { type: 'string' },
          evidencia: { type: 'string' },
          alcance: { type: 'string' },
          declarada_en_adr: { type: 'string' },
          veredicto: { type: 'string', enum: ['CONFIRMADO', 'REFUTADO', 'AJUSTADO'] },
          nota_verificacion: { type: 'string', description: 'Qué cambiaste o por qué lo refutaste. Vacío si CONFIRMADO tal cual.' },
        },
      },
    },
  },
}

const BLOQUES = [
  {
    clave: 'bk-capas',
    titulo: 'Backend · capas, dominio y persistencia',
    encargo: `
Audita la ARQUITECTURA DE CAPAS y la PERSISTENCIA del backend contra las
secciones §3 (las cuatro capas), §4 (cómo se escribe el dominio),
§6 (persistencia TypeORM Data Mapper) y los antipatrones de §13 de la norma backend.

Revisa en concreto:
- Dirección de dependencias api -> infraestructura -> aplicacion -> dominio.
  ¿Algún archivo bajo dominio/ importa @nestjs/*, typeorm, class-validator o SDKs?
  ¿Algún caso de uso de aplicacion/ importa TypeORM, Request, o algo de infraestructura?
- ¿Existe entidad de dominio pura separada del modelo ORM, con mapeador explícito?
  ¿O la @Entity decorada con @Column es la que viaja por los casos de uso?
  (Norma §4: "clases TypeScript puras, sin decoradores relacionales" y
   §13: "Entidad de dominio decorada con @Entity para ahorrarse el mapeador".)
- ¿El repositorio devuelve el modelo ORM hacia aplicacion? (§13)
- Objetos de valor con todas las propiedades readonly, igualdad estructural.
- Raíz de agregado que recolecta eventos de dominio sin despacharlos; despachador
  en infraestructura, después del commit. ¿Existe algo de eso?
- Una transacción por agregado.
- Enums de listas cerradas en dominio con el CHECK de la migración generado del enum.
- AOP (§3): ¿hay decoradores de logging/auditoría/caché/transacción aplicados
  dentro de dominio o aplicacion en vez de interceptores en api/infraestructura?
  Mira apps/api/src/modulos/bitacora/infraestructura/auditable.decorador.ts y dónde se aplica.
- Persistencia: Active Record prohibido; synchronize apagado; constraints e índices
  con nombre explícito (pk_, fk_, uq_, ck_, df_, ix_) en las migraciones; N+1 en
  relations/joins; auditoría (usuario_creador NOT NULL, actualizador NULL al insertar).
- Regla entre módulos: ¿algún módulo inyecta el repositorio de otro módulo?

Empieza por: apps/api/src/modulos/*/dominio/**, apps/api/src/comun/persistencia/**,
apps/api/src/migraciones/*.ts, apps/api/src/modulos/*/infraestructura/persistencia/**.
`,
  },
  {
    clave: 'bk-errores',
    titulo: 'Backend · errores como valor y traducción HTTP',
    encargo: `
Audita el MANEJO DE ERRORES contra §5 (errores como valor, no negociable),
§11 R6 y los antipatrones de §13 de la norma backend.

Revisa en concreto:
- Firma obligatoria de todo caso de uso: async execute(...): Promise<Result<T, ErrorDominio>>
  usando neverthrow. ¿Se usa? ¿Está siquiera instalado neverthrow?
- ¿Se usa throw como control de flujo (NotFoundException, ConflictException,
  BadRequestException lanzadas desde casos de uso o desde el dominio)?
- ¿ErrorDominio está definido por módulo como unión discriminada, o son
  excepciones genéricas de NestJS con un string dentro?
- Frontera: ¿el dominio conoce códigos HTTP? ¿El controlador es el único traductor?
- ¿El ExceptionFilter global atrapa solo lo no manejado, borra el stack trace y
  devuelve un JSON opaco con localizador de transacción?
  Lee apps/api/src/comun/http/http-exception.filter.ts línea por línea.
- Matriz §5: negocio -> err() -> 400/403/409/422; infraestructura transitoria ->
  reintento con backoff; seguridad -> corte en el Guard.
- §13: try/catch que traga el error y devuelve null.
- §8: log-and-throw (registrar y relanzar el mismo error).
- ¿Se encadena la causa al propagar (new Error(msg, { cause: e }))?

Empieza por: apps/api/src/modulos/*/aplicacion/**/*.caso-uso.ts,
apps/api/src/modulos/*/api/*.controller.ts, apps/api/src/comun/http/**,
apps/api/package.json.
`,
  },
  {
    clave: 'bk-http',
    titulo: 'Backend · contrato HTTP, DTOs y OpenAPI',
    encargo: `
Audita el CONTRATO HTTP contra §7 de la norma backend y el punto 4 y 9 del
checklist §12.

Revisa en concreto:
- Versionado por URL /api/v1/... ¿Cuál es el prefijo real?
  Lee apps/api/src/configuracion/configuracion.ts y apps/api/src/main.ts.
- Paginación: page desde 1 (default 1) y pageSize (default 20, MÁXIMO 100).
  ¿Cómo se llama el parámetro en apps/api/src/comun/http/paginacion.dto.ts?
  ¿Hay tope máximo? ¿Coincide con lo que la norma exige?
- Idempotencia: toda operación mutativa acepta Idempotency-Key (UUID, TTL 24h).
  ¿Existe algún soporte? Búscalo.
- Fechas ISO 8601 CON offset siempre; el backend nunca acepta fecha-hora sin
  offset; fecha_creacion jamás en un DTO de entrada.
- Códigos de error de dominio del catálogo: VALIDATION_ERROR, BUSINESS_RULE_ERROR,
  UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, UNPROCESSABLE_ENTITY,
  RATE_LIMIT_EXCEEDED, INTERNAL_ERROR, SERVICE_UNAVAILABLE. ¿Se emiten?
- OpenAPI obligatorio: @nestjs/swagger instalado, @ApiOperation en cada endpoint,
  @ApiProperty en cada DTO, securitySchemes y tags declarados.
- ValidationPipe global con whitelist y forbidNonWhitelisted. ¿Y en cada DTO,
  hay class-validator de verdad? Busca DTOs sin un solo decorador de validación.
- Envelope: ¿algún endpoint arma su propia respuesta en vez de dejar que el
  TransformInterceptor envuelva?
- Checklist §12.4: ningún DTO de entrada acepta id, fecha_creacion ni campos
  que sella el servidor. Revisa los Crear*Dto y Actualizar*Dto.

Empieza por: apps/api/src/modulos/*/api/**, apps/api/src/comun/http/**,
apps/api/src/main.ts, apps/api/src/configuracion/**, apps/api/package.json.
`,
  },
  {
    clave: 'bk-observabilidad',
    titulo: 'Backend · observabilidad, resiliencia y pruebas',
    encargo: `
Audita OBSERVABILIDAD (§8), RESILIENCIA (§9) y PRUEBAS (§10) de la norma backend.

Observabilidad §8:
- Contexto por request con AsyncLocalStorage. Lee
  apps/api/src/comun/contexto/contexto-solicitud.ts y contexto.middleware.ts.
  ¿Usa AsyncLocalStorage o algo peor (variable de módulo, request-scoped provider)?
- Vocabulario canónico obligatorio: transactionId, transactionName,
  parentTransactionId, stage, traceId, spanId, tenantId, userId, service.name,
  deployment.environment.name, exception.type/.message/.stacktrace.
  PROHIBIDOS Y RETIRADOS: correlationId, cabecera x-correlation-id, funcionalidad,
  service, env. Busca esos nombres prohibidos en todo apps/api/src y en las
  entidades/migraciones (la bitácora podría tener una columna con nombre prohibido).
- Propagación por W3C Baggage con prefijo unimar. y trazas por traceparent.
  ¿El middleware ADOPTA el transactionId entrante o lo regenera siempre?
- pino como logger JSON con redact de PII (*.dni, *.email, *.phone, *.address,
  *.password, authorization, cookie). ¿Qué logger se usa realmente?
- tenantId y userId en CADA entrada del log, null si no hay autenticación.
- Log-and-throw prohibido. Busca catch que loguea y relanza.
- OpenTelemetry hacia colector OTel.

Resiliencia §9:
- p-retry, p-timeout, opossum, p-limit en toda llamada saliente (HTTP, BD, caché,
  cola). Mira el envío de correo SMTP (apps/api/src/modulos/correo/infraestructura/)
  y cualquier llamada externa. ¿Hay timeout? ¿Hay reintento clasificado?

Pruebas §10:
- Dominio: Jest, mocks y stubs PROHIBIDOS, objetos reales.
- Aplicación: puertos aislados con stub/mock, nunca mockear clase concreta.
- Infraestructura: Jest + Testcontainers, BD/caché/cola REALES, misma versión que
  producción, SIN fakes en memoria. Lee apps/api/test/utilidades/repositorio-memoria.ts
  y mira cuántos tests dependen de él.
- E2E: Jest + supertest contra el módulo real. Contrato: Pact JS.
- Cobertura mínima que bloquea la fusión: 70%. ¿Hay umbral configurado en jest?
- Test-first.

Empieza por: apps/api/src/comun/contexto/**, apps/api/src/comun/http/**,
apps/api/test/**, apps/api/package.json, apps/api/src/modulos/correo/**,
apps/api/src/modulos/bitacora/**.
`,
  },
  {
    clave: 'bk-stack-cleancode',
    titulo: 'Backend · stack autorizado y Clean Code',
    encargo: `
Audita el STACK AUTORIZADO (§2) y CLEAN CODE (§11) de la norma backend, más el
checklist §12.8.

Stack §2 — compara fila por fila la tabla de la norma con lo que hay instalado:
Node.js 24.x LTS, TypeScript 5.4+ estricto, NestJS 10+, TypeORM o Drizzle,
class-validator, neverthrow, pino, OpenTelemetry, Jest 29 + Testcontainers + Pact JS,
p-retry/opossum/p-timeout/p-limit, DI nativo de NestJS, @nestjs/swagger,
ESLint v10 + Prettier v3. Lee package.json de la raíz, de apps/api y de
packages/contratos. Reporta lo AUSENTE y lo que está por debajo de la versión
exigida. Recuerda que la norma ya declara la desviación de Node 20 en unimar_tms:
dilo, pero como desviación conocida.

TypeScript estricto (ADR-0003) exige: strict, noImplicitAny, strictNullChecks,
noUnusedLocals, noUnusedParameters. Lee apps/api/tsconfig.json y
packages/contratos/tsconfig.json y di exactamente cuáles faltan.

ESLint en ERROR para: no-explicit-any, explicit-function-return-type,
no-floating-promises, más eslint-plugin-boundaries imponiendo la dirección de capas.
¿Existe algún archivo de configuración de ESLint en el repo? Búscalo
(.eslintrc*, eslint.config.*) y también Prettier. El script "lint" de
apps/api/package.json invoca eslint: ¿contra qué configuración?

Clean Code §11 — mide con comandos, no a ojo:
- R3 números mágicos: literales con significado de negocio sin constante nombrada.
- R4 y umbrales que BLOQUEAN: funciones de más de 50 líneas, más de 3 parámetros,
  complejidad ciclomática mayor a 10, anidamiento mayor a 3. Encuentra los peores
  ofensores reales del repo (backend y también los componentes de apps/web, que
  la norma frontend §10 repite el mismo umbral). Da nombres de archivo, de
  función/componente y el número de líneas medido.
- R1/R2 nombres, sin abreviaturas ni notación húngara.
- R5 comentarios: la norma dice que los comentarios explican el porqué. Este repo
  prohíbe TODO comentario por CLAUDE.md. Reporta la tensión solo si encuentras
  algo real que se perdió por ello.
- Naming del proyecto: archivos y carpetas en español kebab-case; tablas y
  columnas en español snake_case singular. Verifica en las migraciones.
- Checklist §12.10 y front §12.10: "Nunca git commit, git push ni gh pr create".
  Revisa si hay hooks, scripts o skills del repo que commiteen por su cuenta
  (.claude/**, package.json scripts, tools/).

Para medir longitudes usa awk/grep sobre los archivos; por ejemplo, lista los
.ts más largos con: find apps/api/src apps/web/src -name '*.ts' | xargs wc -l | sort -rn | head -30
`,
  },
  {
    clave: 'fe-stack-arquitectura',
    titulo: 'Frontend · stack, arquitectura de carpetas y Clean Code',
    encargo: `
Audita apps/web contra §1, §2 (stack autorizado), §3 (arquitectura de carpetas y
Atomic Design), §10 (Clean Code), §11 (microfrontends) y el checklist §12 de la
norma frontend.

Lo primero y más importante: la norma dice literalmente "React es el framework
corporativo. No se permite Vue, Angular ni Svelte sin un ADR que justifique la
excepción." Este repo es Angular 18. Determina:
  - si existe un ADR en docs/adr/ que justifique la excepción,
  - y qué severidad corresponde. Reporta con precisión, sin dramatizar y sin
    minimizar: cita el ADR si existe.

Después audita fila por fila la tabla §2 contra apps/web/package.json:
React 18+, Vite 5+, TypeScript 5+ estricto, React Router v6+, TanStack Query v5,
Zustand, React Hook Form v7, Zod, Ky/Axios, Tailwind, Vitest, React Testing
Library, MSW, Playwright, axe-core + eslint-plugin-jsx-a11y, ESLint v9+ +
typescript-eslint + Prettier v3. Para cada fila di qué hay en su lugar (o nada).
Ojo: hay dependencias que NO tienen equivalente instalado de ninguna forma
(pruebas, validación de formularios, accesibilidad, lint). Esas son hallazgos
propios, independientes del framework.

Arquitectura §3:
- shell/, router, core/, features/<feature>/{api,componentes,paginas,presentacion},
  shared/, styles/. Compara con la estructura real de apps/web/src/app/.
- Feature-first: ¿un feature importa de otro feature? Verifícalo con grep sobre
  los imports relativos entre carpetas de funcionalidades/.
- core/ solo singletons, nunca componentes visuales.
- shared/ (aquí 'compartido/') solo lo verdaderamente reutilizable: ¿hay algún
  componente en compartido/ que use un solo feature?
- Lazy loading por ruta: cada página entra por lazy. Revisa app.routes.ts y los
  *.rutas.ts. Bundle inicial menor a 200 KB: mira si hay presupuesto configurado
  en apps/web/angular.json y cuál es.
- Atomic Design (átomos/moléculas/organismos/plantillas): ¿existe alguna
  organización así, o son componentes sueltos?
- ¿Hay DESIGN.md o DESIGN.json en la raíz? La norma los exige de lectura previa;
  el CLAUDE.md del repo dice que la paleta vive en tailwind.config.js. Verifica si
  algún componente hardcodea un hex en vez de usar los tokens.

Clean Code §10 y umbrales que bloquean: más de 50 líneas por función o
COMPONENTE, más de 3 parámetros, complejidad mayor a 10, anidamiento mayor a 3.
Los componentes Angular de este repo llevan el template inline: mide el archivo
completo con wc -l y nombra los peores. TypeScript estricto: noUnusedLocals y
noUnusedParameters en apps/web/tsconfig.json.

Empieza por: apps/web/package.json, apps/web/tsconfig*.json, apps/web/angular.json,
apps/web/src/app/**, docs/adr/**.
`,
  },
  {
    clave: 'fe-datos-seguridad',
    titulo: 'Frontend · componentes, datos, seguridad, a11y y rendimiento',
    encargo: `
Audita apps/web contra §4 (reglas duras de componentes), §5 (datos y consumo de
la API, trazabilidad), §6 (rendimiento), §7 (seguridad), §8 (accesibilidad),
§9 (pruebas) y §13 (antipatrones) de la norma frontend.

Traduce las reglas de React a su equivalente Angular cuando exista; cuando la
regla sea puramente de React, evalúa la INTENCIÓN de la regla (p.ej. "el estado
del servidor no se copia a useState" equivale a "no se copia a un signal local
que después se desincroniza").

§4 componentes:
- UI sin lógica de negocio: ¿hay componentes con reglas de negocio adentro?
- Estado del servidor duplicado en estado local del componente.
- LOS CUATRO ESTADOS obligatorios en toda vista que consulta datos: cargando,
  error, vacío, con datos. Recorre CADA componente de
  apps/web/src/app/funcionalidades/** que haga una petición y di cuáles no
  resuelven la rama de error o la de vacío. Este es el hallazgo más importante
  del bloque: sé exhaustivo y da la lista.
- any prohibido; 'as' solo justificado. Cuenta los ': any', '<any>' y 'as any'.
- Efectos que limpian lo que abren (suscripciones, timers, AbortController).
  En Angular: suscripciones manuales sin takeUntilDestroyed/unsubscribe.
- Listas con key/track estable de dominio, nunca el índice. Busca 'track $index'
  y 'track i' en los @for.
- Archivos y carpetas en español kebab-case.

§5 datos:
- Caché con revalidación (equivalente a TanStack Query). ¿Hay alguna caché, o
  cada navegación repite la petición?
- Query keys jerárquicas declaradas en un solo sitio; invalidación explícita
  tras mutar.
- Mutaciones optimistas con rollback en onError.
- Reintento con backoff exponencial para transitorios; retry:false para 4xx.
- Debounce y cancelación de la petición anterior en búsquedas en vivo.
- Desempaquetado del envelope { success, statusCode, message, data } UNA SOLA VEZ
  en core/api/. Lee apps/web/src/app/core/services/api.service.ts: ¿desempaqueta
  ahí, o cada servicio de feature toca .data?
- Se muestra el MENSAJE DEL BACKEND, no uno inventado en el cliente. Lee
  apps/web/src/app/core/interceptors/error.interceptor.ts y busca mensajes
  inventados o traducciones de códigos.
- FECHAS: el frontend pinta lo que recibe, NO convierte a zona local ni a UTC.
  Busca DatePipe, toLocaleDateString, new Date(...) sobre fechas del servidor.
- Un solo cliente HTTP y es el único que añade cabeceras.
- Trazabilidad §5: una acción funcional = un transactionId acuñado por la UI,
  viajando en el header W3C 'baggage' con prefijo unimar.; PROHIBIDO inventar
  cabeceras propietarias y prohibido correlationId. Cuando algo falla, el
  localizador se le muestra al usuario. Revisa los interceptores y di qué
  cabeceras se añaden realmente.

§7 seguridad (revisa con cuidado, aquí suele estar lo crítico):
- Tokens NUNCA en localStorage; cookies httpOnly + SameSite. Lee
  apps/web/src/app/core/services/almacen-sesion.service.ts completo y di
  exactamente qué se guarda y dónde.
- dangerouslySetInnerHTML / [innerHTML] prohibido.
- CSRF por header vía interceptor. X-Frame-Options DENY en el servidor: mira
  infra/nginx/default.conf.
- Ningún DNI, correo ni teléfono a console.log ni a telemetría del cliente.
  Busca console.* en apps/web/src.

§8 accesibilidad WCAG 2.2 AA: cero violaciones de axe-core (¿está axe?), todo
operable con teclado y foco visible, HTML semántico primero, toda imagen con alt,
todo campo con label asociado, contraste 4.5:1, foco gestionado al abrir y cerrar
modales y devuelto al disparador, errores de formulario anunciados por lector de
pantalla. Revisa apps/web/src/app/compartido/componentes/dialogo.component.ts y
los formularios de login/recuperar/restablecer.

§6 rendimiento: LCP<2.5s, CLS<0.1, bundle inicial <200 KB, skeletons en vez de
spinner de página completa, imágenes dimensionadas.

§9 pruebas: componentes 80%, hooks/servicios 80%, E2E de flujos críticos,
axe-core en el 100% de las páginas, Lighthouse CI. Cobertura mínima 70% que
bloquea la fusión. ¿Existe UN SOLO archivo de prueba en apps/web?

Empieza por: apps/web/src/app/core/**, apps/web/src/app/funcionalidades/**,
apps/web/src/app/compartido/**, apps/web/src/app/layout/**, infra/nginx/default.conf.
`,
  },
]

phase('Auditar')

const resultados = await pipeline(
  BLOQUES,
  (bloque) =>
    agent(
      `${CONTEXTO}

TU BLOQUE: ${bloque.titulo}
${bloque.encargo}

Trabaja con comandos reales (grep, find, wc, sed -n) y abre los archivos.
Devuelve SOLO los hallazgos, con evidencia verificable.`,
      { label: `auditar:${bloque.clave}`, phase: 'Auditar', schema: ESQUEMA_HALLAZGOS },
    ),
  (informe, bloque) => {
    if (!informe || !informe.hallazgos || informe.hallazgos.length === 0) return { confirmados: [] }
    return agent(
      `${CONTEXTO}

ERES EL VERIFICADOR ADVERSARIAL del bloque "${bloque.titulo}".

Otro auditor produjo estos hallazgos. Tu trabajo es INTENTAR REFUTARLOS, no
confirmarlos por cortesía. Para cada uno:

1. Abre el archivo y la línea citada. Si la evidencia no dice lo que el hallazgo
   afirma, veredicto REFUTADO.
2. Recuenta el 'alcance' con tu propio grep/find. Si está inflado, corrígelo y
   marca AJUSTADO.
3. Comprueba si docs/adr/ o el CLAUDE.md del repo declaran la desviación. Si la
   declaran y el auditor puso "no", corrígelo y baja la severidad un escalón.
4. Cuestiona la severidad: CRITICO se reserva para seguridad, pérdida de datos o
   la regla estructural que sostiene la arquitectura. Si está inflada, bájala y
   marca AJUSTADO.
5. Si dos hallazgos son la misma regla contada dos veces, fúndelos en uno.

Ante la duda, REFUTA. Es mejor un informe corto y sólido que uno largo y frágil.
Devuelve la lista final (incluye también los REFUTADOS, con su motivo, para que
quede constancia).

HALLAZGOS A VERIFICAR:
${JSON.stringify(informe.hallazgos, null, 2)}`,
      { label: `verificar:${bloque.clave}`, phase: 'Verificar', schema: ESQUEMA_VERIFICACION },
    )
  },
)

const todos = resultados
  .filter(Boolean)
  .flatMap((r) => r.confirmados || [])

const vigentes = todos.filter((h) => h.veredicto !== 'REFUTADO')
const refutados = todos.filter((h) => h.veredicto === 'REFUTADO')

const orden = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAJO: 3 }
vigentes.sort((a, b) => orden[a.severidad] - orden[b.severidad])

log(`${vigentes.length} hallazgos vigentes, ${refutados.length} refutados`)

return { vigentes, refutados }
