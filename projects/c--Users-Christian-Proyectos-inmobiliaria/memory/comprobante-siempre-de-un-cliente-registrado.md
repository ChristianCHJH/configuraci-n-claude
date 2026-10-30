---
name: comprobante-siempre-de-un-cliente-registrado
description: "Todo comprobante tiene un cliente titular registrado y, si es factura a otro RUC, un receptor escrito al emitir; el cruce con depósitos va por el titular."
metadata:
  node_type: memory
  type: project
  originSessionId: a8c72954-1ebd-47cc-b988-a8cba94e6d74
  modified: 2026-10-26T03:49:03.592Z
---

Reglas de Christian (25/10/2026):
- **Todo comprobante tiene un cliente titular registrado.** Con él se cruza el comprobante con los depósitos (tabla `pago`): los depósitos que se vinculan deben ser del mismo titular.
- **Receptor distinto del titular** (persona natural que pide factura con su RUC 10 o con el RUC de su empresa): el RUC, la razón social y el domicilio fiscal se escriben al emitir y se guardan solo en el comprobante (`receptor_*`). **No** se registra otra ficha. Una empresa que viene sola sí se registra como cliente jurídico.
- Ante SUNAT y MiFact el comprobante tiene **un solo** receptor (`NUM_NIF_RECP`). El titular se puede imprimir como observación (`datos_adicionales`, códigos 05-08, an..150, según el Excel de github.com/mifact/apijson).
- El domicilio fiscal es obligatorio en la ficha del cliente jurídico (al crear y al editar) y en el receptor escrito a mano. Si un jurídico ya cargado no lo tiene, al emitirle factura se pide y **se guarda en su ficha**, para no volver a pedirlo.
- **Comprobante libre:** sin contrato ni separación, con líneas escritas a mano, en soles o en dólares. Puede quedar sin depósito; se vincula después.
- El reintento y la nota de crédito usan el receptor guardado en el comprobante, no la ficha.
- Vocabulario: el «depósito» de Christian es la tabla `pago`; su «pago» es el concepto o la cuota; `voucher` es solo la imagen.

**Why:** sin el titular en el comprobante no hay forma de cruzarlo después con los depósitos del cliente.
**How to apply:** ningún diseño de emisión sin `cliente_id` del titular. Relacionado: [[mifact-por-entorno]], [[dos-repos-docs-y-sistema]], [[carga-inicial-no-se-rellena]].
