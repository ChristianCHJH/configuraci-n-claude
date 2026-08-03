---
name: clon-web-unimar
description: "Clon de unimar.com.pe en Next.js (C:\\Users\\Christian\\Proyectos\\unimar-web); completo y verificado — 80 rutas, home + 15 páginas internas + 24 comunicados"
metadata: 
  node_type: memory
  type: project
  originSessionId: 14264043-062b-41ed-8872-5979fa6dee17
  modified: 2026-07-20T22:56:03.259Z
---

Christian quiere reconstruir la web pública de Unimar (unimar.com.pe) como clon pixel-perfect. Iniciado el 2026-07-20.

**Dónde vive:** `C:\Users\Christian\Proyectos\unimar-web` — proyecto separado, NO dentro del repo `unimar_tms` (que es solo documentación BMAD).

**Stack:** Next.js 16.2.10 + React 19.2.4 + Tailwind v4 + TypeScript + next-intl 4.13 (rutas `[locale]`, `proxy.ts` no `middleware.ts`) + Leaflet (mapa de sedes) + Playwright (extracción y QA).

## Estado: COMPLETO y verificado (2026-07-20)

80 rutas prerenderizadas (40 × 2 idiomas), todas SSG, **cero enlaces rotos**, todas las páginas dentro de **±2%** de la altura del original (la mayoría +0,3%). `tsc`, `eslint` y `build` limpios.

18 componentes · 16 páginas · 24 comunicados · 59 assets.

## Decisiones cerradas (no volver a preguntar)

- **Bilingüe es/en completo.** El inglés del original está casi todo sin traducir (los comunicados dicen "Sorry, this entry is only available in European Spanish"; en Empresa el "inglés" es el español copiado). Todo el inglés del clon es traducción propia.
- **`/contacto` NO se crea.** "Contactos" del pie apunta a `/`, como el original.
- **"Libro de Reclamaciones" se queda en español** también en inglés (registro exigido por ley peruana).
- **PDFs de tarifas:** el inglés del original apunta a PDFs obsoletos; el clon usa los vigentes en ambos idiomas.
- **Mapa de Ubicaciones: Leaflet + OpenStreetMap**, no Google. Conserva los 4 marcadores y el filtrado por checkbox del original sin API key ni facturación.
- **Trabaja con nosotros:** se mantiene el iframe a `grupo-unimar.sherlockhr.com/ofertas/` (verificado: permite embeber).
- **IGV se queda como IGV** en inglés, no se traduce a VAT: aparece literal en las facturas.

## Arquitectura propia del clon (no evidente desde el original)

- **Dos grupos de rutas hermanos**: `(interior)` para 14 páginas y `(interior-alta)` solo para `/empresa`. Comparten `ChromeInterior`; se separan porque `/empresa` usa tarjetas de servicio de 400px y el resto de 300px, y un layout de Next no puede leer datos de su hija.
- **Mensajes por página**: `messages/paginas/<pagina>.{es,en}.json`, cargados por `src/i18n/request.ts`. Evita conflictos de merge con builders en paralelo y reparte la traducción.
- **Comunicados en `src/content/`**, un archivo por comunicado, NO en los JSON de i18n: el listado necesita enumerar/ordenar/paginar (imposible tipado con next-intl) y `NextIntlClientProvider` enviaría los 24 al navegador en cada página.
- **`NextIntlClientProvider` estrechado** a `hero`, `nav`, `newsletter`, `topbar` — los únicos namespaces que usan Client Components.

## Trampas descubiertas (detalle en docs/research/BEHAVIORS.md)

- **El CSS y JS del tema original están en `docs/research/theme-src/`.** Descargarlos fue lo que más aceleró el proyecto: los valores se leen, no se estiman. Hacerlo antes que nada en cualquier clon futuro.
- **Reveal on scroll SOLO en la home.** Las internas tienen `.post` a cero. Reutilizar `ServiciosSection` con su reveal hacía que la sección saliera **vacía** en las internas (de ahí la prop `conReveal`).
- **Los tamaños de fuente no están en las reglas base** — el tema combina clases (`titulo_center grande` → 25px). Medir con `getComputedStyle` en vivo.
- **`body` es 14px/20px** (Bootstrap 3), pero `.main-content p` de las internas es **16px/26px**.
- **Colapso de márgenes:** mordió 4 veces (newsletter, cabecera móvil, fila de sectores, contenido interior). Si una sección sale desplazada pero sus tamaños internos son correctos, sospechar de esto. Arreglo: `flow-root`.
- **El hero es `100vh`**, no altura fija. Medir a dos alturas distintas con el mismo ancho antes de dar por fija una altura.
- **Tailwind v4 eliminó el `!` como prefijo** (`!text-white` no emite nada).
- **Extraer contenido pegado desde Word:** el cuerpo de los comunicados son `<div>` anidados y `<ul>` malformados cuyos hijos son `<p>`. Un selector `p, li, h*` pierde la mayor parte. La regla correcta es "texto propio = el suyo menos el de sus hijos de bloque" (ver `scripts/extraer-comunicados.mjs`).

## Restricción crítica — spam SEO

El WordPress original (v4.8, 2017) está comprometido: **28 enlaces de spam** (cracks de Office/Windows) dentro del `<li>` de "Inicio". `NAV_ITEMS` ya está limpio. **El clon no reproduce ninguno.**

**Tema cerrado por decisión suya:** tiene acceso al hosting pero pidió explícitamente NO investigar ni tocar nada de seguridad.

## Pendiente de Christian

1. **Destino del formulario de newsletter** — hay un `TODO(pendiente-cliente)` en `newsletter-section.tsx`. Hoy valida y responde OK sin enviar nada.
2. **Defectos del original detectados por los traductores**, por si quiere corregirlos en el clon: el comunicado 23-2025 omite un mes ("viernes 26 y 02 respectivamente"); el 14-2025 anuncia el 7 de junio pero va firmado el 4 de mayo; los 04/05-2026 dicen "les informamos nuestros horarios" y no listan ningún horario.
3. El paginador del original está roto (enlaza a páginas 4, 5 y 18 inexistentes). El clon lo hace bien; si prefiere replicar el bug, hay que decirlo.
