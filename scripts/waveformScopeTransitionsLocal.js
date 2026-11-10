/* Optional actual-audio/native raster QA. No browser or audio hardware.
 * NODE_PATH=/tmp/rpi-lfo-qa/node_modules node scripts/waveformScopeTransitionsLocal.js [out]
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const audio=require('node-web-audio-api');
const {nativeRuntime}=require('./helpers/nativeExportRuntime');
global.WaveformLfo=require('../js/utils/waveformLfo');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const out=path.resolve(process.argv[2]||'/tmp/rpi-scope-transitions-evidence');
async function main() {
  fs.mkdirSync(out,{recursive:true});
  const context=new audio.OfflineAudioContext(1,60000,48000);
  await context.audioWorklet.addModule('js/pulse-worklet.js');
  const model={frequency:24,type:0,lfo:{enabled:true,rate:2,depth:100,type:0}};
  const graph=WaveformAudio.create(context,context.destination,model,{},audio.AudioWorkletNode);graph.update(model);
  const buffer=await context.startRendering();
  const pcm=buffer.getChannelData(0).subarray(12000),all=scope.pcmExtrema(pcm);
  const r=nativeRuntime();r.select('waveform');r.state.composition='bar';
  Object.assign(r.state.values,{waveformFrequency:24,waveformType:0,waveformLfo:true,waveformLfoRate:2,waveformLfoDepth:100,waveformScopeRequired:true});
  const sheet=createCanvas(1180,570),ctx=sheet.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1180,570);
  ctx.fillStyle='#000';ctx.font='18px sans-serif';ctx.fillText('Fixed 1.000 s X window · actual post-gain audio · blank left area is unrecorded',20,30);
  const results=[];let row=0;
  for(const seconds of [.0625,.25,.5,1]) {
    const data=all.subarray(0,Math.round(seconds*6000)*2);
    const recording=scope.recording(data,6000,1,'live',{alignEnd:true,filling:seconds<1});
    const frame=recording.frame(0);r.waveformScopeController={capture:()=>({frame,recording})};
    assert.equal(frame.seconds,1);assert.equal(frame.availableSeconds,seconds);
    for(const size of ['standard','large']) {
      r.state.size=size;
      const snapshot=r.captureLogoExportSnapshot(),blob=await r.createPNGExportBlob(snapshot,new AbortController().signal);
      const bytes=Buffer.from(await blob.arrayBuffer()),image=await loadImage(bytes);
      const canvas=createCanvas(image.width,image.height),pixelsContext=canvas.getContext('2d');pixelsContext.drawImage(image,0,0);
      const rgba=pixelsContext.getImageData(0,0,image.width,image.height).data;
      const firstPossibleInk=(20+250*frame.startFraction)*snapshot.dimensions.scale;
      let ink=0,missingInk=0;
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(rgba[(y*image.width+x)*4+3]) {
        ink++;if(x+1<=firstPossibleInk)missingInk++;
      }
      assert.ok(ink>0);assert.equal(missingInk,0,'Unrecorded history was painted or stretched');
      results.push({seconds,size,window:frame.seconds,startFraction:frame.startFraction,ink,missingInk});
      fs.writeFileSync(path.join(out,`history-${seconds}-${size}.png`),bytes);
      if(size==='standard') {
        fs.writeFileSync(path.join(out,`history-${seconds}.svg`),snapshot.svgSource);
        ctx.fillStyle='#000';ctx.font='15px sans-serif';ctx.fillText(`${seconds.toFixed(4)} s recorded / 1.000 s window`,20,68+row*125);
        const scale=snapshot.dimensions.scale;
        ctx.drawImage(image,20*scale,20*scale,250*scale,18*scale,20,78+row*125,1140,1140*18/250);row++;
      }
    }
  }
  fs.writeFileSync(path.join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({kind:'Actual offline audio/native PNG verification; not browser UI',results},null,2));
  console.log(`PASS: ${results.length} actual PNGs; fixed one-second axis; zero ink in every unrecorded region. ${out}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
