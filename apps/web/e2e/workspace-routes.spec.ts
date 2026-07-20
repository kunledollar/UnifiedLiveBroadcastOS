import { collectBrowserErrors, expect, expectWorkspaceReady, test } from './helpers/workspace';
const errors = collectBrowserErrors();

for (const route of [
  ['/control-room', /Production Rundown/i],
  ['/control-room/sources', /Sources Workspace/i],
  ['/control-room/social-fabric', /Social Operations Center/i],
] as const) {
  test(`workspace route ${route[0]} renders in a real browser`, async ({ page }) => {
    await page.goto(route[0]);
    await expectWorkspaceReady(page, route[1]);
    expect(errors().messages()).toEqual([]);
  });
}
