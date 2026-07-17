---
name: jarita-ense-a-rules
description: Sistema de enseñanza interactivo v2 - HTMLs educativos con pestañas sticky, glosario a la mano, tooltips, desglose de términos, flujos animados y modo máquina
metadata:
  node_type: memory
  type: reference
  version: 2
  last_updated: 2026-07-09
  originSessionId: 699f7a9f-b2b4-42b7-8a7c-049d88446d9c
---

# Jarita Enseña - Sistema de Aprendizaje Interactivo (v2)

## Misión

Cuando Christian no entienda un concepto/término de la documentación o conversación:

```
/jarita-enseña [concepto]
```

Jarita genera un **HTML educativo interactivo** con:
- Explicación didáctica en **español de Perú**
- Navegación por **pestañas sticky** (el glosario siempre a un clic)
- Términos técnicos **subrayados con tooltip** al pasar el mouse
- **Desglose palabra por palabra** de todo término en inglés
- **Flujos ilustrados** interactivos paso a paso
- **Modo máquina** cuando el tema es código/runtime (cómo funciona por dentro, hasta la raíz)
- Términos en **inglés** con pronunciación (IPA + aproximada + botón 🔊)
- **Quiz** con feedback inmediato
- Analogías del mundo real (preferir mundo Unimar)

Los documentos de referencia de calidad (lo que a Christian le encantó) son:
- `prd-tms.html` → pestañas, flujo paso a paso, glosario buscable, quiz
- `runtime-nodejs.html` → modo máquina: pipeline V8 animado, panel terminal, event loop animado

---

## REGLA 0: Español de Perú (INNEGOCIABLE)

Trato de **tú**, jamás voseo argentino/rioplatense.

| ❌ PROHIBIDO (voseo) | ✅ CORRECTO (Perú) |
|---|---|
| vos | tú |
| leé, mirá, tocá, marcá, elegí, anclá, filtrá, buscá, preguntá, apretá | lee, mira, toca, marca, elige, ancla, filtra, busca, pregunta, presiona |
| recorré, andá, probate | recorre, ve / avanza, ponte a prueba |
| podés, sabés, entendés, querés, tenés, creés, conocés, usás, pensás, buscás, cambiás, copiás, necesitás, hablás, escribís, corrés, perdés | puedes, sabes, entiendes, quieres, tienes, crees, conoces, usas, piensas, buscas, cambias, copias, necesitas, hablas, escribes, corres, pierdes |
| ¿recordás? | ¿recuerdas? |
| acá (aceptable pero preferir) | aquí |
| "anda / no anda" con sentido de "funciona" (rioplatense) | funciona / no funciona |

**Verificación obligatoria antes de entregar**: grep sobre el HTML generado con este patrón y corregir todo match:

```
\bvos\b|leé|mirá|tocá|marcá|elegí|recorré|andá|apretá|podés|sabés|entendés|querés|tenés|creés|conocés|usás|pensás|buscás|buscá|cambiás|copiás|necesitás|hablás|escribís|corrés|perdés|pisás|recordás|probate|anclá|filtrá|preguntá|no anda
```

---

## REGLA 1: Palabras mal escritas → deducir e ilustrar

Christian a veces escribe rápido con errores de tipeo ("dcuemtno" = documento, "event lup" = event loop, "alabara" = palabra).

- **Nunca rechazar ni pedir que corrija**: deducir el término por contexto
- Confirmar en UNA línea: "Entiendo que hablas de *event loop*, ¿correcto?" y seguir
- El término deducido se trata como cualquier otro: se ilustra, se desglosa y se profundiza

---

## REGLA 2: Desglose 100% de términos

**Todo término en inglés** se descompone palabra por palabra: traducción literal + significado técnico + pronunciación. Nada se deja como "palabra mágica".

Ejemplo del formato:

> **event loop** /ɪˈvɛnt luːp/ 🔊
> - *event* = evento, suceso (algo que pasa)
> - *loop* = bucle, ciclo (algo que da vueltas sin parar)
> - → **"bucle de eventos"**: un ciclo infinito que revisa si hay tareas pendientes y las atiende una por una

**Términos técnicos en español también se explican** (trazabilidad, idempotencia, concurrencia, latencia...): definición simple + ejemplo del mundo Unimar. No asumir que se conocen.

Snippet de tarjeta de desglose (requiere la función `say()` y la clase `.sayb` del snippet 4 — Glosario; incluirlas siempre en la misma página):

