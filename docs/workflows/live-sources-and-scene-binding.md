# Phase 10.2 Live Sources and Scene Binding

## Source concept

A live source is graph-backed metadata for an input that may be rendered later by a runtime. Supported source types are camera, screen, media, browser, audio, overlay, and guest. Creating a source records its name, type, visibility, transform, and safe metadata only; it does not request device permissions or store handles.

## Scene-source binding

Scenes reference sources as ordered layers. Attaching a source to the selected scene adds a source ID to the scene and stores layer metadata with the source transform. A source can be unavailable or offline and still be attached; monitors render that state honestly.

## Layer model

Each layer has a default transform: `x`, `y`, `width`, `height`, `zIndex`, `opacity`, `visible`, and `locked`. The scene layer list and source cards expose visibility, lock state, remove, and move controls.

## Runtime vs metadata boundary

The Production Graph and persistence layer store metadata only. Runtime handles such as `MediaStream`, `MediaStreamTrack`, `AudioContext`, `AudioNode`, file/blob/buffer objects, DOM handles, and screen-capture streams are forbidden in source metadata. Camera, screen, and audio permission requests are deferred until preview/capture starts.

## Program/Preview rendering rules

Program and Preview render the selected scene name and layer/source state from the graph-backed scene model:

- Empty scenes show “No sources assigned to this scene.”
- Offline/unavailable sources show an offline warning instead of a fake live badge.
- Media sources without file metadata show “No media file selected.”
- Browser sources without a valid renderer/URL show “Browser source unavailable.”
- Guest sources that are not connected show “Guest offline.”
- Mock sources are labeled `MOCK`.

## Persistence

Sources, scene bindings, transforms, order, visibility, lock state, and safe metadata are persisted through the existing scene source storage. Refresh reconstructs the Production Graph session from persisted scenes and sources.

## Replay and timeline

Production Graph commands emit source timeline events for creation, deletion, updates, and scene attachment. Replay reconstructs metadata state only and validation rejects runtime handles and unsafe browser URLs.

## Limitations

- Browser rendering is represented by metadata unless the browser renderer runtime is enabled.
- Media file picking may remain placeholder-only; no file handles or buffers are persisted.
- Guest sources are derived from guest/session metadata in later workflow hardening.

## Next workflow

The next workflow should connect capture buttons to the runtime supervisor and browser media helpers so camera, screen, and audio previews can promote `permission_required` sources into runtime-confirmed preview states without mutating graph metadata with handles.
