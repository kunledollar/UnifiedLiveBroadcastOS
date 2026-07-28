'use client';

import { useState, type ReactNode } from 'react';
import { AutonomousUI } from './AutonomousUI';

export function AutonomousShell({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children}
      <button
        aria-controls="autonomous-panel"
        aria-expanded={isOpen}
        className="autonomous-shell-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        AI Crew
      </button>
      {isOpen ? <AutonomousUI onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
