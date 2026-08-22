import { test, expect } from '@playwright/test';

test.describe('Kittutools 3 New PDF Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: Pro-Level Compress PDF modal opens and has UI elements', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Compress PDF' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#compress-pdf-modal');
        await expect(modal).toBeVisible();

        // Check compression presets
        await expect(page.locator('#preset-extreme')).toBeVisible();
        await expect(page.locator('#preset-recommended')).toBeVisible();
        await expect(page.locator('#preset-less')).toBeVisible();

        // Check download button presence
        await expect(page.locator('#download-compressed-pdf-btn')).toBeVisible();

        // Screenshot modal UI
        await page.screenshot({ path: 'screenshot-compress-pdf-modal.png' });

        // Close modal
        await page.locator('#compress-pdf-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: Ultimate Merge PDF modal opens and renders file list UI', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Merge PDF' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#merge-pdf-modal');
        await expect(modal).toBeVisible();

        // Check Add More Files button & empty state
        await expect(page.locator('#add-more-pdf-btn')).toBeVisible();
        await expect(page.locator('#merge-empty-state')).toBeVisible();
        await expect(page.locator('#merge-download-pdf-btn')).toBeDisabled();

        // Screenshot modal UI
        await page.screenshot({ path: 'screenshot-merge-pdf-modal.png' });

        // Close modal
        await page.locator('#merge-pdf-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Advanced Split PDF modal opens and toggles modes', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Split PDF' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#split-pdf-modal');
        await expect(modal).toBeVisible();

        // Check splitting mode dropdown and single PDF checkbox
        await expect(page.locator('#split-mode-select')).toBeVisible();

        // Select custom mode
        await page.locator('#split-mode-select').selectOption('custom');
        await expect(page.locator('#split-custom-range-container')).toBeVisible();
        await expect(page.locator('#split-single-pdf-option')).toBeVisible();

        // Toggle checkbox
        await page.locator('#split-merge-single-checkbox').check();
        await expect(page.locator('#split-merge-single-checkbox')).toBeChecked();

        // Screenshot modal UI
        await page.screenshot({ path: 'screenshot-split-pdf-modal.png' });

        // Close modal
        await page.locator('#split-pdf-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

});
