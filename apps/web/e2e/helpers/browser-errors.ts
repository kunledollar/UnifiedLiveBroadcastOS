import { expect, type Page, type TestInfo } from '@playwright/test';

/** Collect browser failures; no console errors are ignored by default. */
export class BrowserErrorCollector {
  private readonly errors: string[] = [];
  constructor(private readonly page: Page) {}

  attach() {
    this.page.on('console', (message) => {
      if (message.type() === 'error') this.errors.push(`console.error: ${message.text()}`);
    });
    this.page.on('pageerror', (error) => this.errors.push(`pageerror: ${error.message}`));
    this.page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? 'unknown failure';
      // Browser-aborted requests are normal navigation cleanup, not application failures.
      if (failure !== 'net::ERR_ABORTED') this.errors.push(`requestfailed: ${request.url()} (${failure})`);
    });
  }

  async assertClean(testInfo?: TestInfo) {
    const overlay = this.page.locator('nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast-errors-parent]');
    if (await overlay.count()) this.errors.push('Next.js development error overlay detected');
    if (testInfo && this.errors.length) await testInfo.attach('browser-errors', { body: this.errors.join('\n'), contentType: 'text/plain' });
    expect(this.errors, `Unexpected browser errors:\n${this.errors.join('\n')}`).toEqual([]);
  }

  messages() { return [...this.errors]; }
}
