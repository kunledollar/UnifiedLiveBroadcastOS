'use client';

type Template = { id: string; name: string };

export function GraphicsTemplateBrowser({ templates }: { templates: Template[] }) {
  return (
    <div className="gc-template-browser flex flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Templates</h4>
      {templates.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-[#334155]">No templates</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              className="gc-template-item cursor-pointer rounded bg-[#0a1628] px-2 py-1.5 text-[10px] font-medium text-[#94a3b8] hover:bg-[#7c6af7]/10 hover:text-[#7c6af7]"
            >
              {t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
