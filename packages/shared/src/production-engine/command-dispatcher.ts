import { applyProductionCommand, type ProductionGraph } from '../production-graph.js';
import type { ResourceLock } from './types.js';
import { createGraphMutationPlan } from './graph-adapter.js';
import { resolveExecutionDependencies } from './dependency-resolver.js';
import { resolveResourceLocks } from './lock-resolver.js';
import { createEngineSnapshot } from './snapshot-manager.js';
import { createEngineTransaction } from './transaction-log.js';
import { recordExecutionEvents } from './event-recorder.js';
import type { ExecutionPolicy, ProductionExecutionRequest, ProductionExecutionResult } from './execution-result.js';
import { defaultExecutionPolicy } from './execution-result.js';

export function dispatchProductionCommand(input:{ graph: ProductionGraph; request: ProductionExecutionRequest; locks?: ResourceLock[]; policy?: ExecutionPolicy }): ProductionExecutionResult {
  const { graph, request } = input; const policy = input.policy ?? defaultExecutionPolicy; const before = graph.metadata.revision; const plan = createGraphMutationPlan(graph, request.command); const warnings = [...plan.validation.issues.filter(i=>i.code !== 'RUNTIME_HANDLE_REJECTED' && i.code !== 'UNSUPPORTED_COMMAND').map(i=>i.message)]; const errors = plan.validation.issues.filter(i=>i.code === 'RUNTIME_HANDLE_REJECTED' || i.code === 'UNSUPPORTED_COMMAND').map(i=>i.message);
  if (request.dryRun && !policy.allowDryRun) errors.push('Dry run is disabled by policy');
  const deps = resolveExecutionDependencies(graph, plan); warnings.push(...deps.warnings); if (!deps.ok) errors.push(...deps.errors);
  if (errors.length) return { id:request.id, commandId:request.command.id, status:'rejected', events:[], warnings, errors, graphRevisionBefore:before, graphRevisionAfter:before, containsRuntimeHandles:false, graph, plan };
  const locks = resolveResourceLocks(plan, input.locks); if (!locks.ok) return { id:request.id, commandId:request.command.id, status:'blocked', events:[], warnings, errors: locks.blocked.map(l=>`${l.target} locked by ${l.owner}: ${l.reason}`), graphRevisionBefore:before, graphRevisionAfter:before, containsRuntimeHandles:false, graph, plan };
  if (request.dryRun) return { id:request.id, commandId:request.command.id, status:'dry_run', events:[], warnings, errors:[], graphRevisionBefore:before, graphRevisionAfter:before, containsRuntimeHandles:false, graph, plan };
  const transition = applyProductionCommand(graph, request.command as never); if (!transition.accepted) return { id:request.id, commandId:request.command.id, status:'rejected', events:transition.events, warnings, errors:transition.errors, graphRevisionBefore:before, graphRevisionAfter:before, containsRuntimeHandles:false, graph, plan };
  const snapshot = createEngineSnapshot(transition.nextGraph, request.timestamp); const transaction = createEngineTransaction({ commandId:request.command.id, operatorId:request.operatorId, timestamp:request.timestamp, status:'applied', graphRevisionBefore:before, graphRevisionAfter:transition.nextRevision, reversible:plan.reversible, warnings, errors:[] }); const events = recordExecutionEvents(request.command as never, transition.nextGraph, before, transition.nextRevision);
  return { id:request.id, commandId:request.command.id, status:'applied', events, transaction, snapshot, warnings, errors:[], graphRevisionBefore:before, graphRevisionAfter:transition.nextRevision, containsRuntimeHandles:false, graph:transition.nextGraph, plan };
}
