---
name: no-pedir-autorizacion-cada-paso
description: Christian no quiere que se pida confirmación/autorización en cada tool use — proceder directamente
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e968f761-84a4-4445-bed9-20f90a4936c2
---

No pedir confirmación ni autorización en cada paso de la implementación. Ejecutar directamente: editar archivos, instalar dependencias, crear módulos, correr comandos.

**Why:** Christian lo indicó explícitamente el 2026-05-29. Las interrupciones constantes para pedir permiso cortan el flujo de trabajo.

**How to apply:** Proceder con todas las acciones del plan aprobado sin pausar a pedir confirmación intermedia. Solo detener si hay una acción destructiva irreversible (borrar BD, force push a main, eliminar archivos de producción).
