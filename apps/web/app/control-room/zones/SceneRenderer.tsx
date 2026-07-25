'use client';

type SceneLayer = {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphics';
  src?: string;
  text?: string;
};

type Scene = {
  id: string;
  name?: string;
  layers?: SceneLayer[];
};

export function SceneRenderer({ scene }: { scene: Scene }) {
  if (!scene.layers || scene.layers.length === 0) {
    return (
      <div className="scene-renderer flex h-full w-full items-center justify-center bg-[#0a1628]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1e3a5f]">
          {scene.name ?? scene.id}
        </span>
      </div>
    );
  }

  return (
    <div className="scene-renderer relative h-full w-full overflow-hidden bg-black">
      {scene.layers.map((layer) => (
        <div key={layer.id} className="scene-layer absolute inset-0 flex items-center justify-center">
          {layer.type === 'video' && layer.src && (
            <video src={layer.src} autoPlay muted loop className="h-full w-full object-cover" />
          )}
          {layer.type === 'image' && layer.src && (
            <img src={layer.src} alt="" className="h-full w-full object-cover" />
          )}
          {layer.type === 'text' && (
            <span className="max-w-full px-4 text-center text-[clamp(12px,2vw,24px)] font-bold text-white">
              {layer.text}
            </span>
          )}
          {layer.type === 'graphics' && (
            <div className="flex h-full w-full items-center justify-center bg-[#7c6af7]/10 text-[10px] text-[#7c6af7]">
              Graphics layer
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
