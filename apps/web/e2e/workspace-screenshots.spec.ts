import { collectBrowserErrors, expect, test } from './helpers/workspace';
collectBrowserErrors();
const viewports = [[1920, 1080], [1600, 900], [1440, 900], [1280, 720]] as const;
const workspaces = [['director', '/control-room', /Production Rundown/i], ['sources', '/control-room/sources', /Sources Workspace/i], ['social-fabric', '/control-room/social-fabric', /Social Operations Center/i]] as const;
for (const [name, route, heading] of workspaces) for (const [width, height] of viewports) {
  test(`${name} viewport evidence ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height }); await page.goto(route);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${name}-${width}x${height}.png`) });
  });
}
