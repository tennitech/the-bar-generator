const {
  getPagesFallbackRedirectUrl,
  inferPagesBasePath
} = require('../js/utils/pagesFallback');

describe('GitHub Pages fallback routing', () => {
  test('infers the repository base path on GitHub Pages project sites', () => {
    expect(inferPagesBasePath('/rpi-logo-generator/generator/ticker/', 'tennitech.github.io')).toBe('/rpi-logo-generator/');
    expect(inferPagesBasePath('/generator/ticker/', 'example.com')).toBe('/');
    expect(inferPagesBasePath('/css/style.css', 'tennitech.github.io')).toBe('/');
  });

  test('rewrites legacy generator aliases onto valid style routes', () => {
    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/generator/staff/', '?colorMode=red', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/generator/solid/?colorMode=red');

    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/generator/matrix/', '?colorMode=white', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/generator/solid/?colorMode=white');

    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/generator/truss/', '?trussSegments=20', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/generator/solid/?trussSegments=20');
  });

  test('falls unknown generator routes back to the default solid style under the repo base path', () => {
    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/generator/not-a-style/', '?graphText=RPI', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/generator/solid/?graphText=RPI');
  });

  test('sends non-generator 404s back to the homepage while preserving legacy generator query links', () => {
    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/does-not-exist', '', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/');

    expect(
      getPagesFallbackRedirectUrl('/rpi-logo-generator/nope', '?style=ticker&tickerRepeats=55', {
        hostname: 'tennitech.github.io'
      })
    ).toBe('/rpi-logo-generator/generator/ticker/?tickerRepeats=55');
  });
});
