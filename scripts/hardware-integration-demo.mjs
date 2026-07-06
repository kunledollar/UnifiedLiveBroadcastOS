import { createHardwareIntegrationDemo } from '../packages/media-plane/dist/media-plane/src/index.js';

const demo = await createHardwareIntegrationDemo();
console.log(JSON.stringify({ description: demo.description, devices: demo.manager.devices.map((device) => ({ id: device.id, vendor: device.vendor, category: device.category, lifecycle: device.connection.lifecycle, health: device.health })), events: demo.events.map((event) => event.type) }, null, 2));
