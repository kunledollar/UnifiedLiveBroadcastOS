import { createClock } from '../sync/index.js';
import { TransportManager, createDemoTransportWorkflow, createProtocolModel, supportedTransportProtocols, validateTransportSession } from './index.js';

const assert = {
  equal(actual: unknown, expected: unknown, message: string) { if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`); },
  ok(value: unknown, message: string) { if (!value) throw new Error(message); },
};

for (const protocol of supportedTransportProtocols) {
  const manager = new TransportManager();
  const session = manager.createSession({ protocol, protocolModel: createProtocolModel(protocol) });
  assert.equal(session.protocol, protocol, `${protocol} session uses requested protocol`);
  assert.ok(validateTransportSession(session).valid, `${protocol} session validates`);
}

const manager = new TransportManager();
const events: string[] = [];
manager.onEvent((event) => events.push(event.type));
const session = manager.createSession({ id: 'transport:test:rtmps', protocol: 'rtmps' });
manager.transition(session.id, 'negotiating');
manager.transition(session.id, 'connecting');
manager.transition(session.id, 'connected');
manager.updateMetrics(session.id, { bitrateKbps: 4500, latencyMs: 80, jitterMs: 5, packetLossRatio: 0.001 });
manager.integrate(session.id, { mediaClock: createClock({ frameRate: 60 }), remoteProductionSessionId: 'remote:session:test' });
manager.reconnect(session.id, 'validation reconnect');
manager.transition(session.id, 'stopped');
const finalSession = manager.require(session.id);
assert.equal(finalSession.lifecycle, 'stopped', 'session lifecycle reaches stopped');
assert.equal(finalSession.metrics.reconnectCount, 1, 'reconnect count is tracked');
assert.equal(finalSession.integrations.mediaClockId, 'media-clock:60fps', 'media clock integration is tracked');
assert.ok(events.includes('transport_connected'), 'runtime connected event emitted');
assert.ok(events.includes('transport_metrics_updated'), 'metrics event emitted');

const demo = createDemoTransportWorkflow();
assert.equal(demo.session.protocol, 'srt', 'demo uses SRT contribution workflow');
assert.equal(demo.session.lifecycle, 'connected', 'demo workflow reconnects and returns connected');
assert.ok(demo.events.length >= 6, 'demo emits runtime events');
console.log('transport validation passed');
