'use client';

import { useState } from 'react';
import type {
  ChatMessage,
  Guest,
  GuestInvite,
  MediaRoute,
  ProfessionalOperatorRole,
  RemoteProductionState,
} from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { CollaborationTimeline } from './CollaborationTimeline';
import { GuestManagerWorkflow } from './GuestManagerWorkflow';
import { ModeratorWorkflow } from './ModeratorWorkflow';
import { OperatorPresencePanel } from './OperatorPresencePanel';
import { OperatorRoleCard } from './OperatorRoleCard';
import { PermissionsMatrix } from './PermissionsMatrix';
import { ProducerNotesPanel } from './ProducerNotesPanel';
import { ProductionLocksPanel } from './ProductionLocksPanel';
import { RemoteProductionPanel } from './RemoteProductionPanel';
import type { CollaborationAction } from './collaboration-state';
import { roleWorkspaceMappings } from './collaboration-utils';

export function CollaborationWorkspace({
  state,
  guests,
  invites,
  routes,
  messages,
  activeRouteCount,
  outputHealth,
  productionStatus,
  recoveryStatus,
  conflictCount,
  dispatch,
  onAssignGuest,
  onMuteGuest,
  onRemoveGuest,
  className,
}: {
  state: RemoteProductionState;
  guests: Guest[];
  invites: GuestInvite[];
  routes: MediaRoute[];
  messages: ChatMessage[];
  activeRouteCount: number;
  outputHealth: string;
  productionStatus: string;
  recoveryStatus: string;
  conflictCount: number;
  dispatch: (action: CollaborationAction) => void;
  onAssignGuest?: (guestId: string) => void;
  onMuteGuest?: (guestId: string) => void;
  onRemoveGuest?: (guestId: string) => void;
  className?: string;
}) {
  const [selectedRole, setSelectedRole] = useState<ProfessionalOperatorRole>('director');

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Collaboration Workspace
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Team metadata · Presence and permissions UI only
          </p>
        </div>
        <StatusBadge variant={state.collaborationEnabled ? 'success' : 'offline'}>
          {state.collaborationEnabled ? 'Collaboration metadata' : 'Collaboration disabled'}
        </StatusBadge>
      </div>

      <ResizableSplit
        initialRatio={0.28}
        minPrimary={0.2}
        maxPrimary={0.4}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <BroadcastPanel variant="inset" padding={false} className="min-h-0 flex-1 border-0 shadow-none">
              <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Operator Roles</h3>
              </div>
              <div className="space-y-1 overflow-y-auto p-ubos-2">
                {roleWorkspaceMappings.map((mapping) => (
                  <OperatorRoleCard
                    key={mapping.role}
                    role={mapping.role}
                    mapping={mapping}
                    active={selectedRole === mapping.role}
                    onSelect={() => setSelectedRole(mapping.role)}
                  />
                ))}
              </div>
            </BroadcastPanel>
            <PermissionsMatrix selectedRole={selectedRole} />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <BroadcastPanel variant="inset" padding={false} className="min-h-0 flex-1 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Operator Presence</h3>
                  </div>
                  <div className="overflow-y-auto p-ubos-2">
                    <OperatorPresencePanel
                      operators={state.operators}
                      collaborationEnabled={state.collaborationEnabled}
                    />
                  </div>
                </BroadcastPanel>
                <BroadcastPanel variant="inset" padding={false} className="shrink-0 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Production Locks</h3>
                  </div>
                  <div className="p-ubos-2">
                    <ProductionLocksPanel locks={state.locks} conflicts={conflictCount} />
                  </div>
                </BroadcastPanel>
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <BroadcastPanel variant="inset" padding={false} className="min-h-0 flex-1 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Producer Notes</h3>
                  </div>
                  <div className="overflow-y-auto p-ubos-2">
                    <ProducerNotesPanel
                      notes={state.notes}
                      onAddNote={() =>
                        dispatch({
                          type: 'ADD_NOTE',
                          note: {
                            id: `note-${Date.now()}`,
                            authorId: 'local-operator',
                            authorName: 'Local Operator',
                            targetType: 'scene',
                            targetId: 'preview',
                            targetLabel: 'Preview scene',
                            text: 'Metadata-only producer note',
                            status: 'open',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          },
                        })
                      }
                      onResolveNote={(noteId) => dispatch({ type: 'RESOLVE_NOTE', noteId })}
                    />
                  </div>
                </BroadcastPanel>
                <BroadcastPanel variant="inset" padding={false} className="min-h-0 flex-1 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Guest Manager</h3>
                  </div>
                  <div className="overflow-y-auto p-ubos-2">
                    <GuestManagerWorkflow
                      guests={guests}
                      invites={invites}
                      routes={routes}
                      {...(onAssignGuest ? { onAssignToScene: onAssignGuest } : {})}
                      {...(onMuteGuest ? { onMute: onMuteGuest } : {})}
                      {...(onRemoveGuest ? { onRemove: onRemoveGuest } : {})}
                    />
                  </div>
                </BroadcastPanel>
                <BroadcastPanel variant="inset" padding={false} className="min-h-0 flex-1 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Moderator</h3>
                  </div>
                  <div className="overflow-y-auto p-ubos-2">
                    <ModeratorWorkflow
                      messages={messages}
                      chatConnected={messages.length > 0}
                    />
                  </div>
                </BroadcastPanel>
                <RemoteProductionPanel
                  operators={state.operators}
                  guestCount={guests.length}
                  locks={state.locks}
                  activeRouteCount={activeRouteCount}
                  outputHealth={outputHealth}
                  productionStatus={productionStatus}
                  recoveryStatus={recoveryStatus}
                  collaborationEnabled={state.collaborationEnabled}
                />
                <BroadcastPanel variant="inset" padding={false} className="shrink-0 border-0 shadow-none">
                  <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                    <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Timeline</h3>
                  </div>
                  <div className="max-h-32 overflow-y-auto p-ubos-2">
                    <CollaborationTimeline events={state.events} />
                  </div>
                </BroadcastPanel>
              </div>
            }
          />
        }
      />
    </div>
  );
}
