---
name: unimar-dev-fleet
description: "Flota de agentes unimar-* + comando /unimar-dev para construir CUALQUIER proyecto de la suite Unimar siguiendo unimar_arch. Genérica (no atada a un negocio). Punto de entrada, pipeline, archivos."
metadata: 
  node_type: memory
  type: project
  originSessionId: 9cc85eb6-cf47-4fa8-b3bf-bb21f3442f20
---

# Flota /unimar-dev — desarrollo de la suite Unimar

Sistema de agentes para construir proyectos Unimar historia por historia, atado a la arquitectura
canónica de `unimar_arch` (las reglas del juego). **Genérico**: sirve a SIL, UMS, web-design, etc.
Lo específico de cada proyecto (stack, perfil, premisas, decisiones DT) vive en el baúl del proyecto.

## Punto de entrada
**Siempre** se arranca con **`/unimar-dev`** (orquestador en hilo principal — un subagente no lanza
otros). Es **project-aware**: detecta el proyecto por el directorio de trabajo y carga su repo, sus
historias y su baúl `<proyecto>-construccion` + `<proyecto>-decisiones-tecnicas`.
Modos: vacío=reporte · `<ID>`=pipeline · `modelo`=modelo de datos global · `bootstrap`=esqueleto.

## Archivos del ecosistema (creados 2026-06-18, refactor a genérico)
- `C:\Users\cjara\.claude\commands\unimar-dev.md` — orquestador
- `C:\Users\cjara\.claude\agents\unimar-{analista,backend,tester,frontend,documentador,auditor}.md`
- `C:\Users\cjara\.claude\unimar\contexto-canonico.md` — reglas universales de unimar_arch (todos leen)
- `C:\Users\cjara\.claude\unimar\checklist-arquitectura.md` — gates ADR entre fases

## Pipeline por historia
analista → [gate] → backend → [gate] → tester(corre+corrige) → frontend(/ui-ux-pro-max+/impeccable)
→ documentador(manual con capturas Playwright) → **auditor**(cumplimiento unimar_arch; cuestiona/pregunta)
→ entregable en `<repo>/docs/entregables/<ID>/` → **checkpoint humano**.

## Decisiones canónicas (universales)
- Hexagonal (ADR-0002); TypeORM Data Mapper, Active Record y `throw` prohibidos; neverthrow Result.
- BD: IDENTITY + 6 columnas auditoría + soft delete + sucursal_id; migraciones TS.
- Frontend canon de suite: React+React Query; cada proyecto puede declarar otro stack en su DT.
- Commits **en español**; rama `feature/<ID>-<slug>` (ADR-0050).
- Cada agente escribe SU página de baúl + log; el orquestador es dueño de hub/index/Projects/git.

## Específico de SIL (en su baúl)
[[project_sil]] · perfil Fase-01 · DT-01 Angular 18 · DT-02 Angular Material (no PrimeNG). Ver [[sil-construccion]].

**How to apply:** Para desarrollar cualquier proyecto Unimar, invocar `/unimar-dev` desde su repo.
Pendiente de gobernanza para SIL: ratificar excepciones de stack (Angular/Material) con ADR ante el Arquitecto.
