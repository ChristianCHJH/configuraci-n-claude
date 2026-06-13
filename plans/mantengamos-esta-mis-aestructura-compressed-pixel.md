# Plan: Hero NOSOTROS → todos los servicios

## Contexto
El usuario quiere que todas las páginas de servicio (`/servicios/:slug`) tengan la misma estructura de hero que la página NOSOTROS: imagen de fondo a pantalla completa con overlay azul, breadcrumb y título en la parte inferior izquierda. La imagen del hero de cada servicio es `service.image_url`, que ya existe en el JSON — no se necesitan cambios de datos.

## Archivo a modificar
`src/presentation/services/screens/ServiceDetailScreen.tsx` — único archivo, no hay cambios en JSON ni modelos.

## Cambios

### 1. Wrapper exterior
Cambiar el `<div className="max-w-7xl mx-auto px-4 ... py-24 space-y-20">` actual por un `<div className="space-y-20 pb-24">` sin padding top ni max-width (el hero debe ser full-width).

### 2. Reemplazar el bloque "Detalle del Servicio" (líneas 29–73)
Quitar la tarjeta blanca con imagen cuadrada y reemplazar por:

**a) Hero section** (idéntico al de AboutScreen):
```tsx
<section
  className="relative h-[72vh] min-h-[520px] flex items-end overflow-hidden"
  style={{
    backgroundImage: `url(${resolveImageUrl(service.image_url)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  <div className="absolute inset-0 bg-[#3f6585] z-10" style={{ opacity: 0.4 }} />
  <div className="absolute inset-0 bg-gradient-to-t from-[#3f6585]/70 via-transparent to-transparent z-10" />
  <div className="relative z-20 px-8 sm:px-12 lg:px-16 pb-14 max-w-3xl">
    {/* Breadcrumb */}
    <div className="flex items-center gap-2 mb-4">
      <span style={{ fontWeight: 600 }} className="text-white/60 text-xs tracking-widest uppercase">INICIO</span>
      <span className="text-white/40 text-xs">›</span>
      <span style={{ fontWeight: 600 }} className="text-white/60 text-xs tracking-widest uppercase">NUESTROS SERVICIOS</span>
      <span className="text-white/40 text-xs">›</span>
      <span style={{ fontWeight: 600 }} className="text-white/90 text-xs tracking-widest uppercase">{service.title}</span>
    </div>
    {/* Título */}
    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-none drop-shadow-lg">
      {service.title.toUpperCase()}
    </h1>
  </div>
</section>
```

**b) Sección de contenido** (debajo del hero, dentro del max-w-7xl):
```tsx
<section className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
  <div className="w-[78%] mx-auto space-y-6 text-center">
    <p className="text-lg font-semibold leading-relaxed" style={{ color: '#081f34' }}>
      {service.short_desc}
    </p>
    <p className="text-base leading-relaxed font-normal" style={{ color: '#081f34' }}>
      {service.long_desc}
    </p>
  </div>
  <div className="flex justify-center mt-10">
    <button onClick={handleCotizar} className="bg-unimar-blue text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-unimar-hover transform hover:-translate-y-1 transition-all duration-300 flex items-center group">
      {services.cta_text} <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
</section>
```

### 3. Galería y cross-selling
Sin cambios — solo agregar `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` en su contenedor si no lo tienen.

## Imports a quitar
- `Image as ImageIcon` de lucide-react (ya no se usa el placeholder de imagen cuadrada)

## Verificación
1. Navegar a `/servicios/contenedores-vacios` → debe mostrar hero con imagen + overlay azul + breadcrumb + título abajo izquierda
2. Navegar a otros 2-3 slugs → mismo patrón con sus respectivas imágenes
3. CTA "COTIZA" debe seguir funcionando → navega a `/contacto`
4. Galería y cross-selling siguen visibles debajo
5. `npx tsc --noEmit` sin errores
