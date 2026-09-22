export const meta = {
  name: 'plano-dxf-siempre-pinta',
  description: 'El plano guarda toda figura del DXF, subir importa en un clic, y un boton sincroniza los grises contra los lotes',
  phases: [
    { title: 'Decidir', detail: 'ADR-015 y los contratos compartidos' },
    { title: 'Datos', detail: 'migracion nueva, entidades y extraccion del DXF' },
    { title: 'Aplicacion', detail: 'importar, sincronizar, mapa y erradicar el traslado de geometria' },
    { title: 'HTTP', detail: 'controllers, dtos y cableado del modulo' },
    { title: 'Angular', detail: 'mapa con grises y boton sincronizar, historial con conciliacion' },
  ],
}

const REGLAS = `
REGLAS DEL PROYECTO QUE NO SE NEGOCIAN (leelas antes de escribir una linea):
- CERO COMENTARIOS en apps/api, apps/web y packages/contratos. Ni //, ni /* */, ni JSDoc, ni <!-- --> en templates, ni banderas de seccion. Lo unico que sobrevive: // @ts-, // eslint-, // prettier-ignore, /// <reference y el comment: de una @Column de TypeORM (ese viaja al DDL y SE USA para documentar columnas nuevas).
- Los nombres cargan la explicacion. Si algo necesita parrafos, va al ADR.
- Toda entidad hereda EntidadBase o EntidadEmpresa. Nadie asigna usuarioCreacion a mano: lo hace AuditoriaSubscriber.
- Nunca delete(): borrado logico con eliminado = true y save(), no update().
- El controlador devuelve el dato pelado; TransformInterceptor envuelve. Usa @Mensaje('...').
- El caso de uso NO conoce codigos HTTP: lanza ErrorDominio de comun/dominio/error-dominio.ts (NoEncontrado, Conflicto, DatoInvalido, ReglaDeNegocio, NoAutenticado, Prohibido). De @nestjs/common un caso de uso solo importa Injectable e Inject.
- dominio/ no importa @nestjs/*, typeorm ni class-validator. Ninguna @Entity fuera de infraestructura/persistencia/. Ningun @Controller fuera de api/. Ningun *.caso-uso.ts fuera de aplicacion/.
- Ningun modulo inyecta el repositorio de otro: se habla por casos de uso exportados.
- PostgreSQL: id BIGINT GENERATED ALWAYS AS IDENTITY, snake_case singular en espanol, TIMESTAMPTZ, numeric(12,2) para dinero y areas, indices unicos parciales WHERE eliminado = false.
- Angular 18: standalone: true, inject(), signal(), @if/@for con track, OnPush, Tailwind con los tokens marca-*/lienzo/superficie/borde/tinta-*, prohibido any y prohibido *ngIf/*ngFor.
- Cada archivo nuevo en dominio/ lleva su .spec.ts hermano en el mismo commit (lo verifica apps/api/test/cobertura-pruebas.spec.ts).
`

