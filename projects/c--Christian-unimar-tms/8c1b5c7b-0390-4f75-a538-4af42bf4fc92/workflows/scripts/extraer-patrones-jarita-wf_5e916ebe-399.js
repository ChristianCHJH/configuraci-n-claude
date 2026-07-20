export const meta = {
  name: 'extraer-patrones-jarita',
  description: 'Extraer patrones UI didácticos de los 2 HTML de referencia que gustaron al usuario',
  phases: [{ title: 'Extraer' }],
}
phase('Extraer')
const SCHEMA = {
  type: 'object',
  properties: {
    patrones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          snippet: { type: 'string', description: 'HTML/CSS/JS mínimo reutilizable, recortado a lo esencial' },
        },
        required: ['nombre', 'descripcion', 'snippet'],
      },
    },
    voseo_detectado: { type: 'array', items: { type: 'string' }, description: 'frases con voseo argentino encontradas (leé, podés, vos, recorré, etc.)' },
  },
  required: ['patrones', 'voseo_detectado'],
}
const results = await parallel([
  () => agent(`Lee el archivo C:\\Users\\cjara\\aprendizajes\\prd-tms.html (78KB, puedes leerlo por partes con offset/limit). Es un documento educativo interactivo que al usuario le encantó. Extrae los patrones de UI didáctica REUTILIZABLES, con su snippet HTML+CSS+JS mínimo (recortado, no el archivo entero):
1. Navbar/pestañas sticky de navegación por secciones (Panorama, Actores, Flujo, Funciones, Reglas, Glosario, Quiz...)
2. Términos subrayados con tooltip de significado al pasar el mouse (glosario inline)
3. Flujo interactivo paso a paso con tarjetas numeradas y botón "Recorrer paso a paso"
4. Pregunta gancho en caja destacada
5. Sección Quiz
6. Sección Glosario
También lista TODAS las frases con voseo argentino que encuentres (leé, mirá, podés, recorré, tocá, elegí, vas a poder, vos, entendés...). Devuelve datos crudos, no prosa para humanos.`, { label: 'extraer:prd-tms', schema: SCHEMA }),
  () => agent(`Lee el archivo C:\\Users\\cjara\\aprendizajes\\runtime-nodejs.html (40KB, puedes leerlo por partes con offset/limit). Es un documento educativo con una sección "modo máquina" (pipeline V8: código fuente → tokens → AST → bytecode → código máquina → CPU) que al usuario le encantó. Extrae los patrones de UI didáctica REUTILIZABLES con snippet HTML+CSS+JS mínimo (recortado):
1. Visualizador paso a paso con botones "Siguiente paso" / "Automático" / "Reiniciar" y tarjetas de etapas del pipeline
2. Panel oscuro tipo terminal que muestra el estado/código en cada paso
3. Cualquier otro patrón de explicación "a nivel máquina" (cómo funciona por dentro)
También lista TODAS las frases con voseo argentino que encuentres (leé, mirá, podés, andá, vos, escribís...). Devuelve datos crudos, no prosa para humanos.`, { label: 'extraer:runtime-nodejs', schema: SCHEMA }),
])
return { prd: results[0], runtime: results[1] }