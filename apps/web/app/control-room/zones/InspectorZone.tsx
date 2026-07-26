'use client';

import type { ProductionState } from '@ubos/shared';
import { SceneInspector } from './inspector/SceneInspector';
import { GraphInspector } from './inspector/GraphInspector';
import { AiInspector }   from './inspector/AiInspector';
import './InspectorZone.css';

export function InspectorZone({ state }: { state: ProductionState }) {
  const { scenes, programSceneId, aiCrewActive } = state;

  const activeScene = scenes?.find((s) => s.id === programSceneId);

  return (
    <div className="inspector-zone">
      <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Inspector</h3>

      {/* Scene Inspector */}
      <SceneInspector scene={activeScene} />

      {/* Graph Inspector */}
      <GraphInspector scenes={scenes} currentScene={programSceneId} />

      {/* AI Inspector — only when AI Crew is active */}
      {aiCrewActive && <AiInspector state={state} />}
    </div>
  );
}