const DECISION = `
DECISION DE PRODUCTO YA TOMADA POR EL CLIENTE (no la re-litigues, implementala):

El plano lo dibuja el ingeniero en AutoCAD. El sistema NUNCA fabrica geometria: solo consume el DXF. Pero el mapa NUNCA puede quedar en blanco.

1. TODA figura que el DXF dibuja se persiste, tenga o no un lote que le corresponda en la tabla lote.
2. Subir una version de DXF importa sus figuras en la MISMA accion. Desaparece el segundo clic "Precargar poligonos del DXF" y desaparece la palabra "precargar" del producto.
3. En el mapa: las figuras con lote se pintan por estado de venta y son clicables. Las figuras sin lote se pintan gris apagado, no clicables, sin panel lateral, con tooltip "Manzana K1 - Lote 16 - sin registrar".
4. Un boton "Sincronizar" en el mapa vuelve a emparejar las figuras huerfanas contra la tabla lote SIN volver a subir el archivo. El caso real: manana registran una manzana nueva de lotes, le dan a Sincronizar, y esos grises se encienden con su color.
5. Se erradica el unico punto donde el backend fabrica geometria por su cuenta: el traslado de poligonos al confirmar una recarga (reposicionar con escala y desplazamiento).

DISENO CANONICO YA FIJADO (respetalo al pie de la letra, es el contrato entre las cinco fases):

Tabla poligono_lote (NO se renombra):
  - lote_id BIGINT pasa a NULL permitido (DROP NOT NULL). La FK fk_poligono_lote_lote se queda: acepta NULL.
  - COLUMNAS NUEVAS, todas nulables salvo tipo_figura:
      manzana_dxf      VARCHAR(40)    NULL
      numero_lote_dxf  VARCHAR(20)    NULL
      area_m2_dxf      NUMERIC(12,2)  NULL
      tipo_figura      VARCHAR(20)    NOT NULL DEFAULT 'LOTE'
  - CHECK nuevo ck_poligono_lote_tipo_figura: tipo_figura IN ('LOTE','CONTORNO_MANZANA','AUXILIAR')
  - CHECK nuevo ck_poligono_lote_solo_lote_se_empareja: lote_id IS NULL OR tipo_figura = 'LOTE'
  - INDICE NUEVO idx_poligono_lote_version_etiqueta UNIQUE ON (plano_version_id, manzana_dxf, numero_lote_dxf) WHERE lote_id IS NULL AND numero_lote_dxf IS NOT NULL AND eliminado = false
  - SE VAN las columnas usuario_marcado_id (con su FK fk_poligono_lote_usuario_marcado) y fecha_marcado (redundante con fecha_creacion).
  - El indice idx_poligono_lote_plano_version_id_lote_id UNIQUE WHERE eliminado = false SE QUEDA tal cual.

Tabla plano_version: se van las columnas ancho_px y alto_px (lienzo raster muerto).
Tabla recarga_plano: se van escala_ajuste (y su CHECK ck_recarga_plano_escala_positiva), desplazamiento_x y desplazamiento_y.

packages/contratos/src/plano.ts:
  export enum TipoFigura { LOTE = 'LOTE', CONTORNO_MANZANA = 'CONTORNO_MANZANA', AUXILIAR = 'AUXILIAR' }
  export interface FiguraSinLote { poligonoId: number; tipoFigura: TipoFigura; manzanaDxf: string | null; numeroLoteDxf: string | null; areaM2Dxf: number | null; coordenadas: VerticePlano[] }
  MapaDelPlano suma el campo: figurasSinLote: FiguraSinLote[]
  export interface ResumenSincronizacion { planoVersionId: number; numeroVersion: number; figurasDelPlano: number; conLote: number; sinLote: number; lotesSinFigura: number; recienEmparejados: number }
  ResumenImportacion se REEMPLAZA por ResumenSincronizacion en toda la superficie nueva; LoteSinEmparejar se elimina si deja de tener consumidor.

Endpoints resultantes:
  POST /planos/:id/versiones  -> sube el archivo E IMPORTA. Devuelve { version: PlanoVersion, resumen: ResumenSincronizacion }.
  POST /planos/:id/sincronizacion -> reempareja los huerfanos de la version vigente contra la tabla lote. Devuelve ResumenSincronizacion. @Mensaje('Plano sincronizado con los lotes').
  DESAPARECE POST /planos/versiones/:versionId/importacion-dxf.
  SE CONSERVA INTACTO POST /poligonos-lote/:id/reasociaciones.
`

phase('Decidir')

