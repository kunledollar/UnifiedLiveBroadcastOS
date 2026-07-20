import { collectBrowserErrors, expect, test } from './helpers/workspace';
const errors = collectBrowserErrors();
const tolerance = 0.08;
test('Control Room Program and Preview monitors have stable 16:9 geometry', async ({ page }) => {
  await page.goto('/control-room');
  const program = page.getByTestId('program-monitor'); const preview = page.getByTestId('preview-monitor');
  await expect(program).toBeVisible(); await expect(preview).toBeVisible();
  const initial = await Promise.all([program.boundingBox(), preview.boundingBox()]);
  await page.waitForTimeout(800);
  const settled = await Promise.all([program.boundingBox(), preview.boundingBox()]);
  for (const [before, after] of initial.map((box, i) => [box, settled[i]] as const)) {
    expect(before?.width).toBeGreaterThan(0); expect(before?.height).toBeGreaterThan(0);
    expect(Math.abs(before!.width / before!.height - 16 / 9)).toBeLessThan(tolerance);
    expect(Math.abs(before!.width - after!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(before!.height - after!.height)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('tab', { name: 'Logs' }).click();
  for (const control of ['CUT', 'AUTO', 'TAKE']) await page.getByRole('button', { name: control, exact: true }).click();
  expect(await program.boundingBox()).toEqual(settled[0]); expect(await preview.boundingBox()).toEqual(settled[1]);
});
test.fixme('role-specific monitor geometry awaits canonical role workspace routes', async () => {});
