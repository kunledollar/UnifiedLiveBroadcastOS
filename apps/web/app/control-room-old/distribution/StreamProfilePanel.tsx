'use client';

import type { StreamProfile } from '@ubos/shared';
import { BroadcastPanel, ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DistributionEmptyState } from './DistributionEmptyState';

export function StreamProfilePanel({
  profiles,
  selectedProfileId,
  onSelectProfile,
  className,
}: {
  profiles: StreamProfile[];
  selectedProfileId?: string | null;
  onSelectProfile?: (profileId: string) => void;
  className?: string;
}) {
  const selected =
    profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null;

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Stream Profiles</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Encoder unavailable · Metadata only
        </p>
      </div>
      <div className="space-y-ubos-2 p-ubos-2">
        {!profiles.length ? (
          <DistributionEmptyState message="No stream profile configured" />
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectProfile?.(profile.id)}
                  className={cn(
                    'rounded-ubos-sm border px-2 py-1 text-ubos-caption',
                    selected?.id === profile.id
                      ? 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text'
                      : 'border-ubos-border-subtle bg-ubos-midnight/50 text-ubos-fg-secondary',
                  )}
                >
                  {profile.name}
                </button>
              ))}
            </div>
            {selected ? (
              <ConsoleSection title={selected.name}>
                <InspectorRow label="Protocol" value={selected.protocol.toUpperCase()} />
                <InspectorRow label="Resolution" value={selected.resolution} />
                <InspectorRow label="FPS" value={String(selected.fps)} />
                <InspectorRow label="Bitrate" value={`${selected.bitrateKbps} kbps`} />
                <InspectorRow label="Audio" value={`${selected.audioBitrateKbps} kbps`} />
                <InspectorRow label="Keyframe" value={`${selected.keyframeInterval}s`} />
                <InspectorRow label="Encoder" value={selected.encoder} />
                <InspectorRow
                  label="Status"
                  value={<StatusBadge variant="neutral">{selected.status}</StatusBadge>}
                />
              </ConsoleSection>
            ) : null}
          </>
        )}
      </div>
    </BroadcastPanel>
  );
}
