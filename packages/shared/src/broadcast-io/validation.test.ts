const assertOk = (value: unknown, message = 'assertion failed') => { if (!value) throw new Error(message); };
const assertEqual = (actual: unknown, expected: unknown) => { if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`); };
const assertDeepEqual = (actual: unknown, expected: unknown) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Deep equality assertion failed'); };
import { createBroadcastIoManifest, createOutputDestination, createRoute, inspectDestination, validateBroadcastIoManifest } from './index.js';

const manifest = createBroadcastIoManifest();
assertEqual(validateBroadcastIoManifest(manifest).length, 0);
assertEqual(manifest.version, '3.13');
assertEqual(manifest.containsRuntimeSockets, false);
assertEqual(manifest.containsRuntimeTransportObjects, false);

const added = createOutputDestination({ id: 'dest-extra', name: 'Extra SRT', kind: 'program', protocol: 'srt' });
const withAdded = createBroadcastIoManifest({ ...manifest, destinations: [...manifest.destinations, added], routes: [...manifest.routes, createRoute('program', added.id)] });
assertOk(withAdded.destinations.some((destination) => destination.id === 'dest-extra'));
assertEqual(validateBroadcastIoManifest(withAdded).length, 0);

const removed = createBroadcastIoManifest({ ...withAdded, destinations: withAdded.destinations.filter((destination) => destination.id !== added.id), routes: withAdded.routes.filter((route) => route.destinationId !== added.id) });
assertOk(!removed.destinations.some((destination) => destination.id === added.id));

for (const source of ['program', 'replay', 'graphics', 'preview'] as const) assertOk(withAdded.routes.some((route) => route.source === source));
const changedProtocol = { ...withAdded.destinations[0]!, protocol: 'rtmps' as const };
const changed = createBroadcastIoManifest({ ...withAdded, destinations: [changedProtocol, ...withAdded.destinations.slice(1)] });
assertEqual(changed.destinations[0]?.protocol, 'rtmps');
assertOk(['healthy', 'unknown', 'degraded', 'offline'].includes(changed.destinations[0]!.runtime.health));
assertOk(inspectDestination(changed, changed.destinations[0]!.id)?.packetStatistics);
assertDeepEqual(JSON.parse(JSON.stringify(changed.routes)), changed.routes);
assertOk(validateBroadcastIoManifest({ ...manifest, containsRuntimeSockets: true as false }).some((issue) => issue.code === 'RUNTIME_SOCKETS_FORBIDDEN'));

console.log('broadcast-io validation passed');
