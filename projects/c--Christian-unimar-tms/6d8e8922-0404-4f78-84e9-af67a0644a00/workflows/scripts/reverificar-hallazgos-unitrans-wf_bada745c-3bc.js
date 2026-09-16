export const meta = {
  name: 'reverificar-hallazgos-unitrans',
  description: 'Re-verifica contra el codigo actual los 15 hallazgos del code review de feature/unitrans-android',
  phases: [
    { title: 'Verificar', detail: 'un agente por hallazgo lee el codigo actual' },
    { title: 'Contraverificar', detail: 'refuta los veredictos de CORREGIDO' },
  ],
}

const HALLAZGOS = [
  {
    n: 1,
    archivo: 'src/apps/api/src/modules/planificacion/application/viaje-en-curso.caso-uso.ts',
    linea: 47,
    titulo: 'Falta comprobar que el servicio pertenece al conductor que llama',
    detalle: 'Toda ruta de escritura de UNITRANS resuelve el conductor de la sesion pero no comprueba que el servicio sea suyo. Con UNITRANS_SIN_SESION_DE_CONDUCTOR=false, el conductor A puede POST /unitrans/viajes/{servicio-de-B}/iniciar. ViajeDelConductorTypeorm.iniciar usa WHERE id=@0 AND fecha_inicio_viaje IS NULL sin comparar contra la oferta aceptada. Igual en /checkpoints, /carga y /documentos. Solo detalle (linea 87-88) hacia la comprobacion via cabeceraDe(idServicio, conductor.id) -> VIAJE_NO_ES_TUYO. Revisar tambien carga-del-viaje.caso-uso.ts y documentos-del-viaje.caso-uso.ts.',
  },
  {
    n: 2,
    archivo: 'src/apps/api/src/shared/infrastructure/persistence/opciones-typeorm.ts',
    linea: 37,
    titulo: 'useUTC cambiado de false a true sin migracion de las filas ya escritas',
    detalle: 'Al voltear useUTC no hay migracion que corrija las filas escritas con la semantica anterior. Antes, con TZ=America/Lima, un Date se escribia como 14:30 +00:00; despues se escribe 19:30 +00:00. Las filas viejas y nuevas de planificacion_servicio_viaje_programacion.fecha_hora_cita quedan corridas 5 horas entre si. Verificar el valor actual de useUTC, si existe migracion de correccion, y si hay documentacion o decision explicita.',
  },
  {
    n: 3,
    archivo: 'src/apps/api/src/modules/planificacion/api/dto/unitrans.dto.ts',
    linea: 29,
    titulo: 'fechaEvento del telefono sin acotar en el servidor: viola el CHECK y da 500',
    detalle: 'EsFechaHoraConOffset solo valida forma de cadena. Un telefono atrasado 10 minutos manda fecha_evento_respuesta anterior a fecha_creacion-5min y viola ck_planificacion_servicio_viaje_asignacion_fecha_evento_respuesta. Ni OfertasDeViajeTypeorm.responder ni ViajeDelConductorTypeorm.anotar ni DocumentosDelViajeTypeorm.capturar clasifican el error de SQL, asi que sale 500 crudo. Verificar si ahora hay clamp del lado servidor o clasificacion del error de CHECK.',
  },
  {
    n: 4,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/estado/ModeloViaje.kt',
    linea: 113,
    titulo: 'gestoEnCurso comparte la clave de idempotencia entre acciones distintas',
    detalle: 'Una sola propiedad gestoEnCurso guarda la clave para acciones distintas. Si falla marcar llegada y queda la clave K, al tocar marcar salida se reusa K y MARCA_YA_REGISTRADA (viaje-del-conductor.typeorm.ts:189, que compara solo clave_origen + servicio) devuelve repetida:true con estado BALANZA_IP; la app dice Paso marcado aunque SALIDA_IP nunca se escribio. La misma clave la comparten iniciar y capturarTicket; ModeloBandejas.kt:69 la comparte entre aceptar y rechazar. Verificar si ahora hay una clave por accion.',
  },
  {
    n: 5,
    archivo: 'src/apps/api/src/modules/planificacion/infrastructure/persistence/viaje-del-conductor.typeorm.ts',
    linea: 116,
    titulo: 'Consulta de historial con LEFT JOIN a planificacion_servicio_viaje_carga sin deduplicar',
    detalle: 'La consulta CONCLUIDOS hace LEFT JOIN a planificacion_servicio_viaje_carga sin DISTINCT ni agregacion. uq_planificacion_servicio_viaje_carga_servicio_carga solo prohibe la misma carga dos veces en el mismo servicio, asi que dos cargas distintas en un servicio son legales y devuelven la fila del servicio duplicada. PantallaHistorial.kt hace items(actual.valor, key = { it.id }) y Compose lanza IllegalArgumentException Key was already used. Verificar la consulta actual y la key de la lista.',
  },
  {
    n: 6,
    archivo: 'src/apps/api/src/modules/planificacion/application/armador-del-detalle.ts',
    linea: 56,
    titulo: 'faltaAntesDeMarcar usa documentos.length > 0 mientras la escritura exige el tipo obligatorio',
    detalle: 'armar pasa documentos.length > 0 como si cualquier documento fuera evidencia, pero ViajeDelConductorTypeorm.evidenciaQueFalta ejecuta DOCUMENTO_OBLIGATORIO_QUE_FALTA, que exige una fila vigente de cada tipo con obligatorio = 1 (TICKET_PESO_IP). Un viaje con solo una foto de PRECINTO_CONTENEDOR devuelve faltaAntesDeMarcar vacio, la UI habilita Marcar salida y el POST responde 400. Verificar si la lectura ahora usa la misma regla que la escritura.',
  },
  {
    n: 7,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/estado/ModeloViaje.kt',
    linea: 97,
    titulo: 'Cerrar el aviso de error borra gestoEnCurso, perdiendo la clave de reintento',
    detalle: 'olvidarGesto() (y olvidarRespuesta() en ModeloBandejas.kt:61) ponen gestoEnCurso = null, y es el unico gesto que ofrece la UI tras un fallo. Si el servidor escribio pero se perdio la respuesta, el reintento genera un UUID nuevo: aceptar responde 409 OFERTA_YA_RESPONDIDA, declararCarga 409 CARGA_YA_DECLARADA y capturarDocumento archiva una segunda foto que retira la primera. Verificar si la clave sobrevive al cierre del aviso.',
  },
  {
    n: 8,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/estado/ModeloViaje.kt',
    linea: 65,
    titulo: 'Busqueda de contenedor sin debounce ni cancelacion del Job anterior',
    detalle: 'Cada pulsacion de tecla lanza una corrutina en viewModelScope y ninguna cancela la anterior. Con enlace lento la respuesta de MS puede llegar despues de la de MSKU y sobreescribir _candidatos, mostrando candidatos que no corresponden al texto en pantalla. Verificar si ahora hay debounce o se guarda y cancela el Job previo.',
  },
  {
    n: 9,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/estado/ModeloBandejas.kt',
    linea: 44,
    titulo: 'cargarMotivos() se traga el fallo y deja la hoja de rechazo vacia sin mensaje',
    detalle: 'repositorio.motivosDeRechazo().onSuccess { ... } no tiene onFailure. Si GET /unitrans/motivos-rechazo falla, _motivos queda vacio, HojaMotivoRechazo pinta cero opciones y el boton queda deshabilitado para siempre sin explicacion. Verificar si ahora hay manejo del fallo.',
  },
  {
    n: 10,
    archivo: 'src/apps/api/src/modules/planificacion/infrastructure/persistence/registrador-programacion.typeorm.ts',
    linea: 77,
    titulo: 'fecha_hora_cita se escribe como Date crudo sin pasar por enHoraDelTms',
    detalle: 'Todas las demas fechas escritas desde un Date pasan por enHoraDelTms (ofertas-de-viaje.typeorm.ts, viaje-del-conductor.typeorm.ts, carga-del-viaje.typeorm.ts, documentos-del-viaje.typeorm.ts); esta no, asi que planificacion_servicio_viaje.fecha_hora_cita queda con offset +00:00 junto a una fecha_creacion en -05:00. CLAUDE.md exige que nada se guarde en UTC y que el offset sea siempre -05:00. Verificar si ahora usa enHoraDelTms o equivalente.',
  },
  {
    n: 11,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/componentes/CapturaDeTicket.kt',
    linea: 35,
    titulo: 'La foto se lee del disco en el hilo principal, dentro del callback de la camara',
    detalle: 'El callback de ActivityResultContracts.TakePicture corre en el hilo de UI y archivo.readBytes() carga sincronicamente un JPEG que la API acepta hasta 8 MB (TAMANO_MAXIMO_FOTO_BYTES en unitrans-carga.controller.ts). Congela la UI o provoca ANR en gama baja. Verificar si la lectura se movio a Dispatchers.IO o a la corrutina del ViewModel.',
  },
  {
    n: 12,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/datos/RepositorioViajes.kt',
    linea: 132,
    titulo: 'runCatching alrededor de una llamada suspend se traga CancellationException',
    detalle: 'pedir envuelve peticion() en runCatching, que captura todo Throwable incluida la CancellationException. Al salir de pantalla a mitad de peticion la cancelacion se convierte en Result.failure, mensajeDe la mapea a No se pudo conectar y el ViewModel escribe estado de Fallo; ademas la corrutina sigue ejecutando el resto del bloque. Verificar si ahora se relanza CancellationException.',
  },
  {
    n: 13,
    archivo: 'src/apps/api/src/modules/planificacion/infrastructure/persistence/emisor-de-ofertas.ts',
    linea: 53,
    titulo: 'Comentario que justifica calcular el plazo en SQL cita useUTC: false, ya cambiado a true',
    detalle: 'El docblock dice que la conexion corre con useUTC: false y que por eso un Date de Node se escribe cinco horas antes; emisor-de-ofertas.spec.ts:3366 repite la premisa. opciones-typeorm.ts:37 ahora pone useUTC: true, asi que la razon escrita es falsa. Verificar si el comentario se actualizo.',
  },
  {
    n: 14,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/ui/componentes/AvisoDeGesto.kt',
    linea: 32,
    titulo: 'Constante SegundosDelAcuse guarda milisegundos',
    detalle: 'private const val SegundosDelAcuse = 3_000L se pasa a delay(), que toma milisegundos: el comportamiento es correcto pero el nombre miente. Verificar si se renombro a MilisegundosDelAcuse o equivalente.',
  },
  {
    n: 15,
    archivo: 'apps/unitrans-android/app/src/main/java/pe/com/unimar/unitrans/datos/MapeoDeViajes.kt',
    linea: 158,
    titulo: 'ViajeConcluido.fechaHora se calcula y ya nadie lo lee',
    detalle: 'PantallaHistorial dejo de ordenar por fechaHora y usa el orden que devuelve la API. El campo, su fallback fechaHoraCita ?: fechaSalidaIp.orEmpty() en el mapeador y su declaracion en Modelos.kt:125 quedan como codigo muerto. Verificar si el campo sigue existiendo y si alguien lo lee.',
  },
]

