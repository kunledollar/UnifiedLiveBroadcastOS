# Rundown Event Flow

The RuntimeEventBus receives metadata-only events: RundownCreated, RundownLoaded, RundownValidated, RundownStarted, RundownPaused, RundownResumed, RundownCompleted, RundownStopped, RundownFailed, RundownRecovered, RundownArchived, RundownItemValidated, RundownItemCued, RundownItemStarted, RundownItemCompleted, RundownItemSkipped, RundownItemHeld, RundownItemFailed, RundownItemRecovered, RundownCurrentItemChanged, and RundownNextItemChanged.

Payloads contain ids, status, validation metadata, and command correlation metadata only. Runtime handles are rejected before publication.