```html
<style>
.desglose{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--violet);border-radius:10px;padding:14px 16px;margin:10px 0}
.desglose .term{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.desglose .term b{color:var(--navy);font-size:1.05em}
.desglose .ipa{color:var(--violet);font-style:italic;font-size:.85em}
.desglose ul{list-style:none;padding:0;margin:0}
.desglose li{padding:3px 0;font-size:.92em}
.desglose li i{color:var(--cyan);font-weight:700;font-style:normal}
.desglose .final{margin-top:8px;background:var(--sky);border-radius:8px;padding:8px 12px;font-size:.9em}
</style>
<div class="desglose">
  <div class="term"><b>event loop</b><span class="ipa">/ɪˈvɛnt luːp/</span>
    <button class="sayb" onclick="say('event loop')">🔊</button></div>
  <ul>
    <li><i>event</i> = evento, suceso (algo que pasa)</li>
    <li><i>loop</i> = bucle, ciclo (algo que da vueltas sin parar)</li>
  </ul>
  <div class="final">→ <b>"bucle de eventos"</b>: ciclo infinito que revisa si hay tareas pendientes y las atiende una por una.</div>
</div>
```

---

## Estructura del documento: PESTAÑAS, no scroll infinito

El documento se organiza con **navbar sticky de pestañas** (patrón prd-tms.html). El glosario y el quiz son pestañas SIEMPRE presentes — el vocabulario está a un clic desde cualquier parte, nunca solo al final.

Pestañas típicas (adaptar al tema):

1. 🗺️ **Panorama** (EMPIEZA AQUÍ) → pregunta gancho + historia + qué es (2 capas) + analogía dibujada
2. 🔄 **Flujo** (CÓMO FLUYE) → flujo interactivo paso a paso
3. 🧩 **Partes** → componentes, cada uno con término EN desglosado
4. ⚙️ **Modo máquina** (POR DENTRO) → solo si el tema es código/runtime
5. ⚠️ **Errores** (CUIDADO CON) → errores típicos + antes/después
6. 🏗️ **En Unimar** → ejemplo real del proyecto
7. 📖 **Glosario** (PALABRAS) → cards buscables + desgloses + 🔊
8. ✅ **Quiz** (¿ENTENDÍ?) → quiz + respuesta a la pregunta gancho + mantra + checklist + recursos

Archivo: `C:\Users\cjara\aprendizajes\[concepto-slug].html`

---

## Patrones UI obligatorios (snippets de referencia)

### 0. Tokens de color base (`:root`) — prerequisito de todos los snippets

```css
:root{
  --navy:#042139; --navy2:#0f3e67; --blue:#2f7fd6; --sky:#e8f2fb;
  --green:#16a34a; --red:#dc2626; --amber:#d97706; --violet:#7c3aed; --cyan:#0891b2;
  --ink:#1b2a3a; --muted:#5b6b7b; --line:#d9e2ec; --bg:#f4f7fb; --card:#ffffff;
}
body{font-family:'Segoe UI',Tahoma,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
```

### 1. Navbar sticky de pestañas (tabs + panels)

Cada tab lleva micro-rótulo superior (.n) tipo "EMPIEZA AQUÍ / PALABRAS / ¿ENTENDÍ?". Panel activo entra con fade. Al cambiar, scroll suave al top.

```html
<style>
.tabs{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:0;background:var(--bg);padding:12px 0;z-index:30;border-bottom:2px solid var(--line)}
.tab{flex:1;min-width:120px;padding:11px 10px;border:2px solid var(--line);border-radius:11px;background:var(--card);cursor:pointer;font-weight:700;color:var(--muted);transition:.2s;text-align:center;font-size:.9em}
.tab .n{display:block;font-size:.68em;font-weight:600;opacity:.7}
.tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.tab:hover:not(.active){border-color:var(--blue);color:var(--navy)}
.panel{display:none;animation:fade .35s}
.panel.active{display:block}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
</style>
<!-- REGLA: cada tab data-p="X" DEBE tener su <div class="panel" id="X"> — si falta, el clic rompe la página -->
<div class="tabs">
  <div class="tab active" data-p="p1"><span class="n">EMPIEZA AQUÍ</span>🗺️ Panorama</div>
  <div class="tab" data-p="p7"><span class="n">PALABRAS</span>📖 Glosario</div>
  <div class="tab" data-p="p8"><span class="n">¿ENTENDÍ?</span>✅ Quiz</div>
</div>
<div class="panel active" id="p1">…</div>
<div class="panel" id="p7">…</div>
<div class="panel" id="p8">…</div>
<script>
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.p).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
});
</script>
```

### 2. Términos subrayados con tooltip (glosario inline)

TODA palabra técnica en el texto va con subrayado punteado; al pasar el mouse muestra su significado. Complementa (no reemplaza) la pestaña Glosario.