const [adr, contratos] = await parallel([
  () => agent(
    `${REGLAS}\n${DECISION}\n\nTU TAREA: escribir docs/adr/ADR-015 y enmendar ADR-010.

1. Lee primero, completos, para copiar el formato exacto (cabecera con tabla de metadatos, numeracion de secciones, tono en espanol, uso de negrita y de bloques de codigo):
   - docs/adr/ADR-010-coloreado-del-plano-por-una-sola-dimension.md
   - docs/adr/ADR-012-ningun-secreto-cruza-al-cliente.md (ejemplo de ADR retroactivo bien escrito)
   - docs/adr/ADR-008-molde-hexagonal-de-modulos.md (ejemplo de ADR que enmienda a otro)
   - CLAUDE.md de la raiz, seccion "Como evolucionan estas reglas"

2. Escribe docs/adr/ADR-015-la-geometria-viene-del-dxf-y-el-mapa-nunca-queda-en-blanco.md con estado "Aceptado" y fecha 25-ago-2026, y cabecera que incluya la fila **Enmienda** | ADR-010 seccion 3.

   Tiene que decidir explicitamente, cada una con su razon:
   a) La geometria solo entra por el DXF del ingeniero. Cita el commit 9cf596f del 23-ago-2026 ("refactor: se va el marcado de poligonos a mano") como el momento en que se borro el editor de poligonos, y explica que este ADR es en parte retroactivo: su razon vivia solo en un mensaje de commit.
   b) Se erradica el traslado de geometria al confirmar una recarga (la funcion reposicionar con escala y desplazamiento en confirmar-recarga-de-plano.caso-uso.ts): era el ultimo camino por el que el backend fabricaba coordenadas que no salieron de un DXF. Si la version nueva no dibujo un lote, ese lote se queda sin figura.
   c) Subir una version ES importarla. El segundo clic solo tenia sentido cuando importar era una de dos maneras de conseguir geometria.
   d) El plano persiste TODA figura del DXF, con o sin lote. lote_id pasa a nulable y la figura guarda la etiqueta que leyo (manzana_dxf, numero_lote_dxf, area_m2_dxf) mas su tipo_figura. Explica por que la alternativa de crear lotes fantasma en la tabla lote se descarto: choca con el indice unico (manzana_id, numero_lote) y contamina todo conteo de inventario.
   e) Sincronizar es una accion idempotente y separada: reempareja huerfanos contra la tabla lote sin volver a leer el archivo. Razon de negocio literal del cliente: registran una manzana nueva de lotes y no tienen por que volver a subir el DXF para que se pinte.
   f) LA ENMIENDA A ADR-010: la regla de oro "el plano no guarda colores, el hex viene resuelto desde estado_lote" sigue en pie para todo lo que tiene lote. La figura sin lote no tiene estado_lote del que resolver un hex, asi que su gris NO es un color del dominio: es tratamiento visual del front, queda FUERA de la leyenda, fuera del filtro por estado y fuera del clic. Decide esto por escrito, con esas cuatro exclusiones.
   g) Que la bitacora no se inunde: PoligonoLote lleva @Auditable() y bitacora_auditoria no se purga nunca. Decide y justifica omitir coordenadas de la auditoria de esta entidad.

3. Edita docs/adr/ADR-010-coloreado-del-plano-por-una-sola-dimension.md: en su tabla de cabecera agrega la fila **Enmendado por** | ADR-015, y dentro de la seccion 3 agrega un bloque de aviso (usa exactamente el mismo estilo visual que usa ADR-002 para marcar su seccion 3 enmendada) que remita a ADR-015 para el caso de la figura sin lote.

Escribe en espanol, con acentos correctos, en el registro del proyecto: frases cortas, afirmativas, sin relleno corporativo. Los .md SI llevan prosa (la regla de cero comentarios es solo para codigo).

Devuelve: rutas escritas y un resumen de 5 lineas de lo que decide el ADR.`,
    { label: 'ADR-015', phase: 'Decidir' },
  ),

  () => agent(
    `${REGLAS}\n${DECISION}\n\nTU TAREA: actualizar SOLO packages/contratos (ningun archivo de apps/).

1. Lee packages/contratos/src/plano.ts entero, y tambien packages/contratos/src/index.ts y cualquier otro archivo de ese paquete que exporte tipos de plano o lote.
2. Aplica exactamente el diseno canonico de arriba: enum TipoFigura, interface FiguraSinLote, campo figurasSinLote en MapaDelPlano, interface ResumenSincronizacion.
3. Revisa que se exporte todo lo nuevo desde el index del paquete, siguiendo el patron que ya usa.
4. ResumenImportacion y LoteSinEmparejar: NO los borres todavia (otras fases aun compilan contra ellos). Marca en tu reporte quien los usa hoy, hecho con grep sobre apps/api y apps/web, para que la fase que los deje sin consumidor los elimine.
5. VerticePlano y LoteExtraido: mira si LoteExtraido necesita crecer para expresar una figura sin numero o un contorno de manzana. Si el parser va a poder emitir figuras sin manzana ni numero, el tipo debe admitirlo (campos nulables o un tipo hermano). Decide y deja el tipo listo para que el agente de extraccion-dxf no tenga que inventarlo.
6. Compila el paquete si tiene script propio para verificar que no rompiste nada de tipos.

Devuelve: el diff conceptual (que tipos agregaste, cuales cambiaste) y la lista de consumidores de ResumenImportacion con ruta y linea.`,
    { label: 'contratos', phase: 'Decidir' },
  ),
])

log('ADR y contratos listos. Van migracion y extraccion del DXF.')

phase('Datos')

