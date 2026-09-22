export const meta = {
  name: 'corregir-hallazgos-separacion-contrato',
  description: 'Corrige los hallazgos del code-review de feat/separacion-contrato-cronograma en cuatro frentes disjuntos',
  phases: [
    { title: 'Correcciones', detail: 'separacion+migracion, parametros, conceptos, dominio de contrato' },
    { title: 'Contrato', detail: 'plantillas con ambito, actualizar/postergar/generar' },
    { title: 'Revision', detail: 'auditoria del diff contra CLAUDE.md y los ADR' },
  ],
}

const RAIZ = 'c:\\Users\\Christian\\Proyectos\\inmobiliaria-sistema'

const COMUN = `
Repositorio: ${RAIZ} (monorepo npm: apps/api NestJS 10 + TypeORM, apps/web Angular 18, packages/contratos).
Rama: feat/separacion-contrato-cronograma. El arbol esta limpio y todo lo de la rama esta commiteado.

ANTES DE ESCRIBIR NADA lee ${RAIZ}\\CLAUDE.md completo. Manda sobre cualquier costumbre tuya. Lo critico:
- Regla 6: CERO comentarios en apps/api, apps/web y packages/contratos. Ni //, ni /* */, ni JSDoc. El nombre carga la explicacion. Solo sobreviven // eslint-, // @ts-, // prettier-ignore y el comment: de una @Column de TypeORM.
- Regla 9: un fallo de negocio es un ErrorDominio (NoEncontrado, Conflicto, DatoInvalido, ReglaDeNegocio, NoAutenticado, Prohibido) de comun/dominio/error-dominio.ts, nunca una excepcion de @nestjs/common. De @nestjs/common un caso de uso solo importa Injectable e Inject.
- Regla 8: el ambito de empresa lo sella el servidor. Quien no puede ver algo recibe 404 (NoEncontrado), nunca 403. Ninguna FK de ambito entra por un DTO.
- Regla 5: nunca delete(); borrado logico con eliminado=true y save().
- Regla 3: nadie asigna a mano usuarioCreacion / usuarioActualizacion / fechaActualizacion.
- Regla 10: contar/sumar/agrupar es trabajo de PostgreSQL; nada de una consulta por elemento de un arreglo.
- Molde hexagonal: dominio/ es TypeScript pelado (no importa @nestjs/*, typeorm ni class-validator); las @Entity solo en infraestructura/persistencia/; los @Controller solo en api/; un archivo *.caso-uso.ts por accion, solo en aplicacion/.
- Todo archivo nuevo en dominio/ necesita su .spec.ts hermano (lo exige test/cobertura-pruebas.spec.ts).
- Escribe en espanol y con tildes correctas, como el resto del codigo.

REGLAS DE ESTA TAREA:
- Trabajas en paralelo con otros agentes. Edita EXCLUSIVAMENTE los archivos de tu lista. Si necesitas cambiar algo fuera de ella, NO lo hagas: reportalo en "pendientes".
- NO corras "npm run prueba" ni levantes Docker (otros agentes corren a la vez). Si quieres verificar tipos, "npx tsc -p apps/api/tsconfig.json --noEmit" es aceptable una sola vez al final.
- NO hagas git commit, git add, git checkout ni git stash.
- Lee siempre el archivo antes de editarlo y respeta el estilo que ya tiene (nombres largos en espanol, sin comentarios).
`

const ESQUEMA = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Que quedo corregido, en prosa corta' },
    archivos: { type: 'array', items: { type: 'string' }, description: 'Rutas relativas que tocaste' },
    pendientes: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lo que NO pudiste cerrar, lo que quedo fuera de tu lista de archivos, o lo que necesita una decision del usuario',
    },
    riesgos: { type: 'array', items: { type: 'string' }, description: 'Lo que puede romperse en otro lado por tu cambio' },
  },
  required: ['resumen', 'archivos', 'pendientes'],
}

