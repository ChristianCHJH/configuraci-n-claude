---
name: spiderman-app-tienda-despliegue
description: Publica la versión actual de la app Android Tienda (com.microapps.tienda, módulo `tienda/` del repo movilidad_escolar) en Google Play — sube el número de versión, compila el bundle firmado, pide confirmación y lo sube con Gradle Play Publisher al segmento de prueba (interna por defecto, o cerrada, abierta o producción si se pide). Úsala cuando el usuario diga "despliega la tienda", "sube la tienda", "sube la versión de la tienda", "publica la tienda en Play", "spiderman tienda", "spiderman app tienda" o invoque /spiderman-app-tienda-despliegue, opcionalmente con el segmento ("cerrada", "abierta", "producción") o un versionName ("0.2.0"). Para la app de Movilidad Escolar usar spiderman-movilidad-escolar-despliegue.
---

# Spider-Man Tienda — despliegue a Play

Sube la versión que hay **ahora** en el código de `app-android/tienda/` a Google Play.
Nunca sube sin un "sí" explícito del usuario en este mismo turno de la skill:
un versionCode subido queda gastado para siempre.

## Datos fijos

| Dato | Valor |
|---|---|
| Proyecto | `C:\Users\Christian\Proyectos\movilidad_escolar\app-android` |
| Módulo Gradle | `:tienda` (archivo `tienda/build.gradle.kts`) |
| applicationId | `com.microapps.tienda` |
| App en Play Console | «Tienda» (creada el 2026-10-08; primera versión 0.1.0 / código 1 subida a mano) |
| Plugin | Gradle Play Publisher `3.13.0` (la 4.x exige AGP 9; no actualizar) |
| Credencial | `C:\Users\Christian\.claves\play-movilidad.json` (`play-subidas@main-sphere-465303-t7.iam.gserviceaccount.com`) — la misma que Movilidad Escolar |
| Llaves en `local.properties` | `PLAY_CREDENCIALES`, `FIRMA_ARCHIVO`, `FIRMA_ALIAS`, `FIRMA_CLAVE` (compartidas con `:app`) |
| Segmento por defecto | `internal` (Prueba interna) |
| Bundle | `tienda/build/outputs/bundle/release/tienda-release.aab` |

Segmento según lo que pida el usuario:

| Usuario dice | `--track` |
|---|---|
| nada, "interna", "demo" | `internal` |
| "cerrada" | `alpha` |
| "abierta" | `beta` |
| "producción" | `production` — pedir doble confirmación |

## Pasos

1. **Chequeo previo** (en `app-android/`, sin imprimir valores secretos):
   - Existe el archivo de credencial.
   - `local.properties` tiene las 4 llaves (mostrar solo nombres: `sed 's/=.*/=***/'`).
   - Leer `versionCode` y `versionName` de `tienda/build.gradle.kts`.
   - `git branch --show-current`, `git log -1 --oneline` y `git status --short tienda/`.
   - Leer `URL_API` del buildType `release` de `tienda/build.gradle.kts` para mostrarlo en el resumen.
   Si falta algo, parar y decir qué falta y cómo se arregla (ver tabla de errores).

2. **Subir versión**: `versionCode` + 1. `versionName`: el que dio el usuario, o
   subir el último número (`0.1.0` → `0.1.1`). Editar solo `tienda/build.gradle.kts`.

3. **Compilar**: `./gradlew :tienda:bundleRelease -q`, filtrando las líneas
   `Info: Class … malformed kotlin.Metadata` (son ruido de R8, no errores).
   Confirmar que existe `tienda/build/outputs/bundle/release/tienda-release.aab`.

4. **Pedir confirmación** con `AskUserQuestion`, mostrando en la pregunta:
   app (Tienda), versión (`versionName` / código), segmento, rama + último commit,
   `URL_API` de release y si hay cambios sin commit en `tienda/`.
   Opciones: "Sí, subir" / "No, cancelar".
   Si cancela: dejar el número subido en el archivo y decirlo.

5. **Subir**:
   ```
   ./gradlew :tienda:publishReleaseBundle --track <track> 2>&1 | grep -vE "^Info: Class|malformed"
   ```
   Éxito = aparecen `App Bundle upload complete`, `Committing changes` y `BUILD SUCCESSFUL`.
   Usar siempre el prefijo `:tienda:`; nunca `publishReleaseBundle` a secas, porque
   subiría también la app de Movilidad Escolar.

6. **Commit automático**: tras un paso 5 exitoso, commitear siempre el cambio de
   versión (`tienda/build.gradle.kts`) con las reglas de `christian-commit`:
   `chore(tienda): versión <versionName>`, sin firma de Claude, sin push, solo ese
   archivo. No pedir permiso. Si el paso 5 falló o el usuario canceló, no commitear.

7. **Reportar** (modo ADHD, máx. 8 líneas): versión subida, segmento, cuánto tarda
   en llegar a los verificadores (minutos, hasta ~1 h), dónde comprobarlo
   (Play Console → Tienda → Prueba y lanza → el segmento), y el hash del commit hecho.

## Errores conocidos

| Mensaje | Causa | Arreglo |
|---|---|---|
| `Version code N has already been used` | Ese código ya está en Play | Subir `versionCode` otra vez y volver al paso 3 (re-confirmar) |
| `minimum Android Gradle Plugin version` | Alguien subió el plugin a 4.x | Volver a `playPublisher = "3.13.0"` en `gradle/libs.versions.toml` |
| `401` / `403` / `The caller does not have permission` | La cuenta de servicio no tiene permisos en la app Tienda | Play Console → Usuarios y permisos → `play-subidas@…` → agregar la app Tienda con permiso de lanzar a pruebas y a producción |
| `No credentials specified` | Falta `PLAY_CREDENCIALES` o el JSON | Agregar `PLAY_CREDENCIALES=C\:/Users/Christian/.claves/play-movilidad.json` a `local.properties` |
| `Track not found` | El segmento no existe en Play | Crearlo una vez a mano en Play Console, o usar `internal` |
| Falla la firma | Faltan `FIRMA_*` o el `.jks` | Revisar `local.properties`; el keystore nunca va al repo |

## Reglas

- Nunca imprimir el contenido del JSON ni las claves de firma.
- Nunca subir sin confirmación; en `production`, dos confirmaciones.
- No tocar código de la app más allá de `versionCode` / `versionName` de `tienda/build.gradle.kts`.
- Nunca tocar `app/build.gradle.kts` (eso es Movilidad Escolar).
- El commit del cambio de versión es automático tras subir; nunca hacer push.
- Si el paso 5 falla, no reintentar a ciegas: diagnosticar con la tabla y avisar.