const [migracion, extraccion] = await parallel([
  () => agent(
    `${REGLAS}\n${DECISION}\n\nCONTEXTO DE LA FASE ANTERIOR (contratos ya actualizados):\n${JSON.stringify(contratos).slice(0, 3000)}\n\nTU TAREA: la migracion nueva y las entidades de persistencia. NADIE MAS toca estos archivos, son tuyos en exclusiva:
  - apps/api/src/migraciones/<timestamp>-<Nombre>.ts (archivo NUEVO)
  - apps/api/src/modulos/plano/infraestructura/persistencia/poligono-lote.entity.ts
  - apps/api/src/modulos/plano/infraestructura/persistencia/plano-version.entity.ts
  - apps/api/src/modulos/plano/infraestructura/persistencia/recarga-plano.entity.ts

1. Lee apps/api/src/migraciones/1787097600000-InventarioYPlano.ts (al menos las secciones de poligono_lote, plano_version, recarga_plano y su metodo down) para copiar el estilo EXACTO de las migraciones de este proyecto: como nombran la clase, como escriben el SQL, como ordenan up y down.
2. Lee las tres entidades enteras y la clase base de la que heredan.
3. Escribe UNA migracion nueva, con timestamp mayor a 1787097600000, que aplique el diseno canonico completo: el DROP NOT NULL de lote_id, las cuatro columnas nuevas, los dos CHECK nuevos, el indice unico parcial nuevo, y los DROP COLUMN de usuario_marcado_id, fecha_marcado, ancho_px, alto_px, escala_ajuste, desplazamiento_x, desplazamiento_y, mas el DROP del CHECK ck_recarga_plano_escala_positiva y de la FK fk_poligono_lote_usuario_marcado.
   El metodo down tiene que revertirlo de verdad, no quedar vacio: reponer columnas, FK, CHECK e indice, y devolver lote_id a NOT NULL.
   ORDEN IMPORTANTE: dropea FK y CHECK antes que sus columnas.
4. Espeja todo en las entidades TypeORM: loteId pasa a number | null con nullable: true; las cuatro columnas nuevas con su tipo correcto (numeric con transformer si el proyecto ya usa uno para dinero o area: revisa como lo hace lote.entity.ts para no inventar), y cada @Column nueva con su comment: en espanol explicando que guarda (el comment viaja al DDL y es la unica forma de documentar permitida). Actualiza los @Index de clase segun el diseno.
5. Cambia @Auditable() de PoligonoLote a @Auditable({ omitir: ['coordenadas'] }) para no inundar bitacora_auditoria.
6. Corre la migracion contra el Docker que ya esta arriba y verifica el resultado real:
     docker exec inmobiliaria-postgres psql -U inmobiliaria -d inmobiliaria -c "\\\\d poligono_lote"
   El comando del proyecto es npm run migracion:correr. Si el contenedor de la api necesita recompilar, revisa como esta montado antes de asumir. Si la migracion falla, arreglala y vuelve a correrla hasta que el \\\\d muestre el esquema esperado.
7. Actualiza apps/api/test/arquitectura.spec.ts SOLO si ese archivo asevera algo sobre las columnas que tocaste (leelo antes; si tiene una asercion sobre poligono_lote, ajustala y agrega una que fije que lote_id es nulable). No toques nada mas de ese archivo.

Devuelve: la ruta de la migracion, el SQL clave que escribiste, y la salida literal del \\\\d poligono_lote despues de correrla.`,
    { label: 'migracion+entidades', phase: 'Datos' },
  ),

  () => agent(
    `${REGLAS}\n${DECISION}\n\nCONTEXTO DE LA FASE ANTERIOR (contratos ya actualizados):\n${JSON.stringify(contratos).slice(0, 3000)}\n\nTU TAREA: que el parser del DXF deje de descartar figuras. Archivos tuyos en exclusiva:
  - apps/api/src/modulos/plano/dominio/extraccion-dxf.ts
  - apps/api/src/modulos/plano/dominio/extraccion-dxf.spec.ts

1. Lee extraccion-dxf.ts ENTERO y su spec entero. Entiende exactamente que figuras sobreviven hoy y donde estan las guardas que descartan (busca los filtros por area minima, por cantidad de numeros dentro, por ausencia de numero, y el manejo de los contornos de manzana).
2. Hoy el parser devuelve solo los lotes con manzana y numero, y tira todo lo demas. El cliente quiere que NADA se descarte. Reescribe la extraccion para que emita TODAS las figuras cerradas del dibujo, cada una clasificada:
     LOTE              -> figura con numero rotulado dentro, o del tamano y capa de un lote
     CONTORNO_MANZANA  -> la figura que rodea a otras figuras de lote, o la que el rotulo de manzana identifica como perimetro
     AUXILIAR          -> el resto: sin numero, demasiado chica, geometria suelta
   La clasificacion tiene que ser una funcion PURA y con nombre propio (dominio/, sin dependencias de Nest ni TypeORM), y debe ser explicable: el criterio vive en el nombre de la funcion y de sus constantes, no en un comentario.
3. La figura conserva lo que el DXF dijo de ella: manzana rotulada (o null), numero (o null), area en m2 (o null), coordenadas normalizadas. El encuadre (recuadroDelDibujo) NO debe cambiar de semantica: verifica que las coordenadas de las figuras nuevas queden en el mismo sistema que las de los lotes, o el gris no calzara pixel a pixel con el color.
4. El campo revisar (mas de un numero dentro de una cara) y vendible se conservan con su significado actual para las figuras LOTE.
5. AMPLIA extraccion-dxf.spec.ts: tests para cada rama de clasificacion, para que ninguna figura se pierda (el total emitido debe ser igual al total de figuras cerradas leidas), y para que las coordenadas sigan normalizandose igual que antes. Los tests existentes que asumian el descarte hay que reescribirlos para que asuman la clasificacion. Corre npx jest sobre ese spec hasta verde.
6. Prueba contra el archivo real si esta en el repo o en el volumen del contenedor: hay un DXF de la 2da etapa que produce 524 figuras etiquetadas. Si lo encuentras, deja constancia en tu reporte de cuantas figuras de cada tipo emite ahora.

Devuelve: la firma de las funciones nuevas, el conteo por tipo si pudiste correrlo contra el DXF real, y el resultado de los tests.`,
    { label: 'extraccion-dxf', phase: 'Datos' },
  ),
])

