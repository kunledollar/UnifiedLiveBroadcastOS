import { createDemoGuestWorkflow } from '../packages/media-plane/dist/media-plane/src/index.js';

const demo = await createDemoGuestWorkflow();
console.log(
  JSON.stringify(
    {
      guest: demo.guest,
      eventTypes: demo.events.map((event) => event.type),
      backend: demo.snapshot.backend,
    },
    null,
    2,
  ),
);
