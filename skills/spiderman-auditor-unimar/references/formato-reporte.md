# Formato del reporte

El entregable es **uno**: `AUDITORIA-UNIMAR.md` en la raíz del repositorio auditado. Si ya existe, se
reemplaza entero. No se commitea ni se añade al `.gitignore`: si no está ignorado, se dice al final
de la respuesta en el chat. Los logs de las puertas quedan en el scratchpad, no en el repositorio.

Formato de fila heredado de R-11 (auditorías: documento, ubicación, tipo, severidad, arreglo),
ampliado con regla, fuente y escenario.

## Escala de severidad

| Severidad | Cuándo |
| --- | --- |
| **Crítica** | Seguridad explotable (dato de confianza del cuerpo, valor que falla abierto, secreto versionado, SQL interpolado, lectura de otra sede), pérdida o corrupción de datos (transacción que confirma un error, migración que no corre sobre una base nueva), puerta del estándar desactivada |
| **Alta** | Frontera de arquitectura rota, regla cableada incumplida o silenciada, lista de exención que crece, contrato roto sin los dos pasos, escritura concurrente sin estado de partida, lógica crítica sin prueba |
| **Media** | Mantenibilidad, documentación que afirma lo que el árbol desmiente, observabilidad incompleta, umbral que exige juicio |
| **Baja** | Nombres, comentarios, tooltips, estilo, orden |

La severidad por defecto del ítem de checklist se puede subir o bajar con el escenario, diciendo por
qué en la fila.

Equivalencia con la revisión de Alberto, para que los dos reportes se lean igual: 🔴 bloquea la
fusión (Crítica, o Alta con pérdida de datos), 🟠 se resuelve en este PR o en una tarea inmediata
(Alta y Media), 🟢 sugerencia (Baja y Mejora).

## Tipo de hallazgo

| Tipo | Significa |
| --- | --- |
| **Incumplimiento** | Lo introduce el alcance auditado y viola una regla con fuente |
| **Preexistente** | Viola una regla, pero está en líneas que la rama no tocó |
| **Conocido (G-NNN)** | Ya registrado con gap abierto; se cita para que no se pierda, no cuenta como nuevo. Si el texto del gap ya no describe el código, también se dice |
| **Riesgo** | No viola una regla escrita, pero tiene un escenario de fallo verosímil y un eje de [diseno-y-defensiva.md](diseno-y-defensiva.md). Lleva severidad como un incumplimiento |
| **Mejora** | No viola una regla escrita ni tiene escenario de fallo; mejora el diseño. Se propone y se pregunta, no se impone |

## Clase de arreglo

- **limpieza** — no mueve lógica: nombre, comentario, import, tipo, documentación. Se puede corregir
  directo.
- **🔒 lógica** — cambia comportamiento, contrato o esquema. Queda sin tocar hasta que haya prueba y
  decisión; al remediar, se corrige después de la limpieza.

## Estructura

````markdown
# Auditoría Unimar — <repositorio> · <AAAA-MM-DD>

| Campo | Valor |
| --- | --- |
| Rama y commit | `<rama>` @ `<hash corto>` |
| Alcance | Rama contra `origin/develop` (<n> archivos) · ruta `<ruta>` · repositorio completo |
| Estándar | `STANDARD_REF` = `unimar-core-x.y.z`; copia usada: instalada · clon en scratchpad |
| Auditor | Peter (`unimar-dev`, RS-DEV) con los criterios de Hal, Namor, Barry y Ororo |
| Checklists aplicados | gobernanza · backend · base de datos · frontend · seguridad · pruebas · android · quince errores |

## Resumen

Cinco líneas, ni una más:

1. Veredicto: CUMPLE · CUMPLE CON HALLAZGOS · NO CUMPLE, y por qué en una frase. Con un Crítico
   sin corregir, el veredicto es NO CUMPLE y la rama no abre PR.
2. Conteo: <n> Críticas · <n> Altas · <n> Medias · <n> Bajas (<n> nuevas, <n> riesgos, <n> preexistentes, <n> conocidas).
3. El hallazgo más grave, contado desde la pantalla o el gesto.
4. Puertas: <n> OK · <n> FALLA · <n> NO EJECUTADA.
5. Siguiente acción única: qué corregir primero.

## Hallazgos

| # | Sev. | Tipo | Archivo:línea | Regla | Fuente | Escenario de fallo | Arreglo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Crítica | Incumplimiento | `src/apps/api/src/…/x.dto.ts:14` | SEG-02 · la sede sale del portador | Alberto §5 · §13 error 4 · G-163 | Un despachador de Paita manda `idSucursal` de Callao y la fila queda en la sede equivocada; Callao no la encuentra | 🔒 lógica: quitar el campo del DTO y leer `sedeDeLaPeticion()` en el controlador |

