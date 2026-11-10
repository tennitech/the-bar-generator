// Frozen pre-refactor audible graph from main 44f8992. Test-only reference.
// Keep this independent of waveformAudio.js to detect audible regressions.
module.exports = async function reference(audioContext, gainNode, values, WaveformLfo, AudioWorkletNode) {
  const window = { WaveformLfo }, console = { log() {}, error() {} };
  const waveformFrequencySlider = { value: values.frequency }, waveformTypeSlider = { value: values.type };
  const getWaveformLfoSettings = () => values.lfo;
  const waveformLfoFrame = {}, oscillators = {}, oscillatorGains = {};
  let waveformLfoVoice, pulseWorkletNode, isAudioPlaying = false;
  const currentShader = 4;
async function startWaveformAudio() {
  // Resume audio context if suspended (required by browsers)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Get current parameters
  const frequency = parseInt(waveformFrequencySlider.value);

  // Map frequency from 10-100 to C1-C5 (32.70Hz to 523.25Hz)
  const minFreq = 32.70; // C1
  const maxFreq = 523.25; // C5
  const normalizedFreq = (frequency - 10) / 90; // Normalize 10-100 to 0-1
  const mappedFrequency = minFreq + (normalizedFreq * (maxFreq - minFreq));

  waveformLfoVoice = window.WaveformLfo.create(audioContext, gainNode, getWaveformLfoSettings(), waveformLfoFrame);

  // Create basic oscillators for smooth morphing
  const waveTypes = ['sine', 'sawtooth', 'square'];

  waveTypes.forEach(type => {
    // Create oscillator
    oscillators[type] = audioContext.createOscillator();
    oscillators[type].type = type;
    oscillators[type].frequency.setValueAtTime(mappedFrequency, audioContext.currentTime);

    // Create individual gain node for each oscillator
    oscillatorGains[type] = audioContext.createGain();
    oscillatorGains[type].gain.setValueAtTime(0, audioContext.currentTime);

    // Connect oscillator -> gain -> master gain -> destination
    oscillators[type].connect(oscillatorGains[type]);
    oscillatorGains[type].connect(waveformLfoVoice.input);

    // Start oscillator
    oscillators[type].start();
  });

  // Create custom pulse wave using AudioWorklet
  try {
    pulseWorkletNode = new AudioWorkletNode(audioContext, 'pulse-processor');

    // Set initial frequency
    pulseWorkletNode.port.postMessage({
      type: 'frequency',
      value: mappedFrequency
    });

    // Set initial pulse width (20% to match visual)
    pulseWorkletNode.port.postMessage({
      type: 'pulseWidth',
      value: 0.2
    });

    oscillators.pulse = pulseWorkletNode;
    oscillatorGains.pulse = audioContext.createGain();
    oscillatorGains.pulse.gain.setValueAtTime(0, audioContext.currentTime);

    oscillators.pulse.connect(oscillatorGains.pulse);
    oscillatorGains.pulse.connect(waveformLfoVoice.input);

  } catch (error) {
    console.error('Failed to create pulse worklet:', error);
    // Fallback: create a square wave oscillator
    oscillators.pulse = audioContext.createOscillator();
    oscillators.pulse.type = 'square';
    oscillators.pulse.frequency.setValueAtTime(mappedFrequency, audioContext.currentTime);

    oscillatorGains.pulse = audioContext.createGain();
    oscillatorGains.pulse.gain.setValueAtTime(0, audioContext.currentTime);

    oscillators.pulse.connect(oscillatorGains.pulse);
    oscillatorGains.pulse.connect(waveformLfoVoice.input);
    oscillators.pulse.start();
  }

  // Clear any previously scheduled values to fix play/pause bug
  gainNode.gain.cancelScheduledValues(audioContext.currentTime);

  // Set master gain
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 0.05);

  isAudioPlaying = true;

  // Set initial waveform mix
  updateAudioParameters();

  console.log('Audio started - Frequency:', mappedFrequency, 'Type: morphing oscillators with pulse wave');
}

function updateAudioParameters() {
  if (!isAudioPlaying || currentShader !== 4) return;

  try {
    const frequency = parseInt(waveformFrequencySlider.value);
    const waveType = parseFloat(waveformTypeSlider.value);

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
          osc.frequency.exponentialRampToValueAtTime(mappedFrequency, audioContext.currentTime + 0.1);
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
    const time = audioContext.currentTime;

    // Use setTargetAtTime which cleanly and safely transitions from the current computed value
    if (oscillatorGains.sine) oscillatorGains.sine.gain.setTargetAtTime(sineGain, time, rampTime / 3);
    if (oscillatorGains.sawtooth) oscillatorGains.sawtooth.gain.setTargetAtTime(sawGain, time, rampTime / 3);
    if (oscillatorGains.square) oscillatorGains.square.gain.setTargetAtTime(squareGain, time, rampTime / 3);
    if (oscillatorGains.pulse) oscillatorGains.pulse.gain.setTargetAtTime(pulseGain, time, rampTime / 3);

  } catch (error) {
    console.error('Failed to update audio parameters:', error);
  }
}

  await startWaveformAudio();
  return { update(next) { waveformFrequencySlider.value=next.frequency; waveformTypeSlider.value=next.type; updateAudioParameters(); },
    lfo:waveformLfoVoice, pulseWorkletNode, oscillators, oscillatorGains };
};
