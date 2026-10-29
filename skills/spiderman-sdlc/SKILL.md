---
name: spiderman-sdlc
description: >
  Flujo completo para hacer una tarea o un requerimiento con el SDLC por intents de Christian:
  analizar lo pedido contra el código actual, escribir el intent (solo lo funcional), resolver sus
  preguntas abiertas una por una, escribir el spec (requisitos verificables y diseño por capa) y el
  plan (pasos con archivo:línea), construir paso a paso dejando cada uno en verde, PROBAR DE VERDAD
  —pruebas de unidad, de integración contra la base real y una prueba funcional de punta a punta
  con los servicios levantados y los sistemas externos simulados—, cerrar el registro
  (intent/SISTEMA.md de cada repositorio tocado), proponer los commits y dejar listos los PR.
  Sirve para cualquier repositorio que tenga (o vaya a tener) una carpeta intent/ con SISTEMA.md,
  como unimar_tms y unimar-xms. Úsala cuando el usuario diga "trabajemos esto", "hagamos este
  requerimiento", "armemos el intent", "intent y spec", "spec de esto", "flujo SDLC",
  "spiderman sdlc", "construye el plan", "prueba el flujo completo" o invoque /spiderman-sdlc,
  opcionalmente con un enlace a un documento, un número de intent o una ruta.
---

# Spider-Man SDLC

Llevas una tarea de punta a punta: de «esto es lo que se quiere» a «está en develop y se probó
funcionando». El registro vive en la carpeta `intent/` de cada repositorio:

```text
intent/
├── SISTEMA.md                 ← el presente del sistema; gana ante cualquier documento anterior
├── 0001-sistema-base/         ← cada cambio, congelado una vez aprobado
│   ├── intent.md              ← qué y por qué (funcional)
│   ├── spec.md                ← requisitos verificables y diseño
│   └── plan.md                ← cómo se construye, y lo que cambió al construir
└── NNNN-nombre-corto/
```

Lee antes el `CLAUDE.md` del repositorio y su `intent/SISTEMA.md`: mandan sobre esta skill en todo
lo que sea del proyecto (nombres, base de datos, estilo, reglas de git). Las plantillas de los tres
archivos están en [references/plantillas.md](references/plantillas.md).

## Reglas duras

1. **Una fase a la vez, y Christian aprueba cada una** antes de pasar a la siguiente: intent →
   spec → plan → construcción → prueba funcional → cierre. No escribes código antes de un plan
   aprobado.
2. **Lo funcional primero.** El intent no lleva nombres de tablas ni de clases: problema, resultado
   esperado, a quién toca, restricciones y preguntas. Lo técnico va en el spec.
3. **Nunca inventes una decisión de negocio.** Cada duda va a «Preguntas abiertas» con la opción que
   recomiendas, y se resuelve con Christian. Lo que deduces tú (sin que él lo dijera) se dice así:
   «esto lo deduje yo, confírmalo».
4. **Verifica contra el código, no contra el documento.** Un plan o un documento viejo puede estar
   desactualizado: antes de proponer, comprueba en el código que lo que dice sigue siendo cierto
   (`archivo:línea`).
5. **Mira a los vecinos.** Si el cambio toca una integración, revisa el otro lado (XMS, SAP, la app):
   qué hace con cada respuesta, si reintenta, si lee el cuerpo. Un código de error nuevo puede
   cambiar el comportamiento del vecino aunque tu repositorio esté perfecto.
6. **«Probé» significa que lo viste funcionar.** Pruebas de unidad e integración no bastan: la
   tarea no está terminada sin la prueba funcional de punta a punta (fase 6). Si algo no se probó,
   se dice tal cual.
7. **Git:** nada de commit, push ni PR sin la confirmación explícita de Christian, aunque él lo haya
   pedido antes (lo exige el `CLAUDE.md`). Los commits siguen `christian-commit`: máximo 5 palabras,
   sin firma, uno por tema. `gh pr create` está bloqueado por una regla `deny`: no se esquiva; se le
   dejan a Christian el comando y la descripción.
