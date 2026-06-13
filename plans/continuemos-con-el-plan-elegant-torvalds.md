# Plan — Registro Público con Verificación de Correo

## Contexto

SaaS multi-negocio. El flujo de registro autoservicio requiere verificación de correo antes de acceder al dashboard (bloqueante). Proveedor de email: **Gmail SMTP** con `@nestjs-modules/mailer`. Al registrarse, el usuario recibe un enlace de activación de 24h; hasta hacer clic, no puede entrar al sistema.

---

## Flujo completo

```
Usuario llena /registro
    ↓
POST /api/autenticacion/registro
    ↓ (transacción: negocio + usuario + rol)
    ↓ correo_verificado=false, token generado
    ↓ Email enviado con enlace
    ↓ Responde { verificacionPendiente: true }
Frontend redirige a pantalla "Verifica tu correo"
    ↓
Usuario hace clic en enlace → /verificar?token=UUID
    ↓
GET /api/autenticacion/verificar?token=UUID
    ↓ valida token no expirado
    ↓ correo_verificado=true, token limpiado
    ↓ emitirTokens(usuario) → retorna tokens
Frontend almacena tokens → navega a /dashboard
```

---

## Migración de BD requerida

**SÍ hay migración** — agregar 3 columnas a `usuarios`:

```sql
ALTER TABLE usuarios
  ADD COLUMN correo_verificado     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN token_verificacion    VARCHAR(255),
  ADD COLUMN token_verificacion_expira TIMESTAMP WITH TIME ZONE;
```

Archivos:
- `database/migrations/NNN-agregar-verificacion-correo-usuarios.sql` (con `IF NOT EXISTS`)
- `database/setup-completo.sql` — agregar las 3 columnas inline en `CREATE TABLE usuarios`

---

## Variables de entorno nuevas

