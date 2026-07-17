# Contexto Canónico Unimar — reglas de unimar_arch (universal)

> Lectura **obligatoria** al inicio de cada agente `unimar-*` y del comando `/unimar-dev`.
> Estas son las **reglas del juego** de la suite Unimar, destiladas de `unimar_arch`. Son
> **agnósticas al proyecto/negocio**: lo específico de cada producto (stack elegido, fase,
> premisas, decisiones DT) vive en el baúl de ese proyecto (`<proyecto>-decisiones-tecnicas`).
>
> Fuente canónica (solo lectura): `C:\Christian\unimar_arch\reference\architecture\`.
> Esa carpeta MANDA. Si algo aquí contradice un ADR vigente, gana el ADR (y se corrige este archivo).
> Si algo necesario no está aquí ni en un ADR ni en las decisiones del proyecto → **no se avanza**: se
> pregunta (y se anota en `C:\Christian\Unimar_obsidian\wiki\preguntas-abiertas.md`).

## Cómo se trabaja (universal)

- Entrada única: comando **`/unimar-dev`** (orquestador en hilo principal; un subagente no lanza otros).
- **Project-aware**: el orquestador detecta el proyecto por el directorio de trabajo (o se lo indican)
  y carga: el repo, las historias/PRD del proyecto, y su baúl `<proyecto>-construccion` + `<proyecto>-decisiones-tecnicas`.
- Unidad de trabajo: **una historia/CRUD a la vez**. No todo de golpe.
- Memoria viva: baúl `/unimar` (wiki Obsidian). `unimar_arch` solo se lee; el código vive en el repo del proyecto.
- Tracking: GitHub Projects + baúl.

## Perfiles de runtime (el proyecto declara el suyo)

| Runtime | Stack autorizado | Doc / ADR |
|---|---|---|
| **Node.js** | NestJS 10.x (Express) · TypeScript 5.4+ estricto · TypeORM (Data Mapper) · PostgreSQL 16+ · neverthrow · class-validator · Jest 29 · Swagger | `stack-tecnologico-autorizado-nodejs.es.md`, ADR-0002/0043/0038/0003 |
| **.NET** | Ver perfil .NET (SQL Server de referencia) | `stack-tecnologico-autorizado-dotnet.es.md`, ADR-0041 |
| **Android** | Jetpack Compose, offline-first Room | `stack-tecnologico-autorizado-android.es.md`, ADR-0042 |

El agente lee el perfil del runtime del proyecto y lo sigue. Lo de abajo detalla el perfil **Node.js**.

## Arquitectura Hexagonal (ADR-0002) — Node.js

```
domain/         Entidades, Value Objects, Puertos (interfaces). Cero imports externos.
application/    Casos de uso. Coordina dominio. Sin infraestructura. DI por constructor.
infrastructure/ Entidades de persistencia (TypeORM @Entity), repos, controllers, adaptadores, clientes.
api/            Cáscara NestJS: módulos raíz, middleware, filtros, pipes.
```

- **Active Record PROHIBIDO** (ADR-0043). Acceso vía repositorio inyectado. Entidad de dominio ≠ modelo de persistencia.
- **`throw` para control de flujo PROHIBIDO** (ADR-0038): devolver `Result` (neverthrow). `ExceptionFilter` global mapea a HTTP.
- DI nativa de NestJS (no tsyringe/inversify). Primitivas DDD tácticas: ADR-0029.
- Integraciones externas **como puertos inyectables** aunque haya una sola implementación o stub.
- Migraciones: archivos TS (`typeorm migration:generate`). `synchronize:true` PROHIBIDO.

## Estándar de base de datos (CLAUDE.md global + ADR-0054) — universal

Tabla: nombre **español, snake_case, singular**. Columnas español snake_case.

```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,    -- NUNCA serial / AutoIncrement
-- columnas propias...
usuario_creacion BIGINT NOT NULL, usuario_actualizacion BIGINT NOT NULL,
fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
estado BOOLEAN NOT NULL DEFAULT true,                  -- lógica de negocio
eliminado BOOLEAN NOT NULL DEFAULT false               -- soft delete; NUNCA borrado físico
```

Multi-tenant: incluir `sucursal_id BIGINT` en datos operacionales por sucursal (ADR-0010/0054), aunque el RLS se difiera.

## Respuesta HTTP estándar (CLAUDE.md global)

Éxito `{ success, statusCode, message, data, meta? }` · Error `{ success:false, statusCode, message, error, detail? }`.
`TransformInterceptor` + `HttpExceptionFilter` globales. Mensajes en español. Sin stack traces.

## Frontend — canon de la suite

- **Canon: React + React Query** (TanStack Query) — ADR-0004 + stack agnóstico §3. App modular única en
  Fase 1-2; microfrontends (Module Federation) solo Fase 3+ (ADR-0055).
- Diseño atómico: tokens CSS corporativos + componentes atómicos compartidos.
- **El stack de frontend concreto de cada proyecto se declara en `<proyecto>-decisiones-tecnicas`**
  (un proyecto puede desviarse del canon vía decisión de producto; ahí se registra y se ratifica con ADR).

## Git (ADR-0050)

- Rama por historia: `feature/<ID-HISTORIA>-<slug>`. **Commits SIEMPRE en español.**
- GitFlow: `main, develop, qa, uat, feature/*, dev/<nombre>/<tarea>, release/*, hotfix/*`.

## Pruebas (ADR-0052 / 0053 / 0018)

- Unit (Jest): mocks (interacción) / stubs (estado). Integración + E2E: **Testcontainers** (BD efímera real).
- El agente de QA corre TODO y **corrige** hasta verde. El humano no prueba.

## Idioma y formato (AGENTS.md de unimar_arch)

Todo en **español**. Archivos/carpetas **kebab-case**. Sin BOM, sin CRLF (LF), sin mojibake.

## Índice de ADRs clave (relativo a reference/architecture/)

0002 hexagonal NestJS · 0043 TypeORM Data Mapper · 0038 Result/neverthrow · 0029 primitivas DDD ·
0003 TS estricto · 0054 normalización BD · 0010 multi-tenant · 0049/0056 naming · 0052/0053 pruebas ·
0050 GitFlow · 0004 frontend offline (React Query) · 0055 microfrontends · 0041 backend .NET · 0042 Android.
