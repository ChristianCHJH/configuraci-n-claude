export const meta = {
  name: 'fecha-de-contrato-la-elige-el-asesor',
  description: 'La fecha del contrato la elige el asesor al generar, se guarda, se puede modificar y la firma ya no la pisa',
  phases: [
    { title: 'Backend', detail: 'migracion, entidad, generar, firmar, actualizar y pruebas' },
    { title: 'Frontend', detail: 'modelo, ficha del contrato y formulario' },
  ],
}

const RAIZ = 'c:\\Users\\Christian\\Proyectos\\inmobiliaria-sistema'

const COMUN = `
Repositorio: ${RAIZ} (monorepo npm: apps/api NestJS 10 + TypeORM, apps/web Angular 18, packages/contratos).
Rama: feat/separacion-contrato-cronograma, arbol limpio, ultimo commit 0c58372.

ANTES DE ESCRIBIR NADA lee ${RAIZ}\\CLAUDE.md completo. Lo critico:
- Regla 6: CERO comentarios en apps/api, apps/web y packages/contratos. Ni //, ni /* */, ni JSDoc, ni
  <!-- --> dentro de un template de Angular. El nombre carga la explicacion.
- Regla 9: un fallo de negocio es un ErrorDominio de comun/dominio/error-dominio.ts, nunca una excepcion de
  @nestjs/common. De @nestjs/common un caso de uso solo importa Injectable e Inject.
- Regla 1: synchronize esta prohibido; todo cambio de esquema es una migracion revisada a mano.
- Angular 18: standalone, inject(), signal(), @if / @for con track, OnPush, Tailwind, prohibido any.
- Escribe en espanol con tildes correctas, como el resto del codigo.
- NO hagas git commit, git add, git checkout ni git stash.
`

const ESQUEMA = {
  type: 'object',
  properties: {
    resumen: { type: 'string' },
    archivos: { type: 'array', items: { type: 'string' } },
    pendientes: { type: 'array', items: { type: 'string' } },
    contratoDeApi: {
      type: 'string',
      description: 'Como quedo la forma de la API para el frontend: que campos manda y devuelve cada endpoint tocado',
    },
  },
  required: ['resumen', 'archivos', 'pendientes'],
}

const P_BACKEND = `${COMUN}

DECISION DEL USUARIO, textual: "la fecha de contrato hay que dejarlo para que el asesor elija pero abierto
para poder modificar".

Hoy pasa esto, y esta mal:
- GenerarContratoDesdeSeparacionCasoUso usa datos.fechaContrato (o hoy) para anclar todo el cronograma, pero
  guarda fechaContrato: null en la fila del contrato (linea 126). O sea que la fecha que el asesor eligio
  ancla las cuotas y despues se tira.
- FirmarContratoCasoUso pone contrato.fechaContrato = datos.fechaContrato ?? hoy al firmar. Como el cronograma
  se anclo en la fecha de generacion y nadie lo recalcula, el contrato impreso puede llevar una fecha posterior
  a su propia cuota inicial.
- ActualizarContratoDto hereda fechaContrato de GenerarContratoDto y fechaBaseDelCronograma la lee para
  re-anclar todos los vencimientos, pero copiarCamposSimples nunca la asigna: la fecha del cliente mueve las 24
  cuotas y despues se descarta.

Lo que hay que dejar montado:
1. El contrato NACE con la fecha que eligio el asesor (o la de hoy si no la manda), guardada en la fila.
2. Esa fecha se puede cambiar con el PATCH mientras el contrato no este firmado, y al cambiarla el cronograma
   se re-ancla (eso ya funciona: fechaContrato esta en CAMPOS_QUE_REHACEN_EL_CRONOGRAMA), pero ahora ademas
   tiene que quedar guardada en la fila.
3. Firmar YA NO decide la fecha. Firmar asigna el numero correlativo y nada mas; el ano del correlativo sale de
   la fecha que ya tiene el contrato.

TUS ARCHIVOS:
- apps/api/src/migraciones/1788134400000-SeparacionContratoYCronograma.ts
- apps/api/src/modulos/contrato/** (todo)
- apps/api/test/contrato.spec.ts

QUE HACER, en detalle:
a) La columna "fecha_contrato" DATE de la tabla contrato_venta pasa a NOT NULL en la migracion (esa migracion
   nunca se publico y se edita a mano; el usuario ya sabe que tiene que revertir y volver a correr). Ojo con
   los datos de arranque: si alguna insercion de la propia migracion o de la semilla escribe contratos, tiene
   que traer fecha. Verificalo antes.
b) ContratoVenta.fechaContrato deja de ser string | null y pasa a string (quita el nullable de la @Column).
   Ajusta el tipo del borrador en dominio/puertos/contrato.repositorio.ts y todo lo que se rompa por el cambio
   de tipo.
c) GenerarContratoDesdeSeparacionCasoUso guarda la fechaContrato que ya calcula, en vez de null.
d) FirmarContratoCasoUso deja de tocar contrato.fechaContrato y saca el ano del correlativo de
   contrato.fechaContrato. Quita fechaContrato de FirmarContratoDto: la fecha se corrige con el PATCH antes de
   firmar, no en la firma. archivoFirmadoId se queda como esta.
e) ActualizarContratoCasoUso asigna contrato.fechaContrato cuando el cuerpo la trae (normalizada a los diez
   primeros caracteres, como ya hace fechaBaseDelCronograma). Aprovecha que ahora la fila siempre tiene fecha
   para simplificar fechaBaseDelCronograma si queda codigo muerto (las ramas que buscaban la fecha en la cuota
   0 o en la cuota 1).
f) Pruebas en contrato.spec.ts:
   - la que hoy espera que firmar ponga la fecha de hoy (cerca de la linea 939) pasa a esperar la fecha con la
     que se genero el contrato;
   - el contrato recien generado ya devuelve su fechaContrato (hoy la prueba de la linea 601 espera null);
   - el PATCH que cambia fechaContrato mueve los vencimientos del cronograma Y deja la fecha guardada;
   - firmar sin cuerpo no cambia la fecha.
g) Corre "npx tsc -p apps/api/tsconfig.json --noEmit" y dejalo en verde. NO corras npm run prueba (el usuario
   la corre despues).

En "contratoDeApi" describe con precision que cambio para el frontend: que campos dejo de aceptar
POST /contratos/:id/firma, que devuelve ahora fechaContrato en el detalle y si dejo de ser nullable.`

