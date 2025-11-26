
// Use a singleton to manage the audio context
let audioContext: AudioContext | null = null;
let bgmSourceNodes: AudioScheduledSourceNode[] = [];
let bgmMasterGain: GainNode | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Helper to resume context if suspended (browser autoplay policy)
const ensureContextResumed = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
};

export const startBGM = async () => {
  if (bgmSourceNodes.length > 0) return; // Already playing

  try {
    const ctx = await ensureContextResumed();
    
    // Master Gain for BGM
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.value = 0; // Start silent for fade in
    bgmMasterGain.connect(ctx.destination);

    // Fade in
    bgmMasterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2); // Keep volume low (6%)

    // Drone 1: Root (C3) - Foundation
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 130.81; 
    osc1.connect(bgmMasterGain);
    
    // Drone 2: Fifth (G3) - Stability, slightly detuned for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 196.00;
    osc2.detune.value = 4; 
    osc2.connect(bgmMasterGain);

    // Drone 3: Major Third (E4) - Warmth, played by Triangle for texture
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = 329.63;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.1; // Much quieter
    osc3.connect(osc3Gain);
    osc3Gain.connect(bgmMasterGain);

    osc1.start();
    osc2.start();
    osc3.start();

    bgmSourceNodes = [osc1, osc2, osc3];
  } catch (e) {
    console.error('Failed to start BGM', e);
  }
};

export const stopBGM = () => {
   if (!bgmMasterGain) return;
   
   const ctx = getAudioContext();
   
   // Fade out to avoid clicks
   try {
     bgmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
     bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, ctx.currentTime);
     bgmMasterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
   } catch (e) {
     // Ignore errors if context is weird
   }

   // Stop nodes after fade out
   setTimeout(() => {
     bgmSourceNodes.forEach(n => {
       try { n.stop(); } catch(e){}
       try { n.disconnect(); } catch(e){}
     });
     bgmSourceNodes = [];
     
     if (bgmMasterGain) {
        try { bgmMasterGain.disconnect(); } catch(e){}
        bgmMasterGain = null;
     }
   }, 500);
};

export const playClickSound = async () => {
  try {
    const ctx = await ensureContextResumed();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // "Pop" sound: Sine wave with quick frequency slide
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    // Envelope: sharp attack, quick decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export const playErrorSound = async () => {
  try {
    const ctx = await ensureContextResumed();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // "Thud" sound: Triangle wave, low pitch
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);

    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export const playWinSound = async () => {
  try {
    const ctx = await ensureContextResumed();
    
    // Play a C Major Arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.15;
    const stagger = 0.08;

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const startTime = ctx.currentTime + (i * stagger);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.1);
    });

  } catch (e) {
    console.error('Audio play failed', e);
  }
};
