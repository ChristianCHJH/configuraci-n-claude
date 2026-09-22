export const meta = {
  name: 'auditoria-tablas-e00',
  description: 'Audita a fondo el esquema de BD del sistema inmobiliario (tablas E00 + nuevas) y produce hallazgos verificados con alternativas',
  phases: [
    { title: 'Auditar', detail: '6 dimensiones en paralelo sobre migraciones, entidades, ADRs y el .mdj' },
    { title: 'Verificar', detail: 'refutar adversarialmente cada hallazgo contra el codigo real' },
    { title: 'Completitud', detail: 'que dimension o tabla quedo sin mirar' },
  ],
}

const RAIZ = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const MDJ = 'c:/Users/Christian/Proyectos/inmobiliaria/3-producto/diagramas/modelo-sistema-actual.mdj'

const CONTEXTO = `
PROYECTO: sistema de gestion inmobiliaria. Monorepo en ${RAIZ}

FUENTES DE LA VERDAD DEL ESQUEMA (leelas TODAS antes de opinar):
- Migraciones SQL a mano: ${RAIZ}/apps/api/src/migraciones/*.ts
  (1723600000000-EsquemaInicial, 1786838400000-AutenticacionYAutorizacion,
   1786924800000-SesionesConsultables, 1787011200000-RecuperacionDeContrasena,
   1787097600000-InventarioYPlano)
- Entidades TypeORM: ${RAIZ}/apps/api/src/modulos/*/infraestructura/persistencia/*.entity.ts
- Molde base: ${RAIZ}/apps/api/src/comun/persistencia/entidad-base.ts y entidad-empresa.ts
- Subscribers: ${RAIZ}/apps/api/src/comun/persistencia/auditoria.subscriber.ts y
  ${RAIZ}/apps/api/src/modulos/bitacora/infraestructura/persistencia/bitacora.subscriber.ts
- Reglas del proyecto: ${RAIZ}/CLAUDE.md
- Decisiones: ${RAIZ}/docs/adr/*.md  (ADR-001 a ADR-009)
- Diagrama StarUML (JSON): ${MDJ}

TABLAS DEL SISTEMA ACTUAL (E00, las 11 del diagrama):
empresa, usuario, rol, permiso, rol_permiso, usuario_rol, usuario_permiso,
token_refresco, token_recuperacion, log_sesion, bitacora_auditoria
TABLAS NUEVAS (rama feat/e06, aun sin commitear, migracion InventarioYPlano):
proyecto, etapa, manzana, ampliacion, tipo_unidad, estado_lote, lote,
carga_masiva_lote, carga_masiva_lote_error, plano, plano_version, poligono_lote,
reasociacion_poligono, recarga_plano, recarga_plano_diferencia,
criterio_coloreado_usuario, archivo

ESTANDARES OBLIGATORIOS DEL USUARIO (de su CLAUDE.md global y del proyecto):
- id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY. Nunca SERIAL.
- Columnas de auditoria obligatorias: usuario_creacion NOT NULL, usuario_actualizacion NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TIMESTAMPTZ NULL,
  estado BOOLEAN NOT NULL DEFAULT true, eliminado BOOLEAN NOT NULL DEFAULT false.
  NUNCA copiar creacion en actualizacion al insertar.
- Tablas y columnas en espanol, snake_case, tabla SINGULAR.
- Fechas siempre TIMESTAMPTZ. Dinero numeric(12,2), nunca float.
- Borrado logico siempre; nunca DELETE fisico.
- uuid publico solo cuando el id cruza el limite del sistema; UUID v7, nunca v4; nunca reemplaza al id BIGINT.

REGLA DE SALIDA: sos un auditor de base de datos senior. Cada hallazgo debe ser VERIFICABLE
citando archivo y linea. Nada de "podria ser mejor" sin decir exactamente que linea esta mal
y que se pone en su lugar. Si una tabla esta bien, no inventes hallazgos.
Para cada hallazgo proponi 1 a 3 ALTERNATIVAS reales con su costo (migracion? rompe API? rompe datos existentes?)
y decidi cual recomendas. El usuario decide despues, asi que las alternativas tienen que ser honestas,
incluyendo "dejarlo como esta" cuando sea defendible.
`

