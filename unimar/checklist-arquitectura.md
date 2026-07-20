# Checklist de Arquitectura Unimar — gate ADR (universal)

> El orquestador `/unimar-dev` corre esta lista entre fases. Cualquier `NO` detiene el avance:
> se devuelve a la fase responsable con el hallazgo, o se escala al humano.
> Derivado de los ADRs de `unimar_arch` (ver `contexto-canonico.md`). Aplica al perfil del runtime
> del proyecto; los ítems de frontend siguen el stack declarado en `<proyecto>-decisiones-tecnicas`.

## Gate tras ANÁLISIS (unimar-analista)

- [ ] Cada tabla nueva: `id BIGINT GENERATED ALWAYS AS IDENTITY` (no serial/AutoIncrement)
- [ ] Cada tabla: 6 columnas de auditoría (usuario/fecha creación+actualización, estado, eliminado)
- [ ] Datos operacionales por sucursal incluyen `sucursal_id`
- [ ] Nombres en español, snake_case, singular
- [ ] Endpoints con método, ruta, DTO entrada/salida y envelope estándar
- [ ] Mapeo a capas hexagonales explícito (domain/application/infrastructure/api)
- [ ] Integraciones externas modeladas como puertos (no llamadas directas)
- [ ] Casos de error expresados como `Result` (no excepciones)
- [ ] Nada ambiguo sin resolver; si lo hay, está en preguntas-abiertas y se preguntó

## Gate tras BACKEND (unimar-backend)

- [ ] Entidad de dominio separada del modelo de persistencia
- [ ] Acceso a datos solo vía repositorio inyectado (NO Active Record)
- [ ] Ningún `throw` para control de flujo; se devuelve `Result` (neverthrow)
- [ ] DTOs con class-validator; controladores/DTOs con decoradores Swagger
- [ ] Migración como archivo TS (no SQL suelto; no synchronize)
- [ ] Soft delete: marca `eliminado=true`, nunca DELETE físico
- [ ] Respuesta HTTP con envelope estándar (Transform + ExceptionFilter)
- [ ] Lenguaje estricto, sin `any`
- [ ] Auth: usa el mecanismo declarado por el proyecto (puerto inyectable si aún no hay auth real)

## Gate tras PRUEBAS (unimar-tester)

- [ ] Unit con mocks/stubs según ADR-0052
- [ ] Integración/E2E con Testcontainers (BD efímera real, ADR-0053)
- [ ] Todos los escenarios de la historia tienen prueba
- [ ] Suite en verde; fallos corregidos por el agente, no silenciados

## Gate tras FRONTEND (unimar-frontend)

- [ ] Stack frontend = el declarado en `<proyecto>-decisiones-tecnicas`
- [ ] Tokens del sistema de diseño (DESIGN.md/json) respetados; diseño atómico/reutilizable
- [ ] Se usaron las skills /ui-ux-pro-max e /impeccable
- [ ] Consume el envelope estándar (sin unwrap manual de data)
- [ ] Accesibilidad y densidad de datos apropiadas para sistema empresarial

## Gate tras DOCUMENTACIÓN (unimar-documentador)

- [ ] Manual de usuario con capturas reales (app levantada; Playwright)
- [ ] Doc técnica/funcional en español, kebab-case, sin BOM/CRLF
- [ ] Entregable de revisión generado (resumen, manual, checklist pruebas, qué se construyó)

## Gate de AUDITORÍA (unimar-auditor) y CIERRE (orquestador)

- [ ] Auditoría de cumplimiento `unimar_arch` pasada; mejoras propuestas preguntadas y resueltas
- [ ] Rama `feature/<ID>-<slug>` con commits en español
- [ ] Baúl `<proyecto>-*` actualizado + entrada en log.md + index.md
- [ ] Historia movida en GitHub Projects + Estado actualizado en el artefacto de la historia
- [ ] Entregable presentado al humano; no se inicia la siguiente historia sin su OK