```html
<style>
.gl{border-bottom:2px dotted var(--cyan);cursor:help;position:relative;font-weight:600}
.gl::after{content:attr(data-def);position:absolute;left:50%;bottom:125%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:8px 12px;border-radius:8px;font-size:.8em;font-weight:400;width:max-content;max-width:260px;opacity:0;pointer-events:none;transition:.15s;z-index:40}
.gl:hover::after,.gl:focus::after,.gl.tap::after{opacity:1}
</style>
<p>La <span class="gl" tabindex="0" data-def="Guía de Remisión Electrónica: sustenta el traslado ante SUNAT">GRE</span> se emite dentro del puerto.</p>
<script>
/* fallback táctil: tocar el término alterna el tooltip */
document.querySelectorAll('.gl').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('tap')));
</script>
```

### 3. Flujo interactivo paso a paso

Tarjetas numeradas conectadas por flechas; clic en tarjeta resalta y muestra detalle; botón ▶ "Recorrer paso a paso" recorre automático; toggle de modos si hay variantes (ej. importación/exportación). Data-driven.

```html
<style>
.flowbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0;flex-wrap:wrap}
.playbtn{background:var(--blue);color:#fff;border:none;padding:10px 16px;border-radius:10px;cursor:pointer;font-weight:700}
.toggle-flow button{background:var(--card);border:2px solid var(--line);color:var(--muted);padding:8px 14px;border-radius:10px;cursor:pointer;font-weight:700}
.toggle-flow button.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.flow{display:flex;flex-wrap:wrap;align-items:stretch}
.step{flex:1;min-width:135px;position:relative;background:var(--card);border:2px solid var(--line);border-radius:12px;padding:14px 10px 12px;margin:12px 18px 12px 0;cursor:pointer;transition:.2s}
.step:hover{border-color:var(--blue);transform:translateY(-3px);box-shadow:0 8px 20px rgba(15,62,103,.12)}
.step.lit{border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,127,214,.28)}
.step::after{content:"▸";position:absolute;right:-15px;top:50%;transform:translateY(-50%);color:var(--line);font-size:1.4em;font-weight:900}
.step:last-child::after{content:""}
.step .num{position:absolute;top:-11px;left:10px;background:var(--navy);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.78em;font-weight:700}
.step .ic{font-size:1.5em}
.step .t{font-weight:700;color:var(--navy);font-size:.9em;margin:4px 0 2px}
.step .f{font-size:.68em;color:var(--blue);font-weight:700}
.detail{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--blue);border-radius:10px;padding:16px 18px;margin:12px 0;min-height:70px}
.detail.empty{color:var(--muted);font-style:italic;border-left-color:var(--line)}
@media(max-width:820px){.step{margin-right:12px}.step::after{display:none}}
</style>
<div class="flowbar">
  <div class="toggle-flow">
    <button class="active" data-mode="impo">📥 Modo A</button>
    <button data-mode="expo">📤 Modo B</button>
  </div>
  <button class="playbtn" id="playFlow">▶ Recorrer paso a paso</button>
</div>
<div class="flow" id="flowSteps"></div>
<div class="detail empty" id="flowDetail">👆 Toca un paso de arriba para ver el detalle.</div>
<script>
const FLOWS={
  impo:[{n:1,ic:'📨',t:'Paso uno',f:'F-01',d:'Detalle <b>HTML</b> del paso.'},{n:2,ic:'📝',t:'Paso dos',f:'F-02',d:'Otro detalle.'}],
  expo:[{n:1,ic:'📨',t:'Variante',f:'F-01',d:'Detalle variante.'}]
};
let flowMode='impo';
function renderFlow(){
  const cont=document.getElementById('flowSteps');cont.innerHTML='';
  FLOWS[flowMode].forEach(s=>{
    const div=document.createElement('div');div.className='step';
    div.innerHTML=`<span class="num">${s.n}</span><div class="ic">${s.ic}</div><div class="t">${s.t}</div><div class="f">${s.f}</div>`;
    div.addEventListener('click',()=>{
      document.querySelectorAll('#flowSteps .step').forEach(x=>x.classList.remove('lit'));
      div.classList.add('lit');
      const dt=document.getElementById('flowDetail');
      dt.classList.remove('empty');dt.innerHTML=`<b>${s.ic} ${s.n}. ${s.t}</b><p>${s.d}</p>`;
    });
    cont.appendChild(div);
  });
}
document.querySelectorAll('.toggle-flow button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.toggle-flow button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');flowMode=b.dataset.mode;renderFlow();
}));
let flowTimer=null;
document.getElementById('playFlow').addEventListener('click',()=>{
  if(flowTimer){clearInterval(flowTimer);flowTimer=null;}
  const steps=[...document.querySelectorAll('#flowSteps .step')];let i=0;
  flowTimer=setInterval(()=>{
    if(i>=steps.length){clearInterval(flowTimer);flowTimer=null;return;}
    steps[i].click();steps[i].scrollIntoView({behavior:'smooth',block:'nearest'});i++;
  },1100);
});
renderFlow();
</script>
```

