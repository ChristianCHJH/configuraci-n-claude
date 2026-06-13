# Plan A — Fix Preview (iteración 2)

## Contexto

Plan A ya implementado en iteración 1. Al revisar en el navegador se detectaron 3 problemas:

1. **Hero sin imagen de fondo** — Las URLs de imagen en `home.json` son absolutas (`/web-design/assets/images/...`). `resolvePreviewUrl` solo deja pasar URLs que empiezan con `http`; las que empiezan con `/` se pasan a `getAsset()` que no las resuelve correctamente.
2. **Sección "Iniciamos operaciones en el Perú en 1985..." ausente** — Texto hardcodeado en `HomeScreen.tsx:101-105`, no está en ningún JSON. El preview no lo muestra.
3. **Botón CTA "GESTIÓN LOGÍSTICA INTEGRAL" ausente** — También hardcodeado en `HomeScreen.tsx:108-115`, no en JSON.

El mismo bug de `resolvePreviewUrl` afecta logo en `SettingsPreview` e imágenes de servicios.

**Un solo archivo a tocar:** `public/admin/index.html`

---

## Decisión: un solo commit

El scope es un único archivo HTML standalone. No hay dependencias externas a instalar ni otros archivos que tocar. Se hace en una sola pasada.

---

## Cambios

### Fix 1 — `resolvePreviewUrl` (crítico, afecta todas las imágenes)

Agregar check para URLs que empiecen con `/` — deben pasar directo, igual que las `http`:

```js
function resolvePreviewUrl(getAsset, url) {
  if (!url) return null;
  if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) return url;
  var asset = getAsset(url);
  return asset ? asset.toString() : (url || null);
}
```

Esto arregla: hero background, imágenes de servicios, logo en Settings, certificaciones.

### Fix 2 — HomePreview: sección sub-texto + CTA button (hardcoded en React)

Después del bloque hero, antes de Comunicados, agregar dos secciones estáticas que replican lo que React tiene hardcodeado:

```js
// Sub-texto (hardcoded en HomeScreen.tsx:101-105)
h('section', { className: 'pw-subtext' },
  h('p', {}, 'Iniciamos operaciones en el Perú en 1985 brindando servicios logísticos, adaptándonos permanentemente a las necesidades de nuestros clientes.')
),

// CTA button (hardcoded en HomeScreen.tsx:108-115)  
h('section', { className: 'pw-cta-section' },
  h('button', { className: 'pw-cta-btn' }, 'GESTIÓN LOGÍSTICA INTEGRAL')
),
```

CSS nuevas clases:
- `.pw-subtext` — `max-width: 860px`, `margin: 0 auto`, `padding: 40px 24px`, `text-align: center`
- `.pw-subtext p` — `font-size: 1.25rem`, `color: #333`, `font-weight: 500`, `line-height: 1.7`
- `.pw-cta-section` — `display: flex`, `justify-content: center`, `padding: 0 24px 40px`
- `.pw-cta-btn` — fondo `#004a8c`, texto blanco, `padding: 16px 48px`, `border-radius: 8px`, `font-weight: 700`, `font-size: 1.1rem`, `text-transform: uppercase`, `letter-spacing: 0.12em`

---

### 1. CSS — base de fidelidad visual

**Eliminar** el override global `img { max-width: 200px !important }` (línea 33) — rompe galerías.

**Agregar** via `CMS.registerPreviewStyle()`:
- Google Fonts Montserrat (pesos 400/500/700/800/900) — misma fuente que producción
- CSS vars que replican el ThemeProvider: `--primary: #004a8c`, `--secondary: #002a50`, `--accent: #3b82f6`, `--text: #1a1a2e`

**Agregar** en el `<style id="preview-styles">` clases nuevas que imitan la estructura visual real:
- `.preview-hero` — `height: 65vh`, `position: relative`, imagen background con `object-fit: cover`, overlay `rgba(0,0,0,0.4)`
- `.preview-hero-title` — `font-size: var(--hero-title-size, 72px)`, `font-weight: 900`, `color: white`, `text-transform: uppercase`, Montserrat
- `.preview-comunicados-card` — `border-radius: 12px`, `box-shadow`, icon azul UNIMAR, fecha en pill gris
- `.preview-tarifas` — `background: #002a50`, `border-radius: 16px`, links blancos con ícono descarga
- `.preview-service-card` — imagen `height: 120px object-fit: cover`, título, short_desc
- `.preview-swatch` — chip de color cuadrado con hex label
- `.preview-nav-bar` — barra azul con links de nav en blanco

