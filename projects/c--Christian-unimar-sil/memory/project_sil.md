---
name: project-sil
description: SIL — Sistema Integrado Logístico. Nuevo proyecto en unimar-sil. Reemplaza Excel+correo para gestión de exportaciones marítimas de Unimar. NestJS + Angular + PostgreSQL. MVP 3 meses.
metadata: 
  node_type: memory
  type: project
  originSessionId: e5f54abc-d4e6-45b8-8f14-d2066b5a4706
---

# Proyecto SIL — Sistema Integrado Logístico

**Repo:** `c:\Christian\unimar-sil`
**Estado:** Fase 0 — Setup (premisas pendientes, desarrollo no iniciado)
**PRD:** `docs/prd.md` · v0.9.0 · Identificador `PRD-SIL-001`

## Qué es

Plataforma web + PWA que reemplaza el cuadro Excel + correos + llamadas para gestionar el ciclo completo de exportación marítima de Unimar S.A. desde Callao y Piura.

**Why:** Sin trazabilidad digital, incidentes no se reportan a tiempo, documentación se pierde, el Coordinador pasa horas consolidando info dispersa.

## Stack decidido

- Backend: **NestJS** + TypeORM + PostgreSQL (estándar Unimar Arch, confirmación pendiente del Arquitecto)
- Frontend: **Angular 17+** + PrimeNG + Tailwind CSS
- Auth MVP: JWT propio → migra a SSO (Sistema de Usuarios suite)
- Notif MVP: Email SMTP → migra a HUB Notificaciones en v2
- Branch strategy: GitFlow adaptado (ADR-0050): `main`, `develop`, `qa`, `uat`, `feature/*`, `dev/<nombre>/<tarea>`, `release/*`, `hotfix/*`

## Usuarios (15-20 operativos)

Coordinador Logístico (Callao/Piura), Coordinador de Transporte (Callao), Asistente Logístico (Piura), Jefe de Seguridad, Agente de Aduana (externo), Cliente Exportador (externo).

## Timeline del servicio (9 hitos)

`Planificado → Transporte Asignado → En Ruta a Planta → Llenado → En Ruta a Terminal → Canal Aduanero → Embarque → Gestión Documentaria → Cerrado`

## Fase 0 — Premisas CRÍTICAS (prerequisito del desarrollo)

| ID | Tarea | Fecha límite |
|---|---|---|
| P-01 | Inventario dominios data maestra | **2026-06-22** |
| P-02 | Mapeo SAP → MMS | 2026-06-29 |
| P-03 | Dominios propios de SIL | 2026-06-29 |
| P-04 | Contrato integración MMS | 2026-07-06 |
| P-05 | Setup transporte dual (API + manual) | **2026-06-22** |
| P-06 | Setup pedido venta SAP dual | **2026-06-22** |

Sin estas premisas no se puede diseñar el modelo de datos.

## Decisiones arquitectónicas clave

- **D-005/D-007:** Modo dual obligatorio — formularios manuales son feature permanente, no parche
- **D-009:** Auth JWT propia en MVP
- **D-010:** Email SMTP en MVP para siniestros/alertas
- **ADR-0050:** GitFlow adaptado ya documentado

## Alcance MVP

CRUD órdenes, registro transporte manual, timeline visual, incidencias + protocolo siniestros, precintos con foto obligatoria, gestión documentaria (DAM/BL/factura), cuadro de control digital.

## Fuera del alcance v1

Contabilidad/ERP, RRHH, marketplace transportistas, importaciones, portal clientes, app nativa.

## Wiki Unimar

Páginas creadas: `wiki/proyectos/sil.md` y `wiki/proyectos/sil-fases.md` en `C:\Christian\Unimar_obsidian`

**How to apply:** Al trabajar en unimar-sil, este es el proyecto. Las premisas P-01 a P-06 son prerequisito del modelo de datos — no lanzar desarrollo sin ellas. Siempre respetar modo dual (manual + API) para SAP y Transportes.
