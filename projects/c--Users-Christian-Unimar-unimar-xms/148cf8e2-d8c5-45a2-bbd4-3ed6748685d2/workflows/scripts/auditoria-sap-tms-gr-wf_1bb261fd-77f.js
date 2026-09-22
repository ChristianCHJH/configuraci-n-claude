export const meta = {
  name: 'auditoria-sap-tms-gr',
  description: 'Auditoría de solo lectura de la rama SAP-TMS-GR contra las reglas de develop traducidas a .NET',
  phases: [
    { title: 'Auditar', detail: 'cinco dimensiones en paralelo' },
    { title: 'Verificar', detail: 'un escéptico por dimensión intenta refutar cada hallazgo' },
    { title: 'Completitud', detail: 'crítico busca lo que faltó y se verifica' },
  ],
}

const SEVERIDADES = ['Crítico', 'Alto', 'Medio', 'Bajo']

const HALLAZGO = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    severidad: { type: 'string', enum: SEVERIDADES },
    tipo: { type: 'string', enum: ['DEFECTO', 'MEJORA'] },
    evidencia: { type: 'array', items: { type: 'string' } },
    que_pasa: { type: 'string' },
    por_que_importa: { type: 'string' },
    regla: { type: 'string' },
    como_deberia_ser: { type: 'string' },
    regla_ejecutable_que_lo_atraparia: { type: 'string' },
    esfuerzo: { type: 'string', enum: ['S', 'M', 'L'] },
    ya_registrado: { type: 'string' },
    verificacion: { type: 'string' },
  },
  required: ['titulo', 'severidad', 'tipo', 'evidencia', 'que_pasa', 'por_que_importa', 'regla', 'como_deberia_ser', 'regla_ejecutable_que_lo_atraparia', 'esfuerzo', 'ya_registrado', 'verificacion'],
}

const HALLAZGO_V = {
  type: 'object',
  properties: {
    ...HALLAZGO.properties,
    veredicto: { type: 'string', enum: ['CONFIRMADO', 'AJUSTADO', 'REFUTADO'] },
    razon_veredicto: { type: 'string' },
  },
  required: [...HALLAZGO.required, 'veredicto', 'razon_veredicto'],
}

const FINDINGS = {
  type: 'object',
  properties: {
    hallazgos: { type: 'array', items: HALLAZGO },
    fortalezas: {
      type: 'array',
      items: { type: 'object', properties: { texto: { type: 'string' }, evidencia: { type: 'string' } }, required: ['texto', 'evidencia'] },
    },
    decisiones_que_cuestiono: { type: 'array', items: { type: 'string' } },
    nota: { type: 'number' },
    resumen_dimension: { type: 'string' },
    comandos_ejecutados: { type: 'array', items: { type: 'string' } },
    no_verificado: { type: 'array', items: { type: 'string' } },
  },
  required: ['hallazgos', 'fortalezas', 'decisiones_que_cuestiono', 'nota', 'resumen_dimension', 'comandos_ejecutados', 'no_verificado'],
}

const VERIFIED = {
  type: 'object',
  properties: {
    hallazgos: { type: 'array', items: HALLAZGO_V },
    nota_ajustada: { type: 'number' },
    observaciones: { type: 'string' },
  },
  required: ['hallazgos', 'nota_ajustada', 'observaciones'],
}

