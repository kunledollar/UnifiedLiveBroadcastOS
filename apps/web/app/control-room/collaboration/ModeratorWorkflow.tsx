'use client';

import type { ChatMessage } from '@ubos/shared';
import { ChatModerationStatus } from '@ubos/shared';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationEmptyState } from './CollaborationEmptyState';

export function ModeratorWorkflow({
  messages,
  chatConnected = false,
  className,
}: {
  messages: ChatMessage[];
  chatConnected?: boolean;
  className?: string;
}) {
  if (!chatConnected) {
    return (
      <CollaborationEmptyState
        message="Chat not connected"
        {...(className ? { className } : {})}
      />
    );
  }

  if (!messages.length) {
    return (
      <CollaborationEmptyState
        message="No messages"
        {...(className ? { className } : {})}
      />
    );
  }

  const flagged = messages.filter((message) => message.moderationStatus === ChatModerationStatus.Held);
  const visible = messages.filter((message) => message.moderationStatus === ChatModerationStatus.Visible);

  return (
    <div className={cn('space-y-ubos-2', className)}>
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        Moderator tools unavailable · Metadata display only
      </p>
      {flagged.length ? (
        <section>
          <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>
            Flagged ({flagged.length})
          </h4>
          {flagged.slice(0, 5).map((message) => (
            <MessageRow key={message.id} message={message} variant="warning" />
          ))}
        </section>
      ) : null}
      <section>
        <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>
          Recent ({visible.length})
        </h4>
        {visible.length ? (
          visible.slice(0, 8).map((message) => <MessageRow key={message.id} message={message} />)
        ) : (
          <CollaborationEmptyState message="No approved messages" className="min-h-[3rem]" />
        )}
      </section>
    </div>
  );
}

function MessageRow({
  message,
  variant = 'neutral',
}: {
  message: ChatMessage;
  variant?: 'neutral' | 'warning';
}) {
  return (
    <div className="mb-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-1.5">
      <div className="flex items-center justify-between gap-ubos-2">
        <span className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
          {message.authorName}
        </span>
        <StatusBadge variant={variant}>{message.platform}</StatusBadge>
      </div>
      <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-secondary')}>{message.body}</p>
    </div>
  );
}
