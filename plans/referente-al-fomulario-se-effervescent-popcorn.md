# Plan: Formulario de Contacto — Web3Forms (con migración documentada a Vercel)

## Contexto

El formulario en `ContactScreen.tsx` tiene `onSubmit={(e) => e.preventDefault()}` — no hace nada, se pierden leads.

**Solución inmediata:** Web3Forms — SaaS gratuito (250/mes), sin backend, setup en 5 min.
**Migración futura:** Vercel + Nodemailer + Hotmail cuando se supere el límite de 250/mes.

---

## Prerequisito manual (Christian hace UNA VEZ antes de implementar)

1. Ir a web3forms.com
2. Ingresar correo destino: `cjara@unimar.com.pe`
3. Confirmar email que llega a ese correo
4. Copiar el **Access Key** que aparece
5. Crear archivo `.env.local` en la raíz del proyecto:
   ```
   VITE_WEB3FORMS_KEY=pega-tu-access-key-aqui
   ```
6. Verificar que `.env.local` esté en `.gitignore` (nunca subir la key al repo)

---

## Archivos a modificar

### 1. `src/presentation/contact/screens/ContactScreen.tsx`

**Agregar estados** (después de `formData`):
```ts
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
```

**Agregar función `handleSubmit`** (antes del return):
```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitStatus('idle');
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `Contacto UNIMAR - ${formData.reason}`,
        from_name: formData.name,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        role: formData.role,
        sector: formData.sector,
        reason: formData.reason,
        message: formData.message || '—',
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error();
    setSubmitStatus('success');
    setFormData({ name:'', email:'', phone:'', company:'', role:'', sector:'', reason:'', message:'', privacyAccepted:false });
  } catch {
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
}
```

**Cambiar el `onSubmit` del form** (línea 199):
```tsx
// antes:
<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
// después:
<form className="space-y-4" onSubmit={handleSubmit}>
```

**Cambiar el botón ENVIAR** (deshabilitar durante envío):
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="px-14 bg-[#0B2545] text-white font-bold py-3 rounded-full shadow-md hover:shadow-lg hover:bg-[#113866] transform hover:-translate-y-0.5 transition-all duration-300 text-xs tracking-wider disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
>
  {isSubmitting ? 'Enviando...' : contact.form.submit_button}
</button>
```

**Agregar banner de feedback** (debajo del botón, dentro del `<div className="pt-4 flex justify-center">`):
```tsx
{submitStatus === 'success' && (
  <p className="mt-4 text-sm text-green-600 font-medium text-center">
    Mensaje enviado. Nos contactaremos pronto.
  </p>
)}
{submitStatus === 'error' && (
  <p className="mt-4 text-sm text-red-600 font-medium text-center">
    Error al enviar. Escríbenos a{' '}
    <a href="mailto:atencionclientes@unimar.com.pe" className="underline">
      atencionclientes@unimar.com.pe
    </a>
  </p>
)}
```

---

## Migración futura a Vercel + Nodemailer (cuando supere 250/mes)

Cuando el formulario supere 250 envíos/mes:

1. Crear `api/contact.js` con Nodemailer + Hotmail SMTP
2. Agregar `vercel.json` al repo
3. Crear cuenta en vercel.com e importar el repo
4. Agregar variables de entorno en Vercel: `SMTP_USER`, `SMTP_PASS`, `SMTP_TO`
5. Cambiar en `ContactScreen.tsx` el fetch de `https://api.web3forms.com/submit` a `https://tu-proyecto.vercel.app/api/contact`
6. El resto del código (handleSubmit, estados, UI) no cambia

---

## Verificación

1. Completar el prerequisito manual primero (Access Key de Web3Forms)
2. `npm run dev`
3. Ir a `/contacto`, llenar el formulario completo
4. Click ENVIAR → botón debe mostrar "Enviando..." → luego banner verde
5. Revisar `cjara@unimar.com.pe` → debe llegar email con todos los campos
6. Probar con campos vacíos → HTML5 `required` debe bloquear antes de enviar
