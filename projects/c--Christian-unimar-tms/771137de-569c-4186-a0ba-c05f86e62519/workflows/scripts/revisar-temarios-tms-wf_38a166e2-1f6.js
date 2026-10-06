export const meta = {
  name: 'revisar-temarios-tms',
  description: 'Contrasta los 3 temarios (backend, frontend, móvil) contra lo que el código del TMS usa de verdad',
  phases: [{ title: 'Contrastar', detail: 'un agente por temario: inventario real vs temario' }],
}

const SCHEMA = {
  type: 'object',
  properties: {
    faltan: { type: 'array', items: { type: 'object', properties: {
      tema: { type: 'string' }, evidencia: { type: 'string' }, importancia: { type: 'string', enum: ['alta', 'media', 'baja'] } },
      required: ['tema', 'evidencia', 'importancia'] } },
    sobran: { type: 'array', items: { type: 'object', properties: {
      clase: { type: 'string' }, motivo: { type: 'string' } }, required: ['clase', 'motivo'] } },
    orden: { type: 'array', items: { type: 'string' } },
    veredicto: { type: 'string' },
  },
  required: ['faltan', 'sobran', 'orden', 'veredicto'],
}

const comun = `Repositorio: C:\\Christian\\unimar_tms (rama feature/maestras-sap). Solo lectura: no edites nada.
El alumno es Christian, que quiere poder leer cada archivo del proyecto y entender qué hace cada función. Sabe poco de JavaScript.
Tu trabajo: comparar el temario de abajo con lo que el código USA DE VERDAD.
1. Haz un inventario real: dependencias (package.json o gradle/libs.versions.toml) y patrones que aparecen con frecuencia en el código (grep). Cuenta apariciones cuando sirva de evidencia.
2. "faltan": librerías, APIs o patrones que aparecen mucho en el código y que el temario no enseña en ninguna clase. Da evidencia concreta (archivo o conteo). Solo lo que de verdad impide leer el código.
3. "sobran": clases del temario sobre cosas que este código no usa (con evidencia de que no está), indicando si igual tienen valor.
4. "orden": problemas de secuencia (algo que se usa antes de enseñarse, o una clase que llega demasiado tarde para leer código real).
5. "veredicto": 2 frases.
Sé estricto con la evidencia: si no lo verificaste en el código, no lo afirmes. Responde en español.`

const TEMARIOS = [
  { clave: 'backend', carpeta: 'src/apps/api', temario: args.backend },
  { clave: 'frontend', carpeta: 'src/apps/web (el bloque Angular es para otros proyectos de la suite: solo comenta si su peso es razonable para el objetivo)', temario: args.frontend },
  { clave: 'movil', carpeta: 'apps/unitrans-android', temario: args.movil },
]

const resultados = await parallel(TEMARIOS.map(t => () =>
  agent(`${comun}\n\nCarpeta del código: ${t.carpeta}\n\nTemario (${t.clave}):\n${t.temario}`,
    { label: `contrastar:${t.clave}`, phase: 'Contrastar', schema: SCHEMA, agentType: 'Explore' })
    .then(r => ({ clave: t.clave, ...r }))))

return resultados.filter(Boolean)
