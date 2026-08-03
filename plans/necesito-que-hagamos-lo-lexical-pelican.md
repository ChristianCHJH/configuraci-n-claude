# Demo HORIZONTE — convertir a HTML autónomo y bajar a mínimo viable

## Contexto

`PROP_DESING/` tiene 7 archivos `.dc.html` (581 KB, 6.393 líneas) generados con Claude Design. Dos problemas:

1. **No abren.** Los 7 referencian `<script src="./support.js">` y ese archivo no existe en la carpeta ni en el repo. Hoy, con doble clic, se ve el HTML crudo: `{{ pendientesBadge }}` literal en pantalla, los 4 tabs de Cobranzas apilados a la vez, cero interactividad.
2. **Están saturados.** El inventario da 22 pantallas, ~40 KPI numéricos, 14 tablas, 6 modales y 3 asistentes. Claude Design construyó de más: hay ~30 funcionalidades que no están en `proforma-cliente.md` (log de auditoría, semáforo de mora de 4 niveles, árbol de carpetas de expedientes, comparativo "ahorro 28 horas", reenvío automático a las 48 h, croquis de colindancias, línea de tiempo con "Titulado" —que está fuera del alcance vendido—, etc.).

Esto es una demo comercial para una venta de **S/ 17 500 en 13 semanas** que internamente ya arrastra un déficit de 295 h (`alcance_negocio.md`, bloque 19). Cada funcionalidad que el cliente ve en la demo es una funcionalidad que después exige. Bajar el prototipo a lo comprometido no es cosmético: es control de alcance.

**Objetivo:** carpeta `demo/` con 8 HTML autocontenidos que abren con doble clic sin internet, mostrando exactamente lo que dice la proforma —ni más, ni menos— y con la sensación de "entiendo qué estoy viendo".

**Decisiones tomadas:** las 7 pantallas actuales + una nueva de Reportes · carpeta `demo/` nueva (`PROP_DESING/` queda intacto como origen) · "Emisión automática" se queda pero simplificada · el Plano conserva sus 4 modos de coloreado (decisión del usuario; es la pantalla que gana la reunión).

---

## Parte 1 — El runtime (habilita todo lo demás)

Los `.dc.html` son plantillas de un framework propietario. Hay que reimplementar la parte que usan, que es chica y está bien acotada: **~250 líneas de JS**, escritas una vez y pegadas inline en cada archivo (nada de `support.js` hermano: un archivo = una demo que se manda por correo).

Superficie real a cubrir, medida sobre los 7 archivos:

| Pieza | Usos | Qué hacer |
|---|---|---|
| `<x-dc>` | 7 | Desaparece; su contenido es el `<body>` |
| `<helmet>` | 7 | Se funde en `<head>`; su `<meta viewport>` **reemplaza** al del head (hoy nunca se aplica — bug preexistente) |
| `<sc-if value="{{ x }}">` | 84 | Truthiness del path resuelto. Ignorar `hint-placeholder-val` |
| `<sc-for list="{{ xs }}" as="i">` | 33 | Clonar hijos con cadena de scope. Ignorar `hint-placeholder-count` |
| `{{ path }}` | ~600 | **Trivial**: el 100 % son `ident` o `ident.prop`. Cero operadores, ternarios o llamadas. Soportar interpolación parcial dentro de `style="…"` |
| `onClick`/`onChange`/`onInput`/`onMouseMove`/`onMouseLeave`/`onKeyDown` | 166 | `addEventListener`. `e.currentTarget` debe ser el elemento con el handler (los handlers leen `data-*` de ahí) |
| `ref="{{ fn }}"` | 5 (solo Horizonte) | Invocar `fn(el)` tras montar y en cada re-render |
| `style-hover="…"` | 213 | Generar una clase por valor y emitir `.hN:hover{…}` en un `<style>` |
| `readOnly` / `defaultChecked` | 4 | → `readonly` / `checked` |

Más `class DCLogic` con: `props` (desde los `default` de `data-props`, con override por query string), `state`, `setState(obj|fn, callback?)`, `forceUpdate()`, `componentDidMount/DidUpdate/WillUnmount`, y un ciclo de re-render que reejecuta `renderVals()`.

