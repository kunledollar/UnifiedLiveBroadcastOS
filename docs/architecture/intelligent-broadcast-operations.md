# Intelligent Broadcast Operations (IBO)

Phase 18 makes UBOS an intelligent broadcast operating system without allowing AI to take direct control of media. Agents observe the Production Graph, create auditable suggestions, and optionally compile accepted suggestions or automation rules into Production Commands.

## Safety principles

- AI never manipulates media directly.
- AI never bypasses the Production Graph or command dispatcher.
- Agents emit suggestions and, only through approved paths, Production Commands.
- Human operators remain in control unless explicit automation is enabled.
- Every suggestion, acceptance, rejection, ignored recommendation, and generated command is audit metadata.
- Provider integrations are abstract interfaces; no external AI service is required for the architecture.

## Agent architecture

The generic `BroadcastAgent` contract defines `id`, `name`, `version`, capabilities, subscriptions, emitted commands, and emitted suggestions. `AgentRegistry` stores available agents. `AgentManager` owns lifecycle state, enable/disable controls, observation fan-out, and performance metrics such as suggestion count, acceptance count, rejection count, and average confidence.

Prototype agents:

- **AI Director** observes scenes, guests, timeline, and graph state to detect active speaker candidates, recommend scene switches, suggest camera framing/layout changes, identify idle scenes, suggest transitions, and recommend guest spotlighting.
- **AI Audio Engineer** observes graph audio channels and future telemetry to flag clipping, silence, noise, missing audio, echo loops, music ducking, and gain changes.
- **AI Graphics Operator** observes guest and agenda metadata to suggest lower thirds, title changes, sponsor cards, QR codes, timers, and overlays.
- **AI Producer** observes runtime, running order, checklist, and segment metadata to warn about schedule drift and suggest breaks or transitions.
- **AI Moderator** observes unified chat metadata to flag spam/abuse, highlight important questions, recommend featured comments, and detect FAQs.
- **AI Translator** is represented by provider capabilities for captions, subtitles, and translation; external providers are not bound yet.
- **AI Clip Generator** emits timestamp/metadata suggestions only and does not render video.
- **AI Analytics Engine** creates quality, engagement, efficiency, workload, and health insights from graph metadata.

## Suggestion lifecycle

1. Agents observe a graph snapshot and optional metadata.
2. Agents emit `AgentSuggestion` records with source agent, confidence, timestamp, reasoning metadata, and an optional Production Command.
3. The Suggestion Center displays recommendation, source agent, confidence, timestamp, and actions: accept, reject, or ignore.
4. Accepted suggestions expose their Production Command for normal operator dispatch.
5. Rejected and ignored suggestions are retained with audit entries.
6. Suggestions can also be persisted to the Production Graph with `ADD_AGENT_SUGGESTION`, which only the `AI_AGENT` role may emit.

## Command flow

AI-originated media or state changes must become Production Commands. Agents may stage `ADD_AGENT_SUGGESTION` commands, but operational changes such as scene switches, audio gain changes, graphics visibility, or transitions remain normal Production Commands requiring operator acceptance unless automation is explicitly enabled.

## Human approval workflow

Manual mode only shows suggestions. Supervised mode can prepare commands after an operator accepts. Auto-Director mode is explicit and limited to rules or director recommendations compiled into normal commands; it still records agent identity and reasoning metadata.

## Automation model

Automation rules have a trigger, condition metadata, and command template. The `AutomationRuleEngine` compiles matching enabled rules into Production Commands. Rules never mutate media directly and are auditable through command metadata.

Examples:

- Guest joins → show lower third.
- Recording starts → display recording badge.
- Stream health drops → alert operator.
- Active speaker changes → suggest layout.

## Provider abstraction

`AIProvider` defines provider id, display name, supported capabilities, and a generic completion method. Providers such as OpenAI, Anthropic, Google Gemini, local LLMs, and custom enterprise AI can be registered later without changing agent lifecycle, suggestion center, or command flow.

## Developer tools

The Production Graph Inspector can display active agents, suggestions, accepted commands, rejected suggestions, automation rules, and agent performance metrics from `AgentManager`, `SuggestionCenter`, and `AutomationRuleEngine` state.

## Validation

The framework is metadata-only and graph-safe. Validation covers agent registration, prototype suggestions, suggestion acceptance, automation rule compilation, provider registration, analytics insights, and storing suggestions in the Production Graph with `ADD_AGENT_SUGGESTION`.