log('Datos listos. Va la capa de aplicacion.')

phase('Aplicacion')

const contextoPrevio = `
CONTEXTO DE LAS FASES ANTERIORES:
[contratos] ${JSON.stringify(contratos).slice(0, 2000)}
[migracion+entidades] ${JSON.stringify(migracion).slice(0, 2500)}
[extraccion-dxf] ${JSON.stringify(extraccion).slice(0, 2500)}
`

const [importarYSincronizar, limpiezaRecarga, mapa] = await parallel([
  () => agent(
    `${REGLAS}\n${DECISION}\n${contextoPrevio}\n\nTU TAREA: el importador guarda TODO, y nace el caso de uso de sincronizar. Archivos tuyos en exclusiva:
  - apps/api/src/modulos/plano/aplicacion/importar-poligonos-del-dxf.caso-uso.ts (lo vas a reescribir; renombralo a sincronizar-plano-con-lotes.caso-uso.ts si el nombre queda mejor, pero entonces borra el viejo y avisa en tu reporte)
  - apps/api/src/modulos/plano/aplicacion/sincronizar-plano-con-lotes.caso-uso.ts (NUEVO)
  - apps/api/src/modulos/plano/aplicacion/subir-version-de-plano.caso-uso.ts
  - apps/api/src/modulos/plano/dominio/puertos/poligono-lote.repositorio.ts
  - apps/api/src/modulos/plano/infraestructura/persistencia/poligono-lote.repositorio.typeorm.ts
  NO toques entidades, ni migraciones, ni controllers, ni plano.module.ts (otro agente los tiene).

1. Lee enteros: importar-poligonos-del-dxf.caso-uso.ts, subir-version-de-plano.caso-uso.ts, el puerto y la implementacion typeorm del repositorio de poligonos, y buscar-lote-por-clave-impresa.caso-uso.ts y listar-ids-de-lotes-del-tramo.caso-uso.ts del modulo lote.

2. IMPORTAR: ahora persiste TODAS las figuras que devuelve el parser, no solo las que encontraron lote.
   - Figura tipo LOTE cuyo (manzana, numero) existe en el tramo -> se guarda con loteId.
   - Figura tipo LOTE sin lote en el sistema -> se guarda con loteId NULL y su manzanaDxf, numeroLoteDxf y areaM2Dxf.
   - CONTORNO_MANZANA y AUXILIAR -> se guardan con loteId NULL y su tipoFigura.
   - Sigue siendo idempotente: reimportar la misma version no puede duplicar. Hoy la idempotencia se apoya en buscarDeLoteEnVersion; para los huerfanos necesitas el equivalente por etiqueta (metodo nuevo en el puerto, respaldado por el indice unico parcial que creo la fase de datos).
   - Devuelve ResumenSincronizacion, no ResumenImportacion.

3. SINCRONIZAR (caso de uso nuevo, el boton del mapa): recibe planoId. Toma la version vigente, lista sus poligonos con loteId NULL y tipoFigura LOTE, y por cada uno busca el lote del tramo por (manzanaDxf, numeroLoteDxf). Si lo encuentra, le asigna el loteId y guarda. Es idempotente y no lee el archivo DXF: trabaja solo contra lo ya persistido. Respeta la restriccion de que un lote no puede tener dos figuras en la misma version. Devuelve ResumenSincronizacion con recienEmparejados.
   Metodos nuevos en el puerto y su implementacion typeorm: los que necesites para listar huerfanos de una version y para contar por version. Un COUNT(*) GROUP BY, no traer filas para contarlas.

4. SUBIR VERSION: la subida importa en la misma accion. Decide como componerlo respetando ADR-008: un caso de uso puede llamar a otro caso de uso del MISMO modulo, asi que SubirVersionDePlanoCasoUso puede orquestar. Devuelve un objeto con la version y el resumen.
   El mensaje de error que hoy dice "Solo se pueden precargar poligonos desde un DXF. Las demas versiones se marcan a mano" es mentira bajo esta decision: reescribelo para que diga que un PDF o una imagen se guardan como respaldo y no producen figuras.
   El motivo "El plano no dibujo su cara. Hay que marcarlo a mano" tambien se va: la salida correcta es pedirle al ingeniero el DXF con esa manzana lotizada.

5. Corre npx jest sobre apps/api/test/plano.spec.ts para ver que rompiste, y REPORTA la lista de tests rotos con su linea. NO los arregles tu (otro agente tiene los tests), salvo que el arreglo sea en un archivo tuyo.

Devuelve: firmas de los casos de uso, metodos nuevos del puerto, y la lista de tests que quedaron rojos con el porque.`,
    { label: 'importar+sincronizar', phase: 'Aplicacion' },
  ),

  () => agent(
    `${REGLAS}\n${DECISION}\n${contextoPrevio}\n\nTU TAREA: erradicar el unico punto donde el backend fabrica geometria. Archivos tuyos en exclusiva:
  - apps/api/src/modulos/plano/aplicacion/confirmar-recarga-de-plano.caso-uso.ts
  - apps/api/src/modulos/plano/aplicacion/iniciar-recarga-de-plano.caso-uso.ts
  - apps/api/src/modulos/plano/dominio/geometria-plano.ts
  - apps/api/src/modulos/plano/dominio/geometria-plano.spec.ts
  - apps/api/src/modulos/plano/api/dto/iniciar-recarga.dto.ts
  - apps/api/src/modulos/plano/dominio/puertos/recarga-plano.repositorio.ts
  - apps/api/src/modulos/plano/infraestructura/persistencia/recarga-plano.repositorio.typeorm.ts
  NO toques poligono-lote.entity.ts, recarga-plano.entity.ts ni las migraciones (otro agente las tiene: ya les quito las columnas escala_ajuste, desplazamiento_x y desplazamiento_y).

1. Lee enteros confirmar-recarga-de-plano.caso-uso.ts, iniciar-recarga-de-plano.caso-uso.ts, geometria-plano.ts, su spec y el DTO.
2. En ConfirmarRecargaDePlanoCasoUso, ELIMINA el bloque que recorre los poligonos de la version anterior y crea copias reposicionadas en la version nueva. Bajo esta decision, si el DXF nuevo no dibujo un lote, ese lote se queda sin figura y sale en la conciliacion. Conserva TODO lo demas del caso de uso: cambiar la version vigente, marcar la recarga como confirmada, la traza.
3. Borra la funcion reposicionar de geometria-plano.ts y sus tres tests del spec. Verifica por grep que no quede ningun otro llamador antes de borrar.
4. Quita escalaAjuste, desplazamientoX y desplazamientoY del IniciarRecargaDto y de IniciarRecargaDePlanoCasoUso, y del puerto y la implementacion del repositorio de recargas si aparecen ahi.
5. Revisa que EstadoRealineacion siga teniendo sentido: si DESALINEADO solo lo producia el traslado que acabas de borrar, dilo en tu reporte con la evidencia del grep. NO borres el enum ni la columna (eso es esquema y es de otro agente); solo reporta.
6. Corre npx jest sobre apps/api/test/plano.spec.ts y sobre el spec de geometria. Reporta que quedo rojo, con linea y motivo. El test "confirmar la recarga reposiciona el marcado y cambia la version vigente" va a fallar: es el que fija por contrato el comportamiento que borraste. NO lo arregles tu; reporta exactamente que parte se queda (version vigente) y que parte se borra (coordenadas reescritas).

Devuelve: que borraste con ruta y linea, la evidencia de grep de que nada mas lo usaba, y los tests rojos.`,
    { label: 'erradicar-traslado', phase: 'Aplicacion' },
  ),

  () => agent(
    `${REGLAS}\n${DECISION}\n${contextoPrevio}\n\nTU TAREA: el mapa devuelve tambien las figuras sin lote, y el historial de versiones devuelve la conciliacion. Archivos tuyos en exclusiva:
  - apps/api/src/modulos/plano/aplicacion/obtener-mapa-del-plano.caso-uso.ts
  - apps/api/src/modulos/plano/aplicacion/listar-versiones-de-plano.caso-uso.ts
  NO toques el repositorio de poligonos ni su puerto (otro agente los tiene): si necesitas un metodo nuevo, DECLARA en tu reporte la firma exacta que necesitas y programa contra ella asumiendo que existira.

1. Lee enteros obtener-mapa-del-plano.caso-uso.ts, listar-versiones-de-plano.caso-uso.ts, el puerto poligono-lote.repositorio.ts, y listar-lotes-pintados.caso-uso.ts del modulo lote.

2. MAPA: hoy filtra los lotes que tienen coordenadas y devuelve solo esos. Ahora ademas devuelve figurasSinLote: FiguraSinLote[] con las figuras de la version vigente cuyo loteId es NULL. Estructura de la respuesta segun el diseno canonico. Las figuras sin lote NO entran en la coleccion lotes ni en la leyenda: van en su propia coleccion, porque no tienen estado del que salga un color (ADR-015 enmienda ADR-010 en ese punto).

3. HISTORIAL: el GET /planos/:id/versiones tiene que traer, por fila, la conciliacion de esa version. Campos nuevos por version:
     figurasDelPlano   -> cuantas figuras tiene dibujadas esa version hoy
     conLote           -> cuantas tienen loteId
     sinLote           -> cuantas no
   Y del tramo, una sola vez (no por fila): lotesRegistrados y lotesSinFigura.
   CLAVE DE RENDIMIENTO: una sola consulta agregada para toda la pagina de versiones (COUNT(*) GROUP BY plano_version_id sobre los ids de la pagina), NUNCA un query por fila.
   El cableado entre modulos ya existe: PlanoModule importa LoteModule y LoteModule exporta ListarIdsDeLotesDelTramoCasoUso, asi que no cruces el limite por repositorio.

4. Los nombres de los campos que devuelvas tienen que calzar con lo que la fase de Angular va a pintar en columnas llamadas: Dibujados, Calzan, Falta registrarlos, Falta dibujarlos. Elige nombres de campo que hagan obvia esa correspondencia y dejalos escritos en tu reporte.

Devuelve: la forma exacta de las dos respuestas nuevas (en TypeScript), y la lista de metodos de repositorio que necesitas que existan, con su firma.`,
    { label: 'mapa+historial', phase: 'Aplicacion' },
  ),
])

