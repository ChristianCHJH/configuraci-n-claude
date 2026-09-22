---
name: academia-api
description: Credenciales y forma de hablar con la API de la plataforma teacher-english (academia). La usan /pildora, /teacher-ingles y /profe-dev para publicar contenido desde CUALQUIER repositorio, sin depender de tener el proyecto clonado. Invócala cuando haya que leer o publicar clases, píldoras o progreso de la academia.
---

# API de la academia — credenciales y protocolo

Esta skill existe para una sola cosa: **que publicar contenido no dependa de estar dentro del
repo `teacher-english`**. Christian estudia arquitectura en otro repositorio, pide una píldora, y
tiene que aparecer en su celular. Con esto, cualquier sesión de Claude Code —en cualquier
carpeta— sabe a dónde escribir y con qué credencial.

> ⚠️ **Este archivo contiene un secreto.** Vive en el repo privado de configuración de Christian
> (`ChristianCHJH/configuraci-n-claude`). Si ese repo alguna vez se hace público o se comparte,
> **el token viaja en el historial de git aunque lo borres después**. Cómo rotarlo, al final.

---

## 1. Dónde está la API

| Entorno | URL base |
|---|---|
| **Producción** (la que usa el celular) | `https://teacher-english-api.onrender.com/api` |
| Local (Docker del proyecto) | `http://localhost:3211/api` |

**Por defecto, producción.** Publicar en local no llega al celular — el móvil apunta a Render.
Usa local solo si Christian lo pide explícitamente para probar.

> ☕ **Render duerme el servicio gratis.** La primera llamada después de un rato tarda
> **hasta 60 s** (cold start medido: 51 s). No es un error ni un timeout: espera. Si vas a
> publicar, despierta la API antes con un `GET /indice` y luego manda el POST.

## 2. La credencial

```
TOKEN_SERVICIO = ffcb432940c88672e0bfa3af2956b7438a58c6c3902d2c34b6ecbdd360df2e68
```

Viaja en el header **`x-token-servicio`**. Es el token de *producción*.

Se llama "de servicio" porque las skills no son personas: no tienen dónde iniciar sesión. Un
humano publica con su sesión (`usuario.puede_publicar`); una skill, con este token.

---

## 3. Leer qué existe (siempre antes de escribir)

**Todas** las llamadas —también las de lectura— van con el header `x-token-servicio`. La API está
cerrada por defecto: un endpoint sin proteger que alguien olvide es un agujero que no avisa.

```bash
API=https://teacher-english-api.onrender.com/api
TOKEN=ffcb432940c88672e0bfa3af2956b7438a58c6c3902d2c34b6ecbdd360df2e68
AUTH="-H x-token-servicio:$TOKEN"

curl $AUTH "$API/indice"              # todo: cursos, clases y píldoras
curl $AUTH "$API/indice?tipo=pildora" # solo píldoras
curl $AUTH "$API/indice?tipo=clase&curso=ingles"
curl $AUTH "$API/pildora/<slug>"      # una píldora completa
curl $AUTH "$API/clase/<codigo>"      # una clase completa
curl $AUTH "$API/curso"               # los cursos y su roadmap
curl $AUTH "$API/curso/<codigo>"      # qué clases existen y cuáles tienen contenido
curl $AUTH "$API/curso/<codigo>/concepto"   # vocabulario técnico del curso
curl $AUTH "$API/categoria"           # categorías de píldoras en uso
```

En el `indice`, **`escrito: false` significa que la clase está en el roadmap pero sin contenido**:
eso es exactamente lo que hay que generar.

Sirve para dos cosas concretas:

1. **No duplicar.** Si el tema ya existe, se **actualiza** (mismo `slug` / mismo código): la API
   hace upsert y sube la versión. Nunca deja dos.
2. **Enlazar.** `related` tiene que apuntar a algo que exista de verdad, o la publicación se
   rechaza con `ENLACE_INEXISTENTE`.

---

## 4. La gramática del contenido — pídesela a la API

