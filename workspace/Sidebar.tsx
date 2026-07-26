type SidebarProps = {
  active: string;
  onSelect: (workspace: string) => void;
};

export function Sidebar({ active, onSelect }: SidebarProps) {
  const items = [
    { id: "director", label: "Director" },
    { id: "production", label: "Production" },
    { id: "social", label: "Social Fabric" },
    { id: "graphics", label: "Graphics Operator" },
    { id: "replay", label: "Replay Operator" },
    { id: "distribution", label: "Distribution" },
    { id: "automation", label: "Automation" },
    { id: "analytics", label: "Analytics" },
    { id: "media", label: "Media" },
    { id: "inspector", label: "Inspector" }
  ];

  return (
    <div className="workspace-sidebar">
      {items.map((item) => (
        <button
          key={item.id}
          className={
            item.id === active
              ? "sidebar-item sidebar-item--active"
              : "sidebar-item"
          }
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
