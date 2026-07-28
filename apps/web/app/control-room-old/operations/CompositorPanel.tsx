'use client';
import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { createCompositorManifest } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';
export function CompositorPanel() {
  const manifest = createCompositorManifest();
  const stats = manifest.compositor.statistics;
  return <OperationsPanel title="Compositor"><ConsoleSection title="GPU Compositor"><InspectorRow label="Layer Count" value={String(stats.layerCount)} /><InspectorRow label="Effects" value={String(stats.effectCount)} /><InspectorRow label="Transitions" value={String(stats.transitionCount)} /><InspectorRow label="Output Targets" value={String(stats.outputTargetCount)} /><InspectorRow label="Render Health" value={<StatusBadge variant="neutral">Renderer inactive</StatusBadge>} /><InspectorRow label="Availability" value={<StatusBadge variant="neutral">Unavailable</StatusBadge>} /></ConsoleSection><p className="text-ubos-metadata text-ubos-fg-muted">GPU not connected · Metadata only · no frame output.</p></OperationsPanel>;
}