**No guardes una copia del contrato en ninguna skill ni en ninguna nota.** El prompt lo genera la
API desde la misma definición que usa el validador:

```bash
curl "$API/contrato/prompt?tipo=pildora"
curl "$API/contrato/prompt?tipo=clase&tema=closures"
```

*Una copia local se desincroniza en silencio, y el síntoma llega disfrazado de "el modelo se
volvió tonto" cuando en realidad la gramática cambió y la copia no.*

---

## 5. Publicar

```bash
# Píldora
curl -X POST "$API/pildora" \
  -H "Content-Type: application/json" \
  -H "x-token-servicio: $TOKEN_SERVICIO" \
  -d @pildora.json

# Clase — ojo: viaja en un SOBRE {curso, clase}
curl -X POST "$API/clase" \
  -H "Content-Type: application/json" \
  -H "x-token-servicio: $TOKEN_SERVICIO" \
  -d @clase.json

# Reclasificar una píldora sin regenerarla
curl -X PATCH "$API/pildora/<slug>/categoria" \
  -H "Content-Type: application/json" \
  -H "x-token-servicio: $TOKEN_SERVICIO" \
  -d '{"categories": ["javascript", "asincronia"]}'
```

En Windows, `curl -d @archivo.json` funciona en Git Bash. Desde PowerShell es más fiable
`Invoke-RestMethod`:

```powershell
$h = @{ 'x-token-servicio' = $TOKEN; 'Content-Type' = 'application/json' }
Invoke-RestMethod -Method Post -Uri "$API/pildora" -Headers $h -Body (Get-Content pildora.json -Raw -Encoding utf8)
```

**Escribe el JSON a un archivo temporal antes de publicar.** Pasarlo inline se rompe con las
comillas y los acentos.

### Respuesta buena

```json
{ "success": true, "statusCode": 201,
  "data": { "slug": "event-loop", "estado": "creada", "version": 1, "avisos": [] } }
```

`estado`: `creada` · `actualizada` · `sin-cambios` (mandaste algo idéntico — **no es un error**).

### Si falla

**No reintentes lo mismo.** La API valida duro y devuelve la ruta exacta de cada campo mal, todos
juntos para que no necesites un viaje por error:

```json
{ "success": false, "statusCode": 400, "codigo": "CONTRATO_INVALIDO",
  "detail": ["blocks[7].type: \"video\" no está en el contrato. Válidos: panorama, flujo, …",
             "glossary[0].ipa: es obligatorio"] }
```

| Código | Qué pasó |
|---|---|
| `CONTRATO_INVALIDO` | la forma está mal — corrige **todos** los de `detail` y reenvía |
| `ENLACE_INEXISTENTE` | un `related.code` apunta a algo que no existe |
| `TOKEN_SERVICIO_INVALIDO` | el token de acá ya no vale — avísale a Christian |

---

## 6. Reglas duras

1. **Publicar es la única vía.** No escribas archivos de contenido (`lessons/*.js`,
   `curriculum/*.js`, JSON sueltos) en ningún repo: el contenido vive en PostgreSQL y la web y el
   celular lo leen de ahí. Un archivo generado es una copia que nadie va a leer.
2. **No copies este token a ningún otro archivo**, y menos a un repo de proyecto. Aquí está
   porque este repo es privado y es de Christian; en cualquier otro sitio es una filtración.
3. **Producción por defecto.** Si publicas en local, dilo en voz alta: no va a aparecer en el
   celular.
4. **Lee antes de escribir.** Sin el `GET /indice` previo terminas duplicando o enlazando a algo
   que no existe.

---

## 7. Rotar el token (si se filtra o Christian lo pide)

1. Genera uno nuevo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Cámbialo en **Render** → servicio `teacher-english-api` → *Environment* → `TOKEN_SERVICIO`.
   Guardar redespliega solo.
3. Cámbialo en el `.env` del repo `teacher-english` (`TOKEN_SERVICIO_PROD`).
4. Cámbialo **acá arriba**, en la sección 2.

El token viejo deja de valer en cuanto Render termina de redesplegar.
