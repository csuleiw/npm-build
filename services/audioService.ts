
// Use a singleton to manage the audio context
let audioContext: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmIntervalId: number | null = null;

// Scheduler state
let nextNoteTime = 0;
let currentNoteIndex = 0;

// Happy C Major Pentatonic Loop (C4, D4, E4, G4, A4)
// Up and down pattern
const melody = [
  261.63, // C4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  440.00, // A4
  392.00, // G4
  329.63  // E4
];

const NOTE_DURATION = 0.25; // Seconds per note (fast & bubbly)

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

const scheduleNote = (freq: number, time: number, ctx: AudioContext) => {
  if (!bgmMasterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine'; // Pure tone, like a digital marimba
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(bgmMasterGain);

  // Percussive Envelope (Pluck sound)
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.15, time + 0.01); // Quick attack
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // Short decay

  osc.start(time);
  osc.stop(time + 0.35);
};

const scheduler = () => {
  const ctx = getAudioContext();
  const lookahead = 0.1; // 100ms lookahead

  // Schedule notes that fall within the lookahead window
  while (nextNoteTime < ctx.currentTime + lookahead) {
    const freq = melody[currentNoteIndex % melody.length];
    scheduleNote(freq, nextNoteTime, ctx);
    
    nextNoteTime += NOTE_DURATION;
    currentNoteIndex++;
  }
};

export const startBGM = async () => {
  if (bgmIntervalId !== null) return; // Already playing

  try {
    const ctx = await ensureContextResumed();
    
    // Master Gain for BGM - Allows us to mute everything easily
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.value = 0; 
    bgmMasterGain.connect(ctx.destination);

    // Fade in master volume
    bgmMasterGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5); 

    // Reset scheduler
    nextNoteTime = ctx.currentTime + 0.1;
    currentNoteIndex = 0;

    // Start scheduler loop
    bgmIntervalId = window.setInterval(scheduler, 25);

  } catch (e) {
    console.error('Failed to start BGM', e);
  }
};

export const stopBGM = () => {
   // Stop scheduler
   if (bgmIntervalId !== null) {
     window.clearInterval(bgmIntervalId);
     bgmIntervalId = null;
   }

   // Fade out and disconnect audio
   if (bgmMasterGain && audioContext) {
     const ctx = audioContext;
     try {
       bgmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
       bgmMasterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
     } catch (e) {
       // Ignore context state errors
     }

     setTimeout(() => {
       if (bgmMasterGain) {
          try { bgmMasterGain.disconnect(); } catch(e){}
          bgmMasterGain = null;
       }
     }, 250);
   }
};

export const playClickSound = async () => {
  try {
    const ctx = await ensureContextResumed();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // "Pop" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

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

    // "Thud" sound
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);

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
