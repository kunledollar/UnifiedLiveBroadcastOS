# UBOS 3.4 Browser Sources Smoke Test

This smoke test validates Browser sources in the Control Room while preserving UBOS's metadata-first graph model. Source URL, status, loaded time, mute state, and iframe warning text are kept as source metadata; the runtime iframe is created only in the Preview/Program renderer.

## Checklist

1. Open `/control-room` and select the **Sources** tab.
2. Click **+ Browser** to open the Browser source URL form.
3. Enter `https://example.com` and click **Add**.
4. Confirm the Browser source appears in the source list with a loading/live status.
5. Confirm Preview renders the page in a sandboxed iframe and shows URL, status, loaded time, muted state, and the iframe-blocked warning.
6. Click **CUT**, **TAKE**, or **AUTO** and confirm the staged scene moves to Program with the Browser source visible.
7. Use source actions to hide/show, duplicate, delete, and reload the Browser source.
8. Try an invalid URL such as `notaurl` and confirm the UI shows a friendly validation error instead of adding a broken source.
9. Try a page known to block iframe embedding and confirm the app stays stable and shows the friendly warning text.

## Expected limitations

Some third-party sites send `X-Frame-Options` or `Content-Security-Policy` headers that prevent iframe embedding. Browsers block those pages before application code can inspect the response, so UBOS shows an operator warning and recommends another URL or screen capture.


## Related smoke tests

- [UBOS 3.5 Recording Engine Smoke Test](./ubos-3.5-recording-engine-smoke-test.md) validates Program recording, WebM download, recording metadata history, and Browser-source capture limitations.
