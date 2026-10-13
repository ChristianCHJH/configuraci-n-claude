---
name: jarita-ense-a-rules
description: Sistema de enseñanza v3 - núcleo fijo (flujo + partes + glosario en sidebar), catálogo de piezas opcionales elegidas según el tipo de pregunta, y regla de economía (menos texto = más comprensión)
metadata:
  node_type: memory
  type: reference
  version: 3
  last_updated: 2026-08-13
  originSessionId: 699f7a9f-b2b4-42b7-8a7c-049d88446d9c
  modified: 2026-08-13T21:05:20.602Z
---

# Jarita Enseña — Sistema de Aprendizaje Interactivo (v3)

## Misión

```
/jarita-enseña [concepto]
```

Un HTML educativo interactivo cuyo **único objetivo** es que quien lo lea **entienda lo que preguntó, sin ninguna duda**.

**Este documento es un CATÁLOGO, no un checklist.** Salvo el núcleo fijo (abajo), todo lo demás es material disponible: la IA elige qué usar según la pregunta, y puede inventar piezas nuevas si el tema lo pide.

Referencias de calidad: `prd-tms.html` (flujo paso a paso, quiz) y `runtime-nodejs.html` (modo máquina: pipeline animado, event loop).

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
| "anda / no anda" con sentido de "funciona" | funciona / no funciona |

**Verificación obligatoria antes de entregar** — grep sobre el HTML y corregir todo match:

```
\bvos\b|leé|mirá|tocá|marcá|elegí|recorré|andá|apretá|podés|sabés|entendés|querés|tenés|creés|conocés|usás|pensás|buscás|buscá|cambiás|copiás|necesitás|hablás|escribís|corrés|perdés|pisás|recordás|probate|anclá|filtrá|preguntá|no anda
```

---

## REGLA 1: Economía — menos texto, más comprensión

Esta regla **manda sobre todas las demás** (excepto la 0). Lo simplificado es lo que hace entender.

- **Una idea por bloque.** Dos ideas en un párrafo = dos bloques, o una sobra.
- **Jerarquía de formatos**: dibujo/SVG > diagrama de tarjetas > tabla > lista > párrafo. Baja de escalón solo si el de arriba no alcanza.
- **Nada "por completitud".** Si un dato no ayuda a responder *la pregunta que hicieron*, no va — aunque sea cierto e interesante.
- **Sin argumentar de más.** Se dice la conclusión; el sustento va solo si el lector necesita decidir con él.
- Techo blando por sección: ~150 palabras de texto corrido. Si te pasas, es señal de que falta un dibujo.

---

## REGLA 2: Palabras mal escritas → deducir e ilustrar

Christian a veces escribe rápido con errores ("dcuemtno" = documento, "event lup" = event loop).
Nunca rechazar ni pedir corrección: deducir por contexto, confirmar en UNA línea ("Entiendo *event loop*, ¿correcto?") y seguir. El término deducido se trata como cualquier otro.

---

## REGLA 3: Desglose 100% de términos

**Todo término en inglés** se descompone palabra por palabra: traducción literal + significado técnico + pronunciación. Nada queda como "palabra mágica".

> **event loop** /ɪˈvɛnt luːp/ 🔊
> - *event* = evento, suceso (algo que pasa)
> - *loop* = bucle, ciclo (algo que da vueltas sin parar)
> - → **"bucle de eventos"**: ciclo infinito que revisa si hay tareas pendientes y las atiende una por una

**Los términos técnicos en español también se explican** (trazabilidad, idempotencia, concurrencia, latencia): definición simple + ejemplo del mundo Unimar.

Snippet de tarjeta de desglose (requiere `say()` y `.sayb` del snippet del sidebar):

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

# NÚCLEO FIJO (siempre, en toda lección)

## N1. 🔄 Flujo — SIEMPRE

Ver el orden en que pasan las cosas es lo que convierte información en comprensión.

- Si el tema tiene **secuencia temporal** → flujo de pasos.
- Si no la tiene → flujo de **decisión** (si esto, entonces aquello) o de **dependencia** (quién necesita a quién).
- **Siempre dibujado**, nunca un párrafo describiendo el flujo.
- Interactivo: clic en paso muestra detalle, botón ▶ recorre automático.

