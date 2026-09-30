(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.LogoAnimationOverlay = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const OVERLAY_ID = 'logo-animation-overlay';
  const TITLE_ID = 'logo-animation-title';
  const STAGE_ID = 'logo-animation-stage';
  const CLOSE_ID = 'logo-animation-close';
  const REPLAY_ID = 'logo-animation-replay';
  const READY_SCRIM_DELAY_MS = 140;
  const OPEN_SCRIM_FALLBACK_MS = 1200;
  const EXIT_TRANSITION_MS = 760;

  function appendChild(parent, child) {
    if (!parent || !child) {
      return child;
    }

    if (typeof parent.appendChild === 'function') {
      parent.appendChild(child);
    } else if (typeof parent.append === 'function') {
      parent.append(child);
    }

    return child;
  }

  function createButtonIconMarkup(type) {
    if (type === 'replay') {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path></svg>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  }

  function createOverlayButton(documentRef, id, ariaLabel, iconType) {
    const button = documentRef.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'logo_animation_button';
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute('title', ariaLabel);
    button.innerHTML = createButtonIconMarkup(iconType);
    return button;
  }

  function createAnimationFrame(documentRef, src) {
    const frameEl = documentRef.createElement('iframe');
    frameEl.className = 'logo_animation_frame';
    frameEl.title = 'RPI ASCII animation';
    frameEl.loading = 'eager';
    frameEl.referrerPolicy = 'same-origin';
    frameEl.style.position = 'absolute';
    frameEl.style.inset = '0';
    frameEl.style.width = '100vw';
    frameEl.style.height = '100vh';
    frameEl.style.border = '0';
    frameEl.style.display = 'block';
    frameEl.style.background = 'transparent';
    frameEl.setAttribute('allowtransparency', 'true');
    frameEl.setAttribute('allowfullscreen', '');
    frameEl.src = src;
    return frameEl;
  }

  function createOverlayElements(documentRef) {
    const overlayEl = documentRef.createElement('div');
    overlayEl.id = OVERLAY_ID;
    overlayEl.className = 'logo_animation_overlay';
    overlayEl.hidden = true;
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-labelledby', TITLE_ID);

    const titleEl = documentRef.createElement('h2');
    titleEl.id = TITLE_ID;
    titleEl.className = 'u-sr-only';
    titleEl.textContent = 'RPI ASCII animation';

    const chromeEl = documentRef.createElement('div');
    chromeEl.className = 'logo_animation_chrome';

    const replayEl = createOverlayButton(documentRef, REPLAY_ID, 'Replay animation', 'replay');
    const closeEl = createOverlayButton(documentRef, CLOSE_ID, 'Close animation', 'close');
    appendChild(chromeEl, replayEl);
    appendChild(chromeEl, closeEl);

    const stageEl = documentRef.createElement('div');
    stageEl.id = STAGE_ID;
    stageEl.className = 'logo_animation_stage';

    appendChild(overlayEl, titleEl);
    appendChild(overlayEl, chromeEl);
    appendChild(overlayEl, stageEl);
    appendChild(documentRef.body, overlayEl);

    return {
      overlayEl,
      stageEl,
      closeEl,
      replayEl
    };
  }

  function appendQueryParams(src, params) {
    const entries = Object.entries(params || {})
      .filter(([, value]) => value !== null && typeof value !== 'undefined' && value !== '');

    if (!entries.length) {
      return src;
    }

    const separator = String(src).includes('?') ? '&' : '?';
    const query = entries
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    return `${src}${separator}${query}`;
  }

  function createLogoAnimationController(options) {
    const triggerEl = options && options.triggerEl ? options.triggerEl : null;
    const documentRef = options && options.documentRef ? options.documentRef : document;
    const windowRef = options && options.windowRef
      ? options.windowRef
      : (documentRef && documentRef.defaultView
        ? documentRef.defaultView
        : (typeof window !== 'undefined' ? window : null));
    const ensureOverlay = options && typeof options.ensureOverlay === 'function'
      ? options.ensureOverlay
      : () => createOverlayElements(documentRef);
    const animationSrc = options && options.animationSrc
      ? options.animationSrc
      : 'animation/index.html';
    const getAnimationState = options && typeof options.getAnimationState === 'function'
      ? options.getAnimationState
      : null;

    if (!triggerEl) {
      return null;
    }

    let overlayParts = null;
    let frameEl = null;
    let isOpen = false;
    let escapeHandler = null;
    let messageHandler = null;
    let activeStateKey = '';
    let openTimer = 0;
    let closeTimer = 0;
    let activeOpenParts = null;

    function schedule(callback, delay = 0) {
      if (windowRef && typeof windowRef.setTimeout === 'function') {
        return windowRef.setTimeout(callback, delay);
      }

      if (typeof setTimeout === 'function') {
        return setTimeout(callback, delay);
      }

      callback();
      return 0;
    }

    function cancelScheduled(timerId) {
      if (!timerId) {
        return;
      }

      if (windowRef && typeof windowRef.clearTimeout === 'function') {
        windowRef.clearTimeout(timerId);
        return;
      }

      if (typeof clearTimeout === 'function') {
        clearTimeout(timerId);
      }
    }

    function clearAnimationState() {
      if (!activeStateKey || !windowRef || !windowRef.sessionStorage) {
        activeStateKey = '';
        return;
      }

      try {
        windowRef.sessionStorage.removeItem(activeStateKey);
      } catch (error) {
        // Storage cleanup is best-effort; animation playback should not depend on it.
      }

      activeStateKey = '';
    }

    function getFrameSrc() {
      if (!getAnimationState || !windowRef || !windowRef.sessionStorage) {
        return animationSrc;
      }

      let animationState = null;
      try {
        animationState = getAnimationState();
      } catch (error) {
        return animationSrc;
      }

      if (!animationState) {
        return animationSrc;
      }

      clearAnimationState();
      activeStateKey = `rpi-logo-animation-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        windowRef.sessionStorage.setItem(activeStateKey, JSON.stringify(animationState));
      } catch (error) {
        activeStateKey = '';
        return animationSrc;
      }

      return appendQueryParams(animationSrc, {
        overlay: '1',
        stateKey: activeStateKey
      });
    }

    function startScrimFade(delay = 0) {
      if (!isOpen || !activeOpenParts) {
        return;
      }

      cancelScheduled(openTimer);
      openTimer = schedule(() => {
        openTimer = 0;
        if (!isOpen
          || !activeOpenParts
          || !activeOpenParts.overlayEl.classList
          || typeof activeOpenParts.overlayEl.classList.add !== 'function') {
          return;
        }

        activeOpenParts.overlayEl.classList.add('is-open');
      }, delay);
    }

    function ensureOverlayParts() {
      if (overlayParts) {
        return overlayParts;
      }

      overlayParts = ensureOverlay();

      if (!overlayParts || !overlayParts.overlayEl || !overlayParts.stageEl || !overlayParts.closeEl || !overlayParts.replayEl) {
        throw new Error('Animation overlay did not provide the required elements.');
      }

      overlayParts.closeEl.addEventListener('click', close);
      overlayParts.replayEl.addEventListener('click', replay);

      messageHandler = (event) => {
        if (!isOpen || !frameEl) {
          return;
        }

        if (event
          && event.origin
          && windowRef
          && windowRef.location
          && event.origin !== windowRef.location.origin) {
          return;
        }

        const data = event ? event.data : null;
        if (data && data.type === 'rpi-logo-animation-ready') {
          startScrimFade(READY_SCRIM_DELAY_MS);
          return;
        }

        if (!data || data.type !== 'rpi-logo-animation-complete') {
          return;
        }

        close();
      };

      if (windowRef && typeof windowRef.addEventListener === 'function') {
        windowRef.addEventListener('message', messageHandler);
      }

      escapeHandler = (event) => {
        if (!isOpen || event.key !== 'Escape') {
          return;
        }

        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }

        close();
      };

      documentRef.addEventListener('keydown', escapeHandler);

      return overlayParts;
    }

    function destroyFrame() {
      if (frameEl && typeof frameEl.remove === 'function') {
        frameEl.remove();
      } else if (overlayParts && overlayParts.stageEl && frameEl && typeof overlayParts.stageEl.removeChild === 'function') {
        overlayParts.stageEl.removeChild(frameEl);
      }

      frameEl = null;
      clearAnimationState();

      if (overlayParts && overlayParts.stageEl) {
        overlayParts.stageEl.innerHTML = '';
      }
    }

    function mountFrame() {
      const parts = ensureOverlayParts();
      destroyFrame();
      const reducedMotion = !!(windowRef && windowRef.matchMedia
        && windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reducedMotion) {
        const state = getAnimationState ? getAnimationState() : null;
        frameEl = documentRef.createElement('div');
        frameEl.className = 'logo_animation_static';
        frameEl.setAttribute('role', 'img');
        frameEl.setAttribute('aria-label', 'RPI logo with the selected bar');
        frameEl.innerHTML = state && state.finalLogoSvg ? state.finalLogoSvg : triggerEl.innerHTML;
      } else {
        frameEl = createAnimationFrame(documentRef, getFrameSrc());
      }
      parts.replayEl.hidden = reducedMotion;
      appendChild(parts.stageEl, frameEl);
      return frameEl;
    }

    function setOpenState(nextIsOpen) {
      const parts = ensureOverlayParts();
      isOpen = nextIsOpen;
      parts.overlayEl.setAttribute('aria-hidden', String(!nextIsOpen));
      triggerEl.setAttribute('aria-expanded', String(nextIsOpen));

      if (parts.overlayEl.classList && typeof parts.overlayEl.classList.toggle === 'function') {
        parts.overlayEl.classList.toggle('is-closing', !nextIsOpen);
        if (!nextIsOpen) {
          parts.overlayEl.classList.remove('is-open');
        }
      }

      if (nextIsOpen) {
        parts.overlayEl.hidden = false;
        if (documentRef.body && documentRef.body.classList && typeof documentRef.body.classList.add === 'function') {
          documentRef.body.classList.add('has-logo-animation');
        }
      }
    }

    function open() {
      const parts = ensureOverlayParts();
      cancelScheduled(openTimer);
      cancelScheduled(closeTimer);
      openTimer = 0;
      closeTimer = 0;
      mountFrame();
      activeOpenParts = parts;
      setOpenState(true);

      if (parts.overlayEl.classList && typeof parts.overlayEl.classList.remove === 'function') {
        parts.overlayEl.classList.remove('is-closing');
      }

      startScrimFade(frameEl && frameEl.className === 'logo_animation_static' ? 0 : OPEN_SCRIM_FALLBACK_MS);

      if (typeof parts.closeEl.focus === 'function') {
        parts.closeEl.focus();
      }

      return Promise.resolve(true);
    }

    function close() {
      if (!isOpen) {
        return;
      }

      const parts = ensureOverlayParts();
      cancelScheduled(openTimer);
      cancelScheduled(closeTimer);
      openTimer = 0;
      setOpenState(false);
      activeOpenParts = null;

      if (typeof triggerEl.focus === 'function') {
        triggerEl.focus();
      }

      closeTimer = schedule(() => {
        closeTimer = 0;
        if (isOpen) {
          return;
        }

        destroyFrame();
        parts.overlayEl.hidden = true;
        if (parts.overlayEl.classList && typeof parts.overlayEl.classList.remove === 'function') {
          parts.overlayEl.classList.remove('is-closing');
        }

        if (documentRef.body && documentRef.body.classList && typeof documentRef.body.classList.remove === 'function') {
          documentRef.body.classList.remove('has-logo-animation');
        }
      }, windowRef && windowRef.matchMedia
        && windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : EXIT_TRANSITION_MS);
    }

    function replay() {
      if (!isOpen) {
        return open();
      }

      mountFrame();
      return Promise.resolve(true);
    }

    function destroy() {
      close();
      cancelScheduled(openTimer);
      cancelScheduled(closeTimer);
      openTimer = 0;
      closeTimer = 0;
      destroyFrame();

      if (escapeHandler) {
        documentRef.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
      }

      if (messageHandler && windowRef && typeof windowRef.removeEventListener === 'function') {
        windowRef.removeEventListener('message', messageHandler);
        messageHandler = null;
      }
    }

    return {
      open,
      close,
      replay,
      destroy,
      isOpen() {
        return isOpen;
      },
      getFrame() {
        return frameEl;
      }
    };
  }

  return {
    createAnimationFrame,
    createLogoAnimationController,
    createOverlayElements
  };
}));
