# Plan — Pruebas unitarias: registrar / verificarCorreo / registrarNegocio + frontend nuevos flujos

## Contexto

Las últimas sesiones implementaron registro público autoservicio con verificación de correo (migración 020), campo teléfono (021), y separación del registro en dos pasos (usuario → negocio). Los métodos `registrar`, `verificarCorreo` y `registrarNegocio` de `AutenticacionServicio` quedaron sin cobertura. En frontend, los componentes `registro`, `verificar-correo` y `negocio-registro`, más el guard `negocio.guardia`, tampoco tienen specs.

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `backend/src/autenticacion/autenticacion/autenticacion.servicio.spec.ts` | **Extender** — añadir mocks y 3 nuevos `describe` |
| `backend/src/correo/correo.servicio.spec.ts` | **Crear** |
| `frontend/src/app/features/autenticacion/registro/registro.component.spec.ts` | **Crear** |
| `frontend/src/app/features/autenticacion/verificar-correo/verificar-correo.component.spec.ts` | **Crear** |
| `frontend/src/app/features/negocio/negocio-registro/negocio-registro.component.spec.ts` | **Crear** |
| `frontend/src/app/core/guards/negocio.guardia.spec.ts` | **Crear** |

---

## 1. Backend — extender `autenticacion.servicio.spec.ts`

### Mocks a agregar (top-level)

```typescript
// nuevos — no están en el spec actual
const mockCorreoServicio = { enviarVerificacionCorreo: jest.fn() };
const mockRolModelo = { findOne: jest.fn() };
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};
```

Agregar en `mockUsuarioModelo`:
- `create: jest.fn()`
- `sequelize: { transaction: jest.fn().mockResolvedValue(mockTransaction) }`

Agregar en `mockNegocioModelo`:
- `create: jest.fn()`

Agregar en providers del `TestingModule`:
- `{ provide: getModelToken(Rol), useValue: mockRolModelo }`
- `{ provide: CorreoServicio, useValue: mockCorreoServicio }`

### Fake de usuario nuevo (para `registrar` y `verificarCorreo`)

```typescript
const usuarioNuevoFake = () => ({
  id: 2,
  correo: 'nuevo@test.com',
  nombreUsuario: 'nuevo',
  negocioId: null,
  correoVerificado: false,
  tokenVerificacion: 'token-uuid',
  tokenVerificacionExpira: new Date(Date.now() + 86400000), // 24h futuro
  update: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined),
});
```

### `describe('registrar')` — 4 tests

| Test | Setup | Assert |
|------|-------|--------|
| correo ya verificado → ConflictException | `findOne` retorna `{ correoVerificado: true }` | `rejects.toThrow(ConflictException)` |
| correo sin verificar existente → reenvía correo | `findOne` retorna `{ correoVerificado: false, update: fn }` | retorna `{ verificacionPendiente: true }` + correoServicio llamado |
| nombreUsuario ya en uso → ConflictException | `findOne`: 1ra null, 2da retorna usuario | `rejects.toThrow(ConflictException)` |
| happy path → crea usuario y retorna pendiente | `findOne`: null, null; `create`: usuarioNuevo; `rolModelo.findOne`: rol fake; `usuarioRolModelo.create`: fn | retorna `{ verificacionPendiente: true }`, `correoServicio.enviarVerificacionCorreo` called |

### `describe('verificarCorreo')` — 4 tests

| Test | Setup | Assert |
|------|-------|--------|
| token no encontrado → BadRequestException | `findOne` retorna null | `rejects.toThrow(BadRequestException)` |
| cuenta ya verificada → BadRequestException | `findOne` retorna `{ correoVerificado: true }` | message incluye "ya fue verificada" |
| token expirado → BadRequestException | `findOne` retorna `{ correoVerificado: false, tokenVerificacionExpira: new Date(Date.now() - 1) }` | message incluye "expirado" |
| happy path → actualiza y retorna tokens | `findOne` retorna usuario válido; mocks `emitirTokens` (findByPk negocio, findAll roles) | `toHaveProperty('tokenAcceso')` |

### `describe('registrarNegocio')` — 3 tests

| Test | Setup | Assert |
|------|-------|--------|
| usuario no encontrado → BadRequestException | `findOne` null | `rejects.toThrow(BadRequestException)` |
| usuario ya tiene negocio → ConflictException | `findOne` retorna `{ negocioId: 5 }` | `rejects.toThrow(ConflictException)` |
| happy path → crea negocio, emite tokens | `findOne`: usuario sin negocio; `negocioModelo.create`: negocio fake; `reload` actualiza; mocks `emitirTokens` | `toHaveProperty('tokenAcceso')` |

---

## 2. Backend — crear `correo.servicio.spec.ts`

Patrón: `jest.mock('nodemailer')` en el top → inyectar `sendMail` spy en el constructor.

```typescript
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
  })),
}));
```

Tests:
- `enviarVerificacionCorreo()` invoca `sendMail` con `to` = email y `subject` que incluye "verifica"
- `enviarVerificacionCorreo()` no lanza excepción aunque `sendMail` rechace (fire&forget → void)

---

## 3. Frontend — specs nuevos

Patrón de referencia: `marcas-lista.component.spec.ts` (factory + mock service + fakeAsync/tick).

### `registro.component.spec.ts` — 5 tests

Mock: `mockAutenticacionServicio = { registrar: jest.fn() }` + `Router` spy.

| Test |
|------|
| Formulario inválido → submit no llama al servicio |
| Submit válido → llama `registrar()` con los datos correctos |
| Signal `enviando` es `true` durante llamada (verifica OnPush) |
| Éxito → navega a `/registro/pendiente` |
| Error HTTP → muestra mensaje de error visible |

### `verificar-correo.component.spec.ts` — 4 tests

Mock: `mockAutenticacionServicio = { verificarCorreo: jest.fn(), inicializarPermisos: jest.fn() }` + `ActivatedRoute` con queryParams `{ token: 'abc' }`.

| Test |
|------|
| Token en queryParam → llama `verificarCorreo('abc')` al init |
| Éxito → `estado` signal = `'verificado'` + navega a `/dashboard` |
| Error genérico → `estado` = `'error'` |
| Error "ya fue verificada" → `estado` = `'ya-verificado'` |

### `negocio-registro.component.spec.ts` — 3 tests

Mock: `mockAutenticacionServicio = { registrarNegocio: jest.fn(), inicializarPermisos: jest.fn() }`.

| Test |
|------|
| Submit válido → llama `registrarNegocio()` con `nombre` correcto |
| Éxito → navega a `/dashboard` |
| Conflicto 409 → muestra mensaje "ya tiene un negocio" |

### `negocio.guardia.spec.ts` — 2 tests

Mock: `mockAutenticacionServicio = { obtenerNegocioId: jest.fn() }` + `Router` spy.

| Test |
|------|
| `obtenerNegocioId()` retorna número → guard retorna `true` |
| `obtenerNegocioId()` retorna `null` → guard redirige a `/negocio/nuevo` y retorna `UrlTree` |

---

## Verificación

```bash
# Backend
cd backend && npm run test -- --testPathPattern="autenticacion.servicio|correo.servicio"

# Frontend
cd frontend && npm run test -- --testPathPattern="registro|verificar-correo|negocio-registro|negocio.guardia"
```

Todos los tests deben pasar en verde. No debe haber cambios en lógica de producción.
