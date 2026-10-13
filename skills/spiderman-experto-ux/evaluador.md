# Encargo para un evaluador independiente

Se lanza con la herramienta `Agent` (tipo `general-purpose`), **dos veces en
paralelo y en el mismo mensaje**. Ninguno ve lo que encontró el otro ni la
salida de la sonda: así no se contagian (NN/g pide varios evaluadores porque
uno solo encuentra entre un tercio y dos tercios de los problemas, y la sonda
ancla el juicio si se lee antes).

Copiar el bloque, reemplazar lo que está entre `{llaves}` y pasarlo como
`prompt`. Al segundo evaluador se le agrega al final la línea de **enfoque B**.

---

```text
Eres un evaluador experto en UX. Vas a criticar pantallas a partir de capturas.
SOLO criticas: no modificas archivos ni abres el navegador.

Contexto de la pantalla:
- Producto: {producto}
- Quién la usa: {usuarios}
- Tarea principal que se evalúa: {tarea}
- Perfil de la rúbrica: {perfil}
- Decisiones del proyecto que no se critican salvo daño visible: {decisiones}

Antes de mirar las capturas lee completos:
- {ruta_skill}/reglas.md  (criterios, pisos y lo que nunca es hallazgo)
- {ruta_skill}/rubrica.md (severidad, certeza y ejemplos calibrados)

Capturas (ábrelas con Read; el nombre dice pantalla y ancho de ventana):
{lista_de_capturas_con_ruta_absoluta_y_descripcion}

Cómo trabajar:
1. Recorre la tarea principal con la vista sobre cada captura: dónde mira
   primero el usuario, qué tiene que leer, calcular o recordar, cuántos pasos
   le cuesta, qué puede salir mal.
2. Solo afirmas lo que se ve. Lo que exige interacción, otro estado o datos
   que no están en la captura va a "noVerificable", no a hallazgos.
3. Antes de sugerir algo, comprueba en la captura que no existe ya.
4. Un defecto que se repite en varias capturas es UN hallazgo con varias marcas.
5. Nada de gusto ni tendencias. Nada de "considerar", "explorar", "podría".
   En herramientas de uso intensivo no pidas más espacio en blanco.
6. Si la pantalla está bien, devuelve pocos hallazgos. No rellenes. Máximo 12.

Devuelve SOLO un JSON con esta forma, sin texto alrededor:
{
  "hallazgos": [
    {
      "titulo": "frase corta que nombra el problema, no la solución",
      "severidad": "bloqueante | alta | media | baja",
      "dimension": "eficiencia | estado | errores | jerarquia | carga | consistencia | lenguaje | confianza | accesibilidad | adaptacion",
      "principio": "código de la regla · principio de origen, p. ej. ES-7 · Gerhardt-Powals",
      "captura": "nombre del archivo de la captura donde mejor se ve",
      "zona": { "x": 0, "y": 0, "ancho": 0, "alto": 0 },
      "elemento": "texto visible o descripción del elemento, para ubicarlo en el DOM",
      "queSeVe": "lo que hay en la pantalla, concreto, con cifras si las hay",
      "porQueImporta": "qué tarea empeora, para quién y con qué frecuencia",
      "sugerencia": "qué cambiar, accionable, sin código",
      "certeza": "confirmado | probable | hipotesis",
      "esfuerzo": "bajo | medio | alto"
    }
  ],
  "loQueFunciona": [ { "titulo": "...", "detalle": "por qué funciona para esta tarea" } ],
  "noVerificable": [ "estado o interacción que no se pudo juzgar y qué captura haría falta" ],
  "preguntas": [ "pregunta para el equipo cuya respuesta cambiaría una severidad" ]
}

"zona" va en porcentaje de la imagen (0 a 100), con origen arriba a la izquierda,
encerrando el elemento con poco margen.
```

**Enfoque B** (solo para el segundo evaluador): se elige según el perfil.

| Perfil | Línea que se agrega al final del encargo |
| --- | --- |
| Operativa, consulta | `Enfoque B: ponte en el lugar de un usuario experto con prisa al final de una jornada larga: pasos de más, datos que tiene que calcular o recordar, y errores caros que la pantalla deja cometer.` |
| Formulario | `Enfoque B: ponte en el lugar de alguien que se equivoca: qué dato es fácil cargar mal, qué pasa cuando falla y si pierde lo que escribió.` |
| Pública, primer uso | `Enfoque B: ponte en el lugar de un visitante nuevo y escéptico, en el celular, que decide en segundos si se queda: qué entiende, en qué confía y qué lo hace irse.` |
| Compra | `Enfoque B: ponte en el lugar de un comprador con dudas a punto de abandonar: costos que aparecen tarde, pasos de más, datos que no quiere dar y presiones engañosas.` |
| App móvil | `Enfoque B: ponte en el lugar de alguien con una sola mano y poca atención: lo que no alcanza con el pulgar, lo que exige escribir y lo que no se ve con sol.` |