const P_SEPARACION = `${COMUN}

FRENTE 1 de 4: ambito de empresa en el modulo separacion + la prorroga que no prorroga.

TUS ARCHIVOS (nadie mas los toca):
- apps/api/src/migraciones/1788134400000-SeparacionContratoYCronograma.ts
- apps/api/src/modulos/separacion/** (todo)
- apps/api/test/separacion.spec.ts

TAREA A - el modulo separacion no tiene ambito de empresa (el hallazgo mas grave del review).
Hoy la tabla separacion hereda de EntidadBase (no tiene empresa_id) y ningun caso de uso compara contra
empresaDelSolicitante(). Un usuario de la empresa 2 con VENTAS_VER lista por GET /separaciones las separaciones
de la empresa 1 (nombre del cliente, documento, lote, monto) y con VENTAS_GESTIONAR puede liberar por
POST /separaciones/:id/liberacion el lote de otro inquilino. El contrato hermano de esta misma rama si lo hace
(ObtenerContratoCasoUso.esDelAmbito), o sea que la asimetria esta dentro de una sola funcionalidad.

La decision ya esta tomada: se agrega la columna, calcada de contrato_venta que nacio en esta misma migracion.
La migracion 1788134400000 NUNCA se publico (la rama no esta en origin y crea la tabla separacion desde cero),
asi que se EDITA esa misma migracion en vez de crear una nueva. Concretamente:

1. En la migracion, agrega a CREATE TABLE "separacion" la columna "empresa_id" BIGINT NOT NULL (justo despues
   de "id"), su CONSTRAINT "fk_separacion_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") y el
   indice sobre esa columna. Mira como quedo contrato_venta en esa misma migracion y como quedaron las tablas
   con EntidadEmpresa en las migraciones anteriores (proyecto, en 1723600000000-EsquemaInicial.ts) para que el
   NOMBRE del indice coincida con el que genera el @Index() de EntidadEmpresa; lee
   apps/api/test/arquitectura.spec.ts para saber que compara la suite entre la entidad y el DDL.
2. Agrega tambien "empresa_id" BIGINT NOT NULL + FK + indice a CREATE TABLE "plantilla_contrato" en esa misma
   migracion, con el mismo criterio. TU SOLO HACES EL DDL de esa tabla: el codigo de plantilla lo cambia otro
   agente despues de ti, no toques apps/api/src/modulos/contrato/**.
3. Separacion pasa a extends EntidadEmpresa (apps/api/src/comun/persistencia/entidad-empresa.ts). No declares
   empresaId a mano, ya viene de la clase base.
4. SolicitarSeparacionCasoUso fija empresaId al crear, tomandolo del proyecto del lote. ObtenerProyectoCasoUso
   ya valida el ambito y ProyectoModule lo exporta; mira como lo resuelve hoy
   apps/api/src/modulos/contrato/infraestructura/adaptadores/separacion-del-contrato.desde-separacion.ts.
   empresaId JAMAS llega por el DTO (regla 8).
5. ObtenerSeparacionCasoUso gana un metodo soloLaSeparacion(id): Promise<Separacion> que hace buscarPorId,
   compara Number(separacion.empresaId) contra empresaDelSolicitante() (cuando este es null, pasa: es el
   superusuario sin empresa) y lanza NoEncontrado si no cuadra. Calcalo de ObtenerContratoCasoUso.soloElContrato
   en apps/api/src/modulos/contrato/aplicacion/obtener-contrato.caso-uso.ts. ejecutar() lo usa tambien.
   Pasan a usarlo, en vez de repositorio.buscarPorId: AprobarSeparacionCasoUso, RechazarSeparacionCasoUso,
   LiberarSeparacionCasoUso, ProrrogarSeparacionCasoUso, ListarProrrogasDeLaSeparacionCasoUso y
   ConcretarSeparacionCasoUso.
6. ListarSeparacionesCasoUso pasa empresaId: empresaDelSolicitante() ?? undefined al filtro; FiltroSeparaciones
   lo declara y SeparacionRepositorioTypeorm.consultaFiltrada lo aplica en SQL (s.empresa_id = :empresaId), no
   en memoria. Mira como lo hace ListarContratosCasoUso.
7. Pruebas en apps/api/test/separacion.spec.ts: ajusta la siembra al empresa_id NOT NULL y agrega los casos de
   un usuario de otra empresa: GET /separaciones/:id da 404, POST /separaciones/:id/liberacion da 404 y el
   listado no trae la separacion ajena. Sigue el estilo que ya usa el archivo (sembrarUsuario / autorizacionDe)
   y recuerda que los BIGINT vuelven como string.

TAREA B - prorrogar una separacion vencida no la revive.
fechaDeVigenciaProrrogada (apps/api/src/modulos/separacion/dominio/vigencia-de-la-separacion.ts) le suma 7 dias
a la fecha de vigencia GUARDADA. Si la separacion vencio hace mas de una semana, la vigencia nueva sigue en el
pasado: el cliente paga la prorroga, la fila queda VIGENTE con fecha pasada (o sea que estadoAlDiaDe la sigue
reportando VENCIDA), se registra la fila en separacion_prorroga y el lote se mueve a SEPARADO. La plata no
compro nada. La prueba de separacion.spec.ts solo cubre un vencimiento de 2 dias (-2 + 7 = +5), por eso no salta.

Corrige contando la semana desde la MAS TARDIA entre hoy y la vigencia actual: una vigencia futura nunca se
acorta (se sigue acumulando como hoy) y una vencida vuelve a estar vigente 7 dias desde hoy. Cambia la firma a
fechaDeVigenciaProrrogada(fechaDeVigenciaActual, hoy) y actualiza a ProrrogarSeparacionCasoUso, que ya calcula
fechaComoTexto(new Date()). Suma al .spec.ts hermano el caso de la separacion vencida hace mas de una semana y
el caso de la vigente (que sigue acumulando). Agrega tambien la prueba de integracion en separacion.spec.ts.

Cuando termines, entrega el resumen estructurado.`

