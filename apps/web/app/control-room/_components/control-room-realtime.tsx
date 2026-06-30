'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useBroadcastRealtime } from '../../../lib/realtime';
import { RealtimePanel } from './realtime-panel';

export function ControlRoomRealtime({ workspaceId, broadcastId }: { workspaceId: string; broadcastId: string }) {
  const router = useRouter();
  const handleEvent = useCallback(() => {
    router.refresh();
  }, [router]);
  const { status, events } = useBroadcastRealtime({ workspaceId, broadcastId }, handleEvent);
  return <RealtimePanel status={status} events={events} />;
}
