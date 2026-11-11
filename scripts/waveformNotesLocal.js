/* Offline native SVG/PNG/GIF verification; never launches a browser.
 * Requires test-only @napi-rs/canvas and node-web-audio-api (not an application dependency).
 * NODE_PATH=/tmp/rpi-lfo-qa/node_modules node scripts/waveformNotesLocal.js [out]
 */
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {createCanvas,Image:NativeImage,Path2D,loadImage}=require('@napi-rs/canvas');
const {createRuntime,read}=require('../tests/helpers/exportCompositionRuntime');
const {encode,preparePixels,createPalette}=require('../js/utils/transparentGif');
const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const {getLoopingGifFramePlan}=require('../js/utils/loopingGif');
const {parseGif,decodeFrames}=require('../tests/helpers/gifDecoder');
const out=path.resolve(process.argv[2]||'/tmp/rpi-waveform-notes-evidence');
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
global.WaveformNotes=require('../js/utils/waveformNotes');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const audio=require('node-web-audio-api');
async function main() {
  const r=runtime(),result={kind:'Native offline Web Audio/export QA; no browser or hardware claims',audio:[],png:[],gif:[]};
  let maxSineEndpointError=0,maxAnyEndpointError=0;
  const start=performance.now();
  for(const descriptor of WaveformNotes.NOTES)for(const type of [0,1,2,3]) {
    const model={note:descriptor.midi,type},recording=await scope.render(model,audio);
    const view=scope.sweep(recording,model),frame=recording.frame(view.origin+.000123);
    assert.ok(Math.abs(frame.seconds*descriptor.frequencyHz-descriptor.cycles)<1e-12);
    assert.ok(Math.abs(frame.traceDurationSeconds-frame.seconds)<1e-12);
    assert.ok(frame.trace.every(Number.isFinite));
    const rising=frame.trace.slice(1).filter((x,i)=>frame.trace[i]<=0 && x>0).length;
    assert.equal(rising,descriptor.cycles,`Rendered cycle count ${descriptor.name} shape ${type}`);
    const endpointError=Math.abs(frame.trace[0]-frame.trace.at(-1));
    maxAnyEndpointError=Math.max(maxAnyEndpointError,endpointError);
    if(type===0)maxSineEndpointError=Math.max(maxSineEndpointError,endpointError);
    result.audio.push({note:descriptor.name,type,cycles:descriptor.cycles,seconds:frame.seconds,risingCrossings:rising,endpointError});
  }
  result.validationMs=performance.now()-start;result.maxSineEndpointError=maxSineEndpointError;result.maxAnyEndpointError=maxAnyEndpointError;
  assert.ok(maxSineEndpointError<.001,'Sine interpolation exceeded 1% of carrier gain');
  console.log(`244 native note/shape windows: sine endpoint error ${maxSineEndpointError}, all shapes ${maxAnyEndpointError}`);
  // Report actual warm-cache improvement, without claiming a portable benchmark.
  const c=scope.createController({environment:audio}),elapsed=[];
  for(const model of [{note:24,type:0},{note:84,type:3},{note:24,type:0}]) {
    const t=performance.now();c.configure(model,true);await c.ready();elapsed.push(performance.now()-t);
  }
  result.cacheBenchmarkMs={cold:elapsed[0],other:elapsed[1],warm:elapsed[2]};c.dispose();
  const sheet=createCanvas(1200,720),sc=sheet.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,1200,720);
  sc.fillStyle='#000';sc.font='17px sans-serif';sc.fillText('Actual synthesized PCM · note-based whole-cycle windows',20,28);
  const recordings=new Map();let row=0;
  for(const note of [24,49,84])for(const type of [0,1.5,3]) {
    const model={note,type};
    const recording=await scope.render(model,audio);recordings.set(`${note}/${type}`,recording);
    const view=scope.sweep(recording,model),first=recording.frame(view.origin);
    const replay=scope.sweepReplay(view,0,first,false);
    r.waveformScopeController={capture:()=>({frame:first,recording:replay})};
    Object.assign(r.state.values,{waveformNote:note,waveformType:type,waveformScopeRequired:true});
    const snapshot=r.captureLogoExportSnapshot(),png=await r.createPNGExportBlob(snapshot,new AbortController().signal);
    assert.equal(png.type,'image/png');const bytes=Buffer.from(await png.arrayBuffer()),image=await loadImage(bytes);
    assert.equal(image.width,1160);assert.equal(image.height,232);
    const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,image.width,image.height).data;
    let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])ink++;
    assert.ok(ink>0);
    const name=`note-${note}-shape-${type}`;
    fs.writeFileSync(path.join(out,`${name}.png`),bytes);
    {
      fs.writeFileSync(path.join(out,`${name}.svg`),snapshot.svgSource);
      const column=type===0?0:type===1.5?1:2,y=55+Math.floor(row/3)*160;
      sc.fillStyle='#000';sc.font='14px sans-serif';sc.fillText(`${WaveformNotes.get(note).name} · ${WaveformNotes.get(note).cycles} cycles · ${(recording.seconds*1000).toFixed(3)} ms · type ${type}`,20+column*395,y);
      sc.drawImage(image,10+column*395,y+5,386,77);row++;
    }
    result.png.push({note,type,seconds:recording.seconds,width:image.width,height:image.height,ink});
  }
  fs.writeFileSync(path.join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  workers();
  for(const note of [24,49,84])for(const type of [0,3]) {
    const recording=recordings.get(`${note}/${type}`);
    const model={note,type};
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
    const bytes=Buffer.from(await encoded.blob.arrayBuffer());fs.writeFileSync(path.join(out,`note-${note}-shape-${type}.gif`),bytes);
    const gif=parseGif(bytes);let frames=0;
    for(const frame of decodeFrames(gif)){assert.equal(hash(frame.rgba),expectedHashes[frames],`Decoded frame ${frames} changed pixels`);frames++;}
    assert.equal(frames,plan.frameCount);result.gif.push({note,type,frames,uniqueFrames:new Set(expectedHashes).size,period:plan.periodSeconds,bytes:bytes.length});
    renderer.release();console.log(`GIF note ${note} shape ${type}: ${frames} decoded frames`);
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log(`PASS: ${result.audio.length} full-period audio windows, ${result.png.length} PNGs, ${result.gif.length} GIFs, ${result.gif.reduce((n,g)=>n+g.frames,0)} decoded frames. ${out}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
