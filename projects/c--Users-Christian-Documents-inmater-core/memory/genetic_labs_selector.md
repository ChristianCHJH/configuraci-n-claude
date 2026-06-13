---
name: Genetic Labs Selector (Centogene vs IGenomix)
description: How to determine which genetic lab report to show (Centogene or IGenomix) based on laboratorio_genetico column
type: project
originSessionId: 47091140-3a83-4c08-8889-b86c3c1c1b52
---
## Overview
The system supports two genetic testing labs: **CENTOGENE** and **IGENOMIX**. The selection happens through a selector form and is stored in the `lab_aspira` table.

**Status:** Feature in branch `feat/centogene-trf-support` (not yet merged to main as of 2026-04-20)

## Database Column

**Table:** `lab_aspira`  
**Column:** `laboratorio_genetico` (INTEGER)

| Value | Lab | Report Link |
|-------|-----|------------|
| `1` | IGENOMIX | `info_igenomix_new.php` |
| `2` | CENTOGENE | `info_centogene_new.php` |
| `null` | Unselected | `selector_laboratorio.php` (form to choose) |

## Query Function

**File:** `_database/cento_informe.php`

```php
function obtener_laboratorio_genetico($protocolo)
{
  global $db;
  $stmt = $db->prepare("SELECT laboratorio_genetico FROM lab_aspira WHERE pro = ? AND estado IS TRUE;");
  $stmt->execute([$protocolo]);
  
  if ($stmt->rowCount() > 0) {
    return $stmt->fetch(PDO::FETCH_ASSOC)["laboratorio_genetico"];
  }
  return null;
}
```

## Logic in le_aspi6.php (lines 980-991)

Shows genetic report links **only if** `pago_extras` contains `"NGS"`:

```php
if (strpos($paci['pago_extras'], "NGS") !== false) {
  // Show NGS info link
  // Then check which lab was selected:
  
  require_once($_SERVER["DOCUMENT_ROOT"] . "/_database/cento_informe.php");
  $lab_gen = obtener_laboratorio_genetico($paci['pro']);
  
  if ($lab_gen == 2) {
    // Show CENTOGENE report
    print('<b><small>, <i>Informe CENTOGENE:</i></small></b> <a href="info_centogene_new.php?path=le_aspi6&pro='.$paci['pro'].'">...');
  } elseif ($lab_gen == 1) {
    // Show IGENOMIX 2024 report
    print('<b><small>, <i>Informe IGenomix 2024:</i></small></b> <a href="info_igenomix_new.php?path=le_aspi6&pro='.$paci['pro'].'">...');
  } else {
    // Lab not yet selected - show selector form
    print('<b><small>, <i>Informe Genetico:</i></small></b> <a href="selector_laboratorio.php?path=le_aspi6&pro='.$paci['pro'].'">...');
  }
}
```

## Related Files

- `selector_laboratorio.php` — Form to select lab (stores choice in DB)
- `info_centogene_new.php` — Centogene report form (973 lines)
- `cento_informe.php` — All Centogene DB functions (551 lines)
- `css/info_centogene_new.css` — Centogene styling (453 lines)

## Key Function

`guardar_laboratorio_genetico($protocolo, $lab_id)` — Saves the selection

## Branch Info

**Branch:** `feat/centogene-trf-support`  
**Commit:** 2c8077e8a06a325902b8478f8902bb85e00d8834  
**Author:** jvilla23 (Jose Villasante)  
**Date:** 2026-04-01
