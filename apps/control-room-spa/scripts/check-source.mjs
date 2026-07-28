import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const sourcePath = fileURLToPath(new URL("../src", import.meta.url));
const conflictMarker = /^(?:<<<<<<<|=======|>>>>>>>)(?: .*)?$/m;
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(path) : [path];
    }),
  );

  return nestedFiles.flat().filter((path) => sourceExtensions.has(extname(path)));
}

const files = await sourceFiles(sourcePath);
const conflictedFiles = [];

for (const file of files) {
  if (conflictMarker.test(await readFile(file, "utf8"))) {
    conflictedFiles.push(file);
  }
}

if (conflictedFiles.length > 0) {
  throw new Error(
    `Unresolved merge conflict markers found in:\n${conflictedFiles.join("\n")}`,
  );
}

const packageSource = await readFile(packageJsonUrl, "utf8");
const pluginOccurrences = packageSource.match(/"@vitejs\/plugin-react"\s*:/g) ?? [];

if (pluginOccurrences.length !== 1) {
  throw new Error(
    `Expected one @vitejs/plugin-react declaration, found ${pluginOccurrences.length}.`,
  );
}

console.log(`Validated ${files.length} source files and package.json.`);