const ESQUEMA_HALLAZGOS = {
  type: 'object',
  additionalProperties: false,
  required: ['hallazgos'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'tabla', 'columna', 'titulo', 'problema', 'evidencia', 'gravedad', 'alternativas', 'recomendacion', 'costo'],
        properties: {
          id: { type: 'string', description: 'slug corto unico, ej. uuid-en-varchar' },
          tabla: { type: 'string', description: 'tabla afectada, o "varias" / "diagrama"' },
          columna: { type: 'string', description: 'columna afectada o "-"' },
          titulo: { type: 'string', description: 'una linea, max 80 chars, en espanol' },
          problema: { type: 'string', description: 'que esta mal y por que importa, 1-3 frases, espanol' },
          evidencia: { type: 'string', description: 'archivo:linea exactos que lo demuestran' },
          gravedad: { type: 'string', enum: ['bloqueante', 'alta', 'media', 'baja', 'cosmetico'] },
          alternativas: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['opcion', 'consecuencia'],
              properties: {
                opcion: { type: 'string', description: 'que se hace, concreto (DDL o cambio de codigo)' },
                consecuencia: { type: 'string', description: 'costo real: migracion, datos existentes, API rota, etc' },
              },
            },
          },
          recomendacion: { type: 'string', description: 'cual de las alternativas y por que, 1 frase' },
          costo: { type: 'string', enum: ['trivial', 'una-migracion', 'migracion-y-codigo', 'necesita-adr'] },
        },
      },
    },
  },
}

const ESQUEMA_VEREDICTOS = {
  type: 'object',
  additionalProperties: false,
  required: ['veredictos'],
  properties: {
    veredictos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'real', 'razon'],
        properties: {
          id: { type: 'string' },
          real: { type: 'boolean', description: 'true solo si lo confirmaste abriendo el archivo' },
          razon: { type: 'string', description: 'por que es real o por que es falso, citando archivo:linea' },
          correccion: { type: 'string', description: 'si el hallazgo es real pero esta mal descrito o la alternativa es mala, la version corregida. Vacio si esta bien.' },
        },
      },
    },
  },
}

