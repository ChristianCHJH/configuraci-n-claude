export const meta = {
  name: 'verify-prd-tms-v050',
  description: 'Verifica adversarialmente que el PRD TMS v0.5.0 refleje fielmente la Parte III del análisis (checklist §17) sin inventar ni filtrar contenido técnico',
  phases: [
    { title: 'Revisar', detail: '4 lentes independientes sobre el PRD reescrito' },
    { title: 'Sintetizar', detail: 'merge, dedup, checklist §17 y veredicto' }
  ]
}

const ANALISIS = 'c:/Christian/unimar_tms/ANALISIS_DOCUMENTOS.md'
const PRD = 'c:/Christian/unimar_tms/_bmad-output/planning-artifacts/prd-sistema-gestion-transportes.es.md'

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lens: { type: 'string' },
    coverage_note: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          prd_section: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          category: { type: 'string' },
          issue: { type: 'string' },
          source_evidence: { type: 'string' },
          prd_evidence: { type: 'string' },
          suggested_fix: { type: 'string' }
        },
        required: ['prd_section', 'severity', 'issue', 'suggested_fix']
      }
    }
  },
  required: ['lens', 'findings']
}

const SYNTH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    checklist_17: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          item: { type: 'string' },
          status: { type: 'string', enum: ['covered', 'partial', 'missing'] },
          evidence: { type: 'string' }
        },
        required: ['item', 'status', 'evidence']
      }
    },
    prioritized_findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          prd_section: { type: 'string' },
          issue: { type: 'string' },
          suggested_fix: { type: 'string' },
          lenses_agreeing: { type: 'number' }
        },
        required: ['severity', 'prd_section', 'issue', 'suggested_fix']
      }
    },
    invented_content: { type: 'array', items: { type: 'string' } },
    technical_leaks: { type: 'array', items: { type: 'string' } },
    overall_verdict: { type: 'string' }
  },
  required: ['checklist_17', 'prioritized_findings', 'invented_content', 'technical_leaks', 'overall_verdict']
}

const base = `Contexto: se reescribió el PRD del TMS a la versión 0.5.0-draft para alinearlo a la PARTE III del análisis de documentos, que es la FUENTE DE VERDAD y prevalece sobre todo.

Archivos (leelos COMPLETOS con Read):
- Análisis (fuente de verdad): ${ANALISIS}  — foco en la PARTE III (líneas ~529-704: §8 distinción de fases, §9 alcance 3 pilares, §10 app UNITRANS/ejecución, §11 GRE, §12 trazabilidad de carga, §13 QR/documentos, §14 dos interfaces, §15 integración SAP, §16 puntos abiertos, §17 checklist de impacto en el PRD).
- PRD reescrito a verificar: ${PRD}

Regla dura del PRD: es SOLO FUNCIONAL. No debe contener stack tecnológico, arquitectura, protocolos de integración (API/BAPI/WS), mecanismo de conexión SAP, nombres de BD, ni jerga técnica. El "cómo" técnico va en arquitectura, no aquí.

Devolvé SOLO hallazgos REALES y accionables (no estilísticos triviales). Para cada hallazgo: sección del PRD, severidad, el problema, la evidencia en la fuente (Parte III) y la corrección sugerida.`

const LENSES = [
  { key: 'completitud', prompt: `${base}\n\nTU LENTE = COMPLETITUD vs §17. Recorré CADA uno de los 8 bullets del §17 del análisis y cada decisión firme de §9-§16 (re-etiquetar fases; reintroducir canal del conductor F-07/F-15/F-16/F-23 y RN-06/21/22; GRE Remitente impo camino cita, trama sin carga, momento antes de Salida IP, cascada de contingencias, botón inteligente ver/generar; trazabilidad de carga obligatoria pero GRE independiente, descripción desde SAP, cantidades parciales, dos confirmaciones, validaciones bultos/peso; atributos de mercancía SICNI/sensible/resguardo; QR de accesos ≠ GRE; captura de documentos ticket salida; dos interfaces app UNITRANS vs web empresa transportista + admin usuarios por empresa; multi-sede Callao+Paita; solo Depósito Temporal; expo ejecución parcial sin GRE; puntos abiertos §16). Reportá TODO lo que falte o esté incompleto en el PRD v0.5.0.` },
  { key: 'fidelidad', prompt: `${base}\n\nTU LENTE = FIDELIDAD / NO-INVENCIÓN. Comprobá que cada afirmación del PRD esté RESPALDADA por la Parte III. Marcá: (a) contenido INVENTADO que no aparece en el análisis; (b) decisiones distorsionadas (p.ej. GRE debe ser SOLO importación y SOLO GRE Remitente; camino = cita/orden de entrega; la GRE NO lleva datos de carga; se genera ANTES de Salida IP; orden de cascada conductor→web→SAP→físico; dos confirmaciones distintas guardar-dato vs transmitir-GRE); (c) números/hechos incorrectos. Si algo del PRD contradice la Parte III, es hallazgo critical.` },
  { key: 'consistencia', prompt: `${base}\n\nTU LENTE = CONSISTENCIA INTERNA. Verificá: etiquetas de fase coherentes en todo el doc (§2.2/§2.3/§2.5/§5/§7/§8); referencias a F-xx y RN-xx que existan y no queden colgadas (F-18 fue eliminada en versiones previas: no debe re-aparecer; F-22 debe estar como entrega posterior; F-25..F-32 nuevas; RN-01..RN-67 contiguas); rangos en Criterios de Aceptación (F-01..F-32, RN-01..RN-67) correctos; MoSCoW presente en todas las RN; términos usados y definidos en el glosario; §9.3 puntos abiertos PA-01..PA-06 presentes; changelog 0.5.0 refleja los cambios.` },
  { key: 'funcional', prompt: `${base}\n\nTU LENTE = FUNCIONAL-PURO. Detectá cualquier FILTRACIÓN técnica que no debería estar en un PRD funcional: stack, arquitectura, protocolos, mecanismo API/archivo de SAP, motores de BD, nombres de transacciones SAP como requisito técnico, jerga de implementación. Ojo: mencionar SAP como origen funcional de datos SÍ es válido; describir CÓMO conectarse NO. Reportá cada filtración con su sección.` }
]

const reviews = await parallel(LENSES.map(l => () =>
  agent(l.prompt, { label: `revisar:${l.key}`, phase: 'Revisar', schema: FINDINGS_SCHEMA })
))

const valid = reviews.filter(Boolean)
log(`${valid.length}/4 lentes completaron; ${valid.reduce((n, r) => n + (r.findings?.length || 0), 0)} hallazgos brutos`)

const synth = await agent(
  `${base}\n\nSos el SINTETIZADOR. Aquí están los hallazgos de las 4 lentes (JSON):\n\n${JSON.stringify(valid, null, 2)}\n\nLeé también el PRD y el análisis directamente para confirmar. Producí: (1) checklist_17 = estado (covered/partial/missing) de cada uno de los 8 bullets del §17 con evidencia; (2) prioritized_findings = hallazgos deduplicados y ordenados por severidad (critical primero), indicando cuántas lentes coinciden; (3) invented_content = lista de cosas en el PRD sin respaldo en la fuente; (4) technical_leaks = filtraciones técnicas; (5) overall_verdict = 1-2 frases. Sé estricto: si dos lentes reportan lo mismo, unificá.`,
  { label: 'sintetizar', phase: 'Sintetizar', schema: SYNTH_SCHEMA, effort: 'high' }
)

return synth