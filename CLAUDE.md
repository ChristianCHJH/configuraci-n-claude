# Instrucciones Globales

## PostgreSQL: Estándares obligatorios

Estas reglas aplican en TODOS los proyectos que usen PostgreSQL, sin excepción.

### ID (Primary Key)

Siempre usar:

```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

**Nunca usar SERIAL.** IDENTITY es el estándar moderno desde PostgreSQL 10.

### Columnas de auditoría (OBLIGATORIAS en toda tabla)

```sql
usuario_creacion      BIGINT NOT NULL,
usuario_actualizacion BIGINT,                              -- NULL hasta la primera actualización
fecha_creacion        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
fecha_actualizacion   TIMESTAMP WITH TIME ZONE,            -- NULL hasta la primera actualización
estado                BOOLEAN NOT NULL DEFAULT true,
eliminado             BOOLEAN NOT NULL DEFAULT false
```

- `usuario_creacion` / `fecha_creacion`: **NOT NULL** — siempre se conocen al insertar.
- `usuario_actualizacion` / `fecha_actualizacion`: **NULABLES** — al crear un registro todavía no hubo ninguna actualización, así que arrancan en NULL. Solo se llenan en el primer UPDATE. **Nunca** copiar `creacion` en `actualizacion` al insertar.
- `usuario_creacion` y `usuario_actualizacion`: BIGINT (FK a tabla de usuarios cuando exista)
- `fecha_creacion` y `fecha_actualizacion`: siempre con timezone
- `estado`: lógica de negocio (activo/inactivo)
- `eliminado`: soft delete, nunca borrar registros físicamente

### Convención de nombres

- Tablas: **español, snake_case, singular** → `usuario`, `producto`, `pedido_detalle`
- Columnas: **español, snake_case** → `fecha_creacion`, `usuario_actualizacion`

### Template de tabla completo

```sql
CREATE TABLE nombre_tabla (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- columnas propias de la tabla aquí

    usuario_creacion      BIGINT NOT NULL,
    usuario_actualizacion BIGINT,                              -- NULL hasta la primera actualización
    fecha_creacion        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   TIMESTAMP WITH TIME ZONE,            -- NULL hasta la primera actualización
    estado                BOOLEAN NOT NULL DEFAULT true,
    eliminado             BOOLEAN NOT NULL DEFAULT false
);
```

---

## Angular: Estándares obligatorios

Aplican en TODOS los proyectos frontend con Angular, sin excepción.

### Stack base

- **Framework**: Angular 17+ (standalone components por defecto)
- **Lenguaje**: TypeScript 5.x
- **Estilos**: Tailwind CSS (obligatorio, sin excepciones)
- **UI Components**: PrimeNG
- **Nomenclatura**: español, kebab-case para archivos y carpetas

### Estructura de carpetas obligatoria

```text
src/app/
├── core/                                ← Singleton (importado UNA vez en AppModule/root)
│   ├── guards/                          ← CanActivateFn, protege rutas
│   ├── interceptors/                    ← JWT auto-attach, refresh, errores globales
│   └── services/                        ← Servicios singleton (http-base, auth, etc.)
├── shared/                              ← Reutilizable en toda la app
│   ├── shared.module.ts                 ← Exporta PrimeNG + componentes compartidos
│   ├── components/                      ← Componentes genéricos reutilizables
│   ├── directives/                      ← Directivas compartidas
│   ├── pipes/                           ← Pipes compartidos
│   └── models/                          ← Interfaces y tipos compartidos
└── features/                            ← Módulos de negocio (feature-first)
    └── [feature]/
        ├── [feature].module.ts
        ├── [feature]-lista/             ← Página listado
        ├── [feature]-detalle/           ← Página detalle/formulario
        └── services/                    ← Servicios específicos del feature
