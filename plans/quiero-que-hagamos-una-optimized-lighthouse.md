# Plan: Migración completa PrimeNG → Angular Material

## Contexto

El frontend usa Angular 18.2.0 + PrimeNG 17. La decisión es reemplazar PrimeNG completamente por Angular Material para unificar el sistema de diseño bajo Material Design, eliminar PrimeFlex/PrimeIcons como dependencias, y ganar mejor soporte de accesibilidad y theming oficial de Google.

**Angular Material compatible: versión 18.x** — paridad exacta de versión con Angular (mismo major).
Instalar: `@angular/material@18` + `@angular/cdk@18`.

---

## Dimensión del trabajo

| Métrica | Valor |
|---------|-------|
| Archivos `.html` a migrar | 32 |
| Archivos `.ts` con imports PrimeNG | 23 |
| Módulos PrimeNG distintos | 19 |
| Componentes PrimeNG únicos | 15 |
| Servicios PrimeNG a reemplazar | 2 (`MessageService`, `ConfirmationService`) |

---

## Tabla de equivalencias PrimeNG → Angular Material

| PrimeNG | Angular Material | Módulo Material |
|---------|-----------------|-----------------|
| `p-button` / `pButton` | `<button mat-button>` / `mat-raised-button` / `mat-icon-button` | `MatButtonModule` |
| `p-inputText` | `<input matInput>` dentro de `<mat-form-field>` | `MatInputModule` |
| `p-inputTextarea` | `<textarea matInput>` dentro de `<mat-form-field>` | `MatInputModule` |
| `p-inputNumber` | `<input matInput type="number">` + `MatInputModule` | `MatInputModule` |
| `p-dropdown` | `<mat-select>` dentro de `<mat-form-field>` | `MatSelectModule` |
| `p-multiSelect` | `<mat-select multiple>` | `MatSelectModule` |
| `p-checkbox` | `<mat-checkbox>` | `MatCheckboxModule` |
| `p-inputSwitch` | `<mat-slide-toggle>` | `MatSlideToggleModule` |
| `p-selectButton` | `<mat-button-toggle-group>` | `MatButtonToggleModule` |
| `p-dialog` | `MatDialog` (servicio) + component | `MatDialogModule` |
| `p-confirmDialog` | `MatDialog` con componente custom `ConfirmDialogComponent` | `MatDialogModule` |
| `p-toast` / `MessageService` | `MatSnackBar` | `MatSnackBarModule` |
| `p-tabView` / `p-tabPanel` | `<mat-tab-group>` / `<mat-tab>` | `MatTabsModule` |
| `p-skeleton` | `<mat-progress-bar>` o skeleton custom con Tailwind `animate-pulse` | `MatProgressBarModule` |
| `p-progressSpinner` | `<mat-spinner>` | `MatProgressSpinnerModule` |
| `p-avatar` | `<img>` con Tailwind classes (`rounded-full`, `w-8 h-8`) | — |
| `p-tag` | `<mat-chip>` | `MatChipsModule` |
| `pRipple` | `matRipple` | `MatRippleModule` (CDK) |
| `pTooltip` | `matTooltip` | `MatTooltipModule` |
| PrimeIcons (`pi pi-*`) | Material Icons (`<mat-icon>`) | `MatIconModule` |

---

## Fases de implementación

### Fase 0 — Setup base (1 sesión)

1. `npm uninstall primeng primeflex primeicons`
2. `ng add @angular/material@18` — elegir tema base (indigo/pink o custom)
3. Crear `src/app/shared/material.module.ts` que exporte todos los módulos Material usados
4. Actualizar `angular.json`: quitar estilos PrimeNG, agregar Angular Material theme
5. Actualizar `styles.css`: eliminar variables `--primary-color` PrimeNG, adaptar `--spa-primary` a tokens Material (`--mat-*`)
6. Reemplazar `shared.module.ts`: quitar `ButtonModule`, `InputTextModule`, `CheckboxModule`, `RippleModule` → agregar Material equivalentes
7. Crear `ConfirmDialogComponent` reutilizable (reemplaza `ConfirmationService` + `p-confirmDialog`)
8. Crear utilidad `SnackBarServicio` wrapper de `MatSnackBar` (reemplaza `MessageService`) — mantiene misma API: `exito()`, `error()`, `advertencia()`, `info()`

### Fase 1 — Componentes de autenticación (6 componentes)

Archivos: `inicio-sesion`, `registro`, `negocio-registro`, `verificar-correo`, `recuperar-contrasena`, `restablecer-contrasena`, `registro-pendiente`

Cambios tipo:
- `p-inputText` + `pButton` → `mat-form-field` + `matInput` + `mat-raised-button`
- `p-checkbox` (Recordarme) → `mat-checkbox`
- `p-progressSpinner` (verificar-correo) → `mat-spinner`
- Quitar `MessageService` → `SnackBarServicio`

### Fase 2 — Componentes compartidos (3 componentes)

Archivos: `barra-lateral`, `boton`, `entrada`

Cambios:
- `p-avatar` → `<img class="rounded-full w-8 h-8">`
- `p-dropdown` (contexto negocio) → `mat-select`
- `pTooltip` → `matTooltip`
- `pRipple` → `matRipple`
- Wrapper `boton` → wrapper `MatButton`
- Wrapper `entrada` → wrapper `mat-form-field + matInput`

### Fase 3 — Panel y dashboard (2 componentes)

