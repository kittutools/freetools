import { test, expect } from '@playwright/test';

test.describe('Kittutools - 8 New Advanced Client-Side Tools E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Tool 1: XML Sitemap Generator', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'XML Sitemap Generator' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#sitemap-generator-modal');
    await expect(modal).toBeVisible();

    const urlInput = modal.locator('#sitemap-url-input');
    await urlInput.fill('https://mytestsite.org');

    const output = modal.locator('#sitemap-xml-output');
    await expect(output).toHaveValue(/<loc>https:\/\/mytestsite\.org<\/loc>/);
    await expect(output).toHaveValue(/<lastmod>/);

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 2: Complete Robots.txt Generator', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'Robots.txt Generator' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#robots-generator-modal');
    await expect(modal).toBeVisible();

    const disallowInput = modal.locator('#robots-disallow-path');
    await disallowInput.fill('/secret-area/');

    const sitemapInput = modal.locator('#robots-sitemap-url');
    await sitemapInput.fill('https://mytestsite.org/sitemap.xml');

    const output = modal.locator('#robots-txt-output');
    await expect(output).toHaveValue(/Disallow: \/secret-area\//);
    await expect(output).toHaveValue(/Sitemap: https:\/\/mytestsite\.org\/sitemap\.xml/);

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 3: What is My IP & Network Tool', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'What is My IP & Network' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#what-is-my-ip-modal');
    await expect(modal).toBeVisible();

    const ipDisplay = modal.locator('#ip-address-display');
    await expect(ipDisplay).not.toBeEmpty();

    const userAgentDisplay = modal.locator('#ip-useragent-display');
    await expect(userAgentDisplay).not.toBeEmpty();

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 4: Ultimate Favicon Generator', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'Ultimate Favicon Generator' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#favicon-generator-modal');
    await expect(modal).toBeVisible();

    // Check checkboxes
    await expect(modal.locator('#fav-size-16')).toBeChecked();
    await expect(modal.locator('#fav-size-32')).toBeChecked();
    await expect(modal.locator('#fav-size-48')).toBeChecked();
    await expect(modal.locator('#fav-size-180')).toBeChecked();

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 5: AI Color Palette Generator', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'AI Color Palette Generator' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#color-palette-modal');
    await expect(modal).toBeVisible();

    const hex0 = modal.locator('#palette-hex-0');
    await expect(hex0).not.toBeEmpty();

    // Change harmony rule
    const select = modal.locator('#palette-harmony-select');
    await select.selectOption('monochromatic');

    // Click random generate
    await modal.locator('button:has-text("Generate Random Scheme")').click();
    await expect(hex0).not.toBeEmpty();

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 6: Pro Base64 & Image Converter', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'Pro Base64 & Image Converter' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#base64-converter-modal');
    await expect(modal).toBeVisible();

    // Test Tab B: Base64 to Image
    await modal.locator('#b64-tab-b642img').click();
    const b64Input = modal.locator('#b64-input-string');
    await b64Input.fill('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

    const decodedContainer = modal.locator('#b64-output-container-b');
    await expect(decodedContainer).toBeVisible();

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 7: Text-To-Speech (TTS) Reader', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'Text-To-Speech (TTS) Reader' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#tts-reader-modal');
    await expect(modal).toBeVisible();

    const textArea = modal.locator('#tts-input-text');
    await textArea.fill('Testing Kittutools speech synthesis!');

    await expect(modal.locator('#tts-pitch-slider')).toHaveValue('1');
    await expect(modal.locator('#tts-rate-slider')).toHaveValue('1');
    await expect(modal.locator('#tts-volume-slider')).toHaveValue('1');

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

  test('Tool 8: Pro Binary & Text Converter', async ({ page }) => {
    const card = page.locator('.tool-card', { hasText: 'Pro Binary & Text Converter' });
    await expect(card).toBeVisible();
    await card.click();

    const modal = page.locator('#binary-converter-modal');
    await expect(modal).toBeVisible();

    const textInput = modal.locator('#binary-text-input');
    await textInput.fill('Hi');

    const binaryOutput = modal.locator('#binary-binary-output');
    // 'H' = 01001000, 'i' = 01101001
    await expect(binaryOutput).toHaveValue('01001000 01101001');

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
  });

});
