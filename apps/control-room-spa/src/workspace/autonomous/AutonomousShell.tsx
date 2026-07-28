'use client';

import { useState, type ReactNode } from 'react';
import { AutonomousProvider } from './AutonomousProvider';
import { AutonomousUI } from './AutonomousUI';

export function AutonomousShell({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AutonomousProvider>
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
    </AutonomousProvider>
  );
}
