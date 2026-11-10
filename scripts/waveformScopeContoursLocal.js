/* Optional native actual-audio geometry QA at 400% viewer-equivalent scale.
 * No browser or hardware listening. NODE_PATH=/tmp/rpi-lfo-qa/node_modules
 * node scripts/waveformScopeContoursLocal.js [output-directory]
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {createCanvas,Path2D}=require('@napi-rs/canvas');
const audio=require('node-web-audio-api');
global.WaveformLfo=require('../js/utils/waveformLfo');global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope'),{createWaveformPatternGeometry:geometry}=require('../js/utils/barPattern');
const out=path.resolve(process.argv[2]||'/tmp/rpi-scope-contours-zoom');
const oldSource=cp.execFileSync('git',['show','53bc9ff:js/utils/barPattern.js'],{encoding:'utf8'}),oldModule={exports:{}};
new Function('module','require',oldSource)(oldModule,name=>{assert.equal(name,'./rulerScale');return require('../js/utils/rulerScale');});
const oldGeometry=oldModule.exports.createWaveformPatternGeometry;
function raster(frame,legacy=false) {
  const canvas=createCanvas(4640,928),ctx=canvas.getContext('2d');
  const g=(legacy?oldGeometry:geometry)({waveformScope:frame,barStartX:320,barY:320,exactBarWidth:4000,barHeight:288});
  const d=g.polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z';
  ctx.fillStyle='#000';ctx.fill(new Path2D(d));return canvas;
}
async function main() {
  fs.mkdirSync(out,{recursive:true});
  const sheet=createCanvas(1200,2230),ctx=sheet.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,sheet.width,sheet.height);
  ctx.fillStyle='#000';ctx.font='18px sans-serif';ctx.fillText('Actual native audio · 400% geometry crops · not browser UI',20,30);
  const models=[{name:'LFO off · frequency10',frequency:10,type:0,lfo:{enabled:false,rate:2,depth:100,type:0}},
    {name:'LFO2Hz · Sine envelope',frequency:24,type:0,lfo:{enabled:true,rate:2,depth:100,type:0}},
    {name:'LFO0.07Hz · Sine envelope',frequency:24,type:0,lfo:{enabled:true,rate:.07,depth:100,type:0}}];
  const results=[];let row=0;
  for(const v of models) {
    // One actual PCM buffer feeds both representations, avoiding a misleading
    // comparison with the new envelope-bin count in the former zigzag path.
    const seconds=scope.duration(v),display=scope.displaySettings(v);
    const context=new audio.OfflineAudioContext(1,Math.ceil((seconds+display.replayLimit+.25)*48000),48000);
    await context.audioWorklet.addModule('js/pulse-worklet.js');
    const master=context.createGain();master.connect(context.destination);
    master.gain.setValueAtTime(0,0);master.gain.linearRampToValueAtTime(1,.05);
    const graph=WaveformAudio.create(context,master,v,{},audio.AudioWorkletNode);graph.update(v);
    const buffer=await context.startRendering(),pcm=buffer.getChannelData(0).subarray(12000),data=scope.pcmExtrema(pcm);
    const captured=scope.recording(data,6000,seconds,'offline',display,pcm),view=scope.sweep(captured,v),frame=captured.frame(view.origin);
    const legacyFrame=scope.frame(data,6000,view.origin,seconds,'offline');
    const current=raster(frame),old=raster(legacyFrame,true);
    fs.writeFileSync(path.join(out,`case-${row}-400.png`),current.toBuffer('image/png'));
    ctx.fillStyle='#000';ctx.font='16px sans-serif';ctx.fillText(`${v.name} · ${frame.seconds.toFixed(3)}s X · ${frame.displayMode}`,20,65+row*720);
    ctx.font='14px sans-serif';ctx.fillText('Before: max/min zigzag',20,90+row*720);
    ctx.drawImage(old,1220,320,1100,288,20,100+row*720,1100,288);
    ctx.fillText('After: ordered PCM / measured peak-envelope contours',20,420+row*720);
    ctx.drawImage(current,1220,320,1100,288,20,440+row*720,1100,288);
    // Physical sweep moves one whole LFO cycle, not one hidden carrier period.
    results.push({model:v,mode:frame.displayMode,seconds:frame.seconds,physicalSweep:view.span,displaySeconds:1/.3,
      orderedSamples:frame.trace?.length||0,peakBins:frame.extrema.length/2});row++;
  }
  fs.writeFileSync(path.join(out,'400-percent-comparison.png'),sheet.toBuffer('image/png'));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({kind:'Native actual Web Audio / geometry QA; not a browser or hardware listening check',results},null,2));
  console.log(`PASS: ${results.length} actual-audio 400% before/after geometry cases. ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
