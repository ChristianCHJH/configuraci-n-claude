---
name: spiderman-hormiga-despliegue
description: Publica la versión actual de la app Android Hormiga (com.hormiga.gastos, control de gastos del hogar, repo control_gastos) en Google Play — sube el número de versión, compila el bundle firmado, pide confirmación y lo sube con Gradle Play Publisher al segmento de prueba (interna por defecto, o cerrada, abierta o producción si se pide). Úsala cuando el usuario diga "despliega hormiga", "sube hormiga", "sube la versión de hormiga", "publica hormiga en Play", "spiderman hormiga" o invoque /spiderman-hormiga-despliegue, opcionalmente con el segmento ("cerrada", "abierta", "producción") o un versionName ("2.2.0"). Para Movilidad Escolar usar spiderman-movilidad-escolar-despliegue; para la Tienda, spiderman-app-tienda-despliegue.
---

# Spider-Man Hormiga — despliegue a Play

Sube la versión que hay **ahora** en el código de `control_gastos` a Google Play.
Nunca sube sin un "sí" explícito del usuario en este mismo turno de la skill:
un versionCode subido queda gastado para siempre.

## Datos fijos

| Dato | Valor |
|---|---|
| Proyecto | `C:\Users\Christian\Proyectos\control_gastos` |
| Módulo Gradle | `:app` (archivo `app/build.gradle.kts`) |
| applicationId | `com.hormiga.gastos` |
| App en Play Console | «Hormiga» (ya tiene Prueba interna) |
| Plugin | Gradle Play Publisher `3.13.0` (la 4.x exige AGP 9; no actualizar) |
| Credencial | `C:\Users\Christian\.claves\play-movilidad.json` (`play-subidas@main-sphere-465303-t7.iam.gserviceaccount.com`), la misma de Movilidad y Tienda |
| Llave en `local.properties` | `PLAY_CREDENCIALES` |
| Firma | `keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`) + `hormiga.jks`; ninguno va al repo |
| Segmento por defecto | `internal` (Prueba interna) |
| Bundle | `app/build/outputs/bundle/release/app-release.aab` |
| Backend | microapp `hormiga` del repo `movilidad_escolar` (rutas `/api/hormiga/**`) |

Segmento según lo que pida el usuario:

| Usuario dice | `--track` |
|---|---|
| nada, "interna", "demo" | `internal` |
| "cerrada" | `alpha` |
| "abierta" | `beta` |
| "producción" | `production` — pedir doble confirmación |

## Pasos

1. **Chequeo previo** (en `control_gastos/`, sin imprimir valores secretos):
   - Existe el archivo de credencial.
   - `local.properties` tiene `PLAY_CREDENCIALES` y `keystore.properties` sus 4 llaves (mostrar solo nombres: `sed 's/=.*/=***/'`).
   - Leer `versionCode` y `versionName` de `app/build.gradle.kts`.
   - `git branch --show-current`, `git log -1 --oneline` y `git status --short`.
   - Leer `SERVIDOR_POR_DEFECTO` de `app/src/main/java/com/hormiga/gastos/data/red/ApiHormiga.kt` para mostrarlo en el resumen.
   - Comprobar que el backend responde: `curl -s -X POST <SERVIDOR>/hormiga/auth/login -H "content-type: application/json" -d '{"correo":"nadie@x.com","contrasena":"x"}'` debe dar 401 `CREDENCIALES_INVALIDAS`. Un 503 `HORMIGA_SIN_CONFIGURAR` o un 404 significa que el backend no está listo: parar y avisar.
   Si falta algo, parar y decir qué falta y cómo se arregla (ver tabla de errores).

2. **Subir versión**: `versionCode` + 1. `versionName`: el que dio el usuario, o
   subir el último número (`2.1.0` → `2.1.1`). Editar solo `app/build.gradle.kts`.

3. **Compilar**: `./gradlew :app:bundleRelease -q`, filtrando las líneas
   `Info: Class … malformed kotlin.Metadata` (ruido de R8).
   Confirmar que existe `app/build/outputs/bundle/release/app-release.aab`.

4. **Pedir confirmación** con `AskUserQuestion`, mostrando en la pregunta:
   app (Hormiga), versión (`versionName` / código), segmento, rama + último commit,
   servidor por defecto y si hay cambios sin commit.
   Opciones: "Sí, subir" / "No, cancelar".
   Si cancela: dejar el número subido en el archivo y decirlo.

5. **Subir**:
   ```
   ./gradlew :app:publishReleaseBundle --track <track> 2>&1 | grep -vE "^Info: Class|malformed"
   ```
   Éxito = aparecen `App Bundle upload complete`, `Committing changes` y `BUILD SUCCESSFUL`.

6. **Commit automático**: tras un paso 5 exitoso, commitear el cambio de versión
   (`app/build.gradle.kts`) con las reglas de `christian-commit`:
   `chore(app): versión <versionName>`, sin firma de Claude, sin push, solo ese
   archivo. No pedir permiso. Si el paso 5 falló o el usuario canceló, no commitear.

7. **Reportar** (máx. 8 líneas): versión subida, segmento, cuánto tarda en llegar a
   los verificadores (minutos, hasta ~1 h), dónde comprobarlo
   (Play Console → Hormiga → Prueba y lanza → el segmento), y el hash del commit.

## Errores conocidos

| Mensaje | Causa | Arreglo |
|---|---|---|
| `Version code N has already been used` | Ese código ya está en Play | Subir `versionCode` otra vez y volver al paso 3 (re-confirmar) |
| `minimum Android Gradle Plugin version` | Alguien subió el plugin a 4.x | Volver a `playPublisher = "3.13.0"` en `gradle/libs.versions.toml` |
| `401` / `403` / `The caller does not have permission` | La cuenta de servicio no tiene permisos en Hormiga | Play Console → Usuarios y permisos → `play-subidas@…` → agregar la app Hormiga con permiso de lanzar a pruebas y a producción |
| `No credentials specified` | Falta `PLAY_CREDENCIALES` | Agregar `PLAY_CREDENCIALES=C\:/Users/Christian/.claves/play-movilidad.json` a `local.properties` |
| `Track not found` | El segmento no existe en Play | Crearlo una vez a mano en Play Console, o usar `internal` |
| Falla la firma | Falta `keystore.properties` o `hormiga.jks` | Restaurar desde el respaldo; sin ese archivo no hay actualizaciones |
| La app instalada no se actualiza desde Play | Se instaló a mano un APK firmado con otra llave | Desinstalar y reinstalar desde el enlace de prueba (se pierden los datos locales no sincronizados) |

## Reglas

- Nunca imprimir el contenido del JSON ni las claves de firma.
- Nunca subir sin confirmación; en `production`, dos confirmaciones.
- No tocar código de la app más allá de `versionCode` / `versionName` de `app/build.gradle.kts`.
- El commit del cambio de versión es automático tras subir; nunca hacer push.
- Si el paso 5 falla, no reintentar a ciegas: diagnosticar con la tabla y avisar.
