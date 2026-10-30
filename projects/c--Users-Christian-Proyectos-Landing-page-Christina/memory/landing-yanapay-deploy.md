---
name: landing-yanapay-deploy
description: "Cómo se despliega la landing Abiel (ex Yanapay), flujo de git y datos comerciales confirmados"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4b920999-5138-42c4-b6ef-4cae3734cdb7
  modified: 2026-09-19T06:40:47.996Z
---

- Producción: Vercel, https://landing-page-personal-kappa.vercel.app (se despliega solo al hacer push a `main`). `.vercelignore` oculta los .md y los archivos de Docker.
- El 2026-10-17 la marca se renombró de Yanapay a **Abiel** (Abigail + Daniel, los hijos de Christian; se eligió porque Yanapay recordaba al Bono Yanapay del gobierno). Adifnex es otro producto (SaaS de tienda), no la marca de esta landing.
- El generador de rubros escribe bien las 12 páginas pero falla al final al buscar `rubro-grid` en index.html (la portada nueva ya no la tiene), así que el sitemap no se regenera. Las páginas de rubro siguen con el `style.css` antiguo.
- Al 2026-09-19 el dominio `yanapay.tech` NO está registrado; no usarlo en enlaces ni en el correo.
- Christian quiere commits directos a `main` y push, sin PR (usando la skill christian-commit).
- Precio confirmado: planes desde S/ 90 al mes. Contacto solo por WhatsApp +51 913 412 590.
- El repo de GitHub es público.
- Las 12 landings por rubro (`/veterinarias/`, etc.) se generan con `node herramientas/generar-rubros.mjs` desde `herramientas/rubros.json`; nunca editar a mano las carpetas generadas. La imagen para compartir de cada rubro vive en `assets/og/<slug>.jpg`.

Relacionado: [[landing-es-produccion]]
