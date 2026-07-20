---
name: jarita-learnings
description: Registro evolutivo de learnings y mejoras detectadas por Jarita conversación a conversación
metadata: 
  node_type: memory
  type: project
  version: 1
  last_updated: 2026-06-24
  originSessionId: 699f7a9f-b2b4-42b7-8a7c-049d88446d9c
---

# Jarita Learnings - Evolución Conversación a Conversación

Cada revisión que Jarita hace, documenta:
- Qué se le pasó (gaps detectados)
- Nuevos patrones de riesgo identificados
- Mejoras sugeridas a `unimar_arch` o procesos
- Lecciones del negocio / contexto

---

## Formato de Entry

```markdown
## [Fecha] - [Agente/Artefacto revisado]

**Gap detectado**: [qué se pasó]
**Por qué es importante**: [impacto/riesgo]
**Acción**: [qué agregar a jarita_rules.md o proceso]
**Learning**: [lección abstracta para futuro]
```

---

## Log de Learnings

## 2026-07-09 - Skill jarita-enseña (feedback directo de Christian)

**Gap detectado**: Las lecciones usaban voseo argentino ("leé", "podés", "recorré", "vos") — Christian es de Perú y le suena ajeno. Además el glosario solo estaba al final del documento, y los términos en inglés no se desglosaban palabra por palabra.
**Por qué es importante**: El idioma incorrecto rompe la conexión con el alumno; el vocabulario lejano obliga a saltar al final para entender; un término sin desglosar ("event loop") queda memorizado sin comprenderse de raíz.
**Acción**: Reescrito SKILL.md + jarita_enseña_rules.md v2: (1) español de Perú obligatorio con lista negra de voseo, (2) navbar sticky con pestaña Glosario siempre a la mano, (3) desglose 100% palabra por palabra de todo término en inglés + términos técnicos en español, (4) modo máquina obligatorio en temas de código (pipeline paso a paso estilo runtime-nodejs.html), (5) flujos ilustrados interactivos estilo prd-tms.html, (6) si Christian escribe una palabra con errores de tipeo, deducirla e ilustrarla — no rechazarla.
**Learning**: Lo que más valora Christian: documentos recontra ilustrados con flujo interactivo (prd-tms.html y runtime-nodejs.html son la referencia de calidad), tooltips en palabras subrayadas, y entender de raíz "en modo máquina". Replicar esos patrones siempre.

