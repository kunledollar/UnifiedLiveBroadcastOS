# Automation Scheduler

The scheduler supports one-shot, repeating, cron-style metadata, delayed execution, timeout metadata, retry limits, cancellation, and priority. The v4.8 implementation records cron expressions as metadata and deterministically calculates explicit `runAt` or `delayMs` due times.