const DIMENSIONES = [
  {
    clave: 'tipos',
    prompt: `${CONTEXTO}

TU DIMENSION: TIPOS DE DATOS Y DOMINIOS.

Reventa columna por columna, en las 11 tablas de E00 Y en las 17 tablas nuevas, si el tipo elegido
es el correcto en PostgreSQL 16. Buscas especificamente:
- Cualquier valor que sea un UUID guardado como VARCHAR/TEXT en lugar de UUID nativo (el usuario
  detecto uno y quiere que se revise TODO). Revisa entidades Y migraciones Y el .mdj por separado:
  puede estar bien en la migracion y mal en la entidad, o al reves.
- Fechas que no sean TIMESTAMPTZ.
- IP guardada como VARCHAR en vez de INET, y si el criterio es consistente entre tablas.
- JSON guardado como TEXT en vez de JSONB.
- Dinero/area/superficie/coordenadas: numeric con precision explicita vs float/double/real.
  Areas y perimetros de lotes, precios, porcentajes: revisa uno por uno.
- Enums de negocio guardados como VARCHAR sin CHECK ni tabla catalogo (ej. log_sesion.tipo,
  bitacora_auditoria.accion, estados de carga masiva).
- Longitudes de VARCHAR que no aguanten el dato real (hash SHA-256 = 64 hex, bcrypt = 60,
  correo, user_agent, RUC = 11, nombres).
- SMALLINT/INTEGER/BIGINT mal elegidos.
- Coordenadas de poligonos: como se guardan y si el tipo aguanta la precision.

Para CADA columna con tipo dudoso deci el tipo actual, el tipo correcto y si cambiarlo rompe datos.`,
  },
  {
    clave: 'integridad',
    prompt: `${CONTEXTO}

TU DIMENSION: INTEGRIDAD REFERENCIAL Y RESTRICCIONES.

Revisa en las migraciones SQL, tabla por tabla:
- Toda FK logica tiene su CONSTRAINT real? Busca columnas que terminan en _id sin FOREIGN KEY.
  (Sospechosos conocidos: bitacora_auditoria.empresa_id, bitacora_auditoria.trace_id, usuario.empresa_id.)
- ON DELETE / ON UPDATE: ninguna FK los declara? Que pasa por defecto (NO ACTION) y donde eso
  es un problema real dado que el sistema usa borrado logico.
- UNIQUE: cual es simple, cual compuesto, cual parcial (WHERE eliminado = false), cual falta.
  Verifica si los indices unicos de rol_permiso, usuario_rol, usuario_permiso REALMENTE llevan
  el WHERE eliminado = false o no.
- CHECK constraints ausentes donde hay un invariante obvio (RUC 11 digitos, correo con @,
  intentos_fallidos >= 0, expira_en > fecha_creacion, areas > 0, rangos de fechas, enums).
- NOT NULL faltantes o de mas.
- DEFAULT faltantes o peligrosos.
- La fila semilla usuario id=1 'sistema' con OVERRIDING SYSTEM VALUE y el RESTART WITH 2:
  es solido? que pasa si alguien la borra logicamente o si dos migraciones corren dos veces?
- Ciclo de FKs: usuario.usuario_creacion referencia usuario. Como se inserta el primer usuario?
- Unicidad de correo: el indice unico de usuario.correo NO filtra eliminado. Si se da de baja
  logica a un usuario, se puede reusar su correo? Es lo que se quiere?`,
  },
  {
    clave: 'indices',
    prompt: `${CONTEXTO}

TU DIMENSION: INDICES, RENDIMIENTO Y CRECIMIENTO DE DATOS.

- Lista TODOS los indices que crean las migraciones y cruza cada uno contra las consultas reales
  que hace el codigo (busca en ${RAIZ}/apps/api/src/modulos/*/infraestructura/persistencia/*.repositorio*.ts
  y en los casos de uso: where, order by, join).
- Indices FALTANTES: toda consulta que filtra u ordena por una columna sin indice. Presta atencion a
  ordenar por fecha_creacion, filtrar por eliminado, buscar por correo, por jti, por expira_en,
  por empresa_id, por lote/plano/proyecto.
- Indices REDUNDANTES: un indice simple que ya es prefijo de uno compuesto.
- Indices que deberian ser PARCIALES (WHERE eliminado = false) y no lo son: en un sistema con
  borrado logico donde toda consulta filtra eliminado = false, un indice completo es peso muerto.
- Tablas que crecen sin techo y sin plan de purga ni particion: bitacora_auditoria, log_sesion,
  token_refresco, token_recuperacion. Hay job de limpieza en el codigo? Si no, cuanto crecen.
- El indice idx_bitacora_fecha DESC y el patron de consulta real del controller de bitacora.
- JSONB valor_anterior/valor_nuevo: se consultan por dentro? necesitan GIN?`,
  },
  {
    clave: 'reglas',
    prompt: `${CONTEXTO}

TU DIMENSION: CUMPLIMIENTO DE LAS REGLAS ESCRITAS DEL PROPIO PROYECTO.

Lee ${RAIZ}/CLAUDE.md COMPLETO y TODOS los ADR de ${RAIZ}/docs/adr/. Despues verifica tabla por tabla:
- Regla 2: toda entidad hereda de EntidadBase o EntidadEmpresa. Quien no hereda y por que.
  Quien declara empresa_id A MANO pudiendo heredar EntidadEmpresa (sospechoso: usuario).
  Quien deberia ser EntidadEmpresa y es EntidadBase (multiempresa: proyecto, lote, plano...).
- Regla 3: nadie asigna columnas de auditoria a mano. Busca usuarioCreacion: en servicios/casos de uso.
- Regla 5: nunca delete(). Busca .delete( y .remove( y .softDelete( en apps/api/src.
- Convencion de nombres: tabla singular en espanol snake_case. Alguna en plural o en ingles?
  Revisa tambien las tablas nuevas (carga_masiva_lote_error, recarga_plano_diferencia...).
- ADR-005: uuid publico solo v7, nunca reemplaza el BIGINT. Quien tiene uuid y no deberia,
  quien deberia tenerlo y no lo tiene (entidades que cruzan el limite: archivo? plano? lote?).
- La excepcion declarada de bitacora_auditoria (no hereda EntidadBase): esta realmente declarada
  en apps/api/test/arquitectura.spec.ts? Hay otras tablas que de hecho deberian ser la misma
  excepcion y no lo son (append-only: log_sesion, carga_masiva_lote_error, recarga_plano_diferencia)?
- Coherencia interna: dos tablas que resuelven lo mismo de dos formas distintas.`,
  },
  {
    clave: 'seguridad',
    prompt: `${CONTEXTO}

TU DIMENSION: DISENO DE AUTENTICACION, SESIONES Y AUDITORIA.

Lee ADR-006 (roles y permisos), ADR-007 (usuarios y sesiones), ADR-009 (recuperacion por correo)
y el codigo de ${RAIZ}/apps/api/src/modulos/autenticacion/ y /usuario/ completo.

Punto CENTRAL que el usuario quiere resuelto:
usuario.intentos_fallidos y usuario.bloqueado_hasta viven en la tabla usuario, que esta marcada
@Auditable. Cada login fallido hace save() sobre usuario, el BitacoraSubscriber escribe una fila en
bitacora_auditoria, y la bitacora se infla 1:1 con los intentos de fuerza bruta, ademas de castigar
con UPDATEs la tabla mas caliente del sistema. El usuario pregunta explicitamente si hay una
alternativa MEJOR. Evalua al menos estas y compara honestamente:
  (a) dejarlo donde esta y solo excluir esos dos campos del BitacoraSubscriber
  (b) tabla aparte intento_acceso / bloqueo_acceso, append-only, con su politica de purga
  (c) derivarlo por consulta desde log_sesion (que ya registra el evento FALLO) sin columnas de estado
  (d) contador fuera de PostgreSQL (Redis / memoria) con TTL
  (e) rate limit por IP+correo antes de tocar la BD
Para cada una: que pasa con el conteo si el proceso reinicia, si hay varias instancias de la API,
si el atacante rota IPs, si el correo no existe (enumeracion de usuarios), y que cuesta implementarla.

Ademas revisa:
- token_refresco: rotacion (reemplazado_por_jti), deteccion de reuso de token robado, revocacion
  masiva al cambiar contrasena, y si eliminado=true alcanza como revocacion.
- token_recuperacion: un solo uso (usado_en), ventana de rate limit, que pasa con los tokens viejos
  al usar uno, enumeracion de correos en la respuesta.
- usuario.contrasena: select:false, longitud, algoritmo, y si el hash puede filtrarse por la bitacora
  o por algun endpoint.
- bitacora_auditoria: usuario_id NOT NULL con usuario sistema=1 como fallback, ip INET, trace_id.
  Se puede alterar o borrar? Es realmente append-only a nivel BD (permisos, triggers)?
- usuario_permiso vs rol_permiso: hay forma de NEGAR un permiso o solo de conceder? Es un hoyo?
- log_sesion.tipo: los valores del enum y si registra todo lo que deberia.`,
  },
  {
    clave: 'diagrama',
    prompt: `${CONTEXTO}

TU DIMENSION: FIDELIDAD DEL DIAGRAMA StarUML CONTRA LA BASE DE DATOS REAL.

El archivo ${MDJ} es JSON. Parsealo con node y compara CADA entidad y CADA columna contra las
migraciones SQL reales. El objetivo final del usuario es que el diagrama quede IGUAL a lo que
realmente existe en la BD, asi que necesito la lista exhaustiva de diferencias.

Reporta como hallazgo cada divergencia:
- Tipo distinto en el diagrama vs en la migracion (ej. VARCHAR en el diagrama donde la BD tiene UUID,
  TIMESTAMP donde tiene TIMESTAMPTZ, TEXT donde tiene JSONB, VARCHAR donde tiene INET).
  Enumera TODAS, una por una, con nombre de tabla y columna.
- Flags mal puestos: unique marcado en columna cuando el indice real es compuesto y/o parcial;
  foreignKey marcado cuando NO existe la constraint en la migracion; nullable que no coincide.
- Cardinalidades que no coinciden con el NOT NULL real de la FK (ej. [1] cuando la FK es nullable).
- Columnas que existen en la BD y faltan en el diagrama (incluyendo las 6 de auditoria de EntidadBase
  y las FK usuario_creacion / usuario_actualizacion), y columnas del diagrama que no existen en la BD.
- Relaciones que existen en la BD y faltan dibujadas, y relaciones dibujadas que no existen.
- Entidades faltantes o sobrantes respecto de las 11 tablas de E00.

Ademas, deci en concreto QUE se puede representar en StarUML ERD y que no: el campo type de
ERDColumn acepta texto libre? hay forma de representar un indice compuesto parcial? donde conviene
que viva esa informacion (documentation de la entidad, tags, una nota UMLTextView)?
Investiga la estructura real del JSON antes de afirmarlo.`,
  },
]

