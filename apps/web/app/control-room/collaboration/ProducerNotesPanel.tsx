'use client';

import type { ProducerNote } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationEmptyState } from './CollaborationEmptyState';

export function ProducerNotesPanel({
  notes,
  persistenceAvailable = false,
  onAddNote,
  onResolveNote,
  className,
}: {
  notes: ProducerNote[];
  persistenceAvailable?: boolean;
  onAddNote?: () => void;
  onResolveNote?: (noteId: string) => void;
  className?: string;
}) {
  const pinned = notes.filter((note) => note.status === 'pinned');
  const open = notes.filter((note) => note.status === 'open');

  if (!notes.length) {
    return (
      <div className={cn('space-y-ubos-2', className)}>
        <CollaborationEmptyState
          message={
            persistenceAvailable ? 'No producer notes' : 'No producer notes · Persistence required'
          }
        />
        {onAddNote ? (
          <BroadcastButton size="sm" variant="secondary" onClick={onAddNote}>
            Add metadata note
          </BroadcastButton>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('space-y-ubos-2', className)}>
      {!persistenceAvailable ? (
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>
          Metadata only · Notes not persisted
        </p>
      ) : null}
      {pinned.length ? (
        <section className="space-y-1">
          <h4 className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Pinned</h4>
          {pinned.map((note) => (
            <NoteRow key={note.id} note={note} {...(onResolveNote ? { onResolve: onResolveNote } : {})} />
          ))}
        </section>
      ) : null}
      {open.length ? (
        <section className="space-y-1">
          <h4 className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Open</h4>
          {open.map((note) => (
            <NoteRow key={note.id} note={note} {...(onResolveNote ? { onResolve: onResolveNote } : {})} />
          ))}
        </section>
      ) : null}
      {onAddNote ? (
        <BroadcastButton size="sm" variant="secondary" onClick={onAddNote}>
          Add note
        </BroadcastButton>
      ) : null}
    </div>
  );
}

function NoteRow({
  note,
  onResolve,
}: {
  note: ProducerNote;
  onResolve?: (noteId: string) => void;
}) {
  return (
    <div className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-2">
      <div className="flex items-start justify-between gap-ubos-2">
        <div className="min-w-0">
          <p className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>{note.text}</p>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            {note.authorName ?? note.authorId} · {note.targetType}/{note.targetLabel ?? note.targetId}
          </p>
        </div>
        <StatusBadge variant={note.status === 'pinned' ? 'preview' : 'neutral'}>{note.status}</StatusBadge>
      </div>
      {note.status === 'open' && onResolve ? (
        <BroadcastButton size="sm" variant="ghost" className="mt-1" onClick={() => onResolve(note.id)}>
          Resolve
        </BroadcastButton>
      ) : null}
    </div>
  );
}
