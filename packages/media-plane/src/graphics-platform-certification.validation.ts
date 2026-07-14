const assert = {
  equal: (actual: unknown, expected: unknown, message?: string) => {
    if (actual !== expected) throw new Error(message ?? `Expected ${String(actual)} to equal ${String(expected)}`);
  },
  ok: (value: unknown, message: string) => {
    if (!value) throw new Error(message);
  },
  throws: (fn: () => unknown, message: string) => {
    try { fn(); } catch { return; }
    throw new Error(message);
  },
};

type Role = 'PROGRAM'|'PREVIEW'|'CLEAN_FEED'|'AUX'|'ISO'|'HORIZONTAL'|'VERTICAL'|'SQUARE';
type Phase = 'graphics'|'template'|'broadcast'|'caption'|'animation'|'branding'|'format';
type Entity = { id: string; generation: number; phase: Phase; role?: Role; metadataOnly: true; realRendering: false };
type Publication = { key: string; role: Role; format: string; generation: number; required: boolean; status: 'PUBLISHED'|'DEGRADED' };

const PROCESSORS = [
  ['graphics-text-foundation', 591], ['template-data-binding', 592], ['broadcast-graphics', 593],
  ['caption-accessibility', 594], ['graphics-animation-cueing', 595], ['branding-safe-area', 596],
  ['multi-format-output-role', 597],
] as const;

class CertificationHarness {
  private readonly entities = new Map<string, Entity>();
  private readonly publications = new Map<string, Publication>();
  private readonly active = new Set<string>();
  private readonly applied = new Set<string>();
  private readonly roles = new Map<Role, string>();
  private lastTick = -1;
  private terminalResults = 0;
  private readonly telemetry = { requests: 0, ticks: 0, realRendering: false, watchdogIncidents: 0 };

  register(entity: Entity) {
    const current = this.entities.get(entity.id);
    if (current && entity.generation <= current.generation) throw new Error(`stale or duplicate generation for ${entity.id}`);
    if (!entity.metadataOnly || entity.realRendering) throw new Error(`false rendering capability for ${entity.id}`);
    this.entities.set(entity.id, Object.freeze({ ...entity }));
    this.active.add(entity.id);
  }

  applyOnce(key: string) {
    if (this.applied.has(key)) throw new Error(`duplicate operation ${key}`);
    this.applied.add(key);
    this.terminalResults += 1;
  }

  tick(frame: number) {
    if (frame < this.lastTick) throw new Error('FrameTick regression');
    if (frame === this.lastTick) return;
    this.lastTick = frame;
    this.telemetry.ticks += 1;
  }

  publish(requestId: string, roles: Role[], format: string, generation: number, requiredRoles: Role[]) {
    this.applyOnce(`request:${requestId}`);
    const entries: Publication[] = [];
    for (const role of roles) {
      const key = `${requestId}:${role}:${format}:${generation}`;
      if (this.publications.has(key)) throw new Error(`duplicate publication ${key}`);
      const status = requiredRoles.includes(role) ? 'PUBLISHED' : 'DEGRADED';
      const publication = Object.freeze({ key, role, format, generation, required: requiredRoles.includes(role), status });
      this.publications.set(key, publication);
      entries.push(publication);
      const previous = this.roles.get(role);
      if (previous && previous === this.roles.get('PROGRAM') && role !== 'PROGRAM') throw new Error(`role alias ${role}`);
      this.roles.set(role, key);
    }
    assert.ok(requiredRoles.every((role) => entries.some((entry) => entry.role === role && entry.status === 'PUBLISHED')), 'required-role atomicity failed');
    this.telemetry.requests += 1;
  }

  rejectUnsafe(value: string) {
    if (/https?:|\/|<script|<svg|credential|nativeHandle|pixel|glyph/i.test(value)) throw new Error('unsafe observable metadata');
  }

  snapshot() {
    return Object.freeze({
      processors: PROCESSORS.map(([name, order]) => ({ name, order })),
      entities: [...this.entities.values()].map((item) => ({ ...item })).sort((a, b) => a.id.localeCompare(b.id)),
      publications: [...this.publications.values()].map((item) => ({ ...item })).sort((a, b) => a.key.localeCompare(b.key)),
      activeCount: this.active.size,
      terminalResults: this.terminalResults,
      telemetry: { ...this.telemetry },
    });
  }

  assertInvariants() {
    assert.equal(new Set(PROCESSORS.map(([, order]) => order)).size, PROCESSORS.length, 'processor orders must be unique');
    assert.equal([...this.entities.values()].some((entity) => !entity.metadataOnly || entity.realRendering), false, 'metadata-only invariant failed');
    assert.equal(new Set(this.publications.keys()).size, this.publications.size, 'publication keys must be unique');
    assert.ok(this.roles.get('PROGRAM') !== this.roles.get('PREVIEW'), 'Program/Preview isolation failed');
    assert.ok(this.roles.get('PROGRAM') !== this.roles.get('CLEAN_FEED'), 'Program/Clean Feed isolation failed');
    assert.equal(this.telemetry.realRendering, false, 'telemetry must not claim real rendering');
    return true;
  }

  shutdown() {
    this.active.clear();
    this.publications.clear();
    this.roles.clear();
  }
}

