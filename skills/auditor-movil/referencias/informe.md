# Formato de entrega del informe

Escribe el informe en `AUDITORIA-MOVIL.md`, dentro de la raíz del módulo Android auditado
(en el TMS: `apps/unitrans-android/AUDITORIA-MOVIL.md`). Markdown, en este orden.

1. **Resumen ejecutivo**, máximo diez líneas: estado general, veredicto (🟢/🟡/🔴 y nota global
   1–10), los tres riesgos principales y la recomendación número uno.

2. **Mapa del proyecto**: módulos y paquetes, stack y versiones **leídas del código**, arquitectura
   observada con un diagrama textual de dependencias entre capas, funcionalidades identificadas.

3. **Scorecard por dimensión**, en tabla: dimensión · nota 1–10 · semáforo · resumen de una línea.

4. **Hallazgos por dimensión**, una tabla por cada dimensión del checklist (1 a 13):

   | ID | Severidad | Hallazgo | Evidencia (`archivo:línea`) | Impacto para el conductor o el negocio | Recomendación (qué hacer, no cómo implementarlo) | Esfuerzo (S/M/L) |

   Numera `H-01`, `H-02`, … y marca cada uno como **DEFECTO** (rompe, filtra, corrompe o bloquea) o
   **MEJORA** (funciona, pero envejecerá mal).

5. **Fortalezas que se deben conservar**, con evidencia. Máximo cinco.

6. **Decisiones que cuestiono**: lo que está documentado y decidido, pero cuyo costo conviene
   revisar. Argumento y alternativa.

7. **Plan de remediación priorizado**: victorias rápidas (esta semana), corto plazo (este mes),
   estructural (este trimestre). Indica dependencias entre ítems, qué va primero y **qué no tocar
   hasta tener pruebas**. Cada bloque con sus identificadores de hallazgo y el esfuerzo total.

8. **Supuestos y no verificados**: todo lo que no pudiste ver o comprobar, y las preguntas para el
   equipo.

9. **Veredicto final**, de tres a cinco líneas: ¿está la app lista para manos de usuarios reales y
   para escalar con el mismo estándar del backend? ¿Qué la separa de ese estándar?
