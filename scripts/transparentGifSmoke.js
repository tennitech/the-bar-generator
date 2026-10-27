// Run against an existing local test server; this script owns only its browser.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const site = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const output = process.env.RPI_EXPORT_EVIDENCE || require('node:path').join(require('node:os').tmpdir(), 'rpi-transparent-exports');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function configure(page, family, size) {
  await page.goto(`${site}/generator/${family}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#p5-container canvas').waitFor();
  await page.waitForFunction(() => typeof captureLogoExportSnapshot === 'function' && window.logoExportUI);
  await page.evaluate(({ family, size }) => {
    const set = (id, value) => {
      const input = document.getElementById(id);
      if (!input) throw new Error(`Missing fixture control: ${id}`);
      input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set(`${family}-speed-slider`, '5');
    if (family === 'ruler') { set('ruler-repeats-slider', '20'); set('ruler-units-slider', '10'); }
    if (family === 'ticker') { set('ticker-slider', '40'); set('ticker-ratio-slider', '5'); }
    if (family === 'waveform') {
      set('waveform-type-slider', '2.35'); set('waveform-frequency-slider', '100');
      const envelope = document.getElementById('waveform-envelope-toggle');
      envelope.checked = true; envelope.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.getElementById('export-size-select').value = size;
    const color = document.getElementById('color-mode-select');
    color.value = family === 'ruler' ? 'black' : family === 'ticker' ? 'white' : 'red';
    color.dispatchEvent(new Event('change', { bubbles: true }));
    // Sharing supplies this input on the combined branch. The fixture exercises
    // the same optional-title hook on the isolated export branch.
    if (!document.getElementById('share-name')) {
      const input = document.createElement('input'); input.id = 'share-name'; input.hidden = true;
      document.body.append(input);
    }
    document.getElementById('share-name').value = 'Étude 月 / loop';
    logoExportUI.sync(false);
    window.exportExpected = [];
    window.exportSnapshot = null;
    const original = createCapturedGifRenderer;
    createCapturedGifRenderer = (snapshot, plan) => {
      exportSnapshot = { foreground: snapshot.rgb, dimensions: snapshot.dimensions, period: plan.periodSeconds };
      const renderer = original(snapshot, plan), render = renderer.renderFrame;
      renderer.renderFrame = async (index, progress) => {
        const image = render(index, progress), alpha = new Uint8Array(image.width * image.height);
        // Independent coverage oracle before the encoder mutates/transfers RGBA.
        const thresholds = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
        for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
          const i = y * image.width + x;
          alpha[i] = image.data[i * 4 + 3] > (thresholds[(y % 4) * 4 + x % 4] + 0.5) * 255 / 16 ? 255 : 0;
        }
        const hash = await crypto.subtle.digest('SHA-256', alpha);
        exportExpected[index] = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
        return image;
      };
      return renderer;
    };
  }, { family, size });
}

async function download(page, method, destination) {
  const pending = page.waitForEvent('download', { timeout: 180000 });
  const result = await page.evaluate(method => window[method](), method);
  assert.ok(result, `${method} must complete`);
  const file = await pending;
  await file.saveAs(destination);
  assert.match(file.suggestedFilename().normalize('NFC'), /--étude-月-loop\./u);
  return result;
}

async function compositeEvidence(page, gif, rgba, filename) {
  const encoded = Buffer.from(rgba).toString('base64');
  const composites = await page.evaluate(({ width, height, encoded }) => {
    const section = document.createElement('section'); section.id = 'export-evidence';
    section.style = 'position:fixed;top:16px;left:16px;z-index:999999;background:#888;padding:16px;width:1120px;max-width:calc(100vw - 32px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px';
    const composites = [];
    for (const [name, background] of [['light', '#fff'], ['dark', '#000'], ['checker', null]]) {
      const group = document.createElement('div');
      const label = document.createElement('p'); label.textContent = name; group.append(label);
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      canvas.style = 'display:block;width:100%;height:auto';
      const ctx = canvas.getContext('2d');
      if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); }
      else for (let y = 0; y < height; y += 16) for (let x = 0; x < width; x += 16) {
        ctx.fillStyle = ((x + y) / 16) % 2 ? '#aaa' : '#eee'; ctx.fillRect(x, y, 16, 16);
      }
      const source = document.createElement('canvas'); source.width = width; source.height = height;
      source.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(atob(encoded), c => c.charCodeAt(0)), width, height), 0, 0);
      ctx.drawImage(source, 0, 0); group.append(canvas); section.append(group);
      composites.push({ name, png: canvas.toDataURL('image/png').split(',')[1] });
    }
    document.body.append(section); return composites;
  }, { width: gif.width, height: gif.height, encoded });
  for (const composite of composites) await fs.writeFile(filename.replace(/\.png$/, `-${composite.name}.png`), Buffer.from(composite.png, 'base64'));
  await page.locator('#export-evidence').screenshot({ path: filename });
  await page.locator('#export-evidence').evaluate(element => element.remove());
}

async function checkUI(page) {
  await page.locator('#save-button').click();
  const before = await page.locator('#save-button').boundingBox();
  // UI-only failure and cancellation injection. Real encodes are checked below.
  await page.evaluate(() => {
    window.originalEncode = transparentGifUtils.encode;
    transparentGifUtils.encode = ({ signal, onProgress }) => new Promise((resolve, reject) => {
      onProgress({ prepared: 2, encoded: 1, total: 10 });
      signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true });
    });
    window.uiExport = saveLoopingGIF();
  });
  assert.equal(await page.evaluate(() => logoExportUI.isBusy()), true);
  assert.equal(await page.evaluate(() => saveLoopingGIF()), null, 'Duplicate export blocked');
  assert.equal(await page.locator('#export-size-select').isDisabled(), true);
  assert.deepEqual(await page.locator('#save-button').boundingBox(), before, 'No toolbar size shift');
  assert.equal(await page.locator('#save-button').evaluate(el => getComputedStyle(el, '::after').animationName), 'none');
  assert.match(await page.locator('#save-button').evaluate(el => getComputedStyle(el, '::after').maskImage), /feather\/icons\/loader\.svg/);
  await page.locator('#export-cancel').click();
  await page.evaluate(() => uiExport);
  assert.equal(await page.evaluate(() => logoExportUI.isBusy()), false);
  assert.equal(await page.locator('#export-size-select').isEnabled(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button', 'Cancel returns focus to the visible trigger');
  assert.equal(await page.locator('#save-menu').isVisible(), false);
  await page.locator('#save-button').click();
  await page.evaluate(async () => {
    transparentGifUtils.encode = async () => { throw new Error('Test encoder failure'); };
    document.getElementById('save-loop-gif').focus(); await saveLoopingGIF();
  });
  assert.match(await page.locator('#export-message').innerText(), /Export failed/);
  assert.equal(await page.locator('#save-menu').isVisible(), true, 'Failure keeps the retry menu open');
  assert.equal(await page.locator('#save-loop-gif').isVisible(), true, 'Retry target must remain visible');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'save-loop-gif');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
  assert.equal(await page.locator('#save-menu').isVisible(), false);
  await page.evaluate(() => { transparentGifUtils.encode = originalEncode; });
  await page.setViewportSize({ width: 390, height: 844 });
  // The app deliberately dismisses popovers after a resize settles.
  await page.waitForTimeout(250);
  await page.locator('#save-button').click();
  assert.equal(await page.locator('#save-menu').isVisible(), true);
  const menu = await page.locator('#save-menu').boundingBox();
  assert.ok(menu.x >= 0 && menu.x + menu.width <= 391, 'Mobile download popup fits');
  await page.screenshot({ path: path.join(output, 'download-mobile.png') });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const records = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    for (const family of ['ruler', 'ticker', 'waveform']) for (const size of ['standard', 'large']) {
      await configure(page, family, size);
      if (family === 'ruler' && size === 'standard') {
        await checkUI(page);
        if (process.env.RPI_EXPORT_UI_ONLY === '1') { console.log(`${engine}: export focus/cancel/retry, busy Feather mask and reduced motion passed`); return; }
      }
      const filename = path.join(output, `${family}-${size}.gif`);
      const result = await download(page, 'saveLoopingGIF', filename);
      const oracle = await page.evaluate(() => ({ expected: exportExpected, snapshot: exportSnapshot }));
      const gif = parseGif(await fs.readFile(filename));
      const scale = size === 'standard' ? 4 : 8;
      assert.equal(gif.width, 290 * scale); assert.equal(gif.height, Math.ceil(190.4885 * scale));
      assert.equal(gif.frames.length, oracle.expected.length);
      let duration = 0, index = 0;
      for (const { rgba, frame } of decodeFrames(gif)) {
        assert.equal(frame.transparent, true); assert.equal(frame.transparentIndex, 0);
        assert.equal(frame.disposal, 2); assert.equal(rgba[3], 0, 'Clear corner');
        const alpha = new Uint8Array(gif.width * gif.height);
        for (let i = 0; i < alpha.length; i++) {
          alpha[i] = rgba[i * 4 + 3];
          if (alpha[i] && (rgba[i * 4] !== oracle.snapshot.foreground[0]
            || rgba[i * 4 + 1] !== oracle.snapshot.foreground[1]
            || rgba[i * 4 + 2] !== oracle.snapshot.foreground[2])) assert.fail('Unexpected matte/halo color');
        }
        assert.equal(digest(alpha), oracle.expected[index], `Exact painted coverage and no ghosts: frame ${index}`);
        const barTop = Math.floor((132.4885 + 20) * scale), barBottom = Math.ceil((150.4885 + 20) * scale);
        const column = x => { for (let y = barTop; y < barBottom; y++) if (alpha[y * gif.width + x]) return true; return false; };
        if (family !== 'ruler') {
          assert.ok(column(20 * scale), 'Left nominal bar edge paints');
          assert.ok(column(270 * scale - 1), 'Right nominal bar edge paints');
        }
        assert.equal(column(20 * scale - 1), false); assert.equal(column(270 * scale), false);
        if (index === 0) await compositeEvidence(page, gif, rgba, path.join(output, `${family}-${size}-backgrounds.png`));
        duration += frame.delayMs; index++;
      }
      assert.ok(Math.abs(duration - oracle.snapshot.period * 1000) <= 5);
      // Browser-native decoding separately checks dimensions and disposal output.
      const encoded = (await fs.readFile(filename)).toString('base64');
      const native = await page.evaluate(async encoded => {
        if (!window.ImageDecoder) {
          const blob = await (await fetch(`data:image/gif;base64,${encoded}`)).blob();
          const image = await createImageBitmap(blob);
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); image.close();
          const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const alpha = new Uint8Array(canvas.width * canvas.height);
          for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
          const firstFrameHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', alpha)), b => b.toString(16).padStart(2, '0')).join('');
          return { supported: false, firstFrameHash };
        }
        const decoder = new ImageDecoder({ data: Uint8Array.from(atob(encoded), c => c.charCodeAt(0)), type: 'image/gif' });
        await decoder.tracks.ready;
        const frameCount = decoder.tracks.selectedTrack.frameCount, hashes = [];
        for (const frameIndex of [0, frameCount - 1]) {
          const { image } = await decoder.decode({ frameIndex });
          const canvas = document.createElement('canvas'); canvas.width = image.displayWidth; canvas.height = image.displayHeight;
          canvas.getContext('2d').drawImage(image, 0, 0); image.close();
          const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          const alpha = new Uint8Array(canvas.width * canvas.height);
          for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
          hashes.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', alpha)), b => b.toString(16).padStart(2, '0')).join(''));
        }
        decoder.close(); return { supported: true, frameCount, hashes };
      }, encoded);
      if (engine === 'chromium') assert.equal(native.supported, true, 'Chromium native ImageDecoder available');
      if (native.supported) assert.deepEqual(native.hashes, [oracle.expected[0], oracle.expected.at(-1)]);
      else assert.equal(native.firstFrameHash, oracle.expected[0], 'Native first-frame GIF alpha matches the independent oracle');
      const pngFile = path.join(output, `${family}-${size}.png`);
      await download(page, 'savePNG', pngFile);
      const png = await fs.readFile(pngFile);
      assert.equal(png.readUInt32BE(16), gif.width); assert.equal(png.readUInt32BE(20), gif.height);
      const pngAlpha = await page.evaluate(async encoded => {
        const blob = await (await fetch(`data:image/png;base64,${encoded}`)).blob();
        const image = await createImageBitmap(blob), canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); image.close();
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let partial = false; for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0 && pixels[i] < 255) { partial = true; break; }
        return { corner: pixels[3], partial };
      }, png.toString('base64'));
      assert.equal(pngAlpha.corner, 0); assert.equal(pngAlpha.partial, true, 'PNG retains smooth partial alpha');
      if (family === 'ruler') {
        const svgFile = path.join(output, `${family}-${size}.svg`);
        await download(page, 'saveSVG', svgFile);
        const svg = await fs.readFile(svgFile, 'utf8');
        assert.match(svg, /width="290" height="190\.4885"/);
        assert.match(svg, /<title>Étude 月 \/ loop<\/title>/u);
        assert.doesNotMatch(svg, /<image\b/);
      }
      records.push({ family, size, ...result.metrics, nativeDecoder: native.supported, nativeFirstFrame: true, decodedFrames: index });
      await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(records, null, 2));
      console.log(JSON.stringify(records.at(-1)));
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
