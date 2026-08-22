import { test, expect } from '@playwright/test';

test.describe('Kittutools Live Loot Deals Section E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Live Loot Deals section renders on homepage with BOLD Copperplate header and badge count', async ({ page }) => {
    const dealsSection = page.locator('#live-loot-deals-section');
    await expect(dealsSection).toBeVisible();

    const title = dealsSection.locator('h2');
    await expect(title).toContainText('LIVE LOOT DEALS');

    const badge = page.locator('#deals-count-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('100+ Big Offers (70%+ Off)');
  });

  test('Carousel track filters and only displays deals with 70%+ discount', async ({ page }) => {
    // Wait for carousel cards to be rendered
    const carouselTrack = page.locator('#loot-deals-track');
    await expect(carouselTrack).toBeVisible();

    const cards = carouselTrack.locator('.deal-card-item');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(100);

    // Verify all deals rendered have discounts >= 70%
    const discounts = await page.evaluate(() => {
      const filtered = window.DealsModule ? window.DealsModule.getFilteredDeals() : [];
      return filtered.map(d => d.discount);
    });

    expect(discounts.length).toBeGreaterThanOrEqual(100);
    for (const disc of discounts) {
      expect(disc).toBeGreaterThanOrEqual(70);
    }
  });

  test('Cards feature store badges, discount badges, and ticking countdown timers', async ({ page }) => {
    const firstCard = page.locator('#loot-deals-track .deal-card-item').first();
    await expect(firstCard).toBeVisible();

    // Check store badge (Amazon, Flipkart, Blinkit, BigBasket)
    const storeBadge = firstCard.locator('span:has-text("Amazon"), span:has-text("Flipkart"), span:has-text("Blinkit"), span:has-text("BigBasket")').first();
    await expect(storeBadge).toBeVisible();

    // Check discount badge
    const discountBadge = firstCard.locator('span:has-text("OFF")').first();
    await expect(discountBadge).toBeVisible();

    // Check ticking countdown timer
    const countdownTimer = firstCard.locator('.countdown-timer-display');
    await expect(countdownTimer).toBeVisible();
    const timerText = await countdownTimer.textContent();
    expect(timerText).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('Manual navigation controls (Previous / Next Red Arrows) scroll the track', async ({ page }) => {
    const track = page.locator('#loot-deals-track');
    const nextBtn = page.locator('#loot-carousel-next');

    await expect(nextBtn).toBeVisible();

    const initialScroll = await track.evaluate(el => el.scrollLeft);
    await nextBtn.click();
    await page.waitForTimeout(500);

    const newScroll = await track.evaluate(el => el.scrollLeft);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test('Automated Live Status Simulation overlay displays SOLD OUT or DEAL ENDED banner', async ({ page }) => {
    const firstCard = page.locator('#loot-deals-track .deal-card-item').first();
    await expect(firstCard).toBeVisible();

    const dealId = await firstCard.getAttribute('data-deal-id');
    expect(dealId).toBeTruthy();

    // Trigger overlay via module test helper
    await page.evaluate((id) => {
      if (window.DealsModule) {
        window.DealsModule.triggerOverlay(id, 'SOLD OUT');
      }
    }, dealId);

    const overlay = firstCard.locator('.deal-overlay-container');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('🔥 SOLD OUT');

    // Remove overlay / refresh card
    await page.evaluate((id) => {
      if (window.DealsModule) {
        window.DealsModule.removeOverlay(id);
      }
    }, dealId);

    await expect(overlay).toBeHidden();
  });

});
