# Plan: Sección "Descarga de Tarifas" — CMS completo

## Contexto

La sección "DESCARGA DE TARIFAS" existe en el JSON y el componente React la renderiza correctamente, pero el CMS no tiene campos para editarla. Hay dos problemas: (1) `config.yml` no define el campo `tarifas`, por lo que el editor del CMS nunca ve ese formulario; (2) el preview de Decap no muestra el `file_url` de cada tarifa, solo el nombre.

## Diagnóstico por capa

| Capa | Estado | Detalle |
|---|---|---|
| JSON `es/home.json` + `en/home.json` | ✓ OK | `tarifas.section_title` + `tarifas.items[].name` + `tarifas.items[].file_url` |
| `HomeScreen.tsx` | ✓ OK | Usa los 3 campos correctamente |
| TypeScript `HomeData` | ✓ OK | Interfaz completa |
| `public/admin/index.html` (preview) | ⚠️ Parcial | Renderiza `section_title` y `name`, pero NO muestra `file_url` |
| `public/admin/config.yml` | ❌ Ausente | `tarifas` no está definido — no hay form en el CMS |

## Cambios

### 1. `public/admin/config.yml` — agregar definición de `tarifas`

Añadir después del bloque `comunicados` en `&home_fields`:

```yaml
- name: "tarifas"
  label: "Descarga de Tarifas"
  widget: "object"
  fields:
    - {label: "Título sección", name: "section_title", widget: "string"}
    - name: "items"
      label: "Tarifas"
      widget: "list"
      fields:
        - {label: "Nombre", name: "name", widget: "string"}
        - {label: "Archivo (PDF)", name: "file_url", widget: "file", media_library: {config: {multiple: false}}}
```

Esto aplica a AMBAS entradas (`home_es` y `home_en`) porque ambas usan `fields: *home_fields`.

### 2. `public/admin/index.html` — mostrar `file_url` en el preview

En el bloque `pw-tarifa-item` del `HomePreview`, el link `<a>` debe envolver el contenido y usar `item.get('file_url')` como `href`. El preview actual no tiene este enlace, solo muestra el nombre + icono sin funcionalidad.

Cambio puntual: convertir el `div` del item en un `<a>` con `href={item.get('file_url') || '#'}`.

## Archivos a modificar

1. `public/admin/config.yml` — agregar bloque `tarifas` en `&home_fields`
2. `public/admin/index.html` — cambiar `div` a `a` en `pw-tarifa-item` con `href`

## Verificación

1. Abrir CMS local: `npx decap-server` (puerto 8081) + `npm run dev`
2. Navegar a Página de Inicio → editar home_es
3. Confirmar que aparece sección "Descarga de Tarifas" con campos editables
4. Subir un PDF de prueba → verificar que `file_url` se actualiza en el JSON
5. Confirmar que el preview muestra el item como enlace con href
