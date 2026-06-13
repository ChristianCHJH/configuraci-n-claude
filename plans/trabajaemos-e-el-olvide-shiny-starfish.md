# Plan — Flujo "Olvidé mi contraseña"

## Contexto

El sistema ya tiene `CorreoServicio.enviarRecuperacionContrasena()` implementado pero sin endpoint ni columnas de BD. El usuario quiere el flujo completo: formulario de solicitud → email con enlace → formulario de nueva contraseña → redirección al login.

---

## Alcance

### BD — 1 migración

**Archivo:** `database/migrations/023-token-recuperacion-contrasena.sql`

Agregar en tabla `usuarios`:
```sql
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS token_recuperacion VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS token_recuperacion_expira TIMESTAMP WITH TIME ZONE NULL;
```

Actualizar `database/setup-completo.sql`: añadir las dos columnas en el `CREATE TABLE usuarios` + actualizar cabecera.

---

### Backend — NestJS

#### 1. Entidad
`backend/src/autenticacion/usuarios/entidades/usuario.entidad.ts`
- Agregar: `tokenRecuperacion: string | null` y `tokenRecuperacionExpira: Date | null`

#### 2. DTOs (nuevos)
- `backend/src/autenticacion/autenticacion/dto/solicitar-recuperacion.dto.ts`
  - `correo: string` — `@IsEmail() @IsNotEmpty()`
- `backend/src/autenticacion/autenticacion/dto/restablecer-contrasena.dto.ts`
  - `token: string` — `@IsNotEmpty()`
  - `nuevaContrasena: string` — `@MinLength(8)`

#### 3. Servicio
`backend/src/autenticacion/autenticacion/autenticacion.servicio.ts`

**`solicitarRecuperacion(dto)`**
1. Buscar usuario por `correo` (no lanzar error si no existe — responder OK siempre, anti-enum)
2. Si existe: generar token `randomUUID()`, calcular expiración `+15min`
3. Guardar `tokenRecuperacion` + `tokenRecuperacionExpira` en usuario
4. Llamar `CorreoServicio.enviarRecuperacionContrasena(correo, token)`
5. Retornar mensaje genérico

**`restablecerContrasena(dto)`**
1. Buscar usuario por `tokenRecuperacion = token` donde `eliminado = false`
2. Si no existe → `BadRequestException('Token inválido')`
3. Si `tokenRecuperacionExpira < now` → `BadRequestException('Token expirado')`
4. Hash nueva contraseña con bcrypt
5. Actualizar `contrasenaHash`, limpiar `tokenRecuperacion = null`, `tokenRecuperacionExpira = null`
6. Retornar mensaje de éxito

#### 4. Controlador
`backend/src/autenticacion/autenticacion/autenticacion.controlador.ts`

```
@Publica() POST /autenticacion/recuperar-contrasena   → solicitarRecuperacion(dto)
@Publica() POST /autenticacion/restablecer-contrasena → restablecerContrasena(dto)
```

#### 5. Email template URL
`backend/src/correo/correo.servicio.ts` — cambiar URL del enlace de:
`{APP_URL}/recuperar-contrasena?token={token}` → `{APP_URL}/restablecer-contrasena?token={token}`

---

### Frontend — Angular

#### 1. Servicio
`frontend/src/app/features/autenticacion/autenticacion.servicio.ts`

Agregar métodos:
- `solicitarRecuperacion(correo: string): Observable<any>` → `POST /api/autenticacion/recuperar-contrasena`
- `restablecerContrasena(token: string, nuevaContrasena: string): Observable<any>` → `POST /api/autenticacion/restablecer-contrasena`

#### 2. Componente — Solicitar recuperación
`frontend/src/app/features/autenticacion/recuperar-contrasena/`
- Misma shell visual que el login (dos columnas, DESIGN tokens)
- Formulario: campo email + botón "Enviar instrucciones"
- Estado de éxito: mensaje "Revisa tu correo" (sin redirigir, anti-spam UX)
- Estado de error: mensaje genérico

#### 3. Componente — Restablecer contraseña
`frontend/src/app/features/autenticacion/restablecer-contrasena/`
- Lee `token` de `ActivatedRoute.queryParams`
- Si no hay token en URL → redirigir a `/recuperar-contrasena`
- Formulario: nueva contraseña + confirmar contraseña (validator cross-field)
- Al enviar: `restablecerContrasena(token, pass)` → redirigir a `/` con `MessageService` de éxito

#### 4. Rutas
`frontend/src/app/app.routes.ts`

```typescript
{ path: 'recuperar-contrasena', loadComponent: () => ... RecuperarContrasenaComponent },
{ path: 'restablecer-contrasena', loadComponent: () => ... RestablecerContrasenaComponent },
```

#### 5. Login — link "¿Olvidaste tu contraseña?"
`frontend/src/app/features/autenticacion/inicio-sesion/inicio-sesion.component.html`
- Agregar enlace `routerLink="/recuperar-contrasena"` debajo del campo contraseña

---

## Orden de ejecución

1. Migración SQL + setup-completo.sql
2. Entidad usuario (columnas nuevas)
3. DTOs nuevos
4. Servicio backend (2 métodos)
5. Controlador backend (2 endpoints)
6. Correo servicio (fix URL)
7. Servicio Angular (2 métodos)
8. Componente recuperar-contrasena
9. Componente restablecer-contrasena
10. Rutas + link en login

---

## Verificación

1. `POST /api/autenticacion/recuperar-contrasena` con correo existente → recibir email
2. Abrir enlace del email → `localhost:4200/restablecer-contrasena?token=xxx`
3. Ingresar contraseña nueva → redirige al login con toast de éxito
4. Login con contraseña nueva → funciona
5. Reintentar token usado → error "Token inválido"
6. Token expirado (simular con expiración = pasado) → error "Token expirado"
7. Correo inexistente → respuesta OK (sin revelar si existe)
