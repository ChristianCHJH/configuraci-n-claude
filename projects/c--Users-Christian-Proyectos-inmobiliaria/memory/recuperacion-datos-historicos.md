---
name: recuperacion-datos-historicos
description: El pipeline que recorrió los 5098 documentos históricos de la inmobiliaria; terminado, sin pendientes, con cinco líneas de negocio detectadas
metadata:
  node_type: memory
  type: project
  originSessionId: 4218f190-da58-461c-9992-af4a1aafbd91
  modified: 2026-09-10T15:47:47.216Z
---

El 9 y 10 de setiembre de 2026 construí en `herramientas/analisis-documentos/` un pipeline de
22 scripts Python que recorre `documentos-inmobiliaria/` (2.1 GB, 5098 archivos, fuera de git) y
vuelca los datos de negocio a CSV planos en `documentos-inmobiliaria/_analisis/`.

**Terminado: cero archivos pendientes.** El avance marca 94.7% porque la fórmula pondera a la
mitad los 545 documentos sin contenido extraíble (fotos de DNI y vouchers cuyo dato ya viene de
las boletas). Recuperado: 928 clientes unificados (828 con documento), 1602 lotes, 3270
comprobantes, 575 contratos de compraventa, 175 cronogramas con 4501 cuotas, 16717 filas de Excel,
20 tarifas y 323 documentos leídos como imagen. 1358 de los 5098 archivos son copias exactas: solo
hay 3740 documentos reales. El tablero es `_analisis/CONTROL-ANALISIS.xlsx` (22 hojas). El informe
de negocio es `_analisis/HALLAZGOS.md`.

**Why:** Christian quería abrir cinco o seis chats con Sonnet para leer los documentos uno por uno.
Resultó innecesario para la mayor parte: las boletas SUNAT, los contratos y los cronogramas ya traen
capa de texto, y los nombres de archivo codifican tipo, monto, cliente y lote. Los regex resolvieron
el 83% sin gastar tokens; el resto lo leyeron seis agentes en paralelo sobre PNG renderizados.

**How to apply:** antes de proponer que un modelo lea documentos en masa, comprobar si ya son texto
(`pymupdf`) y si el nombre del archivo carga el dato. El orden de ejecución está en el README de esa
carpeta; `02_extraer_texto.py` cachea y salta lo ya hecho. Ojo con los montos: el acervo usa cuatro
formatos distintos (`35.000.00`, `21 000,00`, `17, 000`, `1500.00`) y `limpiar_monto()` en `comun.py`
los normaliza tomando el último separador como decimal solo si deja 1 o 2 dígitos. Ver
[[cinco-lineas-de-negocio-inmobiliaria]], [[existe-tarifario-de-precios]] y
[[nada-de-reglas-de-negocio-inventadas]].
