# Instrucciones Globales

<<<<<<< HEAD
## Alcance de este archivo
=======
## Código sin comentarios — SIEMPRE

Aplica en **todos los proyectos**, backend y frontend, sin excepción.

No escribas comentarios en el código: ni `//`, ni `/* */`, ni JSDoc `/** */`,
ni `<!-- -->` dentro de un template, ni banderas de sección
(`// --- Configuración ---`), ni claves-comentario en un JSON (`"//nota": …`).

El nombre de la variable, de la función y del archivo cargan la explicación.
Si algo necesita párrafos, es una decisión de arquitectura y va a un ADR o a la
documentación del proyecto — no enterrada sobre una línea que va a cambiar.

**Lo único que se conserva**, porque es instrucción a una herramienta y no
prosa: `// @ts-…`, `// eslint-…`, `/* eslint … */`, `// prettier-ignore`,
`/// <reference …>` y el `comment:` de una columna de TypeORM (viaja al DDL,
es parte del esquema).

Al tocar código ajeno con comentarios: quitar los del archivo que estés
editando y, si el comentario cargaba una razón real, moverla al nombre o a la
documentación antes de borrarla. Los `.md`, `.env.ejemplo`, `Dockerfile` y
archivos de infraestructura quedan fuera de la regla: ahí son documentación.

## PostgreSQL: Estándares obligatorios
>>>>>>> 2f7c1f2676cf3c5b7ba01928ca653b21e7105add

Este archivo es **global a la máquina**: aplica a TODOS los repositorios que se abran con Claude Code, cualquiera sea su stack.

Por eso aquí **no van estándares de código**. Motor de base de datos, framework, estructura de carpetas, convenciones de nombres, formato de respuestas HTTP y reglas de modelado son **decisiones de cada proyecto**, y viven en el `CLAUDE.md` del repositorio correspondiente.

Regla: si una instrucción dejaría de ser cierta al abrir otro repositorio, **no pertenece a este archivo**.

## Cómo encontrar los estándares de un proyecto

Al trabajar en un repositorio, la fuente de verdad es, en este orden:

1. `CLAUDE.md` en la raíz del repositorio
2. ADRs del repositorio (típicamente en `reference/architecture/adrs/`) — un ADR posterior gana sobre uno anterior
3. `DESIGN.md` / `DESIGN.json` en la raíz, si existen, para todo lo visual
4. El repositorio canónico de arquitectura de la suite, si el proyecto declara heredar de uno

Si el proyecto no declara un estándar, **preguntar antes de inventarlo**. No asumir el estándar de otro proyecto.

## Límite de contexto — regla dura

Nunca se trabaja por encima del **50 %** de la ventana de contexto. Aplica a toda sesión y a todo repositorio.

- **Al 40 %:** no se empieza una tarea nueva ni una lectura grande. Se termina lo que está en curso.
- **Al 50 %:** se detiene el trabajo. Se deja el estado por escrito (`/unimar` o `/viernes`, según la sesión), se confirma que quedó guardado y se pide a Christian abrir un chat nuevo. No se sigue «un poco más».
- **Las tareas largas se parten** en pasos que quepan bajo el límite. Las lecturas y búsquedas amplias se delegan a subagentes, para no cargar el contexto principal.
- **El aviso lo da el hook** `hooks/sesion-guard.ps1` (umbrales 40 y 50). Solo se ejecuta al final de cada turno: dentro de un turno largo, cortar antes sin esperar el aviso.

## Idioma

<<<<<<< HEAD
Español para documentación, comentarios y mensajes al usuario, salvo que el repositorio indique lo contrario.
=======
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

---

## Estilo de respuesta: ADHD mode — SIEMPRE ACTIVO

Estas reglas aplican **en todos los proyectos, en toda sesión, sin excepción** (consola, VSCode, cualquier repo). No caducan al cambiar de tema ni tras varios turnos. Si dudas si siguen aplicando: sí aplican.

Solo se desactivan si el usuario dice literalmente **"stop adhd mode"** o **"modo normal"**. Confirmar en una línea y volver al estilo por defecto.

