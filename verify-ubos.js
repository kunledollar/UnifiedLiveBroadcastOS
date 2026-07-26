// UBOS Verification Script
// Run with: node verify-ubos.js
const fs = require("fs");
const path = require("path");
const requiredFiles = [
  "src/AppRouter.tsx", "src/workspace/WorkspaceShell.tsx", "src/workspace/WorkspaceManager.tsx", "src/workspace/Sidebar.tsx",
  ...["Director", "Production", "GraphicsOperator", "Replay", "Distribution", "Automation", "Analytics", "Media", "Inspector"].map(name => `src/workspace/workspaces/${name}Workspace.tsx`),
  "src/autonomous/AutonomousShell.tsx", "src/autonomous/AutonomousProvider.tsx", "src/autonomous/AutonomousUI.tsx",
  "src/autonomous/coordinator/AutonomousCoordinator.ts", "src/autonomous/recovery/RecoveryEngine.ts", "src/autonomous/fallback/FallbackEngine.ts",
  "src/autonomous/confidence/ConfidenceEngine.ts", "src/autonomous/severity/SeverityEngine.ts", "src/autonomous/decision/DecisionEngine.ts"
];
const readFile = file => { try { return fs.readFileSync(path.join(process.cwd(), file), "utf8"); } catch { return null; } };
console.log("🔍 UBOS Verification Report\n\n📁 Checking required files...\n");
let failures = 0;
for (const file of requiredFiles) { const exists = fs.existsSync(path.join(process.cwd(), file)); failures += exists ? 0 : 1; console.log(`${exists ? "✔" : "✘"} ${file}`); }
const checks = [
  ["Control Room routing is correct", "src/AppRouter.tsx", '<Route path="/control-room/*"'],
  ["WorkspaceShell uses WorkspaceManager", "src/workspace/WorkspaceShell.tsx", "WorkspaceManager"],
  ["AutonomousShell is mounted", "src/workspace/WorkspaceShell.tsx", "<AutonomousShell"],
  ["WorkspaceManager has state", "src/workspace/WorkspaceManager.tsx", "useState"],
  ["WorkspaceManager can render workspaces", "src/workspace/WorkspaceManager.tsx", "renderWorkspace"],
  ["Sidebar triggers workspace switching", "src/workspace/Sidebar.tsx", "onClick={() => onSelect("],
];
console.log("\n🔌 Checking wiring...\n");
for (const [label, file, needle] of checks) { const passed = readFile(file)?.includes(needle); failures += passed ? 0 : 1; console.log(`${passed ? "✔" : "✘"} ${label}`); }
console.log(`\n${failures ? "❌ Verification failed" : "🎉 Verification complete"}.\n`);
process.exitCode = failures ? 1 : 0;
