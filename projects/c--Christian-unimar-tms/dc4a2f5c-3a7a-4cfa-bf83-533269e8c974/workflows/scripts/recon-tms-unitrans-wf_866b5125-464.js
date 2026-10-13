export const meta = {
  name: 'recon-tms-unitrans',
  description: 'Mapear el codigo ya implementado del flujo TMS + UNITRANS antes de probarlo E2E',
  phases: [
    { title: 'Recon', detail: 'lectores paralelos por subsistema' },
  ],
}

const AREAS = [
  {
    key: 'ingesta',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura la INGESTA DEL REPORTE DETALLADO (relacion detallada, Excel).
Necesito para poder probarlo por pantalla:
1) El endpoint HTTP exacto (metodo + ruta completa con prefijo /api/v1) que recibe el Excel, y el nombre del campo multipart.
2) El formato exacto que espera el Excel: nombres de columnas/cabeceras, fila donde empiezan los datos, hojas, y cualquier validacion que rechace el archivo.
3) Que devuelve la respuesta (filas leidas, cargas creadas, errores) y en que tablas escribe.
4) Donde esta la pantalla web que lo sube (ruta de React, componente) y como se llega a ella desde el menu.
5) Si existe algun fixture/archivo Excel de ejemplo en el repo o en tests, dime la ruta exacta.
Busca en src/apps/api y src/apps/web. Responde con rutas de fichero y numeros de linea concretos.`,
  },
  {
    key: 'planificacion-web',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura el flujo WEB de planificacion.
Necesito:
1) "Iniciar planificacion": endpoint exacto, que columna sella (fecha_inicio_planificacion) y en que tabla, y la ruta React de la pantalla que se abre.
2) Generar CITAS / programacion: endpoint, tablas que escribe (planificacion_servicio_viaje_programacion, tipo_programacion), campos de fecha/hora.
3) Asignar citas a servicios: endpoint y tablas.
4) Asignar conductor y vehiculo a un servicio: endpoint exacto, DTO de entrada, tablas.
5) BLOQUEO CON CADUCIDAD sobre planificacion_servicio_viaje: endpoint que toma el bloqueo, columnas bloqueado_por / bloqueado_hasta, duracion, renovacion, y el mensaje en espanol que ve el segundo usuario. Cita el fichero y la linea del mensaje.
Da rutas de fichero y numeros de linea. Lista TODAS las rutas React del frontend implicadas (ficheros de rutas).`,
  },
  {
    key: 'unitrans-api',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura el CONTROLADOR UNITRANS de la API (el que consume la app Android).
Lista con precision, para CADA ruta bajo /unitrans: metodo, ruta completa con prefijo, DTO de entrada, y respuesta.
Incluye: viajes/planificados, viajes/confirmados, viajes/en-curso, viajes/historial, viajes/:id/detalle, viajes/:id/aceptar, viajes/:id/rechazar, motivos-rechazo, viajes/:id/iniciar, viajes/:id/checkpoints, viajes/:id/contenedores, viajes/:id/carga, viajes/:id/documentos, perfil, avisos, dispositivos.
Para cada escritura dime: si acepta claveOrigen y fechaEvento, como responde a un reenvio (campo repetida?), y que codigo HTTP devuelve en conflicto.
Ademas: donde esta ResolutorDeConductor.delServicio y como resuelve el conductor con UNITRANS_SIN_SESION_DE_CONDUCTOR=true.
Da rutas de fichero y numeros de linea.`,
  },
  {
    key: 'checkpoints',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura los CHECKPOINTS del viaje.
Necesito:
1) El catalogo completo de checkpoints (tabla checkpoint_servicio y/o enum en dominio): codigos exactos, orden, y cuales marca el CONDUCTOR desde el telefono vs cuales no.
2) La regla de SECUENCIA: donde se valida el orden y cual es el mensaje de error en espanol exacto cuando se marca fuera de secuencia. Fichero y linea.
3) El HITO DEDUCIDO / marca_inferida: que checkpoint se infiere (INGRESO_IP?), cuando, y si se escribe con la MISMA clave_origen que el gesto que lo disparo. Cita el codigo.
4) La IDEMPOTENCIA: como se detecta un reenvio por clave_origen y donde se construye la respuesta con repetida: true. Confirma que NO devuelve 409 en ese caso.
5) La tabla planificacion_servicio_viaje_checkpoint: columnas exactas, incluidas fecha_evento, fecha_creacion, clave_origen, fuente, usuario_creador.
Da rutas de fichero y numeros de linea.`,
  },
  {
    key: 'carga-documentos',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura la DECLARACION DE CONTENEDOR y la FOTO DEL TICKET.
Necesito:
1) Busqueda de contenedores del viaje: endpoint, que devuelve, y de que tablas sale.
2) Declarar carga/contenedor: endpoint, DTO, validacion del CODIGO de contenedor (hay digito verificador ISO 6346?), atributos, y las ALERTAS de carga (que las genera y de donde salen). Que pasa si el contenedor ya fue declarado en otro viaje: mensaje exacto en espanol y codigo HTTP.
3) Foto del ticket: endpoint multipart, donde escribe el fichero en disco (carpeta almacen-archivos?), como calcula el SHA-256, y como marca vigente = 0 la foto anterior al reemplazarla. Tabla documento_servicio: columnas exactas.
4) tipo_documento_servicio: catalogo sembrado, codigos disponibles.
Da rutas de fichero y numeros de linea.`,
  },
  {
    key: 'push-firebase',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura el estado del PUSH / FIREBASE. Se me pide un veredicto preciso: funciona, a medias, o solo esbozado.
Revisa EXHAUSTIVAMENTE y con evidencia:
1) API: POST /unitrans/dispositivos (registrar-dispositivo.caso-uso.ts) — que guarda, en que tabla, y si ALGO consume despues ese token para enviar un push.
2) API: GET /unitrans/avisos — de donde salen los avisos: los CALCULA en el momento o los lee de una bandeja/tabla? Cita el codigo.
3) Existe alguna dependencia de firebase-admin en package.json de la API? Alguna credencial de servidor, service account, o variable de entorno FCM?
4) Android: hay google-services.json? Esta el plugin com.google.gms.google-services en build.gradle? Hay dependencia firebase-messaging? Hay un FirebaseMessagingService declarado en AndroidManifest.xml? Como se obtiene el token que se manda a /unitrans/dispositivos?
5) Busca en GAPS.md y DEUDAS.md lo que digan sobre push.
Devuelve un veredicto claro y la LISTA EXACTA de lo que falta para que el push funcione de verdad. Da rutas de fichero y numeros de linea.`,
  },
  {
    key: 'bd-y-sqlcmd',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Necesito poder CONSULTAR la base de datos SQL Server desde Git Bash en Windows para verificar cada gesto.
1) Del docker-compose.yml y el .env: nombre del contenedor de SQL Server, usuario, clave, nombre de la base, puerto.
2) La ruta exacta de sqlcmd DENTRO del contenedor (prueba /opt/mssql-tools18/bin/sqlcmd y /opt/mssql-tools/bin/sqlcmd) y la linea de comando completa que funciona, recordando que en Git Bash hace falta MSYS_NO_PATHCONV=1 y que mssql-tools18 exige -C para confiar en el certificado. NO ejecutes escrituras; una consulta SELECT de prueba si esta bien.
3) Lista las columnas reales (nombre y tipo) de estas tablas leyendo las migraciones o consultando INFORMATION_SCHEMA: relacion_detallada, planificacion, planificacion_servicio_viaje, planificacion_servicio_viaje_programacion, planificacion_servicio_viaje_checkpoint, planificacion_servicio_viaje_carga, documento_servicio, conductor, vehiculo_rodante.
4) Dime cuantas filas hay HOY en cada una de esas tablas.
Puedes usar Bash para docker exec de solo lectura. Da el comando exacto que funciono.`,
  },
  {
    key: 'web-rutas',
    prompt: `Repo C:\\Christian\\unimar_tms, rama feature/unitrans-android. Investiga SOLO lectura el FRONTEND WEB (src/apps/web) para poder recorrerlo con un navegador.