const P_PARAMETROS = `${COMUN}

FRENTE 2 de 4: los parametros del negocio aceptan valores imposibles y se leen con una consulta cada uno.

TUS ARCHIVOS (nadie mas los toca):
- apps/api/src/modulos/parametro/** (todo)
- apps/api/src/modulos/contrato/infraestructura/adaptadores/parametros-de-venta.desde-parametro.ts
- apps/api/test/parametro.spec.ts

TAREA A - motivoDeValorInvalido solo valida el formato del numero.
En apps/api/src/modulos/parametro/dominio/lectura-de-parametros.ts, FORMATO_ENTERO = /^-?\\d+$/ y
FORMATO_DECIMAL = /^-?\\d+(\\.\\d+)?$/ admiten -5 y 0 en claves donde todas son cantidades positivas.
Consecuencias reales: PATCH /parametros/:id con separacion_dias_vigencia = "-5" responde 200 y a partir de ahi
toda separacion nace VENCIDA; cuota_dia_vencimiento_defecto = "0" hace estallar DatoInvalido("El dia de
vencimiento 0 no existe en el calendario") desde dentro de la generacion del contrato cuando el cliente no manda
diaVencimiento, y "40" tambien, aunque motivosDeContratoIncoherente si topa el valor explicito;
prorroga_semanas_maximas = "-1" obliga a autorizacion de gerencia desde la primera prorroga.

Agrega al dominio una tabla de rango por clave y valida contra ella en motivoDeValorInvalido, con mensajes en
el mismo tono que los que ya estan. Mi clasificacion de partida, que TIENES que verificar leyendo donde se usa
cada clave antes de aceptarla (grep por CLAVES_PARAMETRO en apps/api/src):
- Estrictamente mayores que cero: separacion_monto_minimo, separacion_dias_vigencia, prorroga_monto_minimo,
  financiamiento_plazo_maximo_meses, credito_contado_meses_maximos, inversionista_plazo_reventa_meses.
- cuota_dia_vencimiento_defecto: entero en el rango 1..28 (el mismo tope que coherencia-del-contrato.ts le
  aplica al dia explicito; leelo y usa la constante que ya exista en vez de repetir el 28 a mano si se puede
  sin romper el molde hexagonal, y si no, dilo en pendientes).
- Cero permitido: separacion_aviso_dias_previos, prorroga_semanas_maximas, financiamiento_recargo_anual,
  cuota_inicial_minima, mora_dias_gracia, devolucion_dias_reclamo.
Si alguna no encaja con su uso real, decide por el uso y explicalo en el resumen. Cubrelo en
lectura-de-parametros.spec.ts (caso por rango, no uno por clave) y agrega a parametro.spec.ts la prueba de que
PATCH con un valor negativo responde 400.

TAREA B - una lectura de parametro = un SELECT de toda la tabla.
ParametrosDelNegocio.entero/decimal/texto llaman cada una a configuracionVigente(), que hace
repositorio.listarVigentes() (un find sobre la tabla entera, sin filtrar por clave).
ParametrosDeVentaDesdeParametro.paraProyecto envuelve cinco de esas llamadas en un Promise.all: cinco barridos
identicos de la misma tabla para leer cinco filas. Es la forma que la regla 10 del CLAUDE.md llama "N viajes
donde va uno".

Agrega una forma de leer varias claves con UNA sola lectura y usala en paraProyecto. La API existente
(entero/decimal/texto) TIENE QUE SEGUIR FUNCIONANDO IGUAL: otros agentes estan editando ahora mismo archivos
que la llaman (ProrrogarSeparacionCasoUso, AprobarSeparacionCasoUso, SolicitarSeparacionCasoUso,
ListarSeparacionesCasoUso). O sea: cambio aditivo, nada de renombrar ni de cambiar firmas existentes.
No metas cache con estado global entre solicitudes: la vida del snapshot no puede pasar de la operacion que lo
pidio. Si ves otros lugares con dos o mas lecturas seguidas fuera de tus archivos, NO los toques: reportalos.

Cuando termines, entrega el resumen estructurado.`

