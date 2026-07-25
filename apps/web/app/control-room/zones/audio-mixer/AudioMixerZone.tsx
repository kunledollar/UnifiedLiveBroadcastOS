'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

function MeterBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-ubos-midnight">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.round(Math.min(value, 1) * 100)}%` }}
      />
    </div>
  );
}

export function AudioMixerZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const engine = workspaceState.audioEngine;
  const layers = engine.layers;
  const health = engine.monitor();

  const handleGainChange = (layerId: string, value: number) => {
    engine.setGain(layerId, value);
    forceRender((n) => n + 1);
  };

  const handleMute = (layerId: string) => {
    engine.toggleMute(layerId);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ubos-carbon p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">
          Audio Mixer
        </h4>
        <span className="text-[9px] text-ubos-fg-muted">
          {engine.sourceCount} sources · {engine.layerCount} layers
        </span>
      </div>

      {layers.length === 0 ? (
        <p className="text-[10px] text-ubos-fg-muted">No audio layers defined</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto">
          {layers.map((layer) => {
            const mon = health.find((h) => h.id === layer.source);
            return (
              <div key={layer.id} className={`rounded-lg border p-2 ${layer.muted ? 'border-ubos-border-subtle opacity-50' : 'border-ubos-selection-border bg-ubos-graphite'}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex-1 truncate text-[10px] font-semibold text-ubos-fg-secondary">{layer.source}</span>
                  {/* Muted = Program Red (clip/danger family); active = neutral. */}
                  <button
                    type="button"
                    onClick={() => handleMute(layer.id)}
                    className={`rounded px-1.5 py-0.5 text-[8px] font-bold transition-colors ${layer.muted ? 'bg-ubos-program-muted text-ubos-program-text' : 'bg-ubos-midnight text-ubos-fg-secondary hover:bg-ubos-slate'}`}
                  >
                    {layer.muted ? 'Muted' : 'M'}
                  </button>
                </div>

                {/* Gain slider */}
                <div className="mb-2">
                  <div className="mb-0.5 flex justify-between text-[8px] text-ubos-fg-muted">
                    <span>Gain</span>
                    <span>{layer.gain.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={layer.gain}
                    onChange={(e) => handleGainChange(layer.id, parseFloat(e.target.value))}
                    className="h-1 w-full cursor-pointer accent-ubos-selection"
                  />
                </div>

                {/* Meters — clipping escalates to Program Red (danger), nominal level is Preview Green (safe). */}
                {mon && (
                  <div className="space-y-1">
                    <MeterBar value={mon.peak} color={mon.health === 'clipping' ? 'bg-ubos-program' : 'bg-ubos-preview/70'} />
                    <MeterBar value={mon.rms}  color="bg-ubos-preview/60" />
                    <div className="flex justify-between text-[8px] text-ubos-fg-muted">
                      <span>Peak {mon.peak.toFixed(2)}</span>
                      <span>RMS {mon.rms.toFixed(2)}</span>
                      <span className={mon.health === 'clipping' ? 'text-ubos-program-text' : mon.health === 'silent' ? 'text-ubos-fg-muted' : 'text-ubos-preview-text'}>
                        {mon.health}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