Agregar a `.env` y documentar en `docker-compose.yml`:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx   # Google App Password (no la contraseña normal)
MAIL_FROM="Mi Sistema <tu_correo@gmail.com>"
APP_URL=http://localhost:4200
```

> **Gmail requiere App Password**: Cuenta → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones.

---

## Archivos a crear/modificar

### Backend

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `database/migrations/NNN-agregar-verificacion-correo-usuarios.sql` | NUEVO | 3 columnas nuevas en `usuarios` |
| `database/setup-completo.sql` | MODIFICAR | Agregar las 3 columnas en `CREATE TABLE usuarios` |
| `backend/src/autenticacion/usuarios/entidades/usuario.entidad.ts` | MODIFICAR | Agregar `correoVerificado`, `tokenVerificacion`, `tokenVerificacionExpira` |
| `backend/src/autenticacion/autenticacion/dto/registro-publico.dto.ts` | NUEVO | DTO con campos del formulario |
| `backend/src/autenticacion/autenticacion/autenticacion.servicio.ts` | MODIFICAR | Método `registrar()`, método `verificarCorreo()`, inyectar `Rol`, inyectar `MailerService` |
| `backend/src/autenticacion/autenticacion/autenticacion.controlador.ts` | MODIFICAR | `POST registro` y `GET verificar` ambos `@Publica()` |
| `backend/src/autenticacion/autenticacion/autenticacion.modulo.ts` | MODIFICAR | Agregar `Rol` + `MailerModule` |
| `backend/src/main.ts` o `app.module.ts` | MODIFICAR | Registrar `MailerModule` global con config Gmail |

### Frontend

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `frontend/src/app/features/autenticacion/registro/registro.component.ts` | NUEVO | Reactive form, llama `registrar()`, navega a `/registro/pendiente` |
| `frontend/src/app/features/autenticacion/registro/registro.component.html` | NUEVO | Formulario dos columnas (negocio / admin) |
| `frontend/src/app/features/autenticacion/registro-pendiente/registro-pendiente.component.ts` | NUEVO | Pantalla estática "Revisa tu correo" |
| `frontend/src/app/features/autenticacion/registro-pendiente/registro-pendiente.component.html` | NUEVO | Mensaje de éxito, instrucciones, link a /login |
| `frontend/src/app/features/autenticacion/verificar-correo/verificar-correo.component.ts` | NUEVO | Lee `?token` de query params, llama API, guarda tokens, redirige |
| `frontend/src/app/features/autenticacion/verificar-correo/verificar-correo.component.html` | NUEVO | Estados: verificando… / éxito / error |
| `frontend/src/app/features/autenticacion/autenticacion.servicio.ts` | MODIFICAR | Agregar `registrar(dto)` y `verificarCorreo(token)` |
| `frontend/src/app/app.routes.ts` | MODIFICAR | Rutas `/registro`, `/registro/pendiente`, `/verificar` (todas sin guard) |
| `frontend/src/app/features/autenticacion/inicio-sesion/inicio-sesion.component.html` | MODIFICAR | Link "¿No tienes cuenta? Regístrate" → `/registro` |

---

## Implementación detallada

### Backend: `registrar(dto)` en el servicio

```typescript
async registrar(dto: RegistroPublicoDto) {
  // 1. Verificar unicidad (fuera de tx, falla rápido)
  const existe = await this.usuarioModelo.findOne({
    where: { [Op.or]: [{ correo: dto.correo }, { nombreUsuario: dto.nombreUsuario }] }
  });
  if (existe) throw new ConflictException('Correo o nombre de usuario ya registrado');

  const t = await this.usuarioModelo.sequelize!.transaction();
  try {
    // 2. Crear negocio (usuario_creacion=0 bootstrap)
    const negocio = await this.negocioModelo.create({ nombre: dto.nombre, ruc: dto.ruc,
      correoContacto: dto.correoContacto, nivelPlan: 1,
      usuarioCreacion: 0, usuarioActualizacion: 0 }, { transaction: t });

    // 3. Crear usuario (correo_verificado=false, token con UUID)
    const hash = await bcrypt.hash(dto.contrasena, 10);
    const token = randomUUID();
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const usuario = await this.usuarioModelo.create({
      nombreUsuario: dto.nombreUsuario, correo: dto.correo, contrasenaHash: hash,
      negocioId: negocio.id, correoVerificado: false,
      tokenVerificacion: token, tokenVerificacionExpira: expira,
      usuarioCreacion: 0, usuarioActualizacion: 0 }, { transaction: t });

    // 4. Parchear referencias circulares
    await negocio.update({ usuarioCreacion: usuario.id, usuarioActualizacion: usuario.id }, { transaction: t });
    await usuario.update({ usuarioCreacion: usuario.id, usuarioActualizacion: usuario.id }, { transaction: t });

    // 5. Asignar rol ADMINISTRADOR (plan básico nivel 1)
    // NOTA para el builder: verificar el nombre exacto del rol en la BD (puede ser 'ADMINISTRADOR').
    // Verificar si Rol tiene negocioId nullable o no; si son por negocio, buscar sin filtro de negocio.
    const rol = await this.rolModelo.findOne({ where: { rol: 'ADMINISTRADOR' } });
    if (!rol) throw new Error('Rol ADMINISTRADOR no encontrado en la BD');
    await this.usuarioRolModelo.create({
      usuarioId: usuario.id, rolId: rol.id,
      usuarioCreacion: usuario.id, usuarioActualizacion: usuario.id }, { transaction: t });

    await t.commit();

    // 6. Enviar email (fuera de tx, no bloquea si falla el correo)
    const enlace = `${process.env.APP_URL}/verificar?token=${token}`;
    await this.mailerService.sendMail({
      to: dto.correo,
      subject: 'Activa tu cuenta',
      html: `<p>Hola ${dto.nombreUsuario}, haz clic aquí para activar tu cuenta:</p>
             <a href="${enlace}">${enlace}</a>
             <p>Este enlace expira en 24 horas.</p>`,
    });

    return { verificacionPendiente: true, mensaje: 'Revisa tu correo para activar tu cuenta' };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}
```

### Backend: `verificarCorreo(token)` en el servicio

```typescript
async verificarCorreo(token: string) {
  const usuario = await this.usuarioModelo.findOne({
    where: { tokenVerificacion: token, correoVerificado: false }
  });
  if (!usuario) throw new BadRequestException('Token inválido');
  if (new Date() > usuario.tokenVerificacionExpira!) {
    throw new BadRequestException('El enlace ha expirado. Solicita un nuevo registro.');
  }

  await usuario.update({
    correoVerificado: true,
    tokenVerificacion: null,
    tokenVerificacionExpira: null,
  });

  return this.emitirTokens(usuario); // login automático
}
```

### Backend: Controlador

```typescript
@Publica()
@Post('registro')
registro(@Body() dto: RegistroPublicoDto) {
  return this.autenticacionServicio.registrar(dto);
}

@Publica()
@Get('verificar')
verificar(@Query('token') token: string) {
  return this.autenticacionServicio.verificarCorreo(token);
}
```

### Backend: MailerModule

Registrar en `app.module.ts` o `autenticacion.modulo.ts`:

```typescript
MailerModule.forRoot({
  transport: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  },
  defaults: { from: process.env.MAIL_FROM },
})
```

Instalar: `npm install @nestjs-modules/mailer nodemailer && npm install -D @types/nodemailer`

### Frontend: `autenticacion.servicio.ts` — métodos nuevos

```typescript
export interface DatosRegistro {
  nombre: string; ruc?: string; correoContacto?: string;
  nombreUsuario: string; correo: string; contrasena: string;
}

