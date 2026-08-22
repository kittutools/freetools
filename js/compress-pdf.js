// Kittutools - Pro-Level Compress PDF Logic (js/compress-pdf.js)

let currentCompressPdfFile = null;
let currentCompressPreset = 'recommended';
let compressedPdfBlob = null;
let compressedPdfFilename = 'compressed.pdf';

document.addEventListener('DOMContentLoaded', () => {
    initCompressPdfEventListeners();
});

/**
 * Initializes drag & drop, file input, and UI listeners for Compress PDF modal
 */
function initCompressPdfEventListeners() {
    const dropzone = document.getElementById('compress-pdf-dropzone');
    const fileInput = document.getElementById('compress-pdf-file-input');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-red-500', 'bg-neutral-900/80');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-red-500', 'bg-neutral-900/80');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-red-500', 'bg-neutral-900/80');

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    handleCompressPdfFile(file);
                } else {
                    showToast('Please upload a valid PDF file.', 'info');
                }
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleCompressPdfFile(e.target.files[0]);
            }
        });
    }
}

/**
 * Handles PDF file selection, displays file info card, and starts compression workflow
 */
async function handleCompressPdfFile(file) {
    if (!file) return;

    currentCompressPdfFile = file;
    compressedPdfFilename = file.name.replace(/\.pdf$/i, '') + '-compressed.pdf';

    const dropzone = document.getElementById('compress-pdf-dropzone');
    const fileInfo = document.getElementById('compress-pdf-file-info');
    const nameEl = document.getElementById('compress-pdf-file-name');
    const sizeEl = document.getElementById('compress-pdf-file-size');

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = `Original Size: ${formatBytes(file.size)}`;

    if (dropzone) dropzone.classList.add('hidden');
    if (fileInfo) fileInfo.classList.remove('hidden');

    // Run compression
    await processPdfCompression();
}

/**
 * Sets selected compression preset ("extreme", "recommended", "less")
 */
function selectCompressionPreset(preset) {
    currentCompressPreset = preset;

    const presets = ['extreme', 'recommended', 'less'];
    presets.forEach(p => {
        const btn = document.getElementById(`preset-${p}`);
        if (!btn) return;
        if (p === preset) {
            btn.className = 'compression-preset-btn bg-red-600/20 border-2 border-red-500 p-3.5 rounded-2xl text-left transition-all';
        } else {
            btn.className = 'compression-preset-btn bg-neutral-900 border border-neutral-800 hover:border-red-500/50 p-3.5 rounded-2xl text-left transition-all';
        }
    });

    if (currentCompressPdfFile) {
        processPdfCompression();
    }
}

/**
 * Core PDF compression algorithm using PDF.js rendering & pdf-lib re-encoding
 */