phase('Auditar')
log('Auditando 28 tablas en 6 dimensiones contra migraciones, entidades, ADRs y el .mdj')

const porDimension = await pipeline(
  DIMENSIONES,
  (d) => agent(d.prompt, { label: `auditar:${d.clave}`, phase: 'Auditar', schema: ESQUEMA_HALLAZGOS, effort: 'high' }),
  (resultado, d) => {
    if (!resultado || !resultado.hallazgos || resultado.hallazgos.length === 0) return { clave: d.clave, hallazgos: [] }
    const lista = resultado.hallazgos
      .map((h) => `[${h.id}] tabla=${h.tabla} col=${h.columna} grav=${h.gravedad}\n  PROBLEMA: ${h.problema}\n  EVIDENCIA: ${h.evidencia}\n  RECOMIENDA: ${h.recomendacion}`)
      .join('\n\n')
    return agent(
      `${CONTEXTO}

Sos un verificador ADVERSARIAL. Otro auditor produjo estos hallazgos sobre la dimension "${d.clave}".
Tu trabajo es REFUTARLOS abriendo los archivos. Por defecto asumi que el hallazgo es FALSO hasta que
lo confirmes con tus propios ojos en el archivo citado.

Marca real=false si:
- la evidencia citada no dice lo que el auditor afirma
- el problema ya esta resuelto en otro archivo (otra migracion posterior, un indice que si existe,
  una constraint que si esta, un guard en el codigo)
- es una opinion de estilo sin consecuencia real
- la tabla o columna no existe

Marca real=true SOLO si abriste el archivo y confirmaste. Si es real pero esta mal descrito, o la
recomendacion es peor que la alternativa obvia, escribi la version corregida en el campo correccion.

HALLAZGOS A REFUTAR:

${lista}`,
      { label: `refutar:${d.clave}`, phase: 'Verificar', schema: ESQUEMA_VEREDICTOS, effort: 'high' },
    ).then((v) => ({ clave: d.clave, hallazgos: resultado.hallazgos, veredictos: v ? v.veredictos : [] }))
  },
)