const P_CONCEPTOS = `${COMUN}

FRENTE 3 de 4: los conceptos de cobro se resuelven con una consulta por codigo.

TUS ARCHIVOS (nadie mas los toca):
- apps/api/src/modulos/empresa/** (todo)
- apps/api/src/modulos/contrato/infraestructura/adaptadores/conceptos-de-cobro.desde-empresa.ts
- apps/api/test/empresa-configuracion.spec.ts

El problema: ConceptosDeCobroDesdeEmpresa.idsPorCodigo hace
Promise.all(distintos.map((codigo) => this.obtenerConcepto.ejecutar(empresaId, codigo))), o sea un findOne por
codigo: dos por contrato hoy (CUOTA_INICIAL y CUOTA_MENSUAL) y uno mas por cada concepto que sume un cronograma
futuro. Es exactamente el patron que la regla 10 del CLAUDE.md prohibe. Ademas, como el adaptador no es un
*.repositorio.typeorm.ts, el chequeo mecanico de arquitectura.spec.ts no lo ve, asi que viaja sin que nadie lo
marque.

Que hacer:
1. Suma al puerto ConceptoCobroRepositorio (apps/api/src/modulos/empresa/dominio/puertos/) y a
   ConceptoCobroRepositorioTypeorm un metodo que resuelva la lista de un viaje, con codigo IN (:...codigos) y
   filtrando empresa_id y eliminado = false.
2. Crea el caso de uso que lo usa en apps/api/src/modulos/empresa/aplicacion/ (un archivo = una accion), que
   devuelva el Map de codigo a id y lance ReglaDeNegocio con el MISMO mensaje que hoy
   (mensajeDeConceptoDeCobroSinConfigurar, de dominio/concepto-de-cobro-configurado.ts, que necesita la razon
   social de la empresa) cuando falte alguno. Si faltan varios, que el mensaje sea util y no arbitrario.
3. Exportalo desde EmpresaModule y deja ConceptosDeCobroDesdeEmpresa con una sola llamada.
4. ObtenerConceptoCobroPorCodigoCasoUso: haz grep antes de tocarlo. Si nadie mas lo usa despues de tu cambio,
   borralo junto con su cableado; si alguien lo usa, dejalo. Di en el resumen cual de las dos cosas paso.
5. Prueba de integracion: que un cronograma con dos conceptos resuelva ambos y que, si a la empresa le falta uno
   configurado, el mensaje sea el de siempre. Si el archivo de prueba que te toca no es el adecuado para eso,
   dilo en pendientes en vez de escribir en un archivo que no es tuyo.

Cuando termines, entrega el resumen estructurado.`

