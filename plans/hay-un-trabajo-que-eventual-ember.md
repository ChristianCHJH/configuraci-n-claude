# Plan — Captura de visitas del catálogo (página y producto)

## Contexto

El catálogo público (Next.js 14 App Router, en `catalogo/`) consume los endpoints
públicos `/api/pub/:slug...` del backend NestJS y **hoy no registra ninguna visita**:
no hay Google Analytics, ni tracking propio, ni conteo en base de datos.

Christian necesita capturar y guardar **dos indicadores** con historial:

1. **Visitas a la página** del catálogo (por negocio/slug).
2. **Visitas a nivel de producto** (para luego saber el producto más visto).

Decisiones acordadas:
- **Captura:** beacon desde el navegador (componente cliente que dispara un POST al
  cargar). Evita el doble conteo / caché del SSR de Next.js y permite capturar
  user-agent y referer.
- **Conteo:** único por visitante/día (token de visitante persistente + dedup por
  día), conservando el log por evento para historial.
- **Alcance de esta entrega:** solo **capturar + guardar**. La lectura/reporte
  (totales, historial, producto más visto) y el dashboard Angular quedan para una
  fase posterior; los datos quedan listos en BD para consultarse.

---

## 1. Base de datos

### Nueva tabla `visita_catalogo` (log append-only de eventos)

Migración nueva `database/migrations/034-visitas-catalogo.sql` (idempotente, con
`IF NOT EXISTS`) **y** los mismos cambios en `database/setup-completo.sql`
(sin `IF NOT EXISTS`), actualizando la cabecera `-- Última actualización:`.

Columnas:
- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `negocio_id BIGINT NOT NULL REFERENCES negocio(id)`
- `slug VARCHAR(150) NOT NULL`
- `tipo VARCHAR(20) NOT NULL` — `'PAGINA'` | `'PRODUCTO'`
- `producto_id BIGINT REFERENCES producto(id)` — NULL cuando `tipo='PAGINA'`
- `visitante_token UUID NOT NULL` — identidad anónima persistente del navegador
- `dia DATE NOT NULL DEFAULT CURRENT_DATE` — clave de dedup por día
- `ip VARCHAR(45)`, `user_agent TEXT`, `referer TEXT`, `ruta VARCHAR(300)`
- Columnas de auditoría estándar del proyecto (`usuario_creacion`,
  `usuario_actualizacion`, `fecha_creacion`, `fecha_actualizacion`, `estado`,
  `eliminado`). Para visitas anónimas `usuario_creacion`/`usuario_actualizacion = 0`
  (sentinela "anónimo/sistema"). Se respeta la regla global de auditoría; `eliminado`
  habilita una purga lógica/rollup futuro.

Índices:
- **Único parcial de dedup** (corazón del "único por día"):
  `uq_visita_dia ON visita_catalogo (negocio_id, tipo, COALESCE(producto_id,0), visitante_token, dia)`.
- `idx_visita_negocio_dia ON (negocio_id, dia)` — para historial.
- `idx_visita_producto ON (producto_id) WHERE producto_id IS NOT NULL` — para ranking.

Notas de derivación (fase de lectura, no se construye ahora):
- Total página = `COUNT(*) WHERE tipo='PAGINA'`; historial = `GROUP BY dia`.
- Producto más visto = `GROUP BY producto_id COUNT(*) ORDER BY ... DESC`.

---

## 2. Backend NestJS — extender el módulo `publico`

Se reutiliza el módulo existente porque ya resuelve `slug → negocioId`
(`resolverNegocioId` en `backend/src/publico/publico.servicio.ts:247`) y ya expone
endpoints `@Publica()`.

Archivos nuevos:
- `backend/src/publico/entidades/visita-catalogo.entidad.ts` — modelo Sequelize de
  `visita_catalogo` (mismo patrón `@Table`/`@Column({ field: ... })` que
  `producto.entidad.ts`, con `field` snake_case).
- `backend/src/publico/dto/registrar-visita.dto.ts` — `tipo` (`@IsIn(['PAGINA','PRODUCTO'])`),
  `productoId?` (`@IsInt`, requerido lógicamente cuando `tipo='PRODUCTO'`),
  `visitanteToken` (`@IsUUID`), `ruta?`.

Cambios:
- `backend/src/publico/publico.modulo.ts` — registrar `VisitaCatalogo` en
  `SequelizeModule.forFeature([...])`.
- `backend/src/publico/publico.servicio.ts` — nuevo método
  `registrarVisita(slug, dto, meta)`:
  1. `resolverNegocioId(slug)` (reutilizado).
  2. Si `tipo='PRODUCTO'`: validar que el producto pertenece al negocio y es visible
     (mismo `where` de `obtenerProducto`); si no, `NotFoundException`.
  3. **Dedup idempotente** con `VisitaCatalogo.findOrCreate({ where: { negocioId, tipo,
     productoId: productoId ?? null, visitanteToken, dia: hoy }, defaults: { ip,
     userAgent, referer, ruta, usuarioCreacion: 0, usuarioActualizacion: 0 } })`.
     El índice único es el backstop si llegan dos beacons.
  4. Respuesta liviana (la envuelve el `RespuestaInterceptor`); no exponer datos.