const vivos = []
const descartados = []
for (const bloque of porDimension.filter(Boolean)) {
  const porId = {}
  for (const v of bloque.veredictos || []) porId[v.id] = v
  for (const h of bloque.hallazgos || []) {
    const v = porId[h.id]
    if (v && v.real === false) {
      descartados.push({ ...h, dimension: bloque.clave, razonDescarte: v.razon })
    } else {
      vivos.push({ ...h, dimension: bloque.clave, correccionVerificador: v && v.correccion ? v.correccion : '' })
    }
  }
}

log(`${vivos.length} hallazgos confirmados, ${descartados.length} refutados`)

phase('Completitud')
const resumenVivos = vivos
  .map((h) => `- [${h.dimension}/${h.id}] ${h.tabla}.${h.columna}: ${h.titulo}`)
  .join('\n')

const faltante = await agent(
  `${CONTEXTO}

Una auditoria de 6 dimensiones (tipos, integridad, indices, reglas del proyecto, seguridad de
autenticacion, fidelidad del diagrama) produjo estos hallazgos confirmados:

${resumenVivos || '(ninguno)'}

TU TRABAJO: encontrar lo que se les ESCAPO. Abri las migraciones y las entidades vos mismo y busca
problemas de esquema que NO esten en la lista de arriba. Pensa en:
- tablas que nadie reviso (las 17 nuevas de inventario y plano suelen quedar fuera)
- normalizacion: datos duplicados entre tablas, columnas calculables, tablas que deberian fusionarse
  o separarse, catalogos que deberian ser tabla y son varchar
- concurrencia: condiciones de carrera al insertar, falta de version/optimistic locking, secuencias
- zona horaria y locale, collation de los indices de texto
- tamano de fila y TOAST en las tablas con JSONB o texto largo
- que pasa al restaurar un backup: hay algo dependiente del reloj o de ids fijos
- la coherencia entre packages/contratos y las columnas reales
Solo reporta lo que confirmes abriendo un archivo. Si de verdad no falta nada, devolve lista vacia.`,
  { label: 'completitud', phase: 'Completitud', schema: ESQUEMA_HALLAZGOS, effort: 'high' },
)

const extras = (faltante && faltante.hallazgos ? faltante.hallazgos : []).map((h) => ({ ...h, dimension: 'completitud', correccionVerificador: '' }))

return {
  confirmados: [...vivos, ...extras],
  refutados: descartados.map((d) => ({ id: d.id, titulo: d.titulo, razon: d.razonDescarte })),
  conteo: { confirmados: vivos.length + extras.length, refutados: descartados.length },
}