### 4. Glosario buscable con IPA + botón 🔊 (pestaña Glosario)

```html
<style>
.gterm{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:8px 0;border-left:4px solid var(--cyan)}
.gterm .gt{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.gterm b{color:var(--navy)}
.gterm .ipa{color:var(--violet);font-style:italic;font-size:.85em}
.gterm p{font-size:.88em;color:var(--muted);margin-top:5px}
.sayb{background:var(--cyan);color:#fff;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:.9em}
.empty-msg{color:var(--muted);font-style:italic;padding:16px}
</style>
<input type="text" id="gSearch" placeholder="🔎 Buscar término…" style="width:100%;padding:10px 14px;border:2px solid var(--line);border-radius:10px;margin:4px 0 10px">
<div id="glossary"></div>
<script>
function say(txt){
  try{
    const u=new SpeechSynthesisUtterance(txt);
    u.lang='en-US';u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u);
  }catch(e){}
}
const GLOSS=[
  ['Dashboard','/ˈdæʃˌbɔːrd/','Tablero visual con métricas. Se pronuncia "DÁSH-bord". dash = raya/tablero, board = tabla.'],
  ['Trazabilidad','','Capacidad de seguir el rastro completo de algo: quién lo hizo, cuándo y por dónde pasó.']
];
function renderGloss(){
  const q=document.getElementById('gSearch').value.toLowerCase();
  const cont=document.getElementById('glossary');
  const list=GLOSS.filter(g=>(g[0]+g[2]).toLowerCase().includes(q));
  cont.innerHTML=list.map(g=>{
    const ipa=g[1]?`<span class="ipa">${g[1]}</span>`:'';
    const btn=g[1]?`<button class="sayb" onclick="say('${g[0].replace(/'/g,'')}')">🔊</button>`:'';
    return `<div class="gterm"><div class="gt"><b>${g[0]}</b>${ipa}${btn}</div><p>${g[2]}</p></div>`;
  }).join('')||'<p class="empty-msg">Sin resultados.</p>';
}
document.getElementById('gSearch').addEventListener('input',renderGloss);
renderGloss();
</script>
```

Regla: los términos en inglés del glosario incluyen su **desglose palabra por palabra** dentro de la definición.

### 5. MODO MÁQUINA — pipeline paso a paso (Siguiente / Automático / Reiniciar)

Obligatorio cuando el tema es código, runtime, motor, protocolo o cualquier "cómo funciona por dentro". Fila de tarjetas de etapas (atenuadas; la activa se ilumina) + panel terminal que explica cada paso. Sirve para cualquier proceso secuencial: pipeline V8, request HTTP, build, CI/CD, transacción SQL.

