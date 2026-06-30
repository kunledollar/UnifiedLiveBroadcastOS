import { NextResponse } from 'next/server';
import { broadcastRealtimeEventTypes } from '@ubos/shared';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const body = await request.json();
  if (!broadcastRealtimeEventTypes.includes(body.eventType)) {
    return NextResponse.json(
      { ok: false, error: 'Unsupported realtime event type' },
      { status: 400 },
    );
  }
  const response = await fetch(`${API_URL}/realtime/broadcast/emit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, timestamp: new Date().toISOString() }),
    cache: 'no-store',
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
