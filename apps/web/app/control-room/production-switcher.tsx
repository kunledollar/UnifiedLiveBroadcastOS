'use client';

import type { ReactNode } from 'react';
import type { ProductionSwitchingState, TransitionType } from '@ubos/shared';

const transitionOptions: Array<{
  value: TransitionType | 'dissolve' | 'dip_black' | 'push' | 'slide' | 'zoom';
  label: string;
  supported: boolean;
  mapsTo?: TransitionType;
}> = [
  { value: 'cut', label: 'Cut', supported: true },
  { value: 'fade', label: 'Fade', supported: true },
  { value: 'dissolve', label: 'Dissolve', supported: false, mapsTo: 'fade' },
  { value: 'dip', label: 'Dip to Black', supported: true },
  { value: 'push', label: 'Push', supported: false },
  { value: 'slide', label: 'Slide', supported: false },
  { value: 'zoom', label: 'Zoom', supported: false },
  { value: 'wipe', label: 'Wipe', supported: true },
];

const durationPresets = [100, 250, 300, 500, 1000];

type SwitcherButtonTone = 'program' | 'preview' | 'auto' | 'utility' | 'disabled';

function transitionLabel(value: TransitionType) {
  return transitionOptions.find((option) => option.value === value)?.label ?? value.toUpperCase();
}

function SwitcherButton({
  children,
  onClick,
  title,
  disabled = false,
  tone = 'utility',
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  tone?: SwitcherButtonTone;
}) {
  const toneClasses: Record<SwitcherButtonTone, string> = {
    program:
      'border-red-400/35 bg-red-600 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35),0_0_14px_rgba(220,38,38,0.22)] hover:bg-red-500',
    preview:
      'border-cyan-200/45 bg-cyan-300 text-slate-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.32),0_0_18px_rgba(103,232,249,0.22)] hover:bg-cyan-200',
    auto: 'border-amber-300/30 bg-amber-400/85 text-slate-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] hover:bg-amber-300',
    utility:
      'border-slate-700/70 bg-slate-900/80 text-slate-300 shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)] hover:bg-slate-800 hover:text-slate-100',
    disabled: 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`h-10 rounded border px-3 font-mono text-[11px] font-black uppercase tracking-[0.16em] transition ${toneClasses[disabled ? 'disabled' : tone]}`}
    >
      {children}
    </button>
  );
}

function TransitionSelector({
  value,
  onChange,
}: {
  value: TransitionType;
  onChange: (value: TransitionType) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
      Transition
      <select
        aria-label="Transition type"
        className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 font-mono text-[11px] font-bold uppercase text-slate-100 outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value as TransitionType)}
      >
        {transitionOptions.map((option) => (
          <option
            key={option.value}
            value={option.supported ? option.value : (option.mapsTo ?? value)}
          >
            {option.label}
            {option.supported ? '' : ' — planned'}
          </option>
        ))}
      </select>
    </label>
  );
}

function TransitionDuration({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const presetValue = durationPresets.includes(value) ? String(value) : 'custom';
  return (
    <div className="grid gap-1">
      <label
        className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"
        htmlFor="transition-duration"
      >
        Duration
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-1">
        <select
          id="transition-duration"
          aria-label="Transition duration preset"
          className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 font-mono text-[11px] font-bold uppercase text-slate-100 outline-none focus:border-cyan-300"
          value={presetValue}
          onChange={(event) => {
            if (event.target.value !== 'custom') onChange(Number(event.target.value));
          }}
        >
          {durationPresets.map((preset) => (
            <option key={preset} value={preset}>
              {preset} ms
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <input
          aria-label="Custom transition duration milliseconds"
          className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-right font-mono text-[11px] font-bold text-slate-100 outline-none focus:border-cyan-300"
          type="number"
          min={0}
          max={5000}
          step={50}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

function TransitionQueue({ current, next, last }: { current: string; next: string; last: string }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-black/40 bg-black/25 p-1 font-mono text-[10px] uppercase tracking-[0.1em]">
      {[
        ['Current', current],
        ['Next', next],
        ['Last', last],
      ].map(([label, value]) => (
        <div key={label} className="rounded border border-white/5 bg-slate-950/70 px-2 py-1">
          <div className="text-slate-600">{label}</div>
          <div className="truncate font-black text-slate-200">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function ProductionSwitcher({
  productionState,
  programSceneName,
  previewSceneName,
  lastTransitionLabel,
  feedbackLabel,
  onTake,
  onCut,
  onAuto,
  onPrevious,
  onNext,
  onTransitionChange,
  onDurationChange,
}: {
  productionState: ProductionSwitchingState;
  programSceneName: string;
  previewSceneName: string;
  lastTransitionLabel: string;
  feedbackLabel: string | null;
  onTake: () => void;
  onCut: () => void;
  onAuto: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTransitionChange: (value: TransitionType) => void;
  onDurationChange: (value: number) => void;
}) {
  const current = `${transitionLabel(productionState.transitionType)} · ${productionState.transitionDuration} ms`;

  return (
    <section className="shrink-0 rounded-lg border border-slate-800 bg-[linear-gradient(180deg,#0f172a,#020617)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/5 pb-1">
        <div>
          <h2 className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
            Production Switcher
          </h2>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            PGM {programSceneName} ↓ PVW {previewSceneName}
          </p>
        </div>
        <div
          className={`rounded-md border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] transition ${feedbackLabel ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100' : 'border-slate-800 bg-slate-950 text-slate-600'}`}
        >
          {feedbackLabel ?? 'Switcher Ready'}
        </div>
      </div>

      <div className="grid gap-2 xl:grid-cols-[1.25fr_1fr_1fr]">
        <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-1">
          <SwitcherButton tone="program" onClick={onCut}>
            CUT
          </SwitcherButton>
          <SwitcherButton tone="auto" onClick={onAuto}>
            AUTO
          </SwitcherButton>
          <SwitcherButton tone="preview" onClick={onTake}>
            TAKE
          </SwitcherButton>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TransitionSelector
            value={productionState.transitionType}
            onChange={onTransitionChange}
          />
          <TransitionDuration
            value={productionState.transitionDuration}
            onChange={onDurationChange}
          />
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-3 gap-1 opacity-85">
            <SwitcherButton onClick={onPrevious}>Previous</SwitcherButton>
            <SwitcherButton
              disabled
              title="Preview ↔ Program swap is planned; current routing does not expose a swap handler."
            >
              Swap
            </SwitcherButton>
            <SwitcherButton onClick={onNext}>Next</SwitcherButton>
          </div>
          <TransitionQueue current={current} next={current} last={lastTransitionLabel} />
        </div>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-[12rem_1fr]">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-slate-950/70 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          <span>AUTO</span>
          <span className="text-slate-700">3</span>
          <span className="text-slate-700">2</span>
          <span className="text-slate-700">1</span>
          <span className="text-cyan-200">TAKE</span>
        </div>
        <details className="rounded-lg border border-white/5 bg-slate-950/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
          <summary className="cursor-pointer font-black text-slate-300">Keyboard Shortcuts</summary>
          <div className="mt-2 grid gap-1 sm:grid-cols-6">
            <span>Space → TAKE</span>
            <span>C → CUT</span>
            <span>A → AUTO</span>
            <span>1–9 → Scene</span>
            <span>F → Fade</span>
            <span>M → Mute route</span>
          </div>
        </details>
      </div>
    </section>
  );
}
