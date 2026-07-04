'use client';

import type { RemoteProductionState } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationTimeline } from './CollaborationTimeline';
import { OperatorPresencePanel } from './OperatorPresencePanel';
import { ProducerNotesPanel } from './ProducerNotesPanel';
import { ProductionLocksPanel } from './ProductionLocksPanel';
import type { CollaborationAction } from './collaboration-state';

export function TeamPanel({
  state,
  conflictCount,
  dispatch,
  className,
}: {
  state: RemoteProductionState;
  conflictCount: number;
  dispatch: (action: CollaborationAction) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <BroadcastPanel variant="inset" padding={false} className="border-0 shadow-none">
        <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
          <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Team</h3>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Operators · locks · notes · events
          </p>
        </div>
        <div className="space-y-ubos-3 overflow-y-auto p-ubos-2">
          <section>
            <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>Operators</h4>
            <OperatorPresencePanel
              operators={state.operators}
              collaborationEnabled={state.collaborationEnabled}
            />
          </section>
          <section>
            <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>Locks</h4>
            <ProductionLocksPanel locks={state.locks} conflicts={conflictCount} />
          </section>
          <section>
            <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>Notes</h4>
            <ProducerNotesPanel
              notes={state.notes}
              onAddNote={() =>
                dispatch({
                  type: 'ADD_NOTE',
                  note: {
                    id: `note-${Date.now()}`,
                    authorId: 'local-operator',
                    authorName: 'Local Operator',
                    targetType: 'workspace',
                    targetId: 'control-room',
                    text: 'Team panel metadata note',
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                })
              }
              onResolveNote={(noteId) => dispatch({ type: 'RESOLVE_NOTE', noteId })}
            />
          </section>
          <section>
            <h4 className={cn(ubosTypographyClasses.metadata, 'mb-1 text-ubos-fg-muted')}>Recent events</h4>
            <CollaborationTimeline events={state.events} />
          </section>
        </div>
      </BroadcastPanel>
    </div>
  );
}