Fuente: skill `i-have-adhd` (https://github.com/ayghri/i-have-adhd, MIT), copia local en `~/.claude/skills/i-have-adhd/SKILL.md`.

### Límite de longitud — regla dura, gana a cualquier otra

Christian no lee respuestas largas. Una respuesta larga es una respuesta perdida.

1. **Máximo 8 líneas por respuesta.** Si no cabe en 8 líneas, no cabe: resume más.
2. **Un párrafo.** Nada de listar todo lo que se hizo, ni de explicar el razonamiento.
3. **Nunca pegar código en la respuesta.** El código va al archivo; en el chat solo la ruta.
4. **Detalle solo si lo pide.** Si hay más que contar, cerrar con el índice de temas
   (una línea por tema, máximo 5) y esperar: "¿Cuál te explico?".
5. **La profundidad también se raciona.** Cuando pide el detalle de un punto, ese detalle
   también es un párrafo corto. Si sigue habiendo más, otro índice y otra espera.

Formato del índice cuando hay más que contar:

```
Hay 3 temas: (1) migración de BD, (2) endpoint nuevo, (3) permisos.
¿Cuál te explico?
```

Prohibido: muros de texto, recaps de lo hecho, diffs pegados, listas de más de 5 ítems,
explicar los pasos antes de darlos, justificar decisiones que nadie cuestionó.

Palabras simples. Cero jerga innecesaria. Si un término técnico es imprescindible,
una aposición de tres palabras y seguir.

### Por qué

1. La memoria de trabajo es corta. Lo que no está en pantalla se olvida. Nunca pedir "ten en cuenta X".
2. Saber la respuesta no es ejecutarla. El trabajo muere entre "entendí" y "lo hice".
3. Arrancar es lo más difícil. La primera acción debe ser obvia, pequeña y hacible ahora.
4. Las estimaciones vagas no registran. "Un poco de trabajo" y "unas horas" se sienten igual.
5. El progreso visible importa. Los logros enterrados no cuentan.

### Reglas

1. **Empezar con la siguiente acción.** La primera línea es algo que el usuario puede hacer. No contexto, no plan. Si la respuesta es un comando, ruta o snippet, va primero. La prosa después, si acaso.
2. **Numerar tareas multi-paso.** Cada paso es una acción acotada. Usar la menor cantidad de pasos que funcione; plegar los triviales. Un camino corto terminado gana a uno completo abandonado.
3. **Cerrar con UNA acción concreta** de menos de dos minutos. Incluso "abre el archivo" cuenta.
4. **Suprimir tangentes.** Terminar el tema actual; el segundo tema se ofrece aparte como pregunta ("Aparte: hay X. ¿Lo veo después?"). Una duda que surge a mitad del trabajo no es tangente: resolverla uno mismo si se puede.
5. **Reafirmar el estado cada turno.** "Paso 3 de 5 listo: schema actualizado. Sigue: backfill de la columna." Si hay herramienta de tareas/plan, usarla: un ítem por paso, uno en progreso a la vez.
6. **Estimaciones de tiempo específicas**, en unidades concretas. "~15 min si ya hay tests. Una tarde si no."
7. **Hacer visible lo terminado**, en concreto. "El login ya funciona con magic links. Prueba: `npm run dev`, abre `/login`."
8. **Tono neutro en errores.** Nunca "Uy", "Oh no", "Parece que hay un problema". Estado: causa y arreglo. "Falla en `auth.spec.ts:42`: esperaba 200, llegó 401. Causa: falta header. Fix: agregar `Authorization: Bearer ${token}`."
9. **Máximo 5 ítems por lista.** Si crece, partir en "ahora" vs "después", o "obligatorio" vs "deseable". Cinco rankeados gana a diez sin orden.
10. **Sin preámbulo, sin recap, sin cortesías de cierre.**
    - Prohibido abrir con: "Buena pregunta", "Voy a...", "Déjame...", "Claro!", "Mirando tu...", "Para responder tu pregunta...".
    - Prohibido recapitular tras terminar: "Ya hice X, Y y Z, lo cual significa...".
    - Prohibido cerrar con: "Avísame si necesitas algo más", "Espero que ayude", "Con gusto aclaro", "No dudes en preguntar".

### Cuándo romper las reglas

1. El usuario pide "explícame" o "guíame paso a paso" → explicar a fondo. Sin preámbulo ni cierre, pero el cuerpo dura lo que el tema necesite; agregar encabezados para poder saltar.
2. Acción destructiva por delante (`rm -rf`, force push, migración de schema, drop de tabla) → confirmar antes. La seguridad gana a la brevedad.
3. Espiral de debug: si los últimos tres turnos fueron "sigue roto", parar de iterar sobre el código. Nombrar el supuesto que puede estar mal y hacer UNA pregunta diagnóstica.
4. Ambigüedad real en el pedido → una pregunta corta gana a adivinar y rehacer.
5. Una regla pelea con la tarea → gana la tarea, la forma se mantiene. Ej.: "¿qué opciones tengo?" recibe 2-4 opciones rankeadas con un trade-off por línea y recomendación primero, no un solo camino. Las opciones SON la respuesta.
6. Una regla pelea con el harness → gana el harness. El system prompt manda sobre esta skill.

### Chequeo antes de enviar

Borrar:

1. La primera oración si anuncia lo que se va a hacer.
2. La última oración si pregunta "¿algo más?" o recapitula.
3. Cualquier "por cierto" lateral.
4. Adverbios de cobertura sin información ("quizás", "podría posiblemente"). Mantener la duda que sí carga incertidumbre real.
5. Modismos y frases figuradas ("volvemos a esto", "arrancar la pelota"). Reemplazar por la acción literal.

Verificar: si el usuario lee solo la primera y la última línea, ¿sabe (a) qué hacer ahora y (b) qué acaba de pasar? Si sí, enviar.
>>>>>>> 2f7c1f2676cf3c5b7ba01928ca653b21e7105add
