---
name: rediseno-cinematico
description: Estado y decisiones del rediseño total de la web UNIMAR en la rama redesign/impeccable (dirección «Cinemático» fotográfica)
metadata:
  node_type: memory
  type: project
  originSessionId: d6b184d0-1656-4dc9-ba07-70697edd68bf
  modified: 2026-10-28T21:37:57.170Z
---

Rediseño total en rama `redesign/impeccable` (iniciado 2026-10-28) con la skill impeccable (v4.8.0). Solo local, sin commits hasta que Christian lo pida.

- Christian RECHAZÓ la dirección gráfica «Señalética de patio» (letreros/carriles A–F): «no me gusta nada».
- Lo que prima para él: **fotos propias del trabajo, a pantalla completa de fondo**, lo más visual posible, como las webs de la competencia peruana (Tramarsa, DP World Callao, Contrans).
- Eligió el prototipo **A · Cinemático** (`public/proto/a.html`): hero de dron con Ken Burns, servicios como paneles de foto sticky apilados, franjas parallax. Contrato en `.impeccable/surfaces/src-presentation-home-screens-homescreen-tsx.md`.
- Solo colores #0F3E67 y #3F6585 + neutros. Cotizar y WhatsApp al mismo nivel. TinaCMS no necesario en el rediseño.
- Año de inicio confirmado: **1978** (PRODUCT.md corregido).
- Christian aprobó el Cinemático y lo despliega en Vercel desde la rama (subida a origin, nunca a main). Sección de servicios del Home: 3 variantes (A Explorador, B Carrusel, C Franjas) en `src/presentation/home/components/services/`, con selector A·B·C SIEMPRE visible (`preview = true` en ServicesSection.tsx) para elegir en una presentación. Tras la elección: dejar solo la elegida, quitar el selector y borrar `StackedPanels`/`stacked-panels.utils` sin uso.
- Pendientes de Christian: número de WhatsApp (puertas en «pendiente»), destino del formulario (`VITE_CONTACT_ENDPOINT`), originales de fotos ≥2560 px, fotos de Paita/BPA/flota.

**Why:** evita volver a proponer direcciones gráficas abstractas; el cliente decide por imagen real.
**How to apply:** en cambios visuales de esta web, priorizar fotografía propia a sangre; mostrar prototipos navegables antes de construir. Ver [[feedback-prototipos-visuales]].
