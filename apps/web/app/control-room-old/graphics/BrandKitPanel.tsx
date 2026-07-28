'use client';

import type { BrandKit } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { GraphicsEmptyState } from './GraphicsEmptyState';

export function BrandKitPanel({ brandKit }: { brandKit?: BrandKit | null }) {
  if (!brandKit) {
    return <GraphicsEmptyState message="No brand kit configured." />;
  }

  return (
    <ConsoleSection title="Brand Kit">
      <InspectorRow label="Name" value={brandKit.name} />
      <InspectorRow label="Primary" value={brandKit.colors.primary} />
      <InspectorRow label="Secondary" value={brandKit.colors.secondary} />
      <InspectorRow label="Accent" value={brandKit.colors.accent} />
      <InspectorRow label="Heading font" value={brandKit.fonts.heading ?? 'unavailable'} />
      <InspectorRow label="Body font" value={brandKit.fonts.body ?? 'unavailable'} />
      <InspectorRow label="Logo ref" value={brandKit.logoAssetId ?? 'missing'} />
      <InspectorRow label="Watermark ref" value={brandKit.watermarkAssetId ?? 'missing'} />
      <div className="flex flex-wrap gap-1 pt-1">
        <StatusBadge variant="neutral">Lower-third style metadata</StatusBadge>
        <StatusBadge variant="neutral">Ticker style metadata</StatusBadge>
      </div>
    </ConsoleSection>
  );
}
