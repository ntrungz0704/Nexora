import { expect, test } from '@playwright/test';

test('renders Nexora Foundation dashboard and verifies API/DB connectivity', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Nexora Hardware Commerce/i })).toBeVisible();
  await expect(page.getByText('ONLINE')).toBeVisible();
  await expect(page.getByText('Single-Vendor')).toBeVisible();

  await page.getByLabel('Diagnostic Message').fill('Playwright E2E Smoke');
  await page.getByRole('button', { name: /Verify API Roundtrip/i }).click();
  await expect(page.getByText(/Echo Confirmed:/i)).toBeVisible();
});
