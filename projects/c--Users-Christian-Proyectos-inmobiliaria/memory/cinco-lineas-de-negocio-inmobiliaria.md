---
name: cinco-lineas-de-negocio-inmobiliaria
description: "La inmobiliaria no vende solo lotes; los documentos históricos muestran membresías de club, titulación, contratos de inversión y servicios de terceros"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4218f190-da58-461c-9992-af4a1aafbd91
  modified: 2026-09-10T15:48:04.193Z
---

Al leer los 5098 documentos históricos (10-set-2026) aparecieron cinco productos, no uno:

1. **Compraventa de lote** (575 contratos). A veces como lote, a veces como acciones y derechos
   sobre el predio matriz, sin independización registral.
2. **Membresía del club resort Buenavista** (30 contratos), en preventa dentro del Mirador.
   Modalidades ESTÁNDAR S/2000 y PERMANENTE VIP S/5000, al contado y no reembolsables. Reparten
   utilidades: 30% entre los primeros 1000 afiliados estándar, 10% entre 100 VIP. Cubren al
   titular, cónyuge e hijos hasta los 18. Heredables una sola vez y vendibles con aprobación.
   Queda pendiente una cuota anual de mantenimiento sin importe fijado.
3. **Servicio de titulación** (19 contratos, ~S/98 000). Se cobra después de cancelar el lote.
   **Este servicio sí paga IGV**: hay 3093 boletas inafectas (venta de lote) contra 120 gravadas.
4. **Contrato de inversión y comercialización** (8). El asesor recibe lotes al por mayor, los
   revende con margen propio, y **paga parte del precio aplicando sus comisiones**. Los
   compradores finales pagan a la inmobiliaria y ese dinero baja el saldo del asesor.
5. **Servicios de terceros** (10 recibos por honorarios de asesores y personal).

Además: 38 boletas en dólares y solo 4 anotan el tipo de cambio; hay donaciones de lote a título
gratuito; hay clientes con carné de extranjería en vez de DNI; y los pagos se trasladan entre
lotes y entre proyectos.

**Why:** el modelo de datos que estamos construyendo asume una sola línea de negocio. Si el
sistema solo sabe de lotes, no puede registrar una membresía, ni una comisión usada como medio de
pago, ni un cobro en dólares, ni un titular sin DNI.

**How to apply:** antes de cerrar el modelo de cobros, comprobar que soporta moneda con tipo de
cambio, conceptos gravados y no gravados en la misma serie, y productos que no son lotes. Antes de
cerrar el modelo de cliente, aceptar carné de extranjería y RUC además de DNI. Todo está detallado
en `documentos-inmobiliaria/_analisis/HALLAZGOS.md`. Ver [[recuperacion-datos-historicos]] y
[[nada-de-reglas-de-negocio-inventadas]].