8. **No toques el árbol de trabajo de Christian sin mirarlo.** Antes de cambiar de rama, `git status`.
   Si él cambió de rama mientras trabajabas, no lo devuelves: usas un `git worktree` aparte.
   Nunca `git stash` a secas: `git stash push -u -m "<etiqueta>"` y `apply` por SHA.
9. **Contexto:** las lecturas amplias del código se delegan a subagentes (Explore o general-purpose)
   con un encargo preciso; tú te quedas con la conclusión.

## Fase 1 — Analizar

1. Lee lo que trae Christian (un documento, un enlace de Claude Docs, una conversación, un ticket).
   Un enlace `claude.ai/artifact/...` puede ser un documento de Claude Docs: léelo con el conector.
2. Contrástalo con el código actual. Busca lo que ya existe (errores, sentencias, pantallas) y lo
   que cambió desde que se escribió (`git log` del módulo).
3. Revisa `intent/SISTEMA.md` y los intents anteriores: decisiones vigentes que choquen, documentos
   que se declararon históricos (no se actualizan: el presente vive en `SISTEMA.md`).
4. Devuelve un análisis corto: qué sigue siendo válido, qué cambió, qué choca y qué falta decidir.

## Fase 2 — Intent

1. Crea `intent/NNNN-nombre-corto/intent.md` con el siguiente número libre del repositorio.
2. Escribe solo lo funcional (plantilla en references). El problema se cuenta desde la operación y la
   pantalla, no desde el código.
3. Cada pregunta abierta lleva su opción recomendada y por qué.
4. Resuélvelas con Christian **una por una**. Cuando una respuesta abre otra duda (otro sistema,
   otro botón que hace lo mismo, otro tipo de carga), investígala en el código antes de preguntar y
   preséntala como una pregunta nueva con opciones.
5. Al cerrar, «Preguntas abiertas» dice «Ninguna. Decidido el AAAA-MM-DD:» y la lista numerada de
   decisiones. Pide la aprobación.

## Fase 3 — Spec

1. `spec.md` con requisitos `REQ-NN` y un **criterio de aceptación verificable** cada uno: alguien
   tiene que poder decir sí o no mirando el sistema.
2. Diseño por capa (dominio, persistencia, caso de uso, API, web) y **por repositorio** si el cambio
   cruza a otro sistema. Reusa lo que ya existe y dilo con `archivo:línea`.
3. Base de datos: ¿hace falta migración? Comprueba los `CHECK` y las columnas reales. Concurrencia:
   transacción, compare-and-set, orden de candados igual al de los otros caminos que escriben lo mismo.
4. Fuera de alcance, riesgos con su respuesta (incluido el orden de despliegue entre sistemas),
   pruebas y «Al cerrar».
5. Pide la aprobación.

## Fase 4 — Plan

1. `plan.md`: contexto, desvíos del spec que encontraste al leer el código, ramas, pasos ordenados
   (0 documentos … N cierre) con `archivo:línea`, riesgos que se vigilan y verificación con los
   comandos reales de cada repositorio (míralos en su CI).
2. Si el plan exige leer mucho código, delégalo a un subagente con: el intent y el spec aprobados, el
   plan anterior como modelo de forma, la lista de archivos a verificar y la orden de no tocar código.
   Revisa lo que devuelve y corrige el spec si encontró contradicciones.
3. Pide la aprobación.

## Fase 5 — Construir

1. Rama desde `develop` actualizado en cada repositorio (`git pull --ff-only` antes).
2. Un paso del plan a la vez. Cada paso queda **en verde** antes del siguiente: compila, lint, y sus
   pruebas pasan.
3. Sigue el estilo del repositorio (idioma, comentarios mínimos, fin de línea, formateador). Respeta
   el `.editorconfig`: si el repositorio pide LF y la copia local está en CRLF por `core.autocrlf`,
   formatea solo tus archivos, nunca el árbol entero; si un formateador toca archivos ajenos,
   devuélvelos con `git checkout`.
