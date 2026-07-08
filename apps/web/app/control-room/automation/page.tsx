// ONE OWNER RULE AUDIT (3.15C/D) — /control-room/automation
//
// Surface type: standalone full-page route (Next.js App Router page).
//   This route renders AutomationPageContent directly and is NOT a panel
//   mounted inside the CommandCenter zone layout.
//
// activatePanel() usage: NOT APPLICABLE.
//   activatePanel() is a Workspace Manager API for revealing docked panels
//   within the CommandCenter shell.  Standalone route pages sit outside that
//   zone system and never need to call activatePanel().
//
// Workspace Manager bypass: NONE — no CommandCenter zones are rendered here.
//   The automation surface owns its own layout (AutomationPanel +
//   AutomationMacroEnginePanel).  This is intentional for the standalone page;
//   when the automation panel is embedded as a docked tab inside the
//   CommandCenter, panel activation is handled by the dock's tab system which
//   calls activatePanel() via CommandCenterShell.handleActivatePanel.
//
// TODO(one-owner): When full CommandCenter integration is wired, confirm that
//   this surface does not replicate Program/Preview monitor rendering and that
//   any panel activation path goes through activatePanel() in WorkspaceManager.
import { AutomationPageContent } from './AutomationPageContent';

export default function AutomationPage() {
  return <AutomationPageContent />;
}
