# Diseño — de `DESIGN.md` a Material 3

La dirección visual está **CERRADA** desde el inicio del proyecto y no se consulta de nuevo:
blanco dominante, mucho aire, sin saturación, un solo acento salvia desaturado. La sensación buscada
es *"cuaderno limpio sobre escritorio ordenado"*, y la motivación viene de datos serenos, no de
fuegos artificiales.

La app **hereda** eso. La única adaptación real es el **tema oscuro**, que la web no tiene y en móvil
es obligatorio.

Fuente: `[repo]\DESIGN.md` y `[repo]\engine\styles.css` (tokens `--spa-*`). Si hay discrepancia,
gana el repo.

---

## 1. Tema claro

| Token web | Valor | Rol Material 3 |
|---|---|---|
| `--spa-bg` | `#ffffff` | `surface` |
| `--spa-surface` | `#fafbfa` | `surfaceContainerLow` |
| `--spa-surface-alt` | `#f3f5f3` | `surfaceContainer` |
| `--spa-text` | `#1f2421` | `onSurface` |
| `--spa-text-muted` | `#5c655f` | `onSurfaceVariant` (≥4.5:1) |
| `--spa-text-faint` | `#8a938c` | `outline` |
| `--spa-border` | `#e4e8e5` | `outlineVariant` |
| `--spa-accent` | `#6f8c79` | `primary` |
| `--spa-accent-hover` | `#5d7a67` | `primary` en pressed |
| `--spa-accent-soft` | `#e9efea` | `primaryContainer` |

`onPrimary` = `#ffffff`, `onPrimaryContainer` = `#2c3a32`.

---

## 2. Tema oscuro

La web ya tiene **una** superficie oscura: el riel lateral de `app.html`, salvia profundo `#2c3a32`
con texto `#b7c3ba` en reposo y `#f2f6f3` en énfasis. El tema oscuro se deriva de ahí, así que no se
inventa una paleta nueva — se extiende la que existe.

| Rol Material 3 | Valor | De dónde sale |
|---|---|---|
| `surface` | `#161b18` | salvia profundo, un paso más oscuro que el riel |
| `surfaceContainerLow` | `#1c2320` | |
| `surfaceContainer` | `#222a26` | |
| `surfaceContainerHigh` | `#2c3a32` | **el riel de la web, tal cual** |
| `onSurface` | `#f2f6f3` | énfasis del riel |
| `onSurfaceVariant` | `#b7c3ba` | reposo del riel |
| `outlineVariant` | `#3a453e` | separadores |
| `primary` | `#c9dccf` | variante *light* de salvia, ya definida para el ítem activo del riel |
| `onPrimary` | `#1f2421` | |
| `primaryContainer` | `#3d5145` | |
| `onPrimaryContainer` | `#dfe9e2` | |

Los valores derivados (`surface`, `outlineVariant`, `primaryContainer`) se **verifican con un medidor
de contraste** antes de darlos por buenos: el mínimo es 4.5:1 para texto normal.

En oscuro se invierte la lógica del claro: la superficie manda y el color aparece aún menos. Nada de
subir la saturación para "compensar".

---

## 3. Roles semánticos

Fijos, nunca decorativos. Significan siempre lo mismo.

| Rol | Claro | Fondo claro | Oscuro | Fondo oscuro |
|---|---|---|---|---|
| Correcto | `#4f8a5b` | `#eef6f0` | `#8fbf9a` | `#25342a` |
| Incorrecto | `#c0635e` | `#fbeeed` | `#e39a95` | `#3a2422` |

El feedback de un ejercicio siempre lleva **icono + texto + color**, nunca solo color: hay daltonismo
y hay pantallas al sol.

---

## 4. Un acento por curso

De la paleta extendida de `DESIGN.md`, cruzada con el campo `accent` de `curriculum/courses.js`:

| Curso | Tono | ink | base | soft | light (oscuro) |
|---|---|---|---|---|---|
| Inglés (`sage`) | Salvia | `#5d7a67` | `#6f8c79` | `#e9efea` | `#c9dccf` |
| JavaScript (`clay`) | Terracota | `#935c42` | `#b0765a` | `#f6ece5` | `#e5bda8` |
| Docker (`blue`) | Azul niebla | `#54708f` | `#6b84a3` | `#e9eef5` | `#bccde2` |
| Kubernetes (`plum`) | Lavanda | `#6f6289` | `#8b7da6` | `#efecf5` | `#d1c7e4` |

El acento del curso **tiñe solo el contexto de ese curso** (su tarjeta en el hub, la barra de progreso
de su clase, sus chips). No reemplaza el `primary` del tema: el botón de acción primaria sigue siendo
salvia en toda la app. El color marca roles, no llena pantallas.

Se implementa como un `CompositionLocal` con el acento del curso activo, no pasando un color por
parámetro por media jerarquía de Composables.

---

## 5. Tipografía

- **Una sola familia**, la del sistema. Sin fuentes display en la interfaz.
- Cuerpo ≥ 16sp. Jerarquía por **peso** (headings en 650, que en Compose es `FontWeight.SemiBold`)
  y tamaño, no por color.
- Línea de prosa cómoda: en móvil eso significa márgenes laterales generosos, no texto de borde a borde.
- Todo en **sp**, nunca `dp`, y probado al 200% de escalado.
- El código (secciones `code`, `terminal`, ejercicios de código) va en monoespaciada, con
  desplazamiento horizontal propio — nunca se parte una línea de código a la fuerza.

---

## 6. Forma, espacio y movimiento

- Radios: 8 / 12 / 18 dp y pastilla. Sombras muy suaves; en oscuro se sustituyen por elevación de
  superficie, no por sombras más fuertes.
- Escala de espaciado en pasos de 4dp. **El aire es parte del diseño**: si algo se ve apretado, sobra
  contenido en pantalla, no falta reducir el margen.
- Transiciones de 150–250 ms, solo `transform` y `opacity`. Se respeta "reducir movimiento" del sistema.
- El avance entre pasos de la clase es una transición horizontal corta, no una animación llamativa.

---

## 7. Prohibiciones heredadas

- **Iconos vectoriales siempre. Jamás emojis.** (Regla explícita de `DESIGN.md`.)
- El acento se usa **solo** para acción primaria, selección actual e indicadores de estado. Nunca
  como decoración.
- Prohibido: glassmorphism, texto con gradiente, borde de color solo a un lado como acento, y
  cuadrículas de tarjetas idénticas que no dicen nada.
- Nada de diálogos innecesarios. El feedback va inline, junto al problema.

---

## 8. Cómo se implementa

Todo en `:core:designsystem`:

```
core/designsystem/
├── theme/Color.kt        los dos ColorScheme, claro y oscuro
├── theme/Type.kt         la escala tipográfica
├── theme/Shape.kt        los radios
├── theme/Tema.kt         AcademiaTheme { }  +  LocalAcentoCurso
└── componente/           Boton, Tarjeta, Chip, BarraProgreso, EstadoVacio…
```

Reglas:

- **Cero `Color(0xFF…)` fuera de `theme/Color.kt`.** Es exactamente lo que hace mal Adifnex, donde
  `LoginScreen` pinta con literales inline y no respeta el tema.
- Los Composables leen `MaterialTheme.colorScheme.*`, nunca constantes importadas.
- **Sin dynamic color** (Material You). La identidad de la academia es fija: si la app tomara los
  colores del fondo de pantalla, se perdería la dirección visual ya decidida.
- Cada componente compartido nace con su `@Preview` en claro y en oscuro.
