async (page) => {
  const BASE = 'http://127.0.0.1:8380';

  const RECORRIDOS = [
    {
      nombre: 'Ficha del cliente → contrato → volver',
      origen: '/clientes/498/lotes',
      abrir: { rol: 'link', nombre: 'Ver contrato' },
      destino: /^\/contratos\/\d+$/,
      volver: { rol: 'link', nombre: /^← / },
      etiquetaEsperada: /CESAR/,
    },
  ];

  const soloRuta = (url) => String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0].split('#')[0];
  const rutaActual = () => soloRuta(page.url());
  const localizar = (objetivo) =>
    objetivo.selector
      ? page.locator(objetivo.selector).first()
      : page.getByRole(objetivo.rol, { name: objetivo.nombre }).first();
  const esperarRuta = async (patron) => {
    await page.waitForURL((url) => patron.test(soloRuta(url)), { timeout: 8000 });
    await page.waitForTimeout(700);
  };

  const resultados = [];
  for (const recorrido of RECORRIDOS) {
    const hallazgos = [];
    try {
      await page.goto(BASE + '/');
      await page.waitForTimeout(500);
      const antesala = rutaActual();
      await page.goto(BASE + recorrido.origen);
      await page.waitForTimeout(1200);
      const origen = rutaActual();
      if (/ingresar|login/.test(origen)) throw new Error('la sesión venció: volver a ingresar y repetir');

      await localizar(recorrido.abrir).click();
      await esperarRuta(recorrido.destino);

      const regreso = localizar(recorrido.volver);
      const texto = (
        (await regreso.textContent())?.trim() ||
        (await regreso.getAttribute('aria-label')) ||
        ''
      ).trim();
      if (recorrido.etiquetaEsperada && !recorrido.etiquetaEsperada.test(texto)) {
        hallazgos.push(`C.2 el regreso dice «${texto}» y no nombra el origen`);
      }

      await regreso.click();
      await page.waitForTimeout(1200);
      if (rutaActual() !== origen) {
        hallazgos.push(`C.1 volver llevó a ${rutaActual()} y no a ${origen}`);
      } else {
        await page.goBack();
        await page.waitForTimeout(1000);
        if (rutaActual() !== antesala) {
          hallazgos.push(`C.3 Atrás del navegador fue a ${rutaActual()} y no a ${antesala}`);
        }
      }
      resultados.push((hallazgos.length ? 'FALLA ' : 'OK    ') + recorrido.nombre + (hallazgos.length ? ' · ' + hallazgos.join(' · ') : ` · «${texto}»`));
    } catch (error) {
      resultados.push('NO SE PUDO ' + recorrido.nombre + ' · en ' + rutaActual() + ' · ' + String(error.message).split('\n')[0]);
    }
  }
  return resultados.join('\n');
}
