# Plan — Usuario creado desde panel admin queda "autorizado" automáticamente

## Contexto

Al crear un usuario desde `dashboard/users` ("Nuevo usuario"), el usuario no puede
iniciar sesión porque queda con `correo_verificado = false`. Christian lo describe como
"la columna de autorizado / habilitado debe estar en `true` automáticamente, no en `false`".

No existe columna `autorizado` ni `habilitado`. La columna real que gobierna el acceso es
**`correo_verificado`** (`usuarios.correo_verificado`, entidad `defaultValue: false`).
El login la valida y **bloquea** el acceso si es `false`:

- `backend/src/autenticacion/autenticacion/autenticacion.servicio.ts:84` →
  `if (!usuario.correoVerificado) { throw new ForbiddenException(...) }`

La columna `estado` ya se crea en `true` (activo), así que no es el problema.

**Causa raíz:** `usuarios.servicio.ts` `crear()` (línea 50-58) no setea `correoVerificado`,
por lo que hereda el default `false` de la entidad. Un usuario creado por un admin es de
confianza y debe quedar verificado/autorizado de una vez (a diferencia del auto-registro
público, que sí exige verificación por correo).

## Cambio

### `backend/src/autenticacion/usuarios/usuarios.servicio.ts`

En el `create()` dentro de `crear()` (líneas 50-58), agregar `correoVerificado: true`:

```typescript
return this.usuarioModelo.create({
  nombreUsuario: dto.nombreUsuario,
  contrasenaHash,
  correo: dto.correo,
  negocioId,
  estado: true,
  correoVerificado: true, // creado por admin → autorizado a iniciar sesión de inmediato
  usuarioCreacion: usuarioId,
  usuarioActualizacion: usuarioId,
});
```

Eso es todo. No requiere cambios de frontend, DTO, migración ni `setup-completo.sql`
(no se agregan columnas ni se cambian defaults del esquema; solo el valor en un insert).

## Verificación

1. `cd backend && npm run start:dev`
2. Login como admin en el panel → Usuarios → "Nuevo usuario" → crear uno.
3. En BD confirmar: `SELECT correo, correo_verificado, estado FROM usuarios WHERE correo = '<nuevo>';`
   → `correo_verificado = true`, `estado = true`.
4. Cerrar sesión, iniciar sesión con el usuario recién creado → debe entrar sin el error
   "Debes verificar tu correo antes de iniciar sesión".

## Tests recomendados

### Unit tests (Jest — backend)
- [ ] `crear()` crea el usuario con `correoVerificado: true` — `backend/src/autenticacion/usuarios/usuarios.servicio.spec.ts`
- [ ] `crear()` mantiene `estado: true` — `backend/src/autenticacion/usuarios/usuarios.servicio.spec.ts`

### E2E (Playwright)
- [ ] Admin crea usuario desde el panel → luego ese usuario inicia sesión correctamente sin verificación de correo — `e2e/tests/` (suite de usuarios)