async function processPdfCompression() {
    if (!currentCompressPdfFile) return;

    const progressWrapper = document.getElementById('compress-pdf-progress-wrapper');
    const progressBar = document.getElementById('compress-pdf-progress-bar');
    const progressText = document.getElementById('compress-pdf-progress-text');
    const summaryBox = document.getElementById('compress-pdf-summary-box');
    const downloadBtn = document.getElementById('download-compressed-pdf-btn');

    if (progressWrapper) progressWrapper.classList.remove('hidden');
    if (summaryBox) summaryBox.classList.add('hidden');
    if (downloadBtn) downloadBtn.disabled = true;

    // Preset settings
    let renderScale = 1.0;
    let jpegQuality = 0.6;

    if (currentCompressPreset === 'extreme') {
        renderScale = 0.75;
        jpegQuality = 0.35;
    } else if (currentCompressPreset === 'recommended') {
        renderScale = 1.0;
        jpegQuality = 0.6;
    } else if (currentCompressPreset === 'less') {
        renderScale = 1.25;
        jpegQuality = 0.85;
    }

    try {
        const arrayBuffer = await currentCompressPdfFile.arrayBuffer();

        // Load document using PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        if (progressText) progressText.textContent = `Compressing 1 of ${totalPages} pages...`;
        if (progressBar) progressBar.style.width = '10%';

        // Create new PDF using pdf-lib
        const newPdfDoc = await PDFLib.PDFDocument.create();

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: renderScale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
            const jpgImage = await newPdfDoc.embedJpg(imgDataUrl);

            // Maintain aspect ratio dimensions
            const pdfPage = newPdfDoc.addPage([viewport.width / renderScale, viewport.height / renderScale]);
            pdfPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: pdfPage.getWidth(),
                height: pdfPage.getHeight()
            });

            const currentPercent = Math.round((i / totalPages) * 80) + 10;
            if (progressBar) progressBar.style.width = `${currentPercent}%`;
            if (progressText) progressText.textContent = `Compressing page ${i} of ${totalPages}...`;
        }

        if (progressText) progressText.textContent = 'Finalizing compressed document...';
        if (progressBar) progressBar.style.width = '95%';

        const pdfBytes = await newPdfDoc.save();
        compressedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        if (progressBar) progressBar.style.width = '100%';
        setTimeout(() => {
            if (progressWrapper) progressWrapper.classList.add('hidden');
        }, 400);

        // Update Summary Box
        const origSize = currentCompressPdfFile.size;
        const newSize = compressedPdfBlob.size;
        let percentReduced = 0;
        if (origSize > 0) {
            percentReduced = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));
        }

        const origSizeEl = document.getElementById('compress-orig-size-val');
        const newSizeEl = document.getElementById('compress-new-size-val');
        const savedPercentEl = document.getElementById('compress-saved-percent-val');

        if (origSizeEl) origSizeEl.textContent = formatBytes(origSize);
        if (newSizeEl) newSizeEl.textContent = formatBytes(newSize);
        if (savedPercentEl) savedPercentEl.textContent = `${percentReduced}%`;

        if (summaryBox) summaryBox.classList.remove('hidden');
        if (downloadBtn) downloadBtn.disabled = false;

        showToast('PDF compressed successfully!', 'success');

    } catch (error) {
        console.error('Error during PDF compression:', error);
        if (progressWrapper) progressWrapper.classList.add('hidden');

        if (error.name === 'PasswordException' || error.message?.includes('password')) {
            showToast('Failed to open PDF: The document is password-protected.', 'info');
        } else {
            showToast('Error compressing PDF. File may be corrupted or unsupported.', 'info');
        }
    }
}

/**
 * Downloads the compressed PDF file
 */
function downloadCompressedPdf() {
    if (!compressedPdfBlob) {
        showToast('No compressed file ready for download.', 'info');
        return;
    }

    const url = URL.createObjectURL(compressedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedPdfFilename || 'compressed.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Resets Compress PDF UI state
 */
function resetCompressPdfUI() {
    currentCompressPdfFile = null;
    compressedPdfBlob = null;

    const dropzone = document.getElementById('compress-pdf-dropzone');
    const fileInfo = document.getElementById('compress-pdf-file-info');
    const summaryBox = document.getElementById('compress-pdf-summary-box');
    const progressWrapper = document.getElementById('compress-pdf-progress-wrapper');
    const downloadBtn = document.getElementById('download-compressed-pdf-btn');
    const fileInput = document.getElementById('compress-pdf-file-input');

    if (fileInput) fileInput.value = '';
    if (dropzone) dropzone.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    if (summaryBox) summaryBox.classList.add('hidden');
    if (progressWrapper) progressWrapper.classList.add('hidden');
    if (downloadBtn) downloadBtn.disabled = true;
}

/**
 * Opens Compress PDF Modal
 */
function openCompressPdfModal() {
    openModal('compress-pdf-modal');
}

/**
 * Closes Compress PDF Modal
 */
function closeCompressPdfModal() {
    closeModal('compress-pdf-modal');
}

/**
 * Utility function to format bytes into readable sizes
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
