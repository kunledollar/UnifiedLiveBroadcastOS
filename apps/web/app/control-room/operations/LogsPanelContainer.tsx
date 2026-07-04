'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBroadcastRealtime } from '../../../lib/realtime';
import { LogsPanel } from './LogsPanel';
import type { ChatMessage } from '@ubos/shared';

export function LogsPanelContainer({
  workspaceId,
  broadcastId,
  messages = [],
}: {
  workspaceId: string;
  broadcastId: string;
  messages?: ChatMessage[];
}) {
  const router = useRouter();
  const handleEvent = useCallback(() => {
    router.refresh();
  }, [router]);
  const { events } = useBroadcastRealtime({ workspaceId, broadcastId }, handleEvent);

  return <LogsPanel messages={messages} events={events} />;
}
