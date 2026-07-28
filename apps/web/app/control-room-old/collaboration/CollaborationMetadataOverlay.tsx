'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function CollaborationMetadataOverlay({
  directorName,
  activeLockCount,
  openNoteCount,
  previewChangedBy,
  className,
}: {
  directorName?: string;
  activeLockCount?: number;
  openNoteCount?: number;
  previewChangedBy?: string;
  className?: string;
}) {
  const hasData =
    directorName || (activeLockCount ?? 0) > 0 || (openNoteCount ?? 0) > 0 || previewChangedBy;
  if (!hasData) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap gap-1 bg-gradient-to-b from-black/60 to-transparent px-ubos-3 py-ubos-2',
        className,
      )}
    >
      <p className={cn(ubosTypographyClasses.metadata, 'w-full text-ubos-fg-muted')}>
        Collaboration metadata · Transport unavailable
      </p>
      {directorName ? <StatusBadge variant="live">Director: {directorName}</StatusBadge> : null}
      {(activeLockCount ?? 0) > 0 ? (
        <StatusBadge variant="warning">{activeLockCount} lock(s)</StatusBadge>
      ) : null}
      {(openNoteCount ?? 0) > 0 ? (
        <StatusBadge variant="neutral">{openNoteCount} note(s)</StatusBadge>
      ) : null}
      {previewChangedBy ? (
        <StatusBadge variant="preview">Preview: {previewChangedBy}</StatusBadge>
      ) : null}
    </div>
  );
}
