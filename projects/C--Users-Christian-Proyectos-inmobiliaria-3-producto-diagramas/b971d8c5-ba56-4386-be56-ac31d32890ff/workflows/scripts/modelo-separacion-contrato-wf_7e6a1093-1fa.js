export const meta = {
  name: 'modelo-separacion-contrato',
  description: 'Disena el modelo de datos minimo de separacion, contrato y cronograma para la inmobiliaria BLP',
  phases: [
    { title: 'Leer', detail: 'historias, PRD y esquema real en paralelo' },
    { title: 'Disenar', detail: 'modelo minimo tabla por tabla' },
    { title: 'Verificar', detail: 'lentes adversariales: falta / sobra / integridad' },
    { title: 'Cerrar', detail: 'sintesis final del modelo' },
  ],
}

const DOCS = 'c:/Users/Christian/Proyectos/inmobiliaria'
const SIS = 'c:/Users/Christian/Proyectos/inmobiliaria-sistema'
const SCRATCH = 'C:/Users/Christian/AppData/Local/Temp/claude/c--Users-Christian-Proyectos-inmobiliaria/21fe4051-9989-499c-91ea-6ae8c25cfa8b/scratchpad'

const COMUN = `
CONTEXTO DEL PROYECTO
Sistema inmobiliario (venta de lotes) para la empresa BLP, Peru. Dos repositorios:
- Documentacion y producto: ${DOCS}
- Codigo del sistema (NestJS + TypeORM + PostgreSQL + Angular): ${SIS}

REGLAS DE MODELADO OBLIGATORIAS DEL PROYECTO (no las discutas, aplicalas):
- PostgreSQL. PK siempre: id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY. Nunca SERIAL.
- Toda tabla lleva SIEMPRE estas 6 columnas de auditoria y NO hay que listarlas nunca en tu salida
  (se dan por hechas): usuario_creacion BIGINT NOT NULL, usuario_actualizacion BIGINT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TIMESTAMPTZ NULL,
  estado BOOLEAN NOT NULL DEFAULT true, eliminado BOOLEAN NOT NULL DEFAULT false.
- Nombres en espanol, snake_case, tablas en SINGULAR.
- Soft delete: nunca borrado fisico.

MATERIAL YA EXTRAIDO PARA TI:
- ${SCRATCH}/maestro-banda-venta.md  -> las 29 entidades del modelo maestro (modelo-entidad-relacion-entrega-1.mdj)
  con TODAS sus columnas, tipos, FKs y documentacion. Es un DRAFT amplio, tiene columnas de mas.
- ${SCRATCH}/maestro-banda-relaciones.md -> las 47 relaciones entre esas entidades.

EL ENCARGO DEL USUARIO, TEXTUAL: "generame el modelo de la base de datos, quiero ver que tablas crearas?
no exageres con campos innecesarios, revisa que tablas nos faltan o que columnas".
O sea: modelo MINIMO Y SUFICIENTE. Cada columna que propongas debe poder justificarse con una regla de
negocio escrita en las historias o el PRD. Si una columna del maestro no la exige ninguna regla, se RECORTA.
`

