/**
 * UBOS Audio Engine — Step 66
 *
 * Manages audio sources, layers, mixing, and monitoring for live
 * production. Every audio signal in UBOS flows through this engine.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - real WebAudio DSP graph
 *   - parametric EQ curves
 *   - gate, compressor, limiter filters
 *   - real gain staging with headroom tracking
 *   - multi-bus routing
 *   - real-time peak/RMS metering
 *   - AI audio analysis hooks
 */

export type AudioSource = {
  id: string;
  label: string;
  type?: 'microphone' | 'line' | 'rtmp' | 'file' | 'ndi';
};

export type EqBand = {
  frequency: number;
  gain: number;
  q?: number;
  type?: 'peaking' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass';
};

export type AudioFilter = {
  type: string;
  params?: Record<string, number>;
};

export type AudioLayer = {
  id: string;
  source: string;
  gain: number;
  muted?: boolean;
  eq?: Record<string, EqBand>;
  filters?: Record<string, AudioFilter>;
};

export type AudioMixResult = {
  id: string;
  source: string;
  gain: number;
  eq: Record<string, EqBand>;
  filters: Record<string, AudioFilter>;
};

export type AudioMonitorResult = {
  id: string;
  health: 'ok' | 'clipping' | 'silent' | 'degraded';
  peak: number;
  rms: number;
};

export class AudioEngine {
  private sources: Record<string, AudioSource> = {};
  layers: AudioLayer[] = [];

  // ── Source management ─────────────────────────────────────────────────────

  registerSource(id: string, source: AudioSource): void {
    this.sources[id] = source;
  }

  unregisterSource(id: string): void {
    delete this.sources[id];
  }

  getSource(id: string): AudioSource | undefined {
    return this.sources[id];
  }

  getSources(): readonly AudioSource[] {
    return Object.values(this.sources);
  }

  // ── Layer management ──────────────────────────────────────────────────────

  setLayers(layers: AudioLayer[]): void {
    this.layers = layers;
  }

  addLayer(layer: AudioLayer): void {
    const existing = this.layers.findIndex((l) => l.id === layer.id);
    if (existing >= 0) {
      this.layers[existing] = layer;
    } else {
      this.layers.push(layer);
    }
  }

  setGain(layerId: string, gain: number): void {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) layer.gain = Math.max(0, Math.min(4, gain));
  }

  toggleMute(layerId: string): void {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) layer.muted = !layer.muted;
  }

  // ── Mixing ────────────────────────────────────────────────────────────────

  mix(): AudioMixResult[] {
    return this.layers
      .filter((layer) => !layer.muted)
      .map((layer) => {
        const src = this.sources[layer.source];
        if (!src) return null;

        return {
          id:      layer.id,
          source:  layer.source,
          gain:    layer.gain ?? 1.0,
          eq:      layer.eq      ?? {},
          filters: layer.filters ?? {},
        };
      })
      .filter((r): r is AudioMixResult => r !== null);
  }

  // ── Monitoring ────────────────────────────────────────────────────────────

  monitor(): AudioMonitorResult[] {
    return Object.keys(this.sources).map((id) => {
      const peak = Math.random() * 0.8;
      const rms  = peak * (0.5 + Math.random() * 0.4);
      return {
        id,
        health: peak > 0.95 ? 'clipping' : peak < 0.05 ? 'silent' : 'ok',
        peak,
        rms,
      };
    });
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get sourceCount(): number { return Object.keys(this.sources).length; }
  get layerCount():  number { return this.layers.length; }
}
