import { test, expect } from '@playwright/test';

test.describe('Kittutools Multi-Tool Homepage Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Homepage loads correctly with brand title and 20 tool cards', async ({ page }) => {
        await expect(page).toHaveTitle(/Kittutools/);

        // Brand logo verification
        const logo = page.locator('header a span').first();
        await expect(logo).toHaveText('Kittutools');

        // Check cards count
        const cards = page.locator('.tool-card');
        await expect(cards).toHaveCount(20);

        // Check count indicator badge
        const countText = page.locator('#visible-count');
        await expect(countText).toHaveText('20');

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
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(20);
    });

    test('Category filtering works as expected', async ({ page }) => {
        // Click Image Tools tab
        await page.locator('button[data-category="image"]').click();

        const visibleCards = page.locator('.tool-card:not(.hidden)');
        await expect(visibleCards).toHaveCount(5);
        await expect(page.locator('#visible-count')).toHaveText('5');

        // Click PDF Tools tab
        await page.locator('button[data-category="pdf"]').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(5);

        // Click All Tools tab
        await page.locator('button[data-category="all"]').click();
        await expect(page.locator('.tool-card:not(.hidden)')).toHaveCount(20);
    });

    test('JPG to PDF Modal workflow opens and operates properly', async ({ page }) => {
        // Open modal
        await page.locator('.tool-card').first().click();
        const modal = page.locator('#jpg-to-pdf-modal');
        await expect(modal).toBeVisible();

        // Check controls presence
        await expect(page.locator('#pdf-page-size')).toBeVisible();
        await expect(page.locator('#pdf-orientation')).toBeVisible();
        await expect(page.locator('#pdf-quality')).toBeVisible();
        await expect(page.locator('#pdf-margin')).toBeVisible();
        await expect(page.locator('#pdf-filename')).toBeVisible();

        // Verify orientation gets disabled when 'Auto (Fit Image Size)' is selected
        await expect(page.locator('#pdf-orientation')).toBeEnabled();
        await page.locator('#pdf-page-size').selectOption('auto');
        await expect(page.locator('#pdf-orientation')).toBeDisabled();
        await page.locator('#pdf-page-size').selectOption('a4');
        await expect(page.locator('#pdf-orientation')).toBeEnabled();

        // Upload sample image to test thumbnail rendering, deletion, and clear all
        const buffer = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        await page.setInputFiles('#image-file-input', {
            name: 'test-sample.png',
            mimeType: 'image/png',
            buffer: buffer
        });

        // Verify thumbnail visible
        await expect(page.locator('#image-thumbnails-grid')).toBeVisible();
        await expect(page.locator('#selected-image-count')).toHaveText('1 file');
        await expect(page.locator('#convert-pdf-btn')).toBeEnabled();
        await expect(page.locator('#clear-all-images-btn')).toBeVisible();

        // Test Clear All button
        await page.locator('#clear-all-images-btn').click();
        await expect(page.locator('#selected-image-count')).toHaveText('0 files');
        await expect(page.locator('#empty-preview-state')).toBeVisible();

        // Upload again to test individual delete button
        await page.setInputFiles('#image-file-input', {
            name: 'test-sample2.png',
            mimeType: 'image/png',
            buffer: buffer
        });
        await expect(page.locator('#selected-image-count')).toHaveText('1 file');
        await page.locator('#image-thumbnails-grid button:has([data-lucide="trash-2"])').click();
        await expect(page.locator('#selected-image-count')).toHaveText('0 files');

        // Take screenshot of modal UI
        await page.screenshot({ path: 'screenshot-jpg-to-pdf-modal.png' });

        // Close modal
        await page.locator('#jpg-to-pdf-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
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
        await page.locator('#contact-modal textarea').fill('Test message');
        await page.locator('#contact-modal button[type="submit"]').click();
        await expect(page.locator('#contact-modal')).not.toBeVisible();
    });

});
