export class SoundManager {
  private audioContext?: AudioContext;
  private masterGain?: GainNode;

  private spinNoiseSource?: AudioBufferSourceNode;
  private spinNoiseGain?: GainNode;

  private enabled = true;

  /*
   * הדפדפן מאפשר להתחיל AudioContext
   * רק לאחר פעולה של המשתמש, כמו לחיצה.
   */
  private ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext =
        new AudioContext();

      this.masterGain =
        this.audioContext.createGain();

      this.masterGain.gain.value = 0.45;

      this.masterGain.connect(
        this.audioContext.destination,
      );
    }

    if (
      this.audioContext.state ===
      "suspended"
    ) {
      void this.audioContext.resume();
    }

    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.stopSpinLoop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  playButtonClick(): void {
    if (!this.enabled) {
      return;
    }

    const context =
      this.ensureAudioContext();

    this.playTone({
      context,
      frequency: 420,
      endFrequency: 310,
      duration: 0.08,
      volume: 0.12,
      type: "sine",
    });
  }

  playSpinStart(): void {
    if (!this.enabled) {
      return;
    }

    const context =
      this.ensureAudioContext();

    /*
     * צליל עולה בתחילת הסיבוב.
     */
    this.playTone({
      context,
      frequency: 180,
      endFrequency: 520,
      duration: 0.22,
      volume: 0.12,
      type: "sawtooth",
    });

    this.startSpinLoop();
  }

  startSpinLoop(): void {
    if (
      !this.enabled ||
      this.spinNoiseSource
    ) {
      return;
    }

    const context =
      this.ensureAudioContext();

    const bufferLength =
      context.sampleRate * 2;

    const buffer =
      context.createBuffer(
        1,
        bufferLength,
        context.sampleRate,
      );

    const channel =
      buffer.getChannelData(0);

    for (
      let index = 0;
      index < bufferLength;
      index++
    ) {
      channel[index] =
        Math.random() * 2 - 1;
    }

    const source =
      context.createBufferSource();

    source.buffer = buffer;
    source.loop = true;

    const filter =
      context.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.value = 650;
    filter.Q.value = 0.7;

    const gain =
      context.createGain();

    gain.gain.setValueAtTime(
      0,
      context.currentTime,
    );

    gain.gain.linearRampToValueAtTime(
      0.045,
      context.currentTime + 0.18,
    );

    source.connect(filter);
    filter.connect(gain);

    gain.connect(
      this.masterGain!,
    );

    source.start();

    this.spinNoiseSource = source;
    this.spinNoiseGain = gain;
  }

  stopSpinLoop(): void {
    if (
      !this.spinNoiseSource ||
      !this.spinNoiseGain ||
      !this.audioContext
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    this.spinNoiseGain.gain.cancelScheduledValues(
      now,
    );

    this.spinNoiseGain.gain.setValueAtTime(
      this.spinNoiseGain.gain.value,
      now,
    );

    this.spinNoiseGain.gain.linearRampToValueAtTime(
      0,
      now + 0.12,
    );

    const source =
      this.spinNoiseSource;

    window.setTimeout(
      () => {
        try {
          source.stop();
        } catch {
          // המקור כבר נעצר.
        }

        source.disconnect();
      },
      160,
    );

    this.spinNoiseSource = undefined;
    this.spinNoiseGain = undefined;
  }

  playReelStop(
    reelIndex: number,
  ): void {
    if (!this.enabled) {
      return;
    }

    const context =
      this.ensureAudioContext();

    /*
     * כל Reel מקבל גובה צליל מעט שונה.
     */
    const frequency =
      210 + reelIndex * 38;

    this.playTone({
      context,
      frequency,
      endFrequency:
        frequency * 0.72,
      duration: 0.11,
      volume: 0.16,
      type: "triangle",
    });

    /*
     * Click קצר שנותן תחושת עצירה מכנית.
     */
    window.setTimeout(
      () => {
        this.playTone({
          context,
          frequency:
            720 + reelIndex * 45,
          endFrequency:
            540 + reelIndex * 30,
          duration: 0.045,
          volume: 0.08,
          type: "square",
        });
      },
      35,
    );
  }

  playWin(winAmount: number): void {
    if (!this.enabled) {
      return;
    }

    const context =
      this.ensureAudioContext();

    const notes =
      winAmount >= 50
        ? [523, 659, 784, 1047]
        : [523, 659, 784];

    notes.forEach(
      (frequency, index) => {
        window.setTimeout(
          () => {
            this.playTone({
              context,
              frequency,
              endFrequency:
                frequency * 1.04,
              duration: 0.25,
              volume: 0.13,
              type: "sine",
            });
          },
          index * 115,
        );
      },
    );
  }

  private playTone(options: {
    context: AudioContext;
    frequency: number;
    endFrequency: number;
    duration: number;
    volume: number;
    type: OscillatorType;
  }): void {
    const {
      context,
      frequency,
      endFrequency,
      duration,
      volume,
      type,
    } = options;

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    const now =
      context.currentTime;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now,
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(endFrequency, 1),
      now + duration,
    );

    gain.gain.setValueAtTime(
      0.0001,
      now,
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.015,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    );

    oscillator.connect(gain);

    gain.connect(
      this.masterGain!,
    );

    oscillator.start(now);
    oscillator.stop(
      now + duration + 0.03,
    );
  }
}