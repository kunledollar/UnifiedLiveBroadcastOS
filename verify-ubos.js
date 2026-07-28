// UBOS Verification Script
// Run with: node verify-ubos.js

console.log("Rendering DirectorWorkspace");


const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "src/AppRouter.tsx",
  "src/workspace/WorkspaceShell.tsx",
  "src/workspace/WorkspaceManager.tsx",
  "src/workspace/Sidebar.tsx",

  // Workspaces
  "src/workspace/workspaces/DirectorWorkspace.tsx",
  "src/workspace/workspaces/ProductionWorkspace.tsx",
  "src/workspace/workspaces/GraphicsOperatorWorkspace.tsx",
  "src/workspace/workspaces/ReplayWorkspace.tsx",
  "src/workspace/workspaces/DistributionWorkspace.tsx",
  "src/workspace/workspaces/AutomationWorkspace.tsx",
  "src/workspace/workspaces/AnalyticsWorkspace.tsx",
  "src/workspace/workspaces/MediaWorkspace.tsx",
  "src/workspace/workspaces/InspectorWorkspace.tsx",

  // Autonomy
  "src/autonomous/AutonomousShell.tsx",
  "src/autonomous/AutonomousProvider.tsx",
  "src/autonomous/AutonomousUI.tsx",
  "src/autonomous/coordinator/AutonomousCoordinator.ts",
  "src/autonomous/recovery/RecoveryEngine.ts",
  "src/autonomous/fallback/FallbackEngine.ts",
  "src/autonomous/confidence/ConfidenceEngine.ts",
  "src/autonomous/severity/SeverityEngine.ts",
  "src/autonomous/decision/DecisionEngine.ts"
];

function checkFile(file) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  return { file, exists };
}

function readFile(file) {
  try {
    return fs.readFileSync(path.join(process.cwd(), file), "utf8");
  } catch {
    return null;
  }
}

console.log("🔍 UBOS Verification Report\n");

console.log("📁 Checking required files...\n");

const results = requiredFiles.map(checkFile);

results.forEach(r => {
  console.log(`${r.exists ? "✔" : "✘"} ${r.file}`);
});

console.log("\n🔍 Checking routing...\n");

const router = readFile("src/AppRouter.tsx");
if (router && router.includes("<Route path=\"/control-room/*\"")) {
  console.log("✔ Control Room routing is correct");
} else {
  console.log("✘ Control Room routing is NOT using WorkspaceShell");
}

console.log("\n🔍 Checking WorkspaceShell wiring...\n");

const shell = readFile("src/workspace/WorkspaceShell.tsx");
if (shell && shell.includes("WorkspaceManager")) {
  console.log("✔ WorkspaceShell uses WorkspaceManager");
} else {
  console.log("✘ WorkspaceShell is NOT using WorkspaceManager");
}

if (shell && shell.includes("<AutonomousShell")) {
  console.log("✔ AutonomousShell is mounted");
} else {
  console.log("✘ AutonomousShell is NOT mounted");
}

console.log("\n🔍 Checking WorkspaceManager...\n");

const manager = readFile("src/workspace/WorkspaceManager.tsx");
if (manager && manager.includes("useState")) {
  console.log("✔ WorkspaceManager has state");
} else {
  console.log("✘ WorkspaceManager missing state");
}

if (manager && manager.includes("renderWorkspace")) {
  console.log("✔ WorkspaceManager can render workspaces");
} else {
  console.log("✘ WorkspaceManager missing renderWorkspace()");
}

console.log("\n🔍 Checking Sidebar...\n");

const sidebar = readFile("src/workspace/Sidebar.tsx");
if (sidebar && sidebar.includes("onClick={() => onSelect(")) {
  console.log("✔ Sidebar triggers workspace switching");
} else {
  console.log("✘ Sidebar is NOT triggering workspace switching");
}

console.log("\n🔍 Checking autonomy engines...\n");

[
  "ConfidenceEngine.ts",
  "SeverityEngine.ts",
  "DecisionEngine.ts",
  "RecoveryEngine.ts",
  "FallbackEngine.ts",
  "AutonomousCoordinator.ts"
].forEach(engine => {
  const file = readFile(`src/autonomous/${engine.includes("Coordinator") ? "coordinator" : engine.includes("Recovery") ? "recovery" : engine.includes("Fallback") ? "fallback" : engine.includes("Confidence") ? "confidence" : engine.includes("Severity") ? "severity" : "decision"}/${engine}`);
  console.log(`${file ? "✔" : "✘"} ${engine}`);
});

console.log("\n🎉 Verification complete.\n");
