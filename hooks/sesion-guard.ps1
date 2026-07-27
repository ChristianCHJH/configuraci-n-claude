# sesion-guard.ps1 - hook Stop
#
# ASCII PURO A PROPOSITO: PowerShell 5.1 lee los .ps1 como ANSI y rompe
# los acentos / em-dash. No meter caracteres no-ASCII en este archivo.
#
# Hace dos cosas al final de cada turno:
#   1. AUTO-SYNC: pull --rebase + commit + push en los 3 repos de memoria
#      (anti-ruido: maximo 1 sync cada $MinutosDebounce por repo)
#   2. GUARDIA DE CONTEXTO: calcula el % de ventana consumida y avisa
#      (60% = aviso temprano, 75% = cerrar y documentar con /viernes o /unimar)
#
# Entrada: JSON del hook por stdin (transcript_path, cwd, session_id)
# Salida:  JSON con hookSpecificOutput.additionalContext (o nada)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference    = 'SilentlyContinue'
$env:GIT_TERMINAL_PROMPT = '0'   # que git jamas se cuelgue pidiendo credenciales

# ---------------------------------------------------------------- configuracion
$Repos = @(
    'C:\Users\cjara\.claude',
    'C:\Christian\Unimar_obsidian',
    'C:\Christian\Christian Personal\viernes-obsidean'
)
$MinutosDebounce = 10
$UmbralAviso     = 60
$UmbralAlto      = 75

$EstadoDir = Join-Path $env:USERPROFILE '.claude\session-env'
if (-not (Test-Path $EstadoDir)) { New-Item -ItemType Directory -Path $EstadoDir -Force | Out-Null }

# ---------------------------------------------------------------- leer stdin
$raw = [Console]::In.ReadToEnd()
if (-not $raw) { $raw = ($input | Out-String) }   # fallback si llega por pipeline
$hook = $null
if ($raw) { $hook = $raw | ConvertFrom-Json }
$transcript = $null
if ($hook) { $transcript = $hook.transcript_path }

$avisos = New-Object System.Collections.Generic.List[string]

# ================================================================ 1) AUTO-SYNC
foreach ($repo in $Repos) {
    if (-not (Test-Path (Join-Path $repo '.git'))) { continue }

    # anti-ruido: un sync por repo cada N minutos
    $slug  = ($repo -replace '[:\\ ]', '-')
    $stamp = Join-Path $EstadoDir "autosync$slug.stamp"
    if (Test-Path $stamp) {
        $ultimo = (Get-Item $stamp).LastWriteTime
        if (((Get-Date) - $ultimo).TotalMinutes -lt $MinutosDebounce) { continue }
    }

    # OJO: todo git va silenciado. Cualquier texto suelto en stdout corrompe
    # el JSON que el hook le devuelve a Claude Code.
    $sucio      = & git -C $repo status --porcelain 2>$null
    $sinPushear = & git -C $repo log '@{u}..HEAD' --oneline 2>$null
    if (-not $sucio -and -not $sinPushear) { continue }

    # traer lo remoto primero (autostash protege el working tree sucio)
    $null = & git -C $repo pull --rebase --autostash --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
        $null = & git -C $repo rebase --abort 2>&1
        $avisos.Add("AUTO-SYNC BLOQUEADO en ${repo}: el pull --rebase entro en conflicto y se aborto. Avisale a Christian que hay que resolverlo a mano; no se hizo commit ni push.")
        continue
    }

    if (& git -C $repo status --porcelain 2>$null) {
        $fecha = Get-Date -Format 'yyyy-MM-dd HH:mm'
        $null = & git -C $repo add -A 2>&1
        $null = & git -C $repo commit -m "chore(auto): sincronizacion automatica $fecha" --quiet 2>&1
    }

    $null = & git -C $repo push --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
        $avisos.Add("AUTO-SYNC: el push a $repo fallo. Los cambios estan commiteados en local pero NO en el remoto.")
        continue
    }

    Set-Content -Path $stamp -Value (Get-Date -Format 'o') -Encoding utf8
}

# ================================================================ 2) CONTEXTO
if ($transcript -and (Test-Path $transcript)) {

    # ultima linea con usage = tokens de contexto realmente cargados
    $usados = 0
    $modelo = ''
    $cola = Get-Content $transcript -Tail 60
    for ($i = $cola.Count - 1; $i -ge 0; $i--) {
        if ($cola[$i] -notmatch '"usage"') { continue }
        $obj = $cola[$i] | ConvertFrom-Json
        $u = $null
        if ($obj.message) { $u = $obj.message.usage }
        if (-not $u) { continue }
        $usados = [int]$u.input_tokens + [int]$u.cache_creation_input_tokens + [int]$u.cache_read_input_tokens
        if ($obj.message.model) { $modelo = [string]$obj.message.model }
        break
    }

    if ($usados -gt 0) {
        # OJO: el campo "model" del transcript viene SIN el sufijo de ventana
        # ("claude-opus-5", no "claude-opus-5[1m]"), asi que no sirve para esto.
        # El marcador [1m] si aparece en el bloque de entorno del system prompt.
        $ventana = 200000
        if (Select-String -Path $transcript -Pattern '[1m]' -SimpleMatch -Quiet) { $ventana = 1000000 }
        # red de seguridad: si ya pasamos los 190k, la ventana no era de 200k
        if ($usados -gt 190000) { $ventana = 1000000 }
        $pct = [math]::Round(($usados / $ventana) * 100)

        if ($pct -ge $UmbralAviso) {
            # que despertar se uso en esta sesion: define quien documenta
            $modo = ''
            $todo = Get-Content $transcript -Raw
            if ($todo -match 'despertar-unimar')  { $modo = '/unimar' }
            elseif ($todo -match 'despertar')     { $modo = '/viernes' }

            $miles  = [math]::Round($usados / 1000)
            $vmiles = [math]::Round($ventana / 1000)
            $cifra  = "$pct% (${miles}k de ${vmiles}k)"

            if ($pct -ge $UmbralAlto) {
                $m = "CONTEXTO AL $cifra. PUNTO DE CORTE: esta conversacion ya no es productiva y el auto-compact esta cerca (perderia detalle). ACCION OBLIGATORIA AHORA: "
                if ($modo) {
                    $m += "cierra lo que estes haciendo, ejecuta $modo para documentar TODO lo trabajado en esta sesion, confirma que quedo guardado y dile a Christian que abra un chat nuevo."
                } else {
                    $m += "cierra el trabajo pendiente, documenta lo trabajado y dile a Christian que abra un chat nuevo."
                }
                $avisos.Add($m)
            } else {
                $m = "CONTEXTO AL $cifra. Aviso temprano: ve cerrando el hilo. "
                if ($modo) { $m += "Al llegar a $UmbralAlto% habra que ejecutar $modo y pasar a un chat nuevo. " }
                $m += "Mencionaselo a Christian UNA sola vez, sin repetirlo cada turno."
                $avisos.Add($m)
            }
        }
    }
}

# ---------------------------------------------------------------- salida
if ($avisos.Count -gt 0) {
    $texto = $avisos -join "`n"
    $salida = @{
        hookSpecificOutput = @{
            hookEventName     = 'Stop'
            additionalContext = $texto
        }
    }
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output ($salida | ConvertTo-Json -Compress -Depth 5)
}
