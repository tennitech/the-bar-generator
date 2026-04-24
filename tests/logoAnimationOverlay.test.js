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
      classList: createClassList()
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

describe('logo animation overlay controller', () => {
  function createController() {
    const triggerEl = createMockElement();
    const overlayEl = createMockElement();
    const stageEl = createMockElement();
    const closeEl = createMockElement();
    const replayEl = createMockElement();
    const documentRef = createMockDocument();

    const controller = createLogoAnimationController({
      triggerEl,
      documentRef,
      animationSrc: 'animation/index.html',
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
      documentRef
    };
  }

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
    expect(closeEl.focus).toHaveBeenCalledTimes(1);
    expect(stageEl.lastChild.tagName).toBe('IFRAME');
    expect(stageEl.lastChild.src).toBe('animation/index.html');
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

    expect(overlayEl.hidden).toBe(true);
    expect(overlayEl.getAttribute('aria-hidden')).toBe('true');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
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

    expect(controller.isOpen()).toBe(false);
    expect(overlayEl.hidden).toBe(true);
  });
});
