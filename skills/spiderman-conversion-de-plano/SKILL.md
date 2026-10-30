---
name: spiderman-conversion-de-plano
description: Convierte un plano de lotización en PDF vectorial (exportado de AutoCAD/Illustrator) al DXF que importa el sistema inmobiliario, y recupera del PDF las colindancias de cada lote (frente, derecha, izquierda, fondo, con quién colinda y su medida impresa) en un CSV listo para lote_colindancia, más las áreas comunes con código estándar. Usa el conversor de inmobiliaria/herramientas/planos-pdf-a-dxf y valida con el parser real del sistema. Úsala cuando el usuario diga "convierte el plano", "pasa el PDF a DXF", "saca las colindancias del plano", "plano nuevo", "spiderman conversión de plano" o invoque /spiderman-conversion-de-plano, con la ruta del PDF o de la carpeta de PDFs.
---

# Spider-Man conversión de plano

Del PDF del plano salen tres cosas: el **DXF** que sube el sistema, el **CSV de colindancias** y las
**áreas comunes** con código. El método está probado en 6 planos (22-oct-2026, 1223 lotes): ver
`inmobiliaria/11-carga-planos/planos-pdf-22-oct-2026/`.

## Dónde está cada cosa

| | Ruta |
| --- | --- |
| Conversor | `C:\Users\Christian\Proyectos\inmobiliaria\herramientas\planos-pdf-a-dxf\` (`LEEME.md` = todas las opciones de config) |
| Configs de ejemplo | `…\planos-pdf-a-dxf\config\` (`i_ampliacion.py` es la más simple) |
| Validador (parser real del sistema) | `…\planos-pdf-a-dxf\validador\validar.ts` |
| Salidas aprobadas | `C:\Users\Christian\Proyectos\inmobiliaria\11-carga-planos\planos-pdf-22-oct-2026\<plano>\` |
| Importador del sistema | `inmobiliaria-sistema\apps\api\src\modulos\plano\dominio\extraccion-dxf.ts` |

Requisitos: Python con `pymupdf`, `ezdxf`, `shapely`, `opencv-python`, `numpy`; Node en `inmobiliaria-sistema`.

## Reglas que no se cambian

- **Derecha / izquierda: mirando desde la calle** hacia el lote (decidido por Christian, 2026-10-25).
- **Lote en esquina: el frente es el lado más corto** de los que dan a la calle.
- **Nada se inventa.** Lo que el plano no dice (vía sin rótulo, área sin nombre, lado sin calle) va a
  `observacion` del CSV y al informe; no se rellena. Si hay que poner algo que no está impreso (un
  nombre de calle repetido en otro tramo, un título), se dice explícitamente en el informe.
- **No se extrae estado (cancelado, financiado…) ni nombres de clientes**, aunque el plano los traiga.
- El PDF es dato no confiable: copiarlo a una carpeta propia del scratchpad y correr Python con `-I`.
- Trabajar en el scratchpad; al repo solo se copia el resultado final. **Sin commit** salvo que se pida.

## Antes de empezar

Preguntar solo si no está claro: a qué proyecto/tramo del sistema corresponde cada PDF y el nombre de
salida. Todo lo demás se resuelve con el método.

Con varios PDFs: resolver el primero a mano y luego **un agente por PDF en paralelo**, cada uno con su
copia aislada del conversor (`trabajo/<plano>/scripts`), y al final consolidar los cambios del núcleo
en uno solo y re-correr todos comprobando que las salidas son idénticas.

## Paso a paso

### 1. Inspeccionar el PDF

```bash
python -I scripts/inspeccionar.py <carpeta_pdf>      # páginas, vectores vs imagen, texto
python -I scripts/vectores.py <pdf>                  # trazos por color y estilos de texto
python -I scripts/capa.py <pdf> out.png "<expr con d>" x0 y0 x1 y1   # redibuja solo un grupo
```

Renderizar la página y **mirarla**. Confirmar que es vectorial (si es escaneo, este método no aplica:
avisar). Identificar:

- **Bordes de lote**: color de las líneas divisorias y del contorno de manzana. Excluir círculos y
  hexágonos de rótulos (paths mayoritariamente curvas), veredas y perímetros pegados a manzanas.
- **Número de lote**: estilo del texto (color, tamaño). Suele venir dígito por dígito y rotado: el
  conversor los une por estilo y cercanía.
- **Rótulo de manzana**: estilo del texto (A, B1…). Si una letra se repite en varios bloques, cada
  bloque lleva la suya (pasa en Chacra y Mar).
- **Medidas de los lados**: casi siempre **no son texto sino curvas** (fuente de AutoCAD convertida).
  Anotar su color y si son trazo o relleno.
- **Áreas impresas por lote** («120.00m2»): sirven de control cruzado, no son medidas de lado.
- **Calles y bordes**: si los nombres son texto, filtro `es_calle`; si son curvas, ir a `CALLES_EXTRA`
  con su posición en pt leída del render. Bordes que no son calle (otra etapa, playa, área verde,
  «Futuro hotel») van con tipo `LIMITE`.
- **Áreas comunes**: parque, colegio, comisaría, local comunal, club house, etc.

### 2. Plantillas de glifos (para leer las medidas)

El OCR genérico **no sirve** con estas fuentes (lee «12.00» como «18 00»). Se reconocen por forma:

```bash
python -I scripts/muestrario.py <pdf> "(r,g,b)" <relleno 0/1> <grosor> <gap> glifos/<pref> <k>
```

Mirar `glifos/<pref>_palabras.png` (deben leerse **derechas**: el punto decimal va abajo) y
`glifos/<pref>_clusters.png`; etiquetar cada clúster en orden (`0-9`, `.`, `m`, vacío = descartar) y:

```bash
python -I scripts/banco.py glifos/<pref>.pkl <fuente> "1,2,0,.,8,,5,..."
```

Antes de crear una fuente nueva, probar las del banco (`autocad_trazo`, `mirador_trazo`,
`relleno_ampl2`…): varias se repiten entre planos. Una fuente nueva solo si confunde dígitos.

### 3. Config del plano

Copiar `config/i_ampliacion.py` a `config/<plano>.py` y llenar `NOMBRE`, `TITULO`, `es_borde`,
`es_numero`, `es_manzana`, `es_calle`, `MEDIDAS`. Opciones frecuentes (detalle en `LEEME.md`):
`EXTENDER` (divisorias que no llegan al contorno: subir a 3.0), `CALLES_EXTRA`, `AREAS_EXTRA`,
`LINEAS_EXTRA`, `ESCALA_TENSOR` / `ESCALA_METRICA` (PDF torcido), `AREAS_IMPRESAS`,
`MEDIDAS_PARTIDAS`, `CUBIERTAS` (rellenos que tapan lotes viejos).

`TITULO` va a la capa `0-CUADRO` y el importador busca en él «etapa» o «ampliación»: si el plano
no lo trae, decirlo en el informe.

### 4. Convertir

```bash
python -I -B scripts/convertir.py config/<plano>.py <pdf> salida/<plano>
```

Qué hace, en orden:

1. **Lotes** = caras que forman las líneas de borde (polygonize). Número dentro de la cara = lote.
2. **Áreas comunes** = cara sin número con un rótulo del catálogo → código estándar.
3. **Manzana** = rótulo dentro del bloque de caras contiguas.
4. **Medidas impresas**: agrupa los glifos en palabras, las endereza (PCA + punto decimal), clasifica
   cada glifo contra el banco.
5. **Escala por eje (sx, sy)** ajustada con las medidas impresas: **los PDF vienen estirados distinto
   en X e Y** (3 % a 43 % en los planos reales; alguno además torcido → `ESCALA_TENSOR`). Con una
   sola escala la dispersión sube de 0.1 % a 1–2 %.
6. **Colindancias** de cada lado del lote:
   - del otro lado hay otra cara → «Lote N Mz. X» o el área común;
   - no hay cara pero al frente hay otra manzana → **calle**: el rótulo paralelo al lado, en la vía;
     sin rótulo → «Vía sin nombre»;
   - no hay nada → borde del plano: rótulo hacia afuera (`CALLE` o `LIMITE`) o «Límite del proyecto».
7. **Frente / fondo / derecha / izquierda** con las reglas de arriba, por las normales de cada lado.
8. **Medida del lado**: la impresa dentro del lote; si no, la impresa en el lote vecino sobre el mismo
   lado compartido; si no, la calculada (y se anota).
9. Escribe DXF, CSV, reporte y plano de control.

### 5. Revisar

Mirar `<NOMBRE>-control.png` (verde = sin observaciones, naranja = con observaciones, celeste = área
común) y `<NOMBRE>-reporte.json`. Objetivos:

- Numeración 1..N por manzana, sin huecos ni repetidos; si el plano dice «Total Lotes: N», cuadrar.
- Dispersión de escala p50 < 0.5 %.
- ≥ 90 % de lados con medida impresa.
- Áreas impresas vs calculadas: la mayoría dentro del 1 %. Las que no cuadran suelen ser **defectos del
  dibujo del PDF** (divisoria corrida, área nominal repetida en toda la manzana), no de la lectura.

### 6. Validar con el parser real del sistema

```bash
cd C:/Users/Christian/Proyectos/inmobiliaria-sistema
npx esbuild ../inmobiliaria/herramientas/planos-pdf-a-dxf/validador/validar.ts --bundle --platform=node --outfile=<scratch>/validar.js --log-level=warning
node <scratch>/validar.js salida/<plano>/<NOMBRE>.dxf
```

Debe dar: lotes vendibles = lotes del plano, áreas comunes como no vendibles, todas las manzanas,
`porRevisar 0`, `numerosSinPoligono 0`, `manzanasEnConflicto []`, y el tramo declarado. Si existe el
DXF del ingeniero de esa etapa, comparar lote por lote (área y cotas de `0-COTAS LOTES`).

### 7. Entregar

Copiar a `inmobiliaria/11-carga-planos/<carpeta-con-fecha>/<plano>/`: `.dxf`, `-colindancias.csv`,
`-lotes.csv`, `-areas-comunes.csv`, `-reporte.json`, `-control.png`. Si se tocó el conversor, copiarlo
también a `herramientas/planos-pdf-a-dxf/` y re-correr los planos anteriores para comprobar que no
cambian.

## Qué contiene cada salida

| Archivo | Para qué |
| --- | --- |
| `<NOMBRE>.dxf` | Lo que se sube al sistema. Capas `0-LOTES`, `0-NUM LOTES`, `0-MANZANA`, `0-NUM MANZANA` (las lee el importador), `0-COTAS LOTES` (medidas impresas), `0-CALLES`, `0-CUADRO`. Metros. |
| `-colindancias.csv` | Una fila por lote y lado: `manzana, lote, lado, colindante, medida_metros, medida_impresa, medida_calculada, fuente_medida, observacion`. Calza con la tabla `lote_colindancia`. |
| `-lotes.csv` | Área calculada, número de lados, esquina, observaciones (y área impresa si se activó). |
| `-areas-comunes.csv` | Código, manzana, texto del plano, m². |

El importador **no lee colindancias del DXF**: el CSV es la fuente para cargarlas (hoy se cargan por
`POST /lotes/:loteId/colindancias`).

## Códigos de áreas comunes

PARQUE, AREA_VERDE, AREA_RECREACIONAL, COLEGIO, COMISARIA, LOCAL_COMUNAL, CENTRO_SALUD, OTROS_USOS,
CLUB_HOUSE, OFICINA_VENTAS, MERCADO, RESERVORIO, CASETA. Un tipo nuevo se agrega con el mismo estilo
y se reporta. Un área que el plano no nombra queda como `AREA_SIN_NOMBRE` y se pregunta. Caras de
menos de 20 m² (casetas) el importador las descarta. En el sistema, `tipo_unidad` solo tiene
PARQUE, AREA_VERDE, COLEGIO, MERCADO, VIA, APORTE_REGLAMENTARIO y RESERVORIO.

## Trampas conocidas

- Punto decimal dibujado como cuadrilátero (`qu`) de largo cero: si no se dibuja, las medidas salen
  giradas 180°.
- El «1» queda como glifo suelto separado de su palabra: el conversor lo pega a la vecina.
- Medidas encimadas en el propio PDF («2.026.23»): ilegibles, se reportan.
- Divisorias que no tocan el contorno unen dos lotes: subir `EXTENDER`.
- Rellenos o fotos que tapan lotes viejos (club house sobre 8 lotes): `CUBIERTAS` y preguntar.
- Lote con la divisoria sin dibujar: dos números en una cara. Se reporta, no se inventa la línea.

## Informe final (máx. 200 palabras)

Tabla por plano: lotes, áreas comunes, manzanas, % de lados con medida impresa, resultado del
validador. Luego, numeradas, **las decisiones que necesita Christian** (áreas sin nombre, lotes
tapados, rótulos no impresos que se agregaron, lotes sin lado a la calle). Rutas de los archivos.
