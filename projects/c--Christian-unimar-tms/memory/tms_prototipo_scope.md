---
name: tms-prototipo-scope
description: "Los prototipos/pantallas del TMS son referenciales y deben ceñirse al PRD, sin funciones extra"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 107edd71-5f50-4503-9c52-60f8c213bb6e
---

Al prototipar o diseñar pantallas del TMS (prototipo HTML propio o Claude Design), las pantallas son **referenciales** y deben cumplir **exactamente** lo que exige el PRD (`PRD-TMS-001 v0.5.1`, F-01…F-32 / RN-01…RN-67). **No agregar funciones, campos, botones ni pantallas que el PRD no describa.**

**Why:** Christian lo pidió explícitamente (2026-07-10) para evitar scope creep y que el prototipo prometa cosas que el PRD no define (el PRD aún está en borrador; ver [[tms-pantallas]]).

**Matiz importante (2026-07-10):** el límite es de **funciones/alcance**, NO de estética. Las imágenes de referencia (wireframes Figma) son solo **ideas de contenido** de baja fidelidad → **el diseño visual se puede mejorar con total libertad**. Lo que NO se toca es el conjunto de funciones/campos/acciones: ese se ciñe al PRD.

**How to apply:** En cada prompt de diseño: (1) "la imagen es una idea de contenido, mejora el diseño visual con libertad"; (2) "no agregues funciones/campos/pantallas que no estén descritos". Herramientas como Claude Design tienden a añadir funciones extra (ej. toggle mostrar/ocultar contraseña, botones) — acotarlo. Lo que el PRD no cierra se marca como PENDIENTE (badge ámbar), sin inventar comportamiento (PA-01…PA-06).
