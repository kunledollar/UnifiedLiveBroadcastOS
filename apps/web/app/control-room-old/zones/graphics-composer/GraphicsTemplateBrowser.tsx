'use client';

type Template = { id: string; name: string };

export function GraphicsTemplateBrowser({ templates }: { templates: Template[] }) {
  return (
    <div className="gc-template-browser flex flex-col overflow-hidden rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Templates</h4>
      {templates.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-ubos-fg-muted">No templates</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              className="gc-template-item cursor-pointer rounded bg-ubos-midnight px-2 py-1.5 text-[10px] font-medium text-ubos-fg-secondary hover:bg-ubos-graphics-muted hover:text-ubos-graphics-text"
            >
              {t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
