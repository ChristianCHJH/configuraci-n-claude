# Plan: Implementar Pruebas Unitarias en web-desing

## Contexto

El repo `unimar_arch` define estándares de testing (ADR-0018, ADR-0052, ADR-0053) obligatorios para todos los proyectos Unimar. El proyecto `web-desing` (React 18 + TypeScript + Vite) no tiene **ningún test configurado** — cero archivos `.test.*`, cero librerías de testing instaladas. Este plan traduce los estándares del repo de arquitectura al stack frontend real.

---

## Mapeo de Estándares → Frontend React/Vite

| Estándar Arch | Equivalente Frontend |
|---|---|
| Jest 29.x (Node.js) | **Vitest** (nativo Vite, misma API Jest) |
| ADR-0052: domain sin mocks | Domain = interfaces/tipos → no runtime tests |
| ADR-0052: application stubs | Hooks + store → mock infra services |
| ADR-0053: integración real HTTP | MSW (Mock Service Worker) mockea fetch |
| 80% cobertura business logic | utils + hooks + store prioritarios |
| 70/20/10 pirámide | 70% unit / 20% hook+component / 10% E2E |

---

## Decisión de Stack

```
Vitest 2.x           — test runner (nativo Vite, sin config extra)
@testing-library/react   — renderizar hooks y componentes
@testing-library/jest-dom — matchers DOM (.toBeInTheDocument, etc.)
@testing-library/user-event — simular clicks, teclado
msw 2.x              — interceptar fetch en tests (inline handlers)
@vitest/coverage-v8  — cobertura de código (reporte html + json)
jsdom                — DOM environment para Vitest
```

---

## Archivos a Crear/Modificar

### 1. Instalar dependencias dev
```bash
npm install -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event msw
```

### 2. `vite.config.ts` — agregar bloque `test`
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/application/**', 'src/domain/**'],
    thresholds: { lines: 80, functions: 80 }
  }
}
```

### 3. `src/test/setup.ts` — setup global
```ts
import '@testing-library/jest-dom'
```

### 4. `src/test/mocks/handlers.ts` — MSW handlers
Mockar los endpoints de fetch que usan los servicios:
`/web-design/locales/{es|en}/{page}.json`

### 5. `tsconfig.app.json` — agregar `"types": ["vitest/globals"]`

### 6. `package.json` — agregar scripts
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

---

## Tests a Escribir (por capa, ADR-0052)

### Capa Domain — NO tests runtime
Los modelos son interfaces TypeScript puras. La cobertura es el compilador (`tsc --noEmit`). No se escriben tests aquí.

### Capa Application — PRIORIDAD ALTA

**utils (pure functions — ROI máximo):**
- `src/application/utils/url.utils.test.ts`
  - `resolveImageUrl()`: casos base, paths vacíos, doble base-path
- `src/application/utils/media-merge.utils.test.ts`
  - merge de text data + media data: happy path, campos faltantes, null safety

**store:**
- `src/application/stores/app.store.test.ts`
  - estado inicial correcto
  - `setLanguage()`, `openComercioModal()`, `closeComercioModal()`
  - `setSelectedServiceForContact()`, `toggleMobileMenu()`

**hooks (mockear infra services):**
- `src/application/home/hooks/use-home.test.ts`
  - mock de `HomeService.getHomeData()` vía MSW
  - loading state → success state → error state
- Patrón se repite para `use-about`, `use-services`, `use-contact`, `use-safety`

### Capa Infrastructure — NO unit tests
Servicios HTTP testeados con MSW a nivel de hooks (capa application). Tests de integración real quedan fuera de scope inicial.

### Capa Presentation — BAJA PRIORIDAD (alcance v2)
Componentes como `ErrorBoundary`, `PageStatus` pueden testearse después. No bloquean el 80% de cobertura de business logic.

---

## Estructura de carpetas resultante

```
src/
├── test/
│   ├── setup.ts
│   └── mocks/
│       ├── handlers.ts          ← MSW: fetch mock para /locales/**
│       └── server.ts            ← msw server setup
├── application/
│   ├── utils/
│   │   ├── url.utils.test.ts
│   │   └── media-merge.utils.test.ts
│   ├── stores/
│   │   └── app.store.test.ts
│   └── home/hooks/
│       └── use-home.test.ts
│   └── ... (resto de hooks)
```

---

## Verificación

```bash
npm run test:coverage   # debe pasar con >= 80% en application/
npm run test            # watch mode durante desarrollo
```

Cobertura esperada inicial:
- `url.utils.ts` → ~100%
- `media-merge.utils.ts` → ~100%
- `app.store.ts` → ~100%
- `use-home.ts` → ~90%
- Total application/ → >80% ✓

---

## Orden de ejecución

1. Instalar deps + configurar Vitest en `vite.config.ts`
2. Crear `src/test/setup.ts` + `mocks/handlers.ts`
3. Tests de utils (más rápidos, sin dependencias)
4. Tests del store Zustand
5. Tests de hooks (requiere MSW setup)
6. Verificar cobertura >= 80%