registrar(datos: DatosRegistro): Observable<{ verificacionPendiente: boolean; mensaje: string }> {
  return this.http.post('api/autenticacion/registro', datos);
}

verificarCorreo(token: string): Observable<RespuestaInicioSesion> {
  return this.http.get<RespuestaInicioSesion>(`api/autenticacion/verificar?token=${token}`).pipe(
    tap((respuesta) => this.persistirTokens(respuesta, false))
  );
}
```

### Frontend: `verificar-correo.component.ts`

```typescript
ngOnInit() {
  const token = this.route.snapshot.queryParamMap.get('token');
  if (!token) { this.estado = 'error'; return; }
  this.estado = 'verificando';
  this.servicioAutenticacion.verificarCorreo(token).subscribe({
    next: () => {
      this.servicioAutenticacion.inicializarPermisos();
      this.router.navigate(['/dashboard']);
    },
    error: (e) => {
      this.estado = 'error';
      this.mensajeError = e?.error?.mensaje || 'Enlace inválido o expirado.';
    }
  });
}
```

### Frontend: Rutas

```typescript
{ path: 'registro', loadComponent: () => import(...RegistroComponent) },
{ path: 'registro/pendiente', loadComponent: () => import(...RegistroPendienteComponent) },
{ path: 'verificar', loadComponent: () => import(...VerificarCorreoComponent) },
```

---

## Verificación end-to-end

1. `npm install @nestjs-modules/mailer nodemailer` en backend
2. Configurar Gmail App Password en `.env`
3. Aplicar migración SQL en la BD
4. `POST /api/autenticacion/registro` con body válido → responde `{ verificacionPendiente: true }`
5. Verificar en BD: `usuarios.correo_verificado = false`, `token_verificacion` poblado
6. Abrir el email recibido → hacer clic en el enlace
7. `GET /api/autenticacion/verificar?token=...` → responde con tokens
8. Verificar en BD: `correo_verificado = true`, `token_verificacion = null`
9. Frontend: navegar a `/registro` → completar → pantalla "Revisa tu correo"
10. Clic en enlace del email → `/verificar?token=...` → redirige a `/dashboard`

---

## Tests

### Unit — Backend
- `registrar()` → crea negocio + usuario + rol, retorna `{ verificacionPendiente: true }`
- `registrar()` → lanza `ConflictException` si correo duplicado
- `registrar()` → lanza `ConflictException` si `nombreUsuario` duplicado
- `verificarCorreo()` → activa cuenta y retorna tokens
- `verificarCorreo()` → lanza `BadRequestException` si token expirado
- `verificarCorreo()` → lanza `BadRequestException` si token inválido

### Unit — Frontend
- `registrar()` llama POST `/api/autenticacion/registro`
- `verificarCorreo(token)` llama GET con token en query params y almacena tokens

### E2E
- Formulario → registro → pantalla pendiente → (mock email) → `/verificar?token` → `/dashboard`
