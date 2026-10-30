---
name: recuperar-con-python-y-verificar
description: la recuperación de data se hace con scripts Python y siempre se verifica después que lo recuperado corresponde al cliente; la BD solo se lee.
metadata:
  node_type: memory
  type: feedback
  originSessionId: 88426db0-ecb6-438b-8b2b-5308e87fa26e
  modified: 2026-10-25T05:21:45.306Z
---

Toda recopilación y búsqueda sobre los documentos de la inmobiliaria se hace con scripts Python, no leyendo archivos a mano. Después de recuperar, se verifica el resultado: que cada documento cargado corresponda al cliente con el que se registró (nombre y DNI leídos en el documento contra el cliente en la base). La base de datos se consulta solo en lectura.

**Why:** Christian revisó documentos físicos cargados al sistema y algunos no coincidían con el cliente registrado (25 oct 2026, antes del corte de salida a producción).

**How to apply:** en cada corte o recarga, incluir un paso de verificación cruzada documento↔cliente y reportar las discrepancias como observadas, no cargadas. Nunca escribir en la BD durante una revisión. Relacionado: [[dni-se-ata-por-ocr-no-por-carpeta]], [[recuperacion-datos-historicos]].
