---
name: plataforma-cursos
description: "Plataforma de estudio teacher-english es multi-curso; profe-dev (Leo) gestiona los cursos técnicos, teacher-ingles (Emily) el inglés"
metadata: 
  node_type: memory
  type: project
  originSessionId: 37d9f77a-7cd9-443d-a762-4c9f96f669ee
  modified: 2026-07-24T22:02:09.884Z
---

La plataforma de estudio de Christian (repo **teacher-english**) es **multi-curso**. En esta PC el repo está en `C:\Users\Christian\Proyectos\teacher-english` (los skills apuntan a una ruta de otra máquina con usuario `cjara`; el repo real de GitHub es `github.com/ChristianCHJH/teacher-english`).

- **Inglés** (curso original): lo gestiona `/teacher-ingles` (Emily). Panel `app.html`, roadmap por meses (CEFR). **NUNCA se toca** — es la regla dura del proyecto.
- **Cursos técnicos** (JavaScript Fundamentos→Experto, Docker, Kubernetes): los gestiona `/profe-dev` (Leo). Hub en `cursos.html`, panel por curso en `curso.html?course=<id>`, roadmaps por módulos con nivel + %.

Arquitectura: motor compartido hecho **course-aware de forma aditiva** (sin `?course=` = inglés de siempre). Progreso namespaceado: inglés bajo `profesor-ingles:progress:v1`; técnicos bajo `academia:progress:<curso>:v1` (y `progress/progress-<curso>.json` en modo servidor). Detalle completo en `ACADEMIA.md` del repo.

**Cómo trabaja Leo:** genera clases **de a poco** (una por vez, nunca todo de golpe), con pedagogía muy clara (capas, analogías, modo máquina, ejercicios de código con `topic`), y reporta nivel + % de avance. Ejercicios de código y "modo máquina" viven en `engine/exercises-code.js`. Ver [[clon-web-unimar]] para el otro proyecto personal.

**Why:** el 2026-07-24 Christian pidió sumar cursos técnicos a su plataforma de inglés sin tocar el inglés. **How to apply:** para clases nuevas de JS/Docker/K8s, invoca `/profe-dev clase <curso>`; para reportes, `/profe-dev estado`.
