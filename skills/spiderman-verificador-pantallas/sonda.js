() => {
  const FILAS_MAXIMAS_SIN_PAGINAR = 50;
  const ESPACIO_LIBRE_SOSPECHOSO = 120;
  const ancho = document.documentElement.clientWidth;
  const alto = window.innerHeight;

  const describir = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const clases = typeof el.className === 'string'
      ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 4).map((c) => `.${c}`).join('')
      : '';
    const texto = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return `${el.tagName.toLowerCase()}${id}${clases}${texto ? ` «${texto}»` : ''}`;
  };

  const esVisible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };

  const caja = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), ancho: Math.round(r.width), alto: Math.round(r.height) };
  };

  const lineasDelTexto = (el) => {
    const rango = document.createRange();
    const alturas = new Set();
    for (const nodo of el.childNodes) {
      if (nodo.nodeType !== Node.TEXT_NODE || !nodo.textContent.trim()) continue;
      rango.selectNodeContents(nodo);
      for (const r of rango.getClientRects()) if (r.width > 1) alturas.add(Math.round(r.top));
    }
    return alturas.size;
  };

  const elementos = [...document.querySelectorAll('body *')].filter(esVisible);
  const desplazable = (valor) => valor === 'auto' || valor === 'scroll' || valor === 'overlay';
  const recorta = (valor) => valor === 'hidden' || valor === 'clip';

  const conScrollVertical = elementos.filter((el) => desplazable(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
  const conScrollHorizontal = elementos.filter((el) => desplazable(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth + 1);
  const paginaHaceScroll = document.scrollingElement.scrollHeight > alto + 1;

  const scrollDentroDeScroll = conScrollVertical
    .filter((el) => paginaHaceScroll || conScrollVertical.some((otro) => otro !== el && otro.contains(el)))
    .map((el) => ({
      elemento: describir(el),
      caja: caja(el),
      contenidoOculto: el.scrollHeight - el.clientHeight,
      dentroDe: conScrollVertical.filter((otro) => otro !== el && otro.contains(el)).map(describir).concat(paginaHaceScroll ? ['la página'] : []),
    }));

  const scrollConEspacioLibre = conScrollVertical
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.bottom < alto - ESPACIO_LIBRE_SOSPECHOSO && r.bottom > 0)
    .map(({ el, r }) => ({
      elemento: describir(el),
      caja: caja(el),
      contenidoOculto: el.scrollHeight - el.clientHeight,
      espacioLibreDebajo: Math.round(alto - r.bottom),
      alturaMaxima: getComputedStyle(el).maxHeight,
    }));

  const recortados = elementos
    .filter((el) => {
      const s = getComputedStyle(el);
      const cortaAPropositoConPuntos = s.textOverflow === 'ellipsis' || (!!s.webkitLineClamp && s.webkitLineClamp !== 'none');
      if (cortaAPropositoConPuntos) return false;
      const cortaAlto = recorta(s.overflowY) && el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 40;
      const cortaAncho = recorta(s.overflowX) && el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 40;
      return cortaAlto || cortaAncho;
    })
    .map((el) => ({
      elemento: describir(el),
      caja: caja(el),
      pxOcultosAlto: Math.max(0, el.scrollHeight - el.clientHeight),
      pxOcultosAncho: Math.max(0, el.scrollWidth - el.clientWidth),
    }));

  const cuerpo = getComputedStyle(document.body);
  const html = getComputedStyle(document.documentElement);
  const paginaBloqueada = (recorta(cuerpo.overflowY) || recorta(html.overflowY)) && document.body.scrollHeight > alto + 1;

  const tieneAncestroDesplazable = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (desplazable(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) return true;
    }
    return false;
  };
  const inalcanzables = paginaHaceScroll
    ? []
    : elementos
        .filter((el) => el.children.length === 0 && el.getBoundingClientRect().top > alto && !tieneAncestroDesplazable(el))
        .slice(0, 15)
        .map((el) => ({ elemento: describir(el), caja: caja(el) }));

  const desbordeHorizontalDePagina = document.scrollingElement.scrollWidth > ancho + 1;
  const salenPorLaDerecha = elementos
    .filter((el) => el.getBoundingClientRect().right > ancho + 1 && !conScrollHorizontal.some((c) => c.contains(el) && c !== el))
    .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= ancho + 1)
    .slice(0, 15)
    .map((el) => ({ elemento: describir(el), caja: caja(el), sobra: Math.round(el.getBoundingClientRect().right - ancho) }));

  const textoAplastado = elementos
    .filter((el) => {
      const texto = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' ').trim();
      if (texto.length < 8) return false;
      const lineas = lineasDelTexto(el);
      const palabras = texto.split(/\s+/).length;
      return lineas >= 3 && palabras / lineas <= 2;
    })
    .slice(0, 20)
    .map((el) => ({ elemento: describir(el), caja: caja(el) }));

  const hayPaginador = !!document.querySelector('.p-paginator, [class*="paginat"], [class*="pagina"], [aria-label*="pagin" i], nav[aria-label*="página" i]');
  const listas = [...document.querySelectorAll('table, [role="table"], [role="grid"], ul, ol')]
    .filter(esVisible)
    .map((el) => ({ el, filas: el.querySelectorAll(':scope > tbody > tr, :scope > [role="rowgroup"] > [role="row"], :scope > li').length }))
    .filter(({ filas }) => filas > FILAS_MAXIMAS_SIN_PAGINAR)
    .map(({ el, filas }) => ({ elemento: describir(el), filas, hayPaginadorEnLaPagina: hayPaginador }));

  const textosDe = (selector) => [...document.querySelectorAll(selector)].filter(esVisible).map((el) => (el.innerText || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
  const repetidos = (textos) => Object.entries(textos.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {})).filter(([, n]) => n > 1).map(([texto, veces]) => ({ texto, veces }));

  const migas = textosDe('[aria-label*="breadcrumb" i] li, [class*="breadcrumb"] li, nav[aria-label*="miga" i] li, [class*="miga"] a, [class*="miga"] span');

  const tablasConScrollHorizontal = [...document.querySelectorAll('table')]
    .filter(esVisible)
    .map((tabla) => {
      let contenedor = tabla.parentElement;
      while (contenedor && contenedor !== document.body && !desplazable(getComputedStyle(contenedor).overflowX)) contenedor = contenedor.parentElement;
      return { tabla, contenedor };
    })
    .filter(({ contenedor }) => contenedor && contenedor !== document.body && contenedor.scrollWidth > contenedor.clientWidth + 1)
    .map(({ tabla, contenedor }) => ({ tabla: describir(tabla), anchoTabla: Math.round(tabla.getBoundingClientRect().width), pxOcultos: contenedor.scrollWidth - contenedor.clientWidth }));

  const controlesConScrollHorizontal = conScrollHorizontal
    .filter((el) => el !== document.scrollingElement && el !== document.body && !el.querySelector('table'))
    .slice(0, 10)
    .map((el) => ({ elemento: describir(el), pxOcultos: el.scrollWidth - el.clientWidth }));

  const PATRON_DE_DATO = /(^S\/\s?[\d,.]+$)|(^\S+@\S+$)|(^\d{2}\/\d{2}\/\d{4}$)|(^[A-Z0-9]+(-[A-Z0-9+]+){2,}$)/;
  const datosPartidos = elementos
    .filter((el) => el.children.length === 0)
    .filter((el) => PATRON_DE_DATO.test((el.innerText || '').trim()))
    .filter((el) => lineasDelTexto(el) > 1)
    .slice(0, 10)
    .map((el) => ({ elemento: describir(el), caja: caja(el) }));

  return {
    url: location.href,
    viewport: { ancho, alto },
    paginaHaceScroll,
    paginaBloqueada,
    desbordeHorizontalDePagina,
    scrollDentroDeScroll,
    scrollConEspacioLibre,
    recortados: recortados.slice(0, 20),
    inalcanzables,
    salenPorLaDerecha,
    textoAplastado,
    listasLargasSinPaginar: listas,
    titulos: textosDe('h1, h2'),
    ultimaMiga: migas[migas.length - 1] || null,
    botonesRepetidos: repetidos(textosDe('button, a[role="button"], .p-button')),
    titulosRepetidos: repetidos(textosDe('h1, h2, h3')),
    tablasConScrollHorizontal,
    controlesConScrollHorizontal,
    datosPartidos,
  };
}
