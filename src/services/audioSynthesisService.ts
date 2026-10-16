class AudioSynthesisService {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play base64 WAV or audio URL
   */
  async playAudioBase64(base64Data: string, onEnded?: () => void): Promise<() => void> {
    const ctx = this.getContext();
    this.stopPlayback();

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = () => {
      this.currentSource = null;
      if (onEnded) onEnded();
    };

    source.start();
    this.currentSource = source;

    return () => this.stopPlayback();
  }

  stopPlayback() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
  }

  /**
   * Generates a waveform peaks array (e.g. 100 bars from 0.0 to 1.0) for visual rendering
   */
  generateWaveformPeaks(count: number = 80, seed: number = 42): number[] {
    const peaks: number[] = [];
    let prev = 0.5;
    for (let i = 0; i < count; i++) {
      const noise = Math.sin(i * 0.15 + seed) * 0.3 + Math.cos(i * 0.35 + seed) * 0.2;
      const target = Math.min(0.95, Math.max(0.1, 0.45 + noise + (Math.random() * 0.2 - 0.1)));
      prev = prev * 0.4 + target * 0.6;
      peaks.push(parseFloat(prev.toFixed(2)));
    }
    return peaks;
  }

  /**
   * Browser SpeechSynthesis fallback with Khmer detection
   */
  speakTextBrowser(text: string, lang: string = 'km', rate: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('SpeechSynthesis not supported in this browser'));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const khmerVoice = voices.find(v => v.lang.startsWith('km') || v.lang.includes('Khmer'));
      if (khmerVoice && lang === 'km') {
        utterance.voice = khmerVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }
}

export const audioService = new AudioSynthesisService();
