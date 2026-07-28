'use client';

import { useMemo, useState } from 'react';
import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import { GuestStatus, type Guest } from '@ubos/shared';
import { BrowserToolbar, SceneThumbnail } from './BrowserChrome';

const statusLabels: Record<GuestStatus, string> = {
  invited: 'Invited',
  waiting: 'Waiting',
  green_room: 'Green Room',
  connected: 'Connected',
  on_air: 'On Air',
  muted: 'Muted',
  disconnected: 'Offline',
  reconnecting: 'Reconnecting',
  rejected: 'Rejected',
  removed: 'Removed',
};

function guestStatusVariant(status: GuestStatus) {
  if (status === GuestStatus.OnAir) return 'live' as const;
  if (status === GuestStatus.Connected || status === GuestStatus.Muted) return 'success' as const;
  if (
    status === GuestStatus.Waiting ||
    status === GuestStatus.GreenRoom ||
    status === GuestStatus.Reconnecting ||
    status === GuestStatus.Invited
  ) {
    return 'warning' as const;
  }
  return 'offline' as const;
}

export function CompactGuestsBrowser({ guests }: { guests: Guest[] }) {
  const [search, setSearch] = useState('');

  const visibleGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guests;
    return guests.filter(
      (guest) =>
        guest.displayName.toLowerCase().includes(query) ||
        guest.role.toLowerCase().includes(query) ||
        statusLabels[guest.status].toLowerCase().includes(query),
    );
  }, [guests, search]);

  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <BrowserToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guests"
        className="space-y-1"
      />
      <AssetList isEmpty={visibleGuests.length === 0} emptyMessage="No guests">
        {visibleGuests.map((guest) => (
          <AssetRow
            key={guest.id}
            thumbnail={<SceneThumbnail label={guest.displayName.slice(0, 2).toUpperCase()} />}
            title={guest.displayName}
            subtitle={guest.role}
            status={
              <StatusBadge variant={guestStatusVariant(guest.status)} dot={guest.status === GuestStatus.OnAir}>
                {statusLabels[guest.status]}
              </StatusBadge>
            }
            className="gap-1.5 px-1 py-1"
          />
        ))}
      </AssetList>
    </div>
  );
}