const LECTORES = [
  {
    key: 'separacion',
    label: 'leer:separacion',
    prompt: `${COMUN}

TU TAREA: eres el lector de la SEPARACION (la reserva del lote con un monto y una fecha de vigencia).

Lee con cuidado:
- ${DOCS}/3-producto/historias/E04-ventas.md  (completo)
- ${DOCS}/3-producto/alcance-negocio.md  (busca separacion, vigencia, prorroga, plazo, monto, constancia)
- ${DOCS}/3-producto/PRD.md (lo relativo a separacion)
- ${SCRATCH}/maestro-banda-venta.md (secciones separacion, separacion_prorroga, constancia_separacion)

Extrae TODAS las reglas de negocio de la separacion: quien la crea, con que monto, cuantos dias dura,
como se prorroga y cuanto cuesta la prorroga, cual es el tope de prorrogas, que pasa al vencer,
que estados tiene, si necesita aprobacion de alguien, si existe la separacion excepcional, que documento
(constancia) se emite, en que moneda, como se relaciona con el lote y con el cliente.

Cita SIEMPRE el identificador de la regla o historia (RN-###, E04-##, P##, RF-###) de donde sale cada cosa.
Si una regla del maestro NO aparece en ninguna historia, dilo explicitamente: es candidata a recorte.

Devuelve las tablas que la separacion necesita con su lista de columnas MINIMA (sin las 6 de auditoria),
cada columna con tipo PostgreSQL, nulabilidad, y la regla que la justifica.`,
  },
  {
    key: 'contrato',
    label: 'leer:contrato',
    prompt: `${COMUN}

TU TAREA: eres el lector del CONTRATO DE VENTA (lo que se firma cuando la separacion se concreta).

Lee con cuidado:
- ${DOCS}/3-producto/historias/E04-ventas.md (completo)
- ${DOCS}/3-producto/alcance-negocio.md (contrato, firmantes, copropietarios, colindancias, minuta)
- ${DOCS}/3-producto/PRD.md
- ${DOCS}/4-plan/estado-de-construccion-detalle.md (punto 4.6)
- ${SCRATCH}/maestro-banda-venta.md (contrato_venta, contrato_firmante, contrato_colindancia,
  plantilla_contrato, plantilla_condicion_financiamiento, colindancia_lote, documento_generado)

Extrae TODAS las reglas: que datos lleva el contrato, quienes son los firmantes y de donde salen
(OJO: ADR-023 decidio que los firmantes son de la OPERACION, no de la persona: ya no hay tabla
copropietario, van en contrato_firmante), por que las colindancias se CONGELAN en el contrato en vez
de leerse del lote, si hay plantilla de documento, que estados tiene el contrato, como se numera,
que pasa si se resuelve.

Cita SIEMPRE el identificador (RN-###, E04-##, P##, ADR-###).
Marca lo que NO tiene respaldo en las historias como candidato a recorte.

Devuelve tablas + columnas MINIMAS (sin auditoria), con tipo PostgreSQL, nulabilidad y regla que la justifica.`,
  },
  {
    key: 'cronograma',
    label: 'leer:cronograma-cuotas',
    prompt: `${COMUN}

TU TAREA: eres el lector del CRONOGRAMA DE CUOTAS (el plan de pagos que el contrato genera automaticamente).

Lee con cuidado:
- ${DOCS}/3-producto/historias/E04-ventas.md
- ${DOCS}/3-producto/historias/E05-cobranzas.md (completo: aqui vive el pago que imputa contra la cuota)
- ${DOCS}/3-producto/alcance-negocio.md (cronograma, cuota, inicial, financiamiento, mora, moneda, tipo de cambio)
- ${SCRATCH}/maestro-banda-venta.md (cronograma, cuota, moneda, tipo_cambio, precio_lote, lista_precio)

Extrae TODAS las reglas: como se calcula el cronograma (cuota inicial, saldo, numero de cuotas, tasa,
periodicidad), en que moneda va y como interviene el tipo de cambio, que estados tiene una cuota,
como se marca pagada, que columnas necesita para que despues la mora y la imputacion de pagos funcionen,
si el cronograma se puede regenerar o refinanciar, si se imprime con QR de cuenta bancaria (paso P46).

IMPORTANTE: distingue lo que es del CRONOGRAMA (semana 5 / entrega 1) de lo que es de COBRANZAS
(pago, voucher, mora) que es un modulo posterior. No metas columnas de cobranza dentro de cuota
salvo las imprescindibles para que la cuota sepa cuanto lleva pagado.

Cita SIEMPRE el identificador (RN-###, E04-##, E05-##, P##, RF-###).

Devuelve tablas + columnas MINIMAS (sin auditoria), con tipo PostgreSQL, nulabilidad y regla que la justifica.`,
  },
  {
    key: 'prerequisitos',
    label: 'leer:precio-parametro-estados',
    prompt: `${COMUN}

TU TAREA: eres el lector de los TRES PRERREQUISITOS que hoy no existen y que separacion y contrato necesitan:
(1) el PRECIO del lote, (2) la tabla PARAMETRO de valores del negocio, (3) el HISTORIAL DE ESTADO del lote.

Lee con cuidado:
- ${DOCS}/3-producto/historias/E02-proyectos-lotes.md
- ${DOCS}/3-producto/historias/E04-ventas.md
- ${DOCS}/3-producto/alcance-negocio.md (precio, lista de precios, recargo, parametro, estado del lote, transicion)
- ${DOCS}/4-plan/estado-de-construccion-detalle.md (puntos 2.10, 2.11, 2.13)
- ${DOCS}/4-plan/estado-de-construccion.md (seccion 5, los huecos sin asignar)
- ${SCRATCH}/maestro-banda-venta.md (precio_lote, lista_precio, recargo_ubicacion,
  autorizacion_precio_excepcion, parametro, proyecto_parametro_venta, lote_estado_historial,
  transicion_estado_lote, estado_lote, bloqueo_lote)

Responde con precision:
- PRECIO: se necesita lista_precio ademas de precio_lote, o alcanza con precio_lote? Que reglas
  exige la historia (precio por m2, precio total, vigencia del precio, recargo por ubicacion,
  autorizacion de excepcion de precio)? Cuales son de la semana 5 y cuales pueden esperar?
- PARAMETRO: cuales son EXACTAMENTE los valores del negocio que hoy no tienen donde vivir
  (los 7 dias de vigencia, los S/ 300 de prorroga, el tope de 3 semanas, etc)? Enumeralos todos con
  su valor y la regla que los fija. La tabla parametro debe ser global o por proyecto o por empresa?
  Hace falta proyecto_parametro_venta ademas?
- ESTADOS: cuales son los estados del lote y sus transiciones legales? lote_estado_historial y
  transicion_estado_lote son ambas necesarias o una alcanza?

Cita SIEMPRE el identificador (RN-###, E02-##, E04-##, P##, ADR-###).

Devuelve tablas + columnas MINIMAS (sin auditoria), con tipo PostgreSQL, nulabilidad y regla que la justifica.`,
  },
  {
    key: 'esquema-real',
    label: 'leer:esquema-real',
    prompt: `${COMUN}

TU TAREA: eres el lector del CODIGO REAL. Nadie va a disenar nada nuevo sin saber que hay hoy en la base.

Trabaja sobre el repositorio ${SIS}, rama main (usa git show main:<ruta> o revisa el working tree,
pero verifica que estas leyendo main; la rama activa puede ser otra).

Inventaria:
1. Las 18 migraciones en apps/api/src/migraciones/ : lista cada TABLA creada y sus columnas reales.
   Interesan especialmente: lote, cliente, proyecto, manzana, etapa, empresa, tipo_documento,
   documento_cliente, archivo, usuario, poligono_lote, plano_version, cuenta_bancaria,
   concepto_cobro, serie_comprobante, y cualquier tabla de estado del lote.
2. Las CONVENCIONES reales que sigue el codigo: como se declaran los tipos (numeric? decimal?),
   como se nombran los indices y las constraints, como se nombran las FKs (fk_tabla_referencia?),
   si usan uuid_generar_v7(), si hay CHECKs, si los indices unicos son parciales
   (WHERE eliminado = false), como se llaman los enums o si usan VARCHAR con CHECK.
   Da ejemplos textuales de una migracion.
3. Que columnas del LOTE existen hoy exactamente, y confirma si el lote tiene o no columna de precio,
   de estado, y la FK a cliente.
4. Si ya existe cualquier vestigio (entidad, enum, constante, permiso) de separacion, contrato,
   cronograma o cuota. Busca por texto en todo el repo.
5. El vocabulario de permisos existente (los codigos tipo CLIENTES_GESTIONAR): lista los que hay.

Se literal y concreto: nombre de archivo y nombre de tabla/columna. No resumas de memoria, LEE.`,
  },
]

