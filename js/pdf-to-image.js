// Kittutools - PDF to JPG / Image Converter Logic (js/pdf-to-image.js)

let currentPdfDoc = null;
let pdfPageCanvasMap = []; // Array of { pageNum, canvas, dataUrl, width, height }
let isRenderingPdf = false;

document.addEventListener('DOMContentLoaded', () => {
    initPdfToImageListeners();
});

/**
 * Initializes listeners for PDF to Image converter
 */
function initPdfToImageListeners() {
    const dropzone = document.getElementById('pdf-to-image-dropzone');
    const fileInput = document.getElementById('pdf-file-input');
    const formatSelect = document.getElementById('pdf-export-format');
    const dpiSelect = document.getElementById('pdf-export-dpi');
    const pageSelectionSelect = document.getElementById('pdf-page-selection');
    const customRangeInput = document.getElementById('pdf-custom-range');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            loadPdfFile(e.target.files[0]);
            fileInput.value = '';
        }
    });

    ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('border-red-500', 'bg-neutral-900/80');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('border-red-500', 'bg-neutral-900/80');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            loadPdfFile(e.dataTransfer.files[0]);
        }
    });

    if (pageSelectionSelect) {
        pageSelectionSelect.addEventListener('change', (e) => {
            const rangeWrapper = document.getElementById('pdf-custom-range-wrapper');
            if (e.target.value === 'custom') {
                if (rangeWrapper) rangeWrapper.classList.remove('hidden');
            } else {
                if (rangeWrapper) rangeWrapper.classList.add('hidden');
            }
            renderSelectedPdfPages();
        });
    }

    if (customRangeInput) {
        customRangeInput.addEventListener('input', () => {
            renderSelectedPdfPages();
        });
    }

    if (dpiSelect) {
        dpiSelect.addEventListener('change', () => {
            if (currentPdfDoc) {
                processAndRenderPdfPages();
            }
        });
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', () => {
            renderSelectedPdfPages();
        });
    }
}

function openPdfToImageModal() {
    openModal('pdf-to-image-modal');
}

function closePdfToImageModal() {
    closeModal('pdf-to-image-modal');
}

/**
 * Loads a PDF File object using PDF.js
 */
async function loadPdfFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Please upload a valid PDF file (.pdf).', 'info');
        return;
    }

    const statusEl = document.getElementById('pdf-file-status');
    const fileNameEl = document.getElementById('pdf-file-name');
    const fileSizeEl = document.getElementById('pdf-file-size');

    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
    if (statusEl) statusEl.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        loadingTask.promise.then(pdf => {
            currentPdfDoc = pdf;
            showToast(`PDF loaded successfully! Total pages: ${pdf.numPages}`, 'success');
            processAndRenderPdfPages();
        }).catch(err => {
            console.error('PDF parsing error:', err);
            showToast('Error loading PDF file. The file may be corrupted or password protected.', 'info');
            currentPdfDoc = null;
            resetPdfToImageUI();
        });
    } catch (err) {
        console.error('File reading error:', err);
        showToast('Failed to read file. Please try again.', 'info');
    }
}

/**
 * Processes all pages from PDF at selected DPI
 */
async function processAndRenderPdfPages() {
    if (!currentPdfDoc || isRenderingPdf) return;

    isRenderingPdf = true;
    pdfPageCanvasMap = [];

    const progressContainer = document.getElementById('pdf-render-progress');
    const progressText = document.getElementById('pdf-progress-text');
    const progressBar = document.getElementById('pdf-progress-bar');
    if (progressContainer) progressContainer.classList.remove('hidden');

    const dpiVal = parseInt(document.getElementById('pdf-export-dpi')?.value || '150', 10);
    // Standard 72 DPI scale = 1.0; 150 DPI scale = 150/72 ≈ 2.083; 300 DPI scale = 300/72 ≈ 4.166
    const scale = dpiVal / 72.0;

    const numPages = currentPdfDoc.numPages;

    for (let i = 1; i <= numPages; i++) {
        if (progressText) progressText.textContent = `Rendering page ${i} of ${numPages} (${dpiVal} DPI)...`;
        if (progressBar) progressBar.style.width = `${Math.round((i / numPages) * 100)}%`;

        try {
            const page = await currentPdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            pdfPageCanvasMap.push({
                pageNum: i,
                canvas: canvas,
                width: viewport.width,
                height: viewport.height
            });
        } catch (err) {
            console.error(`Error rendering page ${i}:`, err);
        }
    }

    if (progressContainer) progressContainer.classList.add('hidden');
    isRenderingPdf = false;

    renderSelectedPdfPages();
}

/**
 * Parses custom page string e.g. "1-3, 5" into array of page numbers
 */
