# Plan — Profesor Inglés (curso autodidacta estático)

## Context

El repo `teacher-inglish/` solo tiene `PLAN.md`, `CLAUDE.md` y git iniciado. Nada construido.
Objetivo: levantar una app **100% estática** (HTML + CSS + JS vanilla, sin build, sin server,
abre con doble clic en Chrome/Edge) que funciona como un curso de inglés autodidacta adaptativo
CEFR A1→C2. Principio rector: **el contenido son datos (JSON); el HTML/JS es un motor** que los
renderiza. Así se agregan clases sumando archivos JSON sin tocar el motor.

**Decisiones del usuario en esta sesión:**
- **Alcance:** los 5 hitos del CLAUDE.md §5 = motor base + Clase 1 (con mini-diagnóstico) +
  Clase 2 (normal) + examen Mes 1 + dashboard. **NO** generar clases 03–25 todavía (se hacen en
  lote después de que el usuario valide las 2 clases de muestra).
- **Acento visual:** **verde salvia** desaturado, usado con moderación, sobre base blanca.
- **Diseño:** obligatorio invocar la skill `ui-ux-pro-max` antes de escribir CSS/HTML.

## Decisiones técnicas

- Construir en la **raíz actual** (`teacher-inglish/`), no en subcarpeta `profesor-ingles/`.
- Cero dependencias / cero CDN. Comentarios en español, variables en inglés.
- Voz: `SpeechSynthesis` (escuchar) + `SpeechRecognition` (pronunciación), degradan con aviso.
- Persistencia: `localStorage` automático + botones Exportar/Importar JSON.
- Carga de JSON: el motor hace `fetch()` de los archivos de `lessons/`. **Riesgo:** `fetch` sobre
  `file://` (doble clic) lo bloquea CORS en Chrome/Edge. **Mitigación:** los JSON se cargan como
  `<script src>` que asignan a un objeto global (`window.LESSONS[id] = {...}`), evitando `fetch`.
  El roadmap y las clases se sirven así. Documentar en README.

## Estructura objetivo

```
teacher-inglish/
├── index.html              # Índice de clases (lee roadmap)
├── dashboard.html          # Progreso y estadísticas
├── lesson.html             # Shell que renderiza una clase via lesson-engine
├── README.md
├── engine/
│   ├── styles.css          # Tokens de diseño (blanco + salvia) — guiado por ui-ux-pro-max
│   ├── storage.js          # localStorage + export/import JSON
│   ├── lesson-engine.js    # Carga clase y la renderiza por pasos/slides
│   ├── exercises.js        # Tipos de ejercicio + corrección inmediata
│   ├── speech.js           # SpeechSynthesis + SpeechRecognition, umbral por nivel CEFR
│   └── qa-banner.js        # Banner flotante con banco de Q&A de la clase
├── curriculum/
│   └── roadmap.js          # window.ROADMAP = {...} (mapa A1→C2, meses, objetivos)
└── lessons/month-01/
    ├── lesson-01.js        # window.LESSONS['m01-l01'] = {...}  (con mini-diagnóstico)
    ├── lesson-02.js        # window.LESSONS['m01-l02'] = {...}  (clase normal)
    └── exam.js             # window.LESSONS['m01-exam'] = {...} (etiqueta error por topic)
```
> Nota: se usa `.js` que asigna a global en vez de `.json` + fetch, para que funcione con doble
> clic. La estructura de datos interna respeta la "Anatomía de lesson-XX.json" del PLAN.md §4.

## Orden de construcción

**Hito 1 — Motor base**
1. Estructura de carpetas.
2. Invocar `ui-ux-pro-max` → definir tokens (base blanca, acento salvia, espaciado, tipografía).
3. `engine/styles.css` con esos tokens. Foco visible, navegable por teclado, contraste suficiente.
4. `engine/storage.js`: `saveProgress`, `loadProgress`, `exportJSON` (descarga), `importJSON`.
5. `curriculum/roadmap.js`: niveles A1→C2, Mes 1 con sus 25 clases + examen (solo metadata).
6. `index.html`: lista clases leyendo `window.ROADMAP`; marca estado (hecha/pendiente) desde storage.
7. `lesson.html` + `engine/lesson-engine.js`: navegación por pasos (Siguiente/Anterior),
   render de secciones `explanation`/`vocabulary`/`example`, barra de progreso, autosave.

**Hito 2 — Interactividad**
8. `engine/exercises.js`: tipos del PLAN §5 — `multiple_choice`, `fill_blank`, `matching`,
   `word_order`, `listening`, `pronunciation`, `short_writing`. **Corrección inmediata** con
   feedback + explicación. Cada respuesta registra el `topic` para etiquetado de errores.
9. `engine/speech.js`: botón "escuchar" (synthesis) en vocab/ejercicios; pronunciación que
   transcribe y compara contra `target`, con **umbral permisivo→estricto por nivel CEFR**
   (config por nivel). Degradar con aviso si el navegador no soporta.
10. `engine/qa-banner.js`: botón flotante discreto que abre el `qa_bank` de la clase.

**Hito 3 — Contenido de muestra (Mes 1, A1)**
11. `lessons/month-01/lesson-01.js`: Clase 1 "Alfabeto y saludos" + **mini-diagnóstico 10–15
    preguntas** etiquetadas por topic. `spanish_ratio` ~0.7.
12. `lessons/month-01/lesson-02.js`: clase normal A1 completa (explicación, vocab, los distintos
    tipos de ejercicio, audio, pronunciación, `qa_bank`, `spaced_review`).
13. `lessons/month-01/exam.js`: examen final que **etiqueta cada error por topic**.

**Hito 4 — Seguimiento**
14. `dashboard.html`: lee progreso de localStorage, muestra evolución, temas dominados/débiles
    (agregando por `topic`), y recomendación de repaso.
15. Lógica de repaso espaciado en el motor (reintroduce `spaced_review` viejos en dosis chicas).

**Cierre**
16. `README.md`: cómo usar (doble clic), cómo respaldar progreso al repo (Exportar→commit),
    limitación de voz por navegador, y por qué se usan `.js`-con-global en vez de `.json`+fetch.
17. Commits pequeños por paso: `feat:`, `content:`, `docs:` (git ya iniciado).

## Convenciones (del CLAUDE.md)
- IDs: `m01-l01`, `m01-l02`, `m01-exam`.
- Cada ejercicio lleva `topic` (string) **obligatorio** — alimenta etiquetado y repaso espaciado.
- `spanish_ratio`: A1 ~0.7.
- Diseño: blanco dominante, sin saturación, acento salvia con moderación, mucho espacio en blanco.

## Verificación (end-to-end)
1. Abrir `index.html` con doble clic en Chrome y Edge → lista de clases del Mes 1 visible.
2. Entrar a Clase 1 → corre el mini-diagnóstico, navega por pasos, corrige al instante.
3. Hacer un ejercicio de pronunciación → escuchar modelo (synthesis) y probar reconocimiento;
   confirmar aviso elegante si el navegador no soporta voz.
4. Abrir banner de preguntas → muestra el `qa_bank` de la clase.
5. Exportar progreso → descarga JSON; recargar; Importar → restaura estado.
6. Rendir `exam` → corrige y reporta errores por topic.
7. Abrir `dashboard.html` → refleja el progreso y marca temas débiles.
8. Confirmar UI: base blanca, acento salvia suave, foco visible, navegable por teclado.

## Fuera de alcance (esta sesión)
- Clases 03–25 del Mes 1 (se generan en lote tras validación del usuario).
- Meses 02+.