## N2. 🧩 Partes — SIEMPRE

Se entiende algo cuando ves de qué piezas está hecho y qué hace cada una.

- Una tarjeta por pieza. **Una línea por pieza** (qué hace, en cristiano).
- El detalle largo va en expandible, no en el frente de la tarjeta.
- Si la pieza tiene nombre en inglés → desglose (REGLA 3).

## N3. 📖 Glosario en SIDEBAR fijo — SIEMPRE

**Cambio v3: el glosario ya NO es pestaña del navbar ni sección al final.** Es una **columna lateral fija, visible desde cualquier parte de la lección**, con buscador. Motivo: consultar una palabra no debe hacerte perder el sitio donde estabas leyendo.

- Desktop: columna derecha `position:sticky`, siempre presente.
- Móvil: botón flotante 📖 abre un cajón lateral.
- Buscable, con IPA + 🔊 en los términos en inglés.
- Complementa a los términos subrayados con tooltip del texto corrido (no lo reemplaza).

---

# CATÁLOGO DE PIEZAS OPCIONALES

**Elegir 3 a 6 secciones en total**, contando Flujo y Partes. Más que eso deja de ser clase y se vuelve manual.

| Pieza | Cuándo usarla |
|---|---|
| 🗺️ Panorama (pregunta gancho + historia + analogía dibujada) | Tema nuevo del todo o abstracto |
| ⚙️ Modo máquina | Hay un "por dentro": runtime, motor, protocolo, compilador, transacción |
| ⚠️ Errores típicos | Es fácil meter la pata y duele |
| ⚖️ Comparación / decisión | La pregunta es "¿A o B?" |
| 🏗️ En Unimar | Aterrizar en el proyecto real con código |
| 🔀 Antes / Después | El valor del concepto es que arregla un caos |
| 🪜 Dos capas (simple / dev) | Versión intuitiva y versión técnica son distintas |
| ✅ Quiz | El tema entra por repetición |
| 📋 Checklist "¿lo entendí?" | La comprensión se puede verificar con acciones |
| 📚 Recursos | Hay fuente oficial que valga la pena |

**Libertad explícita**: si el tema pide una sección que no está en esta tabla, invéntala. La tabla es punto de partida, no límite.

## Plantillas por tipo de pregunta

| Tipo | Ejemplo | Arranque sugerido |
|---|---|---|
| ¿Qué es X? | ¿Qué es DDD? | Panorama → Flujo → Partes → (Errores) |
| ¿Cómo funciona por dentro? | ¿Cómo corre Node? | Flujo → Partes → Modo máquina |
| ¿A o B? | ¿Docker en el servidor? | Flujo → Partes → Comparación → **Decisión recomendada** |
| ¿Por qué pasó esto? | ¿Por qué explotó el deploy? | Flujo del fallo → Partes → Errores → Cómo evitarlo |
| ¿Cómo hago X? | ¿Cómo levanto un contenedor? | Flujo (pasos) → Partes (comandos) → Errores → Checklist |
| Término suelto | ¿Qué es idempotencia? | Partes → Flujo (1 ejemplo) → Sidebar. Corto y ya. |

Si la pregunta pide decidir, la lección **cierra con una recomendación explícita**: cuál elegir y por qué. Nunca un "depende" sin cerrar.

---

# SNIPPETS

### 0. Tokens de color base (`:root`) — prerequisito de todo

```css
:root{
  --navy:#042139; --navy2:#0f3e67; --blue:#2f7fd6; --sky:#e8f2fb;
  --green:#16a34a; --red:#dc2626; --amber:#d97706; --violet:#7c3aed; --cyan:#0891b2;
  --ink:#1b2a3a; --muted:#5b6b7b; --line:#d9e2ec; --bg:#f4f7fb; --card:#ffffff;
}
body{font-family:'Segoe UI',Tahoma,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
```

### 1. LAYOUT v3: contenido + GLOSARIO SIDEBAR fijo (obligatorio)

