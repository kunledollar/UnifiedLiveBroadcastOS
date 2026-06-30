'use client';

import { Badge, Panel } from '@ubos/ui';
import { GuestStatus, type Guest, type GuestInvite } from '@ubos/shared';
import { useTransition } from 'react';
import {
  admitGuest,
  inviteGuest,
  muteGuest,
  reconnectGuest,
  rejectGuest,
  removeGuest,
  renameGuest,
  revokeInvite,
  spotlightGuest,
} from './guest-actions';

const labels: Record<GuestStatus, string> = {
  invited: 'Invited',
  waiting: 'Waiting',
  green_room: 'Green Room',
  connected: 'Connected',
  on_air: 'On Air',
  muted: 'Muted',
  disconnected: 'Disconnected',
  reconnecting: 'Reconnecting',
  rejected: 'Rejected',
  removed: 'Removed',
};
const tones: Record<GuestStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'live'> = {
  invited: 'neutral',
  waiting: 'warning',
  green_room: 'warning',
  connected: 'success',
  on_air: 'live',
  muted: 'warning',
  disconnected: 'danger',
  reconnecting: 'warning',
  rejected: 'danger',
  removed: 'danger',
};

function actionButton(label: string, action: () => void, danger = false) {
  return (
    <button
      className={`rounded-lg px-2 py-1 text-[11px] font-bold ${danger ? 'bg-rose-500/80 text-white hover:bg-rose-500' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
      onClick={action}
      type="button"
    >
      {label}
    </button>
  );
}

export function GuestManagement({
  guests,
  invites,
  broadcastId,
}: {
  guests: Guest[];
  invites: GuestInvite[];
  broadcastId: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Panel
      title="Guests"
      action={
        <span className="text-xs text-slate-400">
          {isPending ? 'Updating…' : `${guests.length} live records`}
        </span>
      }
    >
      <form
        action={(formData) =>
          startTransition(async () => {
            await inviteGuest(formData);
          })
        }
        className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3"
      >
        <input type="hidden" name="broadcastId" value={broadcastId} />
        <input
          name="displayName"
          className="w-full rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
          placeholder="Guest invite name"
        />
        <button
          className="w-full rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300"
          type="submit"
        >
          Generate Invite
        </button>
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 p-2 text-xs"
          >
            <span className="truncate font-mono text-cyan-200">/guest?token={invite.token}</span>
            <button
              formAction={() =>
                startTransition(async () => {
                  await revokeInvite(invite.id);
                })
              }
              className="text-rose-300 hover:text-rose-200"
            >
              Revoke
            </button>
          </div>
        ))}
      </form>
      <div className="space-y-3">
        {guests.map((guest) => (
          <div key={guest.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${guest.status === GuestStatus.OnAir ? 'animate-pulse bg-emerald-300' : 'bg-slate-500'}`}
                    title="Speaker activity placeholder"
                  />
                  <p className="font-semibold text-white">{guest.displayName}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">{guest.role} · private chat ready</p>
              </div>
              <Badge tone={tones[guest.status]}>{labels[guest.status]}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {actionButton('Admit', () =>
                startTransition(async () => {
                  await admitGuest(guest.id);
                }),
              )}
              {actionButton(
                'Reject',
                () =>
                  startTransition(async () => {
                    await rejectGuest(guest.id);
                  }),
                true,
              )}
              {actionButton(guest.isMuted ? 'Unmute' : 'Mute', () =>
                startTransition(async () => {
                  await muteGuest(guest.id);
                }),
              )}
              {actionButton(
                'Remove',
                () =>
                  startTransition(async () => {
                    await removeGuest(guest.id);
                  }),
                true,
              )}
              {actionButton('Spotlight', () =>
                startTransition(async () => {
                  await spotlightGuest(guest.id);
                }),
              )}
              {actionButton('Rename', () => {
                const displayName = window.prompt('Rename guest', guest.displayName);
                if (!displayName) return;
                const formData = new FormData();
                formData.set('guestId', guest.id);
                formData.set('displayName', displayName);
                startTransition(async () => {
                  await renameGuest(formData);
                });
              })}
              {actionButton('Reconnect', () =>
                startTransition(async () => {
                  await reconnectGuest(guest.id);
                }),
              )}
              {actionButton('Chat', () =>
                window.alert(`Private chat with ${guest.displayName} is stubbed for Phase 3.4.`),
              )}
            </div>
          </div>
        ))}
        {guests.length === 0 ? (
          <p className="text-sm text-slate-400">
            Generate an invite to add the first live guest card.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
