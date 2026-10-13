# Checklist — infraestructura y despliegue (IIS, PowerShell, T-SQL de servidor, scripts de datos)

Cubre lo que corre en un servidor y no en la API: `src/infra/**` (guiones `.ps1`, `web.config`,
T-SQL de creación de base, servicio NSSM, README de despliegue), `datos-prueba/**`, `scripts/**` y
los `.env.example`. El 🔴 del PR #125 cayó aquí: `robocopy /MIR` purgaba el almacén de adjuntos en
cada publicación. La auditoría previa no lo vio porque ningún checklist cubría esta carpeta.

Fuentes: ADR-TMS-026 (entornos y UAT), ADR-0165 (P-SEC, mínimo privilegio), ADR-0016 (bitácoras
inmutables), el `CLAUDE.md` del TMS (comentarios mínimos) y la revisión de Alberto al PR #125
(`Alberto PR#125 · O<n>`).

Regla de lectura: un guion de despliegue se lee **junto** con lo que toca. El inventario del
servidor, el `.env` de ejemplo, la configuración de la API y el README se cruzan con el guion: el
defecto suele estar entre dos archivos, no dentro de uno (O1 junta tres; O9 junta README,
`data-source` y guion).

Variables, a pegar delante en la misma llamada: `BASE=origin/develop; INFRA=src/infra`.

## Lo que borra y lo que se pierde

- **INF-01 · Crítica** — Un borrado en espejo (`robocopy /MIR` o `/PURGE`, `rsync --delete`,
  `Remove-Item -Recurse`) sobre la carpeta de una aplicación excluye todo lo que la aplicación
  escribe ahí en ejecución: almacén de archivos, logs, `.env`, herramientas. Se cruza con la ruta
  real del almacén: `ARCHIVOS_RUTA` del inventario y del `.env`, y su valor por omisión relativo en
  `configuracion-archivos.ts`.
  Escenario: cada publicación borra los Excel recibidos y las fotos del conductor, y las filas de
  `documento_servicio` apuntan a archivos que no existen (O1).
  Detecta: `git grep -nE 'robocopy.*(/MIR|/PURGE)|rsync .*--delete|Remove-Item .*-Recurse' -- "$INFRA" scripts datos-prueba`;
  por cada uno, su `/XD` frente a
  `git grep -nE 'ARCHIVOS_RUTA|almacen|RUTA_|_DIR\b|logs' -- src/apps/api/src "$INFRA" '*.env*'`.
- **INF-02 · Alta** — Hay respaldo antes de migrar (`BACKUP DATABASE … WITH COPY_ONLY, CHECKSUM`) y
  el `RESTORE` está escrito. Un README que llama al respaldo «el único rollback real» sin un paso que
  lo cree promete una vuelta atrás que no existe (O10).
  Detecta: `git grep -niE 'BACKUP DATABASE|RESTORE DATABASE|rollback|revert' -- "$INFRA"`.
- **INF-03 · Alta** — El orden de despliegue es: detener → copiar → migrar con el `dist` **nuevo** →
  arrancar → verificar. Migrar con la build vieja, o con el servicio arriba mientras una migración
  borra o renombra columnas, deja errores 500 en la ventana (O9).
  Detecta: en el README de despliegue, el paso de `migration:run` frente al paso que copia el
  paquete y al que arranca el servicio; cruzar con las migraciones del diff que hacen `DROP COLUMN`
  o `sp_rename`.

## Guiones que dicen la verdad

- **INF-04 · Alta** — Cada ejecutable nativo de un guion comprueba `$LASTEXITCODE`. En Windows
  PowerShell 5.1, `$ErrorActionPreference='Stop'` no detiene un nativo que falla: un `nssm set` que
  no aplica `NODE_ENV=production` pasa en silencio y el guion termina en verde (O6). `robocopy` es la
  excepción: éxito es menor que 8.
  Detecta: `git grep -nE "^\s*&\s|\b(nssm|sqlcmd|icacls|netsh|appcmd|robocopy|sc\.exe)\b" -- '*.ps1'`
  y, por cada línea, `$LASTEXITCODE` en las siguientes.
- **INF-05 · Media** — El chequeo final falla de verdad: si `/salud` no responde `success: true`, el
  guion lanza y sale distinto de cero. Nada de esperas fijas (`Start-Sleep 8`) seguidas de un aviso
  en rojo con código 0 (V43).
  Detecta: `git grep -nE 'Start-Sleep|Write-Host .*-ForegroundColor Red' -- '*.ps1'`.
- **INF-06 · Media** — Un guion que se declara idempotente aguanta una segunda ejecución: cada alta
  (`New-*`, `Add*`, `AddSslCertificate`, `CREATE LOGIN`) comprueba antes si ya existe (V42).
  Detecta: `git grep -niE 'idempotent' -- "$INFRA"` y leer cada alta del archivo.
