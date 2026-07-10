# UBOS v4.6 Session Snapshots

Session snapshots are metadata-only records for restoring show context. They may include workspace preset data, panel layout metadata, ProductionGraph metadata, runtime health, registered device IDs, registered output IDs, registered input IDs, and operator preferences.

Snapshots never serialize media buffers, streams, canvases, textures, sockets, encoders, decoders, GPU resources, FFmpeg state, browser sources, or runtime handles. Snapshot records explicitly include `containsMediaSerialization: false` and `containsMediaHandles: false`.
