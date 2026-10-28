(function (root, factory) {
  const registry = typeof module === 'object' && module.exports ? require('./featherIcons') : root.FeatherIcons;
  const api = factory(registry);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.LogoAnimationOverlay = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (registry) {
  const OVERLAY_ID = 'logo-animation-overlay';
  const TITLE_ID = 'logo-animation-title';
  const STAGE_ID = 'logo-animation-stage';
  const CLOSE_ID = 'logo-animation-close';
  const REPLAY_ID = 'logo-animation-replay';
  const READY_SCRIM_DELAY_MS = 140;
  const OPEN_SCRIM_FALLBACK_MS = 1200;

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
    return registry.getIconMarkup(type === 'replay' ? 'rotate-ccw' : 'x', 'header_icon');
  }

  function createOverlayButton(documentRef, id, ariaLabel, iconType) {
    const button = documentRef.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'header_icon-button logo_animation_button';
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
    frameEl.style.width = '100%';
    frameEl.style.height = '100%';
    frameEl.tabIndex = -1;
    frameEl.style.border = '0';
    frameEl.style.display = 'block';
    frameEl.style.background = 'transparent';
    frameEl.style.colorScheme = 'dark';
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
    overlayEl.tabIndex = -1;
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
    let motionPlayEl = null;
    let isOpen = false;
    let escapeHandler = null;
    let messageHandler = null;
    let activeStateKey = '';
    let openTimer = 0;
    let lifecycleGeneration = 0;
    let activeOpenParts = null;
    let resizeObserver = null;
    let backgroundState = [];
    const motionPreference = windowRef && windowRef.matchMedia
      ? windowRef.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function handleMotionPreference() {
      if (isOpen) { mountFrame(); startScrimFade(0); }
    }
    if (motionPreference && motionPreference.addEventListener) {
      motionPreference.addEventListener('change', handleMotionPreference);
    }

    // Measure the actual shared toolbar controls, including a future Share slot.
    function alignControls() {
      if (!overlayParts || !documentRef.querySelector) return;
      const pairs = [
        [overlayParts.replayEl, documentRef.querySelector('.header-actions a[aria-label*="GitHub"]')],
        [overlayParts.closeEl, documentRef.querySelector('#mobile-menu-toggle')]
      ];
      pairs.forEach(([button, anchor]) => {
        if (!anchor) return;
        const rect = anchor.getBoundingClientRect();
        Object.assign(button.style, {
          position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
          width: `${rect.width}px`, height: `${rect.height}px`
        });
      });
    }

    function setBackgroundInert(inert) {
      if (inert && documentRef.querySelectorAll && !backgroundState.length) {
        backgroundState = Array.from(documentRef.querySelectorAll('.app-header, .app-layout'))
          .map(element => ({ element, inert: element.inert }));
        backgroundState.forEach(({ element }) => { element.inert = true; });
      } else if (!inert) {
        backgroundState.forEach(({ element, inert: previous }) => { element.inert = previous; });
        backgroundState = [];
      }
    }

    function setChromeAvailable(available) {
      if (!overlayParts) return;
      overlayParts.closeEl.disabled = !available;
      overlayParts.replayEl.disabled = !available;
    }

    function activateChrome() {
      if (!isOpen) return;
      setChromeAvailable(true);
      if (overlayParts.closeEl.focus) overlayParts.closeEl.focus();
    }

    function settleClose(generation) {
      if (isOpen || generation !== lifecycleGeneration) return;
      const parts = overlayParts;
      destroyFrame();
      parts.overlayEl.hidden = true;
      parts.overlayEl.setAttribute('aria-hidden', 'true');
      parts.overlayEl.classList.remove('is-closing');
      setBackgroundInert(false);
      documentRef.body.classList.remove('has-logo-animation');
      if (triggerEl.isConnected !== false && triggerEl.focus) triggerEl.focus();
    }

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
      if (activeOpenParts.overlayEl.classList.contains('is-open')) {
        if (activeOpenParts.closeEl.disabled) activateChrome();
        return;
      }
      openTimer = schedule(() => {
        openTimer = 0;
        if (!isOpen
          || !activeOpenParts
          || !activeOpenParts.overlayEl.classList
          || typeof activeOpenParts.overlayEl.classList.add !== 'function') {
          return;
        }

        activeOpenParts.overlayEl.classList.add('is-open');
        const animations = activeOpenParts.overlayEl.getAnimations
          ? activeOpenParts.overlayEl.getAnimations() : [];
        if (!animations.length) activateChrome();
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

      overlayParts.overlayEl.addEventListener('transitionstart', event => {
        if (event.target === overlayParts.overlayEl && event.propertyName === 'background-color') activateChrome();
      });
      overlayParts.closeEl.addEventListener('click', close);
      overlayParts.replayEl.addEventListener('click', replay);

      if (windowRef && windowRef.addEventListener) {
        windowRef.addEventListener('resize', alignControls);
        if (windowRef.visualViewport) windowRef.visualViewport.addEventListener('resize', alignControls);
        if (windowRef.ResizeObserver && documentRef.querySelector) {
          resizeObserver = new windowRef.ResizeObserver(alignControls);
          const header = documentRef.querySelector('.app-header');
          const actions = documentRef.querySelector('.header-actions');
          if (header) resizeObserver.observe(header);
          if (actions) resizeObserver.observe(actions);
        }
      }

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

        if (event && event.source && event.source !== frameEl.contentWindow) return;
        const data = event ? event.data : null;
        if (data && data.type === 'rpi-logo-animation-close') {
          close();
          return;
        }
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
        if (event.key === 'Tab' && overlayParts && !overlayParts.overlayEl.hidden
          && (!isOpen || overlayParts.closeEl.disabled)) {
          event.preventDefault();
          if (overlayParts.overlayEl.focus) overlayParts.overlayEl.focus();
          return;
        }
        if (isOpen && event.key === 'Tab') {
          const buttons = [overlayParts.replayEl, overlayParts.closeEl, motionPlayEl]
            .filter(button => button && !button.hidden && !button.disabled);
          const index = buttons.indexOf(documentRef.activeElement);
          event.preventDefault();
          buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
          return;
        }
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
      motionPlayEl = null;
      clearAnimationState();

      if (overlayParts && overlayParts.stageEl) {
        overlayParts.stageEl.innerHTML = '';
      }
    }

    function mountFrame(allowMotion = false) {
      const parts = ensureOverlayParts();
      destroyFrame();
      const reducedMotion = !!(windowRef && windowRef.matchMedia
        && windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reducedMotion && !allowMotion) {
        const state = getAnimationState ? getAnimationState() : null;
        frameEl = documentRef.createElement('div');
        frameEl.className = 'logo_animation_static';
        const artwork = documentRef.createElement('div');
        artwork.className = 'logo_animation_static-artwork';
        artwork.setAttribute('role', 'img');
        artwork.setAttribute('aria-label', 'RPI logo with the selected bar');
        artwork.innerHTML = state && state.finalLogoSvg ? state.finalLogoSvg : triggerEl.innerHTML;
        const explanation = documentRef.createElement('p');
        explanation.className = 'logo_animation_motion-note';
        explanation.id = 'logo-animation-motion-note';
        explanation.textContent = 'Your device requests reduced motion. You can still play this animation once.';
        const play = documentRef.createElement('button');
        motionPlayEl = play;
        play.type = 'button';
        play.className = 'logo_animation_motion-play';
        play.textContent = 'Play animation once';
        play.setAttribute('aria-describedby', explanation.id);
        play.addEventListener('click', () => {
          replay();
          // The clicked button is removed with the still view. Keep focus in the dialog.
          parts.closeEl.focus();
        });
        appendChild(frameEl, artwork);
        appendChild(frameEl, explanation);
        appendChild(frameEl, play);
      } else {
        frameEl = createAnimationFrame(documentRef, getFrameSrc());
      }
      parts.replayEl.hidden = reducedMotion && !allowMotion;
      appendChild(parts.stageEl, frameEl);
      return frameEl;
    }

    function setOpenState(nextIsOpen) {
      const parts = ensureOverlayParts();
      isOpen = nextIsOpen;
      parts.overlayEl.setAttribute('aria-hidden', 'false');
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
      const wasVisible = !parts.overlayEl.hidden;
      lifecycleGeneration++;
      cancelScheduled(openTimer);
      openTimer = 0;
      mountFrame();
      activeOpenParts = parts;
      setChromeAvailable(false);
      setOpenState(true);
      alignControls();
      setBackgroundInert(true);
      parts.overlayEl.classList.remove('is-closing');
      if (parts.overlayEl.focus) parts.overlayEl.focus();
      startScrimFade(wasVisible || frameEl.className === 'logo_animation_static' ? 0 : OPEN_SCRIM_FALLBACK_MS);
      return Promise.resolve(true);
    }

    function close() {
      if (!isOpen) return;
      const parts = ensureOverlayParts();
      const generation = ++lifecycleGeneration;
      cancelScheduled(openTimer);
      openTimer = 0;
      setChromeAvailable(false);
      if (parts.overlayEl.focus) parts.overlayEl.focus();
      setOpenState(false);
      activeOpenParts = null;
      // CSS owns the duration, easing and interruption/reversal. Await its real
      // transition promises instead of guessing a cleanup timeout in JavaScript.
      const animations = parts.overlayEl.getAnimations ? parts.overlayEl.getAnimations() : [];
      if (!animations.length) settleClose(generation);
      else Promise.allSettled(animations.map(animation => animation.finished))
        .then(() => settleClose(generation));
    }

    function replay() {
      if (!isOpen) {
        return open();
      }

      // A deliberate play/replay is a one-run choice, never a stored preference.
      mountFrame(true);
      return Promise.resolve(true);
    }

    function destroy() {
      close();
      lifecycleGeneration++;
      cancelScheduled(openTimer);
      openTimer = 0;
      destroyFrame();
      setBackgroundInert(false);
      if (overlayParts) overlayParts.overlayEl.hidden = true;
      if (documentRef.body && documentRef.body.classList) documentRef.body.classList.remove('has-logo-animation');
      if (resizeObserver) resizeObserver.disconnect();
      if (motionPreference && motionPreference.removeEventListener) {
        motionPreference.removeEventListener('change', handleMotionPreference);
      }
      if (windowRef && windowRef.removeEventListener) {
        windowRef.removeEventListener('resize', alignControls);
        if (windowRef.visualViewport) windowRef.visualViewport.removeEventListener('resize', alignControls);
      }

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