- **INF-07 · Media** — Un script de datos de prueba no escribe en una base real. Aborta si
  `NODE_ENV=production` o si `DB_NOMBRE` no está en una lista de bases de desarrollo, muestra contra
  qué base va, pide confirmación, cierra la aplicación en `finally` y sale con 1 ante error (O15).
  Detecta: `git ls-files datos-prueba scripts | grep -E '\.(ts|mjs|js)$'` y, en cada uno que abra
  `AppModule` o un `DataSource`, buscar la guarda.

## Mínimo privilegio

- **INF-08 · Alta** — El servicio no corre como `LocalSystem`: fija `ObjectName` (cuenta virtual
  `NT SERVICE\<servicio>`), y la ACL del `.env` está cerrada con `icacls /inheritance:r` (O5).
  Detecta: `git grep -nE 'nssm (install|set)|ObjectName|icacls' -- '*.ps1'`.
- **INF-09 · Alta** — La cuenta de la aplicación en la base solo lee y escribe: `db_ddladmin` y
  `db_owner` son de una cuenta de migración aparte. Un `db_ddladmin` puede deshabilitar el disparador
  `INSTEAD OF` que protege las bitácoras (O4). `sa` queda deshabilitado al terminar (O7).
  Detecta: `git grep -niE "db_ddladmin|db_owner|sp_addrolemember|ALTER ROLE|ALTER LOGIN sa" -- "$INFRA" '*.sql'`.
- **INF-10 · Alta** — Una regla de firewall abre solo a quien la necesita (`-RemoteAddress`), y
  ninguna clave viaja en la línea de comandos (`/SAPWD`, `-Password`): queda visible en la lista de
  procesos. Un `SecureString` convertido se libera con `ZeroFreeBSTR` en un `finally` (O7, V43).
  Detecta: `git grep -nE 'New-NetFirewallRule|/SAPWD|-Password |PtrToStringBSTR|ZeroFreeBSTR' -- '*.ps1'`.
- **INF-11 · Media** — Una herramienta de la que depende el servicio vive en su propia carpeta, no
  en la de otra aplicación que se republica con `/MIR` (V44, `nssm.exe` del Tablero SDLC).
  Detecta: `git grep -nE 'C:\\apps\\[a-z-]+' -- '*.ps1'` y comprobar que cada ruta es de la propia
  aplicación.

## Equivalencia entre despliegues

- **INF-12 · Alta** — El despliegue de IIS emite las mismas cabeceras de seguridad que el nginx del
  chart: `Content-Security-Policy` con `frame-ancestors 'none'`, `X-Content-Type-Options`,
  `Referrer-Policy` y `Permissions-Policy`. Además quita `X-Powered-By` y `Server` (O3). Un archivo
  que se declara «equivalente» de otro se compara con él línea por línea.
  Detecta: `grep -nE 'add_header' src/infra/tms-helm/templates/web-nginx-configmap.yaml` frente a
  `git grep -nE 'customHeaders|<add name=' -- '*web.config'`.
- **INF-13 · Media** — Lo que UAT hace distinto de lo que dice el ADR (versión del motor, instancia
  compartida, nombre de la base) está declarado en el ADR con su criterio de retiro (O8, ADR-TMS-026
  D4, D7 y D8; GOB-12).
  Detecta: en los README de `$INFRA`, tablas «qué dice el estándar» con celdas «sin declarar» o
  «pendiente».

## Higiene del repositorio

- **INF-14 · Media** — El repositorio no publica la topología interna: IPs fijas, DNS internos,
  controlador de dominio, puertos y versiones van al inventario de operaciones, no al árbol (V39).
  Detecta: `git grep -nE '\b10\.[0-9]+\.[0-9]+\.[0-9]+\b|\b192\.168\.[0-9]+\.[0-9]+\b' -- docs "$INFRA" apps`.
- **INF-15 · Media** — Un `.env.example` trae valores seguros: la API escucha en `127.0.0.1` y el
  usuario de ejemplo no es `sa` (V41).
  Detecta: `git grep -nE '^(API_DIRECCION|HOST)=0\.0\.0\.0|^DB_USUARIO=sa\b' -- '*.env*'`.
- **INF-16 · Baja** — Los `.ps1` y los `.sql` siguen la regla de comentarios del `CLAUDE.md` (BE-36):
  sin banderines (`-- ====`, `# ────`) y sin estado con fecha que caduca («YA EXISTE», «28 tablas»).
  Ese estado va al inventario (V40).
  Detecta: `git grep -nE '^\s*(--|#)\s*[=─━-]{4,}' -- "$INFRA"`;
  `git grep -nE 'YA EXISTE|[0-9]+ (tablas|migraciones)' -- "$INFRA"`.
