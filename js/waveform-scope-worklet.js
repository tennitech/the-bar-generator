// Silent side tap: observe actual post-gain audio without feeding it back into
// the audible path. Preserve min/max of each eight real PCM samples.
class WaveformScopeProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.batch = new Float32Array(512); this.index = 0;
    this.count = 0; this.min = Infinity; this.max = -Infinity;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) for (let i = 0; i < channel.length; i++) {
      this.min = Math.min(this.min, channel[i]); this.max = Math.max(this.max, channel[i]);
      if (++this.count === 8) {
        this.batch[this.index++] = this.min; this.batch[this.index++] = this.max;
        this.count = 0; this.min = Infinity; this.max = -Infinity;
        if (this.index === this.batch.length) {
          this.port.postMessage(this.batch, [this.batch.buffer]);
          this.batch = new Float32Array(512); this.index = 0;
        }
      }
    }
    // Outputs remain zero. This branch can never duplicate the audible signal.
    return true;
  }
}
registerProcessor('waveform-scope', WaveformScopeProcessor);
