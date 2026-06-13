---
name: Estilos CSS mínimos — PrimeNG y Tailwind primero
description: El usuario exige que PrimeNG y Tailwind sean la primera opción para estilos; CSS manual solo como último recurso absoluto
type: feedback
originSessionId: eeece41f-6cc7-493b-908f-de03e49d8d52
---
Siempre usa PrimeNG y Tailwind antes de escribir CSS manual. El CSS de componente es el último recurso.

**Why:** El usuario notó que se estaba escribiendo demasiado CSS custom (clases como `.card-seccion`, `.badge-orden`, `.card-toggle`, etc.) cuando PrimeNG y Tailwind ya resuelven esos casos. Esto genera archivos CSS grandes, difíciles de mantener, y duplica lógica visual.

**How to apply:**
1. PrimeNG components + props primero (`styleClass`, `severity`, `p-card`, `p-tag`, `p-button`, etc.)
2. Tailwind utilities segundo (layout, spacing, color, tipografía)
3. Clase global en `styles.scss` si el patrón se repite en 2+ componentes
4. SCSS de componente solo cuando sea absolutamente imposible con las opciones anteriores
