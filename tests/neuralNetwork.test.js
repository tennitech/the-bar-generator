const { createNeuralNetworkPatternGeometry: model, normalizeNeuralNetworkSettings: normalize } = require('../js/utils/barPattern');

describe('untrained feedforward model', () => {
  test.each(['tanh', 'sigmoid'])('%s computes every unit from exactly its incoming weighted values', activation => {
    const graph = model({ activation, seed: 7, hiddenLayers: 5, units: 5, input: 0 });
    expect(graph.layers[0].map(n => n.value)).toEqual([0, 1, -1]);
    for (const node of graph.nodes.filter(n => n.layerIndex > 0)) {
      const incoming = graph.lines.filter(e => e.targetLayer === node.layerIndex && e.targetIndex === node.nodeIndex);
      const sum = incoming.reduce((total, e) => total + graph.layers[e.sourceLayer][e.sourceIndex].value * e.weight, 0);
      expect(node.sum).toBeCloseTo(sum, 14);
      expect(node.value).toBeCloseTo(activation === 'tanh' ? Math.tanh(sum) : 1 / (1 + Math.exp(-sum)), 14);
    }
  });
  test('input edits recompute activations without changing topology or weights', () => {
    const a = model({ input: 0 }); const b = model({ input: 100 });
    expect(a.lines).toEqual(b.lines);
    expect(a.outputs).not.toEqual(b.outputs);
    expect(model({ seed: 2 }).lines).not.toEqual(a.lines);
    expect(model({ seed: 2 })).toEqual(model({ seed: 2 }));
  });
  test('activation area has an explicit fixed scale', () => {
    for (const activation of ['tanh', 'sigmoid']) for (const n of model({ activation }).nodes) {
      const expected = n.layerIndex === 0 || activation === 'tanh' ? (n.value + 1) / 2 : n.value;
      expect((n.fillRadius / (n.r - 18 * .022 * 1.35)) ** 2).toBeCloseTo(expected, 14);
    }
  });
  test('local connections are a subset of the same dense weights, with no isolated units', () => {
    for (const units of [2, 3, 4, 5]) {
      const dense = model({ units, hiddenLayers: 5 });
      const local = model({ units, hiddenLayers: 5, connectivity: 'local' });
      for (const edge of local.lines) expect(dense.lines).toContainEqual(edge);
      expect(local.lines.length).toBeLessThan(dense.lines.length);
      for (const node of local.nodes) {
        if (node.layerIndex) expect(local.lines.some(e => e.targetLayer === node.layerIndex && e.targetIndex === node.nodeIndex)).toBe(true);
        if (node.layerIndex < local.layers.length - 1) expect(local.lines.some(e => e.sourceLayer === node.layerIndex && e.sourceIndex === node.nodeIndex)).toBe(true);
      }
    }
  });
  test('all parameter extrema retain complete nodes and stroke bounds in the official domain', () => {
    for (let hiddenLayers = 1; hiddenLayers <= 5; hiddenLayers++) for (let units = 2; units <= 5; units++)
      for (const connectivity of ['dense', 'local']) for (const activation of ['tanh', 'sigmoid'])
        for (const input of [0, 100]) for (const seed of [1, 16]) {
          const graph = model({ hiddenLayers, units, connectivity, activation, input, seed, barStartX: 20, barY: 132.4885 });
          const half = graph.thickness / 2;
          for (const n of graph.nodes) {
            expect(n.x - n.r - half).toBeGreaterThanOrEqual(20 - 1e-9);
            expect(n.x + n.r + half).toBeLessThanOrEqual(270 + 1e-9);
            expect(n.y - n.r - half).toBeGreaterThan(132.4885);
            expect(n.y + n.r + half).toBeLessThan(150.4885);
            expect(Number.isFinite(n.value)).toBe(true);
          }
          for (const e of graph.lines) for (const [x, y] of [[e.x1, e.y1], [e.x2, e.y2]]) {
            expect(x - e.width / 2).toBeGreaterThan(20);
            expect(x + e.width / 2).toBeLessThan(270);
            expect(y - e.width / 2).toBeGreaterThan(132.4885);
            expect(y + e.width / 2).toBeLessThan(150.4885);
          }
        }
  });
  test('settings reject nonfinite input, retain zero and bound every numeric parameter', () => {
    expect(normalize({ input: 0 }).input).toBe(0);
    expect(normalize({ input: NaN, seed: Infinity })).toMatchObject({ input: 65, seed: 1 });
    expect(normalize({ hiddenLayers: 99, units: -1, input: 999, seed: 99 })).toMatchObject({ hiddenLayers: 5, units: 2, input: 100, seed: 16 });
  });
});
