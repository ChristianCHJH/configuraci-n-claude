# Plan A — Mejoras Preview Decap CMS (web-desing)

## Contexto

El CMS (Decap v3) tiene previews registrados para 3 de las 5 colecciones: `home`, `services`, `about`. Faltan `settings` (common.json — logo, nav) y `look-and-feel` (theme.json — colores, fuentes). Además el preview de `home` no muestra la sección `tarifas` aunque sí está en el JSON. Plan A toca **únicamente** `public/admin/index.html` — React intacto, sin build step.

## Archivo modificado

**Un solo archivo:** `public/admin/index.html` (actualmente 163 líneas)

## Arquitectura del archivo

```
public/admin/index.html
├── <style id="preview-styles">   ← CSS con tokens UNIMAR (color, tipografía)
├── <script src="decap-cms.js">   ← CDN sin cambios
└── <script>
    ├── CMS.registerPreviewStyle()
    ├── helpers                   ← funciones reutilizables (resolvePreviewUrl, sectionHeader)
    ├── HomePreview               ← MEJORAR: agregar sección tarifas
    ├── ServicesPreview           ← MEJORAR: agregar cta_text / cross_selling_title
    ├── AboutPreview              ← sin cambios funcionales
    ├── SettingsPreview           ← NUEVO: logo + nav mockup
    ├── ThemePreview              ← NUEVO: swatches + demo tipografía
    └── CMS.registerPreviewTemplate × 5
```

Patrón: `createClass` (consistente con código existente — Decap v3 expone React internamente).

## Cambios detallados

### 1. CSS — `<style id="preview-styles">`
- Agregar variables CSS `--unimar-blue: #004a8c`, `--unimar-dark: #002a50`, etc.
- Quitar regla `img { max-width: 200px !important }` — rompe el layout de galerías
- Agregar clase `.preview-swatch` para los color chips del ThemePreview
- Agregar clase `.preview-nav-mock` para el nav bar del SettingsPreview

### 2. Helper `resolvePreviewUrl(getAsset, url)`
```js
function resolvePreviewUrl(getAsset, url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return getAsset(url);  // Decap resuelve rutas relativas al media_folder
}
```
Reemplaza los `getImg(...)` inline dispersos. Centraliza lógica.

### 3. `HomePreview` — agregar tarifas
- Después del bloque `comunicados`, agregar sección `tarifas`
- Renderiza `tarifas.section_title` + lista de items con nombre y link

### 4. `ServicesPreview` — agregar cabecera
- Antes del grid del catálogo, mostrar `cta_text` y `cross_selling_title`
- Mejora visual: limitar galería a max 4 thumbs con contador "+N"

### 5. `SettingsPreview` (nuevo)
- **Logo:** imagen grande centrada con label "Header Logo"
- **Nav mockup:** barra horizontal con los 6 labels (`about`, `services`, `contact`, `sst`, `intranet`, `client_portal`) en azul UNIMAR, simulando cómo se verían en el Header real

### 6. `ThemePreview` (nuevo)
- **Swatches de color:** fila de 5 chips (primary, secondary, accent, text, background) — cada chip muestra el hex y el nombre del rol
- **Muestra tipografía:** texto de ejemplo "UNIMAR Logística" renderizado con `font-family` configurado, en 3 pesos (400, 700, 900)
- **Hero demo:** el título "Impulsamos el Comercio Exterior" renderizado al `title_size` y `title_weight` configurados, sobre fondo del color `primary`

### 7. Registros
```js
CMS.registerPreviewTemplate('home', HomePreview);
CMS.registerPreviewTemplate('services', ServicesPreview);
CMS.registerPreviewTemplate('about', AboutPreview);
CMS.registerPreviewTemplate('settings', SettingsPreview);   // NUEVO
CMS.registerPreviewTemplate('look-and-feel', ThemePreview); // NUEVO
```

## Verificación

1. `npx decap-server` en puerto 8081 (requerido para dev local)
2. `npm run dev` en el repo
3. Abrir `http://localhost:5173/web-design/admin/`
4. Probar cada colección en modo Preview:
   - **home_es:** ver hero slides, comunicados Y tarifas
   - **services_es:** ver cabecera CTA + catálogo con galería limitada
   - **about_es:** sin cambio visual esperado
   - **common_es (settings):** ver logo renderizado + nav bar mockup
   - **theme (look-and-feel):** ver 5 swatches de color + demo tipografía + hero demo
5. Confirmar que las imágenes cargan (no rutas rotas)
6. Sin errores en consola del navegador

## Riesgo

Muy bajo — archivo HTML standalone sin compilación. Si algo falla, el CMS carga igual sin preview custom (degrada gracefully).