function parsePageRange(rangeStr, maxPages) {
    if (!rangeStr.trim()) return Array.from({ length: maxPages }, (_, i) => i + 1);

    const pages = new Set();
    const parts = rangeStr.split(',');

    for (let part of parts) {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                const s = Math.max(1, Math.min(start, end));
                const e = Math.min(maxPages, Math.max(start, end));
                for (let i = s; i <= e; i++) pages.add(i);
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                pages.add(pageNum);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Filters rendered pages based on selection criteria and displays thumbnails
 */
function renderSelectedPdfPages() {
    const grid = document.getElementById('pdf-pages-grid');
    const emptyState = document.getElementById('pdf-empty-state');
    const downloadZipBtn = document.getElementById('download-all-zip-btn');
    const totalBadge = document.getElementById('pdf-pages-badge');

    if (!grid || !emptyState) return;

    if (!currentPdfDoc || pdfPageCanvasMap.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (downloadZipBtn) downloadZipBtn.disabled = true;
        if (totalBadge) totalBadge.textContent = '0 pages';
        grid.innerHTML = '';
        return;
    }

    const pageSelection = document.getElementById('pdf-page-selection')?.value || 'all';
    const customRangeStr = document.getElementById('pdf-custom-range')?.value || '';
    const format = document.getElementById('pdf-export-format')?.value || 'image/jpeg';

    let targetPages = [];
    if (pageSelection === 'all') {
        targetPages = pdfPageCanvasMap.map(p => p.pageNum);
    } else if (pageSelection === 'current') {
        targetPages = [1]; // default first page
    } else if (pageSelection === 'custom') {
        targetPages = parsePageRange(customRangeStr, pdfPageCanvasMap.length);
    }

    const filteredCanvasObjs = pdfPageCanvasMap.filter(p => targetPages.includes(p.pageNum));

    if (filteredCanvasObjs.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (downloadZipBtn) downloadZipBtn.disabled = true;
        if (totalBadge) totalBadge.textContent = '0 pages selected';
        grid.innerHTML = '<p class="col-span-full text-center text-neutral-500 text-xs py-8">No pages match the selected page range.</p>';
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    if (downloadZipBtn) downloadZipBtn.disabled = false;
    if (totalBadge) totalBadge.textContent = `${filteredCanvasObjs.length} page${filteredCanvasObjs.length > 1 ? 's' : ''} ready`;

    let formatExt = 'jpg';
    if (format === 'image/png') formatExt = 'png';
    if (format === 'image/webp') formatExt = 'webp';

    grid.innerHTML = filteredCanvasObjs.map(item => {
        const dataUrl = item.canvas.toDataURL(format, 0.92);
        return `
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between group hover:border-neutral-700 transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-md border border-neutral-800">
                        Page ${item.pageNum}
                    </span>
                    <span class="text-[10px] text-neutral-400">${item.width}x${item.height}px</span>
                </div>
                <div class="w-full h-40 bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center mb-3">
                    <img src="${dataUrl}" alt="Page ${item.pageNum}" class="w-full h-full object-contain">
                </div>
                <button onclick="downloadSinglePdfPage(${item.pageNum}, '${dataUrl}', '${formatExt}')" class="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Download Page ${item.pageNum}</span>
                </button>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

/**
 * Downloads a single page image
 */
function downloadSinglePdfPage(pageNum, dataUrl, ext) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `page_${pageNum}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded Page ${pageNum}!`, 'success');
}

/**
 * Downloads all rendered selected pages as a ZIP file using JSZip
 */
async function downloadAllPagesAsZip() {
    if (!pdfPageCanvasMap || pdfPageCanvasMap.length === 0) return;

    const downloadZipBtn = document.getElementById('download-all-zip-btn');
    if (downloadZipBtn) {
        downloadZipBtn.disabled = true;
        downloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Compressing ZIP...</span>`;
        if (window.lucide) lucide.createIcons();
    }

    setTimeout(async () => {
        try {
            const pageSelection = document.getElementById('pdf-page-selection')?.value || 'all';
            const customRangeStr = document.getElementById('pdf-custom-range')?.value || '';
            const format = document.getElementById('pdf-export-format')?.value || 'image/jpeg';

            let targetPages = [];
            if (pageSelection === 'all') {
                targetPages = pdfPageCanvasMap.map(p => p.pageNum);
            } else if (pageSelection === 'current') {
                targetPages = [1];
            } else if (pageSelection === 'custom') {
                targetPages = parsePageRange(customRangeStr, pdfPageCanvasMap.length);
            }

            const filteredCanvasObjs = pdfPageCanvasMap.filter(p => targetPages.includes(p.pageNum));

            let formatExt = 'jpg';
            if (format === 'image/png') formatExt = 'png';
            if (format === 'image/webp') formatExt = 'webp';

            const zip = new JSZip();
            const imgFolder = zip.folder("pdf_pages");

            filteredCanvasObjs.forEach(item => {
                const dataUrl = item.canvas.toDataURL(format, 0.92);
                const base64Data = dataUrl.split(',')[1];
                imgFolder.file(`page_${item.pageNum}.${formatExt}`, base64Data, { base64: true });
            });

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "Kittutools_PDF_Pages.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(`Downloaded ZIP archive with ${filteredCanvasObjs.length} page(s)!`, 'success');
        } catch (err) {
            console.error('ZIP generation error:', err);
            showToast('Error creating ZIP archive.', 'info');
        } finally {
            if (downloadZipBtn) {
                downloadZipBtn.disabled = false;
                downloadZipBtn.innerHTML = `<i data-lucide="archive" class="w-4 h-4"></i><span>Download All as ZIP</span>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    }, 100);
}

function resetPdfToImageUI() {
    pdfPageCanvasMap = [];
    currentPdfDoc = null;
    const statusEl = document.getElementById('pdf-file-status');
    if (statusEl) statusEl.classList.add('hidden');
    renderSelectedPdfPages();
}
