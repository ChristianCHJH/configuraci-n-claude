# Plantillas del registro de intents

El ejemplo completo que sirvió de modelo: `unimar_tms/intent/0004-balanza-vincula-contenedor/`
(intent, spec y plan) y su par en `unimar-xms/intent/0002-balanza-vincula-contenedor/`.

## intent.md

```markdown
# Intent: <qué se quiere, en una línea>

Autor: Christian Jara (TI Unimar). Dueño de producto: <nombre>. Estado: borrador. Fecha: AAAA-MM-DD.

Parte de: [0001-sistema-base](../0001-sistema-base/intent.md). Origen: <documento, prueba de QAS, conversación>.

## Problema

<Qué pasa hoy, contado desde la operación. Lista numerada con lo que duele y su consecuencia.>

## Resultado propuesto

1. <Lo que va a pasar, en términos de la operación.>
2. <Lo que NO va a hacer el sistema, si importa (por ejemplo «no adivina»).>

**Cómo sabremos que funcionó:** <algo que se pueda ver en QAS.>

## Usuarios y sistemas afectados

| Quién / qué | Cómo le toca |
| --- | --- |
| <equipo> | <qué ve distinto> |
| <sistema vecino> | <qué cambia o «No cambia»> |

## Restricciones

- <Sin cambios en la base de datos / SQL de la versión de producción / el contrato de entrada no cambia…>

## Preguntas abiertas

1. **<La duda>.** <Contexto corto.> Recomendado: <opción>, porque <razón>.

<!-- Al cerrar se reemplaza por: -->
Ninguna. Decidido el AAAA-MM-DD:

1. <Decisión, en una o dos líneas.>
```

## spec.md

```markdown
# Spec: <mismo título que el intent>

Intent: [intent.md](./intent.md). Autor: … Estado: borrador. Fecha: AAAA-MM-DD.

Rutas relativas a `<ruta del módulo>` (<repo>) y al repositorio `<otro repo>`.

## Requisitos

| ID | Requisito | Criterio de aceptación verificable |
| --- | --- | --- |
| REQ-01 | <qué> | <qué se mira y qué tiene que dar: código HTTP, fila escrita o no, texto en pantalla> |

## Diseño — <repo principal>

### <Bloque: orden de la búsqueda, el dato que se escribe, concurrencia…>

### Por capa

- **Dominio:** …
- **Persistencia:** … (¿migración? ¿qué CHECK lo admite?)
- **Caso de uso:** …
- **API:** …

## Diseño — <repo vecino>

## Fuera de alcance

## Conflictos y riesgos

| Riesgo | Qué se hace |
| --- | --- |
| <orden de despliegue / bloqueo mutuo / compatibilidad de SQL> | … |

## Pruebas

- **Unidad:** …
- **Integración (<motor y versión>):** un caso por requisito, incluido «no escribe nada».
- **Funcional de punta a punta:** <servicios levantados, qué se simula, qué se comprueba>.

## Al cerrar

En el mismo PR, [SISTEMA.md](../SISTEMA.md) anota …
```

## plan.md

```markdown
# Plan: NNNN — <título>

Intent: `intent/NNNN-…/intent.md` · Spec: `…/spec.md` (aprobado AAAA-MM-DD).

## Contexto

## Desvíos del spec que este plan corrige (en el mismo commit que el código)

## Rama

- <repo>: `feat/<nombre>`, desde `develop`.
- Commits por tema, de máximo 5 palabras y sin firma. Sin push ni PR hasta que Christian lo pida.

## Pasos (en este orden; cada uno queda en verde antes del siguiente)

### 0. Documentos
### 1. <capa o repo> (REQ-…)
- `archivo:línea`: qué cambia.
- **Pruebas:** …
### N. Cierre
- `intent/SISTEMA.md` de cada repositorio tocado.

## Riesgos que se vigilan al construir

## Verificación

1. <repo>: comandos reales (lint, build, test, integración).
2. Prueba funcional de punta a punta: <casos>.

## Desvíos durante la construcción (AAAA-MM-DD)

- Paso N: <qué cambió y por qué>.
```

## Línea del historial en SISTEMA.md

```markdown
| [NNNN-nombre](./NNNN-nombre/) | AAAA-MM-DD | <qué cambió, en una línea> |
```
