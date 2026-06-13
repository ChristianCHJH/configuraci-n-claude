---
name: Uber Driver - Limitación del árbol de accesibilidad
description: Uber Driver renderiza el card de viaje con Compose sin semántica; AccessibilityService no puede leer PEN, km ni destino del card
type: project
originSessionId: 68c7b4a3-d320-4b87-8aba-927953c882d8
---
## Hallazgo

El card de viaje de Uber Driver (tarifa, km de recogida, km de trayecto, calificación) **no aparece en el árbol de accesibilidad** de Android cuando se muestra al conductor.

**Why:** Uber Driver usa Jetpack Compose para renderizar el card del viaje sin configurar semántica de accesibilidad (`semantics { contentDescription = ... }`). Android solo expone al AccessibilityService lo que la app declara explícitamente como accesible.

**How to apply:** No intentar leer datos del card de Uber vía AccessibilityService. La única solución viable es OCR (MediaProjection + ML Kit Text Recognition). Quedó pendiente para implementar en el futuro.

## Evidencia

- `rootInActiveWindow` retorna la ventana principal de Uber (type=1), no una ventana modal
- `windows` del sistema muestra exactamente 4 ventanas: 2×systemui, 1×launcher, 1×ubercab.driver
- El parser encuentra 26 textos en la pantalla principal (menú, ganancias, etc.) pero cuando aparece el card del viaje, solo captura `[Radar de viajes, 2]`
- Textos como "PEN13.40", "A 10 min (3.1 km)", "Viaje: 10 min (3.1 km)" son completamente invisibles para el árbol de accesibilidad

## Solución futura

MediaProjection API + ML Kit Text Recognition (offline, gratis):
1. Evento de Uber detectado → screenshot via MediaProjection
2. ML Kit extrae texto de la imagen
3. Parser aplica regex sobre el texto extraído