- `backend/src/publico/publico.controlador.ts` — nuevo endpoint
  `@Post(':slug/visita') @Publica()`. Extraer `ip` (`@Ip()`), `user-agent` y
  `referer` de los headers vía `@Req()`. Devuelve `{ registrado: true }`.

Permisos: **no aplican en esta entrega** (la captura es pública/anónima; no hay
endpoints admin). Cuando se construya la fase de lectura se agregará la sección de
permisos (p. ej. `CATALOGO_VISITAS_VER`) según el `CLAUDE.md` del backend.

---

## 3. Frontend catálogo (Next.js) — beacon

Archivos nuevos:
- `catalogo/lib/visitas.ts`:
  - `obtenerVisitanteToken()` — lee/crea un UUID (`crypto.randomUUID()`) en
    `localStorage` (`adx_visitante`).
  - `yaContadoHoy(clave)` / `marcarContadoHoy(clave)` — dedup por día en
    `localStorage` con clave `adx_visita:{slug}:{tipo}:{id}:{YYYY-MM-DD}`.
  - `registrarVisita(slug, tipo, productoId?)` — si no fue contado hoy, hace
    `fetch(POST ${API}/pub/:slug/visita, { keepalive: true })` con
    `{ tipo, productoId, visitanteToken, ruta }`; marca contado al resolver.
    Errores se tragan en silencio (nunca romper el catálogo).
  - Reutiliza la base de URL de `catalogo/lib/api.ts` (`NEXT_PUBLIC_API_URL`).
- `catalogo/components/RegistroVisita.tsx` — componente cliente (`'use client'`) que
  en `useEffect` (una sola vez) llama a `registrarVisita`. Recibe props
  `slug`, `tipo`, `productoId?`. Guard contra doble disparo de React Strict Mode con
  un `ref`.

Montaje (los `page.tsx` son server components; se inserta el componente cliente):
- `catalogo/app/[slug]/page.tsx` → `<RegistroVisita slug={slug} tipo="PAGINA" />`.
- `catalogo/app/[slug]/producto/[id]/page.tsx` →
  `<RegistroVisita slug={slug} tipo="PRODUCTO" productoId={id} />`.

---

## 4. Verificación end-to-end

1. **BD:** aplicar `034-visitas-catalogo.sql` en una BD limpia y verificar la tabla e
   índices (`\d visita_catalogo`). Confirmar que `setup-completo.sql` crea lo mismo
   desde cero.
2. **Backend:** `npm run start:dev`. Probar el endpoint:
   `curl -X POST http://localhost:3200/api/pub/{slug}/visita -H "Content-Type: application/json" -d '{"tipo":"PAGINA","visitanteToken":"<uuid>"}'`
   → `exito: true`. Repetir mismo token/día → debe seguir habiendo **una sola** fila
   (dedup). Probar `tipo=PRODUCTO` con `productoId` válido e inválido (404).
3. **Catálogo:** `npm run dev` en `catalogo/`. Abrir `/{slug}` y `/{slug}/producto/{id}`;
   en la pestaña Network confirmar el POST `/visita`. Recargar la misma página el
   mismo día → no se inserta fila nueva (dedup en `localStorage`).
4. **Datos:** `SELECT tipo, COUNT(*) FROM visita_catalogo GROUP BY tipo;` y
   `SELECT producto_id, COUNT(*) FROM visita_catalogo WHERE tipo='PRODUCTO' GROUP BY producto_id ORDER BY 2 DESC;`
   confirman que los dos indicadores quedan consultables.

---

## Tests recomendados

### Unit tests (Jest — backend)
- [ ] `registrarVisita()` crea fila nueva para token/día no visto — `backend/src/publico/publico.servicio.spec.ts`
- [ ] `registrarVisita()` NO duplica con el mismo token/tipo/producto/día (findOrCreate) — `backend/src/publico/publico.servicio.spec.ts`
- [ ] `registrarVisita()` con `tipo='PRODUCTO'` y producto ajeno/inexistente lanza `NotFoundException` — `backend/src/publico/publico.servicio.spec.ts`
- [ ] `registrarVisita()` con slug inválido lanza `NotFoundException` — `backend/src/publico/publico.servicio.spec.ts`
- [ ] POST `/pub/:slug/visita` es público (sin JWT) y responde `{ registrado: true }` — `backend/src/publico/publico.controlador.spec.ts`

### Frontend (catálogo Next.js — solo si hay runner Jest configurado; si no, manual)
- [ ] `obtenerVisitanteToken()` persiste el mismo UUID entre llamadas — `catalogo/lib/visitas.test.ts`
- [ ] `registrarVisita()` no vuelve a postear si `yaContadoHoy` es true — `catalogo/lib/visitas.test.ts`

> E2E omitido: esta entrega no agrega UI visible (solo captura en segundo plano).
