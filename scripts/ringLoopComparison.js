/* Offline native raster comparison of exact model projections; no browser claims. */
const fs = require('node:fs');
const { createCanvas } = require('@napi-rs/canvas');
const model = require('../js/utils/quantumModel');
const { createWaveQuantumPatternGeometry } = require('../js/utils/barPattern');
const { getLoopingGifFramePlan } = require('../js/utils/loopingGif');
const { frameTiming } = require('../js/utils/transparentGif');
const out = process.argv[2] || '/tmp/ring-loop-comparison'; fs.mkdirSync(out, { recursive: true });
const original = model.sampleDisplay;
const canvas = createCanvas(1200, 620), ctx = canvas.getContext('2d');
ctx.fillStyle = '#fafafa'; ctx.fillRect(0,0,1200,620);
const rows = [];
for (const [row, moving] of [false,true].entries()) {
  ctx.fillStyle = '#111'; ctx.font = '20px sans-serif';
  ctx.fillText(moving ? 'Moving coordinates: same state, 4.28 s recurrence' : 'Fixed coordinates: previous view, first 4.28 s of 120 s',20,35+row*280);
  model.sampleDisplay = moving ? original : model.sample;
  for(let i=0;i<5;i++) {
    const seconds = 4.28*i/4, phase = seconds/(moving ? 4.28 : 120);
    const g=createWaveQuantumPatternGeometry({barStartX:0,barY:0,exactBarWidth:1000,barHeight:72,quantumPhase:phase});
    ctx.save();ctx.translate(110,55+row*280+i*46);ctx.scale(1,.45);
    ctx.fillStyle = '#d6001c';
    for(const polygon of g.polygons) {ctx.beginPath();polygon.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
    ctx.restore();ctx.fillStyle='#111';ctx.font='14px sans-serif';ctx.fillText(seconds.toFixed(2)+' s',20,77+row*280+i*46);
  }
}
model.sampleDisplay=original;
fs.writeFileSync(out+'/comparison.png',canvas.toBuffer('image/png'));
for(const speed of [1,4]) for(const fps of [25,30,50]) {
 const plan=getLoopingGifFramePlan('wave-quantum',{quantumSpeed:speed,quantumPhase:.371},{fps});
 const timing=frameTiming(plan.periodSeconds,plan.frameCount);
 const paths=timing.progress.map(p=>createWaveQuantumPatternGeometry({barHeight:72,exactBarWidth:1000,quantumPhase:plan.getQuantumPhase(p)}).paths.flat());
 const steps=paths.map((frame,i)=>Math.sqrt(frame.reduce((sum,p,j)=>sum+(p.y-paths[(i+1)%paths.length][j].y)**2,0)/frame.length));
 rows.push({speed,fps,frames:plan.frameCount,durationMs:timing.durationMs,delays:[...new Set(timing.delays)],maxRmsStepPx:Math.max(...steps),seamRmsStepPx:steps.at(-1),meanRmsStepPx:steps.reduce((a,b)=>a+b)/steps.length});
}
fs.writeFileSync(out+'/comparison.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
