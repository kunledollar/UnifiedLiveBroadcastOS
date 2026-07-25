'use client';

export function GraphicsParameterEditor({ params }: { params: Record<string, string> }) {
  const entries = Object.entries(params);

  return (
    <div className="gc-parameter-editor flex flex-col overflow-hidden rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Parameters</h4>
      {entries.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-ubos-fg-muted">No parameters</div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {entries.map(([key, value]) => (
            <div key={key} className="gc-param-item flex flex-col gap-0.5">
              <label className="text-[9px] font-bold uppercase tracking-wide text-ubos-fg-secondary">{key}</label>
              <input
                type="text"
                defaultValue={value as string}
                className="w-full rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-[10px] text-ubos-fg-secondary outline-none focus:border-ubos-graphics-border focus:ring-1 focus:ring-ubos-graphics-muted"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
