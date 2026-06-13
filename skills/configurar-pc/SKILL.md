---
name: configurar-pc
description: >
  Configura settings.json para la máquina actual después de clonar el repo.
  Pregunta al usuario su nombre de usuario de Windows y las rutas de sus proyectos,
  luego genera el settings.json correcto para esa PC.
  Usar cuando el usuario dice "configurar pc", "setup", "cloné el repo", "configurar claude",
  o invoca /configurar-pc.
---

# Skill: Configurar PC

Cuando este skill se activa, sigue estos pasos en orden:

## Paso 1 — Detectar entorno

Antes de preguntar nada, ejecuta este comando para detectar el usuario actual:
```powershell
$env:USERNAME
```

También detecta si ya existe un `settings.json` en `.claude/`:
```powershell
Test-Path "$env:USERPROFILE\.claude\settings.json"
```

## Paso 2 — Preguntar al usuario

Presenta un resumen de lo detectado y pregunta lo siguiente (todo junto, una sola vez):

1. **Usuario de Windows confirmado**: "Detecté que tu usuario es `{USERNAME}`. ¿Es correcto?"
2. **Proyectos**: "¿Qué carpetas de proyectos quieres agregar a los permisos de Claude? (rutas completas, una por línea). Ejemplo: `C:\Users\{USERNAME}\Proyectos\MiApp`"
3. **Obsidian vaults**: "¿Tienes vaults de Obsidian? Si sí, dame las rutas."
4. **Tema**: "¿Qué tema prefieres? (light-ansi / dark / light)"

## Paso 3 — Generar settings.json

Con las respuestas, construye y escribe el archivo `settings.json` en `C:\Users\{USERNAME}\.claude\settings.json` con esta estructura:

```json
{
  "permissions": {
    "allow": [
      "Read(C:\\Users\\{USERNAME}\\{proyecto}\\**)",
      "Edit(C:\\Users\\{USERNAME}\\{proyecto}\\**)",
      "Write(C:\\Users\\{USERNAME}\\{proyecto}\\**)"
    ],
    "additionalDirectories": [
      "C:\\Users\\{USERNAME}\\{proyecto}"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": " "
      }
    ]
  },
  "effortLevel": "medium",
  "autoUpdatesChannel": "latest",
  "theme": "{tema_elegido}"
}
```

Agrega una entrada Read+Edit+Write en `allow` y una entrada en `additionalDirectories` por cada proyecto que el usuario mencionó.

Incluye siempre el propio `.claude` del usuario:
```
"Read(C:\\Users\\{USERNAME}\\.claude\\**)"
"Edit(C:\\Users\\{USERNAME}\\.claude\\**)"
"Write(C:\\Users\\{USERNAME}\\.claude\\**)"
```

## Paso 4 — Confirmar

Muestra el JSON generado antes de escribirlo y pide confirmación. Solo escribe el archivo si el usuario confirma.

Después de escribir, di: "settings.json listo para esta PC. Ya puedes usar Claude normalmente."

## Reglas

- Nunca sobreescribir sin confirmar primero
- Si ya existe settings.json, advertir y preguntar si quiere reemplazarlo
- Rutas siempre con doble backslash `\\` en el JSON
- Siempre incluir `.claude` propio en los permisos
