# UBOS 3.3 Media Sources Smoke Test

Validate local operator media imports without persisting browser runtime objects into the UBOS metadata graph.

## Supported imports

- MP4, MOV, WEBM video
- JPG, JPEG, PNG, GIF image

## Checklist

1. Open the control room and select **Sources**.
2. Click **+ Media** and choose one MP4 and one PNG.
3. Drag a second supported asset into the Sources panel.
4. Confirm each import creates a reusable Media source with filename, file size, media type, duration/resolution/fps placeholders or detected values in Inspector.
5. Confirm the MP4 autoplays in Preview, and Play/Pause/Stop/Restart controls work.
6. Confirm the PNG remains visible until another source replaces or covers it.
7. CUT, TAKE, and AUTO the preview scene to Program and confirm media appears in Program.
8. Confirm unmuted video audio is audible/reaches the existing browser audio path/meter.
9. Import multiple assets and verify they coexist in the Sources panel.
10. Delete imported sources repeatedly and confirm object URLs are revoked, no stale media remains, and no console errors appear.

## Acceptance evidence

- MP4 playback works in Preview and Program.
- PNG displays correctly.
- Video audio reaches the audio meter path.
- Multiple imported media assets can coexist.
- Repeated import/delete cycles remain stable.
