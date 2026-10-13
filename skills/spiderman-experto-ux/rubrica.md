# Rúbrica: severidad, certeza y nota

La nota **no se inventa**: sale de los hallazgos. El agente decide tres cosas
por hallazgo (dimensión, severidad, certeza) y qué dimensiones se evalúan; la
plantilla del informe hace la cuenta. Así la nota siempre cuadra con lo que se
encontró, y dos revisiones de la misma pantalla se pueden comparar.

## 1. Perfil de la pantalla y pesos

Elegir el perfil por lo que la persona **hace** en la pantalla, no por cómo se
ve. Un mismo producto puede tener pantallas de perfiles distintos (la tienda es
«compra», su panel de administración es «operativa»). Los pesos van en
`dimensiones[].peso`; la plantilla divide por la suma de las evaluadas.

| Dimensión | Operativa | Formulario | Consulta | Primer uso | Pública | Compra | App móvil |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eficiencia` Eficiencia de la tarea principal | 20 | 10 | 10 | 10 | 10 | 10 | 15 |
| `estado` Estado y respuesta del sistema | 15 | 10 | 15 | 10 | 5 | 10 | 10 |
| `errores` Prevención y recuperación de errores | 15 | 25 | 5 | 20 | 5 | 15 | 10 |
| `jerarquia` Jerarquía y lectura rápida | 15 | 10 | 25 | 15 | 25 | 10 | 15 |
| `carga` Carga mental y reconocimiento | 10 | 15 | 20 | 15 | 10 | 10 | 10 |
| `consistencia` Consistencia y convenciones | 10 | 10 | 10 | 5 | 5 | 5 | 10 |
| `lenguaje` Lenguaje del usuario | 5 | 10 | 5 | 10 | 10 | 5 | 5 |
| `confianza` Confianza y transparencia | 0 | 0 | 0 | 5 | 10 | 15 | 5 |
| `accesibilidad` Accesibilidad verificable | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| `adaptacion` Adaptación al dispositivo | 0 | 0 | 0 | 0 | 10 | 10 | 10 |

- **Operativa**: bandejas, listados con acciones, planificación, paneles de
  administración; se usa horas seguidas por gente experta.
- **Formulario**: alta o edición de un registro, trámites; el riesgo es cargar
  mal o perder lo escrito.
- **Consulta**: tableros y reportes; se mira para decidir, casi no se actúa.
- **Primer uso**: login, registro, onboarding, pantallas que se ven pocas veces.
- **Pública**: landing, sitio institucional, blog, documentación; un visitante
  nuevo decide en segundos si se queda.
- **Compra**: ficha de producto, carrito, checkout, reserva, suscripción; el
  riesgo es abandonar o pagar algo que no se esperaba.
- **App móvil**: web pensada para el celular o capturas de una app nativa; una
  mano, poca atención, pantalla chica.
- En perfiles de escritorio, **adaptación** pasa a 10 si la pantalla también
  se usa en tablet o celular. **Confianza** sube de 0 cuando la pantalla pide
  dinero, datos personales o un compromiso (registrarse, suscribirse).

Una dimensión que la evidencia no alcanza a ver se marca `"evaluada": false`
con su motivo, y no cuenta. Nunca se le pone nota a ciegas.

## 2. Severidad de un hallazgo

Se cruzan dos ejes, **impacto** y **frecuencia**, y se explican por separado en
el hallazgo (MeasuringU: casi no correlacionan, r ≈ 0,06).

| Impacto \ Frecuencia | En la tarea principal o el camino de la mayoría | Ocasional o de pocos |
| --- | --- | --- |
| Impide terminar, hace abandonar o causa un error con costo (dinero, datos, tiempo, una venta, un trámite) | **Bloqueante** | **Alta** |
| Demora, confunde o exige rodeos | **Alta** | **Media** |
| Molesta o es de pulido | **Media** | **Baja** |

- **Persistencia** sube un nivel: el problema se repite en cada fila, en cada
  visita, y no se aprende a esquivarlo. Bloqueante es el techo.
- **Pisos**: las reglas con *Piso* en [reglas.md](reglas.md) fijan la severidad
  mínima. Bajar de un piso exige escribir por qué en `porQueImporta`.
- **Desempate**: «¿esto haría que alguien llame a soporte, abandone o pierda
  algo?». Si sí, al menos Alta.
- Equivalencia con NN/g: Bloqueante = 4 (catástrofe), Alta = 3 (mayor),
  Media = 2 (menor), Baja = 1 (cosmético). El 0 de NN/g («no es problema») no
  entra al informe.

## 3. Certeza

| Valor | Cuándo | Límite |
| --- | --- | --- |
| `confirmado` | Se ve en la captura o lo midió la sonda, y se revisó a mano | — |
| `probable` | Se deduce de lo visible, pero falta una interacción o un estado para verlo | — |
| `hipotesis` | Depende de cómo trabaja la gente o de datos que no hay | Nunca Bloqueante ni Alta: se sube cuando se confirma |

## 4. La cuenta (la hace la plantilla)

1. Cada dimensión evaluada parte de 1 (4 de 4) y pierde por sus hallazgos:
   Bloqueante 1 · Alta 0,4 · Media 0,15 · Baja 0,05. Mínimo 0.
2. Nota = promedio ponderado de las dimensiones evaluadas × 100, **redondeado
   a 5**: un número más fino sería precisión falsa.
3. **Topes**, para que el promedio no esconda lo grave (la lógica del «peor
   paso» de PURE):
   - una Alta → la nota no pasa de **84**;
   - dos Altas → no pasa de **74**;
   - tres o más Altas → no pasa de **64**;
   - algún Bloqueante → no pasa de **59**.
4. Bandas: **Excelente** ≥ 90 · **Buena** 80–89 · **Aceptable** 70–79 ·
   **Deficiente** 60–69 · **Crítica** < 60. Con los topes, cada banda dice
   también lo peor que se encontró: Excelente no tiene ninguna Alta, Buena
   tiene a lo sumo una, Aceptable dos, Deficiente tres o más, Crítica un
   Bloqueante.

Si la banda resultante parece injusta, se revisan las severidades una por una
contra la tabla del punto 2. **La fórmula no se toca** y no se ajustan
hallazgos para mover la nota.

## 5. Juntar dos evaluaciones independientes

1. **Agrupar por causa raíz**: un mismo defecto en varias pantallas o anchos
   es un hallazgo con varias `marcas`, no varios hallazgos.
2. **Severidad**: si los dos lo vieron, la mayor de las dos cuando difieren en
   un nivel; si difieren en dos o más, releer la captura y decidir con la tabla.
3. **Visto por uno solo**: se verifica en la captura. Si se confirma, entra;
   si no se puede confirmar, entra como `probable` o se descarta.
4. **Descartar** lo que la verificación desmiente: lo que ya existe, lo que
   viola una regla del proyecto, lo que es puro gusto.
5. Un informe corto es válido. **No rellenar**: si la pantalla está bien,
   el informe lo dice.

## 6. Ejemplos calibrados

Un hallazgo bueno tiene **elemento concreto → qué pasa → a quién y en qué
tarea → principio → sugerencia accionable**.

**Pantalla operativa — mal**: «La tabla es difícil de leer. Considerar mejorar la jerarquía.»
**Bien**: «En la bandeja a 1366 × 768, la columna «Fecha límite» pinta igual
las 3 filas vencidas que las 31 a tiempo. El despachador que busca lo urgente
tiene que leer las 34 fechas y compararlas con el reloj. (ES-7 · Gerhardt-Powals,
fusionar datos.) Sugerencia: etiqueta «Vencido» / «Vence en 2 h» junto a la
fecha, con color y texto.» → Alta (diario × demora), confirmado.

**Mal**: «Agregar migas de pan para mejorar la navegación.»
**Bien**: no es hallazgo: la miga ya está arriba del título (se ve en la
captura). Descartado en la verificación.

**Mal**: «El diseño se ve recargado; usar más espacio en blanco.»
**Bien**: no es hallazgo en una pantalla operativa. Solo lo sería si la
densidad esconde algo: «La cabecera con 4 tarjetas de totales ocupa 310 px y
deja 6 filas visibles a 1366 × 768; los totales no se usan para asignar.
(EF-5)» → Media, probable (falta confirmar con el área si miran esos totales).

**Compra — mal**: «El checkout es confuso.»
**Bien**: «En el paso de pago, a 390 × 844, el total aparece recién al final y
es mayor que el del carrito por un «cargo de servicio» que no se mostró antes.
Quien llega a pagar se encuentra un precio distinto del que aceptó. (CF-3 ·
Baymard: los costos extra son la primera causa de abandono.) Sugerencia:
mostrar el cargo desde la ficha y el carrito, y el total completo en el resumen
de cada paso.» → Bloqueante (camino de la mayoría × hace abandonar), confirmado.

**Sitio público — mal**: «El hero no es atractivo.»
**Bien**: «A 390 × 844, la primera pantalla muestra «Impulsamos tu futuro»
sobre una foto de stock y ningún botón: no se sabe que es una academia de
idiomas ni qué hacer para inscribirse. (JE-7 · NN/g, primer vistazo.)
Sugerencia: una frase que diga qué es y para quién, y el botón de la acción
principal visible sin bajar.» → Alta (todos los visitantes × confunde),
confirmado.

**Mal**: «El botón Guardar debería ser verde.»
**Bien**: no es hallazgo: es gusto, no cambia la tarea. Sí lo sería: «Hay cinco
botones azules rellenos en la barra y ninguno se distingue como la acción
principal (JE-1 · Hick).» → Media, confirmado (sonda: `botonesDeColor` 5 en la
ventana).
