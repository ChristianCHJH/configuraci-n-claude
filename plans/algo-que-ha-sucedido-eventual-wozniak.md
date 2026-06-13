# Plan — Separar Registro de Usuario del Registro de Negocio

## Contexto

El registro actual crea usuario + negocio en una sola transacción. Esto genera problemas cuando el token de verificación expira (el sistema rechaza el re-registro aunque los datos ya existen). El nuevo diseño separa responsabilidades:

1. **Registro**: solo crea el usuario → verifica correo → login
2. **Post-login**: si el usuario no tiene negocio → pantalla obligatoria "Registra tu negocio"
3. **Una vez vinculado a un negocio**: accede al dashboard

---

## Hallazgos clave del codebase

- `usuarios.negocio_id` es **NULLABLE** en SQL (sin FK explícita) — ya soporta usuarios sin negocio
- `PayloadJwt.negocioId` es `number` (requerido) — hay que hacerlo `number | null`
- `emitirTokens()` llama `negocioModelo.findByPk(usuario.negocioId)` — crashea si es null, ya usa `?? 1` como fallback
- `obtenerPermisosEfectivos()` usa `negocioId` solo para `negocio_permisos` — puede cortocircuitarse si es null
- Frontend: `guardiaAutenticacion` solo valida JWT válido — no verifica negocio
- Frontend: `NegocioContextoServicio` existe pero no se inicializa post-login
- La modificación de re-registro que hicimos en la sesión anterior también debe simplificarse (ya no hay negocio que actualizar en ese path)

---

## Cambios — Backend

### 1. `RegistroPublicoDto` → simplificar a solo datos de usuario
**Archivo:** `backend/src/autenticacion/autenticacion/dto/registro-publico.dto.ts`

Eliminar: `nombre`, `ruc`, `correoContacto`
Mantener: `nombreUsuario`, `correo`, `contrasena`

### 2. `autenticacion.servicio.ts` — método `registrar()`
**Archivo:** `backend/src/autenticacion/autenticacion/autenticacion.servicio.ts`

- Eliminar toda la lógica de creación de negocio (actualmente líneas 116-126, 147-150)
- Eliminar la actualización del negocio en el path de re-registro (líneas del `negocioModelo.update`)
- El usuario se crea con `negocioId: null` (sin asignar)
- Mantener asignación de rol SUPERADMIN (el usuario sigue siendo admin de su futuro negocio)
- Respuesta: `{ verificacionPendiente: true, mensaje: '...' }`

### 3. `usuario.entidad.ts` — hacer `negocioId` opcional
**Archivo:** `backend/src/autenticacion/usuarios/entidades/usuario.entidad.ts`

```typescript
@Column({ field: 'negocio_id', type: DataType.BIGINT, allowNull: true })
declare negocioId: number | null;
```

### 4. `PayloadJwt` — hacer `negocioId` nullable
**Archivo:** `backend/src/autenticacion/autenticacion/interfaces/payload-jwt.interface.ts`

```typescript
export interface PayloadJwt {
  sub: number;
  nombreUsuario: string;
  negocioId: number | null;   // null cuando no tiene negocio aún
  nivelPlan: number;
  roles: string[];
  permisos?: string[];
}
```

### 5. `autenticacion.servicio.ts` — `emitirTokens()` y `obtenerPermisosEfectivos()`

- Si `usuario.negocioId` es null: no buscar negocio, `nivelPlan = 1`, permisos vacíos (solo rol básico)
- `obtenerPermisosEfectivos()`: si `negocioId` es null, saltar la query de `negocio_permisos`

### 6. Nuevo endpoint — `POST /negocio/registrar`
**Archivos:** `backend/src/negocio/negocio.servicio.ts`, `backend/src/negocio/negocio.controlador.ts`
**DTO:** reutilizar `CrearNegocioDto` (ya existe con `nombre`, `ruc`, `correoContacto`)

