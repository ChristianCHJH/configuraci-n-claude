# Plan: Fix parpadeo al marcar imagen principal

## Contexto

Al hacer clic en la estrella de una imagen, el modal completo parpadea y el scroll de la galería regresa al inicio. Causa: `marcarComoPrincipal()` llama `cargarImagenes()` on success, que hace:
1. `cargandoImagenes.set(true)` → toggle de estado de carga (flash visual)
2. HTTP GET al servidor
3. `this.imagenes.set(imgs)` → reemplaza el array entero con nuevos objetos

Esto causa re-render completo del `@for` y reset del scroll, aunque `track img.id` esté configurado.

## Fix: actualización optimista local

La operación es determinista: una imagen queda como principal, todas las demás no. No se necesita recargar del servidor para actualizar la UI.

### Archivo a modificar

`frontend/src/app/features/inventario/productos-lista/catalogo-producto-dialog/catalogo-producto-dialog.component.ts`

### Cambio (líneas 196–205)

**Antes:**
```typescript
next: () => this.cargarImagenes(),
```

**Después:**
```typescript
next: () => {
  this.imagenes.update(imgs =>
    imgs.map(img => ({ ...img, esPrincipal: img.id === imagen.id }))
  );
},
```

`imagenes.update()` muta el signal con el mismo array estructural — Angular reusa los nodos DOM del `@for (track img.id)` y solo actualiza los bindings que cambiaron (`esPrincipal`). Sin HTTP, sin toggle de carga, sin scroll reset.

## Verificación

1. Abrir modal de configuración de un producto con varias imágenes
2. Hacer scroll en la galería hasta ver imágenes al final
3. Clic estrella en imagen no principal
4. Verificar: estrella cambia inmediatamente, sin parpadeo, scroll no regresa al inicio
5. Cerrar y reabrir modal → imagen principal correcta persiste (confirmación server-side ya se ejecutó)
