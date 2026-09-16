export const meta = {
  name: 'mapear-openapi-y-versionado',
  description: 'Mapea todo lo necesario para agregar OpenAPI/Swagger y versionado /api/v1 en unimar_tms',
  phases: [
    { title: 'Mapear', detail: 'lectores paralelos sobre api, dto, envelope, frontend e infra' },
    { title: 'Sintetizar', detail: 'plan unico de cambios exactos' },
  ],
}

const RAIZ = 'c:/Christian/unimar_tms'

const ESQUEMA_INVENTARIO = {
  type: 'object',
  properties: {
    resumen: { type: 'string' },
    archivos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ruta: { type: 'string' },
          detalle: { type: 'string' },
        },
        required: ['ruta', 'detalle'],
      },
    },
    riesgos: { type: 'array', items: { type: 'string' } },
  },
  required: ['resumen', 'archivos', 'riesgos'],
}

const LECTORES = [
  {
    key: 'controladores',
    prompt: `Lee TODOS los archivos *.controller.ts bajo ${RAIZ}/apps/api/src/modules (hay 8).
Para CADA controlador reporta en 'archivos' (ruta = ruta relativa desde la raiz del repo):
- El decorador @Controller('...') exacto y la ruta base.
- Cada handler: verbo HTTP, sub-ruta, nombre del metodo, parametros (@Param/@Query/@Body/@UploadedFile), tipo del DTO de entrada, tipo de retorno declarado, y decoradores extra (@HttpCode, @UseInterceptors, etc).
- Que forma tiene el dato que devuelve (nombre del tipo/interface y donde esta definido).
NO edites nada. Solo lectura.`,
  },
  {
    key: 'dtos',
    prompt: `Inventaria TODOS los DTO de entrada del backend en ${RAIZ}/apps/api/src (carpetas dto/).
Para cada archivo DTO reporta: nombre de la clase, cada propiedad con su tipo TS, sus decoradores de class-validator/class-transformer exactos, y si es opcional.
Marca explicitamente cuales usan @IsISO8601, cuales son de paginacion (page/limit/pageSize) y cuales son enums.
NO edites nada. Solo lectura.`,
  },
  {
    key: 'envelope',
    prompt: `En ${RAIZ}/apps/api/src/shared lee y reporta con precision:
1. El TransformInterceptor: forma exacta del envelope de exito, incluido el caso paginado con meta.
2. El HttpExceptionFilter: forma exacta del envelope de error.
3. shared/domain/resultado-paginado.ts y shared/domain/error-dominio.ts: tipos y codigos canonicos.
4. shared/api/traducir-error.ts: mapeo de codigo de dominio a status HTTP (lista completa codigo -> status).
5. shared/api/aplicacion-de-prueba.ts: como se monta la app de prueba (esto importa porque Swagger debe seguir funcionando ahi).
Tambien lista los tipos de respuesta (interfaces/clases) que los controladores devuelven y donde viven.
NO edites nada. Solo lectura.`,
  },
  {
    key: 'arranque',
    prompt: `Lee ${RAIZ}/apps/api/src/main.ts, ${RAIZ}/apps/api/src/app.module.ts, ${RAIZ}/apps/api/tsconfig.json, ${RAIZ}/apps/api/.eslintrc.cjs y ${RAIZ}/apps/api/nest-cli.json (si existe).
Reporta: como se arranca la app, el setGlobalPrefix, la config de ValidationPipe, si hay excludes de rutas (p.ej. salud), la config de compilerOptions relevante para decoradores, y si el .eslintrc.cjs tiene reglas de frontera que puedan bloquear un import de @nestjs/swagger en alguna capa.
Tambien revisa si nest-cli.json tiene plugins configurados.
NO edites nada. Solo lectura.`,
  },
  {
    key: 'frontend-infra',
    prompt: `Busca en ${RAIZ}/apps/web y en la raiz del repo TODO lugar donde se arme o se asuma la URL base del backend '/api':
- cliente HTTP del front (fetch wrapper), constantes de base URL, variables VITE_*, archivos .env / .env.example
- vite.config.ts (proxy), nginx.conf, Dockerfile, docker-compose*.yml
- cualquier cadena literal '/api' o 'localhost:3000' en apps/web
Reporta cada archivo y la linea/valor exacto que habria que cambiar si la API pasa de '/api' a '/api/v1'.
Incluye tambien donde apunta el healthcheck (docker/nginx) si existe.
NO edites nada. Solo lectura.`,
  },
  {
    key: 'pruebas-y-docs',
    prompt: `Busca en ${RAIZ} (excluye node_modules, dist, coverage) toda referencia literal a rutas '/api/...' que se romperia al versionar a '/api/v1':
- specs de supertest en apps/api/src (.spec.ts) que hagan request a '/api/...'
- pruebas de apps/web (MSW handlers, vitest) que simulen rutas
- documentacion en docs/ y README que cite endpoints
- colecciones .http/.rest, scripts, o cualquier otro consumidor
Reporta archivo y las rutas exactas citadas. Se exhaustivo: usa grep sobre el repo.
NO edites nada. Solo lectura.`,
  },
]

