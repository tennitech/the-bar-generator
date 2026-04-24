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
<<<<<<< ours
    remove: jest.fn(),
=======
>>>>>>> theirs
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatch(type, event = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach((handler) => handler(event));
    },
<<<<<<< ours
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
=======
>>>>>>> theirs
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
<<<<<<< ours
    createElement(tagName) {
      return {
        ...createMockElement(),
        tagName: String(tagName || '').toUpperCase()
      };
    },
=======
>>>>>>> theirs
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

<<<<<<< ours
describe('logo animation overlay controller', () => {
=======
class FakeRunner {
  static instances = [];

  constructor(stageEl) {
    this.stageEl = stageEl;
    this.tRex = {};
    this.canvas = {};
    this.containerEl = {};
    this.crashed = false;
    this.destroy = jest.fn();
    this.pressJump = jest.fn();
    this.releaseJump = jest.fn();
    this.restart = jest.fn(() => {
      this.crashed = false;
    });
    FakeRunner.instances.push(this);
  }
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('logo animation overlay controller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    FakeRunner.instances = [];
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

>>>>>>> theirs
  function createController() {
    const triggerEl = createMockElement();
    const overlayEl = createMockElement();
    const stageEl = createMockElement();
    const closeEl = createMockElement();
    const replayEl = createMockElement();
    const documentRef = createMockDocument();
<<<<<<< ours
=======
    const ensureAssets = jest.fn();
>>>>>>> theirs

    const controller = createLogoAnimationController({
      triggerEl,
      documentRef,
<<<<<<< ours
      animationSrc: 'animation/index.html',
=======
      windowRef: global,
      RunnerCtor: FakeRunner,
      ensureAssets,
>>>>>>> theirs
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
<<<<<<< ours
      documentRef
    };
  }

  test('opens the overlay and mounts the ASCII animation iframe', async () => {
=======
      documentRef,
      ensureAssets
    };
  }

  test('opens the overlay and starts playback without touching boot-time state', async () => {
>>>>>>> theirs
    const {
      controller,
      triggerEl,
      overlayEl,
<<<<<<< ours
      stageEl,
      closeEl,
      documentRef
    } = createController();

    await controller.open();

=======
      closeEl,
      documentRef,
      ensureAssets
    } = createController();

    await controller.open();
    await flushMicrotasks();

    expect(ensureAssets).toHaveBeenCalledTimes(1);
>>>>>>> theirs
    expect(overlayEl.hidden).toBe(false);
    expect(overlayEl.getAttribute('aria-hidden')).toBe('false');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    expect(documentRef.body.classList.contains('has-logo-animation')).toBe(true);
    expect(closeEl.focus).toHaveBeenCalledTimes(1);
<<<<<<< ours
    expect(stageEl.lastChild.tagName).toBe('IFRAME');
    expect(stageEl.lastChild.src).toBe('animation/index.html');
  });

  test('closes the overlay and removes the mounted iframe', async () => {
=======
    expect(FakeRunner.instances).toHaveLength(1);
    expect(FakeRunner.instances[0].pressJump).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(140);

    expect(FakeRunner.instances[0].releaseJump).toHaveBeenCalledTimes(1);
  });

  test('closes the overlay and destroys the runner instance', async () => {
>>>>>>> theirs
    const {
      controller,
      triggerEl,
      overlayEl,
      stageEl,
      documentRef
    } = createController();

    await controller.open();
<<<<<<< ours
=======
    await flushMicrotasks();
>>>>>>> theirs
    controller.close();

    expect(overlayEl.hidden).toBe(true);
    expect(overlayEl.getAttribute('aria-hidden')).toBe('true');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
    expect(documentRef.body.classList.contains('has-logo-animation')).toBe(false);
<<<<<<< ours
=======
    expect(FakeRunner.instances[0].destroy).toHaveBeenCalledTimes(1);
>>>>>>> theirs
    expect(stageEl.innerHTML).toBe('');
    expect(triggerEl.focus).toHaveBeenCalledTimes(1);
  });

<<<<<<< ours
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
=======
  test('replay tears down the current runner and starts a fresh instance', async () => {
    const {
      controller
    } = createController();

    await controller.open();
    await flushMicrotasks();

    const firstRunner = FakeRunner.instances[0];
    await controller.open({ replay: true });
    await flushMicrotasks();

    expect(firstRunner.destroy).toHaveBeenCalledTimes(1);
    expect(FakeRunner.instances).toHaveLength(2);
    expect(FakeRunner.instances[1].pressJump).toHaveBeenCalledTimes(1);
  });

  test('restarts automatically after a crash while the overlay remains open', async () => {
    const {
      controller
    } = createController();

    await controller.open();
    await flushMicrotasks();

    FakeRunner.instances[0].crashed = true;
    jest.advanceTimersByTime(1200);

    expect(FakeRunner.instances[0].restart).toHaveBeenCalledTimes(1);
>>>>>>> theirs
  });

  test('escape closes the overlay through the document listener', async () => {
    const {
      controller,
      overlayEl,
      documentRef
    } = createController();

    await controller.open();
<<<<<<< ours
=======
    await flushMicrotasks();
>>>>>>> theirs

    documentRef.dispatch('keydown', {
      key: 'Escape',
      preventDefault: jest.fn()
    });

    expect(controller.isOpen()).toBe(false);
    expect(overlayEl.hidden).toBe(true);
  });
});