const COMUN = `Eres un Staff Engineer auditando en SOLO LECTURA la rama feat/sap-tms-gr-rfc del repositorio unimar-xms (cwd: C:\\Users\\Christian\\Unimar\\unimar-xms). Hoy es 2026-09-15.

QUÉ AUDITAS: el diff origin/develop...HEAD (3 commits: db12467 «integrar generación de guías con SAP por RFC», 8268f2c «configurar entorno local de persistencia», d2b7000 «documentar puesta en marcha local»): 76 ficheros, unas 6.800 líneas. Componente SAP-TMS-GR: API ASP.NET Core Minimal API en net8.0 (src/apps/sap-tms-gr-api), libs Dominio (src/libs/sap-tms-gr-dominio), Aplicación (src/libs/sap-tms-gr-aplicacion), Infraestructura.Persistencia (src/libs/sap-tms-gr-infraestructura-persistencia: EF Core + SQL Server, migraciones), Infraestructura.Sap (src/libs/sap-tms-gr-infraestructura-sap: SAP .NET Connector 3.1.8 por RFC, función ZMMF_CREA_ENTREGA_TMS, con MockSapClient) y proyecto de pruebas (src/libs/sap-tms-gr-pruebas). Configuración: src/Directory.Build.props y .targets, src/docker-compose.yml, src/env.example, src/.config/dotnet-tools.json, src/.vscode/launch.json, appsettings*.json, launchSettings.json, Unimar.Xms.SapTmsGr.Api.http. Orquestado con Nx 21.6.11 + @nx-dotnet/core. SDK instalado en esta máquina: 8.0.425. Ignora src/dist (salida de compilación, no versionada). Docs del componente: reference/integraciones/sap-tms-gr/*.es.md; ADRs locales en reference/architecture/adrs/ (XMS-001..003, en Borrador: por SD-03 no vinculan).

EL CRITERIO (orden de autoridad, gana el primero):
1. Las reglas de código establecidas en develop de unimar_tms, en C:\\Users\\Christian\\Unimar\\reglas-de-codigo-alberto-develop.md (léelo ENTERO antes de empezar). Nacieron para NestJS/TypeScript/React: TRADÚCELAS a su equivalente C#/.NET 8/EF Core/NCo en vez de descartarlas. Si una regla no tiene traducción posible (p. ej. la SPA React), dilo y sigue. El prompt original de la auditoría está en promt.md (raíz del repo): sus secciones 4 (reglas del auditor), 5 (checklist) y 6 (severidad) valen, traducidas.
2. CLAUDE.md del proyecto (sección SAP-TMS-GR: arquitectura API -> Aplicación -> Dominio, tipos NCo solo dentro del adaptador SAP, ISapClient y Sap:Mode Mock|Rfc, NCo no versionado y sin rutas absolutas en .csproj, no inventar el contrato SAP, no ejecutar contra SAP por costumbre, S-34 en logs) y ADRs aceptados.
3. CLAUDE.md global del usuario (código sin comentarios, incluidos los /// XML doc; sus estándares de BD son de PostgreSQL y no aplican literalmente a SQL Server, pero sí su intención de auditoría).
4. Doctrina general (.NET, EF Core, OWASP). Si contradice a 1-3, gana 1-3 y la discrepancia va a decisiones_que_cuestiono.

Traducciones de referencia: ESLint/dependency-cruiser -> ProjectReference, using reales y pruebas de arquitectura; max-lines-per-function 50 / max-params 3 / complexity 10 / max-depth 3 / max-lines 250 -> medir métodos y ficheros C#; no-explicit-any -> object/dynamic, operador ! null-forgiving, #nullable disable, #pragma warning disable; no-floating-promises -> async void, .Result/.Wait(), Task sin await; migraciones TypeORM -> EF Core Up/Down/Designer/Snapshot; Object.values(Enum) en migración -> Enum.GetNames/GetValues o HasConversion en la configuración que alimenta migraciones; @Exige/@Publico -> RequireAuthorization/AllowAnonymous/política de fallback; helmet y límite de ritmo -> HSTS, cabeceras, AddRateLimiter, ForwardedHeaders; pino redact/Loki -> ILogger y S-34; forbidNonWhitelisted -> JsonUnmappedMemberHandling; npm audit -> dotnet list package --vulnerable; gitleaks -> búsqueda en git log -p; cobertura vitest -> coverlet.

REGLAS DEL AUDITOR:
- SOLO LECTURA: no edites, crees ni borres ficheros del repo; sin commits ni ramas. Nunca ejecutes nada contra SAP real (ni --sap-generar-entrega, ni Sap__Mode=Rfc), no levantes Docker ni SQL Server. Comandos de lectura (git log/diff/show, grep) sí. Salvo que tu dimensión lo diga expresamente, NO ejecutes dotnet build/test/restore (otro agente lo hace; compilar en paralelo rompe el directorio dist/).
- Evidencia siempre: ruta/relativa/archivo.cs:línea con TODAS las apariciones, no una de ejemplo. Sin ubicación no es hallazgo. En «verificacion» distingue hecho observado (qué leíste o ejecutaste) de inferencia.
- Antes de acusar contrasta con GAPS.md, DECISIONS.md, reference/integraciones/sap-tms-gr/preguntas-abiertas.es.md (SAP-xx, TMS-xx, PER-xx, GOB-xx) y los ADR. Si ya está registrado, el hallazgo se mantiene solo si el código añade algo que el registro no dice; rellena ya_registrado con el identificador (p. ej. «G-013, SAP-12»), o cadena vacía si no lo está. Una decisión documentada no es hallazgo: va a decisiones_que_cuestiono con argumento y costo de sostenerla.
- Detecta sobre-ingeniería con la misma seriedad que la falta de estructura. Reconoce lo bueno (fortalezas con evidencia, máximo 3 por dimensión).
- Secretos: reporta ubicación, NUNCA copies el valor.
- Escala: Crítico = seguridad (secreto real expuesto, identidad suplantable, autorización ausente en algo que crea documentos), pérdida o corrupción de datos, migración que no corre o pierde datos al revertir, ruptura de contrato con el TMS, documento duplicado o efecto irreversible en SAP sin control, respuesta que miente sobre lo que pasó en SAP. Alto = defecto latente, condición de carrera, transacción que no revierte, lógica crítica sin prueba, regla de calidad ausente o eludida, falla abierta por configuración, dato personal en claro (S-34). Medio = mantenibilidad, inconsistencia arquitectónica, duplicación con riesgo de divergencia, observabilidad incompleta. Bajo = estilo, nombres, pulido. No todo es crítico: justifica.
- Escritura en español. «que_pasa» y «por_que_importa» en lenguaje SENCILLO, 2 a 4 frases cada uno, para alguien que no ha leído el código: qué ocurre de verdad y un escenario concreto de cómo termina mal (ej.: «si el TMS reintenta tras un timeout, SAP crea una segunda entrega y nadie se entera»). Nada de teoría. «regla» cita la regla concreta (sección del documento de reglas, CLAUDE.md, ADR, S-xx) o dice «ninguna regla escrita: falta la regla». «regla_ejecutable_que_lo_atraparia»: la prueba, analizador o paso de puerta que lo habría impedido, o «no la hay».
- Un hallazgo por causa raíz, con todas sus apariciones dentro. No recortes por espacio, pero no infles.
- nota: 1 a 10 para tu dimensión.`

