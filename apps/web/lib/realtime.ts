'use client';

import { broadcastRealtimeRoom, type BroadcastRealtimeEvent, type BroadcastRealtimeRoom } from '@ubos/shared';
import { useEffect, useMemo, useState } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export type BroadcastRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'api-offline';

async function isRealtimeApiReachable(signal: AbortSignal): Promise<boolean> {
  try {
    await fetch(apiBaseUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    console.info('[UBOS realtime] API offline; realtime sync disabled for this browser session.', {
      apiBaseUrl,
    });
    return false;
  }
}

export function useBroadcastRealtime(room: BroadcastRealtimeRoom, onEvent?: (event: BroadcastRealtimeEvent) => void) {
  const [status, setStatus] = useState<BroadcastRealtimeStatus>('connecting');
  const [events, setEvents] = useState<BroadcastRealtimeEvent[]>([]);
  const roomName = useMemo(() => broadcastRealtimeRoom(room), [room]);

  useEffect(() => {
    let socket: WebSocket | undefined;
    let disposed = false;
    const reachability = new AbortController();

    const connect = async () => {
      if (disposed) return;
      setStatus('connecting');
      const apiReachable = await isRealtimeApiReachable(reachability.signal);
      if (disposed) return;
      if (!apiReachable) {
        setStatus('api-offline');
        return;
      }

      const url = new URL('/realtime/broadcast', apiBaseUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('workspaceId', room.workspaceId);
      url.searchParams.set('broadcastId', room.broadcastId);
      try {
        socket = new WebSocket(url);
      } catch (error) {
        console.info('[UBOS realtime] WebSocket unavailable; running without realtime API.', { error });
        setStatus('api-offline');
        return;
      }
      socket.onopen = () => setStatus('connected');
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(String(message.data)) as BroadcastRealtimeEvent;
          setEvents((current) => [event, ...current].slice(0, 20));
          onEvent?.(event);
        } catch (error) {
          console.warn('[UBOS realtime] Ignored malformed realtime event.', { error });
        }
      };
      socket.onclose = () => {
        if (disposed) return;
        setStatus('api-offline');
      };
      socket.onerror = () => {
        socket?.close();
      };
    };
    void connect();
    return () => {
      disposed = true;
      reachability.abort();
      socket?.close();
      setStatus('disconnected');
    };
  }, [room.workspaceId, room.broadcastId, onEvent]);

  return { status, events, roomName };
}
