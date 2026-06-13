---
name: Identidad del proyecto Viernes
description: Qué es Viernes, su propósito, estructura y flujos de operación
type: project
originSessionId: 83fd215f-2295-42fb-b4a6-2134c20e4c5e
---
Viernes es el wiki de memoria persistente de Christian Jara, nombrado como la IA de Tony Stark (FRIDAY). Vive en `C:\Users\Christian\Proyectos\Viernes\`.

**Arquitectura:**
- `CLAUDE.md` — esquema e instrucciones del sistema
- `raw/` — fuentes originales inmutables
- `wiki/` — markdown mantenido por el LLM
  - `index.md` — catálogo maestro
  - `log.md` — registro cronológico
  - `proyectos/`, `modelos-negocio/`, `tecnologias/`, `conceptos/`, `personas/`, `sintesis/`

**Why:** Christian quiere que Claude actúe como un aprendiz/pasante que absorbe todo su conocimiento: proyectos, decisiones, modelos de negocio, razonamientos. El wiki es el artefacto persistente que acumula ese conocimiento entre sesiones.

**How to apply:** En cada sesión, leer `wiki/index.md` primero para orientarse. Al aprender algo nuevo sobre proyectos o decisiones, actualizar las páginas relevantes y el log. Usar WikiLinks `[[página]]` para interconectar todo. Archivos en español, kebab-case.