Dos columnas: contenido a la izquierda, glosario sticky a la derecha. En móvil el glosario se vuelve cajón con botón flotante 📖.

```html
<style>
.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;max-width:1280px;margin:0 auto;padding:0 18px 60px}
/* ---- sidebar glosario ---- */
.gside{position:sticky;top:14px;align-self:start;max-height:calc(100vh - 28px);display:flex;flex-direction:column;
       background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 6px 22px rgba(15,62,103,.07)}
.gside h3{color:var(--navy);font-size:.95em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.gside input{width:100%;padding:9px 12px;border:2px solid var(--line);border-radius:10px;margin-bottom:10px;font-size:.88em}
.gside .glist{overflow-y:auto;padding-right:4px}
.gterm{border-left:3px solid var(--cyan);background:#fbfdff;border-radius:8px;padding:9px 11px;margin:7px 0}
.gterm .gt{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gterm b{color:var(--navy);font-size:.92em}
.gterm .ipa{color:var(--violet);font-style:italic;font-size:.78em}
.gterm p{font-size:.82em;color:var(--muted);margin-top:4px}
.sayb{background:var(--cyan);color:#fff;border:none;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:.8em}
.empty-msg{color:var(--muted);font-style:italic;padding:12px;font-size:.85em}
.gtoggle{display:none}
/* ---- móvil: cajón ---- */
@media(max-width:980px){
  .layout{grid-template-columns:1fr}
  .gside{position:fixed;top:0;right:0;bottom:0;width:min(88vw,330px);max-height:none;border-radius:0;z-index:60;
         transform:translateX(105%);transition:transform .25s ease}
  .gside.open{transform:none}
  .gtoggle{display:flex;align-items:center;justify-content:center;position:fixed;right:16px;bottom:16px;z-index:61;
           width:54px;height:54px;border-radius:50%;border:none;background:var(--navy);color:#fff;font-size:1.4em;
           cursor:pointer;box-shadow:0 8px 24px rgba(4,33,57,.35)}
}
</style>

<div class="layout">
  <main>
    <!-- navbar de pestañas + paneles de secciones (snippet 2) -->
  </main>

  <aside class="gside" id="gside">
    <h3>📖 Glosario</h3>
    <input type="text" id="gSearch" placeholder="🔎 Buscar palabra…">
    <div class="glist" id="glossary"></div>
  </aside>
</div>
<button class="gtoggle" id="gToggle" aria-label="Abrir glosario">📖</button>

<script>
function say(txt){
  try{const u=new SpeechSynthesisUtterance(txt);u.lang='en-US';u.rate=.85;
      speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}
}
/* [término, IPA (''), definición con desglose si es inglés] */
const GLOSS=[
  ['Dashboard','/ˈdæʃˌbɔːrd/','Tablero de métricas. dash = raya/tablero, board = tabla.'],
  ['Trazabilidad','','Poder seguir el rastro completo de algo: quién, cuándo y por dónde pasó.']
];
function renderGloss(){
  const q=document.getElementById('gSearch').value.toLowerCase();
  const list=GLOSS.filter(g=>(g[0]+g[2]).toLowerCase().includes(q));
  document.getElementById('glossary').innerHTML=list.map(g=>{
    const ipa=g[1]?`<span class="ipa">${g[1]}</span>`:'';
    const btn=g[1]?`<button class="sayb" onclick="say('${g[0].replace(/'/g,'')}')">🔊</button>`:'';
    return `<div class="gterm"><div class="gt"><b>${g[0]}</b>${ipa}${btn}</div><p>${g[2]}</p></div>`;
  }).join('')||'<p class="empty-msg">Sin resultados.</p>';
}
document.getElementById('gSearch').addEventListener('input',renderGloss);
document.getElementById('gToggle').addEventListener('click',()=>document.getElementById('gside').classList.toggle('open'));
renderGloss();
</script>
```

Regla: los términos en inglés del glosario incluyen su **desglose palabra por palabra** dentro de la definición.

### 2. Navbar de pestañas para las secciones (dentro de `<main>`)

