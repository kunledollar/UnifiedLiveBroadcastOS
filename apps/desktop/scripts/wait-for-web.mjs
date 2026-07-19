const webUrl = 'http://localhost:3000';
const timeoutMs = 60_000;
const retryMs = 500;
const deadline = Date.now() + timeoutMs;

console.log(`[@ubos/desktop] Waiting for ${webUrl}...`);

while (Date.now() < deadline) {
  try {
    const response = await fetch(webUrl, { signal: AbortSignal.timeout(retryMs) });
    if (response.ok) {
      console.log(`[@ubos/desktop] Web app is ready; launching the Tauri shell.`);
      process.exit(0);
    }
  } catch {
    // The web dev server is still starting. Retry until the timeout expires.
  }

  await new Promise((resolve) => setTimeout(resolve, retryMs));
}

console.error(`[@ubos/desktop] Timed out waiting for ${webUrl}. Start @ubos/web and try again.`);
process.exit(1);