### 2. Helper `resolvePreviewUrl(getAsset, url)`

```js
function resolvePreviewUrl(getAsset, url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  var asset = getAsset(url);
  return asset ? asset.toString() : url;
}
```

Reemplaza los `getImg(...)` inline dispersos en todas las templates.

### 3. Helper `initThemeVars()`

Fetch de `theme.json` al arrancar el script para aplicar los CSS vars reales del tema al iframe (no hardcodeados). Aplica a `document.documentElement` del preview.

```js
function initThemeVars() {
  fetch('/web-design/locales/es/theme.json')
    .then(function(r) { return r.json(); })
    .then(function(t) {
      var s = document.documentElement.style;
      s.setProperty('--primary', t.colors.primary);
      s.setProperty('--secondary', t.colors.secondary);
      s.setProperty('--accent', t.colors.accent);
      s.setProperty('--hero-title-size', t.hero.title_size);
      s.setProperty('--hero-title-weight', t.hero.title_weight);
    });
}
```

Llamado una vez al inicio antes de registrar los templates.

### 4. HomePreview — mejorado + tarifas

Secciones a renderizar (en orden real del sitio):
1. **Hero** — imagen fondo full-width con overlay negro, título centrado con fuente/tamaño real, dots de slide en la base
2. **Comunicados** — título sección + grid de cards (ícono FileText azul, pill fecha, título en bold) — sin buscador (no interactivo)
3. **Tarifas** ← actualmente falta — fondo `#002a50`, título blanco, links de descarga con ícono Download

Fuente de datos en `home.json`: `hero.slides[]`, `comunicados.section_title/items[]`, `tarifas.section_title/items[]`

### 5. ServicesPreview — cabecera + galería limitada

Cambios respecto al actual:
- Agregar header con `cta_text` y `cross_selling_title` (actualmente ignorados)
- Limitar thumbs de galería a 4 + badge "+N más" si hay más
- Eliminar la sección "Imagen Tarjeta" suelta — integrarla como thumbnail dentro del card

Fuente: `services.json` → `cta_text`, `cross_selling_title`, `catalog[].{title, short_desc, image_url, gallery[]}`

### 6. AboutPreview — fix menor

Corregir `Section()` helper: mostrar siempre `title` + `content` por separado, no como fallback uno del otro.

### 7. SettingsPreview — NUEVO

Muestra:
- Logo del header (imagen real via `resolvePreviewUrl`)
- Barra de navegación mockup con los 6 labels reales (`nav.about`, `nav.services`, `nav.contact`, `nav.sst`, `nav.intranet`, `nav.client_portal`)
- Fila de logos de certificaciones (de `certifications[]`)

Fuente: `common.json`

### 8. ThemePreview — NUEVO

Muestra:
- 5 chips de color con hex + nombre de rol (primary, secondary, accent, text, bg)
- Demo de tipografía con la fuente configurada
- Demo del título hero con `title_size` y `title_weight` reales sobre fondo `primary`

Los valores son live — se leen directo de la entry que el editor está modificando, no del fetch.

### 9. Registro de templates

```js
CMS.registerPreviewTemplate('home', HomePreview);
CMS.registerPreviewTemplate('home_en', HomePreview);
CMS.registerPreviewTemplate('services', ServicesPreview);
CMS.registerPreviewTemplate('services_en', ServicesPreview);
CMS.registerPreviewTemplate('about', AboutPreview);
CMS.registerPreviewTemplate('about_en', AboutPreview);
CMS.registerPreviewTemplate('common_es', SettingsPreview);
CMS.registerPreviewTemplate('common_en', SettingsPreview);
CMS.registerPreviewTemplate('theme', ThemePreview);
```

---

## Archivo modificado

| Archivo | Acción |
|---|---|
| `public/admin/index.html` | Reescritura completa (único archivo) |

---

## Verificación

Servidores ya corriendo: `decap-server` en 8081, Vite en 5173.

Abrir `http://localhost:5173/web-design/admin/` y verificar:

- [ ] **home_es** → hero con imagen de fondo real (contenedores)
- [ ] **home_es** → texto "Iniciamos operaciones en el Perú en 1985..." visible bajo el hero
- [ ] **home_es** → botón "GESTIÓN LOGÍSTICA INTEGRAL" visible
- [ ] **home_es** → comunicados en cards / sección tarifas al fondo azul
- [ ] **services_es** → imágenes de servicio cargan correctamente
- [ ] **common_es** → logo del header visible
- [ ] Sin imágenes rotas en ninguna colección
