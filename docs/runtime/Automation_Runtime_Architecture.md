# Automation Runtime Architecture

UBOS v4.8 adds a metadata-only Production Automation Runtime owned by `AutomationRuntimeController`. The controller composes registry, lifecycle, scheduler, trigger, execution, recovery, metrics, health, and event adapter managers. It stores deterministic automation records, validates metadata safety, publishes runtime events, and reports health without touching media handles.

Program-changing operations are converted to normal `ProductionCommand` objects and submitted through `applyProductionCommand`, preserving ProductionGraph authorization and revision checks.
