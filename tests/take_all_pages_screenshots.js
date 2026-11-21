import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser for comprehensive page screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir =
    'C:/Users/ntrun/.gemini/antigravity/brain/cbb56898-9b1b-457a-94eb-b95f7f50979c';

  const routes = [
    { url: 'http://localhost:5173/', name: 'homepage-no-overlap.png', wait: 2000 },
    { url: 'http://localhost:5173/wishlist', name: 'page-wishlist.png', wait: 1500 },
    { url: 'http://localhost:5173/cart', name: 'page-cart.png', wait: 1500 },
    { url: 'http://localhost:5173/checkout', name: 'page-checkout.png', wait: 1500 },
    { url: 'http://localhost:5173/build-pc', name: 'page-build-pc.png', wait: 1500 },
    { url: 'http://localhost:5173/compare', name: 'page-compare.png', wait: 1500 },
    { url: 'http://localhost:5173/ai-assistant', name: 'page-ai-assistant.png', wait: 1500 },
    { url: 'http://localhost:5173/trade-in', name: 'page-trade-in.png', wait: 1500 },
    { url: 'http://localhost:5173/posts', name: 'page-news.png', wait: 1500 },
    { url: 'http://localhost:5173/order-tracking', name: 'page-order-tracking.png', wait: 1500 },
    { url: 'http://localhost:5173/stores', name: 'page-stores.png', wait: 1500 },
    { url: 'http://localhost:5173/profile', name: 'page-profile.png', wait: 1500 },
    { url: 'http://localhost:5173/search?cat=laptop', name: 'page-search-catalog.png', wait: 1500 },
    { url: 'http://localhost:5173/admin', name: 'page-admin-dashboard.png', wait: 1500 },
  ];

  for (const r of routes) {
    try {
      console.log(`Navigating to ${r.url} ...`);
      await page.goto(r.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(r.wait);
      await page.screenshot({ path: `${artifactDir}/${r.name}` });
      console.log(`Saved screenshot: ${r.name}`);
    } catch (err) {
      console.error(`Failed to capture ${r.url}:`, err);
    }
  }

  console.log('All dedicated pages screens captured successfully!');
  await browser.close();
})();
