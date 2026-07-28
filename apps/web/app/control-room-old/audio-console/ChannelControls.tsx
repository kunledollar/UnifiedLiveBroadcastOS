'use client';

import { BroadcastButton, cn } from '@ubos/ui';

export function MuteButton({
  muted,
  disabled = true,
  onClick,
  className,
}: {
  muted: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <BroadcastButton
      size="sm"
      variant={muted ? 'danger' : 'secondary'}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Mute control unavailable' : muted ? 'Unmute channel' : 'Mute channel'}
      aria-label={muted ? 'Channel muted' : 'Mute channel'}
      aria-pressed={muted}
      className={cn('min-w-[2.5rem] px-1.5', className)}
    >
      M
    </BroadcastButton>
  );
}

export function SoloButton({
  active = false,
  disabled = true,
  onClick,
  className,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <BroadcastButton
      size="sm"
      variant={active ? 'primary' : 'secondary'}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Solo control unavailable' : 'Solo channel'}
      aria-label="Solo channel"
      aria-pressed={active}
      className={cn('min-w-[2.5rem] px-1.5', className)}
    >
      S
    </BroadcastButton>
  );
}
