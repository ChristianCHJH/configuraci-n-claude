---
name: landing-estado-rediseno
description: Rediseño «Cuaderno de cuentas» publicado el 2026-10-17; pendientes y truco si el push vuelve a fallar
metadata:
  node_type: memory
  type: project
  originSessionId: 129ab36b-44e7-4f8e-9d06-77bce3c826d7
  modified: 2026-10-17T19:23:29.731Z
---

Al 2026-10-17 (fin de una sesión larga):

- La portada y los 12 rubros están rediseñados en el mundo «Cuaderno de cuentas» (DESIGN.md, contrato en .impeccable/surfaces/index-html.md) y PUBLICADOS en producción el 2026-10-17 (commit fe59a39).
- El push estuvo bloqueado: la parte de GitHub que recibe los push veía el repo vacío (sin ramas anunciadas) y rechazaba todo con «missing necessary objects». Se destrabó cuando Christian hizo un commit desde la web de GitHub. Si vuelve a pasar: hacer un commit chico desde la web, luego `git fetch` + `git rebase origin/main` y push.
- Hecho el 2026-10-17 (tarde): CLS bajado a <0,004 (fuentes de respaldo con size-adjust en portada.css + hueco reservado al botón de la demo), commit 612cdfb. Gimnasios: vale «vence este viernes» (a8cb227).
- Logo: Christian eligió la propuesta 1 «La casilla marcada» («abiel» en minúscula, el punto de la i es una casilla con visto). Archivos en assets/logo.svg, logo-claro.svg, favicon.svg. Se usan con <img> porque las máscaras tienen id fijo. El favicon viejo era una «A» naranja de Yanapay; las 13 imágenes OG también tenían el logo viejo.
- Pendientes, en orden:
  1. Logo publicado completo (c949634, 3093795, d90e6b0). Queda: .impeccable/design.json aún describe el logo viejo; favicon cobalto con poco contraste en pestañas oscuras.
  2. Seis rubros siguen con la lista genérica arriba: veterinarias (carnet), transporte (cuenta), inmobiliarias (plano), condominios (talonario), movilidad (libreta o ruta) y spas (agenda o ficha). Se agregan como renderers en PAPELES de herramientas/dispositivos.mjs.
  4. Falta una foto por rubro.
  5. Revisión final de impeccable a los rubros.
  6. Unos 39 valores sin documentar en DESIGN.md.
  7. PRODUCT.md desactualizado: ofrecer /impeccable init.
- Fuera de alcance por decisión de Christian: prueba social y analítica.

**Why:** la sesión se cortó por el límite de contexto; esto permite retomar sin rehacer el análisis.
**How to apply:** seguir con el CLS y después los rubros. Ver [[landing-casos-reales]], [[landing-yanapay-deploy]] y [[landing-es-produccion]].
