import type { WorkspacePluginViewProps } from './workspace-plugin.js';

export const createWorkspacePanel = (label: string) => function WorkspacePanel({ plugin, children }: WorkspacePluginViewProps) {
  return (
    <section className="ubos-plugin-panel">
      <p>ACTIVE WORKSPACE · {plugin.title.toUpperCase()}</p>
      <h1>{label}</h1>
      {children ?? <p>{plugin.description}. This operational surface is isolated from Program and Preview ownership.</p>}
    </section>
  );
};

export const createWorkspaceInspector = (label: string) => function WorkspaceInspector({ plugin }: WorkspacePluginViewProps) {
  return (
    <section>
      <p className="ubos-dock-eyebrow">INSPECTOR</p>
      <b>{label}</b>
      <p>{plugin.permissions.join(' · ')}</p>
    </section>
  );
};

export const createWorkspaceWorkbench = (tabs: readonly string[]) => function WorkspaceWorkbench({ plugin }: WorkspacePluginViewProps) {
  return (
    <section>
      <p className="ubos-dock-eyebrow">{plugin.title.toUpperCase()} WORKBENCH</p>
      <div className="ubos-workbench-tabs">
        {tabs.map((tab) => <button key={tab} type="button">{tab}</button>)}
      </div>
    </section>
  );
};
