# Plan: Migrar CorreoServicio de Nodemailer/Gmail SMTP a Resend

## Contexto

Render.com bloquea conexiones SMTP salientes (puertos 465/587) en instancias free/starter.
`CorreoServicio` usa `nodemailer` con `service: 'gmail'` → intenta conectar a `smtp.gmail.com:587` → timeout.
Resend usa HTTP (API REST), no SMTP → funciona en Render sin restricciones.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/src/correo/correo.servicio.ts` | Reemplazar nodemailer por Resend SDK |
| `backend/src/correo/correo.servicio.spec.ts` | Actualizar mocks |
| `backend/package.json` | Instalar `resend`, remover `nodemailer` + `@types/nodemailer` |
| Variables de entorno en Render | Agregar `RESEND_API_KEY`, remover `GMAIL_USER`, `GMAIL_APP_PASSWORD` |

## Implementación

### 1. Dependencias

```bash
npm install resend
npm uninstall nodemailer @types/nodemailer
```

### 2. correo.servicio.ts — reemplazar transport por Resend

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class CorreoServicio {
  private readonly logger = new Logger(CorreoServicio.name);
  private readonly resend: Resend;
  private readonly remitente: string;
  private readonly appUrl: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.remitente = process.env.CORREO_REMITENTE ?? 'adifnex@adifnex.com';
    this.appUrl = process.env.APP_URL ?? 'http://localhost:4200';
  }

  async enviarVerificacionCorreo(destinatario, nombreUsuario, token) {
    const url = `${this.appUrl}/verificar?token=${token}`;
    try {
      await this.resend.emails.send({
        from: `Adifnex <${this.remitente}>`,
        to: destinatario,
        subject: 'Activa tu cuenta en Adifnex',
        html: this.plantillaVerificacion(nombreUsuario, url),
      });
      this.logger.log(`Verificación enviada a ${destinatario}`);
    } catch (error) {
      this.logger.error(`Error enviando verificación a ${destinatario}`, error);
    }
  }
  // ... misma estructura para enviarBienvenida y enviarRecuperacionContrasena
}
```

**Nota sobre remitente:** Resend requiere dominio verificado para `from`. Opciones:
- **Dominio propio verificado** (ej. `notificaciones@adifnex.com`) — recomendado para producción
- **`onboarding@resend.dev`** — funciona sin verificar dominio, para testing rápido

### 3. Variables de entorno en Render

Agregar:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
CORREO_REMITENTE=onboarding@resend.dev   ← o dominio propio verificado
```

Remover: `GMAIL_USER`, `GMAIL_APP_PASSWORD`

### 4. correo.servicio.spec.ts — mock actualizado

```typescript
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    },
  })),
}));
```

## Puntos a confirmar antes de ejecutar

1. **¿Tienes cuenta en Resend y API key?** → resend.com
2. **¿Tienes dominio verificado en Resend?** (adifnex.com, etc.)
   - Si no → usar `onboarding@resend.dev` como remitente temporalmente
   - Si sí → configurar `CORREO_REMITENTE=notificaciones@tudominio.com`

## Verificación post-implementación

1. `npm run build` sin errores en backend
2. Configurar `RESEND_API_KEY` en Render → redeploy
3. Llamar `POST /api/correo/test` → verificar correo llega
4. Llamar `POST /api/autenticacion/registro` → verificar correo de verificación llega
5. Logs en Render: no debe aparecer `Connection timeout`
