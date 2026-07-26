'use client';

import type { ProductionState } from '@ubos/shared';
import { ubosTypographyClasses } from '@ubos/ui';
import { SceneRenderer } from './SceneRenderer';
import { AiCrewOverlay } from './AiCrewOverlay';
import type { TriadLaneId } from './triadIntelligence';

type TriadScene = {
  id: string;
  name?: string;
  layers?: Array<{
    id: string;
    type: 'video' | 'image' | 'text' | 'graphics';
    src?: string;
    text?: string;
  }>;
};

type TriadCanvasProps = {
  id: TriadLaneId;
  scene: TriadScene | null | undefined;
  aspect?: string;
  state: ProductionState;
  /** Step 100: this lane's live UIIL signal class, e.g. `ubos-highlight`/`ubos-warn` — empty when no signal applies. */
  uiClassName?: string;
  /** Step 100: the reason behind `uiClassName`, surfaced as a tooltip when a signal is active. */
  uiReason?: string | null;
};

// UBDS color semantics (Step 92): Program = Program Red (irreversible/live),
// Preview = Preview Green (reversible/staged), Scene = Active Blue (operator
// focus — staged for editing, not yet on Preview or Program).
const borderColor: Record<TriadCanvasProps['id'], string> = {
  scene:   'border-t-2 border-ubos-selection-border',
  preview: 'border-t-2 border-ubos-preview-border',
  program: 'border-t-2 border-ubos-program-border',
};

// HUD Text (Step 93) is color-semantic aware by design — pair it with each
// lane's role hue, the same pattern the design system README documents for
// text rendered over unpredictable live video content.
const labelBg: Record<TriadCanvasProps['id'], string> = {
  scene:   'bg-ubos-carbon',
  preview: 'bg-ubos-preview-muted',
  program: 'bg-ubos-program-muted',
};

const labelText: Record<TriadCanvasProps['id'], string> = {
  scene:   'text-ubos-fg-muted',
  preview: 'text-ubos-preview-text',
  program: 'text-ubos-program-text',
};

export function TriadCanvas({ id, scene, aspect, state, uiClassName, uiReason }: TriadCanvasProps) {
  const label = id.toUpperCase();
  const laneClassName = `triad-canvas triad-${id} relative flex flex-1 flex-col overflow-hidden ${borderColor[id]} ${uiClassName ?? ''}`;

  if (!scene) {
    return (
      <div
        className={`${laneClassName} empty`}
        style={{ aspectRatio: aspect ?? '16 / 9' }}
        title={uiReason ?? undefined}
      >
        <div className={`px-2 py-1 ${ubosTypographyClasses.hud} ${labelBg[id]} ${labelText[id]}`}>
          {label}
        </div>
        <div className="flex flex-1 items-center justify-center bg-ubos-carbon text-[10px] font-bold uppercase tracking-widest text-ubos-fg-disabled">
          {label} — Empty
        </div>
      </div>
    );
  }

  return (
    <div
      className={laneClassName}
      style={{ aspectRatio: aspect ?? '16 / 9' }}
      title={uiReason ?? undefined}
    >
      {/* Canvas label — HUD Text (Step 93), the role hierarchy that survives on top of unpredictable video content */}
      <div className={`shrink-0 px-2 py-1 ${ubosTypographyClasses.hud} ${labelBg[id]} ${labelText[id]}`}>
        {label} {scene.name ? `· ${scene.name}` : ''}
      </div>

      {/* Scene content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SceneRenderer scene={scene} />

        {/* AI Crew Overlay — floats on top of Program canvas */}
        {id === 'program' && state.aiCrewActive && (
          <div className="pointer-events-none absolute inset-0 z-10">
            <AiCrewOverlay state={state} />
          </div>
        )}
      </div>
    </div>
  );
}
