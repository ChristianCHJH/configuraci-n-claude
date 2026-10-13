async (page) => {
  const PASOS_DE_TAB = 25;

  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });

  const paradas = [];
  for (let paso = 1; paso <= PASOS_DE_TAB; paso += 1) {
    await page.keyboard.press('Tab');
    const parada = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const conAnillo = (estilo) =>
        (estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0) ||
        (estilo.boxShadow && estilo.boxShadow !== 'none');
      const indicadorVisible = conAnillo(s) || [...el.querySelectorAll('*')].some((h) => conAnillo(getComputedStyle(h)));
      const texto = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
      return {
        elemento: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${texto ? ` «${texto}»` : ''}`,
        x: Math.round(r.left + scrollX),
        y: Math.round(r.top + scrollY),
        visibleEnPantalla: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
        indicadorVisible,
        dentroDeDialogo: !!el.closest('[role="dialog"], [role="alertdialog"], dialog'),
      };
    });
    if (!parada) continue;
    paradas.push({ paso, ...parada });
  }

  const sinIndicador = paradas.filter((p) => !p.indicadorVisible);
  const invisibles = paradas.filter((p) => !p.visibleEnPantalla);
  const saltosHaciaAtras = paradas
    .slice(1)
    .filter((p, i) => p.y < paradas[i].y - 200)
    .map((p) => p.elemento);

  return {
    paradas,
    resumen: {
      totalParadas: paradas.length,
      sinIndicadorDeFoco: sinIndicador.map((p) => p.elemento),
      focoFueraDeLaVista: invisibles.map((p) => p.elemento),
      saltosDeOrdenSospechosos: saltosHaciaAtras,
    },
  };
}