Sin pestaña de Glosario (ahora vive en el sidebar). Cada tab con micro-rótulo `.n`.

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
<!-- REGLA: cada tab data-p="X" DEBE tener su <div class="panel" id="X"> -->
<div class="tabs">
  <div class="tab active" data-p="p1"><span class="n">CÓMO FLUYE</span>🔄 Flujo</div>
  <div class="tab" data-p="p2"><span class="n">LAS PIEZAS</span>🧩 Partes</div>
</div>
<div class="panel active" id="p1">…</div>
<div class="panel" id="p2">…</div>
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

Si la lección tiene solo 3 secciones cortas, se puede prescindir de pestañas y dejar scroll simple — el sidebar del glosario sigue siendo obligatorio.

### 3. Términos subrayados con tooltip (texto corrido)

```html
<style>
.gl{border-bottom:2px dotted var(--cyan);cursor:help;position:relative;font-weight:600}
.gl::after{content:attr(data-def);position:absolute;left:50%;bottom:125%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:8px 12px;border-radius:8px;font-size:.8em;font-weight:400;width:max-content;max-width:260px;opacity:0;pointer-events:none;transition:.15s;z-index:40}
.gl:hover::after,.gl:focus::after,.gl.tap::after{opacity:1}
</style>
<p>La <span class="gl" tabindex="0" data-def="Guía de Remisión Electrónica: sustenta el traslado ante SUNAT">GRE</span> se emite dentro del puerto.</p>
<script>
document.querySelectorAll('.gl').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('tap')));
</script>
```

### 4. FLUJO interactivo paso a paso (núcleo N1)

Tarjetas numeradas con flechas; clic muestra detalle; ▶ recorre automático; toggle si hay variantes. Data-driven.

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
    <button class="active" data-mode="a">📥 Modo A</button>
    <button data-mode="b">📤 Modo B</button>
  </div>
  <button class="playbtn" id="playFlow">▶ Recorrer paso a paso</button>
</div>
<div class="flow" id="flowSteps"></div>
<div class="detail empty" id="flowDetail">👆 Toca un paso de arriba para ver el detalle.</div>
<script>
const FLOWS={
  a:[{n:1,ic:'📨',t:'Paso uno',f:'F-01',d:'Detalle <b>HTML</b> del paso.'},{n:2,ic:'📝',t:'Paso dos',f:'F-02',d:'Otro detalle.'}],
  b:[{n:1,ic:'📨',t:'Variante',f:'F-01',d:'Detalle variante.'}]
};
let flowMode='a';
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

Si el flujo no es temporal, la misma estructura sirve para **decisión** (cada tarjeta = una condición) o **dependencia** (cada tarjeta = quién necesita a quién).

### 5. PARTES — cards expandibles (núcleo N2)

Grid de piezas: emoji + nombre + **una línea**; el detalle se abre al tocar y cierra las demás.

```html
<style>
.parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:14px 0}
.part{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;transition:.18s}
.part:hover{border-color:var(--blue);transform:translateY(-3px)}
.part.on{border-color:var(--navy);box-shadow:0 0 0 3px rgba(47,127,214,.2)}
.part .ic{font-size:1.6em}
.part .t{font-weight:700;color:var(--navy);margin:5px 0 3px}
.part .one{font-size:.85em;color:var(--muted)}
.part-detail{background:var(--card);border-left:5px solid var(--navy);border-radius:10px;padding:16px;margin-top:10px;display:none}
.part-detail.show{display:block;animation:fade .3s}
</style>
<div class="parts" id="parts"></div>
<div class="part-detail" id="partDetail"></div>
<script>
const PARTS=[
  {ic:'🧠',t:'Dominio',one:'Las reglas del negocio, puras.',d:'Detalle largo aquí (solo al abrir).'},
  {ic:'🔌',t:'Puerto',one:'El enchufe que el dominio expone.',d:'Detalle largo.'}
];
const pc=document.getElementById('parts'),pd=document.getElementById('partDetail');
PARTS.forEach(p=>{
  const el=document.createElement('div');el.className='part';
  el.innerHTML=`<div class="ic">${p.ic}</div><div class="t">${p.t}</div><div class="one">${p.one}</div>`;
  el.onclick=()=>{
    document.querySelectorAll('.part').forEach(x=>x.classList.remove('on'));el.classList.add('on');
    pd.innerHTML=`<b>${p.ic} ${p.t}</b><p>${p.d}</p>`;pd.classList.add('show');
    pd.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  pc.appendChild(el);
});
</script>
```