const ESQUEMA_VEREDICTO = {
  type: 'object',
  properties: {
    estado: { type: 'string', enum: ['CORREGIDO', 'SIGUE', 'PARCIAL', 'NO_APLICA'] },
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
    evidencia: { type: 'string', description: 'Rutas y numeros de linea reales del codigo actual, con el fragmento que lo demuestra' },
    explicacion: { type: 'string', description: 'En espanol, dos o tres frases: que encontraste hoy en el codigo' },
    ubicacionActual: { type: 'string', description: 'archivo:linea donde vive hoy el codigo relevante, o el nuevo archivo si se movio' },
    residuo: { type: 'string', description: 'Si es PARCIAL, que parte quedo sin arreglar. Si no, cadena vacia' },
  },
  required: ['estado', 'confianza', 'evidencia', 'explicacion', 'ubicacionActual', 'residuo'],
}

const ESQUEMA_REFUTACION = {
  type: 'object',
  properties: {
    refutado: { type: 'boolean', description: 'true si el arreglo NO es real o es incompleto' },
    estadoReal: { type: 'string', enum: ['CORREGIDO', 'SIGUE', 'PARCIAL'] },
    razon: { type: 'string', description: 'En espanol, por que el veredicto se sostiene o no' },
    evidencia: { type: 'string' },
  },
  required: ['refutado', 'estadoReal', 'razon', 'evidencia'],
}

