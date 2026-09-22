---
name: commits-unimar-tms
description: Cómo quiere Christian los commits en unimar_tms: nombre de máximo 5 palabras, sin firma, y uno por tema
metadata:
  type: feedback
---

En unimar_tms los commits van con un mensaje de **máximo 5 palabras**, **sin** la línea
`Co-Authored-By`, y separados **uno por tema** aunque el árbol tenga muchos archivos sueltos.

**Why:** Christian revisa el historial por asunto, no por archivo; un commit que agrupa tres temas
bajo un nombre que describe uno solo le esconde dos. La firma le ensucia el log.

**How to apply:** antes de commitear, agrupar por tema y proponerle la lista de commits para que la
confirme — la regla de [[CLAUDE.md]] del proyecto exige pedir confirmación aunque él ya lo haya
pedido. Nunca hacer push. Ver [[wikis-commit-si-push-no]].
