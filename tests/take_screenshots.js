import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. Screenshot of the Hero Section
  console.log('Taking hero screenshot...');
  await page.screenshot({
    path: 'C:/Users/ntrun/.gemini/antigravity/brain/cbb56898-9b1b-457a-94eb-b95f7f50979c/hero-fixed-live.png',
  });

  // 2. Scroll to Products Catalog and take screenshot
  console.log('Scrolling to products catalog...');
  const catalog = page.locator('.products-grid').first();
  await catalog.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'C:/Users/ntrun/.gemini/antigravity/brain/cbb56898-9b1b-457a-94eb-b95f7f50979c/products-crisp-live.png',
  });

  // 3. Open Auth Modal and take screenshot
  console.log('Opening auth modal...');
  await page.locator('.header-action--account').click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: 'C:/Users/ntrun/.gemini/antigravity/brain/cbb56898-9b1b-457a-94eb-b95f7f50979c/auth-modal-fixed-live.png',
  });

  // 4. Navigate to dedicated /auth/login page
  console.log('Navigating to /auth/login...');
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'C:/Users/ntrun/.gemini/antigravity/brain/cbb56898-9b1b-457a-94eb-b95f7f50979c/auth-page-login-live.png',
  });

  console.log('All screenshots taken successfully!');
  await browser.close();
})();
