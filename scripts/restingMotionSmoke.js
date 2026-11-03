// Current motion contract: translating bars move right by default, Loop off resets,
// still downloads use zero phase, and GIF preserves a complete animated cycle.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {createHash} = require('node:crypto');
const {chromium,webkit} = require('playwright');
const {parseGif,decodeFrames} = require('../tests/helpers/gifDecoder');
const base=process.env.RPI_SITE_URL || 'http://127.0.0.1:8861';
const engine=process.env.RPI_BROWSER || 'chromium';
const output=process.env.RPI_EVIDENCE_DIR || `/tmp/resting-motion-${engine}`;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,...(process.env.RPI_BROWSER_EXECUTABLE?{executablePath:process.env.RPI_BROWSER_EXECUTABLE}:{})});
 await fs.mkdir(output,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const results=[];
 const ready=()=>page.waitForFunction(()=>window.logoExportUI&&window.barShareController&&!window.PageEntrance?.isActive?.());
 const download=async format=>{
  const pending=page.waitForEvent('download');
  const outcome=await page.evaluate(format=>runLogoExport(format),format);
  assert.ok(outcome,`${format} export returned no outcome`);
  return fs.readFile(await (await pending).path());
 };
 try {
 for(const style of ['ticker','waveform','wave-quantum']){
  await page.goto(`${base}/generator/${style}/`);await ready();
  const prefix=style==='wave-quantum'?'quantum':style;
  assert.equal(await page.locator(`#${prefix}-motion-toggle`).isChecked(),true);
  const proof=await page.evaluate(async ({style,prefix})=>{
   const quantum=style==='wave-quantum';
   const toggle=document.getElementById(`${prefix}-motion-toggle`);
   const setLoop=value=>{toggle.checked=value;toggle.dispatchEvent(new Event('change',{bubbles:true}));};
   const phase=()=>quantum?quantumControls.values().quantumPhase:liveMotionPhase;
   const setPhase=value=>{if(quantum){document.getElementById('quantum-phase').value=value;quantumControls.sync();}else liveMotionPhase=value;};
   const captures=[];
   for(const reverse of [false,true]){
    setLoop(false);setPhase(.37);
    const reverseField=document.getElementById(`${prefix}-reverse-toggle`);
    reverseField.checked=reverse;reverseField.dispatchEvent(new Event('change',{bubbles:true}));
    const before=phase();setLoop(true);
    for(let i=0;i<8;i++)await new Promise(requestAnimationFrame);
    const after=phase();
    const moving=captureLogoExportSnapshot();
    const phaseAfterCapture=phase();
    setLoop(false);const restingPhase=phase();
    const still=captureLogoExportSnapshot();
    const restMarkup=buildCurrentBarPatternSVGFragment({fgColor:still.foreground});
    captures.push({reverse,before,after,phaseAfterCapture,restingPhase,matching:moving.svgSource===still.svgSource,
      stillMatchesPreview:still.svgSource.includes(restMarkup),values:moving.values});
   }
   document.getElementById('export-size-select').value='standard';logoExportUI.sync(false);
   return captures;
  },{style,prefix});
  for(const p of proof){
   const sign=style==='ticker'?-1:1;
   assert.equal(Math.sign(p.after-p.before),sign*(p.reverse?-1:1));
   assert.equal(p.phaseAfterCapture,p.after,'capture changed live phase');assert.equal(p.restingPhase,0);
   assert.equal(p.matching,true);assert.equal(p.stillMatchesPreview,true);
   for(const key of ['loopOffsetX','timeSeconds','quantumPhase'])assert.equal(p.values[key],0);
  }
  const restSvg=await download('svg'),restPng=await download('png');
  await page.evaluate(({style,prefix})=>{
   document.getElementById(`${prefix}-motion-toggle`).checked=true;
   document.getElementById(`${prefix}-motion-toggle`).dispatchEvent(new Event('change',{bubbles:true}));
   if(style==='wave-quantum'){document.getElementById('quantum-phase').value=.37;quantumControls.sync();}
   else liveMotionPhase=.37;
  },{style,prefix});
  const movingSvg=await download('svg'),movingPng=await download('png');
  assert.equal(digest(movingSvg),digest(restSvg),'SVG differs during animation');
  assert.equal(digest(movingPng),digest(restPng),'PNG differs during animation');
  if(style!=='wave-quantum'){
   const gif=await download('gif');await fs.writeFile(`${output}/${style}.gif`,gif);
   const parsed=parseGif(gif),hashes=[];
   for(const frame of decodeFrames(parsed)) hashes.push(digest(frame.rgba));
   assert.ok(hashes.length>=24);assert.ok(new Set(hashes).size>1,'GIF not animated');
   assert.equal(parsed.width,1160);assert.equal(parsed.height,762);
  }
  results.push({style,proof:proof.map(({values,...rest})=>rest),svgPngRestParity:true,gifAnimated:style!=='wave-quantum'});
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
 console.log(JSON.stringify({engine,results}));
 } finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
