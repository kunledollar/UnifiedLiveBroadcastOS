import '../globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'UBOS — External Monitor',
  description: 'UBOS external monitor zone',
};

/**
 * Minimal layout for external pop-out monitor windows.
 * No dock, no shell, no workspace chrome — panel content only.
 */
export default function ExternalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 overflow-hidden bg-black p-0">{children}</body>
    </html>
  );
}