```html
<style>
.pipeline-wrap{background:#0f1021;border-radius:14px;padding:24px;color:#e8e8ff}
.pipe-controls{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.btn{background:#667eea;color:#fff;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-weight:600;transition:transform .15s,background .2s}
.btn:hover{background:#764ba2;transform:translateY(-2px)}
.btn.ghost{background:transparent;border:1px solid #667eea;color:#c9d0ff}
.stages{display:flex;align-items:stretch;gap:8px;overflow-x:auto;padding-bottom:10px}
.stage{flex:1 1 0;min-width:130px;background:#1c1e3a;border:2px solid #2b2e55;border-radius:12px;padding:14px;text-align:center;opacity:.35;transition:.35s;position:relative}
.stage.active{opacity:1;border-color:#8f9bff;box-shadow:0 0 22px rgba(143,155,255,.5);transform:translateY(-4px)}
.stage .icon{font-size:1.8em}
.stage .st-name{font-weight:700;margin:6px 0 3px;font-size:.92em;color:#c9d0ff}
.stage .st-en{font-size:.72em;color:#8b90c9;font-style:italic}
.stage .arrow{position:absolute;right:-11px;top:50%;transform:translateY(-50%);color:#8f9bff;font-size:1.3em;z-index:2}
.stage:last-child .arrow{display:none}
.pipe-output{margin-top:18px;background:#000;border-radius:10px;padding:16px;font-family:'Courier New',monospace;font-size:.9em;min-height:80px;color:#7CFC7C;white-space:pre-wrap;border:1px solid #2b2e55}
.pipe-output .lbl{color:#8f9bff;display:block;margin-bottom:6px;font-weight:700}
</style>
<div class="pipeline-wrap">
  <div class="pipe-controls">
    <button class="btn" id="pipeStep">▶ Siguiente paso</button>
    <button class="btn ghost" id="pipeAuto">⏩ Automático</button>
    <button class="btn ghost" id="pipeReset">↺ Reiniciar</button>
  </div>
  <div class="stages" id="stages">
    <div class="stage"><div class="icon">📄</div><div class="st-name">Código fuente</div><div class="st-en">Source code</div><div class="arrow">→</div></div>
    <div class="stage"><div class="icon">⚡</div><div class="st-name">Código máquina</div><div class="st-en">Machine code</div></div>
  </div>
  <div class="pipe-output" id="pipeOut"><span class="lbl">Explicación</span>Presiona "Siguiente paso" para empezar.</div>
</div>
<script>
(function(){
  const stages=[...document.querySelectorAll('#stages .stage')], out=document.getElementById('pipeOut');
  const steps=[
    {t:"📄 Código fuente",d:"Tú escribes texto plano:\n\n    let x = 2 + 3;\n\nPara la máquina todavía son solo letras."},
    {t:"⚡ Código máquina",d:"Se optimiza a 0s y 1s:\n\n  10110000 00000010"}
  ];
  let cur=-1,timer=null;
  function render(){stages.forEach((s,i)=>s.classList.toggle('active',i===cur));if(cur>=0)out.innerHTML='<span class="lbl">'+steps[cur].t+'</span>'+steps[cur].d;}
  function next(){cur=(cur+1)%steps.length;render();}
  function stopAuto(){if(timer){clearInterval(timer);timer=null;document.getElementById('pipeAuto').textContent='⏩ Automático';}}
  document.getElementById('pipeStep').onclick=()=>{stopAuto();next();};
  document.getElementById('pipeReset').onclick=()=>{stopAuto();cur=-1;stages.forEach(s=>s.classList.remove('active'));out.innerHTML='<span class="lbl">Explicación</span>Presiona "Siguiente paso" para empezar.';};
  document.getElementById('pipeAuto').onclick=function(){
    if(timer){stopAuto();return;}
    this.textContent='⏸ Pausar';cur=-1;next();
    timer=setInterval(()=>{next();if(cur===steps.length-1)stopAuto();},2600);
  };
})();
</script>
```

El panel terminal usa `white-space:pre-wrap` → los `\n` del string JS se dibujan como saltos reales (permite árboles ASCII, tokens, bytecode).

### 6. MODO MÁQUINA — animación de dos columnas + log en vivo (estilo event loop)

Para mostrar concurrencia/orden de ejecución: dos columnas oscuras (lo que corre AHORA vs lo que espera) + log terminal. Script async con `wait(ms)` crea y remueve tarjetas simulando la cronología real. Reutilizable: colas de mensajes, transacciones, retries, scheduling.

Nota: los botones usan `.btn`/`.btn.ghost` del snippet 5 — incluir esos estilos en la misma página. Dentro de `run()`, consultar `if(!running)return;` después de cada `await` para que "Reiniciar" aborte la secuencia en curso.

```html
<style>
.loop-demo{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.loop-col{background:#111;border-radius:10px;padding:14px;color:#eee;min-height:170px}
.loop-col h4{color:#8f9bff;font-size:.9em;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.loop-item{background:#26294d;border-left:3px solid #8f9bff;padding:8px 10px;margin:6px 0;border-radius:6px;font-family:'Courier New',monospace;font-size:.82em;animation:pop .25s ease}
@keyframes pop{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
.loop-log{grid-column:1/-1;background:#000;color:#7CFC7C;font-family:'Courier New',monospace;font-size:.85em;padding:12px;border-radius:8px;min-height:60px;white-space:pre-wrap}
@media(max-width:680px){.loop-demo{grid-template-columns:1fr}}
</style>
<div class="loop-demo">
  <div class="loop-col"><h4>📚 Ahora (Call Stack)</h4><div id="stackCol"></div></div>
  <div class="loop-col"><h4>⏳ En espera (Queue)</h4><div id="queueCol"></div></div>
  <div class="loop-log" id="loopLog">// Presiona "Correr ejemplo".</div>
</div>
<button class="btn" id="loopRun">▶ Correr ejemplo</button>
<button class="btn ghost" id="loopReset">↺ Reiniciar</button>
<script>
(function(){
  const stackCol=document.getElementById('stackCol'),queueCol=document.getElementById('queueCol'),log=document.getElementById('loopLog');
  let running=false;
  const push=(col,txt)=>{const d=document.createElement('div');d.className='loop-item';d.textContent=txt;col.appendChild(d);return d;};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const logln=t=>log.textContent+=(log.textContent?'\n':'')+t;
  async function run(){
    if(running)return;running=true;
    stackCol.innerHTML='';queueCol.innerHTML='';log.textContent='';
    let a=push(stackCol,'console.log("1")');await wait(700);if(!running)return;logln('> 1 · arranca');a.remove();
    // ...secuencia según el tema; repetir if(!running)return; después de cada await...
    running=false;
  }
  document.getElementById('loopRun').onclick=run;
  document.getElementById('loopReset').onclick=()=>{running=false;stackCol.innerHTML='';queueCol.innerHTML='';log.textContent='// Presiona "Correr ejemplo".';};
})();
</script>
```

