/* The actual Waveform audio graph, shared by audible and offline rendering. */
(function(scope) {
  const frequency = value => 32.70 + (Number(value) - 10) / 90 * (523.25 - 32.70);
  function create(context, destination, values, WorkletNode = scope.AudioWorkletNode) {
    const oscillators = {}, oscillatorGains = {};
    let pulseWorkletNode = null;
    const mappedFrequency = frequency(values.frequency);
    // Create basic oscillators for smooth morphing
    const waveTypes = ['sine', 'sawtooth', 'square'];

    waveTypes.forEach(type => {
      // Create oscillator
      oscillators[type] = context.createOscillator();
      oscillators[type].type = type;
      oscillators[type].frequency.setValueAtTime(mappedFrequency, context.currentTime);

      // Create individual gain node for each oscillator
      oscillatorGains[type] = context.createGain();
      oscillatorGains[type].gain.setValueAtTime(0, context.currentTime);

      // Connect oscillator -> gain -> master gain -> destination
      oscillators[type].connect(oscillatorGains[type]);
      oscillatorGains[type].connect(destination);

      // Start oscillator
      oscillators[type].start();
    });

    // Create custom pulse wave using AudioWorklet
    try {
      pulseWorkletNode = new WorkletNode(context, 'pulse-processor');

      // Set initial frequency
      pulseWorkletNode.port.postMessage({
        type: 'frequency',
        value: mappedFrequency
      });

      // Initial width; update() applies the existing carrier morph duty.
      pulseWorkletNode.port.postMessage({
        type: 'pulseWidth',
        value: 0.2
      });

      oscillators.pulse = pulseWorkletNode;
      oscillatorGains.pulse = context.createGain();
      oscillatorGains.pulse.gain.setValueAtTime(0, context.currentTime);

      oscillators.pulse.connect(oscillatorGains.pulse);
      oscillatorGains.pulse.connect(destination);

    } catch (error) {
      console.error('Failed to create pulse worklet:', error);
      // Fallback: create a square wave oscillator
      oscillators.pulse = context.createOscillator();
      oscillators.pulse.type = 'square';
      oscillators.pulse.frequency.setValueAtTime(mappedFrequency, context.currentTime);

      oscillatorGains.pulse = context.createGain();
      oscillatorGains.pulse.gain.setValueAtTime(0, context.currentTime);

      oscillators.pulse.connect(oscillatorGains.pulse);
      oscillatorGains.pulse.connect(destination);
      oscillators.pulse.start();
    }


    function update(values) {
      const frequency = Number(values.frequency), waveType = Number(values.type);
      // Map frequency from 10-100 to C1-C5 (32.70Hz to 523.25Hz)
      const minFreq = 32.70; // C1
      const maxFreq = 523.25; // C5
      const normalizedFreq = (frequency - 10) / 90; // Normalize 10-100 to 0-1
      const mappedFrequency = minFreq + (normalizedFreq * (maxFreq - minFreq));

      // Update frequency on all active oscillators
      Object.values(oscillators).forEach((osc, index) => {
        if (osc) {
          const oscType = Object.keys(oscillators)[index];
          if (oscType === 'pulse' && pulseWorkletNode) {
            // Send frequency update to pulse worklet
            pulseWorkletNode.port.postMessage({
              type: 'frequency',
              value: mappedFrequency
            });
          } else if (osc.frequency) {
            osc.frequency.exponentialRampToValueAtTime(mappedFrequency, context.currentTime + 0.1);
          }
        }
      });

      // Calculate mix ratios for smooth morphing with proper pulse wave integration
      let sineGain = 0;
      let sawGain = 0;
      let squareGain = 0;
      let pulseGain = 0;

      // Use smooth crossfading between waveforms
      if (waveType <= 1.0) {
        // Sine to sawtooth (0.0 to 1.0)
        sineGain = Math.max(0, 1.0 - waveType);
        sawGain = Math.min(1.0, waveType);
      } else if (waveType <= 2.0) {
        // Sawtooth to square (1.0 to 2.0)
        const t = waveType - 1.0;
        sawGain = Math.max(0, 1.0 - t);
        squareGain = Math.min(1.0, t);
      } else {
        // Square to pulse (2.0 to 3.0)
        const t = waveType - 2.0;
        squareGain = Math.max(0, 1.0 - t);
        pulseGain = Math.min(1.0, t);

        // Update pulse width based on slider position
        // Map from 20% to 80% duty cycle as slider moves from 2.0 to 3.0
        const pulseWidth = 0.2 + t * 0.6;

        // Send pulse width update to worklet
        if (pulseWorkletNode) {
          pulseWorkletNode.port.postMessage({
            type: 'pulseWidth',
            value: pulseWidth
          });
        }
      }

      // Normalize gains to prevent volume changes
      const totalGain = sineGain + sawGain + squareGain + pulseGain;
      if (totalGain > 0) {
        sineGain /= totalGain;
        sawGain /= totalGain;
        squareGain /= totalGain;
        pulseGain /= totalGain;
      }

      // Apply master volume scaling
      const masterVolume = 0.1;
      sineGain *= masterVolume;
      sawGain *= masterVolume;
      squareGain *= masterVolume;
      pulseGain *= masterVolume;

      // Use smooth ramp time for gentle transitions
      const rampTime = 0.05;
      const time = context.currentTime;

      // Use setTargetAtTime which cleanly and safely transitions from the current computed value
      if (oscillatorGains.sine) oscillatorGains.sine.gain.setTargetAtTime(sineGain, time, rampTime / 3);
      if (oscillatorGains.sawtooth) oscillatorGains.sawtooth.gain.setTargetAtTime(sawGain, time, rampTime / 3);
      if (oscillatorGains.square) oscillatorGains.square.gain.setTargetAtTime(squareGain, time, rampTime / 3);
      if (oscillatorGains.pulse) oscillatorGains.pulse.gain.setTargetAtTime(pulseGain, time, rampTime / 3);

    }
    return { oscillators, oscillatorGains, pulseWorkletNode, update };
  }
  const api = { create, frequency };
  scope.WaveformAudio = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
