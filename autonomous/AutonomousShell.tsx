import { AutonomousProvider } from "./AutonomousProvider";
import { AutonomousUI } from "./AutonomousUI";

export function AutonomousShell() {
  return (
    <AutonomousProvider>
      <AutonomousUI />
    </AutonomousProvider>
  );
}
