# Pipeline State Machine

Allowed states are: Created, Initializing, Ready, Waiting, Running, Paused, Recovering, Stopping, Stopped, Failed, Disposed.

Illegal transitions throw synchronously. This keeps ingest lifecycle deterministic and Runtime-controlled.

Common path: Created → Initializing → Ready → Running → Stopping → Stopped → Disposed.

Recovery path: Running/Paused/Failed → Recovering → Initializing or Running.
