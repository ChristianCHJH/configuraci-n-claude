() => {
  const MAXIMO_POR_LISTA = 15;
  const OBJETIVO_MINIMO_WCAG = 24;
  const OBJETIVO_COMODO_OPERATIVO = 32;
  const LETRA_MINIMA = 12;
  const anchoVentana = document.documentElement.clientWidth;
  const altoVentana = window.innerHeight;
  const anchoPagina = Math.max(document.scrollingElement.scrollWidth, anchoVentana);
  const altoPagina = Math.max(document.scrollingElement.scrollHeight, altoVentana);

  const lienzo = document.createElement('canvas');
  lienzo.width = 1;
  lienzo.height = 1;
  const pincel = lienzo.getContext('2d', { willReadFrequently: true });

  const aRgba = (color) => {
    if (!color || color === 'transparent') return [0, 0, 0, 0];
    pincel.clearRect(0, 0, 1, 1);
    pincel.fillStyle = '#000';
    pincel.fillStyle = color;
    pincel.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = pincel.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };

  const mezclar = (arriba, abajo) => {
    const alfa = arriba[3] + abajo[3] * (1 - arriba[3]);
    if (alfa === 0) return [0, 0, 0, 0];
    const canal = (i) => (arriba[i] * arriba[3] + abajo[i] * abajo[3] * (1 - arriba[3])) / alfa;
    return [canal(0), canal(1), canal(2), alfa];
  };

  const luminancia = ([r, g, b]) => {
    const lineal = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
  };

  const contraste = (a, b) => {
    const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (claro + 0.05) / (oscuro + 0.05);
  };

  const saturacionYLuz = ([r, g, b]) => {
    const [rn, gn, bn] = [r / 255, g / 255, b / 255];
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const luz = (max + min) / 2;
    const saturacion = max === min ? 0 : (max - min) / (1 - Math.abs(2 * luz - 1));
    return { saturacion, luz };
  };

  const hex = ([r, g, b]) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

  const fondoEfectivo = (el) => {
    let color = [0, 0, 0, 0];
    let incierto = false;
    for (let nodo = el; nodo; nodo = nodo.parentElement) {
      const s = getComputedStyle(nodo);
      if (s.backgroundImage && s.backgroundImage !== 'none') incierto = true;
      color = mezclar(color, aRgba(s.backgroundColor));
      if (color[3] >= 0.99) return { color, incierto };
    }
    return { color: mezclar(color, [255, 255, 255, 1]), incierto };
  };

  const describir = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const clases = typeof el.className === 'string'
      ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).map((c) => `.${c}`).join('')
      : '';
    const texto = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return `${el.tagName.toLowerCase()}${id}${clases}${texto ? ` «${texto}»` : ''}`;
  };

  const esVisible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };

  const zonas = (el) => {
    const r = el.getBoundingClientRect();
    const redondear = (n) => Math.round(n * 10) / 10;
    return {
      px: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), ancho: Math.round(r.width), alto: Math.round(r.height) },
      enVentana: r.bottom > 0 && r.top < altoVentana && r.right > 0 && r.left < anchoVentana,
      zonaVentana: { x: redondear((r.left / anchoVentana) * 100), y: redondear((r.top / altoVentana) * 100), ancho: redondear((r.width / anchoVentana) * 100), alto: redondear((r.height / altoVentana) * 100) },
      zonaPagina: { x: redondear(((r.left + scrollX) / anchoPagina) * 100), y: redondear(((r.top + scrollY) / altoPagina) * 100), ancho: redondear((r.width / anchoPagina) * 100), alto: redondear((r.height / altoPagina) * 100) },
    };
  };

  const ficha = (el, extra = {}) => ({ elemento: describir(el), ...zonas(el), ...extra });

  const textoPropio = (el) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();

  const visibles = [...document.querySelectorAll('body *')].filter(esVisible);
  const conTexto = visibles.filter((el) => textoPropio(el).length > 0 && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName));

  const SELECTOR_INTERACTIVO = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], [role="option"], [tabindex]:not([tabindex="-1"])';
  const interactivos = [...document.querySelectorAll(SELECTOR_INTERACTIVO)].filter(esVisible);
  const estaDeshabilitado = (el) => el.disabled || el.getAttribute('aria-disabled') === 'true' || !!el.closest('fieldset[disabled]');

  const contrasteBajo = conTexto
    .map((el) => {
      const s = getComputedStyle(el);
      const tamano = parseFloat(s.fontSize);
      const grueso = Number(s.fontWeight) >= 700;
      const grande = tamano >= 24 || (tamano >= 18.66 && grueso);
      const minimo = grande ? 3 : 4.5;
      const { color: fondo, incierto } = fondoEfectivo(el);
      const frente = mezclar(aRgba(s.color), fondo);
      const razon = contraste(frente, fondo);
      return { el, razon, minimo, tamano, incierto, frente, fondo };
    })
    .filter(({ el, razon, minimo }) => razon < minimo && !estaDeshabilitado(el.closest('button, input, select, textarea') || el))
    .sort((a, b) => a.razon - b.razon)
    .slice(0, MAXIMO_POR_LISTA)
    .map(({ el, razon, minimo, tamano, incierto, frente, fondo }) => ficha(el, {
      razon: Math.round(razon * 100) / 100,
      minimo,
      tamanoLetra: tamano,
      texto: hex(frente),
      fondo: hex(fondo),
      fondoIncierto: incierto,
    }));

  const textoMuyChico = conTexto
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) < LETRA_MINIMA)
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el, { tamanoLetra: parseFloat(getComputedStyle(el).fontSize) }));

  const esEnlaceEnLinea = (el) => el.tagName === 'A' && !!el.closest('p, li, td') && (el.parentElement.innerText || '').trim().length > (el.innerText || '').trim().length + 10;
  const rectangulos = interactivos.map((el) => ({ el, r: el.getBoundingClientRect() }));
  const esObjetivoChico = ({ el, r }) => {
    const chico = r.width < OBJETIVO_MINIMO_WCAG || r.height < OBJETIVO_MINIMO_WCAG;
    if (!chico || esEnlaceEnLinea(el)) return false;
    if (el.tagName !== 'INPUT') return true;
    return ['checkbox', 'radio'].includes(el.type) && !el.closest('label');
  };
  const chicos = rectangulos.filter(esObjetivoChico);
  const centro = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const distanciaARect = (p, r) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));
  const objetivosChicos = chicos
    .filter((a) => {
      const ca = centro(a.r);
      return rectangulos.some((b) => {
        if (b.el === a.el || b.el.contains(a.el) || a.el.contains(b.el)) return false;
        const esChico = chicos.includes(b);
        return esChico ? Math.hypot(ca.x - centro(b.r).x, ca.y - centro(b.r).y) < OBJETIVO_MINIMO_WCAG : distanciaARect(ca, b.r) < OBJETIVO_MINIMO_WCAG / 2;
      });
    })
    .slice(0, MAXIMO_POR_LISTA)
    .map(({ el, r }) => ficha(el, { ancho: Math.round(r.width), alto: Math.round(r.height) }));

  const objetivosPocoComodos = rectangulos
    .filter(({ el, r }) => el.tagName === 'BUTTON' && r.height < OBJETIVO_COMODO_OPERATIVO && r.height >= OBJETIVO_MINIMO_WCAG)
    .length;

  const nombreAccesible = (el) => {
    const etiquetadoPor = (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => document.getElementById(id)?.innerText || '').join(' ');
    const etiquetaFor = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.innerText || '' : '';
    const etiquetaEnvolvente = el.closest('label')?.innerText || '';
    return [el.getAttribute('aria-label'), etiquetadoPor, etiquetaFor, etiquetaEnvolvente, el.getAttribute('title')].map((t) => (t || '').trim()).find(Boolean) || '';
  };

  const campos = [...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')].filter(esVisible);
  const camposSinEtiqueta = campos
    .filter((el) => !nombreAccesible(el))
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el, { soloPlaceholder: !!el.getAttribute('placeholder'), placeholder: el.getAttribute('placeholder') || null }));

  const tieneTextoVisible = (el) => (el.innerText || '').trim().length > 0 || (el.tagName === 'INPUT' && !!el.value);
  const botones = interactivos.filter((el) => el.matches('button, [role="button"], a[href]'));
  const botonesSoloIcono = botones.filter((el) => !tieneTextoVisible(el) && !!el.querySelector('svg, img, i, [class*="icon"]'));
  const botonesSinNombre = botonesSoloIcono
    .filter((el) => !nombreAccesible(el))
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el));

  const conTitleVisual = visibles
    .filter((el) => el.hasAttribute('title') && el.getAttribute('title').trim())
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el, { title: el.getAttribute('title') }));

  const gruposDeBotonRelleno = {};
  for (const el of botones.filter((b) => b.matches('button, [role="button"]'))) {
    const fondo = aRgba(getComputedStyle(el).backgroundColor);
    if (fondo[3] < 0.5) continue;
    const { saturacion, luz } = saturacionYLuz(fondo);
    if (saturacion < 0.3 || luz < 0.15 || luz > 0.85) continue;
    const clave = hex(fondo);
    gruposDeBotonRelleno[clave] = gruposDeBotonRelleno[clave] || [];
    gruposDeBotonRelleno[clave].push(el);
  }
  const botonesDeColor = Object.entries(gruposDeBotonRelleno)
    .map(([color, lista]) => ({
      color,
      total: lista.length,
      enVentana: lista.filter((el) => zonas(el).enVentana).length,
      textos: [...new Set(lista.map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean))].slice(0, 8),
    }))
    .sort((a, b) => b.total - a.total);

  const deshabilitados = botones
    .filter(estaDeshabilitado)
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el));

  const textoTruncado = visibles
    .filter((el) => getComputedStyle(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1)
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el, { textoCompleto: (el.textContent || '').trim().slice(0, 80), tieneTitle: el.hasAttribute('title') }));

  const idiomaDeclarado = (document.documentElement.lang || '').toLowerCase();
  const textoDeLaPagina = (document.body.innerText || '').slice(0, 20000);
  const pareceEspanol = idiomaDeclarado
    ? idiomaDeclarado.startsWith('es')
    : (textoDeLaPagina.match(/[áéíóúñ¿¡]|\b(de|la|que|el|los|las|para|con)\b/gi) || []).length > 30;
  const PATRONES_DE_FUGA = [
    { tipo: 'valor técnico', patron: /\b(undefined|null|NaN|Invalid Date|\[object Object\]|true|false)\b/ },
    { tipo: 'identificador interno', patron: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i },
    { tipo: 'código de enum', patron: /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/ },
    { tipo: 'fecha ISO cruda', patron: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ },
    pareceEspanol && { tipo: 'texto en inglés', patron: /^(Loading|Submit|Cancel|Save|Delete|Search|Edit|Close|No data|No results( found)?|Something went wrong|Error|Next|Previous|Select|Rows per page|of)\b\.{0,3}$/i },
    { tipo: 'relleno', patron: /\blorem ipsum\b/i },
    { tipo: 'nota de desarrollo', patron: /\b(TODO|FIXME|XXX)\b/ },
  ].filter(Boolean);
  const fugas = [];
  for (const el of conTexto) {
    const texto = textoPropio(el);
    const coincide = PATRONES_DE_FUGA.find(({ patron }) => patron.test(texto));
    if (coincide) fugas.push(ficha(el, { tipo: coincide.tipo, texto: texto.slice(0, 80) }));
    if (fugas.length >= MAXIMO_POR_LISTA) break;
  }

  const PATRON_NUMERICO = /^[-+]?\s*(S\/|US\$|R\$|MX\$|\$|€|£)?\s*[\d.,]+\s*(kg|g|t|tn|m3|m³|km|%|h|d|€|USD|PEN|EUR)?$/i;
  const tablas = [...document.querySelectorAll('table')].filter(esVisible).slice(0, 6).map((tabla) => {
    const filas = [...tabla.querySelectorAll('tbody > tr')].filter(esVisible);
    const encabezados = [...tabla.querySelectorAll('thead th')].filter(esVisible);
    const columnasNumericasMalAlineadas = encabezados
      .map((th, indice) => {
        const celdas = filas.map((f) => f.children[indice]).filter(Boolean);
        const numericas = celdas.filter((c) => PATRON_NUMERICO.test((c.innerText || '').trim()));
        if (celdas.length < 3 || numericas.length / celdas.length < 0.7) return null;
        const alineaciones = new Set(numericas.map((c) => getComputedStyle(c).textAlign));
        const alDerecha = [...alineaciones].every((a) => a === 'right' || a === 'end');
        return alDerecha ? null : { columna: (th.innerText || '').trim() || `#${indice + 1}`, alineacion: [...alineaciones].join(',') };
      })
      .filter(Boolean);
    const thead = tabla.querySelector('thead');
    const encabezadoFijo = !!thead && [thead, ...thead.querySelectorAll('tr, th')].some((n) => getComputedStyle(n).position === 'sticky');
    const alturas = filas.slice(0, 20).map((f) => f.getBoundingClientRect().height);
    return {
      tabla: describir(tabla),
      ...zonas(tabla),
      columnas: encabezados.length,
      encabezados: encabezados.map((th) => (th.innerText || '').trim().replace(/\s+/g, ' ')).slice(0, 25),
      filasVisibles: filas.length,
      alturaMediaDeFila: alturas.length ? Math.round(alturas.reduce((a, b) => a + b, 0) / alturas.length) : null,
      encabezadoFijo,
      masAltaQueLaVentana: tabla.getBoundingClientRect().height > altoVentana,
      columnasNumericasMalAlineadas,
      tieneFilaSeleccionable: !!tabla.querySelector('tbody input[type="checkbox"]'),
    };
  });

  const contar = (valores) => Object.entries(valores.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([valor, veces]) => ({ valor, veces }));

  const tipografia = {
    tamanos: contar(conTexto.map((el) => getComputedStyle(el).fontSize)),
    familias: contar(conTexto.map((el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim())),
    pesos: contar(conTexto.map((el) => getComputedStyle(el).fontWeight)),
    coloresDeTexto: contar(conTexto.map((el) => hex(aRgba(getComputedStyle(el).color)))).slice(0, 12),
  };

  const formaDeBotones = contar(botones.filter((b) => b.tagName === 'BUTTON').map((el) => {
    const s = getComputedStyle(el);
    return `alto ${Math.round(el.getBoundingClientRect().height)} · radio ${s.borderTopLeftRadius} · letra ${s.fontSize}`;
  })).slice(0, 10);

  const encabezados = [...document.querySelectorAll('h1, h2, h3, [role="heading"]')]
    .filter(esVisible)
    .map((el) => ({ nivel: el.tagName.startsWith('H') ? Number(el.tagName[1]) : Number(el.getAttribute('aria-level') || 2), texto: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) }));

  const imagenesSinAlt = [...document.querySelectorAll('img')]
    .filter(esVisible)
    .filter((img) => !img.hasAttribute('alt'))
    .slice(0, MAXIMO_POR_LISTA)
    .map((el) => ficha(el, { src: (el.getAttribute('src') || '').slice(0, 80) }));

  const indicadoresDeEstado = {
    cargando: visibles.filter((el) => /cargando|loading/i.test(textoPropio(el)) || el.matches('[aria-busy="true"], [role="progressbar"], [class*="spinner"], [class*="skeleton"], .animate-spin, .animate-pulse')).length,
    vacio: visibles.filter((el) => /^(no hay|sin (resultados|datos|registros)|ningún|no se encontr)/i.test(textoPropio(el))).map((el) => textoPropio(el).slice(0, 80)).slice(0, 5),
    alertas: [...document.querySelectorAll('[role="alert"], [role="status"], [aria-live]')].filter(esVisible).map((el) => (el.innerText || '').trim().slice(0, 80)).filter(Boolean).slice(0, 5),
    dialogoAbierto: [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open]')].filter(esVisible).map((el) => describir(el)).slice(0, 3),
  };

  const enVentana = (el) => zonas(el).enVentana;
  const densidad = {
    interactivosEnVentana: interactivos.filter(enVentana).length,
    camposEnVentana: campos.filter(enVentana).length,
    botonesSoloIconoEnVentana: botonesSoloIcono.filter(enVentana).length,
    palabrasEnVentana: conTexto.filter(enVentana).reduce((total, el) => total + textoPropio(el).split(/\s+/).length, 0),
  };

  const INTENCIONES_DE_CAMPO = [
    { dato: 'correo', patron: /correo|e-?mail/i, esperado: 'type="email"', cumple: (el) => el.type === 'email' || el.inputMode === 'email' },
    { dato: 'teléfono', patron: /tel[eé]fono|celular|m[oó]vil|phone|whatsapp/i, esperado: 'type="tel"', cumple: (el) => el.type === 'tel' || ['tel', 'numeric'].includes(el.inputMode) },
    { dato: 'número', patron: /c[oó]digo postal|\bzip\b|\bdni\b|\bruc\b|n[uú]mero de (la )?tarjeta|card ?number|\bcvv\b|\bcvc\b|cantidad|monto|importe/i, esperado: 'inputmode="numeric" o "decimal"', cumple: (el) => ['numeric', 'decimal', 'tel'].includes(el.inputMode) || ['number', 'tel'].includes(el.type) },
  ];
  const camposConTecladoIncorrecto = campos
    .filter((el) => el.tagName === 'INPUT' && ['text', 'email', 'tel', 'number', 'search', ''].includes(el.type))
    .map((el) => {
      const pistas = [nombreAccesible(el), el.name, el.id, el.placeholder, el.getAttribute('autocomplete')].filter(Boolean).join(' ');
      const intencion = INTENCIONES_DE_CAMPO.find((i) => i.patron.test(pistas));
      return intencion && !intencion.cumple(el) ? ficha(el, { dato: intencion.dato, esperado: intencion.esperado, actual: `type="${el.type}"${el.inputMode ? ` inputmode="${el.inputMode}"` : ''}`, autocomplete: el.getAttribute('autocomplete') }) : null;
    })
    .filter(Boolean)
    .slice(0, MAXIMO_POR_LISTA);

  const barras = visibles
    .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
    .filter((el) => !el.closest('[role="dialog"], [role="alertdialog"], dialog'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < altoVentana && r.height < altoVentana * 0.6 && r.width > anchoVentana * 0.5;
    });
  const barrasExternas = barras.filter((el) => !barras.some((otra) => otra !== el && otra.contains(el)));
  const altoFijoTotal = barrasExternas.reduce((total, el) => total + el.getBoundingClientRect().height, 0);
  const barrasFijas = {
    porcentajeDeLaVentana: Math.round((altoFijoTotal / altoVentana) * 100),
    barras: barrasExternas.slice(0, 8).map((el) => ficha(el, { alto: Math.round(el.getBoundingClientRect().height), posicion: getComputedStyle(el).position })),
  };

  const casillasPremarcadas = [
    ...[...document.querySelectorAll('input[type="checkbox"]')].filter((el) => el.checked),
    ...[...document.querySelectorAll('[role="checkbox"][aria-checked="true"], [role="switch"][aria-checked="true"]')],
  ]
    .map((el) => ({ el, visible: el.closest('label') || el }))
    .filter(({ visible }) => esVisible(visible) || (visible.parentElement && esVisible(visible.parentElement)))
    .slice(0, MAXIMO_POR_LISTA)
    .map(({ el, visible }) => ficha(visible, { etiqueta: (nombreAccesible(el) || (visible.innerText || '')).trim().replace(/\s+/g, ' ').slice(0, 100) }));

  const TEXTOS_VAGOS = /^(haz )?(clic|click) aqu[ií]$|^aqu[ií]$|^(leer|ver|saber) m[aá]s$|^m[aá]s( informaci[oó]n)?$|^(click here|here|more|read more|learn more|see more)$/i;
  const enlacesVagos = contar([...document.querySelectorAll('a[href], [role="link"]')]
    .filter(esVisible)
    .map((el) => (el.innerText || '').trim().replace(/\s+/g, ' ').replace(/[›»→.…]+$/, '').trim())
    .filter((texto) => TEXTOS_VAGOS.test(texto)));

  const cajasDeBusqueda = [...document.querySelectorAll('input[type="search"], [role="search"] input, input[name*="search" i], input[name*="busca" i], input[placeholder*="busca" i], input[placeholder*="search" i], input[aria-label*="busca" i], input[aria-label*="search" i]')].filter(esVisible);
  const buscador = {
    cajaVisible: cajasDeBusqueda.length > 0,
    anchoDeLaCaja: cajasDeBusqueda[0] ? Math.round(cajasDeBusqueda[0].getBoundingClientRect().width) : null,
    soloLupa: !cajasDeBusqueda.length && botonesSoloIcono.some((b) => /busca|search/i.test(nombreAccesible(b))),
  };

  return {
    url: location.href,
    tituloDelDocumento: document.title,
    idioma: document.documentElement.lang || null,
    ventana: { ancho: anchoVentana, alto: altoVentana },
    pagina: { ancho: anchoPagina, alto: altoPagina, haceScroll: altoPagina > altoVentana + 1 },
    encabezados,
    densidad,
    indicadoresDeEstado,
    contrasteBajo,
    textoMuyChico,
    objetivosChicos,
    botonesBajosParaUsoIntensivo: objetivosPocoComodos,
    camposSinEtiqueta,
    botonesSinNombre,
    botonesSoloIcono: botonesSoloIcono.length,
    conTitleVisual,
    botonesDeColor,
    deshabilitados,
    textoTruncado,
    fugas,
    tablas,
    tipografia,
    formaDeBotones,
    imagenesSinAlt,
    camposConTecladoIncorrecto,
    barrasFijas,
    casillasPremarcadas,
    enlacesVagos,
    buscador,
  };
}
