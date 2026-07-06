# UBOS 3.7 Professional Audio Mixer Smoke Test

Use this checklist in the Control Room bottom Audio dock after granting browser media permissions.

1. Start camera preview with microphone enabled and confirm the Camera Microphone left/right meters move.
2. Start screen share with system audio enabled where the browser and OS support it, then confirm Screen Audio meters move.
3. Play a media asset and confirm the Media Playback channel remains metadata-ready until a browser playback stream is attached.
4. Attach a browser source that exposes audio capture and confirm the Browser Source channel is metadata-ready where capture is unsupported.
5. Move each channel gain slider from 0% to 100% to 200% and confirm the displayed peak follows the change.
6. Toggle Mute and Solo and confirm meter output and history entries update without React warnings or console errors.
7. Move Pan left and right and confirm the left/right meter weighting changes.
8. Toggle Program, Recording, Streaming, and Monitor route checkboxes and confirm only metadata changes are stored.
9. Push a loud signal and confirm channel and Master Output clipping indicators appear above the safe threshold.
10. Stop camera/screen sources and confirm runtime Web Audio nodes are disposed with no lingering console errors.

Acceptance commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
```