phase('Mapear')
const inventarios = await parallel(
  LECTORES.map((l) => () =>
    agent(l.prompt, { label: `mapa:${l.key}`, phase: 'Mapear', schema: ESQUEMA_INVENTARIO })
      .then((r) => ({ key: l.key, ...r })),
  ),
)

const utiles = inventarios.filter(Boolean)

phase('Sintetizar')
const plan = await agent(
  `Eres el arquitecto. Con estos inventarios del repo unimar_tms produce el plan EXACTO de cambios para dos hallazgos:

HALLAZGO 8 (Alto): Sin OpenAPI. Cero decoradores @Api*, @nestjs/swagger no instalado.
HALLAZGO 9 (Alto): Sin versionado en URL. Hoy setGlobalPrefix('api'); debe quedar /api/v1.

Reglas NO NEGOCIABLES del proyecto (CLAUDE.md):
- Todo el codigo se nombra en ESPANOL (variables, clases, archivos, carpetas). Solo queda en ingles lo que impone la plataforma (decoradores de Nest/Swagger, propiedades de librerias).
- Comentarios: los minimos. Por defecto NO se comenta.
- Arquitectura hexagonal: domain / application / infrastructure / api. Swagger SOLO puede tocar la capa api/ y los dto/. JAMAS domain ni application.
- Envelope HTTP estandarizado: exito {success, statusCode, message, data} (+meta si pagina); error {success, statusCode, message, error, detail?}. La documentacion OpenAPI debe reflejar ESE envelope, no el tipo crudo.
- Mensajes en espanol.

INVENTARIOS:
${JSON.stringify(utiles, null, 2)}

Entrega, en espanol:
1. Dependencias a instalar (nombre y version compatible con NestJS 11).
2. Cambios en main.ts: como versionar. Decide y justifica entre setGlobalPrefix('api/v1') vs enableVersioning(URI). Considera que /api/salud existe y que hay pruebas supertest.
3. Un ayudante compartido para documentar el envelope (ruta propuesta bajo shared/api/, nombre en espanol) para no repetir el schema en cada endpoint. Da el codigo completo.
4. Para CADA controlador y CADA handler: la lista exacta de decoradores @Api* a agregar, con sus textos en espanol.
5. Para CADA DTO: los @ApiProperty/@ApiPropertyOptional con description y example en espanol.
6. Donde montar SwaggerModule (ruta del UI, p.ej. /api/docs), y si debe quedar apagado en produccion via variable de entorno.
7. La lista COMPLETA de archivos que hay que tocar por el cambio de prefijo (backend, front, infra, pruebas, docs), con el valor viejo y el nuevo.
8. Riesgos concretos y como verificarlos (comandos).

Se concreto y exhaustivo. No inventes archivos que no aparecen en los inventarios.`,
  { label: 'plan', phase: 'Sintetizar' },
)

return { plan, inventarios: utiles }
