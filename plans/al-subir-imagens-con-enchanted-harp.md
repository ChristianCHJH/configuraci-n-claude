# Plan: Auto-resize y conversión WebP en Tina Media Manager

## Contexto

Al subir imágenes con el Media Manager de Tina CMS, se guardan tal cual — sin comprimir, sin redimensionar. Imágenes de 5-10 MB de cámaras o screenshots se acumulan en `public/assets/images/`, pesando el repo y ralentizando la web. El requisito es procesar automáticamente cada imagen subida: redimensionar a máximo 1920×1200 px (orientación automática) y convertir a WebP.

**Regla de redimensionado (de la captura GIMP del usuario):**
- Landscape (`width >= height`): cabe en 1920×1200
- Portrait (`height > width`): cabe en 1200×1920
- Modo "Ajustar" + "Mantener aspecto": escala uniforme, sin recorte, sin estirado
- No se hace upscale — si la imagen ya es más pequeña, solo se convierte a WebP

## Enfoque

**`cmsCallback` en `tina/config.ts` + Canvas API del browser (sin dependencias nuevas)**

Tina expone `cmsCallback: (cms) => cms` en `defineConfig`, que se ejecuta en el contexto del browser del admin. Desde ahí podemos envolver `cms.media.store.persist` para interceptar cada archivo antes de que Tina lo envíe al servidor. El procesado usa Canvas API nativa (`document.createElement('canvas')`, `canvas.toBlob('image/webp', quality)`) — disponible en Chrome y Firefox modernos que usan para el admin.

## Archivos a modificar

**Solo un archivo:** `tina/config.ts`

## Implementación

### 1. Helper `processImage` (antes de `defineConfig`)

```typescript
async function processImage(file: File): Promise<File> {
  // Solo imágenes renderizables en canvas
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file
  // Ya está optimizada — no tocar
  if (file.size < 100 * 1024) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight

      // Orientación → máximos
      const isLandscape = w >= h
      const maxW = isLandscape ? 1920 : 1200
      const maxH = isLandscape ? 1200 : 1920

      // Scale < 1 = reducir; >= 1 = no upscale
      const scale = Math.min(maxW / w, maxH / h, 1)
      const newW = Math.round(w * scale)
      const newH = Math.round(h * scale)

      const canvas = document.createElement('canvas')
      canvas.width = newW
      canvas.height = newH
      canvas.getContext('2d')!.drawImage(img, 0, 0, newW, newH)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const webpName = file.name.replace(/\.[^.]+$/, '.webp')
          resolve(new File([blob], webpName, { type: 'image/webp' }))
        },
        'image/webp',
        0.82
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
```

### 2. `cmsCallback` en `defineConfig`

Agregar junto a `media`, `build`, `ui`:

```typescript
cmsCallback: (cms) => {
  const store = cms.media.store
  if (store) {
    const orig = store.persist.bind(store)
    store.persist = async (files) => {
      const processed = await Promise.all(
        files.map(async ({ directory, file }) => ({
          directory,
          file: await processImage(file as File),
        }))
      )
      return orig(processed)
    }
  }
  return cms
},
```

### Nota TypeScript

Si el compilador de Tina CLI no incluye tipos DOM, agregar al inicio del archivo:
```typescript
/// <reference lib="dom" />
```

## Verificación

1. `npm run tina:dev`
2. Abrir Media Manager en `localhost:5173/web-design/tina-admin/index.html`
3. Subir una foto JPEG grande (>2MB, >1920px) — horizontal y vertical
4. Verificar en `public/assets/images/`:
   - El archivo tiene extensión `.webp`
   - El tamaño es menor al original
   - Las dimensiones no superan 1920×1200 (usar Properties del explorador o similar)
5. Subir una imagen pequeña (<100KB) — debe guardarse tal cual, sin resize ni conversión
6. Subir una imagen pequeña (400×300 pero >100KB) — debe aparecer como `.webp` pero sin resize
7. Subir un PDF — debe pasar sin modificaciones

## Riesgo / Fallback

Si `cmsCallback` se ejecuta antes de que `media.tina` inicialice el store (store === null en ese momento), el null-check `if (store)` hará que no falle — pero tampoco aplicará el resize. Si ocurre esto, la alternativa es un Vite middleware que intercepte POST `/tina/media` con `busboy` + `sharp` antes de que el proxy lo reenvíe a puerto 4001.