Orden: severidad, luego tipo (Incumplimiento, Riesgo, Preexistente), luego archivo. Un defecto con
varias apariciones es **una** fila con todas sus ubicaciones separadas por `·`. Agrupar es solo para
apariciones del **mismo** defecto. Cinco defectos distintos de la misma carpeta son cinco filas,
cada una con su línea. En el reporte del 29/09, el #12 juntó respaldo, cabeceras, LocalSystem,
`nssm` y permisos bajo «`src/infra/iis/…`» y el detalle se perdió.

Todo hallazgo Crítico o Alto lleva debajo de la tabla su sección `### #<n> — <título>` con las tres
partes de la revisión de Alberto:

```markdown
### #1 — <título>

**Qué pasa:** lo que hace el código, con archivo:línea de cada pieza que interviene.
**Por qué importa:** el escenario contado desde la pantalla o el gesto, y la regla o el eje.
**Cómo resolverlo:**
- **Opción A (recomendada):** el arreglo, con dónde y cómo se comprueba.
- **Opción B:** la alternativa, y cuándo conviene.
```

La evidencia leída va como cita, en diez líneas como máximo. Los Medios y Bajos pueden quedarse en
la tabla.

## Puertas automáticas del repositorio

| Puerta | Comando | Resultado | Nota |
| --- | --- | --- | --- |
| Lint API | `npm run lint` en `src/apps/api` | OK · FALLA · NO EJECUTADA | Motivo o hallazgos que produjo (#) |

Una fila por puerta que encadena el `pre-push` y por cada puerta de seguridad. NO EJECUTADA siempre
con el motivo exacto: herramienta ausente, `node_modules` ausente, Node por debajo de `engines`,
SQL Server de pruebas sin responder.

## Validadores de unimar-core

| Validador | Regla | Resultado | Hallazgo |
| --- | --- | --- | --- |
| `validate-docs.mjs` | S-09, S-10, SD-06 | OK · FALLA · NO EJECUTADA | # |

Incluye `install-hooks.mjs --check` (S-12) y `validate-redaccion-log.mjs` (S-34).

## Decisiones que cuestiono

Lo que un ADR, `DECISIONS.md` o el `CLAUDE.md` del proyecto ya decidieron y cuyo costo conviene
revisar: la decisión con su fuente, el argumento, el costo de sostenerla y la alternativa. No son
hallazgos y no llevan severidad.

## No verificado

Lo que no se pudo ver ni correr, con el motivo, y las preguntas para el equipo.

## Filas propuestas para GAPS.md

SD-07 exige registrar cada hallazgo. El auditor no escribe `GAPS.md`: propone las filas para los
hallazgos nuevos que no se corrijan en el mismo cambio, con título, dimensión de `MADUREZ.md`,
criticidad, complejidad y fecha de apertura.

## Resueltos

Vacía al emitir el reporte. Al remediar, cada hallazgo corregido se mueve aquí con el commit que lo
cierra.

## Cobertura de la auditoría

IDs de checklist revisados, los que no aplicaban al alcance y cuántos candidatos se descartaron en
el paso 4. Además, por área (API por módulo, web, migraciones, infra, docs, Android):

| Área | Archivos en el alcance | Leídos enteros | Solo por grep | Sin abrir |
| --- | --- | --- | --- | --- |

Lo «sin abrir» se nombra en «No verificado». Un reporte que no puede llenar esta tabla no puede
decir CUMPLE.

## Cierre antes del PR

Solo cuando el alcance es una rama que va a abrir PR, o un PR abierto (paso 6):

| Comprobación | Resultado |
| --- | --- |
| Head auditado = head que se publica | `<hash>` · sí / no |
| Commits posteriores a la auditoría anterior, re-auditados | n · lista |
| Descripción del PR frente al árbol (GOB-34) | OK · n afirmaciones falsas |
| Pendientes Críticos sin corregir | 0 · **NO ABRIR EL PR** |
| Pendientes Altos sin corregir | n, cada uno con su fila en `GAPS.md` y citado en la descripción |
| Pendientes Medios y Bajos con fila propuesta en `GAPS.md` | n de n |
````

## Respuesta en el chat

Máximo ocho líneas, sin pegar el reporte ni código:

```text
Reporte: <ruta absoluta>/AUDITORIA-UNIMAR.md
Veredicto: CUMPLE CON HALLAZGOS · 1 Crítica · 3 Altas · 5 Medias · 2 Bajas · puertas 9 OK, 1 FALLA, 3 NO EJECUTADAS
#1 Crítica — la sede llega en el cuerpo de la ingesta (recepcion/api/dto/…:14)
#2 Alta — la web decide si un servicio se puede asignar (planificacion-citas/aplicacion/…:40)
#3 Alta — migración nueva con CHECK por Object.values (migraciones/1793…:22)
AUDITORIA-UNIMAR.md no está en .gitignore.
¿Arreglo el #1?
```