phase('Leer')
const lecturas = await parallel(
  LECTORES.map((l) => () => agent(l.prompt, { label: l.label, phase: 'Leer' }))
)

const contexto = LECTORES.map((l, i) => `\n\n===== INFORME ${l.key.toUpperCase()} =====\n${lecturas[i] || '(sin resultado)'}`).join('')

log('Cinco lecturas listas. Disenando el modelo minimo.')

phase('Disenar')
const MODELO_SCHEMA = {
  type: 'object',
  properties: {
    tablas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          proposito: { type: 'string', description: 'una linea, para que sirve' },
          momento: { type: 'string', description: 'SEMANA5 si entra en la muestra del 9 de setiembre, ENTREGA1 si entra el 2 de octubre, DESPUES si es posterior' },
          existe_hoy: { type: 'boolean', description: 'true si la tabla ya esta creada en alguna migracion de main' },
          columnas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                tipo: { type: 'string', description: 'tipo PostgreSQL exacto, ej NUMERIC(12,2), VARCHAR(20), DATE, TIMESTAMPTZ, BIGINT, BOOLEAN, TEXT' },
                nulable: { type: 'boolean' },
                llave: { type: 'string', description: 'PK, FK->tabla.columna, UQ, o vacio' },
                justificacion: { type: 'string', description: 'la regla concreta que la exige, con su identificador RN/E##/P##' },
              },
              required: ['nombre', 'tipo', 'nulable', 'justificacion'],
            },
          },
          reglas: { type: 'array', items: { type: 'string' }, description: 'CHECKs, indices unicos parciales y reglas de integridad de esta tabla' },
        },
        required: ['nombre', 'proposito', 'momento', 'existe_hoy', 'columnas'],
      },
    },
    recortes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          que: { type: 'string', description: 'tabla o tabla.columna del maestro que se recorta' },
          por_que: { type: 'string' },
        },
        required: ['que', 'por_que'],
      },
    },
    columnas_faltantes_en_tablas_existentes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tabla: { type: 'string' },
          columna: { type: 'string' },
          tipo: { type: 'string' },
          por_que: { type: 'string' },
        },
        required: ['tabla', 'columna', 'tipo', 'por_que'],
      },
    },
    orden_de_migraciones: { type: 'array', items: { type: 'string' }, description: 'orden en que hay que crear las tablas para que las FK cierren' },
  },
  required: ['tablas', 'recortes', 'columnas_faltantes_en_tablas_existentes', 'orden_de_migraciones'],
}

