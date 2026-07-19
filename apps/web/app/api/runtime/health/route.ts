import { NextResponse } from 'next/server';
import { runtimeManager } from '../../../../lib/runtime/runtime-health';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const retry = new URL(request.url).searchParams.get('retry') === '1';
  const health = retry ? await runtimeManager.retry() : await runtimeManager.check();
  return NextResponse.json(health, { status: health.status === 'blocked' ? 503 : 200 });
}
