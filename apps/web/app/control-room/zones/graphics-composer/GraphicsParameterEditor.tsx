'use client';

export function GraphicsParameterEditor({ params }: { params: Record<string, string> }) {
  const entries = Object.entries(params);

  return (
    <div className="gc-parameter-editor flex flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Parameters</h4>
      {entries.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-[#334155]">No parameters</div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {entries.map(([key, value]) => (
            <div key={key} className="gc-param-item flex flex-col gap-0.5">
              <label className="text-[9px] font-bold uppercase tracking-wide text-[#475569]">{key}</label>
              <input
                type="text"
                defaultValue={value as string}
                className="w-full rounded border border-[#1e2530] bg-[#0a1628] px-2 py-1 text-[10px] text-[#94a3b8] outline-none focus:border-[#7c6af7]/50 focus:ring-1 focus:ring-[#7c6af7]/30"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
