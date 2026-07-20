import { expect, test } from './helpers/workspace';

const desktop = { width: 1440, height: 960 };
test('Program and Preview retain their DOM nodes while a workspace changes', async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto('/control-room/director');
  const program = page.getByTestId('ubos-program-monitor');
  const preview = page.getByTestId('ubos-preview-monitor');
  await expect(program).toBeVisible(); await expect(preview).toBeVisible();
  const programNode = await program.elementHandle();
  const previewNode = await preview.elementHandle();
  expect(programNode).not.toBeNull(); expect(previewNode).not.toBeNull();
  await page.getByRole('link', { name: /Audio Engineer/ }).click();
  await expect(page.getByRole('heading', { name: 'Mixer & Meters' })).toBeVisible();
  expect(await program.evaluate((node, initial) => node === initial, programNode!)).toBe(true);
  expect(await preview.evaluate((node, initial) => node === initial, previewNode!)).toBe(true);
  await expect(page.getByTestId('workspace-dock-manager')).toBeVisible();
  await expect(page.getByText('AUDIO ENGINEER WORKBENCH')).toBeVisible();
  await expect(page.getByText('Monitor bus')).toBeVisible();
});
test('desktop monitors remain side-by-side and stack only at the responsive breakpoint', async ({ page }) => {
  await page.setViewportSize(desktop); await page.goto('/control-room/graphics-operator');
  const [program, preview] = await Promise.all([page.getByTestId('ubos-program-monitor').boundingBox(),page.getByTestId('ubos-preview-monitor').boundingBox()]);
  expect(program?.y).toBe(preview?.y); expect(program!.width).toBeLessThan(preview!.width);
  await page.setViewportSize({width:800,height:960});
  const [smallProgram, smallPreview] = await Promise.all([page.getByTestId('ubos-program-monitor').boundingBox(),page.getByTestId('ubos-preview-monitor').boundingBox()]);
  expect(smallPreview!.y).toBeGreaterThan(smallProgram!.y);
});
