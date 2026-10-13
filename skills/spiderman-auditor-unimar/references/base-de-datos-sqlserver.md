# Checklist — base de datos SQL Server

Criterio de Namor (`unimar-dba-sqlserver`, RS-BD-SQLSERVER) aplicado al esquema, las migraciones y
la persistencia. Fuentes: la sección «Modelado de base de datos — SQL Server 16» del `CLAUDE.md` del
TMS, ADR-TMS-007, 011, 012, 013, 014, 015, 023, 024 y 025, ADR-0016 (pista de auditoría), ADR-0010,
ADR-0054, las reglas de RS-BD-SQLSERVER y el documento de Alberto (§6).

En el TMS el esquema se escribe en SQL crudo dentro de las migraciones, con las ayudas de
`sql-ayudas.ts` (`columnasAuditoria`, `columnasAuditoriaAppendOnly`, `indiceClustered`,
`checkListaCerrada`, `INTERCALACION`, `texto`). Un `CREATE TABLE` que no pasa por ellas merece
lectura línea a línea.

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; MIG=$API/shared/infrastructure/persistence/migraciones`.

## Identidad y auditoría

- **BD-01 · Alta** — La PK es `id UNIQUEIDENTIFIER NOT NULL CONSTRAINT pk_<tabla> PRIMARY KEY
  NONCLUSTERED`; prohibido `IDENTITY` y todo autoincremental; toda FK a un `id` es `UNIQUEIDENTIFIER`.
  Fuente: ADR-TMS-011; `CLAUDE.md` del TMS. Detecta:
  `git grep -niE '\bIDENTITY\b|PRIMARY KEY CLUSTERED|PrimaryGeneratedColumn' -- "$API" | grep -v '\.spec\.ts'`.
- **BD-02 · Alta** — El GUID lo genera el dominio (UUID v7); nada de `NEWID()` ni
  `NEWSEQUENTIALID()` como default.
  Fuente: ADR-TMS-011 D1 y D3; RS-BD-SQLSERVER. Detecta: `git grep -nE 'NEWID\(|NEWSEQUENTIALID\(' -- "$API"`.
- **BD-03 · Alta** — El índice clustered va sobre `fecha_creacion` (`ix_<tabla>_fecha_creacion`):
  un GUID clustered fragmenta la tabla.
  Fuente: ADR-TMS-011 D2; RS-BD-SQLSERVER. Detecta: comparar
  `git grep -hoE "CREATE TABLE (dbo\.)?[a-z_]+" -- "$MIG/*" | sed -E 's/CREATE TABLE (dbo\.)?//' | sort -u`
  con `git grep -hoE "indiceClustered\('[a-z_]+'|CLUSTERED INDEX ix_[a-z_]+_fecha_creacion" -- "$MIG/*"`.
- **BD-04 · Alta** — Columnas de auditoría exactas: `usuario_creador NVARCHAR(100) NOT NULL`,
  `usuario_actualizador NVARCHAR(100)` nulable, `fecha_creacion DATETIMEOFFSET(3) NOT NULL DEFAULT
  SYSDATETIMEOFFSET()`, `fecha_actualizacion DATETIMEOFFSET(3)` nulable, `ultimo_cambio ROWVERSION`.
  Prohibido `usuario_creacion` y `usuario_actualizacion`. Los usuarios son texto, sin FK.
  Fuente: `CLAUDE.md` del TMS; D-19; D-20; D-08. Detecta:
  `git grep -nE 'usuario_creacion|usuario_actualizacion' -- "$API"`; un `CREATE TABLE` nuevo sin
  `columnasAuditoria(` ni las cinco columnas escritas a mano.
- **BD-05 · Media** — Al insertar, `usuario_actualizador` y `fecha_actualizacion` quedan en NULL:
  nunca se copia la creación en la actualización. Ojo con `@UpdateDateColumn`, que TypeORM llena
  también al insertar.
  Fuente: `CLAUDE.md` del TMS. Detecta:
  `git grep -nE '@(UpdateDateColumn|CreateDateColumn|VersionColumn)' -- "$API"`;
  `git grep -nE -A4 'INSERT INTO' -- "$API" | grep -E 'usuario_actualizador|fecha_actualizacion'`.
- **BD-06 · Alta** — Las tablas _append-only_ llevan solo `usuario_creador` y `fecha_creacion`
  (`columnasAuditoriaAppendOnly`, `EntidadAppendOnlyOrm`), sin `ultimo_cambio`, sin `eliminado`, y
  con disparador `INSTEAD OF UPDATE, DELETE`. Una bitácora nueva entra en la lista del `CLAUDE.md`.
  Fuente: `CLAUDE.md` del TMS (excepción _append-only_); ADR-TMS-012; ADR-0016 punto 3; G-222.
  Detecta: `git grep -nE 'INSTEAD OF (UPDATE|DELETE)' -- "$MIG/*"`;
  `git diff $BASE...HEAD -- "$MIG" | grep -nE '^\+.*CREATE TABLE.*(bitacora|_cambio|_intento|_checkpoint|historial)'`.
- **BD-07 · Alta** — `ultimo_cambio` nunca se escribe desde el código ni aparece en un DTO de
  entrada: sale en el cuerpo de la lectura y vuelve en `If-Match`.
  Fuente: `CLAUDE.md` del TMS («Cómo viaja el valor»). Detecta:
  `git grep -nE 'ultimoCambio|ultimo_cambio' -- "$API/*dto*.ts" | grep -viE 'respuesta|lectura|ApiProperty'`;
  `git grep -nE 'SET[^;]*ultimo_cambio' -- "$API"`.
- **BD-08 · Media** — El testigo se verifica solo donde dos personas editan la misma fila (hoy
  `PATCH conductor :id/cuenta-ums` e `instalacion_portuaria :id/horas-libres`): `If-Match` mal
  formado es 400, desactualizado es 409, ausente escribe como antes (paso A).
  Fuente: `CLAUDE.md` del TMS («Alcance»); Alberto §6.2. Detecta:
  `git grep -nE "IfMatch|If-Match|UltimoCambio\(" -- "$API/*controller.ts"`. El testigo tiene dos
  extremos: tras el 409, la web toma la fila viva y deja reintentar (FE-35). Y si otro escritor
  (SAP) actualiza la fila sin cambiar nada, el 409 llega sin conflicto real (EFE-01, PRE-01).
- **BD-09 · Media** — Toda tabla nueva tiene su fila en la tabla de alcance del `CLAUDE.md` con la
  razón de si se verifica o no, y su entidad ORM.
  Fuente: `CLAUDE.md` del TMS; Alberto §6.2; G-148. Detecta: cada nombre de
  `git diff $BASE...HEAD -- "$MIG" | grep -oE 'CREATE TABLE (dbo\.)?[a-z_]+'` buscado en
  `CLAUDE.md` y en `git grep -n "@Entity(" -- "$API"`.
- **BD-10 · Alta** — `estado` solo en catálogos y maestros; `eliminado` solo donde una persona quita
  filas; ninguno de los dos en una tabla _append-only_; `eliminado` no duplica un estado de negocio
  como `ANULADO`. `vigente` es la tercera bandera, para «se tomó otra».
  Fuente: ADR-TMS-012. Detecta:
  `git diff $BASE...HEAD -- "$MIG" | grep -nE '^\+.*\b(estado|eliminado|vigente)\s+BIT'` y contestar
  la pregunta del ADR por cada columna.

## Tipos, tiempo e intercalación

- **BD-11 · Alta** — Texto en `NVARCHAR(n)`, nunca `CHAR`, `NCHAR` ni `VARCHAR`; `BIT`, `DECIMAL(p,s)`,
  `DATE` para fecha civil.
  Fuente: `CLAUDE.md` del TMS («Tipos: equivalencias»); RS-BD-SQLSERVER. Detecta:
  `git grep -niwE 'varchar|nchar|char|ntext|datetime|smalldatetime|float|money' -- "$MIG/*" "$API/*sentencias-*.ts" | grep -vE ':[0-9]+:\s*(\*|//)'`.
- **BD-12 · Alta** — Toda fecha-hora es `DATETIMEOFFSET(3)`: la precisión se declara y nada va a
  `DATETIME2` ni a UTC.
  Fuente: ADR-TMS-013 D1; `CLAUDE.md` del TMS. Detecta:
  `git grep -niP '\bdatetimeoffset\b(?!\s*\(3\))' -- "$MIG/*"`;
  `git grep -n "'datetimeoffset'" -- "$API/*orm-entity.ts"` y comprobar `precision: 3` en la línea
  siguiente; `git grep -nE "datetime2|SYSUTCDATETIME|GETUTCDATE|GETDATE\(\)" -- "$API" | grep -v '\.spec\.ts'`.
- **BD-13 · Alta** — Todo literal de fecha-hora en SQL lleva offset (`'2026-08-16 00:00:00 -05:00'`):
  sin él SQL Server asume `+00:00` y el filtro se corre cinco horas en silencio.
  Fuente: ADR-TMS-013 D2. Detecta:
  `git grep -nE "'[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]+)?)?'" -- "$API" | grep -v '\.spec\.ts'`.
- **BD-14 · Alta** — Los dos relojes de lo que llega de un dispositivo: el del cliente en su columna
  (`fecha_evento`), `fecha_creacion` siempre del servidor y jamás en un DTO de entrada.
  Fuente: ADR-TMS-013 D4; `CLAUDE.md` del TMS. Detecta:
  `git grep -nE 'fechaCreacion' -- "$API/*dto*.ts" | grep -viE 'respuesta|lectura'`.
- **BD-15 · Media** — La intercalación se fija explícita en cada `NVARCHAR` de la migración
  (`INTERCALACION` o `texto(n)`): desarrollo corre Linux y producción Windows.
  Fuente: `CLAUDE.md` del TMS (reglas críticas); ADR-TMS-007. Detecta:
  `git diff $BASE...HEAD -- "$MIG" | grep -nE '^\+.*NVARCHAR\([0-9]+\)' | grep -vE 'COLLATE|INTERCALACION'`.

## Nombres y listas cerradas

- **BD-16 · Alta** — Todo constraint e índice con nombre explícito: `pk_`, `fk_<hija>_<referencia>`,
  `uq_`, `ck_`, `df_`, `ix_`, en minúscula y sin hash de SQL Server; también en las entidades ORM.
  Fuente: ADR-TMS-014; RS-BD-SQLSERVER (prohibido). Detecta:
  `git grep -nE 'PRIMARY KEY|REFERENCES|UNIQUE|CHECK ?\(|DEFAULT ' -- "$MIG/*" | grep -v CONSTRAINT`
  (candidatos: confirmar que el `CONSTRAINT` no está en la línea anterior);
  `git grep -nP 'CREATE (UNIQUE )?((NON)?CLUSTERED )?INDEX (?!ix_|uq_|\$\{)' -- "$MIG/*"`;
  `git grep -nE '@(Index|Unique)\(\s*\[|@(Index|Unique)\(\)' -- "$API"`.
- **BD-17 · Crítica** — El `CHECK` de una lista cerrada enumera los miembros del enum a la fecha de
  la migración (`[Enum.A, Enum.B]`); nunca `Object.values(Enum)` ni cadenas sueltas. Ampliar el enum
  es una migración nueva.
  Fuente: `CLAUDE.md` del TMS («Listas cerradas»); `docs/02-diseno/restricciones-check-listas-cerradas.md`;
  Alberto §6.1; §13 error 9. Detecta:
  `git grep -nE 'Object\.(values|keys)\(' -- "$MIG/*"`;
  `git grep -nE "checkListaCerrada\([^)]*'[A-Z_]+'" -- "$MIG/*"`.
  Escenario: la cadena de migraciones deja de correr sobre una base nueva y arrastra a todas las
  siguientes.
  **Renombrar o retirar** un miembro que ya usa una migración publicada cambia el SQL de esa
  migración y obliga a editarla (BD-18). Pasó en el PR #125 con `CodigoCheckpoint.ASIGNADO` (O13).
  Detecta: `git diff $BASE...HEAD -- "$API/modules/*/domain/*.ts" | grep -nE '^-\s+[A-Z_]+ ='`, y
  por cada miembro retirado `git grep -n '\.<MIEMBRO>\b' -- "$MIG"`. Es hallazgo Alta y además va a
  «Decisiones que cuestiono»: la regla de enumerar miembros vivos rompe por diseño «una migración
  publicada no se edita». La alternativa es congelar los literales en cada migración nueva y
  versionar las huellas con una spec que las compare.
- **BD-18 · Alta** — Una migración publicada no se edita. Si una regla obliga a tocarla, el commit la
  nombra y deja la huella SHA-256 de `up()` y `down()`, igual antes y después.
  Fuente: `CLAUDE.md` del TMS (reglas críticas); `src/apps/api/README.md` («Una migración publicada
  no se edita»); G-169; G-179. Detecta: `git diff --name-status $BASE...HEAD -- "$MIG" | grep '^M'`;
  por cada una, `git log --format=%B $BASE..HEAD -- <archivo>` debe citar su huella, y
  `(cd src/apps/api && node scripts/huella-de-migracion.mjs <archivo relativo a src/apps/api>)` debe
  coincidir con la citada. La constancia vale en el commit **o** en la descripción del PR y el
  mensaje del squash. Si la auditoría ya calculó la huella, el hallazgo no se cierra hasta que
  conste donde la regla pide (O2: el reporte del 29/09 la tenía y el PR salió sin ella).

## Migraciones que mueven datos

Las únicas partes de un PR que alteran datos existentes y que un nuevo despliegue no corrige. Se
revisan por los datos que mueven, no solo por la forma del DDL.

- **BD-32 · Alta** — Un relleno de datos (backfill) no pierde nada en silencio:
  - El desempate es determinista (`ORDER BY …, id`).
  - Lo que no gana se conserva (`vigente = 0`) o se cuenta.
  - Se lanza `THROW` si las cuentas de antes y después no cuadran.
  - El `down()` devuelve lo que el `up()` quitó, o dice que no puede.

  Escenario: un conductor con tracto y carreta queda con un solo vehículo y el otro vínculo se
  borra con `DROP COLUMN`, sin rastro (O11).
  Fuente: Alberto PR#125 O11; ADR-0016 (trazabilidad). Detecta:
  `git diff $BASE...HEAD -- "$MIG" | grep -nE '^\+.*(ROW_NUMBER|DROP COLUMN|INSERT INTO [a-z_]+ ?\(.*\) ?SELECT|UPDATE [a-z_]+ SET|DELETE FROM)'`.
- **BD-33 · Alta** — Una columna nueva que un flujo pasa a exigir se siembra en la migración, o el
  despliegue trae el paso que la llena y la consulta que lo comprueba. Si una migración crea un
  catálogo sin `codigo_sunat` y la guía rechaza su ausencia, ningún conductor existente puede pedir
  guía (O12).
  Detecta: por cada columna nueva nulable del diff de `$MIG`,
  `git grep -n '<columnaEnCamelCase>' -- "$API/modules/*/domain/*"` y buscar si una regla rechaza su
  ausencia.
- **BD-34 · Media** — Una migración que cambia el estado de una fila deja coherentes las tablas
  derivadas: mover viajes a `INICIO_VIAJE` sin escribir la marca en
  `planificacion_servicio_viaje_checkpoint` deja estado y línea de tiempo en desacuerdo (V46).
  Detecta: `git diff $BASE...HEAD -- "$MIG" | grep -nE '^\+.*UPDATE [a-z_]+ SET [a-z_]*(estado|checkpoint|codigo)'`.
- **BD-35 · Media** — Los pasos intermedios del mismo cambio se funden si ninguna base compartida los
  corrió: una vista recreada tres veces o un `DEFAULT` que nace y muere en dos migraciones nuevas
  (V45). Si alguna base ya las aplicó, se quedan.
  Detecta: `git diff --name-only --diff-filter=A $BASE...HEAD -- "$MIG"` y buscar el mismo objeto
  (`CREATE OR ALTER VIEW`, `df_`) en varias de ellas.

## ORM, SQL crudo y concurrencia

- **BD-19 · Media** — El ORM es lo predeterminado; el SQL crudo solo cuando la sentencia decide, en
  un compare-and-set o en una lectura compuesta. Partir un compare-and-set en `find()` + `save()` es
  el defecto que la regla prohíbe; el `queryBuilder` en una sola sentencia cuenta como ORM.
  Fuente: ADR-TMS-023 D1 y D2. Detecta:
  `` git grep -nE '`\s*(SELECT|INSERT|UPDATE|DELETE|WITH|MERGE)\b' -- "$API" | grep -vE 'sentencias-|migraciones/|\.spec\.ts' ``
  (plantillas SQL fuera de `sentencias-*.ts`; en el TMS G-236 cuenta las que quedan). Ese grep no
  ve la plantilla que abre con salto de línea; súmale
  `git grep -nE '^\s*(SELECT|INSERT INTO|UPDATE|DELETE FROM|MERGE)\b' -- "$API" | grep -vE 'migraciones/|\.spec\.ts'`.
  Vivir en `sentencias-*.ts` no justifica el crudo: un `INSERT` de una fila o un
  `UPDATE … WHERE id = @0` sin otra condición es CRUD por clave y va por el ORM (O26).
- **BD-20 · Media** — Todo SQL crudo vive en su módulo `sentencias-*.ts` y lleva al lado por qué no
  puede ser el ORM, no qué hace.
  Fuente: ADR-TMS-023 D3. Detecta: lectura de la cabecera de cada `sentencias-*.ts` que el diff toca
  y de cada sentencia nueva: una cabecera que justifica `UPDLOCK` no justifica el `INSERT` de al
  lado. Un `sentencias-*.ts` guarda constantes SQL; una función que ejecuta consultas y arma el
  objeto de dominio va a su adaptador (V10).
- **BD-21 · Crítica** — Los parámetros nunca se interpolan: `@0`, `@1`, `@2`. Por plantilla solo
  entra una constante del dominio o un número de marcadores calculado.
  Fuente: ADR-TMS-023 D4. Detecta:
  `git grep -nE '\$\{[a-z][A-Za-z0-9_.]*\}' -- "$API/*sentencias-*.ts" "$API/modules/*/infrastructure/*"`
  y seguir cada variable hasta su origen: si puede venir del usuario, es inyección.
- **BD-22 · Alta** — Ningún módulo nombra en SQL tablas de otro: lo hace por un puerto o por una
  vista `SCHEMABINDING` del dueño.
  Fuente: ADR-TMS-015 1.5.0; G-183; G-231. Detecta:
  `(cd src/apps/api && npx --no-install jest src/shared/api/tablas-por-modulo.spec.ts)`. Esa spec
  solo recorre `modules/`: un adaptador en `shared/` que nombra tablas de dos módulos, o que
  interpola `dbo.${tabla}`, pasa sin ruido (O27). Súmale
  `git grep -nE 'dbo\.\$\{|FROM \$\{|JOIN \$\{' -- "$API/shared"`.
- **BD-23 · Crítica** — La transacción revierte de verdad: TypeORM solo revierte si el callback
  lanza, así que devolver un error desde dentro confirma lo ya escrito. El envoltorio lanza dentro y
  devuelve fuera.
  Fuente: Alberto §6.5. Detecta: `git grep -nE '\.transaction\(' -- "$API" | grep -v '\.spec\.ts'`
  y leer cada callback: un `return err(` o un `Result` fallido sin `throw` es el defecto.
- **BD-24 · Alta** — Cada escritura sobre el servicio compara en el `WHERE` el estado con el que
  decidió; si mueve menos filas de las leídas responde 409 en español (`SERVICIO_YA_PROGRAMADO`,
  `SERVICIO_YA_CAMBIO`, `HITO_YA_MARCADO`).
  Fuente: ADR-TMS-025 D1; `CLAUDE.md` del TMS («Edición concurrente»). Detecta:
  `git grep -nE -A6 'UPDATE (dbo\.)?planificacion_servicio_viaje\b' -- "$API"` y comprobar el estado de
  partida en el `WHERE` y la decisión sobre las filas movidas.
- **BD-25 · Alta** — Un upsert es `MERGE … WITH (HOLDLOCK)` o `UPDLOCK, HOLDLOCK`: sin él dos
  peticiones ven las dos «no existe» y escriben las dos.
  Fuente: RS-BD-SQLSERVER (traducción desde PostgreSQL); commit `e1bb9a1` (G-174). Detecta:
  `git grep -nE '\bMERGE\b' -- "$API" | grep -vE 'HOLDLOCK|\.spec\.ts|referencias-a-tablas'`.
- **BD-26 · Media** — Se sella el hecho; no se deduce de la ausencia de otro dato («es carga suelta»
  porque `contenedor IS NULL`).
  Fuente: Alberto §6.5; §13 error 7; G-185. Detecta:
  `git grep -nE 'IS NULL' -- "$API/*sentencias-*.ts"` y preguntar por cada uno si deduce un hecho de
  negocio.
- **BD-27 · Alta** — Toda tabla tiene entidad ORM y la integración compara cada columna mapeada con
  `INFORMATION_SCHEMA`.
  Fuente: G-148 (commit `1fc99dc`). Detecta: tablas de BD-03 frente a `git grep -hoE "@Entity\('[a-z_]+'" -- "$API"`.

## Maestras, rendimiento y seguridad

- **BD-28 · Alta** — Las maestras de SAP solo las escribe SAP por la API: `PUT` idempotente por el
  código de SAP, `DELETE` es baja lógica (`estado = 0`); la web solo edita `conductor.usuario_ums` e
  `instalacion_portuaria.horas_libres_almacenaje`.
  Fuente: ADR-TMS-024 D1 a D4. Detecta:
  `git grep -nE '@(Post|Put|Patch|Delete)\(' -- "$API/modules/flota/api/*" "$API/modules/naves/api/*" | grep -v '\.spec\.ts'`
  y, en la web, formularios de alta o edición de maestras.
- **BD-29 · Media** — Un índice de ruta crítica se justifica con el plan real; ninguna función envuelve
  la columna del `WHERE` (sargabilidad).
  Fuente: RS-BD-SQLSERVER (rendimiento). Detecta:
  `git grep -nE 'WHERE[^;]*(CONVERT|CAST|UPPER|LOWER|YEAR|MONTH|ISNULL|COALESCE)\(' -- "$API/*sentencias-*.ts"`.
- **BD-30 · Baja** — Listados que crecen sin cota no paginan con `OFFSET` profundo.
  Fuente: skill `datos-persistencia` (01). Detecta: `git grep -nE 'OFFSET [^;]*ROWS|\.skip\(' -- "$API"`.
- **BD-31 · Alta** — Ni RLS nativa ni `SESSION_CONTEXT` como control de aislamiento: la sede se
  aplica en la aplicación (ver SEG-04).
  Fuente: ADR-0010; RS-BD-SQLSERVER (prohibido). Detecta:
  `git grep -niE 'SECURITY POLICY|sp_set_session_context|SESSION_CONTEXT' -- "$API"`.
