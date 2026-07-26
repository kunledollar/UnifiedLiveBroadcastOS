type SidebarProps = {
  active: string;
  onSelect: (workspace: string) => void;
};

export function Sidebar({ active, onSelect }: SidebarProps) {
  const items = [
    { id: "director", label: "Director" },
    { id: "production", label: "Production" },
    { id: "graphics", label: "Graphics" },
    { id: "replay", label: "Replay" },
    { id: "distribution", label: "Distribution" },
    { id: "automation", label: "Automation" },
    { id: "analytics", label: "Analytics" },
    { id: "media", label: "Media" },
    { id: "inspector", label: "Inspector" }
  ];

  return (
    <div className="ubos-sidebar">
      {items.map((item) => (
        <button
          key={item.id}
          className={
            item.id === active
              ? "ubos-sidebar__item ubos-sidebar__item--active"
              : "ubos-sidebar__item"
          }
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