const P_DOMINIO = `${COMUN}

FRENTE 4 de 4: el dominio de contrato reparte mal los centimos y duplica una regla ya compartida.

TUS ARCHIVOS (nadie mas los toca):
- apps/api/src/modulos/contrato/dominio/** (todo, incluidos los .spec.ts)
- apps/web/src/app/funcionalidades/contrato/dominio/dinero.ts

TAREA A - repartirEnPartes puede devolver una cuota de cero o negativa, y eso es un 500.
En apps/api/src/modulos/contrato/dominio/dinero.ts, parteBase se calcula con dividirRedondeando (redondeo al
mas cercano, medio hacia arriba) y la ULTIMA parte se lleva todo el resto: totalCentimos - parteBase*(partes-1).
Cuando el redondeo sube, esa ultima parte se hace chica, cero o negativa, y la unica guarda que hay es
totalCentimos < partes. Caso real que pasa todas las validaciones de negocio:
POST /contratos con modalidadVenta FINANCIADO, precioPactado "10000.50", cuotaInicial "10000.00",
numeroCuotas 42 -> motivosDeContratoIncoherente lo acepta (saldo 50 centimos >= 42 cuotas), el reparto queda
aRepartir = 68 centimos, parteBase = 2, y la ultima cuota vale 68 - 2*41 = -14 centimos. Al insertar,
PostgreSQL rechaza con el CHECK ck_cuota_montos (monto > 0) y el usuario recibe un 500 en vez de un 400.
Con numeroCuotas 6 y un saldo de 10 centimos, la ultima cuota da exactamente 0: mismo final.

Corrigelo: division truncada y el resto repartido de a un centimo entre las primeras partes, de modo que toda
parte sea de al menos un centimo y la suma siga siendo exacta. Antes de elegir el orden del reparto (resto a
las primeras o a las ultimas) LEE dinero.spec.ts y calculo-del-cronograma.spec.ts y respeta lo que el negocio
ya espera; si tienes que cambiar una expectativa existente, explica por que en el resumen. Cubre en el spec los
dos casos de arriba.

TAREA B - la misma funcion vive copiada en el frontend.
apps/web/src/app/funcionalidades/contrato/dominio/dinero.ts es la copia gemela (cambia solo el nombre de la
clase de error) y muestra al asesor el cronograma que va a firmar. Con el bug, la vista previa miente. Aplicale
la MISMA correccion. No toques ningun otro archivo de apps/web: la unificacion de las cuatro copias
(dinero, calculo-del-cronograma, vencimientos-mensuales, coherencia-del-contrato) en packages/contratos esta
pendiente de decision del usuario y no es tuya.

TAREA C - nombreDeLaFicha duplica nombreParaMostrar.
apps/api/src/modulos/contrato/dominio/firmantes-del-contrato.ts define nombreDeLaFicha, que es
nombreParaMostrar (packages/contratos/src/cliente.ts, ya exportado, ya importado por
contrato.repositorio.typeorm.ts y re-exportado por cliente/dominio/identidad-del-cliente.ts) mas un .trim() en
la rama JURIDICA. Dos copias de la regla de como se muestra el nombre segun el tipo de persona significa que el
dia que una persona juridica se nombre distinto, cambia el listado de contratos pero no el titular que se
escribe en contrato_firmante.nombre. Usa el compartido y quedate solo con el .trim() si hace falta. Ajusta
firmantes-del-contrato.spec.ts.

Cuando termines, entrega el resumen estructurado.`

