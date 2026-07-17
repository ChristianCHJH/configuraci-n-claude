# Plan: Generar archivo MD con plan de avance TMS

## Contexto

El PRD del TMS (`_bmad-output/planning-artifacts/prd-sistema-gestion-transportes.es.md`) está en borrador. Mañana hay una reunión para cerrarlo. El usuario quiere avanzar YA con lo que está definido y documentar ese plan de avance en un archivo MD dentro del proyecto.

## Archivo a crear

**Ruta:** `_bmad-output/planning-artifacts/plan-avance-mvp-fase1.es.md`

**Convención:** sigue el patrón del proyecto — kebab-case, sufijo `.es.md`, prefijo de tipo (`plan-`), en la misma carpeta que el PRD.

## Contenido del archivo

El archivo debe documentar:

### 1. Verde — Avanzar YA (sin esperar PRD final)
- **ADR-0001** — Stack confirmado: NestJS, PostgreSQL, Angular+Tailwind (ya existe en `reference/architecture/adrs/`)
- **Modelo de datos** — Entidades core:
  - `relacion_detallada` (de SAP)
  - `solicitud_transporte`
  - `viaje`
  - `transportista`, `chofer`, `unidad_vehicular`
  - Columnas audit estándar (ver CLAUDE.md)
- **Estructura de repositorio** — Carpetas backend/frontend, módulos NestJS por dominio
- **Contratos de integración:** SAP BAPI (relaciones detalladas, maestros batch), DPWORLD/APM (citas)
- **Docker Compose** — Postgres, backend, frontend local

### 2. Rojo — Esperar reunión (PRD cerrado)
- Criterios de aceptación finales (CA-01 a CA-19)
- Prototipos Figma validados por UX (A.4 en PRD)
- Valores {X}/{Y}/{Z} de volumen operativo real
- Tests de aceptación detallados

### 3. Pendientes reunión mañana
- Datos operativos: contenedores/mes, viajes/mes, transportistas activos
- Aprobación Negocio + Arquitectura
- Confirmar Figma como fuente de verdad UI/UX

## Verificación

Revisar que el archivo creado:
1. Sigue convención `_bmad-output/planning-artifacts/plan-*.es.md`
2. Contiene tabla "Verde/Rojo" escaneables rápidamente
3. Lista entidades con columnas audit según estándar CLAUDE.md
4. Referencia el PRD (`PRD-TMS-001`) y los ADRs existentes
