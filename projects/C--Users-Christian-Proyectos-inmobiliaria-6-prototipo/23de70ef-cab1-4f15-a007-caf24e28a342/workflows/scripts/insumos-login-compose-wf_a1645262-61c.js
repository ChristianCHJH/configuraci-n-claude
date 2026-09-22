export const meta = {
  name: 'insumos-login-compose',
  description: 'Extraer el diseno exacto de las 4 pantallas de login, el contrato real de la API de autenticacion y las convenciones, para redactar el prompt de implementacion en Jetpack Compose',
  phases: [
    { title: 'Extraer', detail: 'diseno, contrato de API y convenciones en paralelo' },
    { title: 'Contrastar', detail: 'verificar que el diseno y la API no se contradigan' },
  ],
}

const PROTO = 'c:/Users/Christian/Proyectos/inmobiliaria/6-prototipo/design-acceso'
const API = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema/apps/api/src'
const DOCS = 'c:/Users/Christian/Proyectos/inmobiliaria'

const DISENO_SCHEMA = {
  type: 'object',
  properties: {
    tokens: {
      type: 'object',
      properties: {
        colores: { type: 'string', description: 'cada token con su valor hex exacto y para que se usa' },
        tipografia: { type: 'string', description: 'familias, tamanos en px, pesos, interlineado, tracking' },
        espaciado: { type: 'string' },
        radios_y_sombras: { type: 'string' },
        alto_de_controles: { type: 'string' },
      },
    },
    pantallas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archivo: { type: 'string' },
          estado: { type: 'string' },
          descripcion_visual: { type: 'string', description: 'de arriba a abajo, cada elemento con su posicion, tamano, color y espaciado' },
          textos_literales: { type: 'array', items: { type: 'string' }, description: 'TODAS las cadenas visibles, copiadas letra por letra con sus tildes' },
          diferencias_con_el_reposo: { type: 'string' },
        },
        required: ['archivo', 'estado', 'descripcion_visual', 'textos_literales'],
      },
    },
    componentes_reutilizables: { type: 'array', items: { type: 'string' } },
    observaciones: { type: 'string' },
  },
  required: ['tokens', 'pantallas'],
}

phase('Extraer')

