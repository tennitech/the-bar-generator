(async function bootstrapGeneratorRoute() {
  const sourcePath = window.__RPI_GENERATOR_PAGE_SOURCE__ || 'generator/index.html';
  const descriptionTag = document.querySelector('meta[name="description"]');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.append(script);
    });
  }

  try {
    const response = await fetch(sourcePath, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load generator shell: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const bodyClone = doc.body.cloneNode(true);
    const scriptSources = Array.from(bodyClone.querySelectorAll('script[src]'))
      .map(script => script.getAttribute('src'))
      .filter(Boolean);

    bodyClone.querySelectorAll('script').forEach(script => script.remove());
    document.body.innerHTML = bodyClone.innerHTML;

    if (doc.title) {
      document.title = doc.title;
    }

    const sourceDescription = doc.querySelector('meta[name="description"]');
    if (descriptionTag && sourceDescription) {
      descriptionTag.setAttribute('content', sourceDescription.getAttribute('content') || '');
    }

    for (const src of scriptSources) {
      await loadScript(src);
    }

    // The routed generator pages load p5 before the generator scripts are injected,
    // so p5's automatic global-mode boot can miss `window.setup`. Explicitly start
    // one instance after the scripts are in place.
    if (
      typeof window.p5 === 'function' &&
      typeof window.setup === 'function' &&
      !window.__RPI_GENERATOR_P5_INSTANCE__
    ) {
      window.__RPI_GENERATOR_P5_INSTANCE__ = new window.p5();
    }
  } catch (error) {
    console.error(error);
    document.body.innerHTML = '<main style="padding: 2rem; font-family: sans-serif;">Unable to load the generator.</main>';
  }
})();
