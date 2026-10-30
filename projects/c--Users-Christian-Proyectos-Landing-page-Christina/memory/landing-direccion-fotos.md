---
name: landing-direccion-fotos
description: "Dirección visual pedida por Christian el 2026-10-17 tras rechazar el cuaderno y tres propuestas de impeccable: fotos de negocios peruanos de fondo, poco texto, dolor + WhatsApp, comparativa con la app"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e928fe6d-afda-4bd8-87c3-f6b330c6c680
  modified: 2026-10-18T06:16:18.488Z
---

El 2026-10-17 Christian rechazó el mundo «Cuaderno de cuentas» (cuadrícula + cobalto: cargado, frío, escolar) y también las tres direcciones que propuso impeccable (kraft «Listo para despachar», «Cartel de bodega» fosforescente, riso «Dos tintas»): «ninguno empuja».

Lo que quiere:
- Fotos reales de negocios peruanos DE FONDO (esto revierte la regla anterior «fotos nunca de fondo»), con transición entre negocios (colegio, mercado, tienda que vende por TikTok…), para que el visitante se reconozca al entrar.
- Poco texto: ver su dolor en una línea y WhatsApp de frente.
- Comparativa «hoy lo haces así» vs «en la app se vería así», mostrando pantallas de la aplicación.
- La web es solo la portada (rubros eliminados el mismo día, commit a57f28e).
- El logo «casilla marcada» se queda; su color puede adaptarse a la paleta nueva.

Prototipo en .impeccable/mocks/fotos/ (index.html, estilos.css, app.js, datos.js, img/, CREDITOS.md), servido con `python -m http.server 8770` desde la raíz. Segunda vuelta (2026-10-17): 1) primera pantalla general (dueño anotando, titular actual, 4 tareas, WhatsApp general); 2) «¿Qué negocio tienes?» con 6 rubros (colegio, tienda TikTok, movilidad, clínica dental, ferretería, inmobiliaria) + línea «También trabajo con…»; 3) comparativa Hoy/Con Abiel; 4) precio. Christian observó que la foto del aula (colegio) y la HiAce rural (movilidad) no eran coherentes; se cambiaron, pero no hay fotos libres de colegio ni movilidad limeños: lo ideal son fotos propias. Falta que apruebe y pasarlo a producción.
Tercera vuelta (2026-10-17): todo avanza solo también con movimiento reducido (Christian tiene las animaciones de Windows apagadas: con reduce se hace fundido sin zoom, nunca pausado de inicio); primera pantalla con 4 fotos del problema que tachan su tarea; GSAP + ScrollTrigger 3.12.5 por sección; foto de lotes con líneas de cal para inmobiliaria; nueva sección de casos reales («Ya lo hice para otros negocios») entre comparativa y precio.
Cuarta vuelta (2026-10-17): casos con capturas enteras (sin cover ni zoom), plano fijo en móvil, subgrid para alinear; nada oculto con reduce; texto de la primera pantalla siempre sólido; fotos nuevas de «cobrar» (Mico Medel) y «Excel» (Sukanto Roy). Pendientes: «También trabajo con…» pierde contraste sobre foto clara durante la transición; tienda.webp viene cortada de origen (recapturar en yanapay-videos); fotos propias de colegio, movilidad y boletas serían lo ideal; luego pasar a producción.
2026-10-18 (tarde): PUBLICADO en producción (460eb9f…30b68ed): index.html + estilos.css + app.js + datos.js en la raíz, fotos en assets/fotos/ (créditos en CREDITOS.md), og.jpg nueva, DESIGN.md reescrito; portada.css/portada.js/style.css/main.js borrados. Pendientes: lastmod del sitemap, fotos propias (colegio, movilidad, boletas), «También trabajo con…» con poco contraste sobre foto clara, tienda.webp cortada de origen, PRODUCT.md desactualizado.
Antes: prototipo subido a main (42a8de6), pero NO estaba en la web: Vercel ignora .impeccable. Siguiente paso, en chat nuevo: llevarlo a index.html + CSS/JS de raíz (reemplaza el cuaderno), mover fotos a assets/ con créditos, actualizar DESIGN.md/PRODUCT.md y publicar.

Público de las fotos (2026-10-18): emprendedores urbanos, gente joven o adulta que maneja su negocio en la ciudad (tienda, local, venta por redes). Christian rechazó en la primera pantalla a una señora con velo (Indonesia), un señor mayor y una señora en un ambiente rural: «no está acondicionado nuestro negocio a esos tipos de negocios». Nada rural, nada de mercados de otros países con rasgos culturales ajenos al Perú.

**Why:** busca identificación inmediata del dueño de negocio, no una metáfora visual (objetos, papeles, impresión).
**How to apply:** no volver a proponer mundos-objeto ni sorteos de concept-seed para esta landing; la dirección está fijada por el brief. Prototipar primero fuera de producción (.impeccable/mocks/) y mostrar antes de tocar index.html. Ver [[landing-estado-rediseno]] y [[landing-es-produccion]].
