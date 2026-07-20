import { expect, test, type Page } from '@playwright/test';
import { BrowserErrorCollector } from './browser-errors';

export { expect, test };
export function collectBrowserErrors() {
  let collector: BrowserErrorCollector;
  test.beforeEach(async ({ page }) => { collector = new BrowserErrorCollector(page); collector.attach(); });
  test.afterEach(async ({}, testInfo) => { await collector.assertClean(testInfo); });
  return () => collector;
}
export async function expectWorkspaceReady(page: Page, heading: RegExp) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.getByText(/404|This page could not be found/i)).toHaveCount(0);
}
