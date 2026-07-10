# Device Health and Recovery

Device health metadata tracks availability, connection state, permission state, dropped frames, packet loss, latency, jitter, signal status, format mismatch, reconnect count, last successful sample, last error, and provider availability. States are `healthy`, `warning`, `degraded`, `error`, `offline`, `unavailable`, and `unknown`.

Recovery policy kinds are `none`, `manual`, `immediate-retry`, `fixed-interval`, and `exponential-backoff`. Policies include maximum attempts, retry delay, cooldown, operator acknowledgement requirements, and fallback device metadata. Infrastructure never automatically replaces an active Program source without explicit operator authorization.
