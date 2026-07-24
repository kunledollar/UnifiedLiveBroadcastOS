'use client';

import { useMemo } from 'react';
import type { ProductionState } from '@ubos/shared';
import { TriadCanvas } from './TriadCanvas';
import './TriadZone.css';

export function TriadZone({ state }: { state: ProductionState }) {
  const { currentScene, previewScene, programScene, aspectRatios } = state;

  const triad = useMemo(() => ({
    scene:   currentScene ?? null,
    preview: previewScene ?? null,
    program: programScene ?? null,
  }), [currentScene, previewScene, programScene]);

  return (
    <div className="triad-zone">
      <div className="triad-row">

        {/* Scene — left */}
        <TriadCanvas
          id="scene"
          scene={triad.scene}
          aspect={aspectRatios?.scene ?? '16 / 9'}
          state={state}
        />

        {/* Preview — center */}
        <TriadCanvas
          id="preview"
          scene={triad.preview}
          aspect={aspectRatios?.preview ?? '16 / 9'}
          state={state}
        />

        {/* Program — right */}
        <TriadCanvas
          id="program"
          scene={triad.program}
          aspect={aspectRatios?.program ?? '16 / 9'}
          state={state}
        />

      </div>
    </div>
  );
}
