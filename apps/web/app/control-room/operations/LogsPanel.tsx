'use client';

import { AssetList, AssetRow, ConsoleSection, StatusBadge } from '@ubos/ui';
import type { ChatMessage } from '@ubos/shared';
import type { BroadcastRealtimeEvent } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';
import { ClientTime } from '../_components/client-time';

export function LogsPanel({
  messages = [],
  events = [],
}: {
  messages?: ChatMessage[];
  events?: BroadcastRealtimeEvent[];
}) {
  const collaborationEvents = events.filter((event) => !event.eventType.startsWith('webrtc:'));
  const hasContent = messages.length > 0 || collaborationEvents.length > 0;

  if (!hasContent) {
    return (
      <OperationsPanel title="Logs">
        <p className="text-ubos-caption text-ubos-fg-muted">No recent events.</p>
        <p className="text-ubos-metadata text-ubos-fg-muted">
          Logs unavailable until activity is recorded.
        </p>
      </OperationsPanel>
    );
  }

  return (
    <OperationsPanel title="Logs">
      {collaborationEvents.length ? (
        <ConsoleSection title="Production Events">
          <AssetList isEmpty={false} className="max-h-48">
            {collaborationEvents.slice(0, 20).map((event, index) => (
              <AssetRow
                key={`${event.timestamp}-${event.eventType}-${index}`}
                title={event.eventType}
                subtitle={`${event.entityType}${event.entityId ? ` · ${event.entityId}` : ''}`}
                status={
                  <StatusBadge variant="neutral">
                    <ClientTime iso={event.timestamp} />
                  </StatusBadge>
                }
              />
            ))}
          </AssetList>
        </ConsoleSection>
      ) : null}

      {messages.length ? (
        <ConsoleSection title="Chat">
          <AssetList isEmpty={false} className="max-h-40">
            {messages.map((message) => (
              <AssetRow
                key={message.id}
                title={message.authorName}
                subtitle={message.body}
                status={<StatusBadge variant="neutral">{message.platform}</StatusBadge>}
              />
            ))}
          </AssetList>
        </ConsoleSection>
      ) : null}
    </OperationsPanel>
  );
}
