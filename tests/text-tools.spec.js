import { test, expect } from '@playwright/test';

test.describe('Kittutools 4 Text & SEO Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: Ultimate Word & Character Counter modal opens, calculates stats, and copies text', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Ultimate Word & Character Counter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#word-counter-modal');
        await expect(modal).toBeVisible();

        const textarea = page.locator('#wc-input-text');
        await textarea.fill('Hello world! This is a test sentence. Kittutools is fast and free.');

        // Verify real-time stats calculations
        await expect(page.locator('#wc-words')).toHaveText('12');
        await expect(page.locator('#wc-chars')).toHaveText('66');
        await expect(page.locator('#wc-chars-nospace')).toHaveText('55');
        await expect(page.locator('#wc-sentences')).toHaveText('3');
        await expect(page.locator('#wc-paragraphs')).toHaveText('1');

        // Test clear text button
        await page.locator('#word-counter-modal button:has-text("Clear Text")').click();
        await expect(page.locator('#wc-words')).toHaveText('0');
        await expect(page.locator('#wc-chars')).toHaveText('0');

        // Close modal
        await page.locator('#word-counter-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: Pro Case Converter modal opens and performs case conversions', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Pro Case Converter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#case-converter-modal');
        await expect(modal).toBeVisible();

        const textarea = page.locator('#cc-input-text');
        await textarea.fill('Hello World kittutools text');

        // Test UPPERCASE
        await page.locator('#case-converter-modal button:has-text("UPPERCASE")').click();
        await expect(textarea).toHaveValue('HELLO WORLD KITTUTOOLS TEXT');

        // Test lowercase
        await page.locator('#case-converter-modal button:has-text("lowercase")').click();
        await expect(textarea).toHaveValue('hello world kittutools text');

        // Test Title Case
        await page.locator('#case-converter-modal button:has-text("Title Case")').click();
        await expect(textarea).toHaveValue('Hello World Kittutools Text');

        // Test Slugify
        await page.locator('#case-converter-modal button:has-text("Slugify URL")').click();
        await expect(textarea).toHaveValue('hello-world-kittutools-text');

        // Close modal
        await page.locator('#case-converter-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Advanced Lorem Ipsum Generator modal opens and generates dummy text with HTML tags', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Advanced Lorem Ipsum Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#lorem-ipsum-modal');
        await expect(modal).toBeVisible();

        const outputArea = page.locator('#lorem-output');
        await expect(outputArea).not.toHaveValue('');

        // Change quantity to 2
        await page.locator('#lorem-quantity').fill('2');

        // Check HTML tags
        await page.locator('#lorem-html-tags').check();
        const valueWithTags = await outputArea.inputValue();
        expect(valueWithTags).toContain('<p>');

        // Close modal
        await page.locator('#lorem-ipsum-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 4: Smart Remove Duplicate Lines Tool modal opens, removes duplicates, sorts, and exports', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Smart Remove Duplicate Lines' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#remove-duplicates-modal');
        await expect(modal).toBeVisible();

        const textarea = page.locator('#rd-input-text');
        await textarea.fill('Banana\nApple\nbanana\nApple\nOrange');

        // Check notification badge
        await expect(page.locator('#rd-notification-badge')).toBeVisible();
        await expect(page.locator('#rd-removed-count')).toHaveText('2'); // Case insensitive: Banana=banana, Apple=Apple -> 2 dupes

        // Apply sorting A-Z
        await page.locator('#rd-sort-order').selectOption('a-z');

        // Apply remove duplicates
        await page.locator('#rd-notification-badge button:has-text("Remove Duplicates Now")').click();
        await expect(textarea).toHaveValue('Apple\nBanana\nOrange');

        // Close modal
        await page.locator('#remove-duplicates-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

});
