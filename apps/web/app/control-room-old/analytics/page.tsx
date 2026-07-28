// ONE OWNER RULE AUDIT (3.15C/D) — /control-room/analytics
//
// Surface type: standalone full-page route (Next.js App Router page).
//   This route is NOT a panel inside the CommandCenter zone layout.
//
// activatePanel() usage: NOT APPLICABLE.
//   Standalone route pages sit outside the CommandCenter zone system and do
//   not use activatePanel().  Panel activation via Workspace Manager is only
//   required for surfaces docked inside the CommandCenter shell.
//
// Workspace Manager bypass: NONE — no CommandCenter zones are rendered here.
//   The analytics surface is a self-contained metadata-only display page;
//   it does not render Program/Preview monitors and poses no One Owner Rule
//   conflict.  All data displayed is deterministic and local (no telemetry).
//
// TODO(one-owner): If an analytics panel is later embedded inside the
//   CommandCenter bottom/right dock, ensure activation goes through
//   activatePanel() and does not duplicate monitor rendering.
const pages = ['Analytics Dashboard','Reports','KPIs','Insights','Forecasts','History','Activity Timeline','Production Metrics','Executive Summary','Performance Center'];
const dashboards = ['Executive Dashboard','Operations Dashboard','Production Dashboard','Engineering Dashboard','AI Dashboard','Monitoring Dashboard','Media Dashboard','Graphics Dashboard','Audio Dashboard','Distribution Dashboard','Security Dashboard','Cloud Dashboard','Plugin Dashboard'];
const visualizations = ['Line Charts','Bar Charts','Pie Charts','Heat Maps','Trend Graphs','Timelines','KPI Cards','Gauge Panels','Scorecards','Activity Streams'];
export default function AnalyticsControlRoomPage(){return <main className="min-h-screen bg-ubos-graphite p-ubos-6 text-ubos-fg-primary"><header className="mb-ubos-6"><p className="text-ubos-metadata text-ubos-fg-muted">Local deterministic metadata analytics — no telemetry uploads, cookies, tracking pixels, or browser analytics SDKs.</p><h1 className="text-2xl font-semibold">UBOS Broadcast Analytics</h1></header><section className="grid gap-ubos-3 lg:grid-cols-3"><article className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-4"><h2 className="font-semibold">Analytics Workspace</h2><ul className="mt-ubos-2 space-y-1 text-ubos-metadata text-ubos-fg-muted">{pages.map((item)=><li key={item}>{item}</li>)}</ul></article><article className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-4"><h2 className="font-semibold">Dashboards</h2><ul className="mt-ubos-2 space-y-1 text-ubos-metadata text-ubos-fg-muted">{dashboards.map((item)=><li key={item}>{item}</li>)}</ul></article><article className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-4"><h2 className="font-semibold">Visualization</h2><ul className="mt-ubos-2 space-y-1 text-ubos-metadata text-ubos-fg-muted">{visualizations.map((item)=><li key={item}>{item}</li>)}</ul></article></section></main>}
