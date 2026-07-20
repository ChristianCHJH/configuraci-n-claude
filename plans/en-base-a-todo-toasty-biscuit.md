# Dashboard de Analítica de Visitas (panel admin Angular)

## Contexto

En esta misma sesión se construyó el backend de captura de visitas del catálogo público:
tabla `catalogo_visita`, permiso `ANALITICA_VISITAS_VER` y dos endpoints admin ya funcionando:

- `GET api/analitica/visitas/resumen?dias=30` → `{ totalVisitas, visitasPagina, visitasProducto, porDia: [{dia,total}] }`
- `GET api/analitica/visitas/productos?limite=10&dias=30` → `[{ productoId, nombre, visitas }]`

Falta la **cara visible**: un dashboard dentro del panel admin (`/dashboard/:vista`) **paralelo al dashboard actual**,
que muestre esos datos con gráficos, respetando el sistema de diseño existente (tokens `--spa-*`, paleta cálida crema/azul).
Diseño con libertad creativa, aplicando las skills **/impeccable** y **/ui-ux-pro-max** en la fase de construcción.

Decisión confirmada con el usuario: **Chart.js + ng2-charts** para los gráficos (interactivos, tematizados con los tokens del proyecto).

## Alcance

Solo frontend Angular (`frontend/`). El backend ya está listo; solo requiere que la **migración 034 esté aplicada** en la BD para devolver datos (si no, el dashboard muestra estados vacíos correctamente).

---

## 1. Dependencia de gráficos

Instalar en el submódulo `frontend`:

```bash
cd frontend && npm install chart.js ng2-charts
```

- Usar `BaseChartDirective` de ng2-charts (standalone, sin NgModule) directamente en `imports` del componente.
- Verificar compatibilidad con Angular 18 (ng2-charts 6+). Si npm reporta conflicto de peer-deps, fijar la versión compatible.

## 2. Servicio HTTP — nuevo

`frontend/src/app/core/services/analitica-visitas.servicio.ts`

- Patrón idéntico a `marcas-inventario.servicio.ts` (inyecta `HttpBaseService`, interfaces inline, `@Injectable({providedIn:'root'})`).
- `HttpBaseService` **ya desempaqueta** `{ datos }` — el servicio tipa `T` directo, sin tocar `.datos`.

```typescript
export interface ResumenVisitas {
  totalVisitas: number; visitasPagina: number; visitasProducto: number;
  porDia: { dia: string; total: number }[];
}
export interface ProductoMasVisitado { productoId: number; nombre: string; visitas: number; }

resumen(dias = 30) =>
  this.http.get<ResumenVisitas>('api/analitica/visitas/resumen', { params: { dias: String(dias) } });
productosMasVisitados(limite = 10, dias = 30) =>
  this.http.get<ProductoMasVisitado[]>('api/analitica/visitas/productos',
    { params: { limite: String(limite), dias: String(dias) } });
```

## 3. Componente del dashboard — nuevo

`frontend/src/app/features/panel/visitas/visitas.component.ts` (+ `.html` + `.css`)

- `selector: 'spa-visitas-analitica'`, `standalone`, `ChangeDetectionStrategy.OnPush`.
- `imports`: `CommonModule`, `MatIconModule`, `BaseChartDirective`, `PermisoDirectiva`.
- Estado con signals: `cargando`, `error`, `sinPermiso`, `resumen`, `topProductos`, `rangoDias` (default 30).
- Carga: al iniciar y al cambiar `rangoDias`, `forkJoin({ resumen, productos })` con `takeUntilDestroyed` + `finalize`.
  Manejar `403` → `sinPermiso` (igual que `dashboard.component.ts`).
- KPIs derivados con `computed()` (p. ej. promedio diario = total / nº días con datos).
- Datos de gráficos con `computed()` mapeando `resumen().porDia` y `topProductos()` a la estructura de Chart.js.

### Diseño visual (respetando `--spa-*` y patrones existentes)

Reutilizar el lenguaje del dashboard actual (paleta cálida, `rank-badge`, tarjetas redondeadas) y los patrones del DESIGN.md.
Aplicar **/impeccable** + **/ui-ux-pro-max** al maquetar. Estructura propuesta:

- **Toolbar superior**: título/eyebrow + selector de rango (chips `7 / 30 / 90 días`) que setea `rangoDias`.
- **Fila de KPI cards (4)**: Total visitas · Visitas a la página · Visitas a productos · Promedio diario.
  Estilo `kpi-card` con icono en gradiente, adaptado a la paleta SPA cálida.
- **Grid 2 columnas (`lg`)**:
  - Izquierda (2fr): gráfico de **área/línea** "Visitas por día" (`type:'line'`, fill, color `--spa-primary`).
  - Derecha (1fr): **doughnut** "Página vs. Producto" (colores `--spa-primary` / `--spa-primary-accent`).
