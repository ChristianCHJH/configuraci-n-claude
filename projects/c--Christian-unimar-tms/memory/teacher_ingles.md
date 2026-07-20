---
name: teacher-ingles
description: Curso de inglés personal de Christian (repo teacher-inglish) + skill Emily + puente de vocabulario con jarita-enseña
metadata: 
  node_type: memory
  type: project
  version: 1
  last_updated: 2026-07-09
  originSessionId: 8c1b5c7b-0390-4f75-a538-4af42bf4fc92
---

# Teacher Inglés — Curso personal de Christian

**Repo**: `C:\Christian\Christian Personal\teacher-inglish` (HTML+CSS+JS vanilla, 100% estático, abre con doble clic; sin framework ni servidor)

**Estado (2026-07-09)**: motor completo, clase 1 (con mini-diagnóstico), clase 2, examen mes 1, dashboard. Faltan clases 03-25 del mes 1 y meses A2→C2.

## Modo panel (desde 2026-07-09)

- **`iniciar.bat`** (doble clic) corre **`server.js`** (Node puro, cero deps, puerto 3210) y abre **`app.html`**: panel único con riel lateral y secciones Hoy / Clases / Progreso / Vocabulario. La clase se toma EMBEBIDA en el panel (iframe `lesson.html?id=X&embed=1`; el param `embed` oculta la topbar de la lección).
- En modo servidor el progreso se escribe SOLO en `progress/progress-latest.json` (POST /api/progress desde `storage.js#syncToServer`); si el navegador está vacío, el panel se auto-restaura desde ese archivo (GET /api/progress). El modo file:// (doble clic en los .html) sigue funcionando; todo lo del servidor es aditivo.
- El repo ahora tiene `PRODUCT.md` y `DESIGN.md` (tokens spa-*, reglas: SVG no emojis, sin voseo, sin em dashes). Leerlos antes de tocar UI. Paleta del panel: 4 tonos apagados con rol fijo: salvia #6f8c79 acción/logro, azul niebla #6b84a3 curso/clases, terracota #b0765a racha/tema débil, lavanda #8b7da6 vocabulario.

## Piezas del sistema

- **Skill global `/teacher-ingles` (Emily)**: `vocab [término]` registra palabra técnica; `clase` genera la siguiente lección del roadmap inyectando vocabulario del banco; `estado` lee progress/ + roadmap y reporta nivel/racha/notas; `plan` lista pendientes. Archivo: `C:\Users\cjara\.claude\skills\teacher-ingles\SKILL.md`
- **Banco de vocabulario**: `curriculum/vocab-bank.js` (`window.VOCAB_BANK.words`, status pending→learned, usedIn). Compartido con [[jarita-ense-a-rules]]: cada término EN que Jarita desglosa entra como pending (REGLA 3 del archivo de reglas de jarita).
- **Racha**: `engine/storage.js` registra `sessions` {fecha: interacciones} en cada respuesta; `Storage.getStreak()` → current/best/activeDays/last14.
- **Dashboard vivo**: `dashboard.html` muestra racha 🔥 + tira 14 días, curso (clases creadas vs por crear, por preparar), vocabulario técnico en cola/visto, temas débiles, notas.
- **Progreso commiteable**: localStorage → botón Exportar → JSON en `progress/` → commit manual (el navegador no puede escribir archivos; limitación documentada).

**Why:** Christian quiere que el repo "tenga vida": ver progreso, racha, qué falta crear, y que el inglés que aprende sea el vocabulario técnico que usa en su trabajo (Unimar, Node).

**How to apply:** al desglosar términos EN en jarita-enseña, registrarlos en vocab-bank.js. Al generar clases con /teacher-ingles, consumir pending del banco. Español de Perú siempre (el repo se corrigió de voseo argentino el 2026-07-09; ejemplos dicen "I'm from Peru").
