---
name: explicar-por-pantalla
description: Christian entiende un hallazgo cuando se le dice en qué pantalla pasa y qué hace el usuario, no por el nombre del símbolo
metadata:
  type: feedback
---

Al explicar un bug o un hallazgo, empezar por **la pantalla y el gesto de la persona**: «en
Planificación de citas, el asistente de transporte abre Asignar viaje, borra el conductor y
guarda». El nombre de la función o de la consulta va después, y solo si hace falta.

**Why:** tuvo que pedirme la misma explicación tres veces porque arranqué por el símbolo
(`ESTADO_DEL_VIAJE`, `cabeceraDe`) en vez de por el flujo. Con la pantalla delante lo entendió a la
primera.

**How to apply:** una tabla de hallazgos lleva una columna «qué pasa en la pantalla» y otra «cuál es
la solución». Y el término correcto del rol es **asistente de transporte**, no «despachador».