const modelo = await agent(
  `${COMUN}

Tienes los cinco informes de lectura abajo. Tu tarea: DISENAR EL MODELO DE DATOS MINIMO Y SUFICIENTE
de la banda separacion -> contrato -> cronograma, incluyendo sus prerrequisitos.

CRITERIOS, en orden de importancia:
1. MINIMO. El usuario dijo textualmente "no exageres con campos innecesarios". Si una columna del
   maestro no la exige una regla escrita, RECORTALA y anotala en "recortes" con el motivo.
   El maestro es un DRAFT de 151 tablas pensado para todo el sistema; aqui va lo de esta banda.
2. SUFICIENTE. Si una regla de negocio no tiene donde guardarse, falta una columna. No dejes reglas
   sin soporte. Especial cuidado con: monto y vigencia de la separacion, prorrogas y su tope,
   precio del lote, congelamiento de colindancias, generacion del cronograma, saldo de la cuota.
3. COHERENTE CON EL CODIGO REAL. Usa los mismos tipos, nombres y convenciones que ya usan las
   18 migraciones de main segun el informe esquema-real. No inventes un estilo nuevo.
4. NO LISTES las 6 columnas de auditoria: se dan por hechas en toda tabla.
5. Marca "momento": SEMANA5 lo que la proforma promete para la vista previa del 9 de setiembre
   (separacion con monto y fecha de vigencia; contrato y cronograma de cuotas automatico), ENTREGA1
   lo del 2 de octubre, DESPUES el resto. Si algo es DESPUES, mejor no lo incluyas como tabla:
   ponlo en recortes.
6. Cada FK debe apuntar a una tabla que exista o que este en tu propia lista, y el
   orden_de_migraciones debe respetarlo.

Devuelve el modelo estructurado.
${contexto}`,
  { label: 'disenar:modelo', phase: 'Disenar', schema: MODELO_SCHEMA, effort: 'high' }
)

log(`Modelo borrador: ${modelo && modelo.tablas ? modelo.tablas.length : 0} tablas, ${modelo && modelo.recortes ? modelo.recortes.length : 0} recortes.`)

