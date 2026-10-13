---
name: play-store-subida
description: Cómo se publican versiones de la app Android de movilidad escolar en Play Store desde Claude
metadata:
  node_type: memory
  type: project
  originSessionId: f69c4c4c-41b3-4635-9b6a-196d57771c88
  modified: 2026-10-04T21:40:55.503Z
---

La app Android (com.movilidadescolar) se publica con Gradle Play Publisher 3.13.0 (la 4.x exige un AGP más nuevo). Track por defecto: `internal` (Prueba interna). Credencial de cuenta de servicio `play-subidas@main-sphere-465303-t7.iam.gserviceaccount.com` en `C:\Users\Christian\.claves\play-movilidad.json`, referenciada por `PLAY_CREDENCIALES` en `app-android/local.properties`. Primera subida automática: 0.1.1 / versionCode 3, el 2026-10-04.

**Why:** Christian quiere subir versiones nuevas desde Claude sin entrar a Play Console.
**How to apply:** subir versionCode + versionName, luego `./gradlew :app:publishReleaseBundle` en `app-android/`. Confirmar siempre antes de subir: un versionCode usado no se recupera.

App Tienda (`com.microapps.tienda`, módulo `:tienda`): creada en Play Console el 2026-10-08, primera versión 0.1.0 / código 1 subida a mano. Se publica con la skill `spiderman-app-tienda-despliegue` (usa `:tienda:publishReleaseBundle`, misma credencial y firma).
