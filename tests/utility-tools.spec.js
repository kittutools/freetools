import { test, expect } from '@playwright/test';

test.describe('Kittutools 6 Utility & Developer Tools End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Tool 1: Premium QR Code Generator modal opens and generates QR code', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Premium QR Code Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#qr-generator-modal');
        await expect(modal).toBeVisible();

        // Check input field
        const textInput = page.locator('#qr-text-input');
        await expect(textInput).toBeVisible();
        await textInput.fill('https://kittutools.com/test');

        // Check QR code canvas or image element generated in preview container
        const previewContainer = page.locator('#qr-preview-container');
        await expect(previewContainer).toBeVisible();

        // Switch to WiFi tab
        await page.locator('#qr-tab-wifi').click();
        await expect(page.locator('#qr-form-wifi')).toBeVisible();

        // Download button
        const downloadBtn = page.locator('button:has-text("Download QR Code")');
        await expect(downloadBtn).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'screenshot-qr-generator-modal.png' });

        // Close modal
        await page.locator('#qr-generator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 2: Ultimate Password Generator modal opens, calculates strength, and generates password', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Ultimate Password Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#password-generator-modal');
        await expect(modal).toBeVisible();

        const displayInput = page.locator('#pwd-display-output');
        await expect(displayInput).toBeVisible();
        const pwd1 = await displayInput.inputValue();
        expect(pwd1.length).toBeGreaterThanOrEqual(16);

        // Adjust length slider
        const slider = page.locator('#pwd-length-slider');
        await slider.fill('32');
        await slider.dispatchEvent('input');

        const pwd2 = await displayInput.inputValue();
        expect(pwd2.length).toBe(32);

        // Check strength label
        await expect(page.locator('#pwd-strength-label')).toHaveText('Strong');

        // Check Copy & Generate New button
        await expect(page.locator('button:has-text("Copy & Generate New")')).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'screenshot-password-generator-modal.png' });

        // Close modal
        await page.locator('#password-generator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 3: Advanced MD5 & SHA Hash Generator modal opens and calculates simultaneous hashes', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Advanced Hash Generator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#hash-generator-modal');
        await expect(modal).toBeVisible();

        const inputText = page.locator('#hash-input-text');
        await inputText.fill('Hello Kittutools');

        const md5Val = await page.locator('#hash-out-md5').inputValue();
        const sha256Val = await page.locator('#hash-out-sha256').inputValue();

        expect(md5Val.length).toBe(32);
        expect(sha256Val.length).toBe(64);

        // Take screenshot
        await page.screenshot({ path: 'screenshot-hash-generator-modal.png' });

        // Close modal
        await page.locator('#hash-generator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 4: Pro Color Picker & Converter modal opens and converts color formats', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Pro Color Picker & Converter' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#color-picker-modal');
        await expect(modal).toBeVisible();

        const hexInput = page.locator('#color-hex-input');
        await hexInput.fill('#3B82F6');
        await hexInput.dispatchEvent('input');

        await expect(page.locator('#color-out-hex')).toHaveValue('#3B82F6');
        await expect(page.locator('#color-out-rgb')).toHaveValue('rgb(59, 130, 246)');

        // Take screenshot
        await page.screenshot({ path: 'screenshot-color-picker-modal.png' });

        // Close modal
        await page.locator('#color-picker-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 5: Exact Age Calculator modal opens and computes age breakdown', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Exact Age Calculator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#age-calculator-modal');
        await expect(modal).toBeVisible();

        const dobInput = page.locator('#age-dob-date');
        const targetInput = page.locator('#age-target-date');

        await dobInput.fill('1995-05-15');
        await targetInput.fill('2025-05-15');
        await targetInput.dispatchEvent('change');

        await expect(page.locator('#age-years')).toHaveText('30');
        await expect(page.locator('#age-months')).toHaveText('0');
        await expect(page.locator('#age-days')).toHaveText('0');

        // Take screenshot
        await page.screenshot({ path: 'screenshot-age-calculator-modal.png' });

        // Close modal
        await page.locator('#age-calculator-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Tool 6: Smart JSON Formatter & Validator modal opens, validates and beautifies JSON', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'Smart JSON Formatter & Validator' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#json-formatter-modal');
        await expect(modal).toBeVisible();

        const jsonInput = page.locator('#json-input-text');
        await jsonInput.fill('{"a":1,"b":2}');

        // Click Beautify / Format
        await page.locator('button:has-text("Beautify / Format")').click();
        const beautifiedVal = await jsonInput.inputValue();
        expect(beautifiedVal).toContain('\n  "a": 1');

        // Click Minify / Compact
        await page.locator('button:has-text("Minify / Compact")').click();
        const minifiedVal = await jsonInput.inputValue();
        expect(minifiedVal).toBe('{"a":1,"b":2}');

        // Verify status badge
        await expect(page.locator('#json-status-box')).toContainText('Valid JSON Object');

        // Take screenshot
        await page.screenshot({ path: 'screenshot-json-formatter-modal.png' });

        // Close modal
        await page.locator('#json-formatter-modal button:has-text("Close")').click();
        await expect(modal).not.toBeVisible();
    });

});
