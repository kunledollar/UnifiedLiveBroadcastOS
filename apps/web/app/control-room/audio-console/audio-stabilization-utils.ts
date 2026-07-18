export type SemanticMeterState = {
  left: number;
  right: number;
  peak: number;
  clipping: boolean;
  channels: number;
  sampleRate: number | null;
};

export function clampMeterLevel(level: number | null) {
  return level === null ? 0 : Math.max(0, Math.min(100, Math.round(level)));
}

export function metersSemanticallyEqual<T extends SemanticMeterState>(current: Record<string, T>, next: Record<string, T>) {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) return false;
  return nextKeys.every((key) => {
    const a = current[key];
    const b = next[key];
    return Boolean(
      a &&
        b &&
        a.left === b.left &&
        a.right === b.right &&
        a.peak === b.peak &&
        a.clipping === b.clipping &&
        a.channels === b.channels &&
        a.sampleRate === b.sampleRate,
    );
  });
}
