# Rundown Validation

Before items become ready, validation checks:

- Referenced scene exists in ProductionGraph.
- Referenced source exists in ProductionGraph.
- Required device exists as metadata in graph plugins.
- Required input exists as source or guest metadata.
- Required output exists as destination metadata.
- Required graphics asset exists as overlay metadata.
- Required replay clip exists as replay metadata.
- Transition metadata duration is valid.
- Duration estimate is non-negative.
- Rundown session matches active session.
- Production state permits execution and session is not closed.

Validation returns explicit errors with codes and item ids. The runtime does not silently repair invalid items.
