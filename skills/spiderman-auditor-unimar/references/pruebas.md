# Checklist — pruebas y puertas de la raíz

Suites, cobertura y las pruebas que vigilan reglas. Fuentes: S-23 (pruebas con umbral de cobertura
que falla por debajo), SD-04 (criterios verificables), SD-05, ADR-TMS-018 (la puerta es el
`pre-push`), ADR-TMS-025 (casos de concurrencia), ADR-0109 §2.12 (Testing Library, MSW), el ruleset
RS-WEB-DEV y el documento de Alberto (§1, §8, §11).

Variables, a pegar delante en la misma llamada:
`BASE=origin/develop; API=src/apps/api/src; WEB=src/apps/web/src`.

## Puertas a correr (paso 2)

Por aplicación, en solo lectura y sin instalar nada. Sin `node_modules` o con Node por debajo de
`engines`, cada una es NO EJECUTADA con su motivo.

```bash
(cd src/apps/api && npm run --silent test:cobertura)
(cd src/apps/api && npm run --silent test:cobertura:infraestructura)
(cd src/apps/web && npm run --silent test:cobertura)
if node -e 'const s=require("node:net").connect({host:process.env.DB_HOST??"localhost",port:Number(process.env.DB_PUERTO??1434)}).once("connect",()=>{s.end();process.exit(0)}).once("error",()=>process.exit(1))'; then
  (cd src/apps/api && npm run --silent test:integracion)
else
  echo "test:integracion NO EJECUTADA: SQL Server de pruebas no responde"
fi
```

Puertas de la raíz que encadena `.husky/pre-push`:

```bash
node scripts/validar-prosa.mjs --estricto
node scripts/validar-prosa.prueba.mjs
for c in $(git rev-list origin/develop..HEAD); do git log -1 --format=%B "$c" | node_modules/.bin/commitlint || echo "commitlint falla en $c"; done
npx --yes markdownlint-cli@0.39.0 --config .markdownlint.json $(git ls-files '*.md')
helm lint src/infra/tms-helm --set api.integraciones.claveAvisoGuia=$(printf 'a%.0s' $(seq 32)) --set api.integraciones.claveControlAccesos=$(printf 'b%.0s' $(seq 32))
```

`helm template` se corre en los dos modos, con `values.yaml` y con `-f valores-remoto.yaml`: el modo
que nadie instala puede llevar meses roto (Alberto §11). Una prueba que falla por carga y no por
código se reporta como inestable, no como verde tras reintentar.

## Ítems

- **PR-01 · Alta** — Las suites pasan con cobertura y el piso de cobertura falla cerrado: el de
  infraestructura sale con error si falta el resumen o si baja, y no reescribe su JSON.
  Fuente: S-23; G-193; Alberto §11 («sin `--coverage` el piso no se comprueba»). Detecta: las
  puertas de arriba; `git diff $BASE...HEAD -- src/apps/api/scripts/piso-de-cobertura-infraestructura.json`
  (un piso que baja es hallazgo).
- **PR-02 · Alta** — Lo que solo existe en SQL Server se prueba contra SQL Server real: compare-and-set,
  idempotencia por clave, carreras y _append-only_ van al carril `test:integracion`.
  Fuente: G-192; ADR-TMS-018 (disparador de revisión); ADR-TMS-025. Detecta: en el diff, una
  sentencia de `sentencias-*.ts` nueva o cambiada sin su `*.integracion.spec.ts`. No basta con que
  exista un spec hermano: tiene que **nombrar** la sentencia o el adaptador nuevo. Cuenta también el
  SQL que no vive en `sentencias-*.ts`: `UPDLOCK, HOLDLOCK`, índices únicos filtrados, el
  `UPDATE … WHERE … IS NULL` de un vinculador y las búsquedas con intercalación. Una prueba contra
  `BaseDeDatosFalsa` que afirma fragmentos del SQL (`toContain('… IS NULL')`) no cuenta: pasa
  aunque el SQL no haga lo que dice (O19, O25).
  `git grep -lE 'UPDLOCK|HOLDLOCK|WHERE [^;]* IS NULL' -- "$API/modules/*/infrastructure/*" "$API/shared/*" | grep -v '\.spec\.ts'`
  y, por cada uno, `git grep -l '<NombreDelAdaptador>' -- "$API/*.integracion.spec.ts"`.
