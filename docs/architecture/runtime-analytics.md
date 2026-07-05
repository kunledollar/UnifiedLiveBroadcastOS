# Runtime Analytics Architecture

UBOS runtime analytics is a local, deterministic, metadata-first analytics runtime for broadcast business intelligence and operational insights. It does not use Google Analytics, Mixpanel, Amplitude, Segment, tracking pixels, cookies, telemetry uploads, cloud analytics, runtime media processing, GPU work, or AI inference.

## Architecture

The `runtime-analytics` package collects metadata events from Production, Execution, Switching, Media, Replay, Graphics, Audio, WebRTC, Monitoring, Cluster, Plugin, Security, Automation, Distribution, Recording, AI Director, and Cloud runtimes. The runtime stores events in an `AnalyticsSession`, derives `AnalyticsMetric` KPI rows, and creates immutable `AnalyticsSnapshot` history.

## Pipeline

The deterministic pipeline is: collect, validate, aggregate, snapshot, report, export. Validation rejects runtime handles, media data, browser analytics SDK identifiers, cookies, tracking pixels, and telemetry endpoints before aggregation.

## Metrics and KPIs

Tracked KPIs include switches, transitions, production duration, guest count, operator activity, audio levels, graphics usage, media usage, replay usage, recording hours, streaming outputs, system health, CPU usage, GPU usage, dropped frames, latency, storage, bandwidth, operator errors, automation events, security events, and plugin usage.

## Aggregation

Aggregation is deterministic and metadata-only. Events are reduced into count, duration, health, usage, and performance metrics by KPI, source runtime, timestamp, and optional string dimensions. No media payloads or runtime handles are accepted.

## Reporting

Reports include daily, weekly, monthly, production summary, operator summary, performance, failure, availability, compliance, and executive summary reports. Exports support PDF descriptors, CSV, JSON, Markdown, and Excel-ready tables generated from local metadata.

## Forecasting

Forecasts use deterministic moving averages over historical metadata points. They are operational estimates only and do not perform AI inference or remote prediction.

## Visualization

The analytics workspace supports executive, operations, production, engineering, AI, monitoring, media, graphics, audio, distribution, security, cloud, and plugin dashboards. Visualization types include line charts, bar charts, pie charts, heat maps, trend graphs, timelines, KPI cards, gauge panels, scorecards, and activity streams.

## Future Enterprise Integrations

Future integrations may include local data warehouse adapters, offline SIEM export bundles, signed compliance archives, and on-prem report scheduling. Integrations must remain opt-in, metadata-only, deterministic, and free of telemetry uploads or external analytics services.
