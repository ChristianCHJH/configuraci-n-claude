---
name: spiderman-generador-manual
description: Genera un manual de usuario en PDF, corto e ilustrado, con capturas reales de la web levantada y marcas numeradas sobre cada botón — portada con «Cómo funciona» (esquema de tres cajas y reglas), una página por paso, resultado final y resumen. Poco texto, metódico, para que cualquier usuario lo entienda. Recibe la pantalla y la funcionalidad a explicar; recorre la app con Playwright, hace el flujo de verdad en la base local, marca las capturas, imprime el PDF con Chrome y lo guarda en la carpeta de manuales del proyecto. Úsala cuando el usuario diga "genera un manual", "manual con capturas", "manual de la pantalla X", "explica cómo se hace X con capturas", "spiderman manual", "generador de manual" o invoque /spiderman-generador-manual, con la pantalla y la funcionalidad (por ejemplo «roles: crear rol, darle permisos y asignarlo a un usuario»).
---

# Spider-Man generador de manual

Produce un PDF **igualito** al manual aprobado de roles y permisos
(`ejemplo-roles-y-permisos.html`, en esta carpeta). El formato no se
reinventa: se copia `plantilla.html` y se llena.

## Entrada

- **Pantalla(s)** y **funcionalidad** que hay que explicar. Si falta alguna
  de las dos, se pregunta antes de empezar. Nada más.
- El público es el **usuario final del sistema**, no un técnico.

## Reglas de contenido (las que hicieron bueno al primero)

1. **Poco texto.** Cada paso: título con verbo («Crear el rol»), una línea
   que dice dónde está («Menú **Seguridad → Roles y permisos**») y una
   leyenda de 1 a 3 puntos bajo cada captura. Ningún párrafo.
2. **La captura manda.** Cada acción se ve en una captura real con un
   recuadro naranja y un número; la leyenda repite ese número con el verbo y
   el nombre exacto del botón en negrita («Pulsa **Crear rol**»).
3. **Metódico.** Orden fijo de páginas:
   - **Portada + Cómo funciona:** marca, título, una frase de qué se aprende;
     esquema de **tres cajas con flechas** (la del medio oscura) que muestra
     cómo se encadenan las piezas, cada una con un ejemplo real del
     recorrido; **hasta 4 reglas** (ícono + frase en negrita + una
     oración); índice de pasos numerados.
   - **Una página por paso**, máximo **2 capturas por página**.
   - **Última página:** «Ver el resultado» —lo que ve la persona afectada
     cuando entra— y el recuadro **En resumen** con los pasos en una línea
     cada uno.
4. **Un solo ejemplo que atraviesa todo** el manual (en el primero: el rol
   «Cajero» asignado a «Beto Asesor»). Se nombra igual en el esquema, en
   las capturas y en el resultado.
5. **Nada inventado.** Reglas, nombres de botones y mensajes salen de la
   pantalla o del código. Una regla que no se pudo verificar no entra.
6. **Notas solo si hacen falta**: una por página como máximo, en el
   recuadro `.nota` (ej. «“—” significa que esa acción no existe»).
7. Español con tildes, segunda persona («Pulsa», «Elige»), sin jerga técnica
   (nada de «endpoint», «backend», códigos internos salvo los que el
   usuario escribe en pantalla).

## Método

### 1. Ubicar la app y el usuario de prueba

- Leer el `CLAUDE.md` del proyecto para saber dónde vive el código (en
  inmobiliaria: el código está en `inmobiliaria-sistema`).
- Buscar la ruta de la pantalla en el router del frontend.
- Confirmar que la web levantada apunta a una **base local** (contenedores
  `docker ps`, variable `POSTGRES_HOST` o equivalente). **Nunca se hace el
  recorrido contra producción.** Si no hay base local, se detiene y se
  pregunta.
- Credenciales: las de demostración de las pruebas e2e
  (`cypress/fixtures/usuarios.json` o similares). En inmobiliaria:
  `admin@demo.pe` / `demo1234` y `asesor@demo.pe` / `demo1234`.
- No imprimir variables de entorno con secretos: filtrar con `cut -d= -f1`.

### 2. Recorrer y capturar con Playwright (MCP)

- Ventana **1366 × 800**, `scale: "css"`. Todas las capturas del mismo tamaño.
- Las capturas solo se pueden guardar dentro de la raíz permitida del MCP:
  usar `filename: ".playwright-mcp/manual-<tema>/NN-<nombre>.png"`
  (relativo al directorio de trabajo). Numerar en el orden del manual.
- Hacer el flujo **de verdad** (crear, asignar, guardar) en la base local con
  datos de ejemplo con nombre de negocio realista, y capturar:
  pantalla de entrada → formulario vacío o lleno → elección → confirmación
  (el aviso verde «… creado») → resultado.
- Para el resultado, **entrar como la persona afectada** (cerrar sesión desde
  el menú de cuenta → «Cerrar sesión», ingresar con su usuario) y capturar lo
  que ve.
- Ahorrar contexto: `browser_snapshot` con `target` y `depth`, o `grep`
  sobre el `.yml` que guarda el MCP; no volcar snapshots completos.
- Mirar cada captura con `Read` antes de usarla: que muestre lo que dice la
  leyenda y que no haya un aviso o diálogo tapando algo.
- Si con scroll interno el bloque útil queda cortado, ajustar el
  `scrollTop` del contenedor con `browser_evaluate` y volver a capturar.

### 3. Armar el HTML

- Carpeta de trabajo en el **scratchpad**: `manual/` con `img/` (copiar ahí
  las capturas) y `manual.html` (copia de `plantilla.html`).
- **No tocar el CSS** de la plantilla. Paleta: navy `#12263f`, naranja
  `#e4572e`, fondo `#f3f5f8`. Fuente Segoe UI. A4.
- Marcas: medir en la captura (píxeles de 1366 × 800) y pasar a porcentaje:
  `left = x/1366`, `top = y/800`, `width = w/1366`, `height = h/800`.
  Recuadro un poco más grande que el botón. Varias casillas del mismo
  número: la primera lleva `<i>1</i>`, las demás van sin número.

### 4. Imprimir y verificar

```
python -I ~/.claude/skills/spiderman-generador-manual/armar-pdf.py <scratchpad>/manual/manual.html <scratchpad>/manual/manual.pdf
```

- El script dice cuántas páginas salieron y deja `montaje.png`. **Mirar el
  montaje**: el número de páginas debe ser el planeado (portada + pasos). Si
  una página se desborda (hoja casi vacía con una leyenda suelta), quitar una
  captura de esa página o pasarla a la siguiente; no achicar el texto.
- Renderizar de cerca (PyMuPDF, `dpi=80`) al menos la página con más marcas
  y confirmar que cada recuadro cae sobre su botón.

### 5. Entregar

- Guardar en la carpeta de manuales del proyecto con el siguiente número
  libre: `10-manuales/manual-N-<tema>.pdf` en inmobiliaria. En otro proyecto,
  donde estén sus manuales; si no hay, preguntar.
- Borrar **solo** lo que creó esta sesión en `.playwright-mcp/` (la carpeta
  `manual-<tema>/` y los `.yml`/`.log` de hoy); lo anterior se deja.
- No hacer commit salvo que se pida.
- Respuesta de máximo 200 palabras: enlace al PDF, páginas y su contenido en
  una línea cada una, **qué datos de ejemplo quedaron creados en la base
  local** (y que se pueden borrar), y cualquier defecto de pantalla que se
  vio en las capturas (solo reportarlo, no arreglarlo).
