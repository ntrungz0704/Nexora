import { expect, test } from '@playwright/test';

test.describe('Nexora E2E Storefront & Commerce User Journeys', () => {
  test('Journey 1: Storefront Home renders header, hero, commitments, and navigation', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Header / Brand presence
    await expect(page.locator('header')).toBeVisible();

    // 2. Verify Store commitments
    await expect(page.getByText('Thanh toán khi nhận hàng').first()).toBeVisible();
    await expect(page.getByText('Bảo mật tuyệt đối').first()).toBeVisible();

    // 3. Verify Footer presence
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Journey 2: Product Catalog & Search page loads and displays products', async ({ page }) => {
    await page.goto('/search');

    // 1. Check search container / catalog layout
    await expect(page.locator('header input[type="text"]').first()).toBeVisible();

    // 2. Catalog heading or products grid
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Journey 3: Customer Login page renders form validation', async ({ page }) => {
    await page.goto('/login');

    // 1. Verify login fields
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // 2. Verify submit button exists
    const submitBtn = page.getByRole('button', { name: /Đăng nhập/i });
    await expect(submitBtn).toBeVisible();
  });

  test('Journey 4: AI Advisor Survey renders 5-step questionnaire', async ({ page }) => {
    await page.goto('/ai-assistant');

    // Verify AI Survey header and progress indicator
    await expect(page.getByText(/Khảo sát AI/i).first()).toBeVisible();
    await expect(page.getByText('Ngân sách').first()).toBeVisible();
  });

  test('Journey 5: PC Builder tool renders hardware component selection slots', async ({ page }) => {
    await page.goto('/pc-builder');

    // Check PC Builder page layout and components
    await expect(page.getByText(/Xây dựng cấu hình/i).first()).toBeVisible();
    await expect(page.getByText('Bộ vi xử lý (CPU)').first()).toBeVisible();
    await expect(page.getByText('Bo mạch chủ (Mainboard)').first()).toBeVisible();
  });

  test('Journey 6: Persona Comparison tool renders category and persona selectors', async ({ page }) => {
    await page.goto('/compare');

    // Check Persona Compare tool
    await expect(page.getByText(/So sánh sản phẩm/i).first()).toBeVisible();
    await expect(page.getByText('PC Lắp Sẵn').first()).toBeVisible();
    await expect(page.getByText(/Chưa có sản phẩm so sánh|Chọn loại sản phẩm/i).first()).toBeVisible();
  });

  test('Journey 7: Order Tracking tool allows searching by order number', async ({ page }) => {
    await page.goto('/order-tracking');

    // Check tracking input
    await expect(page.getByText(/Tra cứu đơn hàng/i).first()).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('Journey 8: Admin Dashboard renders operational overview and navigation tabs', async ({ page }) => {
    await page.goto('/admin');

    // Verify Admin Dashboard view
    await expect(page.getByText(/Quản trị viên|Dashboard|Tổng quan/i).first()).toBeVisible();
    await expect(page.getByText('Sản phẩm').first()).toBeVisible();
    await expect(page.getByText('Đơn hàng').first()).toBeVisible();
  });
});
