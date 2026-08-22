import { test, expect } from '@playwright/test';

test.describe('Kittutools 5 New Standalone Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: Dedicated PNG to JPG Converter modal opens and has quality and bg color controls', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'PNG to JPG Converter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#png-to-jpg-modal');
        await expect(modal).toBeVisible();

        // Check Quality slider & BG color buttons
        await expect(page.locator('#png-quality-slider')).toBeVisible();
        await expect(page.locator('#png-bg-white-btn')).toBeVisible();
        await expect(page.locator('#png-bg-black-btn')).toBeVisible();

        // Change quality slider
        await page.locator('#png-quality-slider').fill('80');
        await expect(page.locator('#png-quality-val')).toHaveText('80%');

        // Click black background
        await page.locator('#png-bg-black-btn').click();

        // Close modal
        await page.locator('#png-to-jpg-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: SVG to PNG Converter modal opens and updates width and height inputs', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'SVG to PNG' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#svg-to-png-modal');
        await expect(modal).toBeVisible();

        // Check width and height inputs
        const wInput = page.locator('#svg-width-input');
        const hInput = page.locator('#svg-height-input');

        await expect(wInput).toBeVisible();
        await expect(hInput).toBeVisible();

        // Test presets
        await page.locator('button:has-text("2048x2048 (4K)")').click();
        await expect(wInput).toHaveValue('2048');
        await expect(hInput).toHaveValue('2048');

        // Close modal
        await page.locator('#svg-to-png-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Advanced WebP Converter modal opens and adjusts direction and quality', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Advanced WebP Converter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#webp-converter-modal');
        await expect(modal).toBeVisible();

        // Check direction dropdown and quality slider
        const select = page.locator('#webp-direction-select');
        await expect(select).toBeVisible();
        await expect(page.locator('#webp-quality-slider')).toBeVisible();

        // Select "Convert From WebP To PNG"
        await select.selectOption('from_webp_png');

        // Close modal
        await page.locator('#webp-converter-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 4: URL Slug Generator (SEO Tool) modal opens and live generates slug', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'URL Slug Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#slug-generator-modal');
        await expect(modal).toBeVisible();

        const input = page.locator('#slug-input-title');
        const output = page.locator('#slug-output-preview');

        await expect(input).toBeVisible();
        await expect(output).toBeVisible();

        // Fill custom title "How to Make a Free Website 2026!"
        await input.fill('How to Make a Free Website 2026!');

        // Check slug output (stop words 'to', 'a' removed if default checked)
        // Expected: "how-make-free-website-2026"
        await expect(output).toHaveValue('how-make-free-website-2026');

        // Toggle stop words off
        await page.locator('#slug-remove-stopwords').uncheck();
        await expect(output).toHaveValue('how-to-make-a-free-website-2026');

        // Change separator to underscore
        await page.locator('#slug-separator-select').selectOption('_');
        await expect(output).toHaveValue('how_to_make_a_free_website_2026');

        // Close modal
        await page.locator('#slug-generator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 5: Professional Meta Tag Generator modal opens and generates meta code', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Meta Tag Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#meta-tag-generator-modal');
        await expect(modal).toBeVisible();

        const titleInput = page.locator('#meta-site-title');
        const codeOutput = page.locator('#meta-output-code');

        await expect(titleInput).toBeVisible();
        await expect(codeOutput).toBeVisible();

        await titleInput.fill('Awesome Kittutools SEO Page');

        // Verify generated code contains custom title and Open Graph tags
        const codeText = await codeOutput.inputValue();
        expect(codeText).toContain('<title>Awesome Kittutools SEO Page</title>');
        expect(codeText).toContain('<meta property="og:title" content="Awesome Kittutools SEO Page">');
        expect(codeText).toContain('<meta name="twitter:card" content="summary_large_image">');

        // Close modal
        await page.locator('#meta-tag-generator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

});
