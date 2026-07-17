---
name: auditoria-actualizacion-nulable
description: "Convención de columnas de auditoría — usuario_actualizacion/fecha_actualizacion son NULABLES, no NOT NULL"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cff0c9b2-f04c-455d-b1d1-4fe2bfcdb274
---

Las columnas de auditoría `usuario_actualizacion` y `fecha_actualizacion` deben ser **NULABLES** (sin NOT NULL, sin DEFAULT). `usuario_creacion` y `fecha_creacion` siguen **NOT NULL**.

**Why:** Al crear un registro nunca hubo una actualización, así que copiar `creacion` en `actualizacion` (o ponerle NOT NULL con default) miente sobre el dato. Arrancan en NULL y solo se llenan en el primer UPDATE real. Christian lo decidió el 2026-06-25 tras un error 500 (`usuario_actualizacion viola not-null`) en `usuarios_roles`.

**How to apply:**
- Tablas NUEVAS: usar el template ya corregido en `~/.claude/CLAUDE.md` (columnas actualizacion nulables).
- Tablas EXISTENTES de este proyecto NO se migraron — en BD siguen NOT NULL. Por eso el código que hace `create()` SÍ debe setear `usuarioActualizacion` en esas tablas (ver fix en `usuarios-roles.servicio.ts`), o tirará 500.
- Nunca copiar `creacion` → `actualizacion` al insertar.
