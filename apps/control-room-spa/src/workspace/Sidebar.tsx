import React from "react";

const items = [
  { id: "director", label: "Director" },
  { id: "production", label: "Production" },
  { id: "streaming", label: "Streaming" },
  { id: "graphics", label: "Graphics" },
  { id: "graphics-operator", label: "Graphics Operator" },
  { id: "audio", label: "Audio" },
  { id: "replay", label: "Replay" },
  { id: "media", label: "Media" },
  { id: "inspector", label: "Inspector" },
  { id: "distribution", label: "Distribution" },
  { id: "automation", label: "Automation" }
];

export function Sidebar({
  active,
  onSelect
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  console.log("Sidebar rendered. Active workspace:", active);

  return (
    <div
      style={{
        width: "240px",
        background: "#1a1a1a",
        color: "#fff",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        borderRight: "1px solid #333",
        height: "100vh"
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            padding: "12px",
            background: active === item.id ? "#333" : "#222",
            color: "#fff",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: "6px",
            fontSize: "15px"
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
