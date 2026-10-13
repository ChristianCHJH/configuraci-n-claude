---
name: cada-etapa-es-un-proyecto
description: "Para la inmobiliaria cada etapa y cada ampliación (1ra etapa, 2da etapa, I ampliación…) es un proyecto independiente con su propio plano, nunca tramos dentro de un proyecto."
metadata:
  node_type: memory
  type: project
  originSessionId: 73e6de80-236e-4859-9aa8-93fd03992d06
  modified: 2026-09-25T04:14:02.328Z
---

Cada etapa y cada ampliación de Planicie o Mirador se registra como **un proyecto independiente con su propio plano** (ADR-021, PRD RN-111 nota del 1 set). No agrupar «Planicie» con varios planos adentro.

**Why:** Christian lo recalcó el 2026-09-24 al planear la carga histórica de lotes y contratos; el nombre «etapa/ampliación» confunde, pero la empresa los gestiona como proyectos separados.

**How to apply:** en la carga histórica, crear un proyecto por cada carpeta de etapa/ampliación. Códigos de manzana homologados sin guion (A-1 → A1); Christian corrige a mano si luego choca con el plano. Cargar primero en local, luego en producción. Ver [[carga-historica-contratos]].
