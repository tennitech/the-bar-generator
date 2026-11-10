// Optional cloud/offline raster and codec adapters; no browser behavior is simulated.
const assert = require('node:assert/strict');
const { createCanvas, Image: NativeImage, Path2D } = require('@napi-rs/canvas');
const { createRuntime, read } = require('../../tests/helpers/exportCompositionRuntime');
class XMLDocument {
  constructor(source) { this.source = source; this.documentElement = { setAttribute: (key, value) => {
    this.source = this.source.replace(/<svg\b[^>]*>/, root => root.replace(new RegExp(`${key}="[^"]*"`), `${key}="${value}"`));
  } }; }
  querySelector() { return null; }
}
function nativeRuntime() {
  const urls = new Map(); let serial = 0;
  class Image extends NativeImage {
    set src(value) {
      if (!value) return;
      this.pending = urls.get(value).arrayBuffer().then(bytes => { super.src = Buffer.from(bytes); });
    }
    async decode() { await this.pending; await super.decode(); }
  }
  const r = createRuntime({ Path2D, Image,
    DOMParser: class { parseFromString(source) { return new XMLDocument(source); } },
    XMLSerializer: class { serializeToString(xml) { return xml.source; } },
    URL: { createObjectURL: blob => { const url = `local:${++serial}`; urls.set(url, blob); return url; }, revokeObjectURL: url => urls.delete(url) } });
  r.document.createElement = name => { assert.equal(name, 'canvas'); return createCanvas(1, 1); };
  r.activeUrls = urls;
  return r;
}
function installCodecWorkers() {
  const source = read('third_party/gif.js/gif.worker.js');
  global.Worker = class {
    constructor() {
      this.self = { postMessage: result => { this.output = result; } };
      // Evaluate only the repository's trusted, unchanged codec in the local
      // realm. A VM global proxy adds substantial per-pixel overhead.
      new Function('self', source)(this.self);
    }
    postMessage(message, transfers) {
      const task = structuredClone(message, { transfer: transfers });
      this.timer = setTimeout(() => { if (!this.stopped) { this.self.onmessage({ data: task }); this.onmessage({ data: this.output }); } }, 0);
    }
    terminate() { this.stopped = true; clearTimeout(this.timer); }
  };
}
module.exports = { nativeRuntime, installCodecWorkers };
