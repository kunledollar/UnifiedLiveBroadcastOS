'use client';

import type { ProductionSwitchingState, Scene, TransitionType } from '@ubos/shared';
import { useCallback, useState, useTransition } from 'react';
import { updateProductionState } from '../scene-actions';
import { ScenePanel } from './ScenePanel';

/**
 * The only client-side scene-control boundary in the Control Room.
 *
 * It intentionally carries serializable graph snapshots and scene/source IDs.
 * Live streams stay with the media runtime registry; this component
 * neither receives, stores, nor attaches them.
 */
export type SceneControlSnapshot = {
  scenes: Scene[];
  selectedPreviewSceneId: string;
  currentProgramSceneId: string;
  sourceSummaries: Array<{
    id: string;
    sceneId: string;
    name: string;
    type: string;
    runtimeStatus: string;
  }>;
};

function snapshotFrom(scenes: Scene[], state: ProductionSwitchingState): SceneControlSnapshot {
  return {
    scenes,
    selectedPreviewSceneId: state.previewSceneId,
    currentProgramSceneId: state.programSceneId,
    sourceSummaries: scenes.flatMap((scene) =>
      scene.sources.map((source) => ({
        id: source.id,
        sceneId: scene.id,
        name: source.label || source.name,
        type: source.type,
        runtimeStatus: String(source.settings.runtimeStatus ?? 'unknown'),
      })),
    ),
  };
}

export function SceneControlAdapter({
  scenes,
  productionState,
}: {
  scenes: Scene[];
  productionState: ProductionSwitchingState;
}) {
  const [snapshot, setSnapshot] = useState(() => snapshotFrom(scenes, productionState));
  const [isPending, startTransition] = useTransition();

  const dispatch = useCallback(
    (input: Parameters<typeof updateProductionState>[0]) => {
      startTransition(async () => {
        const next = await updateProductionState(input);
        setSnapshot((current) => {
          const nextSnapshot = snapshotFrom(current.scenes, next);
          return current.selectedPreviewSceneId === nextSnapshot.selectedPreviewSceneId &&
            current.currentProgramSceneId === nextSnapshot.currentProgramSceneId &&
            current.scenes === nextSnapshot.scenes
            ? current
            : nextSnapshot;
        });
      });
    },
    [],
  );

  const selectPreviewScene = useCallback(
    (sceneId: string) => {
      if (sceneId === snapshot.selectedPreviewSceneId) return;
      dispatch({ previewSceneId: sceneId, action: 'stage' });
    },
    [dispatch, snapshot.selectedPreviewSceneId],
  );
  const take = useCallback(
    (action: 'take' | 'cut' | 'fade', transitionType?: TransitionType) => {
      dispatch({
        programSceneId: snapshot.selectedPreviewSceneId,
        ...(transitionType ? { transitionType } : {}),
        action,
      });
    },
    [dispatch, snapshot.selectedPreviewSceneId],
  );

  return (
    <ScenePanel
      snapshot={snapshot}
      pending={isPending}
      selectPreviewScene={selectPreviewScene}
      cutToProgram={() => take('cut', 'cut')}
      autoTransition={() => take('fade', 'fade')}
      takePreview={() => take('take')}
    />
  );
}
