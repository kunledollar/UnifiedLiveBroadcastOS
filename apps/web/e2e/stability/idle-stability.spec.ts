import { expect, test } from '@playwright/test';
import { BrowserErrorCollector } from '../helpers/browser-errors';
const minutes = Number(process.env.UBOS_STABILITY_MINUTES ?? 10);
test(`Control Room remains geometrically stable for ${minutes} minutes`, async ({ page }, testInfo) => {
  test.setTimeout((minutes * 60 + 45) * 1000);
  const errors = new BrowserErrorCollector(page); errors.attach();
  let reloads = 0; page.on('framenavigated', frame => { if (frame === page.mainFrame() && frame.url() !== 'about:blank') reloads += 1; });
  await page.goto('/control-room'); await expect(page.getByTestId('program-monitor')).toBeVisible();
  const monitors = [page.getByTestId('program-monitor'), page.getByTestId('preview-monitor')];
  const initial = await Promise.all(monitors.map(monitor => monitor.boundingBox()));
  const samples = Math.ceil(minutes * 60 / 20);
  for (let sample = 0; sample < samples; sample += 1) {
    await page.waitForTimeout(20_000);
    const current = await Promise.all(monitors.map(monitor => monitor.boundingBox()));
    current.forEach((box, index) => {
      expect(Math.abs(box!.width - initial[index]!.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(box!.height - initial[index]!.height)).toBeLessThanOrEqual(2);
    });
  }
  expect(reloads).toBe(1); await errors.assertClean(testInfo);
});
