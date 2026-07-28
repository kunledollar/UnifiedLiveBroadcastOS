import { ClusterRuntime } from '@ubos/shared';

export function createClusterDemoRuntime() {
  const runtime = new ClusterRuntime();
  runtime.registerNode({ id: 'ctrl-main', name: 'Main Control Room', roles: ['controller'], state: 'online', capabilities: ['control'], site: 'Studio A' });
  runtime.registerNode({ id: 'render-remote', name: 'Remote Render Node', roles: ['render_node'], state: 'online', capabilities: ['render'], site: 'Remote' });
  runtime.registerNode({ id: 'standby-backup', name: 'Backup Controller', roles: ['standby_node'], state: 'standby', capabilities: ['standby', 'control'], site: 'Studio B' });
  runtime.registerNode({ id: 'stream-edge', name: 'Streaming Edge', roles: ['streaming_node'], state: 'degraded', capabilities: ['streaming'], site: 'Cloud Control Room' });
  runtime.createRedundancyGroup({ id: 'controllers', name: 'Controller Redundancy', nodeIds: ['ctrl-main', 'standby-backup'], activeNodeId: 'ctrl-main', standbyNodeIds: ['standby-backup'] });
  runtime.activateFailover('controllers', 'ctrl-main', 'standby-backup');
  runtime.enqueue({ type: 'CREATE_CLUSTER_SNAPSHOT', payload: { requestedBy: 'ops-console' } });
  runtime.snapshot();
  return runtime;
}
