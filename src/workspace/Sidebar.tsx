export const workspaceIds = [
  "director", "production", "graphics", "replay", "distribution",
  "automation", "analytics", "media", "inspector",
] as const;

export type WorkspaceId = (typeof workspaceIds)[number];

const labels: Record<WorkspaceId, string> = {
  director: "Director",
  production: "Production",
  graphics: "Graphics Operator",
  replay: "Replay",
  distribution: "Distribution",
  automation: "Automation",
  analytics: "Analytics",
  media: "Media",
  inspector: "Inspector",
};

type SidebarProps = { active: WorkspaceId; onSelect: (workspace: WorkspaceId) => void };

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <nav aria-label="Control room workspaces" className="workspace-sidebar">
      {workspaceIds.map((id) => (
        <button
          aria-current={id === active ? "page" : undefined}
          className={id === active ? "sidebar-item sidebar-item--active" : "sidebar-item"}
          key={id}
          onClick={() => onSelect(id)}
          type="button"
        >
          {labels[id]}
        </button>
      ))}
    </nav>
  );
}