### 7. Comparador de dos entornos con núcleo compartido (toggle + atenuado)

Para explicar "qué comparten y qué no" dos sistemas: dos cajas laterales con capacidades ✅/❌ y pieza central circular (lo compartido). El toggle NO oculta: atenúa a opacity .25 para no perder contexto. Reutilizable: backend vs frontend, dev vs prod, dos versiones de API.

```html
<style>
.cmp-toggle{display:flex;border-radius:10px;overflow:hidden;border:2px solid #667eea;width:fit-content;margin:0 auto 18px}
.cmp-toggle button{background:#fff;color:#667eea;border:none;padding:10px 22px;cursor:pointer;font-weight:700}
.cmp-toggle button.on{background:#667eea;color:#fff}
.cmp-stage{display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;gap:12px;background:#f7f8ff;border-radius:12px;padding:20px}
.cmp-box{border-radius:10px;padding:16px}
.cmp-box ul{list-style:none;padding:0}
.cmp-box li{padding:5px 8px;margin:5px 0;border-radius:6px;font-size:.9em;background:#fff}
.cmp-box li.yes{border-left:3px solid #28a745}
.cmp-box li.no{border-left:3px solid #dc3545;color:#999;text-decoration:line-through}
.cmp-shared{text-align:center}
.cmp-shared .core{background:#ffd54f;color:#5d4037;border-radius:50%;width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-weight:800;margin:0 auto 6px;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.cmp-a{background:#e3f2fd;border:1px solid #90caf9}
.cmp-b{background:#e8f5e9;border:1px solid #a5d6a7}
@media(max-width:680px){.cmp-stage{grid-template-columns:1fr}}
</style>
<div class="cmp-toggle">
  <button id="cmpBoth" class="on">Ver los dos</button>
  <button id="cmpA">Solo A</button>
  <button id="cmpB">Solo B</button>
</div>
<div class="cmp-stage">
  <div class="cmp-box cmp-a" id="boxA"><h4>🌐 Entorno A</h4>
    <ul><li class="yes">capacidad que SÍ tiene</li><li class="no">capacidad que NO tiene</li></ul>
  </div>
  <div class="cmp-shared"><div class="core">V8</div><small>Núcleo compartido</small></div>
  <div class="cmp-box cmp-b" id="boxB"><h4>🖥️ Entorno B</h4>
    <ul><li class="yes">capacidad que SÍ tiene</li><li class="no">capacidad que NO tiene</li></ul>
  </div>
</div>
<script>
(function(){
  const btns={both:cmpBoth,a:cmpA,b:cmpB};
  function set(mode){
    Object.values(btns).forEach(b=>b.classList.remove('on'));
    boxA.style.opacity=1;boxB.style.opacity=1;
    if(mode==='a'){btns.a.classList.add('on');boxB.style.opacity=.25;}
    else if(mode==='b'){btns.b.classList.add('on');boxA.style.opacity=.25;}
    else btns.both.classList.add('on');
  }
  btns.both.onclick=()=>set('both');btns.a.onclick=()=>set('a');btns.b.onclick=()=>set('b');
})();
</script>
```

### 8. Quiz de opción múltiple con explicación (data-driven)

Al hacer clic: se congelan las opciones, la elegida se pinta verde/roja, se revela la correcta y se muestra explicación 💡 citando la fuente.