const DIMS = [
  {
    key: 'arquitectura',
    titulo: 'Arquitectura, fronteras y lógica de negocio',
    prompt: `DIMENSIÓN: Arquitectura, fronteras y lógica de negocio (checklist 5.1, 5.2 traducida, 5.3 y sobre-ingeniería).
Lee: todos los .csproj, src/apps/sap-tms-gr-api/**/*.cs, src/libs/sap-tms-gr-dominio/**, src/libs/sap-tms-gr-aplicacion/**; los ServiceCollectionExtensions de infraestructura solo para fronteras.
Revisa:
- Grafo real: ProjectReference y PackageReference de cada .csproj, y los using reales de cada .cs. Dominio no depende de nadie (ni Microsoft.Extensions.*, ni EF Core, ni atributos de System.Text.Json, ni SAP). Aplicación no referencia EF Core, NCo, ASP.NET Core ni proyectos de Infraestructura/API. La API solo debería tocar Infraestructura en la raíz de composición (Program.cs y extensiones de registro): ¿Endpoints, Contratos o Diagnostico usan tipos de infraestructura (MockSapClient, SapOptions, DbContext, repositorios, ISapConectividad)? Un tipo NCo fuera del adaptador es defecto (CLAUDE.md, ADR-XMS-001 D3, ADR-XMS-003 D3).
- ¿Existe un verificador ejecutable de fronteras (prueba de arquitectura NetArchTest/ArchUnitNET, analizador, regla MSBuild)? Si no, «una frontera sin verificador no es una frontera».
- Puertos: ¿están en Aplicación? ¿Hay interfaces con una sola implementación y sin prueba que las justifique (ISapConectividad)? ¿Mapeadores que no mapean, casos de uso pasamanos, capas vacías? ¿Tres o cuatro formas del mismo dato (HttpRequest -> Request de aplicación -> Solicitud del puerto -> DatosConductor) con riesgo real de divergencia, o separación justificada?
- Lógica: Intercambio.cs, EstadoIntercambio.cs, EstadoEmision.cs, GenerarDocumentoEntrega.cs, ResultadoGeneracionEntrega.cs. ¿Las transiciones de estado están protegidas en el dominio o cualquiera puede poner cualquier estado? ¿«Responder éxito sobre un trabajo que no se hizo»? ¿«Deducir un hecho de la ausencia de otro»? ¿«Dos implementaciones del mismo hecho»? ¿Literales repetidos (código de convención SAP-TMS-GR, origen TMS, textos de estado)? Orden «registrar antes de entregar» (G-003): sigue el caso de uso paso a paso y responde qué pasa si (a) falla la persistencia inicial, (b) SAP crea el documento y luego falla guardar el resultado, (c) SAP lanza excepción: ¿queda el intercambio en un estado final con rastro o colgado en EN PROCESO para siempre? ¿El GUID lo genera el dominio? ¿Fechas con DateTimeOffset y reloj inyectable (TimeProvider) o DateTime.Now/UtcNow directo?
- Umbrales 5.3 traducidos: métodos de más de 50 líneas, más de 3 parámetros (los constructores de DI dilo aparte), complejidad ciclomática mayor que 10, anidamiento mayor que 3, ficheros de más de 250 líneas. Mide contando líneas reales y cita archivo:línea de inicio. Busca object/dynamic, operador !, #nullable disable, #pragma warning disable, [SuppressMessage].
- Asincronía: async void, .Result, .Wait(), Task sin await, CancellationToken que no viaja del endpoint hasta SAP y la BD.`,
  },
  {
    key: 'seguridad',
    titulo: 'Seguridad y observabilidad',
    prompt: `DIMENSIÓN: Seguridad (5.4) y Observabilidad (5.6), con S-34 como regla vinculante del proyecto.
Lee: src/apps/sap-tms-gr-api/** entero (incluidos appsettings*.json, Properties/launchSettings.json, .http), src/docker-compose.yml, src/env.example, src/.vscode/launch.json, los ServiceCollectionExtensions y SapOptions, Rfc/*.cs, y todo lugar donde se registre (ILogger, Console).
SEGURIDAD:
- Autorización: ¿el endpoint de generación exige identidad (RequireAuthorization, política de fallback) o es anónimo? ¿Hay alguna ruta sin decidir quién la usa (diagnóstico, health, Swagger/OpenAPI en Production)? ¿Hay prueba que recorra las rutas registradas y falle si una no declara autorización? Contrasta con preguntas-abiertas TMS-01/TMS-05: si la autenticación está abierta como pregunta, ya_registrado lo dice, pero el hallazgo se mantiene si el código no falla cerrado mientras tanto.
- Fallar cerrado: valores por defecto de Sap:Mode (Mock) y de la persistencia (¿memoria por defecto?). ¿Qué pasa si en Production falta la configuración? ¿El Mock puede responder «entrega generada» falsa en producción sin que nada lo impida? ¿Hay guardia que prohíba Mock o memoria con ASPNETCORE_ENVIRONMENT=Production? CLAUDE.md declara el Mock versionado como deliberado para clonar y compilar: eso es decisión; lo que evalúas es si existe protección para producción.
- Modo manual --sap-generar-entrega (Diagnostico/ComprobacionGeneracionSap.cs y Program.cs): ¿viaja dentro del binario de producción? ¿cualquiera que ejecute el binario con ese argumento crea un documento real? ¿guarda o registra los datos que recibe por variables de entorno?
- Autor de la escritura: ¿de dónde sale quién creó el intercambio: cuerpo, constante, nada? (G-014).
- Secretos: busca en el árbol (appsettings*, launchSettings, .http, docker-compose.yml, env.example, .vscode/launch.json, .csproj, código) y en el historial de la rama (git log -p origin/develop..HEAD) contraseñas, Password=, User Id=, cuenta sa, Sap__Contrasena, cadenas de conexión con credenciales, rutas absolutas locales (C:\\Users\\...). Reporta ubicación, NUNCA el valor. Distingue contraseña de un contenedor local de desarrollo de una credencial real, cada una con su severidad justa.
- Transporte y borde: HTTPS/HSTS, límite de ritmo, ForwardedHeaders, tamaño máximo de cuerpo, página de excepción o ProblemDetails con detalle interno o stack en Production.
- Validación de entrada: en .NET 8 las Minimal APIs NO ejecutan DataAnnotations automáticamente. ¿Los [Required] y longitudes de Contratos/*.cs se validan de verdad? Sigue un cuerpo con campos nulos o vacíos hasta SAP y di qué ocurre.
OBSERVABILIDAD:
- S-34: ¿algún log, mensaje de excepción o respuesta HTTP deja en claro RUC, placa, documento, nombre, apellido o brevete del conductor, o la carga completa de petición/respuesta? Cita todas las líneas. ¿Las excepciones de NCo se propagan con datos de la llamada al cliente HTTP o a los logs?
- Log-and-throw, catch que traga el error, catch genérico sin rastro, el mismo error registrado varias veces.
- ¿Se emite el desenlace de cada petición? ¿Hay correlación con el TMS (traceparent W3C, identificador dictable devuelto)? ¿Códigos de error estables?
- Efecto irreversible (crear la entrega en SAP): ¿queda rastro suficiente para responder «¿alcanzó a crearse el documento antes de fallar?»?`,
  },
  {
    key: 'persistencia',
    titulo: 'Base de datos y migraciones',
    prompt: `DIMENSIÓN: Base de datos y migraciones (5.5), EF Core 8 sobre SQL Server. G-004 dice que xms-db es SQL Server 2016: comprueba que tipos y funciones usados existen en 2016.
Lee: src/libs/sap-tms-gr-infraestructura-persistencia/** entero (incluidas migraciones, Designer y ModelSnapshot), su .csproj, src/docker-compose.yml, src/.config/dotnet-tools.json, Program.cs (cómo se registra y si migra al arrancar), src/libs/sap-tms-gr-dominio/Intercambio.cs, reference/integraciones/sap-tms-gr/diseno-persistencia.es.md y las PER-xx de preguntas-abiertas.
Revisa contra la plantilla de tabla de las reglas de develop (sección 6 y 5.5 del prompt):
- id GUID v7 generado en el dominio (no NEWID/NEWSEQUENTIALID ni generado por la BD). En .NET 8 no existe Guid.CreateVersion7: ¿cómo lo resuelven? ¿Guid.NewGuid v4 como clave con índice clustered fragmenta?
- PK NONCLUSTERED e índice clustered por fecha_creacion; columnas de auditoría (quién con nombre de persona, cuándo con nombre de acción); ultimo_cambio ROWVERSION y si algún UPDATE lo compara de verdad (IsRowVersion/IsConcurrencyToken y manejo de DbUpdateConcurrencyException); NVARCHAR; DATETIMEOFFSET(3) y no datetime2 ni datetimeoffset(7) por defecto; estado/eliminado solo si su pregunta tiene respuesta (¿el intercambio es append-only? PER-12); nombres explícitos de constraints e índices pk_, fk_, uq_, ck_, df_, ix_ (EF genera PK_ e IX_ por defecto); tablas y columnas en español snake_case singular.
- Migraciones: lee Up() y Down() de 20260910162850_EsquemaInicialIntercambios y 20260911222621_NumeroSeguimientoOpcional. ¿El Down() de NumeroSeguimientoOpcional (que devuelve NOT NULL a una columna) falla o pierde datos si ya hay filas con NULL? ¿Hay CHECK constraints derivados del enum vivo en IntercambioConfiguracion (Enum.GetNames/GetValues, string.Join sobre el enum, HasConversion<string>)? Si la migración congeló literales pero la configuración los deriva del enum, di qué pasa cuando el enum cambie. ¿Designer y ModelSnapshot son coherentes con la configuración actual? No compiles ni ejecutes dotnet ef (otro agente compila y no hay base levantada): si algo solo se puede comprobar ejecutando, márcalo no verificado.
- IntercambiosDbContextFactory (tiempo de diseño): ¿cadena de conexión con credenciales o ruta en el código?
- Repositorios: compara RepositorioIntercambiosSqlServer con RepositorioIntercambiosEnMemoria: ¿se comportan igual ante concurrencia, unicidad, no encontrado y errores? Si las pruebas o el modo por defecto usan memoria, ¿certifican algo que SQL no cumple? SaveChanges, tracking, transacciones reales, vida del DbContext (scoped/singleton), SQL crudo (FromSqlRaw/ExecuteSqlRaw) con interpolación. ¿Índice único que dé idempotencia de entrada (cita, número de seguimiento)?
- ServiceCollectionExtensions de persistencia: ¿qué pasa si falta la cadena de conexión: error al arrancar o cae a memoria en silencio y se pierden intercambios al reiniciar?
- ¿Se aplican migraciones al arrancar (Database.Migrate) y en qué ambientes?
- Contrasta lo que diseno-persistencia.es.md y guia-de-puesta-en-marcha.es.md prometen contra lo construido.`,
  },
  {
    key: 'sap-contratos',
    titulo: 'Adaptador SAP y contratos con el TMS',
    prompt: `DIMENSIÓN: Adaptador SAP (NCo 3.1.8) y contratos HTTP con el TMS (5.7 traducida).
Lee: src/libs/sap-tms-gr-infraestructura-sap/** entero y su .csproj, src/libs/sap-tms-gr-aplicacion/Puertos/*.cs, src/apps/sap-tms-gr-api/Contratos/*.cs, Endpoints/*.cs, Program.cs, Diagnostico/*.cs, reference/integraciones/sap-tms-gr/diseno-sap-rfc.es.md, reference/architecture/adrs/XMS-003*.es.md y las SAP-xx y TMS-xx de preguntas-abiertas.
SAP:
- Contención: ¿algún tipo SAP.Middleware.Connector aparece fuera del adaptador (incluida la API y Diagnostico)? Usa Grep sobre src/apps y src/libs excluyendo dist.
- .csproj del adaptador: ¿cómo referencia NCo (HintPath desde SAP_NCO_PATH)? ¿alguna ruta absoluta local? ¿compila sin NCo en modo Mock (condicionales)? ¿PlatformTarget x64 declarado (NCo es solo Windows x64) o compila AnyCPU y falla en tiempo de ejecución? ¿Qué pasa en Linux/contenedor?
- SapDestinationFactory y SapConectividadRfc: RfcDestinationManager.RegisterDestinationConfiguration solo admite un registro por proceso. ¿Se protege contra doble registro (pruebas, WebApplicationFactory, dos llamadas)? ¿Hilos concurrentes? ¿Parámetros de pool y timeout, y cuánto cuelga la petición HTTP si SAP no responde? ¿Credenciales expuestas por ToString o logs de SapOptions?
- SapRfcClient: ¿crea IRfcFunction por llamada? ¿Longitudes SAP: trunca en silencio o falla? Regla de éxito sobre T_RETURN: ¿el código decide E/A/X por su cuenta pese a que SAP-15 y SAP-16 siguen abiertas y la regla es «no se inventa»? ¿Qué hace con E_VBELN vacío y T_RETURN vacío? ¿Distingue RfcCommunicationException / RfcLogonException / RfcAbapException (técnico frente a negocio)? CLAVE: ¿distingue «no sé si SAP creó el documento» (timeout o corte tras enviar) de «SAP no lo creó»? Ese hueco es el que duplica documentos (G-013).
- MapeadorDatosConductor y MapeadorRetornoSap: nulos, formatos, ceros a la izquierda en E_VBELN, I_DCOND, campos de ZZTRAN.
- MockSapClient: ¿inventa contrato que las pruebas terminan certificando? ¿Puede quedar activo en producción por omisión?
- SapOptions y ServiceCollectionExtensions: ¿validación al arrancar (ValidateOnStart) o falla en la primera petición? ¿Modo desconocido o vacío -> excepción o Mock en silencio?
CONTRATOS HTTP (API <-> TMS):
- ¿Los nombres JSON coinciden con el contrato acordado (cita, placa, ip, conductor con cinco campos, TMS-01)? ¿Campos desconocidos (System.Text.Json los ignora: un campo mal escrito por el TMS se pierde en silencio)? ¿Nulo frente a vacío? ¿Enums en el cable toleran valores desconocidos?
- Respuesta: ¿los códigos HTTP dicen la verdad sobre lo que pasó en SAP (éxito, rechazo de negocio, fallo técnico, resultado incierto)? ¿«éxito sobre trabajo no hecho»? ¿Sobre de respuesta estandarizado o ProblemDetails, y hay decisión escrita?
- Idempotencia de entrada: si el TMS reintenta la misma petición tras un timeout, ¿XMS lo detecta (clave de idempotencia, índice único) o llama a SAP otra vez? G-013/SAP-12 registran el lado SAP; evalúa si el lado XMS tiene mitigación posible sin esperar a SAP y si el código la tiene.
- Cambio de contrato en dos pasos: ¿algo de esta rama rompe a un TMS que ya llame con la forma anterior?`,
  },
  {
    key: 'puerta',
    titulo: 'La puerta, pruebas y estilo',
    prompt: `DIMENSIÓN: La puerta (5.10), Pruebas (5.8) y Estilo/convenciones (5.9). Eres el ÚNICO agente de este workflow autorizado a compilar y correr pruebas.
Ejecuta (PowerShell o Bash) y resume la salida con conteos, errores y advertencias con archivo:línea:
1. En src/: dotnet --version y si hay global.json en el repo.
2. En src/: dotnet restore y dotnet build -nologo de apps/sap-tms-gr-api/Unimar.Xms.SapTmsGr.Api.csproj y de libs/sap-tms-gr-pruebas/Unimar.Xms.SapTmsGr.Pruebas.csproj. Cuenta advertencias por código (CS86xx de nulabilidad, CA, etc.). Sin Sap__Mode=Rfc, sin SAP_NCO_PATH, sin credenciales: la regla del proyecto es que compila sin NCo; si no compila así, es hallazgo.
3. dotnet test del proyecto de pruebas. Si referencia coverlet.collector, añade --collect:"XPlat Code Coverage" con --results-directory apuntando a una carpeta temporal FUERA del repo (p. ej. $env:TEMP) y resume cobertura de líneas y ramas por ensamblado.
4. dotnet list <csproj> package --vulnerable --include-transitive para cada .csproj (si no hay red, dilo). Si existe src/node_modules: npm audit --omit=dev --audit-level=high en src/ y npx nx run-many -t lint (si falla por entorno, dilo).
5. Si es rápido: dotnet format <csproj> --verify-no-changes --no-restore.
NUNCA: ejecutar la API, --sap-generar-entrega, Sap__Mode=Rfc, Docker, editar ficheros, commitear.
PUERTA: lee .husky/pre-push y .github/workflows/gobernanza.yml. ¿Algún paso compila o prueba .NET, analiza estático C#, busca secretos o audita dependencias? DECISIONS.md, bloque analisis-estatico: ¿la fila dotnet sigue en no-presente con seis .csproj en el árbol (G-008 dice que se redeclara con el primer .csproj)? Directory.Build.props/.targets, .editorconfig y .csproj: ¿Nullable enable, TreatWarningsAsErrors, AnalysisLevel/EnableNETAnalyzers, EnforceCodeStyleInBuild, reglas de tamaño y complejidad (CA1502, CA1506)? Si no existen, di qué reglas ejecutables faltan para que el código nuevo esté bajo los umbrales de develop. Mira git log origin/develop..HEAD: ¿algún commit no habría pasado lo que la documentación dice que la puerta exige? ¿La guía de puesta en marcha afirma comandos o pasos que no existen?
PRUEBAS: lista clases de producción con y sin prueba (GenerarDocumentoEntrega, Intercambio y sus transiciones, RepositorioIntercambiosSqlServer y EnMemoria, SapRfcClient, SapDestinationFactory, MapeadorRetornoSap, MapeadorDatosConductor, endpoint HTTP, Program/DI, ComprobacionGeneracionSap). ¿Alguna prueba afirma sobre la implementación en vez del comportamiento? ¿Alguna seguiría verde si se retira lo que dice proteger? Razona la mutación concreta en cada prueba importante. ¿Hay pruebas de integración de la API (WebApplicationFactory) o de migraciones? ¿Un solo proyecto de pruebas bajo libs/ mezclando capas?
ESTILO: (a) Comentarios: la regla global del usuario prohíbe todo comentario en código, incluidos /// y //; las reglas de develop solo admiten el porqué. Cuenta comentarios por fichero con Grep (-c sobre ^\\s*(///|//|/\\*)) excluyendo Migraciones/*.Designer.cs y ModelSnapshot (generados, dilo) y clasifica muestras: ¿explican el qué, son banderines de sección, o un porqué real? Reporta por fichero con conteo, no línea a línea. (b) Identificadores en inglés no impuestos por la plataforma: distingue impuesto (Program, ServiceCollectionExtensions por convención) de elegido; ISapClient y Sap:Mode los nombra CLAUDE.md del proyecto: si está documentado es decisión y va a decisiones_que_cuestiono. (c) Ficheros que se distinguen por una palabra o singular/plural y confunden desde el autocompletado (GenerarDocumentoEntregaRequest frente a GenerarDocumentoEntregaHttpRequest). (d) Console.WriteLine en código de producto.`,
  },
]

