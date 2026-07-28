import { createBroadcastIoManifest, inspectDestination } from '@ubos/shared';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';

const manifest = createBroadcastIoManifest();
const selected = manifest.destinations[0]!;
const inspector = inspectDestination(manifest, selected.id)!;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <BroadcastPanel>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="space-y-1 text-sm text-ubos-fg-muted">{children}</div>
    </BroadcastPanel>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><span>{label}</span><span className="text-ubos-fg-primary">{value}</span></div>;
}

export default function BroadcastIoPage() {
  return (
    <main className="space-y-ubos-3 p-ubos-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-ubos-accent">UBOS Version 3.13</p>
          <h1 className="text-xl font-semibold">Professional Broadcast I/O Engine</h1>
          <p className="text-sm text-ubos-fg-muted">Metadata-first source, destination, routing, protocol, status and inspector models.</p>
        </div>
        <StatusBadge variant="warning">Metadata only · no runtime sockets</StatusBadge>
      </div>
      <div className="grid gap-ubos-3 lg:grid-cols-3">
        <Panel title="Inputs">
          <Row label="Supported inputs" value={manifest.inputs.length} />
          <p>{manifest.inputs.map((input) => input.name).join(' · ')}</p>
        </Panel>
        <Panel title="Outputs">
          <Row label="Destinations" value={manifest.destinations.length} />
          <Row label="Runtime sockets persisted" value={String(manifest.containsRuntimeSockets)} />
          <Row label="Transport objects persisted" value={String(manifest.containsRuntimeTransportObjects)} />
        </Panel>
        <Panel title="Routing Matrix">
          {manifest.routes.map((route) => <Row key={route.id} label={route.source} value={route.destinationId} />)}
        </Panel>
        <Panel title="Destination List">
          {manifest.destinations.map((destination) => <Row key={destination.id} label={destination.name} value={`${destination.protocol.toUpperCase()} · ${destination.status}`} />)}
        </Panel>
        <Panel title="Protocol Settings">
          <Row label="Host" value={selected.protocolSettings.host} />
          <Row label="Port" value={selected.protocolSettings.port} />
          <Row label="Encryption" value={selected.protocolSettings.encryption} />
          <Row label="Retries" value={selected.protocolSettings.retries} />
          <Row label="Reconnect" value={String(selected.protocolSettings.reconnect)} />
          <Row label="Bandwidth" value={`${selected.protocolSettings.bandwidthKbps} Kbps`} />
        </Panel>
        <Panel title="Status">
          <Row label="Connected" value={selected.runtime.status} />
          <Row label="Dropped frames" value={selected.runtime.droppedFrames} />
          <Row label="Packets lost" value={selected.runtime.packetsLost} />
          <Row label="Current bitrate" value={`${selected.runtime.currentBitrateKbps} Kbps`} />
          <Row label="Current FPS" value={selected.runtime.currentFps} />
          <Row label="Latency" value={`${selected.runtime.latencyMs} ms`} />
          <Row label="Reconnect attempts" value={selected.runtime.reconnectAttempts} />
          <Row label="Health" value={selected.runtime.health} />
        </Panel>
        <Panel title="Inspector">
          <Row label="Destination" value={inspector.destination.name} />
          <Row label="Protocol" value={inspector.protocol.toUpperCase()} />
          <Row label="Encoder" value={`${inspector.encoder.codec} ${inspector.encoder.resolution}@${inspector.encoder.fps}`} />
          <Row label="Audio channels" value={inspector.encoder.audioChannels} />
          <Row label="Health samples" value={inspector.healthHistory.length} />
          <pre className="mt-2 overflow-auto rounded bg-black/20 p-2 text-xs">{JSON.stringify(inspector.packetStatistics, null, 2)}</pre>
        </Panel>
      </div>
    </main>
  );
}
