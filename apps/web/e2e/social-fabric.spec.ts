import { collectBrowserErrors, expect, expectWorkspaceReady, test } from './helpers/workspace';
const errors = collectBrowserErrors();
test('Social Fabric workbench tabs render without React warnings', async ({ page }) => {
  await page.goto('/control-room/social-fabric');
  await expectWorkspaceReady(page, /Social Operations Center/i);
  await expect(page.getByRole('heading', { name: /Platform overview/i })).toBeVisible();
  await expect(page.getByText(/Total viewers/i)).toBeVisible();
  for (const tab of ['Unified Chat', 'Moderation', 'Publishing', 'Cross Share', 'Cross Follow', 'CRM', 'Analytics', 'Logs']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }
  await expect(page.getByRole('heading', { name: /Live events/i })).toBeVisible();
  expect(errors().messages().join('\n')).not.toContain('Each child in a list should have a unique "key" prop');
});
