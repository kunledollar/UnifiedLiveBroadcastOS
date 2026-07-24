'use client';

import type { ProductionState } from '@ubos/shared';
import { SceneCard }     from './scene/SceneCard';
import { SceneTimeline } from './scene/SceneTimeline';
import { SceneGraph }    from './scene/SceneGraph';
import './SceneZone.css';

export function SceneZone({ state }: { state: ProductionState }) {
  const { scenes, programSceneId } = state;

  // Active scene object (used for timeline)
  const currentSceneObj = scenes?.find((s) => s.id === programSceneId);

  return (
    <div className="scene-zone">
      <div className="scene-zone-header">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Scenes</h3>
      </div>

      {/* Scene Cards */}
      <div className="scene-cards">
        {scenes && scenes.length > 0 ? (
          scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              active={scene.id === programSceneId}
            />
          ))
        ) : (
          <p className="text-[10px] text-[#334155]">No scenes</p>
        )}
      </div>

      {/* Scene Timeline */}
      <div className="scene-timeline-wrapper">
        <SceneTimeline scene={currentSceneObj} />
      </div>

      {/* Scene Graph */}
      <div className="scene-graph-wrapper">
        <SceneGraph scenes={scenes} currentScene={programSceneId} />
      </div>
    </div>
  );
}