Lógica del servicio `registrarMiNegocio(dto, usuarioId)`:
1. Verificar que el usuario NO tenga negocio ya (`negocioId` debe ser null) — si ya tiene, lanzar `ConflictException`
2. Crear negocio con `nivelPlan: 1`
3. Actualizar usuario: `negocioId = negocio.id`
4. Emitir nuevos tokens JWT (con el `negocioId` recién asignado)
5. Retornar los tokens para que el frontend los almacene y redirija al dashboard

---

## Cambios — Frontend

### 7. `registro.component.ts` — simplificar formulario
**Archivo:** `frontend/src/app/features/autenticacion/registro/registro.component.ts`

Eliminar campos: `nombre`, `ruc`, `correoContacto`
Mantener: `nombreUsuario`, `correo`, `contrasena`, `confirmarContrasena`

### 8. `autenticacion.servicio.ts` (frontend) — actualizar interfaz
**Archivo:** `frontend/src/app/features/autenticacion/autenticacion.servicio.ts`

- `DatosRegistro`: eliminar campos de negocio
- `obtenerNegocioId()`: retornar `number | null`

### 9. Nuevo componente `negocio-registro`
**Ruta sugerida:** `frontend/src/app/features/negocio/negocio-registro/`

Formulario con: `nombre` (requerido), `ruc` (opcional), `correoContacto` (opcional)
Al enviar: llama `POST /negocio/registrar` → guarda nuevos tokens → navega a `/dashboard`

**Módulo:** crear `NegocioModule` o agregar al feature de negocio existente si ya existe
**Ruta:** `/negocio/nuevo` (protegida por `guardiaAutenticacion` pero NO por `guardiaNegocio`)

### 10. Nuevo guard `guardiaNegocio`
**Archivo:** `frontend/src/app/core/guards/negocio.guardia.ts`

```typescript
export const guardiaNegocio: CanActivateFn = () => {
  const auth = inject(AutenticacionServicio);
  const router = inject(Router);
  const negocioId = auth.obtenerNegocioId();
  return negocioId ? true : router.createUrlTree(['/negocio/nuevo']);
};
```

### 11. `app.routes.ts` — agregar ruta y aplicar guard
**Archivo:** `frontend/src/app/app.routes.ts`

```typescript
{ path: 'negocio/nuevo', component: NegocioRegistroComponent, canActivate: [guardiaAutenticacion] },
{ path: 'dashboard', component: PanelComponent, canActivate: [guardiaAutenticacion, guardiaNegocio] },
```

---

## Migración SQL

No se requiere migración de columna (ya es NULLABLE). Solo registrar en el plan que `negocio_id` se dejó nullable intencionalmente para este flujo.

---

## Orden de implementación

1. Backend: `usuario.entidad.ts` (allowNull) + `PayloadJwt` (nullable)
2. Backend: `autenticacion.servicio.ts` (registrar + emitirTokens + obtenerPermisosEfectivos)
3. Backend: `registro-publico.dto.ts` simplificado
4. Backend: endpoint `POST /negocio/registrar` (servicio + controlador)
5. Frontend: `autenticacion.servicio.ts` (DatosRegistro simplificada + obtenerNegocioId nullable)
6. Frontend: `registro.component.ts` simplificado
7. Frontend: componente `negocio-registro`
8. Frontend: guard `guardiaNegocio` + rutas actualizadas

---

## Verificación

1. Registrar con solo datos de usuario → correo de verificación llega
2. Verificar correo → login exitoso → JWT tiene `negocioId: null`
3. Al ir a `/dashboard` → guard redirige a `/negocio/nuevo`
4. Completar formulario de negocio → nuevos tokens emitidos → `negocioId` en JWT
5. Redirige a `/dashboard` → acceso completo
6. Cerrar sesión → volver a login → con negocio ya asignado → `/dashboard` directo
7. Usuario que intenta ir a `/negocio/nuevo` teniendo negocio → permitido (no redirigir, puede ver sus datos)
