# Automation State Machine

States: Created, Ready, Waiting, Scheduled, Triggered, Executing, Paused, Completed, Failed, Cancelled, Archived, Disposed. Illegal transitions throw and are never applied. Terminal records can only archive or dispose unless explicitly reset by retry/recovery paths.
