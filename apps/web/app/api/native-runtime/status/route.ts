import { NextResponse } from 'next/server';
import { getNativeRuntimeStatus } from '../../../../lib/native-runtime/ffmpeg';

export async function GET() {
  return NextResponse.json(await getNativeRuntimeStatus());
}
