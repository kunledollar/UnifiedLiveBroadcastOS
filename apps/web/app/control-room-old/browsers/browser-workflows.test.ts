import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { preferredSourceDockTab, sourceDockTabs, commandRailItems } from '../broadcast-command-center/command-rail-constants.js';
import { sourceAddTypes } from './source-browser-utils.js';

describe('command rail constants', () => {
  it('exposes all required command rail items', () => {
    const labels = commandRailItems.map((item) => item.label);
    assert.deepEqual(labels, [
      'Dashboard',
      'Production Graph',
      'Nodes',
      'Inputs',
      'Outputs',
      'Scenes',
      'Settings',
    ]);
  });

  it('exposes all required source dock tabs', () => {
    const labels = sourceDockTabs.map((tab) => tab.label);
    assert.deepEqual(labels, ['Scenes', 'Sources', 'Media', 'Graphics', 'Guests', 'Diagnostics']);
  });

  it('maps scenes and inputs rail items to dock tabs', () => {
    assert.equal(preferredSourceDockTab('scenes'), 'scenes');
    assert.equal(preferredSourceDockTab('inputs'), 'sources');
    assert.equal(preferredSourceDockTab('dashboard'), null);
  });
});

describe('source add workflows', () => {
  it('preserves camera, screen, media, and browser add types', () => {
    assert.ok(sourceAddTypes.includes('camera'));
    assert.ok(sourceAddTypes.includes('screen'));
    assert.ok(sourceAddTypes.includes('media'));
    assert.ok(sourceAddTypes.includes('browser'));
  });
});
