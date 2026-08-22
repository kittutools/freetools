import { test, expect } from '@playwright/test';

test.describe('Kittutools Live Loot Deals Section End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Live Loot Deals section is positioned at the top of homepage directly below Hero and above Tools Grid', async ({ page }) => {
        const dealsSection = page.locator('#live-loot-deals-section');
        await expect(dealsSection).toBeVisible();

        // Check heading text
        const heading = dealsSection.locator('h2');
        await expect(heading).toContainText('Live Loot Deals');

        // Check section ordering relative to Hero and Categories/Tools
        const heroBounding = await page.locator('section').first().boundingBox();
        const dealsBounding = await dealsSection.boundingBox();
        const toolsBounding = await page.locator('#categories-section').boundingBox();

        expect(dealsBounding.y).toBeGreaterThanOrEqual(heroBounding.y + heroBounding.height - 20);
        expect(toolsBounding.y).toBeGreaterThanOrEqual(dealsBounding.y + dealsBounding.height - 20);
    });

    test('Loot deals render dynamically from deals.json with high-contrast typography, badges, and 3D buttons', async ({ page }) => {
        const dealsGrid = page.locator('#loot-deals-grid');
        await expect(dealsGrid).toBeVisible();

        const dealCards = page.locator('.deal-card');
        const count = await dealCards.count();
        expect(count).toBeGreaterThanOrEqual(4);

        // Check store badges present
        const amazonBadge = page.locator('.deal-card span:has-text("Amazon")').first();
        await expect(amazonBadge).toBeVisible();
        await expect(amazonBadge).toHaveClass(/font-extrabold/);

        const blinkitBadge = page.locator('.deal-card span:has-text("Blinkit")').first();
        await expect(blinkitBadge).toBeVisible();
        await expect(blinkitBadge).toHaveClass(/font-extrabold/);

        // Check GRAB DEAL NOW 3D elevation button
        const grabBtn = page.locator('.grab-deal-btn').first();
        await expect(grabBtn).toBeVisible();
        await expect(grabBtn).toContainText('GRAB DEAL NOW');
        const classList = await grabBtn.getAttribute('class');
        expect(classList).toContain('hover:-translate-y-1');
        expect(classList).toContain('shadow-');

        // Check Red Neon container glowing border
        const container = page.locator('#live-loot-deals-section > div');
        const containerClasses = await container.getAttribute('class');
        expect(containerClasses).toContain('shadow-[0_0_20px_rgba(239,68,68,0.7)]');
        expect(containerClasses).toContain('border-2');
        expect(containerClasses).toContain('border-red-500/80');
    });

    test('Deal category filters ("All", "Groceries", "Electronics") filter deals dynamically', async ({ page }) => {
        const groceriesFilterBtn = page.locator('button[data-deal-category="groceries"]');
        await groceriesFilterBtn.click();

        const visibleCards = page.locator('.deal-card');
        const countGroceries = await visibleCards.count();
        expect(countGroceries).toBeGreaterThan(0);

        for (let i = 0; i < countGroceries; i++) {
            const cat = await visibleCards.nth(i).getAttribute('data-category');
            expect(cat).toBe('groceries');
        }

        // Switch to Electronics filter
        const electronicsFilterBtn = page.locator('button[data-deal-category="electronics"]');
        await electronicsFilterBtn.click();

        const visibleElec = page.locator('.deal-card');
        const countElec = await visibleElec.count();
        expect(countElec).toBeGreaterThan(0);

        for (let i = 0; i < countElec; i++) {
            const cat = await visibleElec.nth(i).getAttribute('data-category');
            expect(cat).toBe('electronics');
        }

        // Switch back to All
        const allFilterBtn = page.locator('button[data-deal-category="all"]');
        await allFilterBtn.click();
        const countAll = await page.locator('.deal-card').count();
        expect(countAll).toBeGreaterThanOrEqual(countGroceries + countElec);
    });

    test('Live countdown timers count down continuously on deal cards', async ({ page }) => {
        const timer = page.locator('.deal-timer').first();
        await expect(timer).toBeVisible();

        const initialTime = await timer.textContent();
        expect(initialTime).toMatch(/\d{2}:\d{2}:\d{2}/);

        // Wait 1.5s and verify time changes
        await page.waitForTimeout(1500);
        const updatedTime = await timer.textContent();
        expect(updatedTime).not.toBe(initialTime);
    });

    test('Section layout displays flawlessly on mobile and desktop viewports without breaks', async ({ page }) => {
        // Desktop Viewport
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect(page.locator('#live-loot-deals-section')).toBeVisible();
        await expect(page.locator('#loot-deals-grid')).toBeVisible();

        // Mobile Viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('#live-loot-deals-section')).toBeVisible();
        await expect(page.locator('#loot-deals-grid')).toBeVisible();

        // Check mobile responsiveness of filter buttons and deal cards
        const firstCard = page.locator('.deal-card').first();
        await expect(firstCard).toBeVisible();
        const cardBox = await firstCard.boundingBox();
        expect(cardBox.width).toBeLessThanOrEqual(375);
    });

});
