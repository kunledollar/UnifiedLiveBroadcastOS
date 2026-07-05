# Runtime AI Director Architecture

Phase 31 adds a deterministic, metadata-first AI Director runtime. It is an orchestration advisor, not an execution agent: it reads production metadata from switching, graphics, media, replay, audio, guests, automation, monitoring, security, recording, distribution, plugin, cluster, and cloud runtimes, then proposes operator-approved recommendations.

## Architecture

`AIDirectorRuntime` validates a `ProductionContext`, creates a `ProductionAnalysis`, derives `ProductionRecommendation` objects, orders the recommendation queue, and reports metrics. `AIDirectorSession` owns approvals, snapshots, and recommendation history. The validator rejects unsafe handles, connection details, AI SDK markers, model weights, inference fields, remote AI call metadata, and autonomous execution bypasses.

## Analysis pipeline

1. Collect metadata-only runtime state.
2. Validate the context for unsafe runtime handles and forbidden AI/inference fields.
3. Detect risks from deterministic rules.
4. Generate optimization opportunities.
5. Produce timeline predictions and insights.
6. Generate recommendations with reasons, priority, confidence, and lifecycle state.

## Recommendation lifecycle

Recommendations start as `pending_approval`. They include a policy with `operatorApprovalRequired: true` and `autonomousExecutionAllowed: false`. `RecommendationDispatcher` refuses dispatch without an approved `RecommendationApproval`. Dispatch returns metadata describing an approved recommendation transition; it does not execute production commands.

## Confidence model

Confidence is rule based. Direct runtime health metadata yields high confidence. Derived or indirect metadata yields medium confidence. The system does not use LLM scoring, embeddings, browser AI APIs, remote model calls, or local inference.

## Risk model

Risks include production delay, guest offline, graphics missing, media missing, audio issue, dropped frames, storage low, output failure, device offline, security warning, automation conflict, and cluster failure. Rules map runtime metadata flags into prioritized production risks.

## Optimization model

Optimization categories include scene flow, graphics timing, audio balance, replay timing, guest experience, recording efficiency, resource allocation, operator workload, automation efficiency, and output reliability. Opportunities are deterministic summaries designed to reduce operator workload and improve reliability.

## Approval workflow

Operators approve or reject recommendations. Approval records include the recommendation ID, operator ID, decision, timestamp, and metadata-only marker. Future execution adapters must continue to honor approval policy and may not bypass the operator.

## Future LLM integration

Future LLM integration must remain optional, policy-gated, auditable, and isolated from execution. It must never receive runtime handles, credentials, endpoints, or private transport objects. This phase intentionally includes no LLM APIs, no OpenAI/Anthropic/Gemini SDKs, no model downloads, and no inference.

## Future autonomous production

Autonomous production is disabled. A future automation policy would need explicit operator-defined scopes, safety constraints, dry-run simulation, audit logs, and reversible actions before any execution is considered.
