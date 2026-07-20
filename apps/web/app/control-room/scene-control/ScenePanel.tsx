'use client';

import type { SceneControlSnapshot } from './SceneControlAdapter';
import { DirectorWorkspace } from '../director/DirectorWorkspace';

export function ScenePanel({
  snapshot,
  pending,
  cutToProgram,
  autoTransition,
  takePreview,
}: {
  snapshot: SceneControlSnapshot;
  pending: boolean;
  selectPreviewScene: (sceneId: string) => void;
  cutToProgram: () => void;
  autoTransition: () => void;
  takePreview: () => void;
}) {
  const program = snapshot.scenes.find((scene) => scene.id === snapshot.currentProgramSceneId);
  const preview = snapshot.scenes.find((scene) => scene.id === snapshot.selectedPreviewSceneId);

  return (
    <DirectorWorkspace
      pending={pending}
      cutToProgram={cutToProgram}
      autoTransition={autoTransition}
      takePreview={takePreview}
      programName={program?.name ?? 'No program scene'}
      previewName={preview?.name ?? 'No preview scene'}
    />
  );
}
