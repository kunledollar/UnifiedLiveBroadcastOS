import { AnalyticsRuntime, AnalyticsValidator, createAnalyticsPipeline } from './index.js';
const runtime = new AnalyticsRuntime();
runtime.record({ source: 'switching', type: 'switches', count: 3 });
runtime.record({ source: 'security', type: 'securityEvents', severity: 'warning', count: 1 });
const snapshot = runtime.snapshot();
if (!snapshot.metadataOnly) throw new Error('Analytics snapshot must be metadata only');
if (createAnalyticsPipeline().externalTelemetryEnabled) throw new Error('External telemetry must be disabled');
try { AnalyticsValidator.rejectUnsafe({ googleAnalytics: true }); throw new Error('Expected Google Analytics rejection'); } catch (error) { if (!(error instanceof Error) || !error.message.includes('googleAnalytics')) throw error; }
console.log('runtime-analytics validation passed');
