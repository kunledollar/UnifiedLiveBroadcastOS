# Automation Triggers

Supported trigger metadata includes time, event, dependency, health, operator, and composite triggers. Evaluation is deterministic: automations are sorted by priority and id, trigger inputs are immutable event metadata, and composite triggers use explicit `all` or `any` semantics.
