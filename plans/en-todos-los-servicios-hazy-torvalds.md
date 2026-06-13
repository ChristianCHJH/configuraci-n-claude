# Plan: Sección "Conoce más de nuestros servicios" — formato tira horizontal

## Contexto

La pantalla `ServiceDetailScreen` tiene una sección de cross-selling que actualmente muestra **solo 3 servicios** en un grid de tarjetas blancas con `card_image`. El usuario quiere que esa sección sea reemplazada por una **tira horizontal de tarjetas con imagen de fondo**, mostrando **todos los servicios excepto el actual**, con el nombre del servicio superpuesto en un recuadro en la esquina inferior izquierda — exactamente el formato visual de la imagen de referencia.

## Archivo a modificar

`c:\Christian\web-desing\src\presentation\services\screens\ServiceDetailScreen.tsx`

## Cambio concreto

**Reemplazar la sección cross-selling actual (líneas ~137–172)** con la nueva implementación.

### Datos disponibles (sin cambios)
- `otherServices` ya existe: `services.catalog.filter((s) => s.slug !== slug)` — filtra el servicio actual, retorna los otros 6 (de 7 totales)
- Cada `ServiceItem` tiene: `slug`, `title`, `image_url`
- `resolveImageUrl()` ya importado en el archivo vía `src/application/utils/url.utils.ts`
- `useNavigate()` ya importado y en uso

### Layout de la tira
```
<section>
  <h2>cross_selling_title</h2>
  <div overflow-x-auto flex gap-1 (snap scroll)>
    @for service of otherServices:
      <div  min-w relativo, aspect-[9/16] sm:aspect-[3/4], background-image, cursor-pointer onClick navigate>
        <!-- overlay gradiente oscuro en parte inferior -->
        <div absolute bottom-0 left-0 padding >
          <span border border-white text-white font-semibold uppercase px-3 py-2>
            {{ service.title }}
          </span>
        </div>
      </div>
  </div>
</section>
```

### Especificaciones de estilo (fiel al formato de la imagen)
- **Contenedor**: `flex overflow-x-auto gap-1 pb-2` con `snap-x snap-mandatory` para mobile
- **Cada tarjeta**: `relative flex-shrink-0 cursor-pointer overflow-hidden` con tamaño `w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[18vw]` y `aspect-[3/4]`
- **Imagen de fondo**: `style={{ backgroundImage: ... }}` + `bg-cover bg-center`
- **Overlay**: gradiente `from-transparent to-black/60` en la mitad inferior para legibilidad del texto
- **Recuadro título**: `absolute bottom-3 left-3`, texto `text-white font-semibold text-sm uppercase leading-tight`, con `border border-white px-3 py-2 inline-block`
- **Hover**: `hover:scale-[1.02] transition-transform duration-300` en la tarjeta

## Verificación
1. `npm run dev` — navegar a cualquier servicio (ej. `/servicios/contenedores-vacios`)
2. Confirmar que aparecen 6 tarjetas en tira horizontal (todos excepto el actual)
3. Verificar en mobile que el scroll horizontal funciona
4. Navegar a otro servicio desde la tira — confirmar que ese servicio también muestra los demás correctamente (6 tarjetas distintas)
5. `npm run build` — sin errores TypeScript
