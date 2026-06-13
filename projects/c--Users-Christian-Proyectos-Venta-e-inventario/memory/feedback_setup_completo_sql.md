---
name: feedback-setup-completo-sql
description: setup-completo.sql es la fuente de verdad del esquema — actualizar siempre junto a cualquier migración SQL
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 43939550-d192-4fc0-9f13-30c50140bec9
---

Siempre que se cree o modifique algo en la base de datos (tabla, columna, índice, seed, permiso), actualizar `database/setup-completo.sql` en la misma respuesta.

**Why:** El flujo de Christian es: crear migración incremental → aplicarla a producción → eliminar el archivo de migración. `setup-completo.sql` es el único documento que sobrevive y sirve para fresh installs. Si no se actualiza, el esquema queda desfasado.

**How to apply:** Dos entregas simultáneas: (1) `database/migrations/NNN-*.sql` idempotente con `IF NOT EXISTS`; (2) los mismos cambios integrados en `database/setup-completo.sql` sin `IF NOT EXISTS`. Actualizar también la cabecera `-- Última actualización:` del archivo. Regla documentada en `CLAUDE.md` del proyecto.
