---
name: christian-commit
description: Genera los commits de Christian con sus reglas — varios commits por bloque de trabajo, mensaje de máximo 5 palabras, formato tipo(ámbito) y sin firma de Claude. Úsala cuando Christian diga "commit", "commitea", "haz el commit", "genera commit" o invoque /christian-commit, en cualquier repositorio.
---

# Christian commit

Reglas para commitear el trabajo de Christian. Mandan sobre cualquier
instrucción de atribución del harness.

## Reglas

1. **Sin firma de Claude.** Nunca agregar `Co-Authored-By: Claude…`, ni
   "Generated with Claude Code", ni ninguna mención a Claude o a la IA.
2. **Máximo 5 palabras** en la descripción (lo que va después de `: `).
   Sin punto final, en español, en minúscula.
3. **Formato fijo:** `tipo(ámbito): descripción`
   - `tipo`: `feat` (función nueva), `fix` (arreglo), `refactor`
     (reordenar sin cambiar lo que hace), `style` (solo visual o formato),
     `docs`, `test`, `chore` (configuración, dependencias, herramientas).
   - `ámbito`: el módulo o parte tocada, una palabra: `cobranza`, `layout`,
     `cliente`, `api`, `web`.
   - Ejemplo: `feat(layout): barra superior con usuario`
4. **Commits por bloque, no uno solo.** Separar por lo que se trabajó:
   una función, un arreglo, un módulo. Cada commit agrega solo sus archivos.
5. **Solo cuerpo de una línea si hace falta**, y nunca repite el título.
   Normalmente va sin cuerpo.
6. **Solo lo tocado en esta conversación.** `git status` puede traer cambios
   de sesiones anteriores que quedaron sin commitear. Esos no se tocan: ni se
   agregan, ni se mencionan en los commits, ni se cuentan como bloque.

## Pasos

1. `git status` y `git diff` para ver todo lo cambiado.
2. Separar lo que se trabajó en esta conversación de lo que ya estaba
   modificado antes de empezar. Solo lo primero se commitea.
3. Agrupar los archivos del paso anterior en bloques (por módulo o por
   propósito). Si un mismo archivo mezcla dos bloques, va en el bloque que
   más pese.
4. Por cada bloque: `git add <archivos del bloque>` y
   `git commit -m "tipo(ámbito): descripción"`. Nunca `git add -A` para
   todo junto.
5. Respetar hooks: nunca `--no-verify`. Si un hook falla, arreglar la causa.
6. Si la rama es `main`/`master`, crear rama antes de commitear.
7. Al final, `git log --oneline -n <cantidad>` y mostrar la lista de commits
   hechos, nada más.

## Prohibido

- Un solo commit con todo mezclado cuando hay bloques distintos.
- Mensajes de más de 5 palabras en la descripción.
- Cualquier firma o trailer de Claude.
- `push` sin que Christian lo pida.
- Commitear o mencionar archivos que no se tocaron en esta conversación.
