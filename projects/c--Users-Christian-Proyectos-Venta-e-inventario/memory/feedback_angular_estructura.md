---
name: Estándares Angular globales
description: Estructura de carpetas, Tailwind y buenas prácticas obligatorias en todos los proyectos Angular
type: feedback
originSessionId: 7cf02d8f-03b0-4dda-95fd-0b8382c28ec5
---
Siempre usar esta estructura en proyectos Angular: `core/` (singletons), `shared/` (reutilizables), `features/` (feature-first). Tailwind CSS obligatorio para estilos. PrimeNG como librería de componentes.

**Why:** El usuario definió esta estructura como estándar global para todos los proyectos Angular, basada en Angular Style Guide y buenas prácticas de producción.

**How to apply:** En cualquier proyecto Angular, respetar esta estructura sin excepción. No crear CSS custom si Tailwind puede resolverlo. Usar `OnPush`, `async` pipe, tipado estricto (prohibido `any`), y Signals para estado local (Angular 17+).
