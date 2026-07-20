'use client';
import { useEffect, useState, type CSSProperties } from 'react';

function Monitor({ kind }: { kind: 'program' | 'preview' }) {
  const isProgram = kind === 'program';
  return <section className={`ubos-monitor ubos-monitor-${kind}`} data-testid={`ubos-${kind}-monitor`} data-monitor={kind}>
    <header><b>{isProgram ? 'PROGRAM' : 'PREVIEW'}</b><span>{isProgram ? 'LIVE · Host Welcome' : 'NEXT · Product Overview'}</span></header>
    <div><strong>{isProgram ? 'PROGRAM' : 'PREVIEW'}</strong><small>Persistent production surface · 16:9</small></div>
  </section>;
}

/** Owns monitor DOM and presentation state. It deliberately never owns media or switching runtimes. */
export function ProductionRuntimeHost({ programWeight, previewWeight }: { programWeight: number; previewWeight: number }) {
  const [clock, setClock] = useState('00:00:00');
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date().toLocaleTimeString([], { hour12: false })), 1000); return () => window.clearInterval(timer); }, []);
  return <section className="ubos-monitor-host" aria-label="Program and Preview monitors" style={{ '--ubos-program-weight': programWeight, '--ubos-preview-weight': previewWeight } as CSSProperties}>
    <Monitor kind="program" /><Monitor kind="preview" />
    <output className="ubos-production-clock" aria-label="Production clock">{clock}</output>
  </section>;
}
