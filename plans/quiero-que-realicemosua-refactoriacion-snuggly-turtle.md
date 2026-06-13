# Plan: Refactorización Arquitectural — web-design → patrón UMS

## Contexto

El proyecto `web-design` tiene una arquitectura plana (type-based): `pages/`, `components/`, `hooks/`, `store/`, `lib/`. El proyecto UMS usa **Clean Architecture en 4 capas** con path aliases, barrel exports y feature-slices dentro de cada capa. La refactorización replica esa estructura sin crear lógica nueva — solo reorganiza archivos existentes y actualiza imports.

---

## Arquitectura objetivo

```
src/
├── domain/                    ← Tipos e interfaces por feature (del types.ts actual)
│   ├── home/models/home.model.ts
│   ├── services/models/services.model.ts
│   ├── about/models/about.model.ts
│   ├── contact/models/contact.model.ts
│   └── common/models/common.model.ts
│
├── application/               ← Hooks + stores + utils
│   ├── stores/
│   │   └── app.store.ts       ← (= store/useAppStore.ts)
│   ├── home/hooks/use-home.ts
│   ├── services/hooks/use-services.ts
│   ├── about/hooks/use-about.ts
│   ├── contact/hooks/use-contact.ts
│   ├── common/hooks/use-common.ts
│   ├── theme/hooks/use-theme.ts
│   └── utils/url.utils.ts     ← (= lib/utils.ts → resolveImageUrl)
│
├── infrastructure/            ← Capa de acceso a datos
│   ├── http/
│   │   └── localeClient.ts    ← fetch wrapper para /locales/*.json
│   └── {feature}/services/
│       ├── home.service.ts
│       ├── services.service.ts
│       ├── about.service.ts
│       ├── contact.service.ts
│       ├── common.service.ts
│       └── theme.service.ts
│
└── presentation/              ← UI por feature
    ├── home/screens/HomeScreen.tsx
    ├── about/screens/AboutScreen.tsx
    ├── services/screens/ServiceDetailScreen.tsx
    ├── contact/screens/ContactScreen.tsx
    ├── safety/screens/SafetyScreen.tsx
    ├── whatsapp/screens/WhatsAppRedirectScreen.tsx
    └── shared/
        ├── components/
        │   ├── Modal.tsx
        │   ├── WhatsAppButton.tsx
        │   └── index.ts
        └── layouts/
            ├── MainLayout.tsx
            ├── Header.tsx
            ├── Footer.tsx
            ├── ThemeProvider.tsx
            └── index.ts
```

---

## Mapa de movimiento de archivos

| Archivo actual | Nuevo path |
|---|---|
| `src/types.ts` | Fragmentado en `src/domain/*/models/*.model.ts` |
| `src/hooks/useData.ts` | Fragmentado en `src/application/*/hooks/use-*.ts` |
| `src/store/useAppStore.ts` | `src/application/stores/app.store.ts` |
| `src/lib/queryClient.ts` | `src/infrastructure/http/queryClient.ts` |
| `src/lib/utils.ts` | `src/application/utils/url.utils.ts` |
| `src/components/layout/Layout.tsx` | `src/presentation/shared/layouts/MainLayout.tsx` |
| `src/components/layout/Header.tsx` | `src/presentation/shared/layouts/Header.tsx` |
| `src/components/layout/Footer.tsx` | `src/presentation/shared/layouts/Footer.tsx` |
| `src/components/layout/ThemeProvider.tsx` | `src/presentation/shared/layouts/ThemeProvider.tsx` |
| `src/components/ui/Modal.tsx` | `src/presentation/shared/components/Modal.tsx` |
| `src/components/ui/WhatsAppButton.tsx` | `src/presentation/shared/components/WhatsAppButton.tsx` |
| `src/pages/Home.tsx` | `src/presentation/home/screens/HomeScreen.tsx` |
| `src/pages/About.tsx` | `src/presentation/about/screens/AboutScreen.tsx` |
| `src/pages/ServiceDetail.tsx` | `src/presentation/services/screens/ServiceDetailScreen.tsx` |
| `src/pages/Contact.tsx` | `src/presentation/contact/screens/ContactScreen.tsx` |
| `src/pages/Safety.tsx` | `src/presentation/safety/screens/SafetyScreen.tsx` |
| `src/pages/WhatsAppRedirect.tsx` | `src/presentation/whatsapp/screens/WhatsAppRedirectScreen.tsx` |

---

## Pasos de implementación

### 1. Configurar path aliases

**`tsconfig.app.json`** — agregar `paths`:
```json
"paths": {
  "@domain/*": ["src/domain/*"],
  "@app/*": ["src/application/*"],
  "@infra/*": ["src/infrastructure/*"],
  "@presentation/*": ["src/presentation/*"],
  "@shared/*": ["src/presentation/shared/*"]
}
```

