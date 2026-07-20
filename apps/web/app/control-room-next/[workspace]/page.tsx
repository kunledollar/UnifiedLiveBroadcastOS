import { notFound } from 'next/navigation';
import { isPrototypeWorkspace, PrototypeWorkspaceView } from '../../control-room/ubos-next/PrototypeWorkspaceView';

export function generateStaticParams() {
  return ['director', 'solo-streamer', 'technical-director', 'audio-engineer', 'graphics-operator', 'replay-operator', 'streaming-operator', 'monitor-wall', 'compact'].map(workspace => ({ workspace }));
}

export default async function ControlRoomNextWorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  if (!isPrototypeWorkspace(workspace)) notFound();
  return <PrototypeWorkspaceView workspaceId={workspace} />;
}
