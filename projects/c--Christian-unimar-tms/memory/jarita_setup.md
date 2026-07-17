---
name: jarita-setup
description: Configuración e instrucciones de activación del agente Jarita
metadata: 
  node_type: memory
  type: reference
  originSessionId: 699f7a9f-b2b4-42b7-8a7c-049d88446d9c
---

# Jarita Setup & Activación

## Estado Actual

Jarita está definido en:
- `jarita_rules.md` — base de conocimiento
- `jarita_learnings.md` — registro de evolución

## Activación: Opción B (Auto-Hook)

Para que Jarita se invoque AUTOMÁTICAMENTE después de cada agente:

### Opción 1: Skill `/jarita` (Manual + comando directo)

```bash
/jarita [artefacto a revisar]
```

Ejemplo después de agente backend:
```
/jarita backend result
```

### Opción 2: Auto-hook con script shell

Agregar a `.claude/settings.json`:

```json
{
  "hooks": {
    "agent-complete": "echo 'Jarita: Revisando salida de agente...' && jarita-auto-check"
  }
}
```

(Requiere script `jarita-auto-check` que lea output del agente anterior)

### Opción 3: Loop continuo de Jarita

```bash
/loop 5m /jarita-monitor
```

Jarita vigila en background y revisa automático cada 5min.

### Opción 4: Agent persistent (Recomendado para auto-hook real)

```typescript
// Pseudo-código - ejecutable via Agent tool
Agent({
  subagent_type: "jarita",
  prompt: "Vigila los agentes. Cada que uno termina, revisa automático.",
  run_in_background: true
})
```

---

## Recomendación ACTUAL

**Usa `/jarita` skill** después de cada agente manualmente. Así:

```
[Agente X termina]
Tu: /jarita
[Jarita revisa y genera reporte]
```

Cuando quieras auto-invocación real, reconfiguramos con Agent persistent.

---

## Cómo invocar Jarita

```bash
/jarita
```

**Inputs esperados** (Jarita pregunta si faltan):
- ¿Qué agente/artefacto revisar?
- ¿Cuál fue el output?
- ¿Contexto de negocio?
- ¿Historia de aceptación?

Jarita PREGUNTA si no tiene info. No asume.

---

## Checklist Setup

- [x] `jarita_rules.md` creado
- [x] `jarita_learnings.md` creado
- [ ] Skill `/jarita` disponible
- [ ] Hook en settings.json configurado (pendiente - depende de tu decisión)
- [ ] Agente persistent Jarita corriendo (futuro)

