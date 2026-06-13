# Plan: Migración Decap CMS → Tina CMS (Self-Hosted)

## Context

El sitio corporativo UNIMAR usa Decap CMS para edición de contenido. El editor trabaja con formularios en un iframe separado que drifta respecto al React real. Plan B: migrar a Tina CMS (Apache 2.0, self-hosted, $0) para obtener edición inline en el sitio real. Decisiones ya tomadas: GitHub adapter (sin DB), servidores físicos Unimar para el backend de edición, GitHub Pages sigue sirviendo el sitio público estático.

**Problema principal:** El editor no puede editar texto hardcodeado en `HomeScreen.tsx` (~líneas 102–113), los slides del hero tienen layout fijo (`text-center`), y el pipeline de deploy no existe aún.

---

## Arquitectura resultante

```
Visitantes públicos → GitHub Pages (build estático, sin Tina en runtime)
Editores           → Servidor Unimar (Node.js + Tina server + mismo React app)
                          ↓ commit JSON
                     GitHub repo → GitHub Actions → build → gh-pages branch
```

React sigue leyendo `public/locales/{lang}/{feature}.json` vía `fetchLocale`. Tina lee/escribe los mismos archivos. `useTina` hook es no-op en el build estático.

---

## 7 Fases

### Fase 1 — Instalación y Schema (Local · Riesgo: Bajo · Esfuerzo: Medio)

**Goal:** Instalar Tina, definir `tina/config.ts` con las 12 colecciones. El build de Vite debe quedar idéntico.

Tareas:
1. `npm install tinacms @tinacms/datalayer` (runtime) + `tinacms` CLI (dev)
2. Crear `tina/config.ts` con 1 collection por `{feature}_{lang}` apuntando a `public/locales/{lang}/{feature}.json`. Incluir desde ya los 4 layout fields en hero slides.
3. Agregar a `package.json`: `"tina:dev": "tinacms dev -c 'vite'"`, `"tina:build": "tinacms build && vite build"`
4. Agregar `tina/__generated__/` a `.gitignore`
5. Verificar: `npm run build` produce output idéntico; `npx tsc --noEmit` sin errores

**Archivos:** `package.json`, `.gitignore`, nuevo `tina/config.ts`

**Theme singleton:** `theme.json` no tiene variante EN — definir `theme_es` + `theme_en` apuntando a ambos archivos (ya existen, `useThemeData` los fetch con language param).

---

### Fase 2 — Extraer Contenido Hardcodeado (Local · Riesgo: Bajo · Esfuerzo: Pequeño)

**Goal:** Mover 2 strings hardcodeados de `HomeScreen.tsx` a JSON + schema. Editores los controlan desde Tina.

Tareas:
1. Agregar a `public/locales/es/home.json` y `en/home.json` en raíz:
   ```json
   "description": "Iniciamos operaciones en el Perú en 1985...",
   "cta_button_text": "GESTIÓN LOGÍSTICA INTEGRAL"
   ```
2. Actualizar `src/domain/home/models/home.model.ts` — agregar `description: string` y `cta_button_text: string` a `HomeData`
3. Actualizar `HomeScreen.tsx` líneas ~102–113: reemplazar strings hardcodeados por `{home.description}` y `{home.cta_button_text}`
4. Actualizar `tina/config.ts` — agregar ambos campos a `home_es` / `home_en`

**Archivos:** `public/locales/es/home.json`, `public/locales/en/home.json`, `src/domain/home/models/home.model.ts`, `src/presentation/home/screens/HomeScreen.tsx`, `tina/config.ts`

---

### Fase 3 — Hero Layout Fields Dinámicos (Local · Riesgo: Medio · Esfuerzo: Pequeño)

**Goal:** Los 4 campos de layout del hero slide (ya en JSON desde Fase 2, ya en schema desde Fase 1) deben manejar el CSS. Eliminar `text-center max-w-6xl mx-auto` hardcodeado.

Tareas:
1. Agregar a cada slide en `home.json` (es + en) los defaults:
   ```json
   "text_position": "center",
   "text_align": "center",
   "text_has_box": false,
   "overlay_opacity": 40
   ```
2. Actualizar `HeroSlide` en `home.model.ts` — agregar 4 campos como opcionales
3. Crear helper `getSlideLayoutClasses(slide)` en `src/application/utils/hero.utils.ts` — mapea `text_position` a clases Tailwind completas (no interpolación dinámica)
4. `HomeScreen.tsx`: usar helper para posicionamiento, `style={{ backgroundColor: \`rgba(0,0,0,${opacity/100})\` }}` para overlay, wrapper condicional para `text_has_box`

**Archivos:** `public/locales/*/home.json`, `src/domain/home/models/home.model.ts`, `src/presentation/home/screens/HomeScreen.tsx`, nuevo `src/application/utils/hero.utils.ts`

**Nota:** `overlay_opacity` usa inline style (no clase Tailwind dinámica — JIT requiere clases completas en fuente).

---

### Fase 4 — Integración useTina en Componentes (Local · Riesgo: Medio · Esfuerzo: Grande)

**Goal:** Agregar `TinaProvider` + `useTina` wrapper a todos los screens. En build estático: no-op. En servidor Tina: activa overlays de edición inline.

Tareas:
1. `src/main.tsx`: envolver app con `<TinaProvider>` (importar de `tinacms`)
2. Patrón a aplicar en cada screen (Option A — parallel paths):
   ```tsx
   // useTina como passthrough en static mode
   const { data } = useTina({
     query: '',
     variables: {},
     data: queryResult.data ?? {},
   });
   const home = data as HomeData;
   ```
3. Aplicar a: `HomeScreen`, `AboutScreen`, `ServiceDetailScreen`, `ContactScreen`, `Header`, `Footer`
4. Crear `tina/client.ts` stub para TypeScript; el directorio `tina/__generated__/` lo genera `tinacms build`

