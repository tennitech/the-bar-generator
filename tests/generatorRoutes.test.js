const {
  buildGeneratorPath,
  buildGeneratorUrl,
  getGeneratorRouteStyleFromPathname,
  getLegacyGeneratorRedirectUrl,
  hasGeneratorQueryState,
  normalizeStyleValue
} = require('../js/utils/generatorRoutes');

describe('generator route utils', () => {
  test('normalizes legacy and unknown style values safely', () => {
    expect(normalizeStyleValue('staff')).toBe('music');
    expect(normalizeStyleValue('matrix')).toBe('solid');
    expect(normalizeStyleValue('not-a-style')).toBe('solid');
  });

  test('parses generator style routes and defaults bare generator paths to solid', () => {
    expect(getGeneratorRouteStyleFromPathname('/generator/ticker/')).toBe('ticker');
    expect(getGeneratorRouteStyleFromPathname('/repo/generator/neural-network/')).toBe('neural-network');
    expect(getGeneratorRouteStyleFromPathname('/repo/generator/index.html')).toBe('solid');
    expect(getGeneratorRouteStyleFromPathname('/')).toBeNull();
  });

  test('builds style routes while preserving a site base path', () => {
    expect(buildGeneratorPath('ticker', '/repo/index.html')).toBe('/repo/generator/ticker/');
    expect(buildGeneratorPath('staff', '/repo/generator/music/')).toBe('/repo/generator/music/');
    expect(buildGeneratorPath('solid', '/')).toBe('/generator/solid/');
  });

  test('builds clean generator urls with query params but no style query string', () => {
    const params = new URLSearchParams('style=ticker&colorMode=red&tickerRepeats=55');
    expect(buildGeneratorUrl('ticker', params, '/repo/generator/index.html')).toBe('/repo/generator/ticker/?colorMode=red&tickerRepeats=55');
  });

  test('detects generator query-state and redirects legacy root links into style paths', () => {
    expect(hasGeneratorQueryState('?foo=bar&style=grid')).toBe(true);
    expect(hasGeneratorQueryState('?graphText=RPI')).toBe(true);
    expect(hasGeneratorQueryState('?foo=bar')).toBe(false);

    expect(getLegacyGeneratorRedirectUrl('/repo/', '?style=waveform&colorMode=white')).toBe('/repo/generator/waveform/?colorMode=white');
    expect(getLegacyGeneratorRedirectUrl('/repo/marquee-ui.html', '?colorMode=red')).toBe('/repo/generator/solid/?colorMode=red');
    expect(getLegacyGeneratorRedirectUrl('/repo/generator/ticker/', '?colorMode=red')).toBeNull();
  });
});
