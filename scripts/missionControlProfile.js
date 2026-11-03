// Local diagnostic, not a CI budget. Compare baseline/after on the SAME host,
// browser build, viewport and motion settings; selection includes the theme scan.
const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const evidence = process.env.RPI_MISSION_EVIDENCE || path.join(os.tmpdir(), 'rpi-mission-profile');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8792';
const label = process.env.RPI_PROFILE_LABEL || 'baseline';
const engine = process.env.RPI_BROWSER || 'chromium';
const motion = process.env.RPI_REDUCED_MOTION === '1' ? 'reduce' : 'no-preference';
const idleMs = 1200;
fs.mkdirSync(evidence, { recursive: true });

async function ready(page) {
  await page.waitForFunction(() => window.LUNAR_BAR_SVG_SOURCE
    && document.querySelector('[data-lunar-vector-preview] svg')
    && !window.PageEntrance?.isActive?.());
  await page.evaluate(() => document.fonts.ready);
}

async function instrument(page) {
  await page.evaluate(() => {
    window.__missionCalls = {};
    window.__missionMutations = { overlay: 0, counter: 0 };
    window.__missionObserver = new MutationObserver(entries => {
      for (const entry of entries) {
        const node = entry.target.nodeType === 1 ? entry.target : entry.target.parentElement;
        if (node?.closest('[data-lunar-vector-preview]')) window.__missionMutations.overlay++;
        if (node?.closest('#lunar-splashdown-counter')) window.__missionMutations.counter++;
      }
    });
    window.__missionObserver.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    for (const name of ['applyColorMode', 'updateHeaderBrandPreview', 'draw', 'clear', 'drawSVGPath',
      'drawLunarBarPattern', 'createLunarBarVectorFragment', 'syncMissionControlGrid', 'updateLunarSplashdownCounter']) {
      const original = window[name];
      if (typeof original !== 'function') continue;
      window[name] = function (...args) {
        const start = performance.now();
        try { return original.apply(this, args); }
        finally {
          const stat = window.__missionCalls[name] ||= { count: 0, totalMs: 0 };
          stat.count++; stat.totalMs += performance.now() - start;
        }
      };
    }
    if (document.startViewTransition) {
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = callback => {
        const start = performance.now();
        const transition = original(callback);
        transition.ready.then(() => { window.__missionReady = performance.now() - start; }, () => {});
        return transition;
      };
    }
  });
}

async function reset(page) {
  await page.evaluate(() => {
    window.__missionCalls = {}; window.__missionLong = []; window.__missionReady = null;
    window.__missionMutations = { overlay: 0, counter: 0 };
  });
}

async function sample(page, extra = {}) {
  return page.evaluate(extra => ({ ...extra, readyMs: window.__missionReady,
    calls: window.__missionCalls, mutations: window.__missionMutations,
    longTaskSupported: PerformanceObserver.supportedEntryTypes.includes('longtask'),
    longTasks: window.__missionLong, nodes: document.querySelectorAll('*').length,
    resources: performance.getEntriesByType('resource').filter(entry => /lunar|woff/.test(entry.name))
      .map(entry => ({ name: entry.name.split('/').pop(), durationMs: entry.duration,
        transferBytes: entry.transferSize, encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize }))
  }), extra);
}

async function main() {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const output = { metadata: { label, engine, browserVersion: browser.version(), platform: os.platform(),
    osRelease: os.release(), arch: os.arch(), nodeVersion: process.version, viewport: { width: 1440, height: 900 },
    reducedMotion: motion, network: 'local HTTP; no explicit throttling', idleMs }, runs: [] };
  try {
    for (let run = 0; run < 3; run++) {
      const context = await browser.newContext({ viewport: output.metadata.viewport, reducedMotion: motion });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__missionLong = [];
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
          new PerformanceObserver(list => window.__missionLong.push(...list.getEntries()
            .map(entry => ({ startMs: entry.startTime, durationMs: entry.duration })))).observe({ entryTypes: ['longtask'] });
        }
      });
      const entries = [];
      for (const entry of ['cold-context', 'warm-reload']) {
        const start = Date.now();
        if (entry === 'cold-context') await page.goto(`${base}/generator/lunar/?colorMode=lunar`);
        else await page.reload();
        await ready(page);
        entries.push(await page.evaluate(({ entry, elapsed }) => ({ entry, artworkReadyMs: elapsed,
          navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
          paint: performance.getEntriesByType('paint').map(item => item.toJSON()) }), { entry, elapsed: Date.now() - start }));
      }
      await instrument(page);
      const switches = [];
      for (const theme of ['lunar', 'black', 'lunar', 'white', 'lunar']) {
        await reset(page);
        const start = Date.now();
        await page.selectOption('#color-mode-select', theme, { force: true });
        await page.waitForFunction(() => !document.querySelector('.theme_scan'));
        const settledMs = Date.now() - start;
        await page.waitForTimeout(120);
        switches.push(await sample(page, { theme, settledMs }));
      }
      let session;
      if (engine === 'chromium') {
        session = await context.newCDPSession(page);
        await session.send('Performance.enable');
      }
      const metrics = async () => session ? Object.fromEntries((await session.send('Performance.getMetrics')).metrics
        .map(item => [item.name, item.value])) : null;
      await reset(page);
      const before = await metrics();
      await page.waitForTimeout(idleMs);
      const after = await metrics();
      const idle = await sample(page, { observationMs: idleMs, chromiumMetricsBefore: before, chromiumMetricsAfter: after });
      await page.screenshot({ path: path.join(evidence, `mission-${label}-${engine}-${run}.png`) });
      output.runs.push({ run, errors, entries, switches, idle });
      console.log(JSON.stringify({ run, errors, entries: entries.map(({ entry, artworkReadyMs }) => ({ entry, artworkReadyMs })),
        idleCalls: idle.calls }));
      await context.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(evidence, `mission-${label}-${engine}.json`), JSON.stringify(output, null, 2));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
