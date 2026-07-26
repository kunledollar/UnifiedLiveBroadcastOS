'use client';

type Preview = { url: string } | null;

export function GraphicsPreview({ preview }: { preview: Preview }) {
  if (!preview) {
    return (
      <div className="gc-preview gc-empty flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[#1e2530] bg-[#0a1628] text-[10px] text-[#334155]">
        No preview
      </div>
    );
  }

  return (
    <div className="gc-preview relative h-full w-full overflow-hidden rounded-lg border border-[#1e2530] bg-black">
      <img
        src={preview.url}
        alt="Graphics Preview"
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#7c6af7]">
        Preview
      </div>
    </div>
  );
}
