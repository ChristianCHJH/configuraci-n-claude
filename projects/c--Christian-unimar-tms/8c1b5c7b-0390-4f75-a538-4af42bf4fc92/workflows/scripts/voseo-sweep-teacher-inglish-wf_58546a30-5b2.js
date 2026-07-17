export const meta = {
  name: 'voseo-sweep-teacher-inglish',
  description: 'Corregir voseo argentino a español de Perú en todo el repo teacher-inglish',
  phases: [{ title: 'Corregir' }, { title: 'Verificar' }],
}
const REGLAS = `Corrige TODO el voseo argentino/rioplatense a español de Perú (tuteo) en los archivos indicados del repo C:\\Christian\\Christian Personal\\teacher-inglish.

REGLAS:
- vos→tú, sos→eres, "de dónde sos"→"de dónde eres", imperativos voseantes (leé, mirá, tocá, marcá, elegí, ordená, completá, emparejá, escuchá, escribí, decí, hacé, usá, abrí, entrá, creá, poné, guardá, invocá, avisá, seguí, respetalo, inicializá, fijate, compará, probate)→imperativos de tú (lee, mira, toca, marca, elige, ordena, completa, empareja, escucha, escribe, di, haz, usa, abre, entra, crea, pon, guarda, invoca, avisa, sigue, respétalo, inicializa, fíjate, compara, ponte a prueba)
- Conjugaciones: podés→puedes, sabés→sabes, entendés→entiendes, querés→quieres, tenés→tienes, creés→crees, conocés→conoces, usás→usas, aprendés→aprendes, subís→subes, decís→dices, servís→sirves, "los subís vos"→"los subes tú"
- "¿Cómo te llamás?"→"¿Cómo te llamas?"
- "anda/no anda" con sentido de funcionar→"funciona/no funciona" (ej: "para que ande con file://"→"para que funcione con file://")
- SOLO tocar texto en español (strings, comentarios, HTML, markdown). NO tocar código JS (nombres de variables, funciones, claves de objetos), NO tocar contenido en inglés, NO cambiar la estructura.
- ADEMÁS: el alumno (Christian) es de PERÚ, no de Argentina. En ejemplos donde el alumno se presenta: "I'm from Argentina"→"I'm from Peru", "Soy de Argentina"→"Soy de Perú", item de vocabulario { en: "Argentina", es: "Argentina" }→{ en: "Peru", es: "Perú" }. NO cambiar menciones a otros países que son distractores (ej. "I'm from Spain") ni opciones de listening que no sean la presentación del alumno... PERO si una opción correcta de ejercicio dice Argentina como presentación del alumno, cámbiala a Peru y ajusta la explicación si hace falta.
- Reporta como resultado: lista de archivos tocados y nº de correcciones por archivo. Datos crudos.`
phase('Corregir')
const grupos = [
  { label: 'docs', files: 'README.md, CLAUDE.md y PLAN.md' },
  { label: 'html', files: 'index.html, lesson.html y dashboard.html' },
  { label: 'engine', files: 'engine\\storage.js, engine\\lesson-engine.js, engine\\exercises.js, engine\\speech.js, engine\\qa-banner.js y curriculum\\roadmap.js' },
  { label: 'lessons', files: 'lessons\\month-01\\lesson-01.js, lessons\\month-01\\lesson-02.js y lessons\\month-01\\exam.js' },
]
const SCHEMA = { type: 'object', properties: { archivos: { type: 'array', items: { type: 'object', properties: { archivo: { type: 'string' }, correcciones: { type: 'number' } }, required: ['archivo', 'correcciones'] } } }, required: ['archivos'] }
const res = await parallel(grupos.map(g => () => agent(`${REGLAS}\n\nARCHIVOS A CORREGIR (solo estos): ${g.files}`, { label: `voseo:${g.label}`, phase: 'Corregir', schema: SCHEMA })))
phase('Verificar')
const veredicto = await agent(`Verifica el repo C:\\Christian\\Christian Personal\\teacher-inglish. Busca con Grep (case-insensitive, en TODOS los .md, .html y .js del repo excepto .git) restos de voseo argentino: \\bvos\\b|\\bsos\\b|leé|mirá|tocá|marcá|elegí|ordená|completá|emparejá|escuchá|escribí|decí\\b|hacé|usá\\b|abrí|entrá|creá|poné|guardá|invocá|avisá|seguí\\b|inicializá|fijate|podés|sabés|entendés|querés|tenés|creés|conocés|usás|aprendés|subís|decís|llamás|probate|que ande|no anda. También busca "Argentina" en lessons/. Reporta cada match con archivo:línea y si es voseo real o falso positivo (ej. "sos" dentro de otra palabra, "elegí" en pasado primera persona). Datos crudos.`, { label: 'verificar:voseo', phase: 'Verificar' })
return { correcciones: res.filter(Boolean), verificacion: veredicto }