Necesito:
1) El fichero de rutas y la lista COMPLETA de rutas (path -> componente).
2) Como es el LOGIN: contra que servicio autentica (portal UMS en el puerto 5293?), que campos tiene el formulario (usuario, contrasena, compania, sistema), y si con AUTENTICACION=false en la API el login sigue siendo necesario para entrar a la web.
3) Los textos/etiquetas visibles exactos de los botones clave: subir reporte detallado, "Iniciar planificacion", generar citas, asignar citas, asignar conductor y vehiculo. Los necesito literales para poder hacer click por texto.
4) Que variable de entorno usa la web para apuntar a la API y a que URL apunta hoy.
5) Selectores estables si existen: data-testid, id, aria-label.
Da rutas de fichero y numeros de linea.`,
  },
]

phase('Recon')
const RECON_SCHEMA = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    resumen: { type: 'string', description: 'Veredicto breve del estado de esta area' },
    hallazgos: {
      type: 'array',
      description: 'Hechos concretos con fichero y linea',
      items: {
        type: 'object',
        properties: {
          punto: { type: 'string' },
          detalle: { type: 'string' },
          fichero: { type: 'string' },
          linea: { type: 'string' },
        },
        required: ['punto', 'detalle'],
      },
    },
    comandos_o_rutas_utiles: {
      type: 'array',
      description: 'Comandos exactos, URLs, endpoints o rutas de fichero que necesito para probar',
      items: { type: 'string' },
    },
    huecos: {
      type: 'array',
      description: 'Lo que no existe, esta a medias, o no se pudo determinar',
      items: { type: 'string' },
    },
  },
  required: ['area', 'resumen', 'hallazgos'],
}

const resultados = await parallel(AREAS.map(a => () =>
  agent(a.prompt, { label: `recon:${a.key}`, phase: 'Recon', schema: RECON_SCHEMA })
))

return resultados.filter(Boolean)
