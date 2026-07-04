'use client';

import type { ReactNode } from 'react';
import { cn, ubosTypographyClasses } from '@ubos/ui';
import type { AudioGroupId } from './audio-console-utils';
import { audioGroupLabels } from './audio-console-utils';

export function AudioGroups({
  groups,
  className,
}: {
  groups: Partial<Record<AudioGroupId, ReactNode[]>>;
  className?: string;
}) {
  const ordered: AudioGroupId[] = ['microphones', 'remote', 'media', 'system'];

  return (
    <div className={cn('flex min-w-0 gap-ubos-3', className)}>
      {ordered.map((groupId) => {
        const items = groups[groupId];
        if (!items?.length) return null;
        return (
          <div key={groupId} className="flex shrink-0 flex-col gap-ubos-1">
            <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              {audioGroupLabels[groupId]}
            </span>
            <div className="flex gap-ubos-1">{items}</div>
          </div>
        );
      })}
    </div>
  );
}
