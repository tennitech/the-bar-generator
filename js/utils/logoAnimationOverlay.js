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

  function createLogoAnimationController(options) {
    const triggerEl = options && options.triggerEl ? options.triggerEl : null;
    const documentRef = options && options.documentRef ? options.documentRef : document;
    const ensureOverlay = options && typeof options.ensureOverlay === 'function'
      ? options.ensureOverlay
      : () => createOverlayElements(documentRef);
    const animationSrc = options && options.animationSrc
      ? options.animationSrc
      : 'animation/index.html';

    if (!triggerEl) {
      return null;
    }

    let overlayParts = null;
    let frameEl = null;
    let isOpen = false;
    let escapeHandler = null;

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

      if (overlayParts && overlayParts.stageEl) {
        overlayParts.stageEl.innerHTML = '';
      }
    }

    function mountFrame() {
      const parts = ensureOverlayParts();
      destroyFrame();
      frameEl = createAnimationFrame(documentRef, animationSrc);
      appendChild(parts.stageEl, frameEl);
      return frameEl;
    }

    function setOpenState(nextIsOpen) {
      const parts = ensureOverlayParts();
      isOpen = nextIsOpen;
      parts.overlayEl.hidden = !nextIsOpen;
      parts.overlayEl.setAttribute('aria-hidden', String(!nextIsOpen));
      triggerEl.setAttribute('aria-expanded', String(nextIsOpen));

      if (parts.overlayEl.classList && typeof parts.overlayEl.classList.toggle === 'function') {
        parts.overlayEl.classList.toggle('is-open', nextIsOpen);
      }

      if (documentRef.body && documentRef.body.classList && typeof documentRef.body.classList.toggle === 'function') {
        documentRef.body.classList.toggle('has-logo-animation', nextIsOpen);
      }
    }

    function open() {
      const parts = ensureOverlayParts();
      mountFrame();
      setOpenState(true);

      if (typeof parts.closeEl.focus === 'function') {
        parts.closeEl.focus();
      }

      return Promise.resolve(true);
    }

    function close() {
      if (!isOpen) {
        return;
      }

      setOpenState(false);
      destroyFrame();

      if (typeof triggerEl.focus === 'function') {
        triggerEl.focus();
      }
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

      if (escapeHandler) {
        documentRef.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
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
