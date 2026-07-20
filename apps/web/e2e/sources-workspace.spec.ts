import { collectBrowserErrors, expect, expectWorkspaceReady, test } from './helpers/workspace';
const errors = collectBrowserErrors();
test('Sources workspace supports catalog, filters, collections, and workbench selection', async ({ page }) => {
  await page.goto('/control-room/sources');
  await expectWorkspaceReady(page, /Sources Workspace/i);
  const cameraOne = page.getByRole('button', { name: /Camera 1/i });
  const cameraTwo = page.getByRole('button', { name: /Camera 2/i });
  await expect(cameraOne).toBeVisible();
  await cameraTwo.click();
  await expect(page.getByRole('heading', { name: 'Camera 2', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: /Search sources/i }).fill('camera');
  await expect(page.getByRole('button', { name: /Camera 1/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Camera 2/i })).toBeVisible();
  await page.getByLabel(/Source health filter/i).selectOption('ready');
  await page.getByRole('button', { name: /All sources/i }).click();
  for (const tab of ['Relationships', 'Templates', 'Preparation', 'Logs', 'Notes']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }
  expect(errors().messages()).toEqual([]);
});
