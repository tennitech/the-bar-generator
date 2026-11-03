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
