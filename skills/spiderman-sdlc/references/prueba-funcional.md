# Prueba funcional de punta a punta — guía práctica

Lo que funcionó en el cambio 0004 (balanza de SAP → XMS → TMS) y las trampas que aparecieron.
Adáptalo al sistema que toque; las rutas y claves son las de desarrollo local de Unimar.

## Entorno

| Pieza | Cómo |
| --- | --- |
| Motor | SQL Server 2016 nativo en Windows, `localhost,14330`, usuario `sa` (la clave está en la memoria del proyecto) |
| Base del TMS | `sqlcmd ... -Q "CREATE DATABASE tms_e2e_NNNN"`; la API la migra al arrancar con `DB_CORRER_MIGRACIONES=true` |
| Base de XMS | `ConnectionStrings__XmsDb=...;Database=xms_e2e_NNNN;...` y `dotnet ef database update --project libs/sap-mdm-infraestructura-persistencia --msbuildprojectextensionspath dist/intermediates/libs/sap-mdm-infraestructura-persistencia/obj` |
| API del TMS | Puerto 3001 (el que espera XMS en desarrollo), variables de `.env.example` más las de la base |
| XMS SAP MDM | `dotnet run --project apps/xms-sap-mdm/Unimar.Xms.SapMdm.Api.csproj --launch-profile http` (puerto 5140), con `Tms__UrlBase=http://127.0.0.1:3001/api/v1` y `Tms__ClaveApi=desarrollo-maestras-sap` |

## Simular al sistema externo

- SAP → XMS: el SOAP real, sacado de `apps/xms-sap-mdm/Unimar.Xms.SapMdm.Api.http`, mandado con
  `curl -X POST http://localhost:5140/MaestrosSap.svc -H 'Content-Type: text/xml; charset=utf-8' -H 'SOAPAction: "urn:unimar:xms:sap-mdm:v1/MaestrosSap/<Operacion>"' --data-binary @archivo.xml`.
- Forzar la entrega de XMS al TMS: `POST /entrega-tms/sincronizar` con `x-api-key: desarrollo-sincronizacion`.
- Llamar al TMS directo, para aislar un problema: `POST /api/v1/...` con la clave de sistema de `.env.example`.

## Sembrar

- Reusa los ayudantes de las pruebas de integración (`src/pruebas-integracion/`: `abrirBaseReal`,
  `SiembraDePlanificacion`) en un script temporal `*.tmp.ts` corrido con
  `PRUEBAS_BD_NOMBRE=<base> DB_HOST=… npx ts-node --transpile-only <script>`. Bórralo al terminar.
- Lo que en el sistema llega de SAP (por ejemplo `instalacion_portuaria`) no lo siembran las
  migraciones: insértalo a mano, como hace `preparar-base.ts`.
- Dale un sufijo a placas, BL y contenedores (`SUFIJO=02`) para poder sembrar otra tanda sin chocar
  con la anterior.

## Comprobar

- En cada base, una consulta que muestre por caso: estado, abierto o cerrado, lo escrito y lo que no
  se escribió. En el vecino, su bitácora (estado, intentos, si reintenta, detalle).
- Tabla final: caso → respuesta → cómo quedó cada sistema.

## Trampas conocidas

- **Git Bash no le pasa `TZ` a los programas nativos de Windows.** La API del TMS exige
  `TZ=America/Lima` y no arranca: levántala desde PowerShell. El log de PowerShell (`*>`) sale en
  UTF-16: léelo con `iconv -f UTF-16LE -t UTF-8`.
- **`.env.example` trae `\r`:** si lo cargas desde bash, quita el retorno de carro.
- **El árbol de trabajo puede haber cambiado de rama** (Christian trabaja en paralelo). Antes de
  creer un resultado raro, confirma que el `dist` tiene tu código (`grep` de un nombre nuevo). Si no,
  levanta desde un `git worktree` de tu rama con una unión a `node_modules`
  (`cmd /c mklink /J <worktree>\src\apps\api\node_modules <repo>\src\apps\api\node_modules`).
- **Antes de borrar el worktree, quita la unión** (`cmd /c rmdir <unión>`): si no, el borrado puede
  entrar a los `node_modules` reales. Comprueba que siguen ahí.
- **`sqlcmd` contra tablas con índices filtrados necesita `-I`** (`QUOTED_IDENTIFIER`).
- **`/entrega-tms/sincronizar` no espera el tiempo entre reintentos:** en un bucle gasta los 10
  intentos en minutos. Para probar un reintento: un intento, cambias el dato, un intento más.
- **Esperar a un servicio:** el sleep en primer plano está bloqueado; usa un bucle `until` en
  segundo plano (`run_in_background`) que salga cuando responda `/salud` o el WSDL.

## Limpieza

1. Detener los procesos por puerto (`Get-NetTCPConnection -LocalPort <p> -State Listen` → `Stop-Process`).
2. Quitar uniones y borrar el worktree; `git worktree prune`.
3. `ALTER DATABASE <b> SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE <b>;` por cada base.
4. Borrar los scripts temporales. Comprobar que no quede ninguna base `%e2e%` ni archivo `*.tmp.ts`.
