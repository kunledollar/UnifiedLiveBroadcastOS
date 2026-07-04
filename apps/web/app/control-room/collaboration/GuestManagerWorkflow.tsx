'use client';

import type { Guest, GuestInvite, MediaRoute } from '@ubos/shared';
import { GuestStatus } from '@ubos/shared';
import { AssetList, AssetRow, BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { SceneThumbnail } from '../browsers/BrowserChrome';
import { CollaborationEmptyState } from './CollaborationEmptyState';

const statusSections: Array<{ key: string; label: string; statuses: GuestStatus[] }> = [
  { key: 'invited', label: 'Invited', statuses: [GuestStatus.Invited] },
  { key: 'waiting', label: 'Waiting', statuses: [GuestStatus.Waiting, GuestStatus.GreenRoom] },
  { key: 'connected', label: 'Connected', statuses: [GuestStatus.Connected, GuestStatus.OnAir, GuestStatus.Muted] },
  { key: 'disconnected', label: 'Disconnected', statuses: [GuestStatus.Disconnected, GuestStatus.Reconnecting, GuestStatus.Rejected, GuestStatus.Removed] },
];

export function GuestManagerWorkflow({
  guests,
  invites,
  routes,
  onAssignToScene,
  onSendToPreview,
  onMute,
  onRemove,
  className,
}: {
  guests: Guest[];
  invites: GuestInvite[];
  routes: MediaRoute[];
  onAssignToScene?: (guestId: string) => void;
  onSendToPreview?: (guestId: string) => void;
  onMute?: (guestId: string) => void;
  onRemove?: (guestId: string) => void;
  className?: string;
}) {
  if (!guests.length && !invites.length) {
    return (
      <CollaborationEmptyState
        message="No guests configured"
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <div className={cn('space-y-ubos-3', className)}>
      {statusSections.map((section) => {
        const sectionGuests = guests.filter((guest) => section.statuses.includes(guest.status));
        if (!sectionGuests.length) return null;
        return (
          <section key={section.key}>
            <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>
              {section.label} ({sectionGuests.length})
            </h4>
            <AssetList isEmpty={false}>
              {sectionGuests.map((guest) => {
                const route = routes.find((item) => item.guestId === guest.id);
                return (
                  <div
                    key={guest.id}
                    className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-2"
                  >
                    <AssetRow
                      thumbnail={<SceneThumbnail label="GST" />}
                      title={guest.displayName}
                      subtitle={`${guest.status} · device readiness unavailable`}
                      status={
                        <StatusBadge variant={guest.status === GuestStatus.OnAir ? 'live' : 'neutral'}>
                          {route?.isOnProgram ? 'PROGRAM' : route?.isActive ? 'ACTIVE' : 'IDLE'}
                        </StatusBadge>
                      }
                    />
                    <div className="mt-1 flex flex-wrap gap-1">
                      <BroadcastButton size="sm" variant="ghost" onClick={() => onAssignToScene?.(guest.id)}>
                        Assign
                      </BroadcastButton>
                      <BroadcastButton size="sm" variant="ghost" onClick={() => onSendToPreview?.(guest.id)}>
                        Preview
                      </BroadcastButton>
                      <BroadcastButton size="sm" variant="ghost" onClick={() => onMute?.(guest.id)}>
                        Mute
                      </BroadcastButton>
                      <BroadcastButton size="sm" variant="ghost" onClick={() => onRemove?.(guest.id)}>
                        Remove
                      </BroadcastButton>
                    </div>
                  </div>
                );
              })}
            </AssetList>
          </section>
        );
      })}
      {invites.length ? (
        <section>
          <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>
            Pending invites ({invites.length})
          </h4>
          <ul className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-ubos-sm bg-ubos-midnight px-2 py-1">
                {invite.displayName ?? invite.id} ·{' '}
                {invite.revokedAt ? 'revoked' : invite.acceptedAt ? 'accepted' : 'pending'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
