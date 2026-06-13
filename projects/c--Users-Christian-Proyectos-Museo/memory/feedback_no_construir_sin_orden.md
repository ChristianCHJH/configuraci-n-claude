---
name: No construir código sin orden explícita
description: El usuario está en fase de análisis y planificación. No iniciar construcción de código hasta que lo indique explícitamente.
type: feedback
originSessionId: 38ed61ab-ea86-4f13-bf83-acf027a877f7
---
No generar ni modificar código de producción (archivos .ts, .html, .css, entidades, servicios, componentes) hasta que el usuario dé la orden explícita de comenzar a construir.

**Why:** El usuario trabaja en fases: primero analiza y ajusta el plan, luego da la orden de construir. Iniciar la construcción antes genera confusión y cambios no deseados.

**How to apply:** Durante sesiones de análisis o planificación, solo leer archivos, documentar y responder preguntas. Cuando el usuario diga "construye", "implementa", "crea el módulo" o similar, ahí sí proceder.
