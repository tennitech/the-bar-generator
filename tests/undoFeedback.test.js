const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const nodes = new Map(), frames = [];
  const document = {
    readyState: 'loading', addEventListener: jest.fn(),
    getElementById: id => nodes.get(id),
    createElement: jest.fn(() => ({ textContent: '', attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; } })),
    body: { appendChild(node) { nodes.set(node.id, node); } }
  };
  const scope = { document, requestAnimationFrame: callback => frames.push(callback) };
  scope.window = scope;
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(require.resolve('../js/ui'), 'utf8'), scope);
  scope.Toast.init();
  document.createElement.mockClear();
  return { scope, document, nodes, flush: () => frames.splice(0).forEach(callback => callback()) };
}

test('quiet outcomes update the persistent nonvisual status without creating visible toast chrome', () => {
  const f = fixture(), status = f.nodes.get('toast-status');
  expect(status.attributes).toEqual({ role: 'status', 'aria-atomic': 'true' });
  expect(status.className).toBe('u-sr-only');
  f.scope.Toast.announce('Previous variation restored.');
  expect(status.textContent).toBe('');
  f.flush();
  expect(status.textContent).toBe('Previous variation restored.');
  // Clearing before a later frame makes repeated equal outcomes announceable.
  f.scope.Toast.announce('Previous variation restored.');
  expect(status.textContent).toBe('');
  f.flush();
  expect(status.textContent).toBe('Previous variation restored.');
  expect(f.nodes.get('toast-alert').textContent).toBe('');
  expect(f.document.createElement).not.toHaveBeenCalled();
});

test('the actual main Undo wiring announces success quietly and preserves visible error recovery', () => {
  const f = fixture();
  const initialize = jest.fn();
  f.scope.RandomizeHistory = { initialize };
  f.scope.Toast.show = jest.fn();
  const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
  const start = source.indexOf('window.randomizeHistory = window.RandomizeHistory?.initialize({');
  const end = source.indexOf('\n  });', start) + '\n  });'.length;
  expect(start).toBeGreaterThan(0);
  vm.runInContext(source.slice(start, end), f.scope);
  const { announce } = initialize.mock.calls[0][0];
  announce('Previous variation restored.');
  f.flush();
  expect(f.nodes.get('toast-status').textContent).toBe('Previous variation restored.');
  expect(f.scope.Toast.show).not.toHaveBeenCalled();
  announce('The previous variation could not be restored. Try Undo again.', 'error');
  expect(f.scope.Toast.show).toHaveBeenCalledWith('The previous variation could not be restored. Try Undo again.', 'error');
});
