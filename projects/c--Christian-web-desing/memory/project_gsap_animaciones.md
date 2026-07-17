---
name: project_gsap_animaciones
description: Stack GSAP y patrón de animación reveal/parallax en el sitio Unimar
metadata: 
  node_type: memory
  type: project
  originSessionId: 1313644b-d1a0-4293-95f7-4ec984e9d438
---

Sitio web Unimar incorpora **GSAP** (`gsap` + `@gsap/react`) para animaciones, agregadas pantalla por pantalla bajo libertad de diseño del usuario (se permiten gradientes nuevos; NO cambiar colores de marca — primary `#0F3E67` / secondary `#3F6585`).

**Capa**: GSAP vive SOLO en `presentation` (es preocupación de presentación, no toca application/infra/domain).

Módulos compartidos:
- `src/presentation/shared/animation/gsap.setup.ts` — registra plugins (useGSAP, ScrollTrigger) UNA vez + `prefersReducedMotion()`.
- `src/presentation/shared/animation/useScrollReveal.ts` — hook reutilizable: revela en cascada `[data-reveal]` dentro de un scope con `ScrollTrigger.batch`, respeta reduced-motion, acepta `dependencies` para datos async. Alias import: `@shared/animation/useScrollReveal`.

**Patrón**: componente toma `useRef`, llama `useScrollReveal(root)`, marca elementos con `data-reveal`. PageHero (compartido) tiene parallax propio (fondo `h-[120%]`, `yPercent:-15` scrub) + reveal de entrada (`data-hero-reveal`) + gradiente de marca `from-primary/85 via-secondary/25`.

Hecho (2026-06-22): TODAS las pantallas principales animadas — ServiceDetailScreen, HomeScreen (CertificationsGrid, LogisticsGrid, ComunicadosSection, TarifasGrid), AboutScreen, SafetyScreen, ContactScreen (LocationInfo, ContactForm) + PageHero (parallax+intro). También Header (gradiente barra + intro slide-down + subrayado-degradado en nav) y Footer (gradiente secondary→primary + glow).

Detalle clave del patrón: cada COMPONENTE con grid propio (home) lleva su PROPIO `useScrollReveal` scopeado a su ref para evitar que un hook a nivel screen vuelva a capturar sus `[data-reveal]` (doble init = conflicto). Screens sin hijos con hook (About/Safety/Contact) usan un único hook en el root div. Heroes usan `data-hero-reveal` (no `data-reveal`) para no colisionar.
