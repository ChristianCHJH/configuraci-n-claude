---
name: Problema des_dia NULL en descongelación de óvulos
description: Registros de hc_reprod con des_dia=NULL impiden mostrar óvulos descongelados
type: project
originSessionId: 97503bdd-e240-4565-b175-d86235492f16
---
## Problema Identificado: des_dia = NULL

**Fecha**: 2026-04-20  
**Estado**: Crítico - Bloquea visualización de óvulos descongelados  
**Severidad**: Media - Afecta fichas de descongelación

### Síntoma
En `info_ficha.php`, el bloque "Óvulos/embriones a desvitrificar" no se muestra para algunos protocolos aunque existan datos en la BD.

Ejemplo que funciona: id=27954 → muestra óvulos  
Ejemplo que NO funciona: id=28944 → no muestra nada

### Causa Raíz
En `hc_reprod`, el campo `des_dia` es NULL en algunos protocolos. El código de `info_ficha.php` (línea 178) usa este campo para decidir qué query ejecutar:

```php
if ($rep['des_dia'] > 1) {
    // Busca días 5-6 (embriones)
} else {
    // Busca día 0 (óvulos)
}
```

Si `des_dia = NULL`, la rama else se ejecuta, pero busca `d0f_cic='C'`. Si los óvulos fueron congelados el día 5 (`d5f_cic='C'`), no los encuentra.

### Condición que falla
- `hc_reprod.des_dia = NULL` ← No se ha guardado
- Pero `lab_aspira_dias` tiene datos de congelación (d0f_cic, d5f_cic, etc.)
- El query retorna 0 filas → no se muestra el bloque

### Flujo Actual (Broken)
1. Biólogo congela óvulos en `le_tanque.php`
2. Calcula `des_dia` dinámicamente basándose en qué día se marcó congelado
3. **Lo calcula pero NO lo persiste** en `hc_reprod`
4. Cuando se abre `info_ficha.php`, `des_dia = NULL` → no sabe qué columnas buscar
5. La consulta falla silenciosamente → no muestra nada

### Solución Propuesta
Crear un trigger/función PostgreSQL que:
1. Calcule `des_dia` automáticamente basándose en `lab_aspira_dias`
2. Actualice los registros existentes con `des_dia = NULL`
3. Asegure que siempre se persiste cuando se congela

### Ubicación Documentada
- Análisis completo: `C:\Users\Christian\Documents\inmater\05-TRACES\laboratorio-descongelacion-ovulos-flujo.md`

### Archivos a Revisar
- `/apps/web/info_ficha.php` línea 178-211
- `/apps/web/le_tanque.php` línea 278-325, 437-485
- `/apps/web/info_retiro.php` similar a le_tanque.php

**Why**: Datos críticos de laboratorio no se muestran, causando confusión en fichas de descongelación.

**How to apply**: Cuando se trabaje con fichas de laboratorio o descongelación, verificar que `des_dia` NO sea NULL. Si el bloque de óvulos no aparece, esta es la probable causa.
