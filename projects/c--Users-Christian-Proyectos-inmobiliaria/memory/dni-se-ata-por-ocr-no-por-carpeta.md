---
name: dni-se-ata-por-ocr-no-por-carpeta
description: un escaneo de DNI solo se vincula al cliente cuyo número se leyó en el escaneo; la carpeta y el nombre del archivo mienten.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c7216b42-19fa-4927-a312-31206dbf5e6d
  modified: 2026-09-13T23:51:42.690Z
---

Un archivo de DNI se vincula a un cliente solo si el número leído en el escaneo (OCR, script 27) es el DNI de ese cliente. Nunca por nombre de carpeta, nombre de archivo ni parecido de nombres. Lo que no se lee va a revisión manual (documentos-por-revisar.xlsx, script 28).

**Why:** la primera carga ató DNI por carpeta y la cliente 50 recibió DNIs de otras dos personas; hubo que dar de baja 297 documentos. El 13 set 2026 se rehízo con OCR: 179 subidos, el usuario confirmó la muestra de OTRO_DNI.

**How to apply:** antes de subir documentos, verificar DNI leído = DNI del cliente. Ojo: algunos clientes sin cargar tienen en la base el DNI de un familiar (ej. 10108989 figura como EMERSON FLORES LIMACO y el escaneo es de SARITA LIMACO LIZANA); el número calza pero la persona no. Revisar el nombre del escaneo antes de subir esos. Relacionado: [[recuperacion-datos-historicos]].
