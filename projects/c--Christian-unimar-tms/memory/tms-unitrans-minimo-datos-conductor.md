---
name: tms-unitrans-minimo-datos-conductor
description: UNITRANS debe minimizar la entrada de datos del conductor; idealmente con el código del contenedor se autocompleta todo el resto
metadata: 
  node_type: memory
  type: project
  originSessionId: 1e8113f4-85fc-42fc-92a6-86974cfe5868
---

En el TMS, el registro del contenedor en ejecución lo hace **el conductor desde la app UNITRANS solo en IMPORTACIÓN** (mientras le cargan, coloca el código del contenedor → se vincula todo). En **EXPORTACIÓN lo hace el asistente de transporte** desde la plataforma (asigna contenedor + conductor a la cita), no el conductor.

Principio de diseño de UNITRANS: **mientras menos datos ingrese el conductor, mejor.** Hay riesgo real de resistencia al uso — al conductor le pesa generar la GRE, subir la foto del ticket de salida (F-23) y colocar la placa. Meta: **con solo el código del contenedor, el sistema debe traer/autocompletar todo lo demás** (placa, conductor, datos que consume la GRE). La app tiene que ser lo más simple posible y no tomarle tiempo.

**Why:** el éxito del MVP depende de la adopción del conductor (RS-03 del PRD); cada dato manual extra es fricción que empuja a saltarse el sistema y volver al proceso manual.

**How to apply:** al diseñar/validar pantallas UNITRANS y reglas F-27/F-28/F-23, minimizar campos manuales; validar qué datos se pueden derivar del código del contenedor. Relacionado con [[tms-prototipo-scope]].
