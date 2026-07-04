'use client';

import type { ReactNode } from 'react';
import { OutputViewRenderer } from '../workspace/OutputViewRenderer';
import { monitorSafeAreaProps, type WorkspaceMonitorContext } from './workspace-monitor-context';
import { ResizableSplit } from './ResizableSplit';
import { MultiViewRenderer } from './MultiViewRenderer';
import { MonitorGrid } from './MonitorGrid';
import { WorkspacePanel, WorkspacePanelEmpty } from './WorkspacePanel';
import type { ProfessionalWorkspaceId } from './workspace-types';
import { DigitalAudioConsole } from '../audio-console/DigitalAudioConsole';
import { EngineWorkspace } from '../engine';
import type { AudioNode } from '@ubos/shared';
import type { OutputViewMode } from '../workspace/monitor-state';

export type WorkspaceReplayPanels = {
  clipBrowser?: ReactNode;
  playlist?: ReactNode;
  replay?: ReactNode;
};

function DirectorWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  const safeAreas = monitorSafeAreaProps(context);
  const graphProps = context.graph ? { graph: context.graph } : {};
  return (
    <ResizableSplit
      initialRatio={0.74}
      primary={
        <OutputViewRenderer
          mode="program"
          programScene={context.programScene}
          previewScene={context.previewScene}
          routes={context.routes}
          layoutPreset={context.layoutPreset}
          guests={context.guests}
          channels={context.channels}
          healthMetrics={context.healthMetrics}
          {...graphProps}
          healthFps={context.healthFps}
          {...safeAreas}
          programGraphicsLayers={context.programGraphicsLayers ?? []}
          previewGraphicsLayers={context.previewGraphicsLayers ?? []}
          programMediaOverlayItems={context.programMediaOverlayItems ?? []}
          previewMediaOverlayItems={context.previewMediaOverlayItems ?? []}
          {...(context.collaborationDirectorName
            ? { collaborationDirectorName: context.collaborationDirectorName }
            : {})}
          {...(context.collaborationLockCount !== undefined
            ? { collaborationLockCount: context.collaborationLockCount }
            : {})}
          {...(context.collaborationOpenNoteCount !== undefined
            ? { collaborationOpenNoteCount: context.collaborationOpenNoteCount }
            : {})}
          {...(context.collaborationPreviewChangedBy
            ? { collaborationPreviewChangedBy: context.collaborationPreviewChangedBy }
            : {})}
          {...(context.automationCurrentSegmentName
            ? { automationCurrentSegmentName: context.automationCurrentSegmentName }
            : {})}
          {...(context.automationNextSegmentName
            ? { automationNextSegmentName: context.automationNextSegmentName }
            : {})}
          {...(context.automationModeLabel
            ? { automationModeLabel: context.automationModeLabel }
            : {})}
        />
      }
      secondary={
        <ResizableSplit
          direction="vertical"
          initialRatio={0.55}
          primary={
            <WorkspacePanel title="Operations" subtitle="Production overview" compact>
              <WorkspacePanelEmpty message="Run-down unavailable." />
            </WorkspacePanel>
          }
          secondary={<MultiViewRenderer cell={{ kind: 'preview', compact: true }} context={context} />}
        />
      }
    />
  );
}

function ProducerWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  return (
    <MonitorGrid mode="producer-dashboard" programDominant>
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <WorkspacePanel key="guests" title="Guests" compact>
          {context.guests.length ? (
            <ul className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
              {context.guests.map((guest) => (
                <li key={guest.id} className="rounded-ubos-sm bg-ubos-midnight px-2 py-1">
                  {guest.displayName} · {guest.status}
                </li>
              ))}
            </ul>
          ) : (
            <WorkspacePanelEmpty message="No guests configured." />
          )}
        </WorkspacePanel>,
        <WorkspacePanel key="outputs" title="Outputs" compact>
          <WorkspacePanelEmpty message="Outputs not configured." />
        </WorkspacePanel>,
        <WorkspacePanel key="graphics" title="Graphics" compact>
          <WorkspacePanelEmpty message="Graphics unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="inspector" title="Inspector" compact>
          <WorkspacePanelEmpty message="Inspector data unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="chat" title="Chat" compact>
          <WorkspacePanelEmpty message="Chat unavailable." />
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function PodcastWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  return (
    <MonitorGrid mode="podcast-grid" programDominant>
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <MultiViewRenderer key="g1" cell={{ kind: 'guest', guestIndex: 0, label: 'Guest 1' }} context={context} />,
        <MultiViewRenderer key="g2" cell={{ kind: 'guest', guestIndex: 1, label: 'Guest 2' }} context={context} />,
        <WorkspacePanel key="audio" title="Audio" compact>
          <WorkspacePanelEmpty message="Audio routing unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="chat" title="Chat" compact>
          <WorkspacePanelEmpty message="Chat unavailable." />
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function InterviewWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  return (
    <MonitorGrid mode="dual-view">
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <MultiViewRenderer key="preview" cell={{ kind: 'preview' }} context={context} />,
      ]}
    </MonitorGrid>
  );
}

function VerticalWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  const safeAreas = monitorSafeAreaProps(context);
  const graphProps = context.graph ? { graph: context.graph } : {};
  const sharedProps = {
    programScene: context.programScene,
    previewScene: context.previewScene,
    routes: context.routes,
    layoutPreset: context.layoutPreset,
    guests: context.guests,
    channels: context.channels,
    healthMetrics: context.healthMetrics,
    ...graphProps,
    healthFps: context.healthFps,
    ...safeAreas,
  };
  return (
    <MonitorGrid mode="vertical-split">
      {[
        <OutputViewRenderer key="vertical" mode="vertical" {...sharedProps} />,
        <OutputViewRenderer key="horizontal" mode="horizontal" {...sharedProps} />,
        <MultiViewRenderer key="preview" cell={{ kind: 'preview', compact: true }} context={context} />,
        <WorkspacePanel key="chat" title="Comments" compact>
          <WorkspacePanelEmpty message="Comments unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="media" title="Media" compact>
          <WorkspacePanelEmpty message="Media not configured." />
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function SportsWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  return (
    <MonitorGrid mode="quad-view" programDominant>
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <MultiViewRenderer key="replay" cell={{ kind: 'replay', label: 'Replay' }} context={context} />,
        <WorkspacePanel key="score" title="Scoreboard" compact>
          <WorkspacePanelEmpty message="Scoreboard unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="clock" title="Clock" compact>
          <WorkspacePanelEmpty message="Clock unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="graphics" title="Graphics" compact>
          <WorkspacePanelEmpty message="Graphics unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="stats" title="Stats" compact>
          <WorkspacePanelEmpty message="Stats unavailable." />
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function NewsWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  return (
    <MonitorGrid mode="producer-dashboard" programDominant>
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <WorkspacePanel key="prompter" title="Teleprompter" compact>
          <WorkspacePanelEmpty message="Teleprompter unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="breaking" title="Breaking News" compact>
          <WorkspacePanelEmpty message="Breaking news feed unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="ticker" title="Ticker" compact>
          <WorkspacePanelEmpty message="Ticker unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="graphics" title="Graphics" compact>
          <WorkspacePanelEmpty message="Graphics unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="outputs" title="Outputs" compact>
          <WorkspacePanelEmpty message="Outputs not configured." />
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function ReplayWorkspaceLayout({
  context,
  replayPanels,
}: {
  context: WorkspaceMonitorContext;
  replayPanels?: WorkspaceReplayPanels;
}) {
  return (
    <MonitorGrid mode="replay-focus" programDominant>
      {[
        <MultiViewRenderer key="program" cell={{ kind: 'program' }} context={context} />,
        <MultiViewRenderer key="replay" cell={{ kind: 'replay', label: 'Replay' }} context={context} />,
        <WorkspacePanel key="clips" title="Clip Browser" compact>
          {replayPanels?.clipBrowser ?? <WorkspacePanelEmpty message="Replay not active." />}
        </WorkspacePanel>,
        <WorkspacePanel key="playlist" title="Playlist" compact>
          {replayPanels?.playlist ?? <WorkspacePanelEmpty message="Playlist unavailable." />}
        </WorkspacePanel>,
        <WorkspacePanel key="slowmo" title="Slow Motion" compact>
          <WorkspacePanelEmpty message="Slow motion unavailable." />
        </WorkspacePanel>,
        <WorkspacePanel key="markers" title="Markers" compact>
          {replayPanels?.replay ?? <WorkspacePanelEmpty message="Markers unavailable." />}
        </WorkspacePanel>,
      ]}
    </MonitorGrid>
  );
}

function AudioWorkspace({
  context,
  graphChannels = [],
}: {
  context: WorkspaceMonitorContext;
  graphChannels?: AudioNode[];
}) {
  return (
    <ResizableSplit
      direction="vertical"
      initialRatio={0.32}
      minPrimary={0.25}
      maxPrimary={0.45}
      primary={<MultiViewRenderer cell={{ kind: 'program', compact: true }} context={context} />}
      secondary={
        <DigitalAudioConsole
          channels={context.channels}
          graphChannels={graphChannels}
          className="h-full"
        />
      }
    />
  );
}

function RemoteProductionWorkspace({ context }: { context: WorkspaceMonitorContext }) {
  const safeAreas = monitorSafeAreaProps(context);
  const graphProps = context.graph ? { graph: context.graph } : {};
  return (
    <MonitorGrid mode="quad-view">
      {[
        <OutputViewRenderer
          key="confidence"
          mode="confidence"
          programScene={context.programScene}
          previewScene={context.previewScene}
          routes={context.routes}
          layoutPreset={context.layoutPreset}
          guests={context.guests}
          channels={context.channels}
          healthMetrics={context.healthMetrics}
          {...graphProps}
          healthFps={context.healthFps}
          {...safeAreas}
        />,
        <MultiViewRenderer key="program" cell={{ kind: 'program', compact: true }} context={context} />,
        <MultiViewRenderer key="preview" cell={{ kind: 'preview', compact: true }} context={context} />,
        <MultiViewRenderer key="aux" cell={{ kind: 'aux', label: 'Aux' }} context={context} />,
      ]}
    </MonitorGrid>
  );
}

function CustomWorkspace({ context, viewMode }: { context: WorkspaceMonitorContext; viewMode: OutputViewMode }) {
  const safeAreas = monitorSafeAreaProps(context);
  const graphProps = context.graph ? { graph: context.graph } : {};
  return (
    <OutputViewRenderer
      mode={viewMode}
      programScene={context.programScene}
      previewScene={context.previewScene}
      routes={context.routes}
      layoutPreset={context.layoutPreset}
      guests={context.guests}
      channels={context.channels}
      healthMetrics={context.healthMetrics}
      {...graphProps}
      healthFps={context.healthFps}
      {...safeAreas}
    />
  );
}

export function WorkspaceCenterLayout({
  workspaceId,
  context,
  viewMode,
  graphChannels = [],
  graphicsContent,
  mediaContent,
  replayPanels,
  collaborationContent,
  automationContent,
  aiContent,
  distributionContent,
  deviceContent,
  engineContent,
}: {
  workspaceId: ProfessionalWorkspaceId;
  context: WorkspaceMonitorContext;
  viewMode: OutputViewMode;
  graphChannels?: AudioNode[];
  graphicsContent?: ReactNode;
  mediaContent?: ReactNode;
  replayPanels?: WorkspaceReplayPanels;
  collaborationContent?: ReactNode;
  automationContent?: ReactNode;
  aiContent?: ReactNode;
  distributionContent?: ReactNode;
  deviceContent?: ReactNode;
  engineContent?: ReactNode;
}) {
  switch (workspaceId) {
    case 'director':
      return <DirectorWorkspace context={context} />;
    case 'producer':
      return <ProducerWorkspace context={context} />;
    case 'podcast':
      return <PodcastWorkspace context={context} />;
    case 'interview':
      return <InterviewWorkspace context={context} />;
    case 'vertical-creator':
      return <VerticalWorkspace context={context} />;
    case 'sports':
      return <SportsWorkspace context={context} />;
    case 'news':
      return <NewsWorkspace context={context} />;
    case 'replay':
      return <ReplayWorkspaceLayout context={context} {...(replayPanels ? { replayPanels } : {})} />;
    case 'audio-engineer':
      return <AudioWorkspace context={context} graphChannels={graphChannels} />;
    case 'remote-production':
      return collaborationContent ?? <RemoteProductionWorkspace context={context} />;
    case 'graphics-operator':
      return graphicsContent ?? <DirectorWorkspace context={context} />;
    case 'media-operator':
      return mediaContent ?? <DirectorWorkspace context={context} />;
    case 'automation-operator':
      return automationContent ?? <DirectorWorkspace context={context} />;
    case 'ai-operator':
      return aiContent ?? <DirectorWorkspace context={context} />;
    case 'distribution-operator':
      return distributionContent ?? <DirectorWorkspace context={context} />;
    case 'device-operator':
      return deviceContent ?? <DirectorWorkspace context={context} />;
    case 'engine-operator':
      return engineContent ?? <EngineWorkspace />;
    case 'custom':
      return <CustomWorkspace context={context} viewMode={viewMode} />;
    default:
      return <DirectorWorkspace context={context} />;
  }
}
