---
name: landing-yanapay-deploy
description: "Cómo se despliega la landing Yanapay, flujo de git y datos comerciales confirmados"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4b920999-5138-42c4-b6ef-4cae3734cdb7
  modified: 2026-09-19T06:40:47.996Z
---

- Producción: Vercel, https://landing-page-personal-kappa.vercel.app (se despliega solo al hacer push a `main`). `.vercelignore` oculta los .md y los archivos de Docker.
- Al 2026-09-19 el dominio `yanapay.tech` NO está registrado; no usarlo en enlaces ni en el correo.
- Christian quiere commits directos a `main` y push, sin PR (usando la skill christian-commit).
- Precio confirmado: planes desde S/ 90 al mes. Contacto solo por WhatsApp +51 913 412 590.
- El repo de GitHub es público.
- Las 12 landings por rubro (`/veterinarias/`, etc.) se generan con `node herramientas/generar-rubros.mjs` desde `herramientas/rubros.json`; nunca editar a mano las carpetas generadas. La imagen para compartir de cada rubro vive en `assets/og/<slug>.jpg`.

Relacionado: [[landing-es-produccion]]
