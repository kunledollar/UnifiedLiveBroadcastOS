'use client';

import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { createClusterDemoRuntime } from './cluster-seed';

const runtime = createClusterDemoRuntime();
const session = runtime.session;
const health = runtime.health();

export function ClusterWorkspace({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-ubos-2">
      <ConsoleSection title="Cluster Dashboard">
        <InspectorRow label="Nodes" value={String(health.nodeCount)} />
        <InspectorRow label="Active controller" value={health.activeControllerId ?? 'None'} />
        <InspectorRow label="Cluster health" value={<StatusBadge variant={health.status === 'healthy' ? 'success' : 'warning'}>{health.status}</StatusBadge>} />
        <InspectorRow label="Failover" value={<StatusBadge variant={health.failoverStatus === 'active' ? 'warning' : 'neutral'}>{health.failoverStatus}</StatusBadge>} />
      </ConsoleSection>
      <ConsoleSection title="Node Browser">
        {session.nodes.map((node) => <InspectorRow key={node.id} label={node.name} value={`${node.state} · ${node.roles.join(', ')}`} />)}
      </ConsoleSection>
      {!compact ? <ConsoleSection title="Topology View"><InspectorRow label="Topology" value={`${session.topology.nodeIds.length} nodes · ${session.topology.redundancyGroupIds.length} redundancy groups`} /><InspectorRow label="Metadata contract" value="No sockets · no IP connection attempts · no cloud APIs" /></ConsoleSection> : null}
      <ConsoleSection title="Redundancy Groups">
        {session.redundancyGroups.map((group) => <InspectorRow key={group.id} label={group.name} value={`${group.nodeIds.length} nodes · standby ${group.standbyNodeIds.join(', ')}`} />)}
      </ConsoleSection>
      <ConsoleSection title="Failover Plans">
        {session.failoverPlans.map((plan) => <InspectorRow key={plan.id} label={plan.name} value={<StatusBadge variant="warning">{plan.status}</StatusBadge>} />)}
      </ConsoleSection>
      {!compact ? <ConsoleSection title="Node Inspector"><InspectorRow label="Selected node" value={session.nodes[0]?.name ?? 'None'} /><InspectorRow label="Capabilities" value={session.nodes[0]?.capabilities.join(', ') ?? 'None'} /></ConsoleSection> : null}
      <ConsoleSection title="Cluster Health">
        <InspectorRow label="Standby nodes" value={String(health.standbyNodes)} />
        <InspectorRow label="Degraded nodes" value={String(health.degradedNodes)} />
        <InspectorRow label="Unavailable nodes" value={String(health.unavailableNodes)} />
      </ConsoleSection>
      {!compact ? <ConsoleSection title="Cluster History">{session.history.events.slice(-6).map((event) => <InspectorRow key={event.id} label={event.type} value={event.message} />)}</ConsoleSection> : null}
      <ConsoleSection title="Cluster Runtime Queue">
        <InspectorRow label="Queued commands" value={String(session.queue.length)} />
        <InspectorRow label="Runtime handles" value={<StatusBadge variant="success">Rejected</StatusBadge>} />
      </ConsoleSection>
    </div>
  );
}
