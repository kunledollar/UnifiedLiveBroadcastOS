import { collectBrowserErrors, expect, expectWorkspaceReady, test } from './helpers/workspace';
const errors = collectBrowserErrors();
test('Control Room Director controls retain monitor identity without browser errors', async ({ page }) => {
  await page.goto('/control-room');
  await expectWorkspaceReady(page, /Production Rundown/i);
  const program = page.getByTestId('program-monitor'); const preview = page.getByTestId('preview-monitor');
  await expect(program).toBeVisible(); await expect(preview).toBeVisible();
  const programHandle = await program.elementHandle(); const previewHandle = await preview.elementHandle();
  await page.getByRole('button', { name: /LIVE|NEXT/i }).nth(1).click();
  await page.getByRole('tab', { name: 'Logs' }).click();
  for (const control of ['CUT', 'AUTO', 'TAKE']) await page.getByRole('button', { name: control, exact: true }).click();
  expect(await programHandle?.evaluate(element => element.isConnected)).toBe(true);
  expect(await previewHandle?.evaluate(element => element.isConnected)).toBe(true);
  expect(errors().messages()).toEqual([]);
});
