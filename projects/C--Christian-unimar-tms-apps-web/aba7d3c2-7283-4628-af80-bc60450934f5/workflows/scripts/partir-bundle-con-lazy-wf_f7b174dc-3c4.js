export const meta = {
  name: 'partir-bundle-con-lazy',
  description: 'Divide el bundle del front por ruta con carga diferida y verifica el resultado',
  phases: [
    { title: 'Implementar', detail: 'carga diferida por ruta en el enrutador' },
    { title: 'Verificar', detail: 'revision adversarial del cambio' },
  ],
}

const WEB = 'c:/Christian/unimar_tms/apps/web'

const REGLAS = `
REGLAS OBLIGATORIAS DEL PROYECTO (CLAUDE.md), se verifican en la revision:
1. TODO lo que nombramos nosotros va en ESPANOL (variables, funciones, componentes, archivos).
   Solo queda en ingles lo que impone la plataforma: propiedades de librerias (children, element,
   lazy, Component, path, handle, fallback), y el prefijo 'use' de los hooks.
2. COMENTARIOS: por defecto NINGUNO. Solo si el "por que" no se deduce leyendo el codigo, y entonces
   una linea corta. Prohibidos los encabezados decorativos y los separadores de seccion.
3. PROHIBIDO agregar 'title' o cualquier tooltip por iniciativa propia.
4. Estilo del front: prettier SIN punto y coma, comillas simples, printWidth 110.
5. TypeScript estricto. ESLint del front en 'apps/web/eslint.config.js'.
6. NO cambies comportamiento visible: mismas rutas, mismos titulos del 'handle', misma navegacion.
`

phase('Implementar')
const implementacion = await agent(
  `Trabaja en ${WEB} (React 18 + TypeScript + Vite 6 + react-router-dom 7.18.2 + Tailwind).

HALLAZGO A CERRAR (numero 11 de la auditoria):
"Sin React.lazy: las 10 paginas entran al bundle inicial (440 KB contra un tope de 200)".

Estado medido HOY, antes de tu cambio (baseline real, no lo repitas mal):
  dist/assets/index-*.js   440.87 kB  (gzip 127.80 kB)   <- UN SOLO CHUNK
  dist/assets/index-*.css   25.84 kB  (gzip   5.72 kB)

OBJETIVO: que cada pagina sea su propio chunk y que el bundle inicial baje del tope de 200 kB
(sin comprimir). El listado de paginas esta en ${WEB}/src/enrutador.tsx: son 11 elementos de ruta
(bandeja de carga de archivo, detalle del archivo, consolidado por nave, planificacion de citas y
seis mantenimientos).

COMO:
- Estas en react-router-dom v7: usa la propiedad 'lazy' de la ruta, que es la forma nativa de la
  version, en vez de React.lazy + Suspense manual. Investiga la firma exacta en el
  node_modules de la version instalada antes de escribir: en v7 'lazy' devuelve un objeto con
  'Component'. Confirma si esa version admite tambien la forma de objeto con propiedades perezosas.
- Cuida el arranque: al entrar directo por URL a una ruta perezosa no puede quedar la pantalla en
  blanco ni parpadear. Revisa que ofrece el router para eso ('HydrateFallback' a nivel de ruta,
  'fallbackElement', o un Suspense en el armazon) y elige lo que de mejor resultado. Si necesitas un
  indicador de carga, mira primero ${WEB}/src/compartido/componentes y ${WEB}/src/armazon: reusa lo
  que ya exista en vez de inventar un componente nuevo.
- El armazon (${WEB}/src/armazon/marco-aplicacion.tsx) y la barra lateral NO deben quedar perezosos:
  son el esqueleto y tienen que pintar de inmediato.
- Fijate si conviene separar tambien alguna dependencia pesada de vendor. Si lo haces, justificalo
  con numeros; si no aporta, no lo hagas.

${REGLAS}

VERIFICACION QUE DEBES CORRER TU MISMO, y no puedes darte por terminado hasta que las cuatro pasen:
  cd ${WEB}
  npm run lint
  npm run format:revisar
  npm run typecheck
  npm run build
  npm test
Las 137 pruebas tienen que seguir en verde. Si alguna prueba renderiza el enrutador y se rompe por la
carga diferida, arregla la prueba de forma honesta (esperando a que la pagina cargue), NO borres la
asercion ni marques la prueba como omitida.

DEVUELVE: la tabla de chunks que imprime 'vite build' despues del cambio (tamano sin comprimir y
gzip de cada uno), el tamano del chunk inicial antes y despues, y la lista de archivos que tocaste.
Si NO lograste bajar de 200 kB, dilo explicitamente con el numero real; no lo maquilles.`,
  { label: 'lazy:implementar', phase: 'Implementar' },
)

phase('Verificar')
const ESQUEMA_VEREDICTO = {
  type: 'object',
  properties: {
    correcto: { type: 'boolean' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archivo: { type: 'string' },
          problema: { type: 'string' },
          gravedad: { type: 'string', enum: ['alto', 'medio', 'bajo'] },
        },
        required: ['archivo', 'problema', 'gravedad'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['correcto', 'hallazgos', 'resumen'],
}

const LENTES = [
  {
    key: 'comportamiento',
    prompt: `Revisa el cambio con lente de COMPORTAMIENTO. Corre 'git diff' en ${WEB} y lee los archivos
tocados. Busca especificamente: rutas que cambiaron de path o de titulo, navegacion rota, pantalla en
blanco o parpadeo al entrar directo por URL a una ruta perezosa, estados de carga que tapan contenido
ya pintado, y pruebas que se debilitaron o se omitieron para que pasaran. Intenta REFUTAR que el
cambio sea correcto. Si no encuentras nada real, dilo.`,
  },
  {
    key: 'estilo',
    prompt: `Revisa el cambio con lente de ESTILO Y REGLAS DEL PROYECTO. Corre 'git diff' en ${WEB}.
${REGLAS}
Busca: nombres en ingles que deberian ir en espanol, comentarios que sobran, tooltips ('title')
agregados sin pedirlo, componentes nuevos que duplican algo que ya existia en src/compartido o
src/armazon, y codigo muerto. Intenta REFUTAR que el cambio cumpla. Si cumple, dilo.`,
  },
  {
    key: 'resultado',
    prompt: `Revisa el cambio con lente de RESULTADO MEDIBLE. En ${WEB} corre 'npm run build' TU MISMO y
mira la tabla de chunks real. El baseline antes del cambio era un unico JS de 440.87 kB.
Comprueba: (a) que cada pagina sea de verdad un chunk aparte, (b) cuanto pesa realmente el chunk
inicial ahora y si baja de 200 kB sin comprimir, (c) que no se haya inflado el total ni multiplicado
el CSS. Corre tambien 'npm test' y confirma que las 137 pruebas pasan. Reporta NUMEROS REALES que
hayas visto en tu propia corrida, no los que diga el informe de otro agente.`,
  },
]

const veredictos = await parallel(
  LENTES.map((l) => () =>
    agent(`${l.prompt}\n\nContexto de lo que dijo quien implemento:\n${implementacion}`, {
      label: `verificar:${l.key}`,
      phase: 'Verificar',
      schema: ESQUEMA_VEREDICTO,
    }).then((v) => ({ lente: l.key, ...v })),
  ),
)

return { implementacion, veredictos: veredictos.filter(Boolean) }