const [diseno, contrato, convenciones, contexto] = await parallel([
  () => agent(
    `Objetivo: describir con precision milimetrica el diseno de CUATRO pantallas de un prototipo movil, para que otro agente las reconstruya en Jetpack Compose sin verlas.

Archivos (son HTML de artboard de 390x844, mas un modulo de piezas compartidas):
  ${PROTO}/Main.dc.html                 -> estado "reposo"
  ${PROTO}/IngresarEnviando.dc.html     -> estado "verificando"
  ${PROTO}/IngresarError.dc.html        -> estado "credenciales incorrectas"
  ${PROTO}/IngresarSinConexion.dc.html  -> estado "sin conexion"
  ${PROTO}/_base.mjs                    -> tokens y piezas compartidas
  ${PROTO}/generar.mjs                  -> como se arman los artboards
  ${PROTO}/Chico360Ingresar.dc.html     -> la misma pantalla a 360 de ancho, para entender que se adapta

NO leas IngresarBloqueado.dc.html: esa pantalla queda fuera del alcance a proposito.

Reporta:
1. TOKENS: cada color con su hex exacto y su papel; la tipografia con familia, tamanos, pesos, interlineado; la escala de espaciado; radios de esquina; sombras; y el alto exacto de los controles (campo de texto, boton).
2. Por CADA pantalla, un recorrido de arriba a abajo: que elemento hay, su tamano, su color, su margen y su separacion con el siguiente. Incluye barra de estado, logo o marca, titulos, campos, boton, enlaces, avisos y cualquier pie.
3. TODOS los textos visibles COPIADOS LETRA POR LETRA, con sus tildes y su puntuacion exactas. Esto es critico: el otro agente los va a usar como recursos de cadena.
4. Que cambia exactamente en cada estado respecto del reposo: que aparece, que desaparece, que se deshabilita, que color cambia, si hay spinner y donde.
5. Que piezas se repiten entre las cuatro pantallas y deberian ser un componente Compose reutilizable.

Usa python o grep para inspeccionar los HTML si son grandes. Se exhaustivo con los valores numericos: no aproximes, copia.`,
    { label: 'diseno:4-pantallas', phase: 'Extraer', schema: DISENO_SCHEMA, effort: 'high' }
  ),

  () => agent(
    `Objetivo: documentar el contrato HTTP REAL del inicio de sesion, leyendo el codigo del backend NestJS. Un cliente Android lo va a consumir y no puede adivinar nada.

Lee ${API}/modulos/autenticacion/ completo: el controller, los DTO de entrada y salida, los casos de uso, y el manejo de errores. Lee tambien el TransformInterceptor y el HttpExceptionFilter globales (busca en ${API}/comun/ o ${API}/configuracion/) para saber la forma exacta del sobre de respuesta, y el guard de rate limit o bloqueo por intentos.

Reporta con exactitud:
1. La ruta completa del login (con el prefijo global), el metodo y si es publica.
2. El cuerpo de la peticion: nombres exactos de los campos, tipos, validaciones (class-validator) y que mensaje devuelve cada validacion fallida.
3. La respuesta de exito: el JSON COMPLETO Y LITERAL, con el sobre (success, statusCode, message, data) y todo lo que trae data. Di si el token viaja tambien en cookies y con que nombres, y si el cuerpo lo repite.
4. TODOS los errores posibles con su statusCode HTTP exacto, su campo message y su campo error, LITERALES. En especial: credenciales incorrectas, usuario inactivo o eliminado, y el bloqueo por intentos (aunque la pantalla de bloqueo no se implemente, el cliente tiene que saber distinguir ese error del de credenciales).
5. El refresco: ruta, que manda, que devuelve, y como se rota el token.
6. GET de "yo" o del perfil: ruta y forma de la respuesta.
7. Cuanto dura el token de acceso y cuanto el de refresco (busca la configuracion).
8. Si existe algo que el cliente deba mandar en cabeceras (User-Agent, X-... ) y si el servidor lo guarda.
9. La bandera debe_cambiar_contrasena: donde viaja en la respuesta del login y que se espera que haga el cliente.

Copia JSON literal del codigo, no lo parafrasees.`,
    { label: 'contrato:autenticacion', phase: 'Extraer', schema: { type: 'object', properties: { login: { type: 'string' }, errores: { type: 'string' }, refresco: { type: 'string' }, perfil: { type: 'string' }, vigencias: { type: 'string' }, cabeceras: { type: 'string' }, ejemplos_json: { type: 'string' }, observaciones: { type: 'string' } }, required: ['login', 'errores', 'refresco', 'ejemplos_json'] }, effort: 'high' }
  ),

  () => agent(
    `Objetivo: reunir las convenciones y decisiones que condicionan como se debe escribir la app Android.

Lee:
  - ${DOCS}/CLAUDE.md si existe, y c:/Users/Christian/.claude/CLAUDE.md
  - c:/Users/Christian/Proyectos/inmobiliaria-sistema/CLAUDE.md
  - ${DOCS}/5-arquitectura/ADR-001-monolito-y-repositorios.md
  - ${DOCS}/3-producto/PRD.md, buscando RN-149, RN-161, RN-162, RF-X01, RF-X05, RF-X06
  - ${DOCS}/3-producto/historias/E00-cimientos.md, en concreto E00-04 (inicio de sesion) y E00-08
  - ${DOCS}/3-producto/historias/E12-android.md

Reporta:
1. Reglas de estilo de codigo que apliquen a Kotlin (por ejemplo si el proyecto prohibe comentarios en el codigo, y el idioma de los identificadores).
2. Los criterios de aceptacion EXACTOS de E00-04 sobre el inicio de sesion: intentos, bloqueo, mensajes al usuario, cambio obligatorio de contrasena.
3. Que dice la documentacion sobre el alcance de la app Android y sobre el idioma de la interfaz.
4. Donde deberia vivir el codigo de la app Android segun el ADR-001 (estructura del monorepo) y si eso hay que revisarlo ahora que la app es nativa y no un TWA.
5. Cualquier regla sobre manejo de errores, mensajes al usuario o accesibilidad que aplique.

Cita textualmente. No inventes reglas.`,
    { label: 'convenciones:proyecto', phase: 'Extraer', schema: { type: 'object', properties: { estilo_codigo: { type: 'string' }, criterios_e00_04: { type: 'string' }, alcance_app: { type: 'string' }, ubicacion_codigo: { type: 'string' }, otras_reglas: { type: 'string' } }, required: ['estilo_codigo', 'criterios_e00_04'] } }
  ),

  () => agent(
    `Objetivo: recomendar, con fundamento, la arquitectura y el stack concretos para una app Android nueva en Kotlin + Jetpack Compose cuya primera entrega es la pantalla de inicio de sesion con cuatro estados (reposo, verificando, credenciales incorrectas, sin conexion).

Responde:
1. QUE PATRON. El usuario duda entre MVC, MVP, MVVM y MVI. Di cual es el recomendado hoy para Compose y por que, en terminos concretos de esta pantalla. Explica como se relaciona con el flujo de datos unidireccional y con la guia oficial de arquitectura de Android (capa de UI, capa de dominio opcional, capa de datos). Se claro sobre si el estado va como un unico UiState inmutable o como campos sueltos, y por que.
2. LIBRERIAS Y VERSIONES. Da el stack concreto y actual: gestion de dependencias, inyeccion, red, serializacion, almacenamiento seguro del token, navegacion, corrutinas y flujos, y pruebas. Para cada una di POR QUE y da la version estable que usarias. Si no estas seguro de una version, dilo en vez de inventarla.
3. ESTRUCTURA DE CARPETAS. Un arbol concreto de paquetes y archivos para esta primera entrega, con el nombre de cada archivo. Que sea suficiente para que otro agente cree el proyecto sin preguntar.
4. ALMACENAMIENTO DEL TOKEN. Como se guarda de forma segura en Android hoy, con la librteria concreta, y que hacer con el token de refresco.
5. EL ESTADO SIN CONEXION. Como se detecta y como se distingue de un error del servidor.
6. PRUEBAS. Que se prueba en esta pantalla, con que, y cuantas pruebas son razonables.
7. LOS ERRORES CLASICOS que un agente comete al escribir esto y que hay que prohibir explicitamente en el prompt (por ejemplo perder el estado en la rotacion, hacer red en el hilo principal, recomposiciones infinitas, guardar el token en SharedPreferences en claro, o poner logica en el Composable).

Se concreto y opinado. Nada de listas de opciones sin recomendacion.`,
    { label: 'arquitectura:compose', phase: 'Extraer', schema: { type: 'object', properties: { patron: { type: 'string' }, stack: { type: 'string' }, estructura_carpetas: { type: 'string' }, token_seguro: { type: 'string' }, sin_conexion: { type: 'string' }, pruebas: { type: 'string' }, errores_a_prohibir: { type: 'string' } }, required: ['patron', 'stack', 'estructura_carpetas', 'errores_a_prohibir'] }, effort: 'high' }
  ),
])

