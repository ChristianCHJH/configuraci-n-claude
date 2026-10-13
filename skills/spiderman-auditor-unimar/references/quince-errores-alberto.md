# Los quince errores que más se repitieron

Fuente: `C:\Users\Christian\Unimar\reglas-de-codigo-alberto-develop.md` §13, la lista corta de lo que
Alberto corrigió una y otra vez en `develop` del TMS. Cruzan todas las capas, así que esta pasada se
hace **siempre**, sobre todo el alcance, después de los checklists por área.

Cada error trae dónde buscarlo y el ítem de checklist que lo cubre en detalle. El ID del hallazgo en
el reporte es el del ítem de área; «Alberto §13 error N» va en la columna de fuente junto a él.

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; WEB=src/apps/web/src`.

## Los quince

1. **Una regla escrita en la documentación que ninguna herramienta ejecuta.** Toda frase normativa
   nueva («prohibido», «nunca», «siempre», «debe») del diff tiene su ejecutor: regla de ESLint, de
   `depcruise`, una spec o un validador. Si no, es una intención.
   Busca: `git diff $BASE...HEAD -- '*.md' | grep -nE '^\+.*\b(prohibid|nunca|siempre|obligatori|DEBE|no se admite)'`
   y localiza el ejecutor de cada una. Cubre: GOB-23, PR-05.
2. **Una lista de exenciones que crece sin que nadie la mire.** Exenciones de umbrales, aristas
   toleradas, `allowlist` de gitleaks, `nosemgrep`, piso de cobertura que baja, base de
   `comentarios-cortos` que sube.
   Busca: `git diff $BASE...HEAD -- src/apps/api/.eslintrc.cjs src/apps/web/eslint.config.js src/apps/api/.dependency-cruiser.cjs .gitleaks.toml src/apps/api/scripts/piso-de-cobertura-infraestructura.json src/apps/api/src/shared/api/comentarios-cortos.spec.ts`
   y comprueba que cada lista solo encoge. Cubre: BE-12, BE-15, PR-01.
3. **Dos implementaciones del mismo hecho que coinciden por casualidad y nada lo declara.** Un
   predicado de negocio en la web que la API ya decide; una lista cerrada copiada en dos sitios; un
   nivel de log tipado distinto en cliente y servidor.
   Busca: por cada constante o predicado nuevo, su gemelo en la otra aplicación **y en la misma**:
   tres adaptadores de la API con la misma regla de la cuenta UMS (O20) o dos tablas de estados en
   dos funcionalidades de la web (V23). Cubre: FE-01, FE-02, BE-28, DIS-01.
4. **Un dato de confianza que viaja en el cuerpo de la petición en vez de en la sesión o el token.**
   Autor, sede, rol, permiso, identificador de conductor.
   Busca: `git diff $BASE...HEAD -- "$API/*dto*.ts" | grep -nE '^\+\s+(usuario|autor|idSucursal|sede|rol|permiso|idConductor)[?!]?:'`.
   Cubre: SEG-01, SEG-02, AND-05.
5. **Un valor por defecto que falla abierto.** Modo del guard, interruptor de autenticación, clave
   de sistema con valor de desarrollo, `catch` que devuelve `true`.
   Busca: `git diff $BASE...HEAD -- "$API" | grep -nE "^\+.*((\?\?|\|\|) (true|'auditoria')|return true)"`.
   Cubre: SEG-05, SEG-06, SEG-08.
6. **Un literal repetido que el día que alguien retoque uno solo rompe en silencio.** Un color, una
   clave de react-query, un tope, un prefijo, un nombre de tabla.
   Busca: `git grep -hoE "'[A-Z][A-Z_]{3,}'" -- "$API" "$WEB" | sort | uniq -c | sort -rn | head -20`;
   `git grep -hoE '#[0-9a-fA-F]{6}\b' -- "$WEB" | sort | uniq -c | sort -rn | head`. Cubre: FE-10,
   FE-14, BE-19.
7. **Deducir un hecho de la ausencia de otro dato.** «Es carga suelta» porque no hay contenedor; la
   operación deducida de qué tabla de extensión existe.
   Busca: `git diff $BASE...HEAD -- "$API" | grep -nE '^\+.*(IS NULL|=== null|== null|=== undefined)'`
   y pregunta si decide un hecho de negocio. Cubre: BD-26.
8. **Responder éxito sobre un trabajo que no se hizo.** Cero filas movidas, cero servicios creados,
   un archivo que no se escribió, y aun así `200` o `201`.
   Busca: cada `UPDATE`, `INSERT` o escritura a disco nueva, y qué hace su llamador con el cero o con
   el fallo. Cubre: BE-27.
9. **Una migración que lee el estado de hoy en vez del de su fecha.** `Object.values(Enum)`, una
   función del dominio vivo, una constante que otra migración cambió.
   Busca: `git grep -nE "Object\.(values|keys)\(|from '[^']*modules/" -- "$API/shared/infrastructure/persistence/migraciones/*" | grep -v listas-cerradas`.
   Cubre: BD-17, BE-11.
10. **Una prueba que se adapta al código nuevo y deja de vigilar la decisión que la motivó.**
    Busca: casos renombrados y expectativas invertidas en el diff de `*.spec.ts` y `*.prueba.ts(x)`.
    Cubre: PR-04.
11. **Un `catch` o un `fetch` cuyo fallo no deja rastro en ningún sitio.**
    Busca: `git grep -nE 'catch \{\s*\}|catch \([a-zA-Z_]*\) \{\s*\}|\.catch\(\(\) => (null|undefined|\{\s*\})\)' -- src/apps`
    y lee si el flujo sigue como si nada. Fuera de `src/apps` el mismo error tiene otra forma: un
    ejecutable nativo en PowerShell sin `$LASTEXITCODE` (O6), o un guion que imprime en rojo y
    sale con 0 (V43). Cubre: FE-21, SEG-06, INF-04, INF-05.
12. **Un umbral mal aplicado que se administra con excepciones en vez de corregirse.** Cuando varios
    ficheros están exentos por la misma razón, la regla está mal aplicada: se escribe una vez como
    regla (como `max-lines-per-function` apagado en `**/*.prueba.{ts,tsx}`), no como lista de nombres.
    Busca: en las listas de exención, varios ficheros que comparten patrón de nombre. Cubre: BE-14,
    BE-15.
13. **Una concesión de seguridad justificada con una razón que nadie midió.** `unsafe-inline`,
    CORS abierto, `@SkipThrottle`, una ruta `@Publico`, un timeout subido.
    Busca: `git diff $BASE...HEAD | grep -nE "^\+.*(unsafe-|origin: '\*'|origin: true|SkipThrottle|@Publico\(|nosemgrep)"`
    y exige la medición en el commit o el ADR. Cubre: SEG-10.
14. **Una capa que alcanza a otra que tiene prohibida, porque la regla solo cubría tres de las
    cuatro.**
    Busca: que cada capa (`domain`, `application`, `api`, `shared/api` en la API; `vocabulario`,
    presentación, `aplicacion` en la web) tenga su bloque de `no-restricted-imports`, y que cada
    bloque prohíba **todas** las capas de arriba: los grupos de `funcionalidades/**` prohibían
    `@/funcionalidades/*/*` pero no `@/app/*`, y el README decía «sin excepciones» (O35). Cubre:
    BE-01 a BE-05, FE-03, FE-04, FE-05, FE-07.
15. **Una cifra o una afirmación en la documentación que dejó de ser cierta y nadie tenía forma de
    saberlo.**
    Busca: `node scripts/validar-prosa.mjs --estricto`; cifras nuevas sin sello en el diff de `*.md`.
    `validar-prosa` no ve nombres sin enlace, promesas de un contrato, comentarios que describen una
    regla ni la descripción del PR: esos se cotejan a mano (GOB-23, GOB-34). Cubre: GOB-23, GOB-24,
    GOB-34, PR-14.

## Los principios que los producen

Cuando un hallazgo no encaja en ninguno de los quince, contrástalo con los nueve principios de
Alberto (§1): una frontera sin verificador no es frontera; se comprueba que la puerta muerde; una
lista de exención solo encoge; un gate nace avisando y sube a bloqueo con la línea base en cero; el
remedio nunca es silenciar el validador; medido, no supuesto; si la premisa cambia, la decisión
cambia y consta; nada se afirma sin evidencia; el peor error es el silencioso.

## Lo que su revisión del PR #125 añadió

La revisión de Alberto al PR #125 (2026-10-01) mostró que la auditoría por cumplimiento deja pasar
los defectos que no están escritos como regla. Esos ejes están en
[diseno-y-defensiva.md](diseno-y-defensiva.md) y se pasan siempre, como cuarta capa. Hay tres
principios más, que cruzan todo:

- **Si la premisa cambia, lo existente se revisa.** Un PR que cambia quién escribe una tabla mira
  la caché, los topes y el testigo que dependían del escritor viejo, aunque estén fuera del diff
  (PRE-01).
- **Al corregir, se buscan los gemelos.** El mismo defecto en la carpeta, el archivo o el canal de
  al lado (GEM-01). Un commit de remedio se audita como cualquier otro.
- **Lo que se vio y no se corrigió no puede quedar donde nadie lo ve.** Un pendiente Crítico
  bloquea el PR. Un Alto no sale sin su fila en `GAPS.md` y su mención en la descripción. El resto
  va a `GAPS.md` antes de abrirlo (paso 6 de `SKILL.md`).
