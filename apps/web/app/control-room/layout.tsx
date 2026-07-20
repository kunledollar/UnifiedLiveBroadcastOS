import type { ReactNode } from 'react';
import { UbosNextShell } from './ubos-next/UbosNextShell';

/** Presentation boundary: this shell deliberately does not mount runtime-owned media. */
export default function ControlRoomLayout({ children }: { children: ReactNode }) {
  return <UbosNextShell>{children}</UbosNextShell>;
}