log('Extraccion lista. Contrastando diseño contra contrato de API.')

phase('Contrastar')

const choques = await agent(
  `Eres revisor. Tienes el diseño de cuatro pantallas de login y el contrato real de la API que las alimenta. Tu trabajo es encontrar donde NO encajan, antes de que alguien escriba codigo.

=== DISEÑO DEL PROTOTIPO ===
${JSON.stringify(diseno, null, 1)}

=== CONTRATO REAL DE LA API ===
${JSON.stringify(contrato, null, 1)}

=== CONVENCIONES Y CRITERIOS DE ACEPTACION ===
${JSON.stringify(convenciones, null, 1)}

Busca y reporta:
1. Textos que la pantalla muestra y que la API no puede producir, o al reves: errores que la API devuelve y que ninguna de las cuatro pantallas sabe mostrar.
2. Campos que el formulario pide y que el endpoint no acepta, o campos obligatorios del endpoint que el formulario no recoge.
3. Estados de la interfaz que dependen de un dato que la respuesta no trae.
4. El caso debe_cambiar_contrasena: la pantalla de cambio obligatorio existe en el prototipo pero queda FUERA de este alcance. Di exactamente que debe hacer la app cuando el login responda con esa bandera, dado que la pantalla de destino todavia no se construye.
5. El bloqueo por intentos: la pantalla queda fuera del alcance a proposito. Di como debe comportarse la app si la API devuelve ese error, sin inventar una pantalla.
6. Cualquier decision que el implementador tendria que tomar a ciegas, para dejarla escrita como pregunta en vez de que la invente.

No inventes reglas de negocio. Lo que no este respaldado, listalo como pregunta abierta.`,
  { label: 'contrastar', phase: 'Contrastar', schema: { type: 'object', properties: { choques: { type: 'array', items: { type: 'object', properties: { asunto: { type: 'string' }, problema: { type: 'string' }, como_resolverlo: { type: 'string' } }, required: ['asunto', 'problema'] } }, decisiones_a_ciegas: { type: 'array', items: { type: 'string' } }, comportamiento_fuera_de_alcance: { type: 'string' } }, required: ['choques'] }, effort: 'high' }
)

return { diseno, contrato, convenciones, arquitectura: convenciones && diseno ? undefined : undefined, recomendacion_tecnica: null, choques }