Archivos: `panel.component`, `dashboard.component`

Cambios:
- `p-skeleton` → Tailwind `animate-pulse` custom o `mat-progress-bar`
- Quitar `MessageService`

### Fase 4 — CRUD de administración (10 componentes)

Archivos: `usuarios-lista`, `usuario-acceso`, `roles-lista`, `rol-acceso`, `permisos-lista`, `secciones-con-permisos-lista`, `secciones-permiso-lista`, `negocios-lista`, `negocio-permisos-modal`, `mi-negocio-vista`

Cambios tipo (se repite por cada componente):
- `p-dialog` → abrir con `MatDialog.open(ComponenteFormulario)` — el formulario se mueve a un componente hijo
- `p-confirmDialog` + `ConfirmationService` → usar `ConfirmDialogComponent` creado en Fase 0
- `p-toast` + `MessageService` → `SnackBarServicio`
- `p-dropdown` → `mat-select`
- `p-checkbox` → `mat-checkbox`
- `p-inputSwitch` → `mat-slide-toggle`
- `pTooltip` → `matTooltip`
- PrimeIcons → `mat-icon`

### Fase 5 — Inventario (7 componentes)

Archivos: `productos-lista`, `catalogo-producto-dialog`, `sedes-lista`, `sede-stock`, `producto-distribucion`, `movimientos`, `marcas-lista`, `etiquetas-lista`

Cambios adicionales:
- `p-multiSelect` → `mat-select [multiple]`
- `p-inputNumber` → `mat-form-field + input[type=number]`
- `p-selectButton` → `mat-button-toggle-group`
- `p-skeleton` → Tailwind `animate-pulse`

### Fase 6 — Catálogo (1 componente)

Archivos: `mi-pagina.component`

Cambios:
- `p-tabView / p-tabPanel` → `mat-tab-group / mat-tab`
- `p-inputSwitch` → `mat-slide-toggle`
- `p-inputNumber` → `mat-form-field + input`
- `p-inputTextarea` → `mat-form-field + textarea[matInput]`
- `p-skeleton` → animate-pulse

---

## Archivos críticos a crear (nuevos)

| Archivo | Propósito |
|---------|-----------|
| `shared/material.module.ts` | Exporta todos los módulos Material de una vez |
| `shared/components/confirm-dialog/confirm-dialog.component.ts` | Reemplaza `ConfirmationService` + `p-confirmDialog` |
| `core/services/snack-bar.servicio.ts` | Wrapper de `MatSnackBar` con API tipo MessageService |

---

## Archivos críticos a modificar

| Archivo | Cambio |
|---------|--------|
| `angular.json` | Quitar estilos primeng/primeflex, agregar tema Material |
| `src/styles.css` | Quitar overrides PrimeNG, adaptar CSS vars a Material tokens |
| `shared/shared.module.ts` | Quitar módulos PrimeNG, importar MaterialModule |
| `app.config.ts` | `provideAnimations()` ya existe — sin cambio |
| Todos los 23 `.ts` con imports PrimeNG | Reemplazar imports según tabla de equivalencias |

---

## Orden de ejecución por sesiones

| Sesión | Fase | Qué se entrega | Estado |
|--------|------|---------------|--------|
| 1 | Fase 0 | Setup base: desinstalar PrimeNG, instalar Material 18, crear `MaterialModule`, `ConfirmDialogComponent`, `SnackBarServicio`, actualizar `angular.json` y `styles.css` | ⬜ pendiente |
| 2 | Fase 1 | Autenticación: 6 componentes (login, registro, verificar, recuperar, restablecer, pendiente) | ⬜ pendiente |
| 3 | Fase 2 | Shared: `barra-lateral`, `boton`, `entrada` | ⬜ pendiente |
| 4 | Fase 3 | Panel y dashboard | ⬜ pendiente |
| 5 | Fase 4 | CRUD administración: 10 componentes (usuarios, roles, permisos, secciones, negocios) | ⬜ pendiente |
| 6 | Fase 5 | Inventario: 7 componentes (productos, sedes, stock, movimientos, marcas, etiquetas) | ⬜ pendiente |
| 7 | Fase 6 | Catálogo: `mi-pagina` | ⬜ pendiente |

---

## Verificación

1. `ng build` sin errores de compilación
2. `ng test` — suites existentes siguen en verde (los tests mockean servicios, no componentes PrimeNG)
3. Flujo manual: login → dashboard → CRUD usuarios → CRUD productos → confirmación eliminar → toast de éxito
4. Verificar mobile: tablas responsivas, modales, toast

---

## Notas importantes

- **PrimeFlex se elimina** — sus clases utilitarias (p-col-*) se reemplazan por Tailwind (ya instalado)
- **PrimeIcons se elimina** — todos los `pi pi-*` se reemplazan por `<mat-icon>nombre</mat-icon>` con Material Icons font
- El `ConfirmDialogComponent` custom debe recibir `{ titulo, mensaje, textoConfirmar }` por `MAT_DIALOG_DATA`
- `MatSnackBar` no soporta títulos — `SnackBarServicio` puede formatear el mensaje como `"Título: detalle"` si se necesita
- Los dialogs en Angular Material: el componente del formulario se convierte en componente standalone separado; `MatDialogRef` maneja el cierre
- `mat-form-field` requiere que cada input tenga su wrapper — más verbose que PrimeNG pero más semántico
