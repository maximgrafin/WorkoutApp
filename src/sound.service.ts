import { Injectable, signal, effect } from '@angular/core';

const LOCAL_STORAGE_KEY_MUTE_STATUS = 'workout-timer-mute-status';

/** Reads the mute status from localStorage, with a fallback. */
function getInitialMuteStatus(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false; // Default if localStorage is not available
  }
  const savedValue = localStorage.getItem(LOCAL_STORAGE_KEY_MUTE_STATUS);
  // "true" string becomes true, anything else (null, "false") becomes false.
  return savedValue === 'true';
}

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  public readonly isMuted = signal(getInitialMuteStatus());

  constructor() {
    effect(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_KEY_MUTE_STATUS, this.isMuted().toString());
      }
    });
  }

  public toggleMute(): void {
    this.isMuted.update(v => !v);
    this.unlockAudio(); // Ensure context is active if unmuting
  }

  private initializeAudioContext(): void {
    if (!this.audioContext && typeof window !== 'undefined') {
      // For cross-browser compatibility
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
    }
  }

  /**
   * Unlocks the AudioContext. Must be called from a user-initiated event
   * (like a click) to comply with browser autoplay policies.
   */
  public unlockAudio(): void {
    this.initializeAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(err => console.error("AudioContext resume failed", err));
    }
  }

  private playTone({
    duration, // in ms
    frequency,
    type,
    startTime,
    rampDown = true,
  }: {
    duration: number;
    frequency: number;
    type: OscillatorType;
    startTime: number;
    rampDown?: boolean;
  }): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(1, startTime);
      if (rampDown) {
        // Use a gentle exponential ramp down to avoid clicks
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration / 1000);
      }

      oscillator.start(startTime);
      oscillator.stop(startTime + duration / 1000);
    } catch (error) {
      console.error("Error playing tone:", error);
    }
  }


  private playBeep(
    duration: number,
    frequency: number,
    type: OscillatorType
  ): void {
    if (this.isMuted()) {
      return;
    }
    this.unlockAudio(); // Ensure context is active before playing
    if (!this.audioContext) {
      console.warn('AudioContext not available.');
      return;
    }

    this.playTone({
      duration,
      frequency,
      type,
      startTime: this.audioContext.currentTime,
      rampDown: true,
    });
  }

  /** Plays a short, sharp countdown beep. */
  public playShortBeep(): void {
    // A single, clear, high-pitched tick for countdowns.
    this.playBeep(150, 880, 'sine');
  }

  /** Plays a musical, ascending tone for the start of an exercise. */
  public playStartBeep(): void {
    if (this.isMuted()) return;
    this.unlockAudio();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 500; // ms
    const type = 'triangle';
    const rampDown = true;

    // An ascending major chord arpeggio (A Major) to signal "Go!"
    // A4
    this.playTone({ startTime: now, duration, frequency: 440.00, type,rampDown});
    // C#5
    this.playTone({ startTime: now + (duration / 3_000), duration, frequency: 554.37, type,rampDown});
    // E5
    this.playTone({ startTime: now + 2 * (duration / 3_000), duration, frequency: 659.26, type, rampDown });
  }

  /** Plays a musical, descending tone for the end of an exercise. */
  public playEndBeep(): void {
    if (this.isMuted()) return;
    this.unlockAudio();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 500; // ms
    const type = 'triangle';
    const rampDown = true;

    // A descending major chord arpeggio (A Major) to signal completion.
    // E5
    this.playTone({ startTime: now, duration, frequency: 659.26, type, rampDown});
    // C#5
    this.playTone({ startTime: now + (duration / 3_000), duration, frequency: 554.37, type, rampDown});
    // A4
    this.playTone({ startTime: now + 2 * (duration / 3_000), duration, frequency: 440.00, type, rampDown});
  }

  /** Plays a short, high-pitched beep for pausing the timer. */
  public playPauseBeep(): void {
    this.playBeep(250, 660, 'sine');
  }

  /** Plays a short, low-pitched beep for resuming the timer. */
  public playResumeBeep(): void {
    this.playBeep(250, 330, 'sine');
  }
}
