# Plan: Shared Media Locale (Opción A)

## Contexto
Las imágenes viven duplicadas en `es/*.json` y `en/*.json`. Cuando el editor cambia una imagen en Tina, debe hacerlo en ambos idiomas — trabajo redundante, riesgo de inconsistencia. La solución: extraer todos los campos de imagen a `public/locales/shared/*.json`, una única fuente de verdad. Los componentes siguen recibiendo el mismo `HomeData`, `ServicesData`, etc. — solo el fetch cambia.

**Rama:** `feat/shared-media-locale`

---

## Arquitectura objetivo

```
public/locales/
  es/home.json       ← texto únicamente (sin campos imagen)
  en/home.json       ← texto únicamente (sin campos imagen)
  shared/home.json   ← imágenes únicamente (fuente única)
  ...idem para services, about, safety, common
```

---

## Pasos de implementación

### 1. Crear archivos `shared/*.json`

Extraer campos imagen de `es/*.json` a nuevos archivos. Estructura:

**`public/locales/shared/home.json`**
```json
{
  "hero":                    { "slides": [{ "image_url": "..." }] },
  "comercio_exterior_modal": { "image_url": "..." },
  "tarifas":                 { "items": [{ "icon_url": "..." }] },
  "certificaciones":         { "items": [{ "icon_url": "..." }] },
  "gestion_logistica":       { "items": [{ "icon_url": "..." }] }
}
```

**`public/locales/shared/services.json`**
```json
{
  "catalog": [
    {
      "id": "contenedores-vacios",
      "image_url": "...", "card_image": "...",
      "gallery": [{ "image": "..." }],
      "features_section": { "intro_image": "..." }
    }
  ]
}
```

**`public/locales/shared/about.json`**
```json
{
  "hero":           { "image_url": "..." },
  "history":        { "image_url": "..." },
  "operations":     { "image_url": "..." },
  "infrastructure": { "image_url": "..." }
}
```

**`public/locales/shared/safety.json`**
```json
{
  "hero":      { "image_url": "..." },
  "documents": [{ "icon_url": "..." }]
}
```

**`public/locales/shared/common.json`**
```json
{
  "brand":          { "logo": "..." },
  "certifications": [{ "logo": "..." }]
}
```

### 2. Limpiar `es/*.json` y `en/*.json`

Remover todos los campos `image_url`, `card_image`, `gallery[].image`, `icon_url`, `logo`, `intro_image` de los 5 archivos afectados en ambos idiomas. Los IDs de catálogo (`catalog[].id`) se quedan en es/en para el merge por id.

### 3. Añadir `fetchShared<T>()` al cliente HTTP

**`src/infrastructure/http/localeClient.ts`** — añadir:
```typescript
export async function fetchShared<T>(key: string): Promise<T> {
  const baseUrl = import.meta.env.BASE_URL;
  const res = await fetch(`${baseUrl}locales/shared/${key}.json?v=2`);
  if (!res.ok) throw new Error(`Failed to fetch shared/${key}.json`);
  return res.json() as Promise<T>;
}
```

### 4. Añadir `.getMedia()` a cada infrastructure service

Archivos afectados (misma firma en todos):
- `src/infrastructure/home/services/home.service.ts`
- `src/infrastructure/services/services/services.service.ts`
- `src/infrastructure/about/services/about.service.ts`
- `src/infrastructure/safety/services/safety.service.ts`
- `src/infrastructure/common/services/common.service.ts`

Patrón:
```typescript
import { fetchLocale, fetchShared } from '@infra/http/localeClient';
export const homeService = {
  get:      (lang: string) => fetchLocale<HomeData>('home', lang),
  getMedia: ()             => fetchShared<HomeMediaData>('home'),
};
```

### 5. Crear utility de merge

**`src/application/utils/media-merge.utils.ts`** — funciones puras, sin estado:

```typescript
// Merge por índice (slides, tarifas, etc.)
// Merge por id para services.catalog
// Deep merge simple para about, safety, common

export function mergeHomeMedia(text: HomeData, media: HomeMediaData): HomeData
export function mergeServicesMedia(text: ServicesData, media: ServicesMediaData): ServicesData
export function mergeAboutMedia(text: AboutData, media: AboutMediaData): AboutData
export function mergeSafetyMedia(text: SafetyData, media: SafetyMediaData): SafetyData
export function mergeCommonMedia(text: CommonData, media: CommonMediaData): CommonData
```

Para `services.catalog`: merge por `item.id` (robusto frente a reordenamiento).
Para arrays por índice (slides, tarifas items, etc.): `base.map((item, i) => ({ ...item, ...overlay[i] }))`.
Para objetos planos (about sections, safety hero): spread directo.

### 6. Añadir tipos `*MediaData`

En cada archivo de modelo de dominio existente, añadir la interfaz de solo imágenes al final del archivo (sin crear nuevas carpetas):

- `src/domain/home/models/home.model.ts` → `export interface HomeMediaData { ... }`
- `src/domain/services/models/services.model.ts` → `export interface ServicesMediaData { ... }`
- `src/domain/about/models/about.model.ts` → `export interface AboutMediaData { ... }`
- `src/domain/safety/models/safety.model.ts` → `export interface SafetyMediaData { ... }`
- `src/domain/common/models/common.model.ts` → `export interface CommonMediaData { ... }`

### 7. Actualizar hooks de aplicación

Cada hook hace dos fetches en paralelo y merge. Retorna el mismo tipo de antes → **componentes no cambian**.

**`src/application/services/hooks/use-services.ts`** (patrón para los 5 hooks):
```typescript
export const useServicesData = () => {
  const language = useAppStore(s => s.language);

  const textQ  = useQuery({ queryKey: ['services', language], queryFn: () => servicesService.get(language),   refetchInterval: inTinaPreview ? 2000 : false });
  const mediaQ = useQuery({ queryKey: ['services', 'shared'], queryFn: () => servicesService.getMedia(),      refetchInterval: inTinaPreview ? 2000 : false });

  const data = useMemo(
    () => textQ.data && mediaQ.data ? mergeServicesMedia(textQ.data, mediaQ.data) : textQ.data,
    [textQ.data, mediaQ.data]
  );

  return { ...textQ, data, isLoading: textQ.isLoading || mediaQ.isLoading, isError: textQ.isError || mediaQ.isError };
};
```

### 8. Actualizar Tina config

**`tina/config.ts`**:

- **Añadir** 5 nuevas collections `shared_home`, `shared_services`, `shared_about`, `shared_safety`, `shared_common`
  - `path: 'public/locales/shared'`, `match: { include: 'home' }` etc.
  - Solo contienen campos `type: 'image'`
- **Remover** todos los campos `type: 'image'` de las collections existentes (`home`, `services`, `about`, `safety`, `common`)

### 9. Actualizar queries GraphQL en componentes

Remover campos imagen de las query strings en:
- `src/presentation/home/screens/HomeScreen.tsx` → quitar `image_url` de slides, `icon_url` de items
- `src/presentation/services/screens/ServiceDetailScreen.tsx` → quitar `image_url`, `card_image`, `gallery { image }`, `intro_image`
- `src/presentation/about/screens/AboutScreen.tsx` → quitar todos los `image_url`
- `src/presentation/safety/screens/SafetyScreen.tsx` → quitar `image_url`, `icon_url`

> Los componentes ya reciben imágenes vía React Query merge (paso 7); la query de Tina es para inline editing de texto.

### 10. Regenerar tipos de Tina

```bash
npx tinacms build
```

---

## Verificación

1. `npm run dev` → abre la app, cambia idioma ES↔EN → mismas imágenes en ambos
2. `npx tinacms dev` → abre Tina, edita una imagen en "Servicios — Imágenes" → cambio visible en el preview sin tocar el locale ES ni EN
3. Buscar `image_url` en `es/services.json` y `en/services.json` → debe estar vacío
4. `npm run build` → sin errores TS