function promptVerificar(titulo, hallazgos, puedeEjecutar) {
  return `${COMUN}

TU PAPEL: verificador escéptico de la dimensión «${titulo}». Abajo tienes en JSON los hallazgos que produjo otro auditor. Para CADA uno:
1. Abre cada archivo:línea citado y comprueba que el código dice exactamente eso. Corrige líneas mal citadas y añade apariciones que falten (usa Grep).
2. Intenta REFUTARLO: ¿se valida o protege en otro sitio (Program.cs, DI, filtro, middleware, configuración por ambiente)? ¿Es una decisión documentada en CLAUDE.md, un ADR, DECISIONS.md o la documentación del componente? ¿Ya está en GAPS.md o preguntas-abiertas? (entonces rellena ya_registrado; se mantiene solo si el código aporta algo que el registro no dice). ¿La regla citada existe y dice eso? ¿Es preferencia personal y no riesgo?
3. Veredicto: CONFIRMADO (tal cual), AJUSTADO (real, pero corriges severidad, evidencia, redacción o regla), REFUTADO (no se sostiene; explica por qué en razon_veredicto). Si no puedes comprobarlo leyendo${puedeEjecutar ? ' o ejecutando' : ''}, no lo confirmes: AJUSTADO con verificacion que empiece por «no verificado:» si es plausible, REFUTADO si es especulación.
4. Recalibra la severidad con la escala, en los dos sentidos: sube lo subestimado y baja lo inflado.
5. Reescribe que_pasa y por_que_importa si no son sencillos y concretos (2 a 4 frases, escenario real, sin jerga innecesaria).
${puedeEjecutar ? 'Puedes volver a ejecutar dotnet build/test si necesitas confirmar una salida.' : 'No ejecutes dotnet build/test/restore.'}
Devuelve TODOS los hallazgos, también los refutados con su veredicto. nota_ajustada: la nota de la dimensión tras verificar.

HALLAZGOS:
${JSON.stringify(hallazgos, null, 1)}`
}

