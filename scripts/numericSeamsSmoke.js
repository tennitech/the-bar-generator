// Numeric issue regressions: actual controls, seam-free raster and SVG/PNG export.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium, webkit} = require('playwright');
(async () => {
  const engine = process.env.RPI_BROWSER || 'chromium';
  const browser = await ({chromium,webkit}[engine]).launch(engine === 'chromium' && process.env.RPI_CHROMIUM_PATH ? {executablePath:process.env.RPI_CHROMIUM_PATH} : {});
  const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/numeric-seams-${engine}`;
  await fs.mkdir(evidence,{recursive:true});
  try {
    const page = await browser.newPage({viewport:{width:1489,height:974},reducedMotion:'reduce'});
    const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error('pageerror',e.message);});
    await page.goto(`${process.env.RPI_SITE_URL || 'http://127.0.0.1:8842'}/generator/numeric/?numericMode=height`);
    await page.waitForFunction(()=>window.logoExportUI && window.barShareController && typeof numericInput !== 'undefined' && numericInput === document.getElementById('numeric-input'));
    for (const width of [1489,913,390]) {
      await page.setViewportSize({width,height:974});
      const toggle=page.locator('#mobile-menu-toggle');
      if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
      await page.locator('#numeric-input').fill('9'.repeat(99));
      await page.waitForFunction(()=>getNumericSourceValue() === '9'.repeat(99));
      const result = await page.evaluate(async () => {
        const source = buildCurrentBarOnlySVG();
        const image=new Image(); image.src='data:image/svg+xml;base64,'+btoa(source.replace('<svg ', '<svg width="743" height="54" preserveAspectRatio="none" '));await image.decode();
        // Nonintegral display widths expose the historical rectangle seams.
        const canvas=document.createElement('canvas');canvas.width=743;canvas.height=54;
        const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,743,54);
        const pixels=ctx.getImageData(0,27,743,1).data;
        return {minimumAlpha:Math.min(...Array.from({length:741},(_,i)=>pixels[(i+1)*4+3])),source};
      });
      await fs.writeFile(`${evidence}/raster-source.svg`,result.source);
      assert.equal(result.minimumAlpha,255,'continuous height run has no transparent hairlines');
      assert.equal((result.source.match(/<path /g)||[]).length,1);
      await page.locator('#numeric-input').fill('0.0123456789');
      await page.screenshot({path:`${evidence}/height-${width}.png`});
      const snapshot=await page.evaluate(()=>captureLogoExportSnapshot().svgSource);
      const wait=page.waitForEvent('download');await page.evaluate(()=>void saveSVG());
      assert.equal(await fs.readFile(await (await wait).path(),'utf8'),snapshot);
      const pngWait=page.waitForEvent('download');await page.evaluate(()=>void savePNG());
      const png=await fs.readFile(await (await pngWait).path());
      const parity=await page.evaluate(async ({svg,png})=>{
        const width=2320,height=1524;
        const xml=new DOMParser().parseFromString(svg,'image/svg+xml');
        xml.documentElement.setAttribute('width',width);xml.documentElement.setAttribute('height',height);
        xml.documentElement.setAttribute('viewBox',`-20 -20 ${width/8} ${height/8}`);
        async function pixels(src){const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.drawImage(image,0,0);return c.getImageData(0,0,width,height).data;}
        const a=await pixels('data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(xml)));
        const b=await pixels('data:image/png;base64,'+png);
        return a.every((value,i)=>value===b[i]);
      },{svg:snapshot,png:png.toString('base64')});
      assert.equal(parity,true,'downloaded PNG matches captured vector');
      await page.locator('#numeric-input').fill('0');
      assert.equal(await page.evaluate(()=>parseNumericString(getNumericSourceValue())[0]),0);
      assert.ok((await page.evaluate(()=>buildCurrentBarOnlySVG())).includes('<path'));
      await page.locator('#numeric-input').press('Tab');
      assert.deepEqual(errors,[]);

    }
    console.log(`${engine}: seam raster, zero, responsive previews, actual SVG and PNG parity passed`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