log('Aplicacion lista. Va HTTP y el cableado.')

phase('HTTP')

const contextoAplicacion = `
[importar+sincronizar] ${JSON.stringify(importarYSincronizar).slice(0, 2500)}
[erradicar-traslado] ${JSON.stringify(limpiezaRecarga).slice(0, 2000)}
[mapa+historial] ${JSON.stringify(mapa).slice(0, 2500)}
`

const http = await agent(
  `${REGLAS}\n${DECISION}\n${contextoPrevio}\n${contextoAplicacion}\n\nTU TAREA: la cascara HTTP y el cableado del modulo. Archivos tuyos en exclusiva:
  - apps/api/src/modulos/plano/api/plano.controller.ts
  - apps/api/src/modulos/plano/api/recarga-plano.controller.ts
  - apps/api/src/modulos/plano/plano.module.ts
  - cualquier dto de apps/api/src/modulos/plano/api/dto/ que haga falta crear o borrar (salvo iniciar-recarga.dto.ts y reasociar-poligono.dto.ts)

1. Lee plano.controller.ts entero y plano.module.ts entero.
2. Aplica los endpoints resultantes del diseno canonico:
   - POST /planos/:id/versiones ahora devuelve { version, resumen }. @Mensaje adecuado.
   - POST /planos/:id/sincronizacion NUEVO. @Mensaje('Plano sincronizado con los lotes').
   - BORRA POST /planos/versiones/:versionId/importacion-dxf y su import.
   - NO TOQUES el PoligonoLoteController ni su ruta de reasociaciones: se conserva intacta por decision explicita del cliente.
3. El controlador no arma respuestas ni elige codigos HTTP: devuelve el dato pelado del caso de uso. Verifica que ningun metodo nuevo instancie una excepcion de @nestjs/common.
4. Cablea plano.module.ts: registra el caso de uso nuevo de sincronizar, quita el que haya desaparecido, y verifica que todo Symbol de puerto tenga su provider. Este archivo lo tocaron conceptualmente tres agentes: lee sus reportes de arriba y consolida TODO el cableado que hace falta.
5. Compila la api: npx tsc --noEmit -p apps/api/tsconfig.json (o el comando que el proyecto use). Arregla TODO error de tipos que caiga en archivos tuyos. Los errores que caigan en archivos de otros agentes, REPORTALOS con ruta, linea y mensaje literal en vez de arreglarlos, SALVO que sea un arreglo mecanico de una linea (un import que cambio de nombre): en ese caso arreglalo y dilo.
6. Reporta la superficie HTTP final del modulo plano como tabla: metodo, ruta, que devuelve.

Devuelve: la tabla de endpoints, el estado de la compilacion, y los errores de tipos que quedaron fuera de tu alcance.`,
  { label: 'controllers+module', phase: 'HTTP' },
)

