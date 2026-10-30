---
name: convencion-de-colindancias
description: "Cómo se definen frente, fondo, derecha e izquierda de un lote para lote_colindancia; decidido por Christian el 2026-10-25."
metadata:
  node_type: memory
  type: project
  originSessionId: 5178f722-7f03-400d-bc06-816af8c03f37
  modified: 2026-10-25T21:49:51.845Z
---

Regla dada por Christian el 2026-10-25 (no estaba en ningún ADR ni documento):

- **Derecha / izquierda: mirando desde la calle.** Parado en la calle, de frente al lote, la derecha del observador es la derecha del lote.
- **Lote en esquina** (dos o más lados a la calle): el **frente es el lado más corto** de los que dan a la calle.
- Fondo: el lado opuesto al frente.

**Why:** los contratos piden las cuatro colindancias (`lote_colindancia`: FRENTE, FONDO, DERECHA, IZQUIERDA) y el sistema no tenía convención escrita.

**How to apply:** usarla en cualquier extracción automática de colindancias desde planos (PDF o DXF). Lo que no encaje (sin lado a la calle, lados quebrados) se marca para revisión, no se decide. Relacionado: [[nada-de-reglas-de-negocio-inventadas]].
