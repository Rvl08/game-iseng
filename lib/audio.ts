// Audio Manager - Synthesized sound effects using Web Audio API
// No external audio files needed!

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private initialized = false;
  private musicPlaying = false;
  private musicScheduler: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      this.masterGain.connect(this.audioContext.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      
      this.masterGain.gain.value = 0.7;
      this.musicGain.gain.value = 0.3;
      this.sfxGain.gain.value = 0.8;
      
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  playSound(type: string): void {
    if (!this.initialized || !this.audioContext || !this.sfxGain) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    switch (type) {
      case 'jump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      
      case 'attack': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        
        // Add noise burst
        this.createNoise(0.08);
        break;
      }
      
      case 'hit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      
      case 'death': {
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.type = 'square';
          osc.frequency.setValueAtTime(200 - i * 30, now + i * 0.1);
          osc.frequency.exponentialRampToValueAtTime(50, now + i * 0.1 + 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.15);
        }
        break;
      }
      
      case 'collect': {
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.15);
        });
        break;
      }
      
      case 'blockBreak': {
        this.createNoise(0.1);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      
      case 'blockPlace': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      
      case 'zoneWarning': {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.type = 'square';
          osc.frequency.value = 440;
          gain.gain.setValueAtTime(0.2, now + i * 0.3);
          gain.gain.setValueAtTime(0, now + i * 0.3 + 0.15);
          osc.start(now + i * 0.3);
          osc.stop(now + i * 0.3 + 0.15);
        }
        break;
      }
      
      case 'countdown': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      
      case 'gameStart': {
        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
        break;
      }
      
      case 'victory': {
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, now + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.25);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.25);
        });
        break;
      }
      
      case 'menuSelect': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      
      case 'menuConfirm': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      
      case 'footstep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random() * 50, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
    }
  }
  
  private createNoise(duration: number): GainNode | null {
    if (!this.audioContext || !this.sfxGain) return null;
    
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(this.sfxGain);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    noise.start();
    
    return gain;
  }
  
  startMusic(type: string = 'battle'): void {
    if (!this.initialized || this.musicPlaying || !this.audioContext || !this.musicGain) return;
    
    this.musicPlaying = true;
    const ctx = this.audioContext;
    
    const playNote = (freq: number, time: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.setValueAtTime(0.1, time + duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const bassNotes = [65, 73, 82, 73]; // C2, D2, E2, D2
    const melodyNotes = [
      [262, 330, 392],
      [294, 370, 440],
      [330, 415, 494],
      [294, 370, 440],
    ];
    
    let beatIndex = 0;
    const bpm = 120;
    const beatDuration = 60 / bpm;
    
    const scheduleAhead = 0.1;
    let nextBeatTime = ctx.currentTime;
    
    const scheduler = () => {
      if (!this.musicPlaying) return;
      
      while (nextBeatTime < ctx.currentTime + scheduleAhead) {
        const currentBass = bassNotes[beatIndex % bassNotes.length];
        const currentChord = melodyNotes[Math.floor(beatIndex / 2) % melodyNotes.length];
        
        playNote(currentBass, nextBeatTime, beatDuration * 0.9);
        
        if (beatIndex % 2 === 0) {
          currentChord.forEach((note, i) => {
            playNote(note, nextBeatTime + i * (beatDuration / 4), beatDuration / 4);
          });
        }
        
        beatIndex++;
        nextBeatTime += beatDuration;
      }
      
      this.musicScheduler = setTimeout(scheduler, 25);
    };
    
    scheduler();
  }
  
  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicScheduler) {
      clearTimeout(this.musicScheduler);
    }
  }
  
  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }
  
  setMusicVolume(value: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = value;
    }
  }
  
  setSfxVolume(value: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = value;
    }
  }
}

export const audioManager = new AudioManager();
export default AudioManager;