const promptFrontend = (backend) => `${COMUN}

El backend ya cambio. Esto es lo que dejo hecho:
${JSON.stringify(backend?.resumen ?? '')}
Forma de la API resultante: ${JSON.stringify(backend?.contratoDeApi ?? '')}
Archivos que toco: ${JSON.stringify(backend?.archivos ?? [])}

Resumen de la decision del usuario: la fecha del contrato la elige el asesor cuando genera el contrato, queda
guardada desde el primer momento, se puede modificar con el PATCH mientras no este firmado (y al cambiarla se
re-ancla el cronograma), y la firma ya NO la decide: firmar solo asigna el numero correlativo.

TUS ARCHIVOS:
- apps/web/src/app/funcionalidades/contrato/** (todo)

QUE HACER:
1. apps/web/src/app/funcionalidades/contrato/modelos/contrato.modelo.ts: fechaContrato del contrato ya no es
   nullable (confirmalo contra lo que dijo el backend) y la interfaz FirmarContrato se queda sin fechaContrato.
2. contrato-ficha/contrato-ficha.component.ts:
   - el dialogo "Firmar el contrato" ya no edita la fecha. Hoy tiene un input type=date con
     [(ngModel)]="fechaDeFirma" y un label "Fecha que lleva impresa el contrato" (cerca de la linea 397). En su
     lugar, muestra en texto la fecha que el contrato ya tiene, con una linea que le diga al asesor que si la
     quiere cambiar tiene que editarla antes de firmar. Borra el estado fechaDeFirma y su reseteo en
     abrirFirma() si quedan sin uso.
   - firmar() llama al servicio sin fechaContrato.
   - el subtitulo dice "firmado el {fechaContrato}" / "todavia sin firmar" (cerca de la linea 578). Eso ya no
     es cierto: fechaContrato es la fecha DEL CONTRATO, no la de la firma. Lo que dice si esta firmado es
     numeroContrato. Reescribelo para que la fecha se muestre como la fecha del contrato y el estado de firma
     salga de numeroContrato.
3. contrato-formulario/contrato-formulario.component.ts: al editar un contrato, la fecha base sale de
   detalle.contrato.fechaContrato (cerca de la linea 1170 hay un fallback a la cuota inicial y a hoy que ahora
   sobra). Asegurate ademas de que al guardar la edicion el PATCH mande fechaContrato: si el asesor la cambia
   en el formulario, tiene que viajar.
4. Revisa el resto de la carpeta por si alguna pantalla mas asume que fechaContrato puede ser null o que la
   fecha se decide al firmar (contrato-lista, por ejemplo).
5. Verifica que compila. Mira los scripts de apps/web/package.json y de la raiz: si hay un typecheck o un
   build, corre el mas barato que exista. Si no hay ninguno, dilo en pendientes en vez de inventar uno.

Sin comentarios en el codigo ni en los templates, @if/@for con track, signals, sin any.`

phase('Backend')
const backend = await agent(P_BACKEND, { label: 'api', phase: 'Backend', schema: ESQUEMA })

log('Backend listo. Ajustando el frontend a la nueva forma de la API.')

phase('Frontend')
const frontend = await agent(promptFrontend(backend), { label: 'web', phase: 'Frontend', schema: ESQUEMA })

return { backend, frontend }
