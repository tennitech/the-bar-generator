const {
  createLogoAnimationController
} = require('../js/utils/logoAnimationOverlay');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add(className) {
      classes.add(className);
    },
    remove(className) {
      classes.delete(className);
    },
    toggle(className, force) {
      if (typeof force === 'undefined') {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        }

        classes.add(className);
        return true;
      }

      if (force) {
        classes.add(className);
      } else {
        classes.delete(className);
      }

      return force;
    },
    contains(className) {
      return classes.has(className);
    }
  };
}

function createMockElement() {
  const listeners = new Map();

  return {
    hidden: false,
    innerHTML: '',
    dataset: {},
    attributes: {},
    classList: createClassList(),
    style: { setProperty(name, value) { this[name] = value; } },
    contentWindow: {},
    focus: jest.fn(),
    remove: jest.fn(),
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatch(type, event = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach((handler) => handler(event));
    },
    appendChild(child) {
      this.lastChild = child;
      this.children = this.children || [];
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = (this.children || []).filter((candidate) => candidate !== child);
      if (this.lastChild === child) {
        this.lastChild = null;
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    }
  };
}

function createMockDocument() {
  const listeners = new Map();

  return {
    body: {
      classList: createClassList(),
      appendChild: jest.fn()
    },
    createElement(tagName) {
      return {
        ...createMockElement(),
        tagName: String(tagName || '').toUpperCase()
      };
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      listeners.set(type, handlers.filter((candidate) => candidate !== handler));
    },
    dispatch(type, event = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach((handler) => handler(event));
    }
  };
}

function createMockWindow() {
  const listeners = new Map();
  const storage = new Map();

  return {
    setTimeout,
    clearTimeout,
    location: { origin: 'https://example.test' },
    sessionStorage: {
      setItem: jest.fn((key, value) => {
        storage.set(key, value);
      }),
      getItem: jest.fn((key) => storage.get(key) || null),
      removeItem: jest.fn((key) => {
        storage.delete(key);
      })
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      listeners.set(type, handlers.filter((candidate) => candidate !== handler));
    },
    dispatch(type, event = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach((handler) => handler(event));
    }
  };
}

describe('logo animation overlay controller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function finishCloseTransition() {
    jest.advanceTimersByTime(760);
  }

  function createController(options = {}) {
    const triggerEl = createMockElement();
    const overlayEl = createMockElement();
    overlayEl.hidden = true;
    const stageEl = createMockElement();
    const closeEl = createMockElement();
    const replayEl = createMockElement();
    const documentRef = createMockDocument();
    const windowRef = createMockWindow();
    if (options.motionPreference) windowRef.matchMedia = () => options.motionPreference;

    const controller = createLogoAnimationController({
      triggerEl,
      documentRef,
      windowRef,
      animationSrc: 'animation/index.html',
      getAnimationState: options.getAnimationState,
      ensureOverlay() {
        return {
          overlayEl,
          stageEl,
          closeEl,
          replayEl
        };
      }
    });

    return {
      controller,
      triggerEl,
      overlayEl,
      stageEl,
      closeEl,
      replayEl,
      documentRef,
      windowRef
    };
  }

  test('Replay falls back to the visible export control when GitHub is hidden', async () => {
    const { controller, documentRef, replayEl, windowRef } = createController();
    let githubRect = { left: 0, top: 0, width: 0, height: 0 };
    documentRef.querySelector = selector => {
      if (selector.includes('GitHub')) return { getBoundingClientRect: () => githubRect };
      if (selector === '#save-button') return { getBoundingClientRect: () => ({ left: 300, top: 16, width: 70, height: 44 }) };
      return null;
    };
    await controller.open();
    expect(replayEl.style).toMatchObject({ left: '300px', top: '16px', width: '70px', height: '44px' });
    githubRect = { left: 900, top: 16, width: 44, height: 44 };
    windowRef.dispatch('resize');
    expect(replayEl.style).toMatchObject({ left: '900px', width: '44px', height: '44px' });
  });

  test('opens the overlay and mounts the ASCII animation iframe', async () => {
    const {
      controller,
      triggerEl,
      overlayEl,
      stageEl,
      closeEl,
      documentRef
    } = createController();

    await controller.open();

    expect(overlayEl.hidden).toBe(false);
    expect(overlayEl.getAttribute('aria-hidden')).toBe('false');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    expect(documentRef.body.classList.contains('has-logo-animation')).toBe(true);
    expect(closeEl.focus).not.toHaveBeenCalled();
    expect(overlayEl.focus).toHaveBeenCalledTimes(1);
    expect(closeEl.disabled).toBe(true);
    jest.advanceTimersByTime(1200);
    expect(closeEl.disabled).toBe(false);
    expect(closeEl.focus).toHaveBeenCalledTimes(1);
    expect(stageEl.lastChild.tagName).toBe('IFRAME');
    expect(stageEl.lastChild.src).toBe('animation/index.html?overlay=1&foreground=%23d6001c');
  });

  test('passes animation state through session storage when provided', async () => {
    const animationState = {
      barSvg: '<svg viewBox="0 0 250 18"></svg>',
      finalLogoSvg: '<svg viewBox="0 0 250 150"></svg>'
    };
    const {
      controller,
      stageEl,
      windowRef
    } = createController({
      getAnimationState: () => animationState
    });

    await controller.open();

    expect(windowRef.sessionStorage.setItem).toHaveBeenCalledTimes(1);
    const [stateKey, rawValue] = windowRef.sessionStorage.setItem.mock.calls[0];
    expect(JSON.parse(rawValue)).toEqual(animationState);
    expect(stageEl.lastChild.src).toContain('animation/index.html?overlay=1&foreground=%23d6001c&stateKey=');
    expect(stageEl.lastChild.src).toContain(encodeURIComponent(stateKey));
  });

  test('closes the overlay and removes the mounted iframe', async () => {
    const {
      controller,
      triggerEl,
      overlayEl,
      stageEl,
      documentRef
    } = createController();

    await controller.open();
    controller.close();

    expect(overlayEl.getAttribute('aria-hidden')).toBe('true');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
    expect(overlayEl.hidden).toBe(true);

    finishCloseTransition();

    expect(overlayEl.hidden).toBe(true);
    expect(documentRef.body.classList.contains('has-logo-animation')).toBe(false);
    expect(stageEl.innerHTML).toBe('');
    expect(triggerEl.focus).toHaveBeenCalledTimes(1);
  });

  test('replay replaces the iframe so the animation restarts from frame zero', async () => {
    const {
      controller,
      stageEl
    } = createController();

    await controller.open();
    const firstFrame = controller.getFrame();

    await controller.replay();
    const secondFrame = controller.getFrame();

    expect(firstFrame).not.toBe(secondFrame);
    expect(stageEl.lastChild).toBe(secondFrame);
  });

  test('reduced motion stays static until explicit one-run play, then resets on reopen', async () => {
    const motionPreference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { controller, replayEl, documentRef, closeEl } = createController({ motionPreference });
    await controller.open();
    const still = controller.getFrame();
    expect(still.tagName).toBe('DIV');
    expect(replayEl.hidden).toBe(true);
    const play = still.children.find(child => child.tagName === 'BUTTON');
    expect(play.textContent).toBe('Play animation once');
    // The opt-in control participates in the dialog keyboard cycle.
    jest.runOnlyPendingTimers();
    documentRef.activeElement = closeEl;
    documentRef.dispatch('keydown', { key: 'Tab', preventDefault: jest.fn() });
    expect(play.focus).toHaveBeenCalled();
    play.dispatch('click');
    expect(controller.getFrame().tagName).toBe('IFRAME');
    expect(replayEl.hidden).toBe(false);
    expect(closeEl.focus).toHaveBeenCalled();
    controller.close();
    await controller.open();
    expect(controller.getFrame().tagName).toBe('DIV');
    expect(replayEl.hidden).toBe(true);
    controller.destroy();
  });

  test('a new reduced-motion request stops an explicitly started animation', async () => {
    const motionPreference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { controller } = createController({ motionPreference });
    await controller.open();
    await controller.replay();
    expect(controller.getFrame().tagName).toBe('IFRAME');
    const onChange = motionPreference.addEventListener.mock.calls[0][1];
    onChange();
    expect(controller.getFrame().tagName).toBe('DIV');
    controller.destroy();
  });

  test('relaxing reduced motion preserves the current explicit one-run frame', async () => {
    const motionPreference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { controller } = createController({ motionPreference });
    await controller.open();
    await controller.replay();
    const playingFrame = controller.getFrame();
    motionPreference.matches = false;
    motionPreference.addEventListener.mock.calls[0][1]();
    expect(controller.getFrame()).toBe(playingFrame);
    expect(playingFrame.remove).not.toHaveBeenCalled();
    controller.destroy();
  });

  test('replacing a focused static play control keeps focus in the dialog', async () => {
    const motionPreference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { controller, documentRef, closeEl } = createController({ motionPreference });
    await controller.open();
    jest.runOnlyPendingTimers();
    const still = controller.getFrame();
    const play = still.children.find(child => child.tagName === 'BUTTON');
    still.contains = node => node === play;
    documentRef.activeElement = play;
    closeEl.focus.mockClear();
    motionPreference.matches = false;
    motionPreference.addEventListener.mock.calls[0][1]();
    expect(controller.getFrame().tagName).toBe('IFRAME');
    expect(closeEl.focus).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  test('one-time Play follows the same entrance and exit disabling as toolbar actions', async () => {
    const motionPreference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { controller, overlayEl } = createController({ motionPreference });
    await controller.open();
    const play = controller.getFrame().children.find(child => child.tagName === 'BUTTON');
    expect(play.disabled).toBe(true);
    jest.runOnlyPendingTimers();
    expect(play.disabled).toBe(false);
    overlayEl.getAnimations = () => [{ finished: new Promise(() => {}) }];
    controller.close();
    expect(play.disabled).toBe(true);
    controller.destroy();
  });

  test('animation completion message closes the overlay without navigation', async () => {
    const {
      controller,
      overlayEl,
      windowRef
    } = createController();

    await controller.open();
    windowRef.dispatch('message', {
      origin: windowRef.location.origin, source: controller.getFrame().contentWindow,
      data: { type: 'rpi-logo-animation-complete' }
    });

    expect(overlayEl.getAttribute('aria-hidden')).toBe('true');
    finishCloseTransition();

    expect(overlayEl.hidden).toBe(true);
  });

  test('escape closes the overlay through the document listener', async () => {
    const {
      controller,
      overlayEl,
      documentRef
    } = createController();

    await controller.open();
    documentRef.dispatch('keydown', {
      key: 'Escape',
      preventDefault: jest.fn()
    });

    expect(overlayEl.getAttribute('aria-hidden')).toBe('true');
    finishCloseTransition();

    expect(overlayEl.hidden).toBe(true);
  });
  test('reopening during the exit keeps the replacement frame alive', async () => {
    const { controller, overlayEl, stageEl } = createController();
    await controller.open();
    controller.close();
    await controller.open();
    const frame = controller.getFrame();
    finishCloseTransition();
    expect(controller.isOpen()).toBe(true);
    expect(overlayEl.hidden).toBe(false);
    expect(stageEl.lastChild).toBe(frame);
  });

  test('destroy during exit clears modal state immediately', async () => {
    const { controller, overlayEl, documentRef } = createController();
    await controller.open();
    controller.close();
    controller.destroy();
    expect(overlayEl.hidden).toBe(true);
    expect(documentRef.body.classList.contains('has-logo-animation')).toBe(false);
    expect(controller.getFrame()).toBe(null);
  });

  test('completion from a different frame cannot dismiss the intro', async () => {
    const { controller, windowRef } = createController();
    await controller.open();
    windowRef.dispatch('message', {
      source: {}, data: { type: 'rpi-logo-animation-complete' }
    });
    expect(controller.isOpen()).toBe(true);
  });

  test.each(['rpi-logo-animation-close', 'rpi-logo-animation-ready', 'rpi-logo-animation-complete'])('%s requires the current frame AND exact origin', async type => {
    const { controller, windowRef, closeEl } = createController();
    await controller.open();
    const oldFrame = controller.getFrame();
    await controller.replay();
    for (const [origin, source] of [
      ['https://other.test', controller.getFrame().contentWindow],
      ['null', controller.getFrame().contentWindow],
      [windowRef.location.origin, {}],
      [windowRef.location.origin, oldFrame.contentWindow]
    ]) {
      windowRef.dispatch('message', { origin, source, data: { type } });
      expect(controller.isOpen()).toBe(true);
      expect(closeEl.disabled).toBe(true);
    }
  });

  test.each(Object.entries({ black: '#000000', white: '#ffffff', red: '#d6001c', blue: '#0081ce',
    gold: '#cdac38', silver: '#e1edf5', gray: '#b9ccd8', lunar: '#f4f7fb' }))('%s captures one coherent palette and frame state per mount', async (colorMode, foreground) => {
    const capture = jest.fn(() => ({ colorMode, foreground, finalLogoSvg: '<svg/>' }));
    const { controller, overlayEl, windowRef } = createController({ getAnimationState: capture });
    await controller.open();
    expect(capture).toHaveBeenCalledTimes(1);
    expect(overlayEl.style['--intro-ink']).toBe(foreground);
    expect(overlayEl.style['--intro-background']).toBe(colorMode === 'black' ? '#ffffff' : '#000000');
    expect(controller.getFrame().src).toContain(`foreground=${encodeURIComponent(foreground)}`);
    expect(JSON.parse(windowRef.sessionStorage.setItem.mock.calls[0][1]).foreground).toBe(foreground);
  });

  test('blocked session storage still sends selected ink without putting SVG/text in URL', async () => {
    const { controller, windowRef } = createController({ getAnimationState: () => ({
      foreground: '#000000', finalLogoSvg: '<svg>private text</svg>'
    }) });
    windowRef.sessionStorage.setItem.mockImplementation(() => { throw Error('blocked'); });
    await controller.open();
    expect(controller.getFrame().src).toBe('animation/index.html?overlay=1&foreground=%23000000');
    expect(controller.isOpen()).toBe(true);
  });

  test('failed optional artwork capture retains working fallback and close', async () => {
    const { controller } = createController({ getAnimationState: () => { throw Error('capture'); } });
    await expect(controller.open()).resolves.toBe(true);
    expect(controller.getFrame().src).toContain('foreground=%23d6001c');
    controller.close(); expect(controller.isOpen()).toBe(false);
  });

  test('exit waits for the actual CSS transition and ignores stale completion after reopen', async () => {
    const { controller, overlayEl, closeEl, triggerEl } = createController();
    let finish;
    overlayEl.getAnimations = () => [{ finished: new Promise(resolve => { finish = resolve; }) }];
    await controller.open();
    controller.close();
    expect(overlayEl.hidden).toBe(false);
    expect(closeEl.disabled).toBe(true);
    expect(triggerEl.focus).not.toHaveBeenCalled();
    const finishOld = finish;
    await controller.open();
    finishOld();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(overlayEl.hidden).toBe(false);
    controller.close();
    finish();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(overlayEl.hidden).toBe(true);
    expect(triggerEl.focus).toHaveBeenCalledTimes(1);
  });

});