4. Cuando una prueba falle sin relación aparente con tu cambio, compruébalo: córrela en `develop`
   sin tus cambios (worktree o stash con etiqueta). Si también falla allí, anótalo como «ya fallaba»
   con su nombre; no la arregles dentro de esta tarea.
5. Lo que construyas distinto del plan va a «Desvíos durante la construcción (fecha)» en `plan.md`,
   con el porqué.

### Verificación de la construcción

- Lint, build y la suite completa de unidad de cada repositorio.
- Integración contra la base real de producción en su versión (en unimar_tms, SQL Server 2016 local,
  puerto 14330; ver el `CLAUDE.md`): los casos del spec, uno por uno, incluido «no escribe nada»
  en cada rechazo.
- Las guardias del repositorio (compatibilidad de SQL, cobertura, formato, script de migraciones).

## Fase 6 — Prueba funcional de punta a punta (obligatoria)

El objetivo es ver el flujo funcionar como lo verá el usuario o el sistema vecino. Detalle práctico
y trampas conocidas en [references/prueba-funcional.md](references/prueba-funcional.md).

1. **Armar el entorno, todo desechable:** bases nuevas (`<sistema>_e2e_NNNN`) en el motor de
   producción, cada servicio levantado en local contra la suya, con sus migraciones aplicadas.
2. **Simular lo que no se alcanza:** el sistema externo que no responde desde local (SAP, SUNAT, el
   teléfono) se reemplaza mandando nosotros la llamada exacta que mandaría (SOAP, REST, push), con el
   contrato real del repositorio (archivos `.http`, WSDL, pruebas).
3. **Sembrar un caso por requisito:** el camino feliz, cada rechazo y el camino de hoy (que no se
   rompió). Usa los ayudantes de siembra de las pruebas de integración.
4. **Recorrer el flujo** y comprobar **en cada sistema** lo que quedó: la respuesta, la base de cada
   uno (estado, filas escritas y no escritas) y la bitácora del vecino.
5. **Probar el tiempo:** reintentos, datos que llegan tarde, avisos repetidos. Ojo con forzar la
   entrega en bucle: puede gastar los reintentos en minutos.
6. **Confirmar que corre tu código:** si el árbol de trabajo cambió de rama, el servicio que levantas
   no tiene tu cambio. Levántalo desde un worktree de tu rama.
7. **Limpiar:** detener servicios, quitar uniones (junction) antes de borrar un worktree, borrar
   las bases de prueba y los archivos temporales. Comprueba que no quede nada.
8. **Informar en una tabla:** caso → respuesta → cómo quedó cada sistema. Más lo que salió en el
   camino (trampas del entorno, comportamientos del vecino que conviene saber).

## Fase 7 — Cierre

1. `intent/SISTEMA.md` de **cada repositorio tocado**: la fila de la etapa, la decisión vigente y la
   línea del historial; fecha de «Última actualización».
2. Si el cambio cruza a otro repositorio que tiene su propia carpeta `intent/`, crea allí un intent
   breve que apunte al principal y nombre los requisitos que le tocan.
3. Actualiza la memoria del proyecto con el estado (dónde quedó, qué falta, qué se aprendió).
4. Propón la lista de commits por tema y espera la confirmación. Después del commit, el push solo
   con confirmación.
5. PR: deja la descripción en un archivo (qué cambia, reglas, códigos, despliegue, pruebas, lo que
   ya fallaba) y dale a Christian el comando `! gh pr create ...` y el enlace de compare. Si hay
   varios repositorios, di cuál va primero.
6. Cuando Christian diga que ya se fusionó: `develop` actualizado en cada repositorio (con el
   árbol limpio) y la memoria al día.

## Cómo hablarle a Christian

- Español, frases cortas, sin relleno. Primero la respuesta, después el detalle.
- Desde Control remoto, los enlaces a archivos locales no se abren: manda los documentos con
  `SendUserFile`.
- Al pedir una decisión, da las opciones, la que recomiendas y por qué, y lo que cambia según elija.
