---
name: landing-casos-reales
description: Qué productos reales de Christian se muestran en la landing Abiel (ex Yanapay) y con qué reglas de privacidad
metadata:
  node_type: memory
  type: project
  originSessionId: 129ab36b-44e7-4f8e-9d06-77bce3c826d7
  modified: 2026-10-17T17:31:30.829Z
---

Decidido por Christian el 2026-10-17 para la sección de trabajos reales de la landing:

- Entran 3 casos: Inmobiliaria (venta de lotes), Movilidad Escolar y Tienda/catálogo. Hormiga NO entra (es app de hogar, no sistema para negocio).
- Inmobiliaria BL se muestra ANÓNIMA: "inmobiliaria de venta de lotes en Lima", marca demo "Horizonte", datos ficticios. Nunca el nombre ni el logo de BL.
- Movilidad Escolar: en capturas reemplazar la familia "Jara" (Rufo Jara) de la semilla por apellidos genéricos.
- Nunca usar capturas del sistema inmobiliario levantado con la base local (tiene ~1500 pagos con nombres reales) ni nada de `inmobiliaria\documentos-inmobiliaria\` (DNI, contratos).
- Las 3 apps Android están solo en prueba interna de Play: no decir "disponible en Play Store".
- Remotion (skill 4.0.536, licencia gratis para empresa unipersonal) se usa solo como herramienta de producción en carpeta aparte; a la web van MP4/WebM livianos con poster, no @remotion/player.

**Why:** la landing está en producción y la ven clientes; ver [[landing-es-produccion]].
**How to apply:** antes de agregar cualquier captura o video, revisar que no tenga nombres, DNI ni datos de clientes reales. Ver también [[landing-yanapay-deploy]].