function sinVerificar(hallazgos) {
  return hallazgos.map(h => ({ ...h, veredicto: 'CONFIRMADO', razon_veredicto: 'SIN VERIFICAR: el verificador no respondió' }))
}

const resultados = await pipeline(
  DIMS,
  d => agent(`${COMUN}\n\n${d.prompt}`, { label: `auditar:${d.key}`, phase: 'Auditar', schema: FINDINGS }),
  (r, d) => {
    if (!r) return null
    log(`${d.titulo}: ${r.hallazgos.length} hallazgos, nota ${r.nota}`)
    return agent(promptVerificar(d.titulo, r.hallazgos, d.key === 'puerta'), { label: `verificar:${d.key}`, phase: 'Verificar', schema: VERIFIED })
      .then(v => ({
        key: d.key,
        titulo: d.titulo,
        auditoria: r,
        verificados: v ? v.hallazgos : sinVerificar(r.hallazgos),
        nota_ajustada: v ? v.nota_ajustada : r.nota,
        observaciones: v ? v.observaciones : 'verificador sin respuesta',
      }))
  },
)

const vivos = resultados.filter(Boolean)
const caidas = DIMS.filter((d, i) => !resultados[i]).map(d => d.titulo)
if (caidas.length) log(`Dimensiones sin resultado: ${caidas.join(', ')}`)

