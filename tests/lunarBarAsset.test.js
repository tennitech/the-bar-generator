const { createLunarBarVectorFragment, getLunarBarSVGSourceForColorMode } = require('../js/utils/lunarBarAsset');

describe('supplied Artemis vector artwork', () => {
  test.each(['black', 'white', 'lunar'])('%s keeps genuine local paths without a raster wrapper or external dependency', mode => {
    const source = getLunarBarSVGSourceForColorMode(mode);
    const fragment = createLunarBarVectorFragment(7, 11, 250, 18, '#d6001c', mode);
    expect(fragment).toContain('x="7" y="11" width="250" height="18"');
    expect(fragment).toContain('overflow="hidden"');
    expect(fragment.match(/<path\b/g).length).toBe(source.match(/<path\b/g).length);
    expect(fragment).not.toMatch(/<image\b|<use\b|href=|url\(|data:image|<!DOCTYPE|<\?xml/);
  });
});
