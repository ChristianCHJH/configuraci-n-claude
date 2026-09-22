---
name: remediar-auditorias
description: "Cómo quiere Christian que se remedie un informe de auditoría: lo que mueve lógica no se toca; la limpieza se corrige y sale al final del documento"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3222c994-6659-4bce-80a0-9aeb607cbd53
  modified: 2026-09-17T03:44:37.700Z
---

Al remediar un informe de auditoría (p. ej. `src/apps/AUDITORIA-WEB-API.md`, 2026-09-16):

1. Clasificar cada hallazgo: **mueve lógica o pide decisión de negocio** → no se toca, se marca 🔒 y se queda en su tabla. **No mueve lógica** (pruebas, lint, docs, comentarios, nombres, observabilidad, refactor sin cambio observable) → se corrige sin preguntar.
2. Lo resuelto **sale de su tabla** (no se tacha) y pasa a una sección «Resueltos» al final; lo pendiente se queda.
3. Mantener un registro de avance en el propio documento para poder seguir en otro chat, y parar al 50 % de contexto avisando dónde quedó.

**Why:** Christian decide lo que cambia el negocio; lo que tiene una única forma correcta no necesita su tiempo.

**How to apply:** delegar por paquetes con carpetas separadas y editar el informe con scripts por líneas (no con expresiones regulares con alternancias escapadas en heredocs: un `\|` mal escapado insertó marcas al inicio del fichero). Ver [[commits-unimar-tms]] para el cierre en git.
