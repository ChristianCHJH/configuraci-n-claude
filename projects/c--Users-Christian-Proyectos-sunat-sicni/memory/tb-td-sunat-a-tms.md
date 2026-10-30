---
name: tb-td-sunat-a-tms
description: Equivalencia de fechas TB/TD entre la consulta de manifiestos de SUNAT y el TMS de Unimar
metadata:
  node_type: memory
  type: project
  originSessionId: c6251cb6-a88a-441f-931b-2f55a211eeee
  modified: 2026-10-19T18:57:04.600Z
---

Concepto de negocio confirmado por Christian (2026-10-19):
- TB en el TMS = inicio de descarga ← SUNAT «Fecha de Llegada» (consulta de manifiesto marítimo, Aduanet).
- TD en el TMS = término de descarga ← SUNAT «Fecha de Descarga».

En el TMS viven en `dbo.nave_viaje.tb` / `td` (DATETIMEOFFSET), junto a `manifiesto` y `anio`. Los textos de `modules/naves/api/dto/fechas-reales.dto.ts` dicen «atraque/desatraque»: están desactualizados frente a este concepto.

**Why:** el job `automatizador-tb-td-sunat` (repo unimar-automatizadores) actualiza estas fechas; de TB/TD dependen los plazos de las RD.
**How to apply:** mapear siempre Fecha de Llegada→tb y Fecha de Descarga→td; no interpretar TB/TD como atraque/desatraque.
