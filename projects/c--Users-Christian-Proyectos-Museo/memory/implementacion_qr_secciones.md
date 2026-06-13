---
name: QR ↔ Secciones — implementación completada
description: Selector inteligente de secciones en formulario de QR y vista de QR en secciones del recorrido
type: project
originSessionId: fcffac5e-20ae-4bb3-a1ff-8186dfe26d98
---
## Resumen

Se implementó exitosamente la mejora del flujo de vinculación entre QRs y secciones del recorrido:

### Backend
- **Entidad**: SeccionRecorridoEntidad ahora tiene relación `@HasOne` con CodigoQrEntidad
- **Servicio secciones**: `obtenerPorExposicion()` incluye el QR vinculado en cada sección
- **Servicio QR**: nuevo método `obtenerSeccionesDisponibles(excluirQrId?)` devuelve solo secciones sin QR asignado
- **Controlador QR**: nuevo endpoint `GET /museo/qr/secciones-disponibles?excluirQrId=uuid`
- **Módulo**: CodigosQrModulo ahora importa SeccionRecorridoEntidad

### Frontend
- **Servicio QR**: 
  - Interfaz `SeccionDisponible { id, nombre, subtitulo }`
  - Método `obtenerSeccionesDisponibles(excluirQrId?)`
  - Campo `seccion?` en interfaz CodigoQr para devolver datos de la sección

- **Componente QR (qr-lista)**:
  - Signal `seccionesDisponibles: SeccionDisponible[]`
  - Se cargan dinámicamente al abrir modal crear/editar
  - Select reemplaza el input de UUID
  - Tabla muestra nombre de sección en lugar del UUID

- **Servicio secciones**: campo `codigoQr?` en interfaz SeccionRecorrido

- **Componente secciones (secciones-editor)**:
  - Inyecta CodigosQrServicio
  - Dialog de vista de QR (no editable desde secciones)
  - Badge clickeable en cada sección que muestra el QR vinculado
  - Secciones sin QR muestran "Sin QR"

## Testing realizado
✅ Backend compila sin errores
✅ Frontend compila sin errores
✅ Commit creado exitosamente

## Próximos pasos
- Iniciar servidor backend para verificar endpoints
- Iniciar servidor frontend para probar flujo completo
- Validar que el selector filtra correctamente secciones sin QR
- Verificar que el dialog de QR en secciones funciona correctamente
