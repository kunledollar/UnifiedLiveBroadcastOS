import { NextResponse } from 'next/server';
import { finalizeNativeRecording } from '../../../../../lib/native-runtime/ffmpeg';

function parseRequest(value: unknown) {
  const input = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  if (typeof input.base64Webm !== 'string' || !input.base64Webm) throw new Error('base64Webm is required.');
  if (typeof input.mimeType !== 'string' || !input.mimeType) throw new Error('mimeType is required.');
  return { base64Webm: input.base64Webm, mimeType: input.mimeType, expectedAudio: input.expectedAudio !== false };
}

export async function POST(request: Request) {
  try {
    const input = parseRequest(await request.json());
    return NextResponse.json({ ok: true, artifact: await finalizeNativeRecording(input) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Native recording failed.' },
      { status: 400 },
    );
  }
}
