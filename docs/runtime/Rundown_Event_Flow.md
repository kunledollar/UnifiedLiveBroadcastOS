# Rundown Event Flow

RuntimeEventBus events are metadata-only: RundownCreated, RundownLoaded, RundownValidated, RundownStarted, RundownPaused, RundownResumed, RundownCompleted, RundownStopped, RundownFailed, RundownRecovered, RundownArchived, RundownItemValidated, RundownItemCued, RundownItemStarted, RundownItemCompleted, RundownItemSkipped, RundownItemHeld, RundownItemFailed, RundownItemRecovered, RundownCurrentItemChanged, and RundownNextItemChanged.

Payloads include IDs, state, current/next item metadata, and `containsMediaHandles: false`.
