'use client';

/**
 * Output Preview Panel (Step 102) — the "Preview Window" region of Program
 * Output 2.0: next scene, next graphics/audio state, predictive transition
 * status. Reuses the exact same scene-graph preview data Triad's own
 * Preview lane reads (`workspaceState.sceneGraph.getPreviewScene()`) — this
 * is a status summary of what's staged next, not a duplicate video canvas
 * (the actual preview video stays owned by Triad/TriadCanvas).
 */
import { workspaceState } from '../workspace/workspaceState';

export function OutputPreviewPanel() {
  const previewScene = workspaceState.sceneGraph.getPreviewScene();
  const layerCount = previewScene?.layers?.length ?? 0;

  return (
    <div className="output-preview-panel">
      {previewScene ? (
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-ubos-fg-muted">Next scene</span>
            <span className="text-ubos-preview-text">{previewScene.name ?? previewScene.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ubos-fg-muted">Layers staged</span>
            <span className="text-ubos-fg-secondary">{layerCount}</span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-ubos-fg-muted">No scene staged in Preview</p>
      )}
    </div>
  );
}
