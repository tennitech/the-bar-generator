/* Developer maintenance tool, not a production build step. Run against a local
   checkout when generator defaults or geometry change. Never invent samples. */
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { entries } = require('../js/utils/marqueeCatalog');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8779';
async function main() {
  const browser = await chromium.launch({ headless: true });
  const directory = path.join(__dirname, '../assets/images/marquee-bars');
  await fs.mkdir(directory, { recursive: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    // Fix only the random seed, leaving every real default/control unchanged.
    await page.addInitScript(() => {
      const original = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = array => array instanceof Uint32Array && array.length === 1
        ? (array[0] = 1824, array) : original(array);
    });
    for (const entry of entries) {
      await page.goto(`${base}/generator/${entry.value}/?colorMode=white`);
      await page.waitForFunction(() => typeof buildCurrentBarOnlySVG === 'function'
        && document.querySelector('#p5-container canvas'));
      if (entry.value === 'lunar') await page.waitForFunction(() => typeof createLunarBarVectorFragment === 'function');
      const svg = await page.evaluate(() => buildCurrentBarOnlySVG());
      // Black source, displayed white via the splash's existing monochrome filter.
      await fs.writeFile(path.join(directory, `${entry.value}.svg`), `${svg}\n`);
      console.log(entry.value);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