**`vite.config.ts`** — agregar `resolve.alias`:
```ts
import path from 'path'

resolve: {
  alias: {
    '@domain': path.resolve(__dirname, 'src/domain'),
    '@app': path.resolve(__dirname, 'src/application'),
    '@infra': path.resolve(__dirname, 'src/infrastructure'),
    '@presentation': path.resolve(__dirname, 'src/presentation'),
    '@shared': path.resolve(__dirname, 'src/presentation/shared'),
  }
}
```

---

### 2. Capa Domain — fragmentar `types.ts`

Crear archivos de modelo por feature extrayendo las interfaces existentes. Cada modelo re-exporta sus tipos en un `index.ts`.

- `src/domain/home/models/home.model.ts` → `HeroSlide`, `HeroData`, `ComunicadoItem`, `ComunicadosData`, `TarifaItem`, `TarifasData`, `HomeData`
- `src/domain/services/models/services.model.ts` → `ServiceItem`, `ServicesData`
- `src/domain/about/models/about.model.ts` → `AboutData`
- `src/domain/contact/models/contact.model.ts` → tipos de contacto
- `src/domain/common/models/common.model.ts` → `CommonData`
- Eliminar `src/types.ts` al final

---

### 3. Capa Infrastructure — crear capa de servicio

**`src/infrastructure/http/localeClient.ts`**: thin wrapper sobre `fetch` para obtener un JSON de locales dado el idioma y la clave (extrae la lógica repetida en `useData.ts`).

```ts
export async function fetchLocale<T>(key: string, lang: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}locales/${lang}/${key}.json`)
  return res.json()
}
```

**Un service por feature** (e.g., `src/infrastructure/home/services/home.service.ts`):
```ts
export const homeService = {
  get: (lang: string) => fetchLocale<HomeData>('home', lang),
}
```

Mover `src/lib/queryClient.ts` → `src/infrastructure/http/queryClient.ts`.

---

### 4. Capa Application — fragmentar `useData.ts` y mover store

Separar cada hook de `useData.ts` a su carpeta de feature:

- `src/application/home/hooks/use-home.ts` → `useHomeData()`
- `src/application/services/hooks/use-services.ts` → `useServicesData()`
- `src/application/about/hooks/use-about.ts` → `useAboutData()`
- `src/application/contact/hooks/use-contact.ts` → `useContactData()`
- `src/application/common/hooks/use-common.ts` → `useCommonData()`
- `src/application/theme/hooks/use-theme.ts` → `useThemeData()`

Cada hook importa su service desde `@infra/{feature}/services/` en vez de hacer `fetch` directamente.

Mover store y utils:
- `src/application/stores/app.store.ts` (del `store/useAppStore.ts`)
- `src/application/utils/url.utils.ts` (del `lib/utils.ts`)

---

### 5. Capa Presentation — mover componentes y páginas

Mover layouts y UI components a `presentation/shared/`:
- `components/layout/*` → `presentation/shared/layouts/`
- `components/ui/*` → `presentation/shared/components/`
- Agregar `index.ts` barrel en cada carpeta

Mover páginas a `presentation/{feature}/screens/`:
- Renombrar: `Home.tsx` → `HomeScreen.tsx`, etc.
- Actualizar imports internos para usar aliases

---

### 6. Actualizar `src/App.tsx` y `src/main.tsx`

Actualizar imports para apuntar a nuevas rutas usando aliases:
```ts
import { MainLayout } from '@shared/layouts'
import HomeScreen from '@presentation/home/screens/HomeScreen'
// ...
```

Opcionalmente agregar lazy loading por screen (patrón UMS):
```ts
const HomeScreen = lazy(() => import('@presentation/home/screens/HomeScreen'))
```

---

### 7. Agregar barrel exports

Crear `index.ts` en:
- `src/domain/{feature}/index.ts`
- `src/application/stores/index.ts`
- `src/presentation/shared/components/index.ts`
- `src/presentation/shared/layouts/index.ts`

---

### 8. Eliminar estructura antigua

Una vez validado que todo compila:
- Eliminar `src/pages/`, `src/components/`, `src/hooks/`, `src/store/`, `src/lib/`, `src/types.ts`

---

## Archivos críticos modificados

| Archivo | Tipo de cambio |
|---|---|
| `vite.config.ts` | Agregar `resolve.alias` |
| `tsconfig.app.json` | Agregar `paths` |
| `src/App.tsx` | Actualizar imports |
| `src/main.tsx` | Actualizar imports |
| Todos los screens | Actualizar imports internos |

---

## Verificación

1. `npm run build` — debe compilar sin errores de TypeScript ni de módulos no encontrados
2. `npm run dev` — servidor dev levanta, navegar a todas las rutas: `/`, `/nosotros`, `/servicios/contenedores-vacios`, `/contacto`, `/requisitos-sst`
3. Verificar que el toggle de idioma funciona (refetch en `es`/`en`)
4. Verificar que el ThemeProvider aplica variables CSS correctamente
5. Verificar que las imágenes resuelven bien con `resolveImageUrl`