const promptContrato = (loSeparacion) => `${COMUN}

FRENTE 5: modulo contrato (aplicacion, api, persistencia y prueba de integracion).

Corre DESPUES del frente de separacion, que ya termino. Lo que dejo hecho:
${JSON.stringify(loSeparacion?.resumen ?? 'sin resumen')}
Archivos que ese frente toco: ${JSON.stringify(loSeparacion?.archivos ?? [])}
Lo mas importante para ti: la migracion 1788134400000 ya crea "separacion" Y "plantilla_contrato" con la
columna "empresa_id" BIGINT NOT NULL, su FK a empresa y su indice. La entidad Separacion ya hereda de
EntidadEmpresa. La de PlantillaContrato NO: eso es tuyo.

TUS ARCHIVOS (nadie mas los toca):
- apps/api/src/modulos/contrato/aplicacion/** (todo)
- apps/api/src/modulos/contrato/api/** (todo)
- apps/api/src/modulos/contrato/infraestructura/persistencia/** (todo)
- apps/api/src/modulos/contrato/contrato.module.ts
- apps/api/test/contrato.spec.ts
NO toques apps/api/src/modulos/contrato/dominio/**, ni los adaptadores de infraestructura/adaptadores/, ni el
modulo separacion, ni la migracion: son de otros agentes que corrieron en paralelo. Si necesitas un cambio ahi,
reportalo en pendientes.

TAREA A - GET /plantillas-contrato no filtra por empresa.
ListarPlantillasDto.proyectoId es opcional y PlantillaContratoRepositorioTypeorm.listar solo filtra
p.eliminado = false mas los parametros opcionales de la consulta: nunca consulta empresaDelSolicitante(), a
diferencia de ListarContratosCasoUso en el mismo modulo. Un usuario de la empresa 2 con VENTAS_VER pide
GET /plantillas-contrato y recibe los pares proyectoId/archivoId de la empresa 1, que son justo las manijas con
las que se piden los binarios de las plantillas.
Que hacer: PlantillaContrato pasa a extends EntidadEmpresa; RegistrarPlantillaCasoUso fija empresaId desde el
proyecto (ObtenerProyectoCasoUso ya valida el ambito y ProyectoModule lo exporta) y nunca desde el DTO;
FiltroPlantillas gana empresaId y el repositorio lo aplica en SQL; ListarPlantillasCasoUso lo pasa como
empresaDelSolicitante() ?? undefined; y las lecturas por id / buscarVigente quedan acotadas al ambito
respondiendo NoEncontrado (404, nunca 403). Prueba de integracion nueva en contrato.spec.ts: la plantilla de
otra empresa no aparece en el listado y no se obtiene por id.

TAREA B - un PATCH puede anular motivoDiferenciaPrecio y eso es un 500.
motivoDiferenciaPrecio no esta en CAMPOS_QUE_REHACEN_EL_CRONOGRAMA, asi que cambianLosMontos da false y
motivosDeContratoIncoherente no corre. Sobre un contrato sin firmar con precio_pactado 48000.00 y precio_lista
50000.00, PATCH /contratos/7 {"motivoDiferenciaPrecio": null} pasa el @IsOptional() (class-validator ignora
null), llega a copiarCamposSimples, pone la columna en NULL y la escritura viola el CHECK
ck_contrato_venta_motivo_diferencia: QueryFailedError que sale como HTTP 500 en vez de 400. Y mandando "" en
vez de null, el CHECK pasa pero la justificacion que la ley exige queda en blanco.
Que hacer: que el chequeo de coherencia corra tambien cuando el cuerpo trae motivoDiferenciaPrecio, y que un
motivo en blanco o solo con espacios cuente como ausente (mira si esa normalizacion ya vive en
coherencia-del-contrato.ts, que es de otro agente: si hay que cambiarla ahi, reportalo en pendientes y resuelve
lo que puedas de tu lado). Prueba: PATCH con null y PATCH con "" responden 400 y la fila no cambia.

TAREA C - actualizar un contrato escribe en cuatro transacciones sueltas.
ejecutar() llama a rehacerElCronograma (que ya commitea cuotas.reemplazarLasDelCronograma y solo muta el
contrato en memoria), despues a rehacerLosFirmantes, despues a rehacerLasColindancias y recien al final a
contratos.guardar. Con PATCH /contratos/7 {"precioPactado":"60000.00","numeroCuotas":24,"firmantes":[...con un
rol invalido...]} el cronograma nuevo YA quedo escrito cuando motivosDeFirmantesInvalidos lanza DatoInvalido, y
el contrato conserva los montos viejos: GET /contratos/7/cronograma devuelve montosDelContrato (viejos) al lado
de las cuotas nuevas.
Que hacer: reordena para VALIDAR TODO antes de la primera escritura (coherencia del contrato, firmantes y
colindancias) y escribir despues. Eso cierra el modo de fallo real. Si ademas puedes envolver las escrituras en
una sola transaccion sin inventar un unit-of-work entre modulos ni romper el molde hexagonal (mira como
escribirContratoCompleto lo hace en contrato.repositorio.typeorm.ts, que ES tuyo), hazlo; si no se puede
limpio, DEJALO ASI y escribelo en pendientes: no lo tapes. Prueba: el PATCH con firmantes invalidos responde
400 y ni el cronograma ni el contrato cambiaron.

TAREA D - postergar una cuota no mira si el contrato sigue vivo.
PostergarCuotaCasoUso solo resuelve ambito y existencia con soloElContrato; nunca comprueba el estado, a
diferencia de FirmarContratoCasoUso y ActualizarContratoCasoUso. Despues de POST /contratos/7/resolucion (que
deja el contrato RESUELTO y el lote otra vez DISPONIBLE), un POST a
/contratos/7/cronograma/cuotas/31/postergaciones responde 200, reescribe la fecha de vencimiento y agrega una
fila en cuota_postergacion sobre una venta que comercialmente ya no existe.
Que hacer: exige que el contrato este VIGENTE con estaVigente(contrato.estadoContrato) de
dominio/estados-del-contrato.ts y responde Conflicto si no. OJO: NO uses motivoDeContratoNoEditable aqui,
porque ese tambien bloquea los contratos ya firmados y postergar la cuota de un contrato firmado y vigente es
justamente el caso normal. Prueba: postergar sobre un contrato resuelto responde 409 y sobre uno firmado y
vigente sigue respondiendo 200.

TAREA E - generar un contrato deja la separacion CONCRETADA aunque el contrato se caiga.
escribirContratoCompleto commitea el contrato y despues corre los efectos fuera de la transaccion; si algo
falla, darDeBajaElContratoCompleto da de baja contrato, cronograma, cuotas, firmantes y colindancias, pero
nadie revierte la separacion. En GenerarContratoDesdeSeparacionCasoUso los efectos corren en este orden:
separaciones.concretar primero, estadoDelLote.mover despues. Si mover falla (la fila de estado_lote no esta),
la separacion queda CONCRETADA con fechaCierre y motivoCierre puestos, separacionQueSeVaAConcretar la rechaza
para siempre y el lote queda trabado sin separacion ni contrato. El equipo lo tiene documentado como it.failing
en apps/api/test/contrato.spec.ts (busca "Defectos conocidos del modulo").
Que hacer: invierte el orden de los efectos, mover el lote primero y concretar la separacion despues, para que
el fallo documentado deje la separacion intacta. Lee la prueba it.failing y comprueba de verdad que con el
cambio pasa entera (si pasa, conviertela en it normal, porque un it.failing que empieza a pasar hace fallar la
suite). Si queda un caso que sigue sin compensacion (que concretar falle despues de haber movido el lote),
DEJALO ESCRITO en pendientes: la solucion completa es una transaccion que cruza modulos y eso necesita un ADR y
la decision del usuario.

NO TOQUES, esta pendiente de decision del usuario: toda la logica de fechaContrato (que el cronograma se ancle
a la fecha de generacion, que FirmarContratoCasoUso ponga la fecha de firma, y que ActualizarContratoDto
herede fechaContrato y copiarCamposSimples no la asigne). No la arregles ni la borres.

Cuando termines, entrega el resumen estructurado.`

