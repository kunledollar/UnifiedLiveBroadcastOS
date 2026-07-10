# Output State Machine

States: Created, Initializing, Ready, Running, Paused, Recovering, Stopping, Stopped, Failed, Disposed.

Illegal transitions throw and do not mutate registry state. Running outputs can pause, recover, stop, or fail. Failed outputs can recover, initialize, or dispose. Disposed outputs are terminal.
