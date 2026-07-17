---
name: no-bulk-perl-sed-edits
description: No editar código fuente con perl/sed masivo; usar Edit tool (o delegar a subagente que use Edit).
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 33f22abc-512a-403c-8744-9e8e208e19ab
---

Christian rechazó un comando `perl -i` que aplicaba `@ApiBearerAuth` a 18 controladores de golpe.

**Why:** prefiere ediciones de código trazables y revisables, no reemplazos masivos con perl/sed que no se ven en el diff antes de aplicarse. Alinea con la regla de napkin de preferir tools dedicados sobre sed/grep/echo.

**How to apply:** para cambios mecánicos multi-archivo en código, usar el tool Edit archivo por archivo, o delegar a un subagente (general-purpose/builder) con instrucción explícita de usar Read+Edit y verificar con `npm run build`. Nunca `perl -i`/`sed -i` masivo sobre `src/`.
