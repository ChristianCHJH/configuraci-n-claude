---
name: codigo-espanol-sin-comentarios
description: Christian exige todo el código en español y comentarios solo cuando el porqué no se deduce del código
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cfab4592-153f-476f-b22e-66e3fabdb340
  modified: 2026-08-19T14:40:35.784Z
---

Dos reglas permanentes para todo el código que escriba en los proyectos de Christian (backend, frontend, scripts, BD):

1. **Todo en español**: variables, funciones, clases, interfaces, tipos, constantes, archivos y carpetas. Solo se queda en inglés lo que impone la plataforma o la herramienta — palabras reservadas, APIs del navegador, props de librerías (`children`, `queryKey`), el prefijo `use` de los hooks de React, nombres que fija la herramienta (`package.json`, `src/`, `dist/`) y siglas corrientes (`api`, `http`, `uuid`).

2. **Comentarios al mínimo**: por defecto no se comenta. Solo cuando el *por qué* no se puede deducir leyendo el código — decisión contraintuitiva, requisito de negocio invisible, limitación de una librería. Corto y al grano, una o dos líneas. Prohibidos los encabezados decorativos de archivo, los separadores de sección (`// ── filtros ──`) y todo comentario que repita lo que dice el código.

**Why:** me lo corrigió el 2026-08-19 tras revisar el front de Carga de Archivo, donde llegué a 25 % de líneas comentadas y usé nombres como `AppShell`. Su criterio: si hace falta un comentario para entender QUÉ hace algo, el nombre está mal — se arregla el nombre, no se agrega el comentario.

**How to apply:** escribir así desde el primer borrador, no podar después. Si un comentario explica algo que se resuelve con un mejor nombre o extrayendo una función, arreglar el código y borrar el comentario. Está también en el CLAUDE.md del proyecto, sección «Estilo de código».