### Dos trampas concretas

**1. Foster parenting.** Hay `<sc-for>` dentro de `<tbody>` en 5 sitios ([Cobranzas.dc.html:463](PROP_DESING/Cobranzas.dc.html#L463), `:599`, `:711`, `07-portal-cliente.dc.html:253`, `Comprobantes.dc.html:271`). El parser HTML saca los tags desconocidos fuera de la tabla y deja el árbol destrozado justo en el cronograma, la imputación y la morosidad.
→ **Solución**: al convertir, envolver la plantilla en `<script type="text/x-template">`. El parser no la toca; el runtime lee `.textContent` y la parsea con `DOMParser`. Elimina el problema de raíz en vez de esquivarlo.

**2. Pérdida de foco al tipear.** `setComentario = e => this.setState({ comentario: e.target.value })` dispara un rebuild completo por cada tecla. Sin mitigación, el textarea del modal de rechazo pierde el cursor letra por letra.
→ **Solución**: preservar `activeElement` (por path del nodo), `selectionStart/End` y el `scrollTop` de los contenedores con scroll a través del re-render.

**Lo que NO hay que hacer** (buena noticia): cero dependencias externas ya hoy. Sin CDN, sin Google Fonts, sin `<img>`, sin `@import`, sin `url()` remoto. Los 227 SVG son inline. Solo falta el runtime.

El pan/zoom del plano usa `addEventListener` nativo sobre el `<svg>` y muta `_g.setAttribute('transform', …)` **sin** `setState` — no dispara re-render, así que no hay riesgo de jank. `componentDidUpdate() { this.aplicar(); }` ya reaplica la vista tras cada rebuild.

---

## Parte 2 — Los recortes

### 2.1 Cobranzas · Estado de cuenta — el arreglo principal

Es la pantalla que disparó el pedido. El diagnóstico real: **no hay ningún selector de cliente en la pestaña**. Al pulsarla se abre directo el expediente de María Elena Quispe, sin encabezado que diga de quién es, y lo primero que se ve son cuatro cifras grandes sobre un lote. Por eso "no sé qué estoy viendo".

Rediseño:

1. **Barra de cliente arriba de todo**: `Estado de cuenta — Cliente: [María Elena Quispe Huamán ▾] [Cambiar cliente]`. Que se vea de dónde salió.
2. **Título explícito**: `Estado de cuenta de María Elena Quispe Huamán`.
3. **Ficha del cliente**: 8 datos → 5 (Documento, Teléfono, Proyecto y lote, Contrato, Asesor). Fuera Correo y "Día de vencimiento" (ya está en el cronograma).
4. **KPI: 4 → 3**, en castellano llano:
   - `Precio del lote` S/ 38 540.00 — *Inicial S/ 7 700 + 24 cuotas de S/ 1 285*
   - `Ya pagó` S/ 19 265.00 — *Inicial + 9 cuotas*
   - `Le falta pagar` S/ 19 275.00 — *15 cuotas*
   La cuarta tarjeta se convierte en **una línea de acción** debajo: `Próxima cuota: S/ 1 285.00 · vence el 15/08/2026 (en 12 días)` + botón `Registrar pago`.
5. **Fuera** la tarjeta "Avance de pago del contrato" (barra con 3 marcas): duplica el cronograma y encima traía el 50 % mal calculado.
6. **Consolidado de ambas empresas**: de 3 columnas × 5 filas a una franja de 3 líneas, y **debajo** del cronograma, no encima. Sigue cumpliendo "vista consolidada de ambas razones sociales" sin robarse la pantalla:
   `Terreno · Horizonte S.A.C. → S/ 19 275.00` / `Titulación · Horizonte Titulación → S/ 2 800.00 (aún no facturado)` / **`Total que debe al grupo → S/ 22 075.00`**
7. **Cronograma: 10 columnas → 6.** `N.º · Concepto · Vencimiento · Monto · Comprobante · Estado`. Fuera `Fecha de pago`, `Medio`, `N.º operación`, `Expediente`.

### 2.2 Arreglar las cifras (están mal, no solo saturadas)

En una sola pantalla conviven `S/ 38 500`, `24 cuotas`, `25 vencimientos`, `7 700 + 9 × 1 285` y "50 % cancelado" — y no cuadran: 7 700 + 9 × 1 285 = **19 265**, no 19 225; y 38 500 − 7 700 = 30 800 ≠ 24 × 1 285. Si el cliente saca la calculadora en la reunión, se cae la demo.

Juego consistente (mínimo cambio, deja intacto el S/ 1 285 que aparece en el portal, el push, el voucher y la boleta B001-004521):

| | |
|---|---|
| Precio del lote | **S/ 38 540.00** |
| Cuota inicial | **S/ 7 700.00** *(se quita el "20 %" — 7 700 no es el 20 % de 38 540)* |
| 24 cuotas de | **S/ 1 285.00** → 30 840.00 |
| Pagado (inicial + 9) | **S/ 19 265.00** |
| Saldo (15 cuotas) | **S/ 19 275.00** |
| Suma | 19 265 + 19 275 = **38 540** ✓ · avance = **50.0 %** ✓ |

Cambios a propagar: `38,500`→`38,540` y `19,225`→`19,265` en Cobranzas, [07-portal-cliente.dc.html](PROP_DESING/07-portal-cliente.dc.html) (Mi cuenta y Mis pagos) y la ficha de lote del plano. Quitar "Inicial 20 %" y unificar "24 cuotas" vs "25 vencimientos" → *"cuota inicial + 24 cuotas"*.

El contrato de Ventas (Segundo Ramos, S/ 42 300 · inicial 8 460 · 24 × 1 410 = 33 840) **ya cuadra**. No tocar.

### 2.3 Sacar la jerga contable

"Imputar" no lo entiende nadie fuera de contabilidad. Reemplazos literales:

| Hoy | Queda |
|---|---|
| Botón `Guardar pago e imputar` | **`Registrar pago`** |
| Tarjeta `Imputación automática` | **`A qué cuotas se aplica el pago`** |
| `Monto a imputar` | **`Monto recibido`** |
| `Imputado por el cliente a` | **`El cliente indicó que paga la`** |
| `Se imputa el pago a la cuota 10 de 24` | **`El pago se aplica a la cuota 10 de 24`** |
| `Imputar el pago a las cuotas 10 a 11…` | **`Aplicar el pago a las cuotas 10 y 11 del contrato CT-2025-0418.`** |
| Cláusula SÉTIMA: `…se imputa a la cuota inicial` | **`…se aplica a la cuota inicial`** |

Se conserva el subtítulo *"El monto se aplica de la cuota más antigua a la más nueva"*: explica la regla sin nombrarla.

### 2.4 Recortes por pantalla

**`00-index`** — sin cambios. Es lo menos saturado y las 7 tarjetas con su "dolor que reemplaza" son buen material de venta. Solo se suma la tarjeta 08 · Reportes.

**`Horizonte` · Tablero** — se van: gráfico de barras de 6 meses, tabla "Cuotas que vencen esta semana", panel "Actividad reciente" (log de auditoría), meta de cobranza editable, campana con badge 7.
Quedan: los 4 KPI (que son 4 de los 5 reportes comprometidos), "Vouchers por validar" (la entrada al trabajo del día) y "Avance de venta por proyecto" (= reporte 3, disponibilidad por proyecto).

**`Horizonte` · Plano** — **los 4 modos de "Colorear por" se quedan** (decisión del usuario). Se van solo: `Dividir lote` y `Marcar área común` del modo edición, y la categoría "Inversionista (10 lotes o más)". La ficha lateral del lote baja su "Resumen de cobranza" de 5 líneas a 3.

**`Ventas`** —
- *Lotes disponibles*: fuera columnas `Frente × fondo` y `Precio m²`; filtros de 4 → 2 (Proyecto + Buscar).
- *Separación*: fuera el bloque **Colindancias** (4 filas) y el **croquis de ubicación** con cotas. Es el recorte más grande del archivo.
- *Contrato*: fuera la alerta "Requiere autorización de un administrador" (flujo de aprobación que no se vendió). Se conserva la vista previa del contrato en vivo — es un momento fuerte y visualmente lee como documento, no como saturación.
- *Cronograma*: fuera la **línea de tiempo del lote** (6 hitos, incluye "Titulado", que está fuera del alcance). Franja de 6 KPI → 4.

**`Cobranzas`** — además de 2.1:
- *Bandeja*: la constancia BBVA falsa pasa a miniatura (se conserva "Ver en tamaño real"); fuera el código de barras dibujado.
- *Modal rechazar*: 5 motivos → 3 (ilegible / el monto no coincide / otro).
- *Modal recordatorio*: se conservan las **2 vías** (push + WhatsApp, ambas comprometidas); fuera el aviso de reenvío a las 48 h con escalamiento al asesor, y "Adjuntar estado de cuenta".
- *Registrar pago*: fuera `Reasignar a mano` y `Saldo a favor del cliente`. Se conserva la tarjeta "Al guardar, el sistema hará" (3 pasos) — es la propuesta de valor.
- *Morosidad*: 4 KPI → 2 (clientes en mora, monto adeudado); fuera "Con más de 3 cuotas / resolución de contrato" y "Promedio de atraso"; semáforo de 4 niveles → 3 rangos; fuera `Recordar a los 37` (envío masivo); tabla pierde `Contacto` y `Semáforo` (se fusiona en `Días`).

**`Comprobantes`** —
- *Lista*: fuera `Exportar a Excel`, `Descargar XML del mes` y la descarga individual de XML; filtros 4 → 2 (razón social + tipo). Se conservan los 4 KPI, el desglose por razón social (= reporte 5) y la alerta de rechazo SUNAT (comprometida).
- *Emisión automática*: se conservan los **5 pasos animados** y la **vista previa de la boleta A4**. Fuera el comparativo "antes 6 pasos / ahora 1 clic" y el cálculo "ahorro 4.9 min × 342 = 28 horas".
- *Expedientes*: fuera el árbol de carpetas Proyecto·Cliente·Año, el "3.2 GB · respaldo diario" y `Descargar selección`. Quedan buscador + grid + visor. El visor se queda con sus 2 piezas reales (comprobante + voucher), sin el QR generado por algoritmo ni el hash.
- Corregir *"Probá con el nombre del cliente…"* → **"Pruebe con…"** (voseo rioplatense colado en una demo peruana).

**`06-movil-asesor`** — es el archivo más limpio. Solo: leyenda del mini-plano de 7 estados → 5, y la barra inferior de 5 pestañas → 3 (`Inicio`, `Plano`, `Documentos`); hoy `Clientes` y `Perfil` no llevan a nada.

**`07-portal-cliente`** —
- *Mi cuenta*: fuera las 3 tarjetas `Precio del lote / Monto pagado / Saldo pendiente` — repiten exactamente las cifras de la barra de avance que está justo encima.
- *Mis pagos*: el bloque "Vouchers enviados" con línea de tiempo de 3 hitos baja a **dos chips compactos** (`En validación` / `Rechazado · el monto no coincide` + `Enviar de nuevo`). Sigue cumpliendo "el cliente ve el estado" sin la maqueta de timeline.
- *Asistente de voucher*: fuera "Es un pago adelantado" y el chip de OCR "Se lee el monto y la operación" (el OCR está **explícitamente excluido** en el punto 9 de la proforma — mostrarlo es venderlo).

### 2.5 Pantalla nueva: `05-reportes.html`

Los 5 reportes comprometidos, deliberadamente simple: una fila de filtros común (rango de fechas + razón social + proyecto), 5 pestañas, y en cada una una tabla y un botón `Exportar`. Sin KPI, sin gráficos, sin cruces.

`Cobranza del mes` · `Clientes en mora` · `Disponibilidad de lotes por proyecto` · `Ventas por asesor` · `Comprobantes emitidos por razón social`

Nota al pie de "Ventas por asesor": *"El cálculo de comisiones no forma parte de este alcance."*

### 2.6 Ítems de menú muertos

`Proyectos y lotes`, `Clientes`, `Configuración` quedan en gris, sin `cursor:pointer` y sin destino. `Expedientes` enlaza a la pestaña de Comprobantes. `Reportes` ya tiene pantalla. Un ítem que no lleva a ningún lado durante la demo es peor que un ítem que se ve deshabilitado.

---

## Archivos

**Se crean** (`demo/`, 8 archivos autocontenidos):

```
demo/00-index.html          ← de 00-index.dc.html (+ tarjeta 08)
demo/01-horizonte.html      ← de Horizonte.dc.html (?pantalla=login|tablero|plano)
demo/02-ventas.html         ← de Ventas.dc.html
demo/03-cobranzas.html      ← de Cobranzas.dc.html
demo/04-comprobantes.html   ← de Comprobantes.dc.html
demo/05-reportes.html       ← nuevo
demo/06-movil-asesor.html   ← de 06-movil-asesor.dc.html
demo/07-portal-cliente.html ← de 07-portal-cliente.dc.html
```

Los enlaces del índice pasan a `01-horizonte.html?pantalla=tablero`. El query string **sí funciona bajo `file://`** en Chrome/Edge/Firefox; el lector de URL ya existe en [Horizonte.dc.html:1004](PROP_DESING/Horizonte.dc.html#L1004) y no hay que tocarlo.

**No se toca**: `PROP_DESING/` (queda como origen), ni `proforma-cliente.md`, ni `alcance_negocio.md`, ni `prompts-prototipo.md`.

**Orden de trabajo**: runtime primero, validado contra `00-index.html` (el más chico, 172 líneas) → después `03-cobranzas.html` (donde están los `sc-for` en tabla y el arreglo grande) → `01-horizonte.html` (el 60 % del riesgo: refs, pan/zoom, arrastre de vértices) → el resto → `05-reportes.html` al final.

---

## Verificación

Playwright no puede con el protocolo `file:`, así que la verificación tiene dos pasos:

**1. Con servidor, para poder automatizar**
```
python -m http.server 8080 --directory demo
```
Y sobre `http://localhost:8080/00-index.html` recorrer las 8 pantallas con Playwright, revisando en cada una:
- Cero `{{` y cero `<sc-` en el DOM renderizado
- Un solo tab visible por pantalla (si se ven los 4 de Cobranzas apilados, el `sc-if` falló)
- Consola sin errores
- Las tablas de cronograma / imputación / morosidad tienen filas dentro del `<tbody>` (prueba del foster parenting)
- Screenshot de cada pantalla para revisar la saturación a ojo

**2. Con doble clic, que es como se va a usar en la reunión**
Abrir `demo/00-index.html` directamente desde el explorador, **con el wifi apagado**, y comprobar a mano:
- Navegación entre las 8 pantallas y vuelta al índice
- Plano: rueda del mouse hace zoom, arrastre hace pan, clic en un lote abre la ficha, los 4 modos de "Colorear por" repintan, `Ir al lote` con `B-14` centra, `Modo edición` muestra los vértices
- Cobranzas: cambio de pestaña, `Validar` abre el modal, `Confirmar` saca el voucher de la bandeja y baja el badge de 5 a 4
- Modal de rechazo: **escribir en el textarea sin perder el cursor** (regresión del re-render)
- Comprobantes: `Simular` corre los 5 pasos animados
- Hover: los botones cambian de color (prueba de `style-hover`)
- Portal cliente: el asistente de voucher avanza los 3 pasos

**3. Grep de control sobre `demo/`** — no debe aparecer ninguno:
`imputar` · `38,500` · `19,225` · `Actividad reciente` · `Colindancias` · `Promedio de atraso` · `Recordar a los 37` · `3.2 GB` · `Probá` · `Es un pago adelantado` · `Descargar XML` · `28 horas`

**4. Contraste final contra la proforma** — recorrer el punto 2 de `proforma-cliente.md` (2.2 a 2.14) y confirmar que cada cosa que la demo muestra está ahí, y que nada de la lista de exclusiones del punto 9 (OCR de DNI, offline, conexión con el banco, titulación, App Store, WhatsApp masivo) aparece en pantalla.
