/* Keep browser surfaces in step with the selected app theme. Safari decides
 * how its own chrome is rendered; theme-color is a hint for supporting UAs. */
(function setupMobileBrowser() {
  const root = document.documentElement;
  const body = document.body;
  if (!body || root.hasAttribute('data-input-modality')) return;

  root.dataset.inputModality = 'keyboard';
  document.addEventListener('pointerdown', () => {
    root.dataset.inputModality = 'pointer';
  }, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    // Text entry also comes from an on-screen keyboard; only navigation
    // switches a tapped editor back to the visible keyboard focus treatment.
    const navigationKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft',
      'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Escape'];
    if (navigationKeys.includes(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      root.dataset.inputModality = 'keyboard';
    }
  }, true);

  const closeControls = document.getElementById('mobile-controls-close');
  if (closeControls) closeControls.addEventListener('click', () => {
    document.getElementById('mobile-menu-toggle')?.click();
  });

  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.append(themeColor);
  }

  const sidebar = document.getElementById('app-sidebar');
  const canvasSurface = document.querySelector('.logo-container');
  const touchLayout = window.matchMedia('(pointer: coarse) and (max-width: 1100px)');

  function syncBrowserSurface() {
    const visibleSurface = sidebar && touchLayout.matches && sidebar.classList.contains('active')
      ? sidebar : (touchLayout.matches ? (canvasSurface || body) : body);
    const background = body.classList.contains('has-logo-animation')
      ? 'rgb(0, 0, 0)'
      : getComputedStyle(visibleSurface).backgroundColor;
    const channels = background.match(/[\d.]+/g);
    const dark = channels && channels.length >= 3
      && (Number(channels[0]) * 0.2126 + Number(channels[1]) * 0.7152
        + Number(channels[2]) * 0.0722) < 128;
    if (root.style.backgroundColor !== background) root.style.backgroundColor = background;
    if (canvasSurface) body.style.setProperty('--browser-surface', background);
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (themeColor.content !== background) themeColor.content = background;
  }

  syncBrowserSurface();
  const observer = new MutationObserver(syncBrowserSurface);
  observer.observe(body, { attributes: true, attributeFilter: ['class'] });
  if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  touchLayout.addEventListener('change', syncBrowserSurface);
  window.addEventListener('resize', syncBrowserSurface, { passive: true });
})();
