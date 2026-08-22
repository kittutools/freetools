import { test, expect } from '@playwright/test';

test.describe('Kittutools 3 New Image Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: Advanced Image Resize Tool modal opens and controls function', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Advanced Image Resize Tool' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#image-resize-modal');
        await expect(modal).toBeVisible();

        // Check unit buttons
        const pixelsBtn = page.locator('#resize-unit-pixels-btn');
        const percentBtn = page.locator('#resize-unit-percent-btn');
        await expect(pixelsBtn).toBeVisible();
        await expect(percentBtn).toBeVisible();

        // Check pixels controls
        await expect(page.locator('#resize-pixels-controls')).toBeVisible();

        // Switch to percentage unit
        await percentBtn.click();
        await expect(page.locator('#resize-percent-controls')).toBeVisible();
        await expect(page.locator('#resize-pixels-controls')).not.toBeVisible();

        // Check aspect ratio checkbox
        const aspectLock = page.locator('#resize-lock-aspect');
        await expect(aspectLock).toBeChecked();

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-image-resize-modal.png' });

        // Close modal
        await page.locator('#image-resize-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: AI Background Remover modal opens and toggles background modes', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'AI Background Remover' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#bg-remover-modal');
        await expect(modal).toBeVisible();

        // Check mode buttons
        const transparentBtn = page.locator('#bg-mode-transparent-btn');
        const solidBtn = page.locator('#bg-mode-solid-btn');
        await expect(transparentBtn).toBeVisible();
        await expect(solidBtn).toBeVisible();

        // Switch to solid color background
        await solidBtn.click();
        await expect(page.locator('#bg-color-options')).toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-bg-remover-modal.png' });

        // Close modal
        await page.locator('#bg-remover-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Pro Bulk Image Converter modal opens and adjusts output settings', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Pro Bulk Image Converter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#bulk-converter-modal');
        await expect(modal).toBeVisible();

        // Check format dropdown
        const formatSelect = page.locator('#bulk-output-format');
        await expect(formatSelect).toBeVisible();

        // Change format to PNG
        await formatSelect.selectOption('image/png');

        // Quality slider should be disabled/hidden or dimmed for PNG
        await expect(page.locator('#bulk-quality-wrapper')).toHaveClass(/opacity-40/);

        // Change back to JPG
        await formatSelect.selectOption('image/jpeg');
        await expect(page.locator('#bulk-quality-wrapper')).not.toHaveClass(/opacity-40/);

        // Take screenshot of modal
        await page.screenshot({ path: 'screenshot-bulk-converter-modal.png' });

        // Close modal
        await page.locator('#bulk-converter-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

});
