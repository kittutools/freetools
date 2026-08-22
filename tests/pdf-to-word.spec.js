import { test, expect } from '@playwright/test';

test.describe('Kittutools PDF to Word Converter End-to-End Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('PDF to Word Converter modal opens and renders UI controls', async ({ page }) => {
        const card = page.locator('.tool-card', { hasText: 'PDF to Word' });
        await expect(card).toBeVisible();
        await card.click();

        const modal = page.locator('#pdf-to-word-modal');
        await expect(modal).toBeVisible();

        // Check layout presets dropdown
        const layoutPreset = page.locator('#pdf-word-layout-preset');
        await expect(layoutPreset).toBeVisible();
        await expect(layoutPreset.locator('option[value="flow"]')).toHaveText('Plain Text Flow');
        await expect(layoutPreset.locator('option[value="blocks"]')).toHaveText('Keep Layout (Basic Blocks)');

        // Check page range options
        const pageRangeSelect = page.locator('#pdf-word-page-range-select');
        await expect(pageRangeSelect).toBeVisible();

        // Check document title input
        const titleInput = page.locator('#pdf-word-filename');
        await expect(titleInput).toBeVisible();
        await expect(titleInput).toHaveValue('Kittutools-Converted');

        // Check dropzone and initial button state
        await expect(page.locator('#pdf-to-word-dropzone')).toBeVisible();
        await expect(page.locator('#download-word-docx-btn')).toBeDisabled();

        // Toggle custom page range
        await pageRangeSelect.selectOption('custom');
        await expect(page.locator('#pdf-word-custom-range-container')).toBeVisible();

        // Close modal
        await page.locator('#pdf-to-word-modal button:has-text("Cancel")').click();
        await expect(modal).not.toBeVisible();
    });

    test('Converts text PDF file to editable .docx file and triggers download', async ({ page }) => {
        // Create sample text PDF buffer in browser context using pdf-lib
        const pdfBase64 = await page.evaluate(async () => {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([600, 400]);
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            page.drawText('Hello Kittutools PDF to Word Converter Test Document!', {
                x: 50,
                y: 300,
                size: 16,
                font: font
            });
            const pdfBytes = await pdfDoc.save();
            let binary = '';
            const bytes = new Uint8Array(pdfBytes);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        });

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Open modal
        const card = page.locator('.tool-card', { hasText: 'PDF to Word' });
        await card.click();

        // Upload PDF file
        const fileInput = page.locator('#pdf-to-word-file-input');
        await fileInput.setInputFiles({
            name: 'test-sample.pdf',
            mimeType: 'application/pdf',
            buffer: pdfBuffer
        });

        // Verify active file status and preview box
        await expect(page.locator('#pdf-to-word-file-status')).toBeVisible();
        await expect(page.locator('#pdf-to-word-file-name')).toHaveText('test-sample.pdf');

        const convertBtn = page.locator('#download-word-docx-btn');
        await expect(convertBtn).toBeEnabled();

        // Listen for download event
        const downloadPromise = page.waitForEvent('download');
        await convertBtn.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.docx');

        // Verify downloaded file size
        const path = await download.path();
        const fs = await import('fs');
        const stats = fs.statSync(path);
        expect(stats.size).toBeGreaterThan(500); // docx file is at least several hundred bytes
    });

    test('Detects scanned image PDF and displays informative toast warning', async ({ page }) => {
        // Create scanned image-only PDF (no text layer) in browser context
        const pdfBase64 = await page.evaluate(async () => {
            const pdfDoc = await PDFLib.PDFDocument.create();
            pdfDoc.addPage([400, 400]); // Blank page with no text items
            const pdfBytes = await pdfDoc.save();
            let binary = '';
            const bytes = new Uint8Array(pdfBytes);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        });

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Open modal
        const card = page.locator('.tool-card', { hasText: 'PDF to Word' });
        await card.click();

        // Upload blank image PDF
        const fileInput = page.locator('#pdf-to-word-file-input');
        await fileInput.setInputFiles({
            name: 'scanned-image.pdf',
            mimeType: 'application/pdf',
            buffer: pdfBuffer
        });

        // Click convert & download Word button
        const convertBtn = page.locator('#download-word-docx-btn');
        await expect(convertBtn).toBeEnabled();

        const downloadPromise = page.waitForEvent('download');
        await convertBtn.click();
        await downloadPromise;

        // Verify scanned PDF toast notification
        const toast = page.locator('#toast-container');
        await expect(toast).toContainText('Scanned PDF detected. Text extraction may be limited without full server-side OCR.');
    });

});
