# Plan — Módulo Correo (Gmail SMTP) en NestJS

## Contexto
Se necesita infraestructura de correo para el registro público autoservicio y recuperación de contraseña. El volumen es bajo (~30 emails/día), por lo que Gmail SMTP con App Password es suficiente. Ya se generó la App Password `xdsahfcgflcjpubg` para `adifnex@gmail.com`.

## Archivos a crear/modificar

### 1. `backend/.env` — MODIFICAR
Agregar al final:
```
GMAIL_USER=adifnex@gmail.com
GMAIL_APP_PASSWORD=xdsahfcgflcjpubg
CORREO_REMITENTE=adifnex@gmail.com
APP_URL=http://localhost:4200
```

### 2. Instalar dependencia
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 3. `backend/src/correo/correo.servicio.ts` — NUEVO
- Usa `nodemailer` con `service: 'gmail'` + credenciales de env
- Métodos públicos:
  - `enviarBienvenida(destinatario, nombreNegocio)` — se llama post-registro (fire & forget)
  - `enviarRecuperacionContrasena(destinatario, token)` — para el futuro flujo de reset
- Errores capturados con `Logger` — nunca rompen el flujo principal
- Templates HTML inline (tabla de correo compatible con Gmail/Outlook)

### 4. `backend/src/correo/correo.modulo.ts` — NUEVO
- `@Global()` — disponible en toda la app sin reimportar
- Exporta `CorreoServicio`

### 5. `backend/src/modulo-aplicacion.ts` — MODIFICAR
- Importar y registrar `CorreoModulo` en el array `imports`

## Verificación
1. Levantar backend `npm run start:dev` — sin errores de compilación
2. Llamar `correoServicio.enviarBienvenida('christianjara011215@gmail.com', 'Negocio Test')` desde un endpoint temporal o unit test
3. Verificar que el correo llegue a inbox