- **PR-03 · Alta** — Lógica de dominio o de aplicación nueva trae su prueba.
  Fuente: SD-04; S-23; RS-DEV. Detecta:
  `git diff --name-only --diff-filter=A $BASE...HEAD -- "$API/modules/*/domain/*.ts" "$API/modules/*/application/*.ts" "$WEB/*aplicacion/*.ts" | grep -vE '\.(spec|prueba)\.'`
  y buscar la prueba hermana de cada archivo. No solo `domain/` y `application/`: también la
  **escritura nueva** de `infrastructure/persistence/*.typeorm.ts` (O19, la única escritura nueva de
  la carga suelta sin ninguna prueba) y el ayudante con lógica propia en `api/` (V12). Un parámetro
  que abre o cierra una compuerta se prueba con sus dos valores (O18, DIS-05).
  `git diff --name-only --diff-filter=AM $BASE...HEAD -- "$API/modules/*/infrastructure/persistence/*.typeorm.ts" "$API/modules/*/api/*.ts" | grep -vE '\.spec\.|controller|module|dto'`.
- **PR-04 · Alta** — Una prueba no se adapta al código nuevo hasta dejar de vigilar la decisión que
  la motivó: un caso renombrado para describir el estado nuevo, o una expectativa invertida sin
  razón escrita, es hallazgo.
  Fuente: Alberto §8; §13 error 10. Detecta:
  `git diff $BASE...HEAD -- '*.spec.ts' '*.prueba.ts' '*.prueba.tsx' | grep -nE "^[-+]\s*(it|test|describe)\(|^[-+].*\.(toBe|toEqual|toThrow|toHaveBeenCalled)"`
  y leer cada par borrado/añadido. Dos casos que el par no muestra:
  - Una **aserción que desaparece** al reescribir la prueba, sin otra que la reemplace. El rediseño
    del modal de carga suelta quitó las del contador y del aviso «ya existe» (O38). Cuenta las
    líneas `expect(` borradas frente a las añadidas por archivo.
  - Un **caso sumado a `describe.each`** que pasa por otra razón. Una pantalla que sí escribe entró
    en «es de solo lectura» y pasó porque el grafo de prueba no le daba permiso (V28).
- **PR-05 · Media** — Toda regla nueva de linter, de `depcruise` o de validación trae la prueba que
  falla si se retira, y se comprobó metiendo a propósito la violación.
  Fuente: Alberto §1 («se comprueba que la puerta muerde») y §8. Detecta: por cada regla nueva en
  `.eslintrc.cjs`, `eslint.config.js` o `.dependency-cruiser.cjs`, su caso en
  `src/apps/api/src/shared/api/reglas-de-lint.spec.ts` o `src/apps/web/src/app/reglas-de-lint.prueba.ts`.
- **PR-06 · Media** — Las pruebas de cobertura de rutas y de sede leen el disco, no una lista escrita
  a mano.
  Fuente: Alberto §8. Detecta: diff de `cobertura-de-rutas.spec.ts`, `cobertura-de-sede.spec.ts` y
  `tablas-por-modulo.spec.ts`: una lista literal de rutas o tablas añadida es el defecto.
- **PR-07 · Media** — Una prueba frágil no se arregla subiendo el plazo de `waitFor`: se inyecta el
  retardo y se demuestra con un A/B (cinco de cinco en rojo antes, cinco de cinco en verde después).
  Fuente: Alberto §8. Detecta:
  `git diff $BASE...HEAD -- '*.spec.ts' '*.prueba.ts' '*.prueba.tsx' | grep -nE '^\+.*(timeout|jest\.setTimeout|waitFor\([^)]*\{)'`.
- **PR-08 · Baja** — Los ayudantes de prueba no afirman sobre la implementación, como los
  parámetros posicionales del SQL.
  Fuente: Alberto §8. Detecta:
  `git grep -nE 'toHaveBeenCalledWith\([^)]*(SELECT|INSERT|UPDATE|@0)' -- "$API/*.spec.ts"`.