const P_REVISION = `${COMUN}

Eres el revisor. Los cinco frentes ya terminaron de escribir. NO EDITES NINGUN ARCHIVO: tu trabajo es leer y
reportar. Puedes correr git diff, grep, cat y npx tsc --noEmit.

1. Corre "git --no-pager diff --stat" y despues "git --no-pager diff" en ${RAIZ} para ver TODO lo que cambio.
2. Verifica una por una, contra el diff:
   - Regla 6: ni un comentario nuevo en apps/api, apps/web ni packages/contratos. Corre
     "npm run sin-comentarios" desde la raiz y reporta lo que diga.
   - Regla 9: ningun caso de uso nuevo importa algo de @nestjs/common que no sea Injectable o Inject; ninguna
     *Exception en aplicacion/.
   - Regla 8: los chequeos de ambito responden NoEncontrado (404) y no Prohibido; ningun Actualizar*Dto hereda
     una FK de ambito (empresaId, proyectoId, etapaId, ampliacionId, manzanaId).
   - Regla 3: nadie asigna usuarioCreacion, usuarioActualizacion ni fechaActualizacion a mano.
   - Regla 5: ningun delete(); las bajas son eliminado = true con save().
   - Regla 10: ningun find() seguido de length/reduce/Map para contar, ningun Promise.all(...map(...)) que haga
     una consulta por elemento.
   - Molde hexagonal: dominio/ sin @nestjs/*, typeorm ni class-validator; @Entity solo en
     infraestructura/persistencia/; @Controller solo en api/.
   - Todo archivo nuevo de dominio/ tiene su .spec.ts hermano.
   - La migracion 1788134400000: que el DDL de empresa_id en separacion y plantilla_contrato sea coherente con
     lo que declaran las entidades (tipo, nullable, nombre del indice) y que el metodo down() deshaga lo que
     agrega el up().
3. Corre "npx tsc -p apps/api/tsconfig.json --noEmit" y reporta cada error de tipos con archivo y linea.
4. Busca contradicciones ENTRE frentes: dos agentes que hayan resuelto lo mismo distinto, una firma que cambio
   y dejo a otro llamador roto, una prueba que quedo esperando el comportamiento viejo.

Devuelve en "pendientes" cada incumplimiento con ruta y linea, y en "resumen" si el conjunto esta listo para
que el usuario corra "npm run prueba" o no.`

phase('Correcciones')

const resultados = await parallel([
  () =>
    agent(P_SEPARACION, { label: 'separacion + migracion', phase: 'Correcciones', schema: ESQUEMA })
      .then((separacion) =>
        agent(promptContrato(separacion), { label: 'contrato', phase: 'Contrato', schema: ESQUEMA })
          .then((contrato) => ({ separacion, contrato })),
      ),
  () => agent(P_PARAMETROS, { label: 'parametros', phase: 'Correcciones', schema: ESQUEMA }).then((r) => ({ parametros: r })),
  () => agent(P_CONCEPTOS, { label: 'conceptos de cobro', phase: 'Correcciones', schema: ESQUEMA }).then((r) => ({ conceptos: r })),
  () => agent(P_DOMINIO, { label: 'dominio de contrato', phase: 'Correcciones', schema: ESQUEMA }).then((r) => ({ dominio: r })),
])

const entregado = Object.assign({}, ...resultados.filter(Boolean))

log('Frentes terminados. Revisando el diff completo contra las reglas del proyecto.')

phase('Revision')
const revision = await agent(P_REVISION, { label: 'revision del diff', phase: 'Revision', schema: ESQUEMA, effort: 'high' })

return { entregado, revision }
