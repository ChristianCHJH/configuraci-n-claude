async (page) => {
  const PANTALLA = 'pantalla';
  const CARPETA = 'C:/ruta/absoluta/.revision-ux/AAAA-MM-DD-HHmm/capturas';
  const DESDE = 0;
  const CANTIDAD = 30;
  const MAXIMO_CAPTURAS = 12;
  const REPETIDOS_POR_FIRMA = 2;
  const ESPERA_HOVER_MS = 800;
  const ESPERA_RESPUESTA_MS = 1600;
  const RESPUESTA_LENTA_MS = 1000;
  const VERBOS_QUE_ESCRIBEN = /guardar|grabar|eliminar|borrar|quitar|suprimir|enviar|pagar|comprar|confirmar|aprobar|rechazar|asignar|anular|dar de baja|cerrar sesi[oó]n|^salir$|log ?out|sign ?out|subir|cargar archivo|importar|publicar|archivar|desactivar|restablecer|(agregar|añadir) al carrito|save|delete|remove|submit|send|pay|buy|confirm|approve|reject|publish|upload|import|add to cart/i;

  const urlInicial = page.url();
  const origen = new URL(urlInicial).origin;
  const escriturasBloqueadas = [];
  const erroresDeConsola = [];
  const dialogosNativos = [];
  let peticiones = 0;
  let descargas = 0;
  const pestanasNuevas = [];
  let capturasTomadas = 0;

  const alPedir = () => { peticiones += 1; };
  const alError = (mensaje) => { if (mensaje.type() === 'error') erroresDeConsola.push(mensaje.text().slice(0, 160)); };
  const alFallarPagina = (error) => erroresDeConsola.push(String(error).slice(0, 160));
  const alDialogoNativo = async (dialogo) => { dialogosNativos.push(`${dialogo.type()}: ${dialogo.message().slice(0, 120)}`); await dialogo.dismiss().catch(() => {}); };
  const alDescargar = async (descarga) => { descargas += 1; await descarga.cancel().catch(() => {}); };
  const alAbrirPestana = (nueva) => pestanasNuevas.push(nueva);
  const guardiaDeEscritura = (ruta) => {
    const metodo = ruta.request().method();
    if (['GET', 'HEAD', 'OPTIONS'].includes(metodo)) return ruta.continue();
    escriturasBloqueadas.push(`${metodo} ${ruta.request().url().replace(origen, '').slice(0, 120)}`);
    return ruta.abort();
  };

  page.on('request', alPedir);
  page.on('console', alError);
  page.on('pageerror', alFallarPagina);
  page.on('dialog', alDialogoNativo);
  page.on('download', alDescargar);
  page.context().on('page', alAbrirPestana);
  await page.route('**/*', guardiaDeEscritura);

  const recolectar = () => {
    const SELECTOR = 'button, a[href], summary, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="option"], [tabindex]:not([tabindex="-1"])';
    const anchoVentana = innerWidth;
    const altoVentana = innerHeight;
    const altoPagina = Math.max(document.scrollingElement.scrollHeight, altoVentana);
    const anchoPagina = Math.max(document.scrollingElement.scrollWidth, anchoVentana);
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      for (let actual = el; actual && actual !== document.body; actual = actual.parentElement) {
        const s = getComputedStyle(actual);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false;
      }
      return true;
    };
    const selectoresConHover = new Set();
    const recorrerReglas = (reglas, padre) => {
      for (const regla of reglas) {
        let selector = padre;
        if (regla.selectorText) {
          selector = padre ? regla.selectorText.replace(/&/g, padre) : regla.selectorText;
          if (selector.includes(':hover')) {
            selector.split(',').filter((parte) => parte.includes(':hover')).forEach((parte) => selectoresConHover.add(parte.replace(/:hover/g, '').trim() || '*'));
          }
        }
        if (regla.cssRules) recorrerReglas(regla.cssRules, selector);
      }
    };
    for (const hoja of document.styleSheets) {
      try { recorrerReglas(hoja.cssRules, ''); } catch (e) { }
    }
    const conHover = [];
    for (const selector of selectoresConHover) {
      if (selector === '*' || selector.length > 200) continue;
      try { document.querySelectorAll(selector).forEach((el) => conHover.push(el)); } catch (e) { }
    }
    const conPuntero = [...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).cursor === 'pointer' && (!el.parentElement || getComputedStyle(el.parentElement).cursor !== 'pointer'));
    const semantico = (el) => el.matches(SELECTOR);
    const enorme = (el) => { const r = el.getBoundingClientRect(); return r.width > anchoVentana * 0.9 && r.height > altoVentana * 0.5; };
    const candidatos = [...new Set([...document.querySelectorAll(SELECTOR), ...conHover, ...conPuntero])]
      .filter((el) => el !== document.body && el !== document.documentElement && visible(el) && !enorme(el))
      .filter((el) => !el.closest('[role="dialog"], [role="alertdialog"], dialog'));
    const finales = candidatos
      .filter((el) => !candidatos.some((otro) => otro !== el && otro.contains(el) && otro.matches('button, a[href], summary, [role="button"], [role="link"]')))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => (a.r.top + scrollY) - (b.r.top + scrollY) || a.r.left - b.r.left);
    const nombreDe = (el) => (el.getAttribute('aria-label') || (el.innerText || '').trim() || el.getAttribute('title') || el.value || el.getAttribute('placeholder') || el.querySelector('img[alt]')?.getAttribute('alt') || '').replace(/\s+/g, ' ').slice(0, 60);
    const vistas = {};
    document.querySelectorAll('[data-ux-n]').forEach((el) => el.removeAttribute('data-ux-n'));
    return finales.map(({ el, r }, n) => {
      el.setAttribute('data-ux-n', String(n));
      const rol = el.getAttribute('role') || '';
      const nombre = nombreDe(el);
      const base = `${el.tagName.toLowerCase()}|${rol}|${nombre}`;
      vistas[base] = (vistas[base] || 0) + 1;
      const redondear = (v) => Math.round(v * 10) / 10;
      return {
        n,
        firma: `${base}|${vistas[base]}`,
        repeticion: vistas[base],
        etiqueta: el.tagName.toLowerCase(),
        rol,
        nombre,
        href: el.getAttribute('href'),
        destino: el.getAttribute('target'),
        tipo: el.getAttribute('type') || '',
        deshabilitado: !!(el.disabled || el.getAttribute('aria-disabled') === 'true'),
        esCampo: el.matches('input, select, textarea, label[for]'),
        esSemantico: semantico(el),
        cursor: getComputedStyle(el).cursor,
        title: el.getAttribute('title') || el.closest('[title]')?.getAttribute('title') || null,
        zonaPagina: { x: redondear(((r.left + scrollX) / anchoPagina) * 100), y: redondear(((r.top + scrollY) / altoPagina) * 100), ancho: redondear((r.width / anchoPagina) * 100), alto: redondear((r.height / altoPagina) * 100) },
      };
    });
  };

  const antesDelHover = (n) => {
    const el = document.querySelector(`[data-ux-n="${n}"]`);
    const estilo = getComputedStyle(el);
    const visible = (nodo) => {
      const r = nodo.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      for (let actual = nodo; actual && actual !== document.body; actual = actual.parentElement) {
        const s = getComputedStyle(actual);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false;
      }
      return true;
    };
    const contenedor = el.closest('tr, li, [role="row"], article, [class*="card"], [class*="tarjeta"]') || el.parentElement;
    window.__uxCambiados = new Set();
    window.__uxObservador?.disconnect();
    window.__uxObservador = new MutationObserver((registros) => registros.forEach((r) => {
      if (r.type === 'childList') r.addedNodes.forEach((nodo) => nodo.nodeType === 1 && window.__uxCambiados.add(nodo));
      else if (r.target.nodeType === 1) window.__uxCambiados.add(r.target);
    }));
    window.__uxObservador.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-state', 'open'] });
    window.__uxAntes = {
      estilo: ['backgroundColor', 'color', 'borderTopColor', 'boxShadow', 'textDecorationLine', 'opacity', 'transform', 'outlineStyle', 'filter'].map((p) => estilo[p]),
      ancho: el.offsetWidth,
      alto: el.offsetHeight,
      interactivosVisibles: new Set([...(contenedor?.querySelectorAll('button, a[href], [role="button"]') || [])].filter(visible)),
    };
  };

  const despuesDelHover = (n) => {
    const el = document.querySelector(`[data-ux-n="${n}"]`);
    window.__uxObservador?.disconnect();
    const antes = window.__uxAntes;
    const estilo = getComputedStyle(el);
    const ahora = ['backgroundColor', 'color', 'borderTopColor', 'boxShadow', 'textDecorationLine', 'opacity', 'transform', 'outlineStyle', 'filter'].map((p) => estilo[p]);
    const nombres = ['fondo', 'color', 'borde', 'sombra', 'subrayado', 'opacidad', 'transformación', 'contorno', 'filtro'];
    const cambios = ahora.map((v, i) => (v !== antes.estilo[i] ? nombres[i] : null)).filter(Boolean);
    const visible = (nodo) => {
      const r = nodo.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      for (let actual = nodo; actual && actual !== document.body; actual = actual.parentElement) {
        const s = getComputedStyle(actual);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false;
      }
      return true;
    };
    const aparecidos = [...(window.__uxCambiados || [])]
      .filter((nodo) => nodo.isConnected && nodo !== el && !nodo.contains(el) && visible(nodo) && (nodo.innerText || '').trim().length > 0);
    const externos = aparecidos.filter((nodo) => !aparecidos.some((otro) => otro !== nodo && otro.contains(nodo)));
    const flotante = externos.find((nodo) => nodo.getAttribute('role') === 'tooltip' || ['absolute', 'fixed'].includes(getComputedStyle(nodo).position));
    const contenedor = el.closest('tr, li, [role="row"], article, [class*="card"], [class*="tarjeta"]') || el.parentElement;
    const revelados = [...(contenedor?.querySelectorAll('button, a[href], [role="button"]') || [])]
      .filter((b) => visible(b) && !antes.interactivosVisibles.has(b))
      .map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 40));
    const normalizar = (t) => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const textoVisible = normalizar(el.innerText || el.value || '');
    const caja = (nodo) => {
      const r = nodo.getBoundingClientRect();
      const redondear = (v) => Math.round(v * 10) / 10;
      return { x: redondear((r.left / innerWidth) * 100), y: redondear((r.top / innerHeight) * 100), ancho: redondear((r.width / innerWidth) * 100), alto: redondear((r.height / innerHeight) * 100) };
    };
    const textoFlotante = flotante ? (flotante.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120) : null;
    return {
      respondeVisualmente: cambios.length > 0 || !!flotante || revelados.length > 0,
      cambios,
      cambiaDeTamano: el.offsetWidth !== antes.ancho || el.offsetHeight !== antes.alto,
      tooltip: textoFlotante ? {
        texto: textoFlotante,
        origen: flotante.getAttribute('role') === 'tooltip' ? 'role=tooltip' : 'elemento flotante',
        repiteTextoVisible: !!textoVisible && (normalizar(textoFlotante) === textoVisible || textoVisible.includes(normalizar(textoFlotante))),
        zonaVentana: caja(flotante),
      } : null,
      revelaAcciones: revelados,
      zonaVentana: caja(el),
    };
  };

  const antesDelClic = (n) => {
    const el = document.querySelector(`[data-ux-n="${n}"]`);
    window.__uxPrimeraMutacion = null;
    window.__uxObservadorClic?.disconnect();
    window.__uxObservadorClic = new MutationObserver(() => { if (window.__uxPrimeraMutacion === null) window.__uxPrimeraMutacion = performance.now(); });
    window.__uxObservadorClic.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    window.__uxT0 = performance.now();
    const visibles = (selector) => [...document.querySelectorAll(selector)].filter((d) => { const r = d.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length;
    return { dialogos: visibles('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]'), desplegables: visibles('[role="menu"], [role="listbox"]'), expandido: el.getAttribute('aria-expanded') };
  };

  const estadoTrasClic = (n) => {
    const el = document.querySelector(`[data-ux-n="${n}"]`);
    const visibles = (selector) => [...document.querySelectorAll(selector)].filter((d) => { const r = d.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    return {
      ms: window.__uxPrimeraMutacion === null ? null : Math.round(window.__uxPrimeraMutacion - window.__uxT0),
      dialogos: visibles('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]').length,
      desplegables: visibles('[role="menu"], [role="listbox"]').length,
      expandido: el ? el.getAttribute('aria-expanded') : null,
      indicador: visibles('[aria-busy="true"], [role="progressbar"], .animate-spin, [class*="spinner"], [class*="loading"], [class*="cargando"]').length > 0 || !!(el && (el.disabled || el.getAttribute('aria-busy') === 'true')),
      foco: document.activeElement?.getAttribute('data-ux-n') ?? null,
    };
  };

  const cerrarDialogo = async (n) => {
    const contarDialogos = () => page.evaluate(() => [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]')].filter((d) => d.getBoundingClientRect().width > 0).length);
    const abiertos = await contarDialogos();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    const cierraConEscape = (await contarDialogos()) < abiertos;
    let cierraConBoton = null;
    if (!cierraConEscape) {
      const boton = page.locator('[role="dialog"], [role="alertdialog"], dialog[open]').last().locator('button, [role="button"]').filter({ hasText: /cancelar|cerrar|volver|close|cancel|^\s*[×✕x]\s*$/i }).first();
      const porNombre = page.locator('[role="dialog"] [aria-label*="cerrar" i], [role="dialog"] [aria-label*="close" i]').first();
      const objetivo = (await boton.count()) ? boton : porNombre;
      if (await objetivo.count()) {
        await objetivo.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(450);
        cierraConBoton = (await contarDialogos()) < abiertos;
      } else {
        cierraConBoton = false;
      }
    }
    const focoVuelve = await page.evaluate((num) => document.activeElement?.getAttribute('data-ux-n') === String(num), n);
    return { cierraConEscape, cierraConBoton, focoVuelve };
  };

  const quienTapa = (error, porDefecto) => {
    const mensaje = String(error?.message || error).replace(/\u001b\[[0-9;]*m/g, '');
    const linea = mensaje.split('\n').reverse().find((l) => l.includes('intercepts pointer events'));
    if (!linea) return `${porDefecto}: ${mensaje.split('\n')[0].slice(0, 80)}`;
    return linea.replace(/intercepts pointer events.*/, '').replace(/^\s*-\s*/, '').replace(/…/g, '').trim().slice(0, 100);
  };

  const capturar = async (sufijo) => {
    if (capturasTomadas >= MAXIMO_CAPTURAS) return null;
    capturasTomadas += 1;
    const archivo = `${PANTALLA}-int-${sufijo}.png`;
    await page.screenshot({ path: `${CARPETA}/${archivo}` }).catch(() => {});
    return archivo;
  };

  const volverAlInicio = async (forzar = false) => {
    if (forzar || page.url() !== urlInicial) {
      await page.goto(urlInicial, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => { document.activeElement?.blur?.(); });
    await page.mouse.move(0, 0);
    return page.evaluate(recolectar);
  };

  let lista = await volverAlInicio();
  const capturaBase = `${PANTALLA}-int-base.png`;
  await page.screenshot({ path: `${CARPETA}/${capturaBase}`, fullPage: true }).catch(() => {});
  const total = lista.length;
  const aRecorrer = lista.slice(DESDE, DESDE + CANTIDAD).map((e) => e.firma);
  const resultados = [];

  for (const firma of aRecorrer) {
    let elemento = lista.find((e) => e.firma === firma);
    if (!elemento) {
      lista = await volverAlInicio();
      elemento = lista.find((e) => e.firma === firma);
      if (!elemento) { resultados.push({ firma, omitido: 'ya no está en la pantalla' }); continue; }
    }
    const { n } = elemento;
    let quedoAlgoAbierto = false;
    const registro = { n, nombre: elemento.nombre || `(${elemento.etiqueta} sin nombre)`, etiqueta: elemento.etiqueta, rol: elemento.rol, zonaPagina: elemento.zonaPagina, esSemantico: elemento.esSemantico, cursor: elemento.cursor, titleNativo: elemento.title };
    try {
      if (elemento.repeticion > REPETIDOS_POR_FIRMA) { resultados.push({ ...registro, omitido: 'repetido (mismo control en otra fila)' }); continue; }
      const localizador = page.locator(`[data-ux-n="${n}"]`);
      await page.mouse.move(0, 0);
      await page.evaluate(antesDelHover, n);
      const tapadoAlPasar = await localizador.hover({ timeout: 2500 }).then(() => null).catch((error) => quienTapa(error, 'no se pudo alcanzar'));
      if (tapadoAlPasar) {
        await localizador.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
        registro.clic = { pulsado: false, tapadoPor: tapadoAlPasar, respuesta: 'tapado por otro elemento' };
        registro.clic.captura = await capturar(`${n}-tapado`);
        resultados.push(registro);
        continue;
      }
      await page.waitForTimeout(ESPERA_HOVER_MS);
      registro.hover = await page.evaluate(despuesDelHover, n);
      if (registro.hover.tooltip || registro.hover.revelaAcciones.length) registro.hover.captura = await capturar(`${n}-hover`);

      const motivoParaNoPulsar =
        elemento.deshabilitado ? 'deshabilitado' :
        elemento.esCampo ? 'campo de entrada' :
        VERBOS_QUE_ESCRIBEN.test(`${elemento.nombre} ${elemento.title || ''}`) ? 'su nombre dice que escribe o sale' :
        elemento.href && /^https?:/i.test(elemento.href) && !elemento.href.startsWith(origen) ? 'enlace a otro sitio' :
        elemento.href && /^(mailto|tel|sms):/i.test(elemento.href) ? 'enlace de contacto' :
        null;
      if (motivoParaNoPulsar) { registro.clic = { pulsado: false, motivo: motivoParaNoPulsar }; resultados.push(registro); continue; }

      const urlAntes = page.url();
      const peticionesAntes = peticiones;
      const escriturasAntes = escriturasBloqueadas.length;
      const erroresAntes = erroresDeConsola.length;
      const pestanasAntes = pestanasNuevas.length;
      const descargasAntes = descargas;
      const previo = await page.evaluate(antesDelClic, n);
      let tapadoPor = null;
      await localizador.click({ timeout: 2500 }).catch((error) => { tapadoPor = quienTapa(error, 'no se pudo pulsar'); });
      let estado = null;
      let vioIndicador = false;
      const inicio = Date.now();
      while (Date.now() - inicio < ESPERA_RESPUESTA_MS) {
        await page.waitForTimeout(150);
        estado = await page.evaluate(estadoTrasClic, n).catch(() => null);
        if (estado?.indicador) vioIndicador = true;
        if (page.url() !== urlAntes) break;
        if (estado && estado.ms !== null && Date.now() - inicio > estado.ms + 400) break;
      }
      const clic = { pulsado: !tapadoPor, tapadoPor, ms: estado?.ms ?? null, indicadorDeCarga: vioIndicador };
      const escrituras = escriturasBloqueadas.slice(escriturasAntes);
      const errores = erroresDeConsola.slice(erroresAntes);
      if (escrituras.length) clic.escriturasBloqueadas = escrituras;
      if (errores.length) clic.erroresDeConsola = errores;

      if (tapadoPor) clic.respuesta = 'tapado por otro elemento';
      else if (pestanasNuevas.length > pestanasAntes) clic.respuesta = 'abrió una pestaña nueva';
      else if (descargas > descargasAntes) clic.respuesta = 'descargó un archivo';
      else if (page.url() !== urlAntes && page.url().split('#')[0] === urlAntes.split('#')[0]) clic.respuesta = estado && estado.ms !== null ? 'cambió la pantalla' : 'sin efecto visible (solo cambió el ancla)';
      else if (page.url() !== urlAntes) { clic.respuesta = 'navegó'; clic.navegoA = page.url().replace(origen, ''); }
      else if (estado && estado.dialogos > previo.dialogos) clic.respuesta = 'abrió un diálogo';
      else if (estado && (estado.desplegables > previo.desplegables || (estado.expandido === 'true' && previo.expandido !== 'true'))) clic.respuesta = 'abrió un desplegable';
      else if (escrituras.length) clic.respuesta = 'intentó escribir (bloqueado)';
      else if (estado && estado.ms !== null) clic.respuesta = 'cambió la pantalla';
      else if (peticiones > peticionesAntes) clic.respuesta = 'pidió datos sin cambiar nada visible';
      else clic.respuesta = 'sin efecto visible';
      clic.lentoSinIndicador = clic.ms !== null && clic.ms > RESPUESTA_LENTA_MS && !vioIndicador;

      if (clic.respuesta === 'abrió un diálogo') {
        clic.captura = await capturar(`${n}-dialogo`);
        clic.dialogo = await cerrarDialogo(n);
        if (!clic.dialogo.cierraConEscape && !clic.dialogo.cierraConBoton) quedoAlgoAbierto = true;
      } else if (clic.respuesta === 'abrió un desplegable') {
        clic.captura = await capturar(`${n}-desplegable`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(350);
        const tras = await page.evaluate(estadoTrasClic, n).catch(() => null);
        clic.desplegable = { cierraConEscape: !!tras && tras.desplegables <= previo.desplegables && tras.expandido !== 'true' };
        if (!clic.desplegable.cierraConEscape) quedoAlgoAbierto = true;
      } else if (clic.respuesta === 'intentó escribir (bloqueado)' || clic.erroresDeConsola) {
        clic.captura = await capturar(`${n}-error`);
      } else if (clic.respuesta === 'tapado por otro elemento') {
        clic.captura = await capturar(`${n}-tapado`);
      }
      registro.clic = clic;
      while (pestanasNuevas.length > pestanasAntes) await pestanasNuevas.pop().close().catch(() => {});
    } catch (error) {
      registro.error = String(error.message || error).slice(0, 160);
    }
    resultados.push(registro);
    const hayDialogo = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]')].some((d) => d.getBoundingClientRect().width > 0)).catch(() => false);
    if (hayDialogo) await page.keyboard.press('Escape');
    if (page.url() !== urlInicial || hayDialogo || quedoAlgoAbierto) lista = await volverAlInicio(true);
    else await page.mouse.move(0, 0);
  }

  await page.unroute('**/*', guardiaDeEscritura);
  page.off('request', alPedir);
  page.off('console', alError);
  page.off('pageerror', alFallarPagina);
  page.off('dialog', alDialogoNativo);
  page.off('download', alDescargar);
  page.context().off('page', alAbrirPestana);
  if (page.url() !== urlInicial) await page.goto(urlInicial).catch(() => {});

  const pulsados = resultados.filter((r) => r.clic?.pulsado);
  const nombre = (r) => `#${r.n} ${r.nombre}`;
  return {
    pantalla: PANTALLA,
    url: urlInicial,
    capturaBase,
    totalEnPantalla: total,
    recorridos: `${DESDE}–${DESDE + aRecorrer.length - 1}`,
    siguienteDesde: DESDE + CANTIDAD < total ? DESDE + CANTIDAD : null,
    resumen: {
      tooltips: resultados.filter((r) => r.hover?.tooltip || r.titleNativo).map((r) => `${nombre(r)} → «${r.hover?.tooltip?.texto || r.titleNativo}»${r.hover?.tooltip?.repiteTextoVisible ? ' (repite el texto visible)' : ''}${r.titleNativo && !r.hover?.tooltip ? ' (title nativo)' : ''}`),
      accionesQueSoloAparecenConHover: resultados.filter((r) => r.hover?.revelaAcciones?.length).map((r) => `${nombre(r)} → ${r.hover.revelaAcciones.join(', ')}`),
      clickeablesSinRespuestaAlHover: resultados.filter((r) => r.hover && !r.hover.respondeVisualmente && r.clic?.pulsado).map(nombre),
      saltanAlPasarElMouse: resultados.filter((r) => r.hover?.cambiaDeTamano).map(nombre),
      clicsSinEfecto: pulsados.filter((r) => r.clic.respuesta.startsWith('sin efecto visible')).map(nombre),
      tapadosPorOtroElemento: resultados.filter((r) => r.clic?.tapadoPor).map((r) => `${nombre(r)} → ${r.clic.tapadoPor}`),
      lentosSinIndicador: pulsados.filter((r) => r.clic.lentoSinIndicador).map((r) => `${nombre(r)} (${r.clic.ms} ms)`),
      dialogosQueNoCierranConEscape: pulsados.filter((r) => r.clic.dialogo && !r.clic.dialogo.cierraConEscape).map((r) => `${nombre(r)}${r.clic.dialogo.cierraConBoton === false ? ' (tampoco con un botón de cerrar)' : ''}`),
      focoQueNoVuelveAlCerrar: pulsados.filter((r) => r.clic.dialogo && !r.clic.dialogo.focoVuelve).map(nombre),
      desplegablesQueNoCierranConEscape: pulsados.filter((r) => r.clic.desplegable && !r.clic.desplegable.cierraConEscape).map(nombre),
      clickeablesSinRolNiTeclado: resultados.filter((r) => !r.esSemantico && r.cursor === 'pointer').map(nombre),
      conAparienciaDeBotonSinPuntero: resultados.filter((r) => r.esSemantico && r.cursor !== 'pointer' && r.clic?.pulsado && !['input', 'select', 'textarea'].includes(r.etiqueta)).map(nombre),
      escriturasBloqueadas: [...new Set(escriturasBloqueadas)],
      erroresDeConsola: [...new Set(erroresDeConsola)].slice(0, 10),
      dialogosNativos,
      noPulsados: resultados.filter((r) => r.clic && !r.clic.pulsado).map((r) => `${nombre(r)}: ${r.clic.motivo || r.clic.tapadoPor}`),
    },
    elementos: resultados.filter((r) => r.error || r.hover?.tooltip || r.hover?.revelaAcciones?.length || r.hover?.cambiaDeTamano || (r.clic && r.clic.pulsado && r.clic.respuesta !== 'cambió la pantalla' && r.clic.respuesta !== 'navegó') || r.clic?.tapadoPor || r.clic?.dialogo || r.clic?.lentoSinIndicador),
  };
}