- **PR-09 · Media** — Un fixture también pasa por los umbrales y no entra en la lista de exentos.
  Fuente: Alberto §8. Detecta: ver BE-15; en la web, `max-lines` sigue midiendo los ficheros de
  prueba aunque `max-lines-per-function` esté apagado en `**/*.prueba.{ts,tsx}`.
- **PR-10 · Media** — Una prueba unitaria verde no es un criterio de aceptación validado: cada
  criterio de la historia tiene su prueba, validador o inspección con resultado binario.
  Fuente: SD-04; Alberto §8. Detecta: `validate-criterios.mjs`; contrastar los criterios de la
  historia que el commit cita con las pruebas del diff. El reporte nunca afirma «criterio validado»
  por una suite unitaria.
- **PR-11 · Media** — Cada escritura concurrente sobre el servicio tiene su caso: otra transacción
  movió lo leído y la escritura devuelve el 409.
  Fuente: ADR-TMS-025 (consecuencias). Detecta: por cada sentencia de BD-24 que el diff toca, su caso
  en `registrador-programacion.typeorm.spec.ts`, `editor-de-servicio.typeorm.spec.ts` o
  `asignador-viaje.typeorm.spec.ts`.
- **PR-12 · Media** — El contrato con UNITRANS lo vigilan `contrato-unitrans.spec.ts` (lee el Kotlin)
  y `tuberia-de-validacion.spec.ts` (el DTO sin marca sigue en 400).
  Fuente: ADR-TMS-009 1.1.0. Detecta: una ruta nueva de `/unitrans` sin su caso.
- **PR-13 · Baja** — En la web se consulta por rol y por texto accesible, no por `data-testid` ni por
  clase, y la red se simula con MSW.
  Fuente: RS-WEB-DEV; ADR-0109 §2.12. Detecta:
  `git grep -nE "getByTestId|querySelector\(" -- "$WEB/*.prueba.tsx"`.
- **PR-14 · Baja** — La línea base de pruebas de `CONTRIBUTING.md` lleva sello y está al día.
  Fuente: Alberto §10; commit `15a46cb`. Detecta: `validar-prosa.mjs --estricto` (clase `sello`).
- **PR-15 · Alta** — La funcionalidad principal del PR tiene una prueba que recorre su costura
  entera, con MSW y sin falsear la pieza del medio. Por ejemplo: catálogo → página → modal → gancho →
  cuerpo del `POST`. Si todas las pruebas reemplazan esa costura por una sección de prueba o un
  `vi.fn()`, un campo renombrado entre dos funcionalidades rompe el envío real sin que nada falle
  (O39).
  Fuente: Alberto PR#125 O39; SD-04. Detecta: la funcionalidad que nombra el título del PR, y en sus
  pruebas `git grep -nE 'SeccionDePrueba|vi\.fn\(\)|De[Pp]rueba' -- "$WEB/*.prueba.tsx"` frente a
  `git grep -n 'http\.(post|put|patch)' -- "$WEB/*.prueba.tsx"`.
- **PR-16 · Alta** — Una migración que mueve datos (BD-32 a BD-34) tiene una prueba de integración
  con filas: migra hasta la anterior, siembra los casos difíciles (duplicados, NULL, empates), corre
  la migración y verifica filas, índices y `down()`. `test:integracion` sobre una base vacía no
  ejerce ningún camino de relleno (O14).
  Fuente: Alberto PR#125 O14; G-192. Detecta: por cada migración de BD-32,
  `git grep -l '<NombreDeLaMigracion>' -- "$API/*.integracion.spec.ts"`.
- **PR-17 · Media** — Un conflicto se prueba hasta el reintento, no solo hasta el mensaje. Ejemplo:
  «409, reintento, 200» tras recargar la fila (FE-38). Una prueba que solo comprueba que aparece el
  aviso no vigila que se pueda salir de él (O37).
  Detecta: `git grep -nE '409' -- "$WEB/*.prueba.tsx"` y comprobar un segundo envío en el mismo caso.
