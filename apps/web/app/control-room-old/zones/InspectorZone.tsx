'use client';

/**
 * Inspector 2.0 (Step 101) — the universal deep-inspection workspace.
 *
 * Restructured from a single flat vertical stack into the four canonical
 * regions Inspector 2.0 defines (`ubosWorkspaceGridTemplates.inspector`,
 * Step 98): Navigation (left), Body (center), Metadata (right),
 * Intelligence Bar (bottom). This zone's actual geometry rect is a narrow
 * vertical column in every shell that mounts it (DirectorShell,
 * ProductionShell, GraphicsShell, ReplayShell, AutomationShell) — a literal
 * side-by-side 3-column grid would not fit that width, so the four regions
 * stay stacked vertically in their canonical order rather than forcing a
 * layout the real geometry can't support (the same "work within the
 * approved geometry" constraint Triad 2.0 (Step 100) respected).
 *
 * Each region gets its own UIIL signal class (`inspectorIntelligence.ts`),
 * layered on top of its existing card instead of a second wrapping
 * card — a signal's outline/box-shadow renders outside that card's own
 * border/background, so there's no double-chrome, only a real glow when a
 * signal actually fires for that region's domain.
 */
import type { ProductionState } from '@ubos/shared';
import { ubosTypographyClasses } from '@ubos/ui';
import { SceneInspector } from './inspector/SceneInspector';
import { GraphInspector } from './inspector/GraphInspector';
import { AiInspector } from './inspector/AiInspector';
import { InspectorMetadataPanel } from './inspector/InspectorMetadataPanel';
import { InspectorIntelligenceBar } from './inspector/InspectorIntelligenceBar';
import { inspectorRegionClassName } from './inspector/inspectorIntelligence';
import { workspaceState } from '../workspace/workspaceState';
import './InspectorZone.css';

export function InspectorZone({ state }: { state: ProductionState }) {
  const { scenes, programSceneId, aiCrewActive } = state;

  const activeScene = scenes?.find((s) => s.id === programSceneId);
  const uiIntegration = workspaceState.intelligenceGraph.uiIntegration;

  return (
    <div className="inspector-zone">
      <h3 className={`${ubosTypographyClasses.title} text-ubos-fg-muted`}>Inspector</h3>

      {/* Navigation region — Left Column in the canonical layout */}
      <section className={`inspector-region rounded-lg ${inspectorRegionClassName('navigation', uiIntegration)}`}>
        <p className={`${ubosTypographyClasses.sectionLabel} mb-1 text-ubos-fg-disabled`}>Navigation</p>
        <GraphInspector scenes={scenes} currentScene={programSceneId} />
      </section>

      {/* Body region — Center Column in the canonical layout */}
      <section className={`inspector-region rounded-lg ${inspectorRegionClassName('body', uiIntegration)}`}>
        <p className={`${ubosTypographyClasses.sectionLabel} mb-1 text-ubos-fg-disabled`}>Inspector Body</p>
        <SceneInspector scene={activeScene} />
      </section>

      {/* Metadata region — Right Column in the canonical layout */}
      <section className={`inspector-region rounded-lg ${inspectorRegionClassName('metadata', uiIntegration)}`}>
        <InspectorMetadataPanel />
      </section>

      {/* Intelligence Bar region — Bottom in the canonical layout */}
      <section className={`inspector-region rounded-lg ${inspectorRegionClassName('intelligenceBar', uiIntegration)}`}>
        <InspectorIntelligenceBar />
        {aiCrewActive && <AiInspector state={state} />}
      </section>
    </div>
  );
}
