'use client';

type Preview = { url: string } | null;

export function GraphicsPreview({ preview }: { preview: Preview }) {
  if (!preview) {
    return (
      <div className="gc-preview gc-empty flex h-full w-full items-center justify-center rounded-lg border border-dashed border-ubos-border-subtle bg-ubos-midnight text-[10px] text-ubos-fg-muted">
        No preview
      </div>
    );
  }

  return (
    <div className="gc-preview relative h-full w-full overflow-hidden rounded-lg border border-ubos-border-subtle bg-black">
      <img
        src={preview.url}
        alt="Graphics Preview"
        className="h-full w-full object-contain"
      />
      {/* Graphics Cyan = visual layers / graphics activation. */}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ubos-graphics-text">
        Preview
      </div>
    </div>
  );
}
