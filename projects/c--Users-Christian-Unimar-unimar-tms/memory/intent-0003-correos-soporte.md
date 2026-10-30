---
name: intent-0003-correos-soporte
description: "Intent 0003 (correo de soporte) reducido a texto fijo y construido; ya está en el PR #170"
metadata:
  node_type: memory
  type: project
  originSessionId: dffbc219-af20-4b7b-b3f6-23bb66b82a7e
  modified: 2026-10-28T19:12:46.320Z
---

Estado al 2026-10-28: Christian descartó el mantenimiento, la tabla y el rol `SISTEMAS_TMS`. Se redujo a escribir `desarrolladores@unimar.com.pe` en los 7 textos de «avisa a soporte» (API y web). Ya está construido y probado en la rama `feat/ajustes-qas-pantallas`, y el intent y el spec están reescritos. Entró a develop con el PR #170 (merge 2026-10-28). La anotación en SISTEMA.md va en el PR #171 (rama docs/sistema-correo-soporte).

**Why:** dijo «estamos complicando esto»: quiere lo mínimo ahora. No hay que proponer de nuevo el mantenimiento salvo que lo pida.

**How to apply:** no reabrir el diseño grande. Si cambia el correo, se busca `desarrolladores@unimar.com.pe` en `src/`.

Pendientes menores:
- Borrar a mano `C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016\MSSQL\DATA\verif0002.bak`.
- A la base local `unimar_tms` del 2016 le faltan 5 migraciones.
- Decidir si «Ver N cargas» debe reflejar el filtro (hoy no lo hace).

Ver [[commits-unimar-tms]].
