---
name: staruml-tablas-con-colores
description: Todo diagrama ERD que se genere para StarUML debe llevar las tablas pintadas con colores pastel agrupadas por rol funcional, salvo las maestras que vendrán de SAP, que van en cian intenso
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 638c4275-07b1-40ce-9b9e-39405bb49306
  modified: 2026-08-23T22:22:17.575Z
---

Siempre que genere un modelo de datos para StarUML (archivo `.mdj`), las entidades van pintadas con **colores pastel suaves**, agrupadas por rol funcional: un color por grupo, no un color por tabla. Se aplica poniendo `fillColor: "#rrggbb"` en la `ERDEntityView`; los sub-views con `parentStyle: true` heredan el color solos.

**La excepción son las MAESTRAS que después se traerán de SAP: esas van en un color saturado que grite**, no en pastel. En el TMS es `#00B4D8` (cian intenso), y lo pidió Christian explícitamente el 2026-08-23 para poder localizarlas de un vistazo.

Paleta usada en el modelo de recepción del TMS:

| Color | Rol |
|---|---|
| `#00B4D8` cian intenso | **maestras que llegarán de SAP** (`instalacion_portuaria`, `transportista`, `vehiculo_rodante`, `conductor`) |
| `#fdf2cd` amarillo | tabla independiente / buzón de entrada (`carga_archivo`) |
| `#dbe9f8` azul | tabla que inicia el flujo (`requerimiento_transporte`) |
| `#dff0dc` verde | grupo de tablas de un mismo proceso (las 5 de relación detallada) |
| `#ece9f4` lila gris | catálogos internos (los que NO vienen de SAP) |
| `#fde8ef` rosa | planificación / servicios de transporte |
| `#eef1f4` gris muy suave | bitácoras de cambio / auditoría (append-only) — a propósito el tono más apagado: son tablas de consulta, no del flujo principal |

**Why:** Christian lee el diagrama visualmente antes que campo por campo. El color le dice de un vistazo qué grupo está mirando y dónde está parado en el flujo. Las maestras SAP necesitan saltar por encima de todo lo demás porque son las que tendrá que reemplazar por una integración.

**How to apply:** Antes de entregar cualquier `.mdj`, asignar el color por grupo y decir en la respuesta qué significa cada color. Si una tabla queda en blanco, es señal de que no se decidió a qué grupo pertenece — decidirlo, no dejarla blanca. Al agregar una maestra nueva, preguntarse si vendrá de SAP: si sí, cian intenso. Ver [[modelo-datos-tms-recepcion]].
