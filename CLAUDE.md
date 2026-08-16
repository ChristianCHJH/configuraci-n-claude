# Instrucciones Globales

## Alcance de este archivo

Este archivo es **global a la máquina**: aplica a TODOS los repositorios que se abran con Claude Code, cualquiera sea su stack.

Por eso aquí **no van estándares de código**. Motor de base de datos, framework, estructura de carpetas, convenciones de nombres, formato de respuestas HTTP y reglas de modelado son **decisiones de cada proyecto**, y viven en el `CLAUDE.md` del repositorio correspondiente.

Regla: si una instrucción dejaría de ser cierta al abrir otro repositorio, **no pertenece a este archivo**.

## Cómo encontrar los estándares de un proyecto

Al trabajar en un repositorio, la fuente de verdad es, en este orden:

1. `CLAUDE.md` en la raíz del repositorio
2. ADRs del repositorio (típicamente en `reference/architecture/adrs/`) — un ADR posterior gana sobre uno anterior
3. `DESIGN.md` / `DESIGN.json` en la raíz, si existen, para todo lo visual
4. El repositorio canónico de arquitectura de la suite, si el proyecto declara heredar de uno

Si el proyecto no declara un estándar, **preguntar antes de inventarlo**. No asumir el estándar de otro proyecto.

## Idioma

Español para documentación, comentarios y mensajes al usuario, salvo que el repositorio indique lo contrario.
