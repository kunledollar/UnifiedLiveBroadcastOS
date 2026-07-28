'use client';

import type { ProductionState } from '@ubos/shared';
import { GraphicsLayerStack }     from './GraphicsLayerStack';
import { GraphicsTimeline }       from './GraphicsTimeline';
import { GraphicsPreview }        from './GraphicsPreview';
import { GraphicsTemplateBrowser }from './GraphicsTemplateBrowser';
import { GraphicsParameterEditor }from './GraphicsParameterEditor';
import './GraphicsComposerZone.css';

export function GraphicsComposerZone({ state }: { state: ProductionState }) {
  const { graphics } = state;

  return (
    <div className="graphics-composer-zone">
      {/* Left: Layer Stack + Timeline */}
      <div className="gc-left">
        <GraphicsLayerStack   layers={graphics?.layers   ?? []} />
        <GraphicsTimeline     timeline={graphics?.timeline ?? []} />
      </div>

      {/* Center: Preview canvas */}
      <div className="gc-center">
        <GraphicsPreview preview={graphics?.preview ?? null} />
      </div>

      {/* Right: Template Browser + Parameter Editor */}
      <div className="gc-right">
        <GraphicsTemplateBrowser templates={graphics?.templates ?? []} />
        <GraphicsParameterEditor params={graphics?.params       ?? {}} />
      </div>
    </div>
  );
}
