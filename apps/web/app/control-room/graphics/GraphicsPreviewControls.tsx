'use client';

import { BroadcastButton, cn, ubosTypographyClasses } from '@ubos/ui';

export function GraphicsPreviewControls({
  previewCount,
  programCount,
  onSendToPreview,
  onTakeLive,
  onRemoveFromProgram,
  onClearPreview,
  onClearProgram,
  className,
}: {
  previewCount: number;
  programCount: number;
  onSendToPreview?: () => void;
  onTakeLive?: () => void;
  onRemoveFromProgram?: () => void;
  onClearPreview?: () => void;
  onClearProgram?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-ubos-2', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        Preview {previewCount} · Program {programCount}
      </span>
      <BroadcastButton size="sm" variant="secondary" onClick={onSendToPreview}>
        Send to Preview
      </BroadcastButton>
      <BroadcastButton size="sm" variant="primary" onClick={onTakeLive}>
        Take Live
      </BroadcastButton>
      <BroadcastButton size="sm" variant="ghost" onClick={onRemoveFromProgram}>
        Remove from Program
      </BroadcastButton>
      <BroadcastButton size="sm" variant="ghost" onClick={onClearPreview}>
        Clear Preview
      </BroadcastButton>
      <BroadcastButton size="sm" variant="ghost" onClick={onClearProgram}>
        Clear Program
      </BroadcastButton>
    </div>
  );
}