**Archivos:** `src/main.tsx`, los 6 archivos de screens/layouts mencionados, nuevo `tina/client.ts`

**Verificación:** `npm run build` + `npm run preview` — sitio 100% funcional. En Network tab: sin WebSocket a servidor Tina (no está corriendo). Bundle size aumenta levemente (tree-shaken en prod).

---

### Fase 5 — Backend Self-Hosted en Servidor Unimar (Servidor · Riesgo: Alto · Esfuerzo: Grande)

**Goal:** Tina server corriendo en servidor físico Unimar. Editores acceden a `https://admin.unimar.com.pe` para editar inline.

Tareas:
1. Crear `tina/server.ts` — Express + `@tinacms/datalayer` GitHub adapter. Variables de entorno requeridas:
   - `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_PERSONAL_ACCESS_TOKEN` (PAT con Contents R/W)
   - `NEXTAUTH_SECRET` para sesiones de editor
2. Crear GitHub OAuth App — callback: `https://admin.unimar.com.pe/api/auth/callback/github`
3. Agregar `"tina:start": "node tina/server.js"` a `package.json`
4. Crear `.env.example` documentando vars requeridas (nunca commitear `.env` real)
5. Nginx reverse proxy en servidor → HTTPS via Let's Encrypt → `localhost:PORT`

**Archivos:** nuevo `tina/server.ts`, `package.json`, nuevo `.env.example`; config Nginx en servidor (fuera del repo)

**Verificación:** Login en `https://admin.unimar.com.pe` con GitHub. Editar título de slide. Confirmar commit en `mhernandez-unimar/web-desing` con cambio en `public/locales/es/home.json`.

---

### Fase 6 — CI/CD: GitHub Actions Deploy Pipeline (Local+Server · Riesgo: Medio · Esfuerzo: Pequeño)

**Goal:** Crear el pipeline faltante. Cada push a `main` (incluyendo edits de Tina) → build → GitHub Pages automáticamente.

Tareas:
1. Crear `.github/workflows/deploy.yml`:
   - Trigger: `push` a `main`
   - Node 20, `npm ci`, `npm run build` (ya incluye `tsc -b && vite build`)
   - Deploy `dist/` a `gh-pages` branch via `peaceiris/actions-gh-pages@v3`
   - Permissions: `contents: write`
2. Configurar GitHub Pages en repo settings: source = `gh-pages` branch, folder `/root` (una vez, en UI)
3. Opcional: `.github/workflows/tina-validate.yml` en PRs — `tinacms build` + `tsc --noEmit`

**Archivos:** nuevo `.github/workflows/deploy.yml`, opcional `tina-validate.yml`

**Verificación:** Push trivial a `main` → Actions tab verde → cambio visible en `https://mhernandez-unimar.github.io/web-desing/` en ~2 min.

---

### Fase 7 — Baja de Decap + Limpieza Final (Local · Riesgo: Bajo · Esfuerzo: Pequeño)

**Goal:** Eliminar todos los artefactos de Decap. El repo queda limpio sin referencias al CMS anterior.

Tareas:
1. Eliminar `public/admin/config.yml` y `public/admin/index.html`
2. `Header.tsx`: reemplazar `href` al admin de Decap por `https://admin.unimar.com.pe` (desde env var o constante en `src/application/utils/constants.ts`)
3. `CLAUDE.md` del proyecto: actualizar sección Decap CMS → Tina CMS
4. Quitar referencia a `decap-cms-oauth.vercel.app` de cualquier archivo del repo

**Archivos:** eliminar `public/admin/`, actualizar `src/presentation/shared/layouts/Header.tsx`, `CLAUDE.md`

**Verificación:** `npm run build` → `dist/` sin carpeta `admin/`. Todas las rutas funcionales. Admin link apunta a servidor Tina.

---

## Resumen

| # | Fase | Riesgo | Entorno | Entregable clave |
|---|------|--------|---------|-----------------|
| 1 | Instalación y Schema | Bajo | Local | `tina/config.ts` con 12 colecciones |
| 2 | Extraer strings hardcodeados | Bajo | Local | `description` + `cta_button_text` en JSON |
| 3 | Hero layout dinámico | Medio | Local | 4 campos controlan CSS del slider |
| 4 | Integración `useTina` | Medio | Local | Editing overlays listas; build estático sin cambios |
| 5 | Backend self-hosted | Alto | Servidor | Editores acceden a `admin.unimar.com.pe` |
| 6 | CI/CD GitHub Actions | Medio | Ambos | Push → deploy automático |
| 7 | Baja de Decap | Bajo | Local | Repo limpio, sin `public/admin/` |

**Fases 1–4:** desarrollo local, sin tocar producción, reversibles.
**Fases 5–7:** infraestructura + producción, coordinar con servidor Unimar.

## Archivos críticos

- `tina/config.ts` — nuevo, central (no existe aún)
- `src/presentation/home/screens/HomeScreen.tsx` — más cambios acumulados
- `src/domain/home/models/home.model.ts` — extender con nuevos campos
- `src/main.tsx` — agregar `TinaProvider`
- `.github/workflows/deploy.yml` — nuevo, habilita deploy automático

## Reutilizar existente

- `src/application/utils/url.utils.ts:resolveImageUrl` — sin cambios, sigue funcionando con Tina
- `src/infrastructure/http/localeClient.ts:fetchLocale` — sin cambios, sigue como path estático
- `src/application/stores/app.store.ts:useAppStore` — sin cambios, Tina no afecta el language toggle
- Todos los hooks `use-*.ts` — sin cambios en la firma pública; solo se agrega `useTina` wrapper en los screens
