'use client';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

const metadataOnly = 'Metadata only · No execution runtime connected · No media side effects';
function EngineCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <BroadcastPanel variant="inset" padding={false} className="min-h-0 overflow-hidden"><div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5"><h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>{title}</h3><p className="text-ubos-metadata text-ubos-fg-muted">{metadataOnly}</p></div><div className="ubos-scroll max-h-72 overflow-auto p-ubos-2 text-ubos-caption text-ubos-fg-secondary">{children}</div></BroadcastPanel>;
}
export function ExecutionConsole() { return <EngineCard title="Execution Console"><div className="flex items-center justify-between"><span>Latest command status</span><StatusBadge variant="neutral">No command</StatusBadge></div><p>Queue status: idle metadata queue</p><p>Last validation error: none recorded</p></EngineCard>; }
export function CommandDispatcherPanel() { return <EngineCard title="Command Dispatcher"><p>Supported metadata commands: preview/program switching, source metadata, graphics/media staging, output routing, automation cue metadata.</p><p>Unsupported commands are rejected honestly with no runtime fallback.</p></EngineCard>; }
export function GraphMutationPlanPanel() { return <EngineCard title="Graph Mutation Plan"><p>Mutation plans are deterministic, reversible metadata-only descriptions.</p><p>Runtime handles, DOM nodes, sockets, stream keys, and functions are rejected.</p></EngineCard>; }
export function TransactionLogPanel() { return <EngineCard title="Transaction Log"><p>Append-only transaction model ready.</p><p>Latest transaction: none in this UI session.</p></EngineCard>; }
export function SnapshotViewer() { return <EngineCard title="Snapshot Viewer"><p>Snapshots include program/preview scenes, sources, graphics, media, outputs, automation, collaboration, distribution, devices, and revision metadata.</p></EngineCard>; }
export function ReplayReconstructionPanel() { return <EngineCard title="Replay Reconstruction"><p>Replay readiness: ready for metadata event reconstruction.</p><p>Unknown events are skipped with warnings.</p></EngineCard>; }
export function LockResolverPanel() { return <EngineCard title="Lock Resolver"><p>Lock status: no active metadata locks in this UI session.</p><p>Locked resources block mutation application before graph changes.</p></EngineCard>; }
export function DependencyResolverPanel() { return <EngineCard title="Dependency Resolver"><p>Dependency status: validated before mutation application.</p><p>Missing scenes, destinations, assets, or cues reject unsafe commands.</p></EngineCard>; }
export function Phase17ExecutionPanels() { return <><ExecutionConsole /><CommandDispatcherPanel /><GraphMutationPlanPanel /><TransactionLogPanel /><SnapshotViewer /><ReplayReconstructionPanel /><LockResolverPanel /><DependencyResolverPanel /></>; }