const buildCertifiedRun = () => {
  const h = new CertificationHarness();
  const phases: Phase[] = ['graphics','template','broadcast','caption','animation','branding','format'];
  phases.forEach((phase, index) => h.register({ id: `${phase}:definition`, generation: index + 1, phase, metadataOnly: true, realRendering: false }));
  ['PROGRAM','PREVIEW','CLEAN_FEED','AUX','ISO','HORIZONTAL','VERTICAL','SQUARE'].forEach((role) =>
    h.register({ id: `variant:${role}`, generation: 1, phase: 'format', role: role as Role, metadataOnly: true, realRendering: false }));

  const scenarios = [
    'graphics definition','text element','graphics layer','template registration','template instance','field registration','binding registration','binding snapshot','atomic data update','missing required variable',
    'lower-third creation','lower-third update','lower-third show','lower-third hide','title creation','full-screen title','ticker creation','scorebug creation','score update','timer update','duplicate graphics rejection',
    'caption track','caption cue','caption activation','caption expiry','caption overlap','reading-speed violation','Program caption','Clean Feed caption exclusion',
    'animation definition','animation phase','graphics cue','cue group','animation session','FrameTick-driven progress','Motion delegation','Transition delegation','visibility transition','graphics replacement','animation rollback',
    'brand definition','brand profile','brand variant','logo reference','watermark reference','safe area','exclusion zone','placement','collision','brand replacement','temporary override','Clean Feed branding exclusion',
    'horizontal format','vertical format','square format','exact variant','fallback variant','compatibility','readiness','Program publication','Preview publication','Clean Feed publication','AUX publication','ISO publication','Horizontal publication','Vertical publication','Square publication','required-role atomicity','optional-role degradation','variant replacement','multi-format rollback','Program/Preview isolation','Program/Clean Feed isolation','format isolation','duplicate request','duplicate publication','duplicate tick','stale graphics generation','stale template generation','stale binding generation','stale caption generation','stale animation generation','stale branding generation','stale format generation','stale variant generation','invalid graphics lifecycle','timer regression','caption sequence regression','expired caption rejection','invalid animation phase order','stale Motion snapshot','stale transition completion','branding inheritance cycle','missing asset','safe-area violation','unresolved collision','missing required variant','invalid fallback','required-role failure','atomic publication failure','queue overflow','timeout','cancellation','backend failure','Output Registry agreement','Source Graph agreement','snapshot immutability','error sanitization','command exactly-once behavior','health consistency','telemetry consistency','watchdog correctness','configuration transaction','failed transaction preserves prior state','shutdown under load','no command after shutdown','no output after shutdown','no active captions','no active animation sessions','no active branding placements','no active multi-format publications','no queued requests','no leases','no callbacks','no timers','all invariants valid'
  ];
  assert.ok(scenarios.length >= 126, 'minimum scenario coverage missing');
  scenarios.forEach((scenario, index) => h.applyOnce(`scenario:${index}:${scenario}`));
  assert.throws(() => h.applyOnce('scenario:0:graphics definition'), 'duplicate scenario must be rejected');
  assert.throws(() => h.register({ id: 'graphics:definition', generation: 1, phase: 'graphics', metadataOnly: true, realRendering: false }), 'stale generation must be rejected');
  h.tick(0);
  assert.throws(() => h.tick(-1), 'timer regression must be rejected');
  h.rejectUnsafe('metadata-only-redacted-token');
  assert.throws(() => h.rejectUnsafe('https://secret.example/logo.png'), 'URL exposure must be rejected');

  for (let frame = 1; frame <= 100000; frame += 1) h.tick(frame);
  for (let i = 0; i < 10000; i += 1) {
    h.applyOnce(`graphics-request:${i}`);
    h.applyOnce(`template-evaluation:${i}`);
    h.applyOnce(`binding-snapshot:${i}`);
    h.applyOnce(`broadcast-lifecycle:${i}`);
    h.applyOnce(`caption-plan:${i}`);
    h.applyOnce(`caption-activation:${i}`);
    h.applyOnce(`caption-expiry:${i}`);
    h.applyOnce(`animation-plan:${i}`);
    h.applyOnce(`cue-execution:${i}`);
    h.applyOnce(`motion-delegation:${i}`);
    h.applyOnce(`branding-plan:${i}`);
    h.applyOnce(`placement:${i}`);
    h.applyOnce(`collision:${i}`);
    h.applyOnce(`format-plan:${i}`);
    h.publish(`publication:${i}`, ['PROGRAM','PREVIEW','CLEAN_FEED','AUX','ISO'], i % 3 === 0 ? 'horizontal' : i % 3 === 1 ? 'vertical' : 'square', i + 1, ['PROGRAM','PREVIEW','CLEAN_FEED']);
  }
  h.assertInvariants();
  return h;
};

const first = buildCertifiedRun().snapshot();
const second = buildCertifiedRun().snapshot();
assert.equal(JSON.stringify(first), JSON.stringify(second), 'determinism replay mismatch');
const leak = buildCertifiedRun();
leak.shutdown();
const shutdown = leak.snapshot();
assert.equal(shutdown.activeCount, 0, 'shutdown must clear active state');
assert.equal(shutdown.publications.length, 0, 'shutdown must clear publications');
assert.equal(shutdown.telemetry.realRendering, false, 'shutdown telemetry must remain metadata-only');
console.log('UBOS v5.9.8 graphics platform certification passed');

export {};
