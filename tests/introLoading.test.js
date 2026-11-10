const fs = require('node:fs');
const vm = require('node:vm');
const main = fs.readFileSync(require.resolve('../js/main'),'utf8');
const source = main.slice(main.indexOf('async function ensureHeaderLogoAnimationController()'),main.indexOf('let headerLogoAnimationReturnFocus'));
test('optional intro lazy-load failure can recover on the next deliberate discovery', async () => {
  const controller={open:jest.fn()};
  const load=jest.fn().mockRejectedValueOnce(Error('network')).mockResolvedValue({});
  const create=jest.fn(()=>controller);
  const context={window:{LogoAnimationOverlay:{createLogoAnimationController:create}},
    document:{getElementById:()=>({})},loadExternalScriptOnce:load,buildHeaderLogoAnimationState:()=>({})};
  vm.createContext(context);
  vm.runInContext(`let headerLogoAnimationControllerPromise=null;\n${source}\nthis.ensure=ensureHeaderLogoAnimationController;`,context);
  await expect(context.ensure()).rejects.toThrow('network');
  expect(create).not.toHaveBeenCalled();
  const [a,b]=await Promise.all([context.ensure(),context.ensure()]);
  expect(a).toBe(controller);expect(b).toBe(controller);expect(load).toHaveBeenCalledTimes(2);
  expect(create).toHaveBeenCalledTimes(1);
});

function createLaunchHarness({ existingScript = null } = {}) {
  const events = extra => {
    const listeners = {};
    return { ...extra, addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
      emit(type, event = {}) { for (const callback of listeners[type] || []) callback(event); } };
  };
  const classes = new Set();
  const summary = { focus: jest.fn(() => { documentRef.activeElement = summary; }) };
  const target = events({ focus: jest.fn(() => { documentRef.activeElement = target; }) });
  const disclosure = events({ open: true, querySelector: () => summary,
    contains: element => element === target || element === summary });
  const scripts = existingScript ? [existingScript] : [];
  const documentRef = events({ hidden: false, activeElement: target,
    body: { classList: { contains: name => classes.has(name) }, append: script => scripts.push(script) },
    getElementById: id => ({ 'ascii-intro-trigger': target, 'sidebar-more': disclosure,
      'sidebar-more-toggle': summary, 'brand-title': summary })[id],
    querySelector: () => scripts.find(script => !script.removed),
    createElement: () => ({ remove() { this.removed = true; } }) });
  const windowRef = events({ performance: { now: () => 100 } });
  const context = vm.createContext({ document: documentRef, window: windowRef,
    buildHeaderLogoAnimationState: () => ({}), console: { error: jest.fn() },
    Toast: { show: jest.fn() } });
  const start = main.indexOf('function loadExternalScriptOnce(');
  const end = main.indexOf('function requestUpdate()', start);
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/secretIntro'), 'utf8'), context);
  vm.runInContext(`let headerLogoAnimationControllerPromise = null;
    let headerLogoAnimationLoadPromise = null;
    const externalScriptLoadPromises = new Map();
    ${main.slice(start, end)}
    setupHeaderLogoAnimationTrigger();
    this.load = loadExternalScriptOnce;
    this.ensure = ensureHeaderLogoAnimationController;
    this.launch = openHeaderLogoAnimation;`, context);
  const controller = { open: jest.fn(() => { classes.add('has-logo-animation'); }),
    close: () => classes.delete('has-logo-animation') };
  function registerController() {
    windowRef.LogoAnimationOverlay = { createLogoAnimationController: jest.fn(() => controller) };
  }
  return { context, target, summary, disclosure, documentRef, windowRef, scripts,
    controller, registerController };
}

test('bound submenu closes before launch and coalesces concurrent activations', async () => {
  const s = createLaunchHarness();
  s.target.emit('click');
  expect(s.disclosure.open).toBe(false);
  expect(s.documentRef.activeElement).toBe(s.summary);
  const pending = s.context.launch();
  expect(s.scripts).toHaveLength(1);
  s.registerController(); s.scripts[0].onload();
  await pending;
  expect(s.controller.open).toHaveBeenCalledTimes(1);
  s.controller.close(); s.disclosure.open = true;
  s.target.emit('click'); await s.context.launch();
  expect(s.controller.open).toHaveBeenCalledTimes(2);
  expect(s.scripts).toHaveLength(1);
  expect(s.context.Toast.show).not.toHaveBeenCalled();
});

test.each(['download', 'evaluation'])('%s failure evicts the actual script cache and next activation retries', async failure => {
  const s = createLaunchHarness();
  s.target.emit('click'); const pending = s.context.launch();
  if (failure === 'download') s.scripts[0].onerror();
  else s.scripts[0].onload(); // load can fire even though the script API is absent.
  await pending;
  expect(s.scripts[0].removed).toBe(true);
  expect(s.controller.open).not.toHaveBeenCalled();
  expect(s.context.Toast.show).toHaveBeenCalledWith('Animation unavailable right now.', 'error');
  s.disclosure.open = true; s.target.emit('click'); const retry = s.context.launch();
  expect(s.scripts).toHaveLength(2);
  s.registerController(); s.scripts[1].onload(); await retry;
  expect(s.controller.open).toHaveBeenCalledTimes(1);
});

test('a stale optional script tag without its controller is replaced rather than accepted as ready', async () => {
  const stale = { remove: jest.fn(function () { this.removed = true; }) };
  const s = createLaunchHarness({ existingScript: stale });
  const pending = s.context.ensure();
  void pending.catch(() => {});
  expect(stale.remove).toHaveBeenCalledTimes(1);
  expect(s.scripts).toHaveLength(2);
  s.registerController(); s.scripts[1].onload();
  await expect(pending).resolves.toBe(s.controller);
});
