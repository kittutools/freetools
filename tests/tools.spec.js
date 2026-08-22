import { test, expect } from '@playwright/test';

test.describe('Kittutools 3 New Advanced Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: PDF to JPG / Image Converter modal opens and has options', async ({ page }) => {
        // Find and click PDF to JPG / Image card
        const card = page.locator('.tool-card', { hasText: 'PDF to JPG / Image' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#pdf-to-image-modal');
        await expect(modal).toBeVisible();

        // Check options
        await expect(page.locator('#pdf-export-format')).toBeVisible();
        await expect(page.locator('#pdf-export-dpi')).toBeVisible();
        await expect(page.locator('#pdf-page-selection')).toBeVisible();

        // Check custom range toggle
        await page.locator('#pdf-page-selection').selectOption('custom');
        await expect(page.locator('#pdf-custom-range-wrapper')).toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-pdf-to-image-modal.png' });

        // Close modal
        await page.locator('#pdf-to-image-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: Ultimate Image Crop Tool modal opens and has presets and tools', async ({ page }) => {
        // Find and click Ultimate Image Crop Tool card
        const card = page.locator('.tool-card', { hasText: 'Ultimate Image Crop Tool' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#image-crop-modal');
        await expect(modal).toBeVisible();

        // Check aspect ratio buttons
        await expect(page.locator('.crop-aspect-btn[data-aspect="1:1"]')).toBeVisible();
        await expect(page.locator('.crop-aspect-btn[data-aspect="16:9"]')).toBeVisible();
        await expect(page.locator('.crop-aspect-btn[data-aspect="9:16"]')).toBeVisible();

        // Click custom preset to verify inputs display
        await page.locator('.crop-aspect-btn[data-aspect="custom"]').click();
        await expect(page.locator('#crop-custom-input-wrapper')).toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-image-crop-modal.png' });

        // Close modal
        await page.locator('#image-crop-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Pro Image Compressor modal opens and toggles modes', async ({ page }) => {
        // Find and click Pro Image Compressor card
        const card = page.locator('.tool-card', { hasText: 'Pro Image Compressor' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#image-compressor-modal');
        await expect(modal).toBeVisible();

        // Check quality slider wrapper
        await expect(page.locator('#wrapper-quality-slider')).toBeVisible();

        // Toggle to Max Target Size KB mode
        await page.locator('#mode-kb-btn').click();
        await expect(page.locator('#wrapper-target-kb')).toBeVisible();
        await expect(page.locator('#wrapper-quality-slider')).not.toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-image-compressor-modal.png' });

        // Close modal
        await page.locator('#image-compressor-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

});
