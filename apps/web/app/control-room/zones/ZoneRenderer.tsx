'use client';

/**
 * ZoneRenderer — Step 50
 *
 * Registry-driven zone component dispatcher. Each zone id maps to its
 * dedicated React component. Unknown zone ids render nothing so new
 * geometry zones can be added without breaking the renderer.
 */
import type { ProductionState } from '@ubos/shared';
import type { ComponentType } from 'react';
import { SceneZone }              from './SceneZone';
import { TriadZone }              from './TriadZone';
import { InspectorZone }          from './InspectorZone';
import { WorkbenchZone }          from './WorkbenchZone';
import { OutputZone }             from './OutputZone';
import { AiInsightZone }          from './AiInsightZone';
import { AiCrewOverlay }          from './AiCrewOverlay';
import { GraphicsComposerZone }   from './graphics-composer/GraphicsComposerZone';
import { CameraGridZone }         from './camera-grid/CameraGridZone';
import { MultiFeedGridZone }      from './multi-feed-grid/MultiFeedGridZone';
import { UnifiedChatZone }        from './unified-chat/UnifiedChatZone';
import { EngagementGraphsZone }   from './engagement-graphs/EngagementGraphsZone';

type ZoneComponentProps = { state: ProductionState };

const registry: Record<string, ComponentType<ZoneComponentProps>> = {
  scene:               SceneZone,
  triad:               TriadZone,
  inspector:           InspectorZone,
  workbench:           WorkbenchZone,
  output:              OutputZone,
  'ai-insight':        AiInsightZone,
  'ai-crew-overlay':   AiCrewOverlay,
  'graphics-composer': GraphicsComposerZone,
  'camera-grid':       CameraGridZone,
  'multi-feed-grid':   MultiFeedGridZone,
  'unified-chat':      UnifiedChatZone,
  'engagement-graphs': EngagementGraphsZone,
};

export function ZoneRenderer({
  id,
  state,
}: {
  id: string;
  state: ProductionState;
}) {
  const Component = registry[id];
  if (!Component) return null;
  return <Component state={state} />;
}