- **Sección inferior — "Productos más visitados"**: gráfico de **barras horizontales** + lista rankeada
  reutilizando el patrón `rank-badge` (r1/r2/r3) del dashboard actual.
- **Estados**: `cargando` (spinner/skeleton), `error` (mensaje + reintentar), **vacío** ("Aún no hay visitas registradas"), `sinPermiso`.
- Colores de Chart.js: leer los tokens reales con `getComputedStyle(document.documentElement)` (o constantes que repliquen los hex de `styles.css`) — **no** hardcodear colores fuera de la paleta.

### Cadena flex obligatoria (regla del proyecto)

`:host` (flex col, `min-height:0`, `overflow:hidden`, `padding:1.5rem 3rem 2.5rem`) → `.shell` (flex:1, min-height:0) →
toolbar/KPIs `flex-shrink:0` → zona de gráficos en contenedor scrollable interno (`overflow-y:auto`). La página nunca scrollea.

## 4. Integración en el panel (ediciones)

**`features/panel/panel.component.ts`**
- `import { VisitasAnaliticaComponent }` y agregarlo a `imports`.
- `PERMISOS_VISTA`: `'visitas': 'ANALITICA_VISITAS_VER'`.
- `tituloPagina()` titulos: `'visitas': 'Analítica de Visitas'`.

**`features/panel/panel.component.html`**
- `view-area`: añadir `[class.view-visitas]="vistaActiva === 'visitas'"`.
- Nuevo `@case ('visitas') { <spa-visitas-analitica></spa-visitas-analitica> }`.

**`features/panel/panel.component.css`**
- Añadir `.view-area.view-visitas { ... }` espejando `.view-area.view-dashboard`.

**`shared/components/barra-lateral/barra-lateral.component.ts`**
- En `elementos[]`, nueva sección + ítem (tras Inventario):
  ```ts
  { tipo:'seccion', clave:'analitica', etiqueta:'Analítica' },
  { clave:'visitas', etiqueta:'Visitas', icono:'monitoring', seccion:'analitica', permiso:'ANALITICA_VISITAS_VER' },
  ```
- En `estadosSecciones` default: añadir `analitica: true`.
- El filtrado por permiso ya es automático (`elementosFiltrados`), no se toca lógica.

## 5. Tests (regla obligatoria del proyecto)

**Unit (Jest/Karma con `HttpClientTestingModule`, sin mockear `HttpBaseService`):**
- `analitica-visitas.servicio.spec.ts`: `resumen()` hace GET a `api/analitica/visitas/resumen` con param `dias`; `productosMasVisitados()` GET con `limite`+`dias`; retorna `T` desempaquetado; maneja error 4xx/5xx.
- `visitas.component.spec.ts` (opcional, recomendado): renderiza KPIs desde servicio mock; cambiar rango dispara recarga; estado vacío cuando `porDia` vacío.

**E2E (Playwright):**
- `e2e/tests/13-visitas/visitas-dashboard.spec.ts`: usuario con `ANALITICA_VISITAS_VER` ve ítem "Visitas" en sidebar y `/dashboard/visitas` renderiza KPIs + gráficos sin errores.

## 6. Verificación end-to-end

1. `cd frontend && npm install` (instala chart.js + ng2-charts).
2. `npm run build` → typecheck/compilación limpia.
3. Asegurar migración `034-catalogo-visita.sql` aplicada en la BD (si no, endpoints devuelven vacío → estados vacíos OK).
4. `npm start`; login admin (SUPERADMIN ya tiene `ANALITICA_VISITAS_VER` por el seed). Generar visitas entrando al catálogo público `/[slug]` y a un detalle de producto.
5. Abrir `/dashboard/visitas`: verificar KPIs, gráfico de visitas por día, doughnut página/producto, top productos, y selector de rango (7/30/90) refrescando datos.
6. `ng test` para los specs nuevos.

## Archivos críticos

- Nuevo: `core/services/analitica-visitas.servicio.ts`
- Nuevo: `features/panel/visitas/visitas.component.{ts,html,css}`
- Editar: `features/panel/panel.component.{ts,html,css}`
- Editar: `shared/components/barra-lateral/barra-lateral.component.ts`
- `package.json` (frontend): + `chart.js`, `ng2-charts`
- Patrones de referencia a reutilizar: `features/panel/dashboard/dashboard.component.ts` (estados, rank-badge, forkJoin/403), `features/inventario/sedes-lista/sedes-lista.component.ts` (signals/effect/OnPush), `core/services/marcas-inventario.servicio.ts` (servicio), `styles.css`/`DESIGN.md` (tokens).
