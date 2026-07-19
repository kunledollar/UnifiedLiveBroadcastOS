import { DiagnosticsConsole } from './DiagnosticsConsole';
export const dynamic = 'force-dynamic';
export default function DiagnosticsPage() {
  const enabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_CONTROL_ROOM_DIAGNOSTICS === 'true';
  return enabled ? (
    <DiagnosticsConsole />
  ) : (
    <main className="p-8">Control Room diagnostics are unavailable.</main>
  );
}