```html
<style>
.quiz{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:12px 0}
.quiz .q{font-weight:700;color:var(--navy);margin-bottom:10px}
.quiz .opt{display:block;width:100%;text-align:left;background:#f7fbff;border:2px solid var(--line);border-radius:10px;padding:10px 14px;margin:6px 0;cursor:pointer;font-size:.92em;transition:.15s}
.quiz .opt:hover{border-color:var(--blue)}
.quiz .opt.ok{background:#dcfce7;border-color:var(--green)}
.quiz .opt.bad{background:#fee2e2;border-color:var(--red)}
.quiz .exp{display:none;margin-top:8px;font-size:.86em;color:var(--navy2);background:var(--sky);padding:10px 12px;border-radius:8px}
.quiz .exp.show{display:block}
</style>
<div id="quiz"></div>
<script>
const QUIZ=[
  {q:'¿Pregunta?',o:['Opción A','Opción B (correcta)','Opción C'],a:1,e:'Explicación citando la fuente.'}
];
const quizBox=document.getElementById('quiz');
QUIZ.forEach((item,qi)=>{
  const div=document.createElement('div');div.className='quiz';
  div.innerHTML=`<div class="q">${qi+1}. ${item.q}</div>`;
  item.o.forEach((opt,oi)=>{
    const b=document.createElement('button');b.className='opt';b.textContent=opt;
    b.addEventListener('click',()=>{
      const opts=div.querySelectorAll('.opt');opts.forEach(o=>o.style.pointerEvents='none');
      if(oi===item.a){b.classList.add('ok');}
      else{b.classList.add('bad');opts[item.a].classList.add('ok');}
      div.querySelector('.exp').classList.add('show');
    });
    div.appendChild(b);
  });
  const exp=document.createElement('div');exp.className='exp';exp.innerHTML='💡 '+item.e;
  div.appendChild(exp);quizBox.appendChild(div);
});
</script>
```

### 9. Explicación en dos capas (versión simple vs versión dev)

```html
<style>
.layer{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
.layer .lbox{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.layer .lbox.k{border-top:4px solid var(--cyan)}
.layer .lbox.d{border-top:4px solid var(--violet)}
.layer .lbox b{color:var(--navy);display:block;margin-bottom:6px}
@media(max-width:820px){.layer{grid-template-columns:1fr}}
</style>
<div class="layer">
  <div class="lbox k"><b>Versión simple (para un niño de 5 años)</b>Analogía cotidiana del concepto.</div>
  <div class="lbox d"><b>Versión dev</b>Definición técnica precisa con términos del dominio.</div>
</div>
```

### 10. Checklist de autoevaluación clickeable

```html
<style>
.checklist{list-style:none;padding:0}
.checklist li{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:8px 0;cursor:pointer;transition:.15s}
.checklist li:hover{border-color:var(--blue)}
.checklist li.done{background:#f0fdf4;border-color:var(--green)}
.checklist li::before{content:"⬜ "}
.checklist li.done::before{content:"✅ "}
</style>
<p class="sub">Marca solo si de verdad puedes hacerlo (toca para marcar):</p>
<ul class="checklist" id="checklist">
  <li>Puedo explicar [concepto] en 1 minuto</li>
  <li>Puedo trazar [flujo] de punta a punta</li>
</ul>
<script>
document.querySelectorAll('#checklist li').forEach(li=>li.addEventListener('click',()=>li.classList.toggle('done')));
</script>
```

### 11. Diagrama SVG inline de flujo numerado

SVG inline sin dependencias (viewBox responsive, `role="img"` + `aria-label`), cajas `<rect>` redondeadas con colores pastel por dominio, pasos numerados, flechas con `marker-end` reutilizable en `<defs><marker>`.

### 12. Cards expandibles acordeón ("toca cada uno")

Grid de cards clickeables (emoji + título + "Ver detalle ▾"); clic abre el detalle asociado, cierra los demás y hace scrollIntoView centrado.

### 13. Chips de filtro + búsqueda + contador

Para catálogos largos (funciones, reglas): chips por categoría con contador, filtro combinado chip+texto, línea "Mostrando X de Y".

---

## Principios Pedagógicos (OBLIGATORIOS en cada lección)

Estas reglas van ANTES que el diseño visual. El HTML puede ser simple; el aprendizaje no puede fallar.

### P1. Imagen o dibujo de la analogía
- No solo texto de analogía — acompañar con imagen o ilustración (SVG)
- El cerebro recuerda imágenes 10x más que texto
- Ejemplo: "puertos y adaptadores" → dibujo de enchufe con adaptador de viaje, no solo palabras

### P2. Historia / mini-cuento de apertura
- Abrir CADA lección con una historia corta (3-5 líneas) que planta el problema
- No empezar con definición — empezar con escenario concreto
- Ejemplo: "Eran las 11pm, el sistema de Unimar explotó porque alguien puso SQL directo en el controlador..."

### P3. Antes / Después (obligatorio)
- Mostrar el PROBLEMA sin el concepto (caos, código feo, error)
- Mostrar la SOLUCIÓN con el concepto (orden, claridad)

```
❌ ANTES (sin DDD):
  El controlador llama directo a la BD,
  la BD cambia y todo explota.

✅ DESPUÉS (con DDD):
  El controlador llama al dominio,
  el dominio no sabe nada de la BD,
  puedes cambiar la BD sin tocar lógica.
```

