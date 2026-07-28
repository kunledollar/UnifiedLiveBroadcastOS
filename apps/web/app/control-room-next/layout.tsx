import type { ReactNode } from 'react';
import { UbosNextShell } from '../control-room/ubos-next/UbosNextShell';

/** Isolated presentation lab: it intentionally mounts no runtime or media owner. */
export default function ControlRoomNextLayout({ children }: { children: ReactNode }) {
  return <UbosNextShell>{children}</UbosNextShell>;
}
