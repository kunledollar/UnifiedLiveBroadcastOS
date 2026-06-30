import { Button, Panel, Badge } from '@ubos/ui';
import { joinGreenRoom } from '../control-room/guest-actions';
import { GuestRealtimeStatus } from './_components/guest-realtime-status';
import { GuestDeviceGreenRoom } from './_components/guest-device-green-room';

export default async function GuestJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,145,178,.24),transparent_34%),#020617] p-5">
      <Panel title="Guest Green Room" action={<Badge tone="warning">Readiness checks</Badge>}>
        <form action={joinGreenRoom} className="w-full max-w-md space-y-4">
          <input
            name="token"
            defaultValue={params.token ?? ''}
            className="w-full rounded-xl border border-white/10 bg-slate-800 p-3 font-mono text-sm"
            placeholder="Invite token"
          />
          <input
            name="displayName"
            className="w-full rounded-xl border border-white/10 bg-slate-800 p-3"
            placeholder="Your display name"
          />
          <label className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm">
            <input name="networkReady" type="checkbox" className="mr-2 accent-cyan-300" />
            Network ready
          </label>
          <input name="userAgent" className="hidden" defaultValue="green-room-browser-check" />
          <GuestDeviceGreenRoom token={params.token ?? ''} />
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
            Guests enter Waiting until all readiness checks are selected, then move to Green Room
            for host admission.
          </div>
          <GuestRealtimeStatus />
          <Button>Join Green Room</Button>
        </form>
      </Panel>
    </main>
  );
}
