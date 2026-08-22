import { test, expect } from '@playwright/test';

test.describe('Kittutools Multi-Tool Homepage Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Homepage loads correctly with brand title and 34 tool cards', async ({ page }) => {
        await expect(page).toHaveTitle(/KITTUTOOLS/i);

        // Brand logo verification
        const logo = page.locator('header a span').first();
        await expect(logo).toHaveText('KITTUTOOLS');

        // Check cards count
        const cards = page.locator('.tool-card');
        await expect(cards).toHaveCount(34);

        // Check count indicator badge
        const countText = page.locator('#visible-count');
        await expect(countText).toHaveText('34');

        // Screenshot homepage
        await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });
    });

    test('Instant search filters tool cards in real time', async ({ page }) => {
        const searchInput = page.locator('#global-search-input');

        // Search for "JPG to PDF"
        await searchInput.fill('JPG to PDF');

        const visibleCards = page.locator('.tool-card:not(.hidden)');
        await expect(visibleCards).toHaveCount(1);
        await expect(visibleCards.first()).toContainText('JPG to PDF Converter');

        // Search for something non-existent
        await searchInput.fill('xyz123nonexistent');
        await expect(page.locator('#no-results')).toBeVisible();
        await expect(page.locator('#visible-count')).toHaveText('0');

        // Clear search
        await page.locator('#clear-search-btn').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(34);
    });

    test('Category filtering works as expected', async ({ page }) => {
        // Click Image Tools tab (has 10 tools)
        await page.locator('button[data-category="image"]').click();

        const visibleCards = page.locator('.tool-card:not(.hidden)');
        await expect(visibleCards).toHaveCount(10);
        await expect(page.locator('#visible-count')).toHaveText('10');

        // Click PDF Tools tab (has 6 tools)
        await page.locator('button[data-category="pdf"]').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(6);

        // Click Utilities tab (has 9 tools)
        await page.locator('button[data-category="utility"]').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(9);

        // Click All Tools tab
        await page.locator('button[data-category="all"]').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(34);
    });

    test('JPG to PDF Modal workflow opens and operates properly', async ({ page }) => {
        // Open modal
        await page.locator('.tool-card').first().click();
        const modal = page.locator('#jpg-to-pdf-modal');
        await expect(modal).toBeVisible();

        // Check controls presence
        await expect(page.locator('#pdf-orientation')).toBeVisible();
        await expect(page.locator('#pdf-margin')).toBeVisible();
        await expect(page.locator('#pdf-filename')).toBeVisible();

        // Take screenshot of modal UI
        await page.screenshot({ path: 'screenshot-jpg-to-pdf-modal.png' });

        // Close modal
        await page.locator('#jpg-to-pdf-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('WhatsApp contact buttons are correctly formatted, layered, and clickable on desktop and mobile', async ({ page }) => {
        // Query all WhatsApp links on the page
        const whatsappLinks = page.locator('a[href*="wa.me"]');
        const count = await whatsappLinks.count();
        expect(count).toBeGreaterThanOrEqual(3);

        for (let i = 0; i < count; i++) {
            const link = whatsappLinks.nth(i);
            await expect(link).toHaveAttribute('href', 'https://wa.me');
            await expect(link).toHaveAttribute('target', '_blank');
            await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

            const classList = await link.getAttribute('class');
            expect(classList).toContain('cursor-pointer');
            expect(classList).toContain('pointer-events-auto');
            expect(classList).toContain('z-50');
        }

        // Test floating WhatsApp button clickability on Desktop
        const floatingBtn = whatsappLinks.last();
        await expect(floatingBtn).toBeVisible();
        await floatingBtn.click();

        // Test floating WhatsApp button clickability on Mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(floatingBtn).toBeVisible();
        await floatingBtn.click();
    });

    test('Footer legal modals open properly', async ({ page }) => {
        // Open Privacy Policy
        await page.locator('button:has-text("Privacy Policy")').click();
        await expect(page.locator('#privacy-modal')).toBeVisible();
        await page.locator('#privacy-modal button:has-text("I Understand")').click();
        await expect(page.locator('#privacy-modal')).not.toBeVisible();

        // Open Terms of Service
        await page.locator('button:has-text("Terms of Service")').click();
        await expect(page.locator('#terms-modal')).toBeVisible();
        await page.locator('#terms-modal button:has-text("Accept Terms")').click();
        await expect(page.locator('#terms-modal')).not.toBeVisible();

        // Open Contact Us
        await page.locator('button:has-text("Contact Us")').click();
        await expect(page.locator('#contact-modal')).toBeVisible();
        await page.locator('#contact-modal input[type="text"]').fill('John Doe');
        await page.locator('#contact-modal input[type="email"]').fill('john@example.com');
        await page.locator('#contact-modal textarea').fill('Great website!');
        await page.locator('#contact-modal button[type="submit"]').click();
        await expect(page.locator('#contact-modal')).not.toBeVisible();
    });

});
