'use client';

import { useMemo } from 'react';
import type { ProductionState } from '@ubos/shared';
import { TriadCanvas } from './TriadCanvas';
import { TriadOperatorHud } from './TriadOperatorHud';
import { workspaceState } from '../workspace/workspaceState';
import { triadLaneClassName } from './triadIntelligence';
import './TriadZone.css';

export function TriadZone({ state }: { state: ProductionState }) {
  const { previewScene, programScene, aspectRatios } = state;

  const triad = useMemo(() => {
    // Prefer data from SceneGraphEngine when scenes are loaded
    const engineCurrent = workspaceState.sceneGraph.getCurrentScene();
    const enginePreview = workspaceState.sceneGraph.getPreviewScene();

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scene:   (engineCurrent ?? state.currentScene ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preview: (enginePreview ?? previewScene ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      program: (engineCurrent ?? programScene ?? null) as any,
    };
  }, [state.currentScene, previewScene, programScene]);

  // Step 100: per-lane UIIL classing — a predicted transition highlights the
  // Scene/Preview lanes specifically, an output warning elevates the
  // Program lane specifically. Reads the same `UIIntegrationLayer` instance
  // ControlRoomCanvas already applies to the outer Triad zone wrapper; no
  // extra polling needed since ControlRoomCanvas's own `useUiIntelligence()`
  // already re-renders this whole subtree on every WIE tick.
  const uiIntegration = workspaceState.intelligenceGraph.uiIntegration;

  return (
    <div className="triad-zone">
      <TriadOperatorHud />
      <div className="triad-row">

        {/* Scene — left */}
        <TriadCanvas
          id="scene"
          scene={triad.scene}
          aspect={aspectRatios?.scene ?? '16 / 9'}
          state={state}
          uiClassName={triadLaneClassName('scene', uiIntegration)}
          uiReason={uiIntegration.getPanel('scenePanel').reason}
        />

        {/* Preview — center */}
        <TriadCanvas
          id="preview"
          scene={triad.preview}
          aspect={aspectRatios?.preview ?? '16 / 9'}
          state={state}
          uiClassName={triadLaneClassName('preview', uiIntegration)}
          uiReason={uiIntegration.getPanel('scenePanel').reason}
        />

        {/* Program — right */}
        <TriadCanvas
          id="program"
          scene={triad.program}
          aspect={aspectRatios?.program ?? '16 / 9'}
          state={state}
          uiClassName={triadLaneClassName('program', uiIntegration)}
          uiReason={uiIntegration.getPanel('programOutputPanel').reason}
        />

      </div>
    </div>
  );
}