const mapa = vivos.map(x => ({
  dimension: x.titulo,
  hallazgos: x.verificados.filter(h => h.veredicto !== 'REFUTADO').map(h => ({ titulo: h.titulo, evidencia: h.evidencia })),
  no_verificado: x.auditoria.no_verificado,
}))

phase('Completitud')
const critica = await agent(`${COMUN}

TU PAPEL: crítico de completitud. Cinco auditores revisaron por dimensión; abajo están sus hallazgos confirmados (título y evidencia) y lo que declararon no verificado${caidas.length ? `, más estas dimensiones que NO produjeron resultado y debes cubrir tú: ${caidas.join(', ')}` : ''}. Tu trabajo es encontrar lo que FALTA:
1. git diff --name-only origin/develop...HEAD. Cada fichero de código o configuración que no aparezca en ninguna evidencia: ábrelo y revísalo contra el checklist 5.11 de promt.md traducido a C#.
2. Barrido de anti-patrones 5.11 sobre src/apps y src/libs (excluye src/dist): object/dynamic, operador !, #pragma, catch que traga, log-and-throw, Console.WriteLine, dato personal en log, literal repetido que debería ser constante, DateTime.Now/UtcNow sin offset, Task sin await, async void, .Result, SQL crudo, ruta absoluta, TODO/FIXME.
3. Contrasta la documentación nueva de la rama (reference/integraciones/sap-tms-gr/guia-de-puesta-en-marcha.es.md, plan-de-implementacion.es.md, diseno-*.es.md, README.md) contra el código: afirmaciones que el árbol no cumple, comandos que no existen, rutas que no resuelven («la prosa se contrasta contra el árbol»).
4. Cruces entre dimensiones que nadie vio: combinaciones de defectos que por separado parecen menores y juntos no (p. ej. Mock por defecto + persistencia en memoria + endpoint anónimo).
Devuelve SOLO hallazgos nuevos, no repitas los de la lista, verificados leyendo tú mismo el código. Si no hay nada nuevo, lista vacía y dilo en resumen_dimension. No ejecutes dotnet build/test.

MAPA DE LO YA ENCONTRADO:
${JSON.stringify(mapa, null, 1)}`, { label: 'completitud', phase: 'Completitud', schema: FINDINGS })

