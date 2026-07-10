import { createDiagnosticsDemo } from '../packages/media-plane/dist/media-plane/src/diagnostics/index.js';
const { snapshot } = createDiagnosticsDemo();
console.log(
  JSON.stringify(
    {
      id: snapshot.id,
      pipelines: snapshot.pipelines.length,
      alerts: snapshot.alerts.length,
      metadataOnly: snapshot.backend.metadataOnly,
    },
    null,
    2,
  ),
);