### 6. MODO MÁQUINA — pipeline paso a paso (opcional)

Solo si hay un "por dentro". Etapas atenuadas + panel terminal (`white-space:pre-wrap` → los `\n` se dibujan como saltos reales, sirve para árboles ASCII/bytecode).

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
    <div class="stage"><div class="icon">📄</div><div class="st-name">Código fuente</div><div class="st-en">Source code</div></div>
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

### 7. MODO MÁQUINA — dos columnas + log en vivo (opcional)

Para concurrencia/orden de ejecución (event loop, colas, retries). Usa `.btn`/`.btn.ghost` del snippet 6. Dentro de `run()`, poner `if(!running)return;` después de cada `await` para que "Reiniciar" aborte.

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
    running=false;
  }
  document.getElementById('loopRun').onclick=run;
  document.getElementById('loopReset').onclick=()=>{running=false;stackCol.innerHTML='';queueCol.innerHTML='';log.textContent='// Presiona "Correr ejemplo".';};
})();
</script>
```

### 8. COMPARACIÓN / DECISIÓN (opcional — preguntas "¿A o B?")

Dos cajas con capacidades ✅/❌ y núcleo compartido al centro. El toggle **atenúa** (opacity .25), no oculta: no se pierde el contexto.

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
.veredicto{background:#ecfdf5;border:2px solid var(--green);border-radius:12px;padding:16px;margin-top:16px}
.veredicto b{color:var(--navy)}
@media(max-width:680px){.cmp-stage{grid-template-columns:1fr}}
</style>
<div class="cmp-toggle">
  <button id="cmpBoth" class="on">Ver los dos</button><button id="cmpA">Solo A</button><button id="cmpB">Solo B</button>
</div>
<div class="cmp-stage">
  <div class="cmp-box cmp-a" id="boxA"><h4>🌐 Opción A</h4><ul><li class="yes">lo que sí</li><li class="no">lo que no</li></ul></div>
  <div class="cmp-shared"><div class="core">🔧</div><small>Lo compartido</small></div>
  <div class="cmp-box cmp-b" id="boxB"><h4>🖥️ Opción B</h4><ul><li class="yes">lo que sí</li><li class="no">lo que no</li></ul></div>
</div>
<div class="veredicto">✅ <b>Recomendación:</b> elige A porque [razón en una línea].</div>
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

**Toda comparación cierra con `.veredicto`**: cuál elegir y por qué.

### 9. Quiz de opción múltiple (opcional)

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
const QUIZ=[{q:'¿Pregunta?',o:['Opción A','Opción B (correcta)','Opción C'],a:1,e:'Explicación citando la fuente.'}];
const quizBox=document.getElementById('quiz');
QUIZ.forEach((item,qi)=>{
  const div=document.createElement('div');div.className='quiz';
  div.innerHTML=`<div class="q">${qi+1}. ${item.q}</div>`;
  item.o.forEach((opt,oi)=>{
    const b=document.createElement('button');b.className='opt';b.textContent=opt;
    b.addEventListener('click',()=>{
      const opts=div.querySelectorAll('.opt');opts.forEach(o=>o.style.pointerEvents='none');
      if(oi===item.a){b.classList.add('ok');}else{b.classList.add('bad');opts[item.a].classList.add('ok');}
      div.querySelector('.exp').classList.add('show');
    });
    div.appendChild(b);
  });
  const exp=document.createElement('div');exp.className='exp';exp.innerHTML='💡 '+item.e;
  div.appendChild(exp);quizBox.appendChild(div);
});
</script>
```

### 10. Dos capas: simple vs dev (opcional)

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
  <div class="lbox k"><b>Versión simple</b>Analogía cotidiana, 1-2 oraciones.</div>
  <div class="lbox d"><b>Versión dev</b>Definición técnica precisa.</div>
