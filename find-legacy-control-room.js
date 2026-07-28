// UBOS Legacy Control Room Scanner
// Run with: node find-legacy-control-room.js

const fs = require("fs");
const path = require("path");

const searchDirs = [
  "src",
  "src/pages",
  "src/control-room",
  "src/views",
  "src/screens",
  "src/components",
  "src/modules"
];

const legacyPatterns = [
  "director",
  "control-room",
  "triad",
  "inspector",
  "program",
  "production-intelligence",
  "intelligence-timeline"
];

function scanDir(dir) {
  const fullDir = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullDir)) return [];

  const files = fs.readdirSync(fullDir);
  let matches = [];

  files.forEach(file => {
    const fullPath = path.join(fullDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      matches = matches.concat(scanDir(path.join(dir, file)));
    } else {
      const content = fs.readFileSync(fullPath, "utf8");

      legacyPatterns.forEach(pattern => {
        if (content.toLowerCase().includes(pattern)) {
          matches.push({
            file: fullPath,
            pattern
          });
        }
      });
    }
  });

  return matches;
}

console.log("🔍 Scanning for legacy Control Room pages...\n");

let results = [];
searchDirs.forEach(dir => {
  results = results.concat(scanDir(dir));
});

if (results.length === 0) {
  console.log("✔ No legacy Control Room pages found.");
} else {
  console.log("✘ Legacy Control Room pages detected:\n");
  results.forEach(r => {
    console.log(`⚠ ${r.file}  → matched: "${r.pattern}"`);
  });

  console.log("\n❗ These files must be removed or renamed to fully activate WorkspaceShell.");
}

console.log("\n🎉 Scan complete.\n");
