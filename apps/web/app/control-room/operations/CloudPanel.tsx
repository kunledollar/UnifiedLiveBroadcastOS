import { OperationsPanel } from './OperationsChrome';
const rows = [
  ['Current Environment','Production metadata'],['Deployment Status','Validated'],['Cluster Summary','1 enterprise cluster · metadata only'],['Region','North America'],['Studio','Studio A'],['Health','Healthy'],['Resource Usage','8 CPU · 32 GB memory · 1 TB storage'],['Deployment Queue','0 active jobs'],
];
export function CloudPanel(){return <OperationsPanel title="Cloud"><div className="space-y-ubos-2">{rows.map(([label,value])=><div key={label} className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-ubos-2"><div className="text-ubos-metadata text-ubos-fg-muted">{label}</div><div className="text-sm text-ubos-fg-primary">{value}</div></div>)}<p className="text-ubos-metadata text-ubos-fg-muted">Metadata-only cloud console: no cloud credentials, SDK calls, containers, orchestration, IaC, SSH, or deployment runtime.</p></div></OperationsPanel>}
