(async function bootstrapGeneratorRoute() {
  const sourcePath = window.__RPI_GENERATOR_PAGE_SOURCE__ || 'generator/index.html?v=20261028-marquee-home-secret';
  const descriptionTag = document.querySelector('meta[name="description"]');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Dynamically inserted scripts are async by default. Keep dependency order
      // while allowing the browser to download every generator module together.
      script.async = false;
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.append(script);
    });
  }

  async function ensureGeneratorRoutes() {
    if (window.GeneratorRoutes) {
      return window.GeneratorRoutes;
    }

    await loadScript('js/utils/generatorRoutes.js?v=20261028-marquee-home-secret');
    return window.GeneratorRoutes || null;
  }

  try {
    const generatorRoutes = await ensureGeneratorRoutes();
    const legacyGeneratorUrl = generatorRoutes
      ? generatorRoutes.getLegacyGeneratorRedirectUrl(window.location.pathname, window.location.search)
      : null;

    if (legacyGeneratorUrl) {
      window.location.replace(legacyGeneratorUrl + window.location.hash);
      return;
    }

    const response = await fetch(sourcePath);
    if (!response.ok) {
      throw new Error(`Failed to load generator shell: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const bodyClone = doc.body.cloneNode(true);
    const scriptSources = Array.from(bodyClone.querySelectorAll('script[src]'))
      .map(script => script.getAttribute('src'))
      .filter(src => src && !(window.GeneratorRoutes && src.startsWith('js/utils/generatorRoutes.js')));
    if (window.__RPI_GENERATOR_ROUTE_STYLE__ === 'lunar') {
      const lunarSource = 'js/utils/lunarBarAsset.js?v=20261027-artemis-vector';
      const patternIndex = scriptSources.findIndex(src => src.startsWith('js/utils/barPattern.js'));
      scriptSources.splice(patternIndex < 0 ? scriptSources.length : patternIndex, 0, lunarSource);
    }

    // Download dependencies together; async=false preserves their execution order.
    const shellSources = Array.from(doc.querySelectorAll('script[src]'), script => script.getAttribute('src'));
    const earlyScripts = new Set();
    const earlySources = ['numericControls', 'selectorPreviews', 'loopingGif', 'featherIcons', 'shareState', 'musicStyle', 'barPattern', 'tickerDisplay', 'profanityFilter', 'quantumModel', 'generatorParameters', 'barInformation']
      .map(name => shellSources.find(src => src.startsWith(`js/utils/${name}.js`))).filter(Boolean);
    await Promise.all(earlySources.map(source => { earlyScripts.add(source); return loadScript(source); }));
    // Reconcile fetched shell CSS before inserting its chrome (also protects old route stubs).
    const shellCSS = doc.querySelector('link[rel="stylesheet"][href*="css/style.css"]');
    const routeCSS = document.querySelector('link[rel="stylesheet"][href*="css/style.css"]');
    if (shellCSS && routeCSS && routeCSS.getAttribute('href') !== shellCSS.getAttribute('href')) {
      await new Promise((resolve, reject) => {
        routeCSS.onload = resolve;
        routeCSS.onerror = () => reject(new Error('The generator stylesheet did not load.'));
        routeCSS.href = shellCSS.getAttribute('href');
      });
    }
    window.BarShareState?.prepareTrigger(bodyClone);
    window.GeneratorInitialState.apply(bodyClone);
    window.BarInformation?.sync(bodyClone);
    bodyClone.querySelectorAll('script').forEach(script => script.remove());
    document.body.replaceChildren(...bodyClone.childNodes);
    window.setupCustomDropdowns();
    window.ParameterControls.prepare(document);
    window.GeneratorInitialState.syncHeaderLayout();

    if (doc.title) {
      document.title = doc.title;
    }

    const sourceDescription = doc.querySelector('meta[name="description"]');
    if (descriptionTag && sourceDescription) {
      descriptionTag.setAttribute('content', sourceDescription.getAttribute('content') || '');
    }

    await Promise.all(scriptSources.filter(src => !earlyScripts.has(src)).map(loadScript));

    // The routed generator pages load p5 before the generator scripts are injected,
    // so p5's automatic global-mode boot can miss `window.setup`. Explicitly start
    // one instance after the scripts are in place.
    if (typeof window.p5 !== 'function' || typeof window.setup !== 'function') {
      throw new Error('The generator renderer did not load.');
    }
    if (!window.__RPI_GENERATOR_P5_INSTANCE__) {
      window.__RPI_GENERATOR_P5_INSTANCE__ = new window.p5();
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    const errorTarget = document.getElementById('p5-container') || document.body;
    errorTarget.removeAttribute('role');
    errorTarget.removeAttribute('aria-label');
    errorTarget.innerHTML = '<div class="generator_error" role="alert"><h1>Unable to load the generator</h1><p>Check your connection and try again.</p><button type="button" id="retry-generator">Retry</button></div>';
    document.getElementById('retry-generator').addEventListener('click', () => window.location.reload());
  }
})();
