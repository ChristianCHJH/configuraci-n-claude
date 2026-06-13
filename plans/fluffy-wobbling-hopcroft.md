# Plan — Validación correo verificado en login

## Contexto

`iniciarSesion()` no verifica `correoVerificado` antes de emitir tokens. Usuarios registrados pero no verificados pueden hacer login. El frontend no maneja ese caso. Ya existen `/registro/pendiente` (pantalla "revisa tu correo") y el flujo completo de verificación. Solo falta conectar el login con ese flujo.

---

## Cambios

### 1. Backend — `excepcion-http.filtro.ts`
**Archivo:** `backend/src/comun/filtros/excepcion-http.filtro.ts`

Agregar campo `codigo` en la respuesta JSON, extraído del objeto de la excepción si existe:

```typescript
respuesta.status(status).json({
  exito: false,
  mensaje,
  codigo: typeof respuestaExcepcion === 'object' && respuestaExcepcion !== null
    ? (respuestaExcepcion as Record<string, unknown>).codigo ?? null
    : null,
  datos: null,
});
```

### 2. Backend — `autenticacion.servicio.ts`
**Archivo:** `backend/src/autenticacion/autenticacion/autenticacion.servicio.ts`

En `iniciarSesion()`, después de verificar contraseña y antes de `emitirTokens()`:

```typescript
if (!usuario.correoVerificado) {
  const tokenActivo =
    !!usuario.tokenVerificacionExpira &&
    new Date() <= usuario.tokenVerificacionExpira;

  throw new ForbiddenException({
    message: tokenActivo
      ? 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
      : 'El enlace de verificación expiró. Vuelve a registrarte para recibir uno nuevo.',
    codigo: tokenActivo
      ? 'CORREO_NO_VERIFICADO_ACTIVO'
      : 'CORREO_NO_VERIFICADO_EXPIRADO',
  });
}
```

> `ForbiddenException` (403) — credenciales válidas pero acceso denegado. El interceptor de frontend solo actúa en 401, así que este error llega limpio al componente.

### 3. Frontend — `inicio-sesion.component.ts`
**Archivo:** `frontend/src/app/features/autenticacion/inicio-sesion/inicio-sesion.component.ts`

En el handler de error de `iniciarSesion()`:

```typescript
error: (error) => {
  this.enviando = false;
  const codigo = error?.error?.codigo;
  if (codigo === 'CORREO_NO_VERIFICADO_ACTIVO') {
    void this.router.navigate(['/registro/pendiente']);
    return;
  }
  this.errorInicioSesion = error?.error?.mensaje ||
    (codigo === 'CORREO_NO_VERIFICADO_EXPIRADO'
      ? 'Tu enlace expiró. Regístrate de nuevo para recibir uno nuevo.'
      : 'No fue posible iniciar sesion.');
}
```

- **Token activo** → redirige a `/registro/pendiente` (pantalla ya existente con instrucciones)
- **Token expirado** → muestra error inline en login con link `[routerLink]="/registro"` visible

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/src/comun/filtros/excepcion-http.filtro.ts` | +campo `codigo` en respuesta JSON |
| `backend/src/autenticacion/autenticacion/autenticacion.servicio.ts` | +check `correoVerificado` en `iniciarSesion()` |
| `frontend/src/app/features/autenticacion/inicio-sesion/inicio-sesion.component.ts` | +manejo códigos en error handler |

**No** se modifica `inicio-sesion.component.html` salvo que el mensaje de error expirado necesite un link — se puede hacer inline en el template con `@if (errorEsExpiracion)`.

---

## Verificación

1. Login con usuario NO verificado y token activo → redirige a `/registro/pendiente`
2. Login con usuario NO verificado y token expirado → muestra error inline "Tu enlace expiró. Regístrate de nuevo."
3. Login con usuario verificado → flujo normal, dashboard
4. Login credenciales incorrectas → sigue mostrando "Credenciales inválidas"
5. `npm run test` backend — el spec de `autenticacion.servicio` debe cubrir los 2 casos nuevos
