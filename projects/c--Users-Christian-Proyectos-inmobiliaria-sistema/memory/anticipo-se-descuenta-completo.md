---
name: anticipo-se-descuenta-completo
description: "En la boleta final, cada boleta de anticipo elegida se descuenta por su monto exacto; no se usa parcialmente"
metadata:
  node_type: memory
  type: project
  originSessionId: 427a13b6-86d9-47cf-af84-7fbd07380a53
  modified: 2026-10-10T03:31:05.622Z
---

Decidido el 2026-10-09: al emitir la boleta de entrega del lote, cada boleta de anticipo seleccionada se descuenta completa (si es de S/ 1,000, descuenta S/ 1,000). No habrá descuento parcial de un anticipo.

**Why:** SUNAT y MiFact sí aceptan usar un anticipo a medias (probado en demo: B001-00000041 repartida en B001-00000042 y -43), pero Christian no quiere esa complejidad.

**How to apply:** en la pantalla y el caso de uso de anticipos, nada de campo «usar» por boleta; el saldo es todo o nada. Los pagos tampoco llevan monto escrito a mano: lo aplicado sale de lo que el pago imputó a cada cuota (así un pago de dos cuotas se reparte en dos boletas sin input). Prototipo: https://claude.ai/artifact/SiySvkCX1BVNiuPDzmhzjN

Decisiones del 2026-10-09 para construir la emisión: separación y cuota inicial también salen como boletas de anticipo y la boleta final las descuenta; varios pagos → una boleta es obligatorio; los anticipos citados deben ser de la misma razón social (bloqueo); mezclar boleta y factura en un contrato no bloquea; contratos históricos van al final y se detectan las cuotas sin comprobante en el sistema; terreno = inafecto (la afectación sale del concepto, ADR-077 §3.5).
