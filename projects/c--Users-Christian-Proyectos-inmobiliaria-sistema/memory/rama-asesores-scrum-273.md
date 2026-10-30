---
name: rama-asesores-scrum-273
description: Estado de feat/SCRUM-273-asesores (worktree aparte) y sus pendientes tras la revisión del 28/10/2026
metadata:
  node_type: memory
  type: project
  originSessionId: 3a6eb4b9-a3c7-4958-8782-8bfc15cf784f
  modified: 2026-10-29T04:41:16.966Z
---

La rama `feat/SCRUM-273-asesores` (worktree `C:\Users\Christian\Proyectos\inmobiliaria-asesores`, base develop) reemplaza al PR #149, que mezclaba reportes, captador e historial. Alcance acordado: catálogo de asesores con `usuario_id` opcional (externos sin usuario), pantalla y permisos `ASESORES_*` propios, `asesor_venta_id` en separación y contrato; el contrato copia el de la separación. Sin historial, sin cambio de asesor, sin filtros por asesor.

**Why:** el asesor define a quién se paga la comisión; separación y contrato deben tener siempre el mismo.

**How to apply:** al 28/10/2026 hay 12 commits locales sin push, con las correcciones de la revisión ya aplicadas y todo en verde. El rol ASESOR NO se siembra por decisión del usuario (lo crea un admin desde Roles si algún día se usa); los permisos ASESORES_* sí existen. Falta: push y PR a develop; al abrirlo, cerrar el #149. Ver [[todo-entra-por-pr-a-develop]].
