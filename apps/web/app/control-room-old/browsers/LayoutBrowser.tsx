'use client';

import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import type { SceneLayout } from '@ubos/shared';
import { BrowserSection } from './BrowserChrome';

const layoutLabels: Record<SceneLayout, string> = {
  solo: 'Solo Host',
  interview: 'Interview',
  grid: 'Guest Grid',
  screen_share: 'Screen Share',
  vertical_split: 'Vertical Split',
  picture_in_picture: 'Picture-in-Picture',
};

const layoutAspects: Record<SceneLayout, string[]> = {
  solo: ['16:9'],
  interview: ['16:9'],
  grid: ['16:9'],
  screen_share: ['16:9'],
  vertical_split: ['16:9', '9:16'],
  picture_in_picture: ['16:9'],
};

function LayoutThumbnail({ layout }: { layout: SceneLayout }) {
  const cells: Record<SceneLayout, string> = {
    solo: 'grid-cols-1',
    interview: 'grid-cols-2',
    grid: 'grid-cols-2',
    screen_share: 'grid-cols-[1.6fr_.7fr]',
    vertical_split: 'grid-cols-2',
    picture_in_picture: 'grid-cols-1',
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-ubos-sm border border-ubos-border-subtle bg-black p-0.5">
      <div className={`grid h-full gap-0.5 ${cells[layout]}`}>
        {(layout === 'grid' ? [0, 1, 2, 3] : layout === 'solo' ? [0] : [0, 1]).map((cell) => (
          <div
            key={cell}
            className="rounded-sm bg-gradient-to-br from-ubos-slate/70 to-ubos-carbon ring-1 ring-ubos-border-subtle"
          />
        ))}
      </div>
      {layout === 'picture_in_picture' ? (
        <div className="absolute bottom-1 right-1 h-1/3 w-1/3 rounded-sm bg-ubos-selection/70 ring-1 ring-ubos-border-subtle" />
      ) : null}
      {layout === 'screen_share' ? (
        <div className="absolute left-1 top-1 h-2 w-8 rounded-sm bg-ubos-selection/50" />
      ) : null}
    </div>
  );
}

export function LayoutBrowser({
  layouts,
  activeLayout,
}: {
  layouts: SceneLayout[];
  activeLayout?: SceneLayout | null;
}) {
  if (!layouts.length) {
    return (
      <BrowserSection title="Layouts">
        <p className="text-ubos-caption text-ubos-fg-muted">No layouts available.</p>
      </BrowserSection>
    );
  }

  return (
    <BrowserSection title="Layouts">
      <p className="text-ubos-metadata text-ubos-fg-muted">
        Layout apply is read-only in this build. Current preview scene layout is highlighted.
      </p>
      <AssetList isEmpty={false}>
        {layouts.map((layout) => {
          const isActive = activeLayout === layout;
          return (
            <AssetRow
              key={layout}
              selected={isActive}
              thumbnail={<LayoutThumbnail layout={layout} />}
              title={layoutLabels[layout]}
              subtitle={layoutAspects[layout].join(' · ')}
              status={
                <div className="flex flex-col items-end gap-0.5">
                  {isActive ? <StatusBadge variant="preview">Active</StatusBadge> : null}
                  <StatusBadge variant="neutral">View only</StatusBadge>
                </div>
              }
            />
          );
        })}
      </AssetList>
    </BrowserSection>
  );
}
