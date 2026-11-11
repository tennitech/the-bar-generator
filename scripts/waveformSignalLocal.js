/* Offline native SVG/PNG/GIF verification; never launches a browser.
 * Requires test-only @napi-rs/canvas and node-web-audio-api (not an application dependency).
 * NODE_PATH=/tmp/rpi-audio-qa/node_modules node scripts/waveformSignalLocal.js [out]
 */
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {createCanvas,Image:NativeImage,Path2D,loadImage}=require('@napi-rs/canvas');
const {createRuntime,read}=require('../tests/helpers/exportCompositionRuntime');
const {encode,preparePixels,createPalette}=require('../js/utils/transparentGif');
const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const {getLoopingGifFramePlan}=require('../js/utils/loopingGif');
const {parseGif,decodeFrames}=require('../tests/helpers/gifDecoder');
const out=path.resolve(process.argv[2]||'/tmp/rpi-waveform-signal-evidence');
fs.mkdirSync(out,{recursive:true});
function runtime() {
  const urls=new Map();let serial=0;
  class Image extends NativeImage {
    set src(url) { if(url) this.pending=urls.get(url).arrayBuffer().then(bytes=>{super.src=Buffer.from(bytes);}); }
    async decode() {await this.pending;await super.decode();}
  }
  const r=createRuntime({Path2D,Image,
    XMLSerializer:class {serializeToString(doc){return doc.source;}},
    URL:{createObjectURL:blob=>{const url=`test:${++serial}`;urls.set(url,blob);return url;},revokeObjectURL:url=>urls.delete(url)}});
  // The PNG exporter only changes root SVG width/height before native decoding.
  r.DOMParser=class {parseFromString(source){const doc={source,querySelector:()=>null};doc.documentElement={setAttribute:(key,value)=>{doc.source=doc.source.replace(/<svg\b[^>]*>/,tag=>tag.replace(new RegExp(`${key}="[^"]*"`),`${key}="${value}"`));}};return doc;}};
  r.document.createElement=()=>createCanvas(1,1);r.select('waveform');
  r.state.composition='bar';r.state.size='standard';
  return r;
}
function workers() {
  const source=read('third_party/gif.js/gif.worker.js');
  global.Worker=class {
    constructor(){this.self={postMessage:result=>{this.output=result;}};new Function('self',source)(this.self);}
    postMessage(message,transfers){const task=structuredClone(message,{transfer:transfers});this.timer=setTimeout(()=>{if(!this.stopped){this.self.onmessage({data:task});this.onmessage({data:this.output});}},0);}
    terminate(){this.stopped=true;clearTimeout(this.timer);}
  };
}
const carrierOnly = { create: (_context, destination) => ({ input: destination }) };
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const audio=require('node-web-audio-api');
const reference=require('../tests/fixtures/waveformAudioReference');
async function raw(values,legacy=false,tap=false) {
  const context=new audio.OfflineAudioContext(1,24000,48000);
  await context.audioWorklet.addModule('js/pulse-worklet.js');
  const master=context.createGain();master.connect(context.destination);master.gain.value=0;
  if(legacy) {
    // Native audible context is already running before original graph creation.
    const running=new Proxy(context,{get(target,key){if(key==='state')return 'running';const value=target[key];return typeof value==='function'?value.bind(target):value;}});
    await reference(running,master,values,carrierOnly,audio.AudioWorkletNode);
  } else {
    const graph=WaveformAudio.create(context,master,values,audio.AudioWorkletNode);
    master.gain.cancelScheduledValues(0);master.gain.setValueAtTime(0,0);master.gain.linearRampToValueAtTime(1,.05);graph.update(values);
  }
  const batches=[];
  if(tap) {
    await context.audioWorklet.addModule('js/waveform-scope-worklet.js');
    const node=new audio.AudioWorkletNode(context,'waveform-scope');
    node.port.onmessage=event=>batches.push({extrema:event.data.extrema.slice(),pcm:event.data.pcm.slice()});
    master.connect(node);node.connect(context.destination);
  }
  const buffer=await context.startRendering();
  await new Promise(resolve=>setImmediate(resolve));
  return {pcm:buffer.getChannelData(0).slice(),batches};
}
async function main(){
  const r=runtime(),result={kind:'Native offline Web Audio/export QA; no browser, hardware audio or OS download',audio:[],png:[],gif:[]};
  let maxError=0;
  for(const frequency of [10,24,100])for(const type of [0,.5,1,1.5,2]) {
    const values={frequency,type};
    const before=await raw(values,true),after=await raw(values);
    let error=0;for(let i=0;i<before.pcm.length;i++)error=Math.max(error,Math.abs(before.pcm[i]-after.pcm[i]));
    assert.ok(error<1e-7,`Audible graph changed: ${JSON.stringify(values)} ${error}`);
    maxError=Math.max(maxError,error);result.audio.push({frequency,type,error});
  }
  console.log(`Audio: ${result.audio.length} original/shared graph PCM comparisons; max error ${maxError}`);
  // Independent worklet contexts can start at different phases in the native
  // test engine. Pulse preservation is verified by exact graph/message events
  // in Jest, and actual duty/DC/RMS here rather than claiming phase identity.
  const pulse=await raw({frequency:100,type:3});
  let pulseMean=0,pulseSquare=0;
  for(let i=12000;i<pulse.pcm.length;i++){pulseMean+=pulse.pcm[i];pulseSquare+=pulse.pcm[i]**2;}
  pulseMean/=12000;const pulseRms=Math.sqrt(pulseSquare/12000);
  assert.ok(Math.abs(pulseMean-.06)<.002);assert.ok(Math.abs(pulseRms-.1)<1e-5);
  result.pulse={mean:pulseMean,rms:pulseRms,expectedDuty:.8,independentStartupPhase:true};
  const tapValues={frequency:24,type:1.5};
  const plain=await raw(tapValues),tapped=await raw(tapValues,false,true);
  assert.deepEqual(plain.pcm,tapped.pcm);
  const extrema=scope.pcmExtrema(tapped.pcm),captured=Float32Array.from(tapped.batches.flatMap(data=>Array.from(data.extrema)));
  assert.ok(captured.length>0);assert.deepEqual(captured,extrema.subarray(0,captured.length));
  const ordered=Float32Array.from(tapped.batches.flatMap(data=>Array.from(data.pcm)));
  assert.deepEqual(ordered,tapped.pcm.subarray(0,ordered.length));
  result.tap={pairs:captured.length/2,orderedSamples:ordered.length,audibleUnchanged:true,extremaExact:true,orderedExact:true};
  console.log(`Live worklet side tap: ${captured.length/2} exact actual-PCM extrema pairs; audible samples unchanged`);
  const sheet=createCanvas(1200,720),sc=sheet.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,1200,720);
  sc.fillStyle='#000';sc.font='17px sans-serif';sc.fillText('Actual OfflineAudioContext signal · unmodulated carrier',20,28);
  const recordings=new Map();let row=0;
  for(const frequency of [10,24,100])for(const type of [0,1.5,3]) {
    const model={frequency,type};
    const recording=await scope.render(model,audio);recordings.set(`${frequency}/${type}`,recording);
    const view=scope.sweep(recording,model),first=recording.frame(view.origin);
    const replay=scope.sweepReplay(view,0,first,false);
    r.waveformScopeController={capture:()=>({frame:first,recording:replay})};
    Object.assign(r.state.values,{waveformFrequency:frequency,waveformType:type,waveformScopeRequired:true});
    const snapshot=r.captureLogoExportSnapshot(),png=await r.createPNGExportBlob(snapshot,new AbortController().signal);
    assert.equal(png.type,'image/png');const bytes=Buffer.from(await png.arrayBuffer()),image=await loadImage(bytes);
    assert.equal(image.width,1160);assert.equal(image.height,232);
    const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,image.width,image.height).data;
    let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])ink++;
    assert.ok(ink>0);
    const name=`frequency-${frequency}-shape-${type}`;
    fs.writeFileSync(path.join(out,`${name}.png`),bytes);
    {
      fs.writeFileSync(path.join(out,`${name}.svg`),snapshot.svgSource);
      const column=type===0?0:type===1.5?1:2,y=55+Math.floor(row/3)*160;
      sc.fillStyle='#000';sc.font='14px sans-serif';sc.fillText(`${WaveformAudio.frequency(frequency).toFixed(2)} Hz · shape ${type} · ${recording.seconds.toFixed(3)} s`,20+column*395,y);
      sc.drawImage(image,10+column*395,y+5,386,77);row++;
    }
    result.png.push({frequency,type,seconds:recording.seconds,width:image.width,height:image.height,ink});
  }
  fs.writeFileSync(path.join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  workers();
  for(const frequency of [10,24,100])for(const type of [0,3]) {
    const recording=recordings.get(`${frequency}/${type}`);
    const model={frequency,type};
    const view=scope.sweep(recording,model),first=recording.frame(view.origin);
    const replay=scope.sweepReplay(view,0,first,false);
    r.waveformScopeController={capture:()=>({frame:first,recording:replay})};
    const captured=r.captureLogoExportSnapshot(),snapshot={...captured,dimensions:{width:290,height:58,scale:1}};
    const plan=getLoopingGifFramePlan('waveform',snapshot.values);
    assert.ok(Math.abs(plan.periodSeconds-1/.3)<1e-10);
    const renderer=r.createCapturedGifRenderer(snapshot,plan),expectedHashes=[];
    const encoded=await encode({...snapshot.dimensions,frameCount:plan.frameCount,periodSeconds:plan.periodSeconds,
      foreground:snapshot.rgb,workerScript:'trusted-local-adapter',signal:new AbortController().signal,
      renderFrame:async(index,progress)=>{
        const frame=renderer.renderFrame(index,progress),palette=createPalette(snapshot.rgb);
        const expected={width:frame.width,height:frame.height,data:new Uint8ClampedArray(frame.data)};
        await preparePixels(expected,palette);
        for(let i=0;i<expected.data.length;i+=4)if(expected.data[i]===palette.key[0]&&expected.data[i+1]===palette.key[1]&&expected.data[i+2]===palette.key[2])expected.data.fill(0,i,i+4);
        expectedHashes[index]=hash(expected.data);
        return {width:frame.width,height:frame.height,data:new Uint8ClampedArray(frame.data)};
      }});
    const bytes=Buffer.from(await encoded.blob.arrayBuffer());fs.writeFileSync(path.join(out,`frequency-${frequency}-shape-${type}.gif`),bytes);
    const gif=parseGif(bytes);let frames=0;
    for(const frame of decodeFrames(gif)){assert.equal(hash(frame.rgba),expectedHashes[frames],`Decoded frame ${frames} changed pixels`);frames++;}
    assert.equal(frames,plan.frameCount);result.gif.push({frequency,type,frames,uniqueFrames:new Set(expectedHashes).size,period:plan.periodSeconds,bytes:bytes.length});
    renderer.release();console.log(`GIF frequency ${frequency} shape ${type}: ${frames} decoded frames`);
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log(`PASS: ${result.audio.length} audio parity cases, exact live tap, ${result.png.length} PNGs, ${result.gif.length} GIFs, ${result.gif.reduce((n,g)=>n+g.frames,0)} decoded frames. ${out}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