let criticaVerificada = null
if (critica && critica.hallazgos.length) {
  log(`Completitud: ${critica.hallazgos.length} hallazgos nuevos a verificar`)
  criticaVerificada = await agent(promptVerificar('Completitud (transversal)', critica.hallazgos, false), { label: 'verificar:completitud', phase: 'Completitud', schema: VERIFIED })
}

return {
  dimensiones: vivos.map(x => ({
    key: x.key,
    titulo: x.titulo,
    nota: x.nota_ajustada,
    resumen: x.auditoria.resumen_dimension,
    observaciones_verificador: x.observaciones,
    fortalezas: x.auditoria.fortalezas,
    decisiones_que_cuestiono: x.auditoria.decisiones_que_cuestiono,
    comandos_ejecutados: x.auditoria.comandos_ejecutados,
    no_verificado: x.auditoria.no_verificado,
    hallazgos: x.verificados,
  })),
  completitud: critica ? {
    resumen: critica.resumen_dimension,
    fortalezas: critica.fortalezas,
    decisiones_que_cuestiono: critica.decisiones_que_cuestiono,
    no_verificado: critica.no_verificado,
    hallazgos: criticaVerificada ? criticaVerificada.hallazgos : sinVerificar(critica.hallazgos),
  } : null,
  dimensiones_caidas: caidas,
}
