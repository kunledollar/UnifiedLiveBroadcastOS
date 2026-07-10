# Automation Recovery

Recovery is metadata-only. Failed automations track `lastError` and attempts. Retry is allowed only while attempts remain below `schedule.retryLimit`; retry clears the error, increments attempts, and returns the automation to Ready for deterministic rescheduling.
