/* Developer maintenance tool, not a production build step. Run against a local
   checkout when generator defaults or geometry change. Never invent samples. */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit, firefox } = require('playwright');
const { samples } = require('../js/utils/marqueeCatalog');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8779';
function compareSvgSamples(expected, actual) {
  if (expected === actual) return { exact:true, maxDelta:0 };
  // Different JS engines/architectures can serialize trig/model calculations a
  // final floating-point bit apart. Keep structure/text exact and reject any
  // coordinate difference above 1e-10 reference units; never refit the artwork.
  const numbers = /[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi;
  assert.deepEqual(expected.split(numbers),actual.split(numbers),'SVG structure/text changed');
  const before=expected.match(numbers) || [], after=actual.match(numbers) || [];
  assert.equal(before.length,after.length,'SVG numeric token count changed');
  let maxDelta=0;
  before.forEach((value,index) => {
    const delta=Math.abs(Number(value)-Number(after[index]));
    assert.ok(Number.isFinite(delta) && delta<=1e-10,`SVG numeric drift at token ${index}: ${value} → ${after[index]}`);
    maxDelta=Math.max(maxDelta,delta);
  });
  return { exact:false, maxDelta };
}
async function main() {
  const engine = process.env.RPI_BROWSER || 'chromium';
  const browserType = { chromium, webkit, firefox }[engine];
  assert.ok(browserType, `Unsupported RPI_BROWSER: ${engine}`);
  const browser = await browserType.launch({ headless: true });
  const checkOnly = process.env.RPI_MARQUEE_CHECK === '1';
  const directory = path.join(__dirname, '../assets/images/marquee-bars');
  await fs.mkdir(directory, { recursive: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    // Capture the authored canonical initial packing seed, which also matches Reset.
    // Do not override randomness: explicit shared seeds and the generator UX stay intact.
    for (const entry of samples) {
      await page.goto(`${base}/generator/${entry.value}/?colorMode=white${entry.query ? `&${entry.query}` : ''}`);
      await page.waitForFunction(() => typeof buildCurrentBarOnlySVG === 'function'
        && document.querySelector('#p5-container canvas'));
      if (entry.value === 'lunar') await page.waitForFunction(() => typeof createLunarBarVectorFragment === 'function');
      const captured = await page.evaluate(() => ({ svg: buildCurrentBarOnlySVG(),
        style: styleSelect.value, colorMode: currentColorMode, seed: sharePatternSeed,
        controls: { ...getCurrentBarPatternValues(250), ...window.quantumControls.values() } }));
      assert.equal(captured.style, entry.value);
      for (const [key, value] of new URLSearchParams(entry.query)) {
        assert.equal(String(captured.controls[key]), value, `${entry.value}:${entry.variant} did not restore ${key}`);
      }
      assert.equal(captured.colorMode, 'white');
      assert.equal(captured.seed, 1, 'Canonical initial packing seed must match Reset');
      assert.match(captured.svg, /viewBox="0 0 250 18"/);
      assert.doesNotMatch(captured.svg, /NaN|undefined|<image\b/);
      const svg = `${captured.svg}\n`;
      // Black source, displayed white via the splash's existing monochrome filter.
      const filename = path.join(directory, path.basename(entry.path.split('?')[0]));
      if (checkOnly) console.log(JSON.stringify({ style:entry.value,
        comparison:compareSvgSamples(await fs.readFile(filename, 'utf8'),svg) }));
      else await fs.writeFile(filename, svg);
      console.log(`${entry.value}:${entry.variant}`);
    }
    console.log(JSON.stringify({ engine, count: samples.length, checkOnly, passed: true }));
  } finally { await browser.close(); }
}
module.exports = { compareSvgSamples };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