phase('Verificar')
const LENTES = [
  {
    key: 'falta',
    prompt: `Eres un verificador ADVERSARIAL con la lente FALTA ALGO.
Recorre las reglas de negocio de los informes una por una y busca reglas que el modelo propuesto
NO PUEDE cumplir porque le falta una tabla o una columna donde guardar el dato.
Ejemplos del tipo de hueco que buscas: no hay donde guardar cuantas prorrogas lleva una separacion;
no hay donde guardar el tipo de cambio con el que se congelo un monto; la cuota no sabe cuanto lleva
pagado; el contrato no puede saber quien lo firmo; no hay donde vivir un valor parametrizado que la
regla dice que es configurable.
Se concreto: cada hallazgo = la regla con su identificador + el dato que no tiene donde vivir + la
columna o tabla que lo arreglaria. Si no encuentras huecos reales, dilo; no inventes.`,
  },
  {
    key: 'sobra',
    prompt: `Eres un verificador ADVERSARIAL con la lente SOBRA ALGO.
El usuario pidio explicitamente "no exageres con campos innecesarios". Recorre CADA columna y CADA
tabla del modelo propuesto y ataca las que no se sostienen: columnas cuya justificacion no cita
ninguna regla real, columnas derivables de otras (un total que se puede sumar, un saldo que es
resta de dos columnas que ya estan), tablas que podrian ser una columna, catalogos que no aportan,
columnas duplicadas entre tablas, y cualquier cosa que sea de un modulo posterior colada aqui.
Se concreto: cada hallazgo = tabla.columna + por que sobra + que se pierde si se borra.
Si una columna te parece dudosa pero defendible, dilo como dudosa, no como sobrante.`,
  },
  {
    key: 'integridad',
    prompt: `Eres un verificador ADVERSARIAL con la lente INTEGRIDAD Y CONVENCIONES.
Ataca el modelo por el lado tecnico:
- FKs que apuntan a tablas que no existen ni en main ni en la lista propuesta.
- orden_de_migraciones que rompe una dependencia.
- Tipos mal elegidos: dinero que no es NUMERIC con escala, fechas que deberian ser DATE y no
  TIMESTAMPTZ (o al reves), longitudes de VARCHAR arbitrarias.
- Violaciones de las reglas obligatorias del proyecto: PK que no es BIGINT IDENTITY, tabla en plural,
  nombre en ingles, alguien listando las 6 columnas de auditoria, borrado fisico.
- Indices unicos que deberian ser PARCIALES (WHERE eliminado = false) y no lo son: es un hallazgo
  conocido del proyecto, un unique global rompe el alta despues de una baja logica.
- CHECKs que faltan para estados o montos.
- Incoherencias con las convenciones reales que reporto el informe esquema-real.
Se concreto: cada hallazgo = donde + que esta mal + el arreglo exacto.`,
  },
]

const veredictos = await parallel(
  LENTES.map((l) => () =>
    agent(
      `${COMUN}

${l.prompt}

===== MODELO PROPUESTO =====
${JSON.stringify(modelo, null, 1)}

===== INFORMES DE LECTURA (la fuente de verdad) =====
${contexto}`,
      { label: `verificar:${l.key}`, phase: 'Verificar', effort: 'high' }
    )
  )
)

phase('Cerrar')
const final = await agent(
  `${COMUN}

Eres el arquitecto que cierra. Tienes el modelo borrador y tres verificaciones adversariales
(falta / sobra / integridad). Produce el MODELO FINAL corregido.

Instrucciones:
- Acepta los hallazgos de los verificadores que sean correctos; RECHAZA por escrito los que no lo sean,
  con una linea de motivo. No aceptes un hallazgo solo por venir de un verificador.
- El resultado tiene que quedar minimo y suficiente.
- Devuelve el modelo estructurado final, con la misma forma que el borrador.
- En "recortes" acumula tambien lo que quitaste por el verificador SOBRA.
- Ademas, al final del campo proposito de cada tabla, no metas prosa larga: una linea.

===== MODELO BORRADOR =====
${JSON.stringify(modelo, null, 1)}

===== VERIFICACION: FALTA ALGO =====
${veredictos[0] || '(sin resultado)'}

===== VERIFICACION: SOBRA ALGO =====
${veredictos[1] || '(sin resultado)'}

===== VERIFICACION: INTEGRIDAD =====
${veredictos[2] || '(sin resultado)'}

===== INFORMES DE LECTURA =====
${contexto}`,
  { label: 'cerrar:modelo-final', phase: 'Cerrar', schema: MODELO_SCHEMA, effort: 'high' }
)

const notas = await agent(
  `${COMUN}

Escribe la NOTA DE DECISIONES que acompana al modelo final, en espanol, para Christian (el arquitecto
del proyecto). Es prosa breve, no una tabla. Cubre, en este orden:
1. Que tablas se crean y por que agrupadas asi (2-3 lineas).
2. Que se RECORTO del maestro y por que (lo mas util del entregable: el usuario pidio no exagerar).
3. Que columnas FALTAN en tablas que YA existen hoy en main (ej: si el lote necesita algo).
4. Las decisiones donde hubo desacuerdo entre los verificadores y como se resolvio.
5. Las preguntas abiertas que el modelo NO puede responder solo y necesitan al cliente o a Christian.

Maximo 40 lineas. Sin preambulo.

===== MODELO FINAL =====
${JSON.stringify(final, null, 1)}

===== VERIFICACIONES =====
FALTA: ${veredictos[0] || ''}

SOBRA: ${veredictos[1] || ''}

INTEGRIDAD: ${veredictos[2] || ''}`,
  { label: 'cerrar:notas', phase: 'Cerrar', effort: 'high' }
)

return { modelo: final, notas, verificaciones: veredictos, lecturas }