const CONTEXTO = `Repositorio: C:\\Christian\\unimar_tms, rama feature/unitrans-android.
Se hicieron correcciones despues de un code review. Hay cambios sin commitear y archivos movidos o borrados.
Los numeros de linea del hallazgo son de ANTES de las correcciones: no confies en ellos, busca por nombre de simbolo con grep.
Si el archivo ya no existe, busca donde vive hoy esa logica antes de concluir NO_APLICA.
Herramientas utiles: git diff, git status, grep, cat.`

const resultados = await pipeline(
  HALLAZGOS,
  (h) => agent(
    `${CONTEXTO}

Tu tarea: determinar si este hallazgo del code review SIGUE presente en el codigo ACTUAL o ya se CORRIGIO.

HALLAZGO ${h.n}: ${h.titulo}
Archivo original: ${h.archivo}:${h.linea}
Descripcion original del defecto:
${h.detalle}

Metodo obligatorio:
1. Localiza el codigo de hoy (grep por los simbolos citados; el archivo pudo moverse o renombrarse).
2. Lee el codigo completo alrededor, no solo la linea.
3. Si dices CORREGIDO, cita la linea exacta de hoy que hace la comprobacion o el arreglo. Un cambio cosmetico no es un arreglo.
4. Si dices SIGUE, cita la linea exacta de hoy que conserva el defecto.
5. PARCIAL cuando se arreglo una ruta pero no todas (por ejemplo, se corrigio iniciar pero no checkpoints).
6. NO_APLICA solo si la funcionalidad entera desaparecio del repositorio.
Ante la duda, prefiere SIGUE con confianza media antes que declarar un arreglo que no viste.
Todo el texto de salida en espanol.`,
    { label: `verificar:${h.n}`, phase: 'Verificar', schema: ESQUEMA_VEREDICTO },
  ),
  (veredicto, h) => {
    if (!veredicto) return { hallazgo: h, veredicto: null }
    if (veredicto.estado !== 'CORREGIDO') return { hallazgo: h, veredicto, refutacion: null }
    return agent(
      `${CONTEXTO}

Otro revisor afirma que este defecto YA SE CORRIGIO. Tu trabajo es REFUTARLO. Por defecto desconfia.

HALLAZGO ${h.n}: ${h.titulo}
Archivo original: ${h.archivo}:${h.linea}
Defecto original:
${h.detalle}

Lo que afirma el otro revisor:
- Ubicacion de hoy: ${veredicto.ubicacionActual}
- Evidencia que presenta: ${veredicto.evidencia}
- Explicacion: ${veredicto.explicacion}

Lee tu mismo el codigo actual y busca activamente:
- Rutas o casos de uso hermanos donde el arreglo NO se aplico.
- Un arreglo que solo tapa el sintoma y deja el escenario de fallo original vivo.
- Un arreglo que solo existe en pruebas o en comentarios, no en el codigo de produccion.
- Banderas de entorno que desactiven el arreglo.
Si el arreglo es real y completo, dilo: refutado=false. Todo en espanol.`,
      { label: `refutar:${h.n}`, phase: 'Contraverificar', schema: ESQUEMA_REFUTACION },
    ).then((refutacion) => ({ hallazgo: h, veredicto, refutacion }))
  },
)

const salida = resultados.filter(Boolean).map((r) => ({
  n: r.hallazgo.n,
  titulo: r.hallazgo.titulo,
  archivoOriginal: `${r.hallazgo.archivo}:${r.hallazgo.linea}`,
  estadoVerificador: r.veredicto ? r.veredicto.estado : 'SIN_VEREDICTO',
  confianza: r.veredicto ? r.veredicto.confianza : null,
  ubicacionActual: r.veredicto ? r.veredicto.ubicacionActual : null,
  explicacion: r.veredicto ? r.veredicto.explicacion : null,
  evidencia: r.veredicto ? r.veredicto.evidencia : null,
  residuo: r.veredicto ? r.veredicto.residuo : null,
  refutacion: r.refutacion || null,
  estadoFinal: r.refutacion ? r.refutacion.estadoReal : (r.veredicto ? r.veredicto.estado : 'SIN_VEREDICTO'),
}))

log(`Verificados ${salida.length} hallazgos`)
return salida
