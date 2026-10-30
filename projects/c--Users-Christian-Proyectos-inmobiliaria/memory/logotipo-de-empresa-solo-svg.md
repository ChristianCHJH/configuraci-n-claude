---
name: logotipo-de-empresa-solo-svg
description: "El logo de cada empresa es un SVG oficial versionado en el sistema por RUC; nadie lo sube a mano; sin logo, el comprobante sale sin logo"
metadata:
  node_type: memory
  type: project
  originSessionId: 517bd367-4ce2-4134-b3e3-4b2bdff01335
  modified: 2026-10-26T01:20:41.101Z
---

Cada empresa emisora tiene su logo oficial en SVG sin fondo, versionado dentro de la API y nombrado por RUC: BL Inmobiliaria `20610694871`, Grupo Limaco `20616181778`. Los originales están en `inmobiliaria/0-marca/` (blp-logo.svg, limaco-logo.svg), calcados con potrace desde la imagen del cliente.

No hay carga manual: Christian no quiere que una persona pueda cambiar la marca desde la app (decidido el 2026-10-25, PR #124). Para cambiar un logo se reemplaza el SVG en el código y se despliega.

Si una empresa no tiene SVG oficial, el comprobante sale sin logo: nunca con el de otra empresa.

**Why:** el comprobante imprimía el PNG fijo de BLP para cualquier empresa, también para LIMaco.
**How to apply:** si el cliente entrega un logo nuevo, se pide el SVG (o se vectoriza la imagen) y se versiona con el RUC como nombre; no proponer volver a la subida manual.