</div>
```

### 11. Checklist clickeable (opcional)

```html
<style>
.checklist{list-style:none;padding:0}
.checklist li{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:8px 0;cursor:pointer;transition:.15s}
.checklist li:hover{border-color:var(--blue)}
.checklist li.done{background:#f0fdf4;border-color:var(--green)}
.checklist li::before{content:"⬜ "}
.checklist li.done::before{content:"✅ "}
</style>
<ul class="checklist" id="checklist">
  <li>Puedo explicar [concepto] en 1 minuto</li>
  <li>Puedo trazar [flujo] de punta a punta</li>
</ul>
<script>document.querySelectorAll('#checklist li').forEach(li=>li.addEventListener('click',()=>li.classList.toggle('done')));</script>
```

### 12. Otros patrones disponibles

- **Diagrama SVG inline** de flujo numerado (viewBox responsive, `role="img"` + `aria-label`, `<defs><marker>` para flechas).
- **Chips de filtro + búsqueda + contador** para catálogos largos.

---

## Principios pedagógicos (aplicar los que sirvan a ESTA pregunta)

Estas reglas van antes que el diseño visual: el HTML puede ser simple, el aprendizaje no puede fallar. **No son un checklist a cumplir entero** — se usan las que ayudan.

- **P1. Dibujo de la analogía** — la analogía va ilustrada, no solo escrita.
- **P2. Historia de apertura** (3-5 líneas) — planta el problema antes de la definición. Útil en temas nuevos; se salta en preguntas puntuales.
- **P3. Antes / Después** — el caos sin el concepto vs el orden con él.
- **P4. De simple a complejo** — versión intuitiva primero, técnica después; si es código, remata en modo máquina.
- **P5. Anclar** — conectar con lo que ya conoce (mundo Unimar: contenedores, camiones, depósito).
- **P6. Mantra** — UNA frase memorizable que resume todo ("Hexagonal = el dominio no sabe quién lo llama").
- **P7. Error típico + por qué duele** — 1-2 errores comunes con su consecuencia real.
- **P8. Pregunta gancho** — abre con una pregunta que aún no sabe responder; ciérrala explícitamente al final.
- **P9. Checklist de comprensión** — "sabes esto si puedes…", acciones, no definiciones.
- **P10. Vocabulario sin cabos sueltos** — ningún término sin explicar: tooltip en el texto, desglose si es inglés, entrada en el sidebar.

---

## Puente con el curso de inglés

Todo término en inglés desglosado se registra en `C:\Christian\Christian Personal\teacher-inglish\curriculum\vocab-bank.js` — array `words`: `term`, `ipa`, `es`, `breakdown`, `meaning`, `context`, `source: "jarita-enseña"`, `added`, `status: "pending"`, `usedIn: []`. Sin duplicar (si existe, enriquecer `context`) y actualizando el campo `updated`. Avisar cuántas palabras se agregaron.

---

## Checklist de entrega (corto a propósito)

1. ☐ Grep de voseo → cero matches (REGLA 0)
2. ☐ **Glosario en sidebar fijo**, buscable, visible en toda la lección
3. ☐ **Flujo dibujado** presente (temporal, de decisión o de dependencia)
4. ☐ **Partes** presentes, una línea por pieza
5. ☐ Entre 3 y 6 secciones — ninguna sección de relleno
6. ☐ Todo término técnico con tooltip; los EN con desglose + IPA + 🔊
7. ☐ Si la pregunta pedía decidir → hay recomendación explícita
8. ☐ `index.html` actualizado
9. ☐ Términos EN en vocab-bank.js
10. ☐ Abrir en navegador

---

## Carpeta de aprendizajes

```
C:\Christian\Unimar_obsidian\aprendizajes\
├── index.html                  (índice de lecciones)
├── [concepto-slug].html        (una lección por concepto, autocontenida)
└── assets\images\              (SVGs compartidos)
```

## Actualización continua

Feedback de Christian → actualizar este archivo **y** `jarita_learnings.md`.

## Invocación rápida

```
/jarita-enseña DDD
/jarita-enseña "hexagonal architecture"
/jarita-enseña event lup        ← mal escrito: deducir e ilustrar igual
```
