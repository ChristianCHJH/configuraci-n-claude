# Plan — Arreglar refresh token y redirección a login

## Context

La sesión muere a los ~15 min y la pantalla queda atascada (muerta) en vez de ir al login.
Diagnóstico tras explorar backend + frontend:

1. **El refresh está roto (causa de "vence muy rápido").** No es que el refresh token expire rápido
   — su TTL es 30 días. El problema es que el frontend manda el campo equivocado:
   `{ jti: ... }` cuando el backend exige `{ refreshToken: ... }`. Con
   `whitelist + forbidNonWhitelisted` activos en el `ValidationPipe`, el campo `jti` se rechaza
   con **400** y `refreshToken` queda vacío → el refresh **nunca** funciona. Cuando el access token
   (15 min) expira, el 401 dispara un refresh que siempre falla → sesión muerta cada ~15 min.

2. **No redirige a login.** El interceptor llama `cerrarSesion()` (limpia tokens) pero **no navega**.
   Propaga el error; los componentes solo manejan 403, no 401 → el usuario queda en la pantalla muerta.

3. **Política de inactividad.** El refresh **rota y resetea su expiración a `now + TTL` en cada uso**
   (ventana deslizante). Decisión del usuario: TTL = **2 horas** idle, cierre **reactivo**
   (al volver y hacer una acción, redirige a login). Hoy el TTL es 30d → bajarlo a 2h.

Resultado esperado: mientras se usa la app la sesión se renueva sola; tras 2h sin actividad expira;
y cuando expira (por lo que sea) redirige a `/` (login) en vez de quedarse atascado.

---

## Cambios

### 1. Arreglar el payload del refresh (bug crítico)
**`frontend/src/app/features/autenticacion/autenticacion.servicio.ts:92`**

```ts
// antes
.post<RespuestaInicioSesion>('api/autenticacion/refresh', { jti: tokenRefresco })
// después
.post<RespuestaInicioSesion>('api/autenticacion/refresh', { refreshToken: tokenRefresco })
```

Esto por sí solo restaura el refresh y la sesión deja de morir a los 15 min.

### 2. Redirigir a login cuando la sesión se pierde (cierre reactivo)
**`frontend/src/app/core/interceptors/autenticacion.interceptor.ts`**

- Inyectar `Router`: `const router = inject(Router);` (import `import { Router } from '@angular/router';`).
- En el `catchError` del refresh fallido (líneas 65-68): tras `cerrarSesion()`, agregar
  `router.navigate(['/']);` antes de re-lanzar el error.
- También cubrir la rama "sin cabecera actualizada" (líneas 55-57): si no hay cabecera tras el
  refresh, llamar `cerrarSesion()` + `router.navigate(['/'])` antes de `throwError`.

La ruta de login es `/` (confirmado en `app.routes.ts` y en el guard/barra-lateral que ya navegan a `/`).

### 3. Bajar el TTL del refresh a 2h (ventana de inactividad)
Cambiar `30d` → `2h` en los 3 lugares:

- **`docker-compose.dev.yml:22`** → `JWT_REFRESH_EXPIRACION: 2h`
- **`docker-compose.yml:17`** → `JWT_REFRESH_EXPIRACION: 2h`
- **`backend/src/autenticacion/autenticacion/autenticacion.servicio.ts:58`** (fallback en código)
  → `process.env.JWT_REFRESH_EXPIRACION || '2h'`

El access token (15 min) se deja igual: se refresca solo de forma transparente.

> No hay archivo `.env`; la config vive en los docker-compose. `environment.prod.ts` (protegido)
> no se toca: no tiene relación con el TTL del refresh.

---

## Verificación

1. **Refresh funciona:** levantar backend + frontend, login, esperar a que el access token expire
   (o forzar una request tras 15 min) → la app debe seguir andando sin volver al login. En la
   pestaña Network, `POST /api/autenticacion/refresh` debe responder **200** (antes daba 400).
2. **Redirección reactiva:** borrar/invalidar el refresh token (o esperar las 2h idle), luego hacer
   una acción → debe ir a `/` (login), no quedarse en pantalla muerta.
3. **Inactividad 2h:** confirmar en BD que el nuevo `refresh_token.expira_en` ≈ `now + 2h` tras
   cada refresh.

## Tests recomendados

### Unit tests (Jest — frontend)
- [ ] `refrescarTokens()` hace POST a `api/autenticacion/refresh` con body `{ refreshToken }` (no `jti`) — `frontend/src/app/features/autenticacion/autenticacion.servicio.spec.ts`
- [ ] Interceptor: si el refresh falla, llama `cerrarSesion()` y `router.navigate(['/'])` — `frontend/src/app/core/interceptors/autenticacion.interceptor.spec.ts`
- [ ] Interceptor: 401 con refresh OK reintenta la request original con la nueva cabecera — mismo spec

### E2E (Playwright)
- [ ] Sesión expirada → al hacer una acción redirige a la pantalla de login — `e2e/tests/01-auth/sesion-expira.spec.ts`
