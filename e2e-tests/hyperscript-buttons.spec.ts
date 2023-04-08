import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Playwright `expect().toHaveCSS()` apparently uses `getComputedStyle()` which
// always reports in this `rgb()` format
const BLACK_CSS = "rgb(33, 53, 71)";
const GREEN_CSS = "rgb(0, 128, 0)";

test('has title', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Hyperscript/);
});

test('log button logs', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // When anything logs to the console, the flag will be flipped
    let logCount = 0;
    page.on('console', (msg) => {
        // Ignore Vite dev message
        if (msg.text().match(/vite.*connected/)) return;
        logCount += 1
    });

    // Click the log button.
    const indicator = page.locator('[hs-indicate-log]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(logCount).toBe(1);
});

test('JS call button turns the indicator red', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-global-js-call]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});

test('Use `next` expression', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-next-expression]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});

test('Set color style', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-set-color-style]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});

test('Multi-line on-click feature', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-multi-line]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});

test('Delay 1 second', async ({ page, context }, testInfo) => {
    // From https://github.com/microsoft/playwright/issues/6347#issuecomment-1092881462
    // Insert sinon into the browser so we can mess with timers
    const sinonPath = path.join(__dirname, '..', './node_modules/sinon/pkg/sinon.js');
    await context.addInitScript({
        path: sinonPath,
    });
    await context.addInitScript(() => {
        //@ts-ignore This code is run in browser, so not going to try to type it
        window.__clock = sinon.useFakeTimers();
    });
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-delay]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    // Ensure controlled time
    await expect(indicator).toHaveCSS('color', BLACK_CSS, { timeout: 1 /* ms */ })
    await page.evaluate(() => {
        //@ts-ignore This code is run in browser, so not going to try to type it
        window.__clock.tick(1000)
    });
    await expect(indicator).toHaveCSS('color', GREEN_CSS, { timeout: 1 /* ms */ })
});

test('Local variables', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-local-var]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});

test('Global window variables', async ({ page }, testInfo) => {
    await page.goto(`http://localhost:${testInfo?.config?.webServer?.port}/`);

    // Click the log button.
    const indicator = page.locator('[hs-indicate-global-window-var]');
    const container = page.locator('tr', { has: indicator })
    await container.getByRole('button').click();

    await expect(indicator).toHaveCSS('color', GREEN_CSS)
});
