import { createDemoTransportWorkflow } from '../packages/media-plane/dist/media-plane/src/transport/index.js';

const { session, events } = createDemoTransportWorkflow();
console.log(JSON.stringify({
  sessionId: session.id,
  protocol: session.protocol,
  lifecycle: session.lifecycle,
  metrics: session.metrics,
  eventTypes: events.map((event) => event.type).reverse(),
  backendIndependent: session.containsRuntimeHandles === false && session.containsMediaPayloads === false,
}, null, 2));