log('HTTP listo. Va Angular.')

phase('Angular')

const contextoBackend = `
[contratos] ${JSON.stringify(contratos).slice(0, 1500)}
[mapa+historial] ${JSON.stringify(mapa).slice(0, 2500)}
[http] ${JSON.stringify(http).slice(0, 2500)}
`

const [frontMapa, frontVersiones] = await parallel([
  () => agent(
    `${REGLAS}\n${DECISION}\n${contextoBackend}\n\nTU TAREA: el mapa nunca queda en blanco, y tiene boton Sincronizar. Archivos tuyos en exclusiva:
  - apps/web/src/app/funcionalidades/plano/plano-mapa/plano-mapa.component.ts
  NO toques plano.service.ts ni plano.modelo.ts (otro agente los tiene): DECLARA en tu reporte los metodos y tipos que necesitas de ellos y programa contra esa firma.

1. Lee plano-mapa.component.ts ENTERO antes de tocar nada. Entiende su encuadre (viewBox), su paneo por pointer events, su zoom, su computed poligonos() y su panel lateral.
2. Pinta las figuras sin lote:
   - relleno gris apagado y borde punteado, con los tokens del proyecto (nada de hex hardcodeado: usa la escala de grises de tailwind.config.js o los tokens tinta-*/borde; lee ese archivo antes).
   - pointer-events: none o el equivalente: NO son clicables y NO abren el panel lateral.
   - se dibujan DEBAJO de las figuras con lote, para que nunca tapen una que si tiene color.
   - tooltip nativo con la etiqueta: "Manzana K1 - Lote 16 - sin registrar", y para las que no tengan etiqueta, el texto que corresponda a su tipo de figura.
   - las de tipo CONTORNO_MANZANA se pintan como linea de referencia SIN relleno, para que no tapen a sus propios lotes.
3. El encuadre inicial (ajustarEncuadre) tiene que abarcar TODAS las figuras, no solo las que tienen lote, o el plano nuevo aparecera descuadrado.
4. Barra superior del mapa: cuando haya figuras sin lote, un aviso con el conteo y el boton "Sincronizar", que llama al endpoint nuevo y recarga el mapa. Estados del boton: normal, "Sincronizando...", y el resultado por notificacion (mira como el resto de la app usa NotificacionService). Si todo calza, el aviso y el boton no aparecen.
5. El estado vacio "Este tramo todavia no tiene lotes dibujados" solo debe salir cuando de verdad no haya NI UNA figura. Si hay figuras sin lote, el mapa las muestra y el texto correcto habla de lotes por registrar, no de un tramo vacio.
6. La leyenda y el filtro por estado NO incluyen el gris (ADR-015 lo decide asi): el filtro no debe atenuar ni resaltar las figuras sin lote.
7. Revisa que no quedes con any, que uses @if/@for con track, signals y OnPush.

Devuelve: los metodos que necesitas de PlanoService con su firma exacta, y un resumen de los cambios visuales.`,
    { label: 'web:mapa', phase: 'Angular' },
  ),

  () => agent(
    `${REGLAS}\n${DECISION}\n${contextoBackend}\n\nTU TAREA: la pantalla de versiones pierde el segundo clic y gana la conciliacion. Archivos tuyos en exclusiva:
  - apps/web/src/app/funcionalidades/plano/plano-versiones/plano-versiones.component.ts
  - apps/web/src/app/funcionalidades/plano/servicios/plano.service.ts
  - apps/web/src/app/funcionalidades/plano/modelos/plano.modelo.ts
  NO toques plano-mapa.component.ts (otro agente lo tiene). El agente del mapa va a necesitar de tu servicio un metodo para sincronizar (POST /planos/:id/sincronizacion) y el tipo de las figuras sin lote: expon ambos.

1. Lee enteros los tres archivos.
2. plano.service.ts: metodo nuevo sincronizar(planoId), el metodo de subir version pasa a devolver { version, resumen }, y se borra el metodo de importar/precargar. Tipa contra @inmobiliaria/contratos.
3. plano.modelo.ts: agrega lo que falte para las figuras sin lote y la conciliacion por version. Borra de la interface PoligonoLote los campos fechaMarcado y usuarioMarcadoId: esas columnas ya no existen en la base. Si la interface entera quedo sin consumidor, borrala.
4. plano-versiones.component.ts:
   - DESAPARECE el boton "Precargar poligonos del DXF" y el metodo importar(). Subir el archivo ya importa.
   - Tras subir, el panel de la derecha muestra el resumen de lo que entro, con el vocabulario nuevo (nada de "precargar", nada de "marcar a mano").
   - El HISTORIAL suma cuatro columnas, con estos encabezados literales: Dibujados | Calzan | Falta registrarlos | Falta dibujarlos.
     * "Falta registrarlos" en rojo cuando es mayor que cero (el plano lo dibuja, no esta en la tabla lote).
     * "Falta dibujarlos" en ambar cuando es mayor que cero (esta en la tabla lote, el plano no lo dibuja).
     * cuando ambas son cero en la fila vigente, un mensaje verde: "El plano calza con los N lotes registrados".
   - "lotes registrados" es del tramo, no de la version: va en el subtitulo de la seccion, no repetido en cada fila.
   - Un enlace "Ver el mapa" SIEMPRE visible, no solo despues de importar.
5. Revisa que no quedes con any, que uses @if/@for con track, signals y OnPush, y los tokens Tailwind del proyecto.

Devuelve: la firma de los metodos nuevos de PlanoService (el agente del mapa depende de ella) y un resumen de los cambios de pantalla.`,
    { label: 'web:versiones', phase: 'Angular' },
  ),
])

return {
  adr,
  contratos,
  migracion,
  extraccion,
  importarYSincronizar,
  limpiezaRecarga,
  mapa,
  http,
  frontMapa,
  frontVersiones,
}
