---
name: variantes-catalogo
description: Sistema de variantes (Talla/Color) por producto y su filtro en el catálogo público
metadata: 
  node_type: memory
  type: project
  originSessionId: cf53288e-61c4-4775-80e5-642b55b63cd3
---

El sistema de **variantes/clasificación** de venta-inventario ya está implementado en la app interna: `atributo_tipo` con flag `genera_variante` (Talla/Color = generadores → producen `producto_variante` por producto cartesiano; Material/Género/Temporada = descriptivos, solo para filtros). 10 tablas (migraciones 026 + 031), módulos `VariantesModulo` y `AtributosModulo`, tab "Variantes" en `productos-premium`.

Desde 2026-06-17, el **catálogo público Next.js** filtra por variante: `/pub/{slug}/productos` incrusta `atributos[]` por producto (DISTINCT raw, solo generadores, sin filtrar por stock). El frontend deriva facetas client-side en `catalogo/lib/facetas.ts` (`derivarFacetas`, `filtrarPorFacetas` = OR intra-grupo / AND entre grupos) y muestra un **filtro de variantes en sidebar izquierdo en ambas plantillas** (`catalogo-grilla` y `catalogo-esencias`): chips para talla, swatches para color.

**Decisión de Christian:** el sidebar izquierdo es SOLO variantes. Los descriptivos y las categorías ("ropa de invierno", "ropa de niños") irán en el navbar/arriba más adelante — el backend ya queda preparado pero no se renderizan aún.

Detalle en el wiki de Viernes: `proyectos/venta-inventario-variantes-categorias.md`. Ver [[feedback-setup-completo-sql]] para cambios de BD.