```

### Reglas de estructura

- `core/` solo contiene singletons; nunca componentes visuales
- `shared/` solo contiene elementos verdaderamente reutilizables entre features
- Layouts específicos de un feature viven dentro de ese feature, no en `shared/`
- Cada feature es un módulo lazy-loaded independiente
- Nomenclatura de archivos: `nombre-feature.component.ts`, `nombre-feature.service.ts`, etc.

### Tailwind CSS

- **Siempre usar Tailwind** para estilos; no escribir CSS custom salvo casos excepcionales
- Clases utilitarias directamente en el template
- Para componentes PrimeNG, usar `[ngClass]` o clases de Tailwind en el wrapper
- No usar `styleUrls` con CSS propio si Tailwind puede resolverlo

### Buenas prácticas obligatorias

- Usar `OnPush` change detection en todos los componentes posible
- Usar `async` pipe en templates en lugar de suscripciones manuales
- Tipar todo explícitamente; prohibido usar `any`
- Signals para estado local (Angular 17+)
- Separar lógica de negocio del componente hacia el service

### Sistema de diseño del proyecto

Antes de construir o modificar cualquier pantalla Angular, buscar en la raíz del proyecto los archivos:

- `DESIGN.md` — tokens de color, tipografía, componentes y patrones visuales establecidos
- `DESIGN.json` — sidecar con rampas de color OKLCH, sombras, motion y snippets

Si existen, son de lectura **obligatoria** antes de escribir cualquier HTML o CSS. Todo el código visual debe respetar los tokens `--spa-*` definidos en esos archivos y el patrón de layout ya establecido en el proyecto. Nunca hardcodear colores ni inventar patrones nuevos si ya existe un sistema definido.

### Sintaxis Angular obligatoria (17+)

Usar siempre la sintaxis moderna de control flow. Prohibido usar la sintaxis antigua:

- `*ngIf` → `@if (x) { }`
- `*ngFor` → `@for (x of xs; track x.id) { }`
- `[ngSwitch]` + `*ngSwitchCase` → `@switch (x) { @case ('y') { } }`
- `ng-template #ref` para estados → bloques `@if/@else if/@else` inline

---

## Node.js + NestJS: Estándares obligatorios

Aplican en TODOS los proyectos backend con Node.js, sin excepción.

### Stack base NestJS

- **Runtime**: Node.js 20.x
- **Framework**: NestJS 10.x
- **Lenguaje**: TypeScript 5.x
- **ORM**: TypeORM (proyectos nuevos) — `@nestjs/typeorm` + `typeorm`
- **Arquitectura**: Modular (un módulo por dominio/entidad)

### Estructura de módulo

Cada módulo debe contener:

```text
modulo/
  modulo.module.ts
  modulo.controller.ts
  modulo.service.ts
  modulo.entity.ts
  dto/
    crear-modulo.dto.ts
    actualizar-modulo.dto.ts
```

### Estandarización de respuestas HTTP

Todos los endpoints deben retornar esta estructura. Se implementa con un `TransformInterceptor` global (éxito) y un `HttpExceptionFilter` global (errores).

**Respuesta exitosa:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operación exitosa",
  "data": { }
}
```

**Respuesta exitosa con paginación:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Listado obtenido",
  "data": [ ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Respuesta de error:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error de validación",
  "error": "Bad Request",
  "detail": [ ]
}
```

- `detail` es opcional, se usa para errores de validación con múltiples campos
- Los mensajes (`message`) pueden ir en español
- Nunca exponer stack traces ni errores internos en producción

---

## BMAD Method: Agentes y contexto

El usuario trabaja con el framework **BMAD Method** para gestión de proyectos de software. Los agentes tienen nombres propios — cuando el usuario menciona un nombre, referirse al agente BMAD correspondiente, no a librerías o herramientas con el mismo nombre.

### Roster de agentes (proyecto unimar_tms)

| Nombre | Rol | Skill |
|--------|-----|-------|
| **Mary** | Business Analyst | `bmad-agent-analyst` |
| **Paige** | Technical Writer | `bmad-agent-tech-writer` |
| **John** | Product Manager | `bmad-agent-pm` |
| **Sally** | UX Designer | `bmad-agent-ux-designer` |
| **Winston** | System Architect | `bmad-agent-architect` |
| **Amelia** | Senior Software Engineer | `bmad-agent-dev` |

### Cómo activar un agente

```
/bmad-agent-architect   → Winston (arquitecto)
/bmad-agent-dev         → Amelia (dev)
/bmad-agent-pm          → John (PM)
/bmad-agent-analyst     → Mary (analista)
/bmad-agent-ux-designer → Sally (UX)
/bmad-agent-tech-writer → Paige (tech writer)
```

### Flujo de trabajo BMAD (fases)

1. **Análisis**: brainstorming, market research, domain research, PRFAQ, product brief
2. **Planning**: PRD, UX, architecture, epics & stories
3. **Solutioning**: check implementation readiness
4. **Implementation**: sprint planning → create story → dev story → code review → retrospective