### P4. De simple a complejo (capas)
- Primero: "versión niño de 5 años" → 1-2 oraciones máximo
- Después: "versión programador" → detalle real
- **Y si el tema es código: rematar con MODO MÁQUINA** → cómo funciona por dentro, hasta la raíz, con el pipeline animado
- No mezclar capas. Subir escalón solo cuando ya pisas firme

### P5. Anclar a lo que ya sabe
- Siempre conectar lo nuevo a algo que Christian ya conoce
- "Es como X que ya usas, pero..." → luego la diferencia
- Priorizar analogías del mundo Unimar (contenedores, camiones, depósito)

### P6. Frase mantra (1 sola, al final)
- Cerrar la lección con UNA frase memorizable que resume todo
- Ejemplos:
  - "Hexagonal = el dominio no sabe quién lo llama"
  - "DDD = el código habla el idioma del negocio"
  - "IDENTITY = la BD asigna el ID, nunca tú"

### P7. Error típico + por qué duele
- Incluir 1-2 errores comunes + consecuencia real cuando pasa
- Ejemplo: "Error típico: poner lógica de negocio en el controlador → cuando cambia el frontend, reescribes todo"

### P8. Pregunta gancho al inicio
- La lección ABRE con una pregunta que no sabe responder todavía
- Al final: responder la pregunta explícitamente (cerrar el loop)
- Ejemplo: "¿Por qué Unimar podría cambiar de PostgreSQL a MySQL sin reescribir la lógica de negocio? Lee y vas a poder responderlo."

### P9. Checklist de comprensión real
- Al final, 3-4 puntos de "sabes esto si puedes..." — acciones, no definiciones
- Usar el patrón clickeable (#10)

### P10. Vocabulario sin cabos sueltos (nuevo)
- Ningún término técnico queda sin explicar: subrayado+tooltip en el texto, desglose si es inglés, entrada en el glosario
- El glosario es pestaña del navbar, siempre a un clic

---

## REGLA 3: Puente con el curso de inglés

Todo término en inglés desglosado en una lección se registra en el banco de vocabulario del curso de inglés:
`C:\Christian\Christian Personal\teacher-inglish\curriculum\vocab-bank.js` — agregar al array `words` una entrada con `term`, `ipa`, `es`, `breakdown` (el mismo desglose palabra por palabra), `meaning`, `context`, `source: "jarita-enseña"`, `added` (fecha), `status: "pending"`, `usedIn: []`; sin duplicar (si existe, solo enriquecer `context`) y actualizando el campo `updated` del banco. La skill `/teacher-ingles` los incorpora en las clases futuras. Avisar al usuario cuántas palabras se agregaron.

---

## Checklist de entrega (antes de dar por terminada una lección)

1. ☐ Grep de voseo sobre el HTML → cero matches (REGLA 0)
2. ☐ Navbar sticky con pestañas, incluye 📖 Glosario y ✅ Quiz
3. ☐ Todo término técnico del texto lleva `.gl` con tooltip
4. ☐ Todo término en inglés tiene desglose palabra por palabra + IPA + 🔊
5. ☐ Términos técnicos en español (trazabilidad, etc.) explicados
6. ☐ Flujo ilustrado interactivo si el tema tiene proceso/secuencia
7. ☐ Modo máquina si el tema es código/runtime/motor
8. ☐ Pregunta gancho al inicio + respuesta al final
9. ☐ Historia, antes/después, dos capas, analogía dibujada, error típico, mantra
10. ☐ Quiz con feedback + checklist clickeable + recursos
11. ☐ `index.html` actualizado con la nueva lección
12. ☐ Términos EN registrados en vocab-bank.js de teacher-inglish (REGLA 3)
13. ☐ Abrir en navegador

---

## Carpeta de Aprendizajes

```
C:\Users\cjara\aprendizajes\
├── index.html                          (índice de todas las lecciones)
├── [concepto-slug].html                (una lección por concepto)
└── assets\
    ├── styles.css                      (CSS compartido)
    ├── script.js                       (interactividad)
    └── images\                         (SVGs y diagramas)
```

Las lecciones pueden ser autocontenidas (CSS/JS inline) — los documentos de referencia prd-tms.html y runtime-nodejs.html lo son, y funcionan bien así.

---

## Actualización Continua

- Primer acceso: archivo nuevo
- Segundo acceso: mejora basada en feedback
- Feedback de Christian → actualizar este archivo Y `jarita_learnings.md`

---

## Invocación Rápida

```
/jarita-enseña DDD
/jarita-enseña "hexagonal architecture"
/jarita-enseña SQL "IDENTITY"
/jarita-enseña event lup        ← mal escrito: deducir "event loop" e ilustrarlo igual
```

Jarita deduce términos mal escritos, pregunta detalles solo si hace falta, luego genera HTML.
