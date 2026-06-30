'use client';

import { broadcastRealtimeRoom, type BroadcastRealtimeEvent, type BroadcastRealtimeRoom } from '@ubos/shared';
import { useEffect, useMemo, useState } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export type BroadcastRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useBroadcastRealtime(room: BroadcastRealtimeRoom, onEvent?: (event: BroadcastRealtimeEvent) => void) {
  const [status, setStatus] = useState<BroadcastRealtimeStatus>('connecting');
  const [events, setEvents] = useState<BroadcastRealtimeEvent[]>([]);
  const roomName = useMemo(() => broadcastRealtimeRoom(room), [room]);

  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    let reconnecting = false;
    let socket: WebSocket | undefined;
    const connect = () => {
      const url = new URL('/realtime/broadcast', apiBaseUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('workspaceId', room.workspaceId);
      url.searchParams.set('broadcastId', room.broadcastId);
      setStatus(reconnecting ? 'reconnecting' : 'connecting');
      socket = new WebSocket(url);
      socket.onopen = () => setStatus('connected');
      socket.onmessage = (message) => {
        const event = JSON.parse(String(message.data)) as BroadcastRealtimeEvent;
        setEvents((current) => [event, ...current].slice(0, 20));
        onEvent?.(event);
      };
      socket.onclose = () => {
        reconnecting = true;
        setStatus('reconnecting');
        retry = setTimeout(connect, 1500);
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { if (retry) clearTimeout(retry); socket?.close(); setStatus('disconnected'); };
  }, [room.workspaceId, room.broadcastId, onEvent]);

  return { status, events, roomName };
}
