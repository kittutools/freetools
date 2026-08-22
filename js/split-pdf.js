// Kittutools - Advanced Split PDF Logic (js/split-pdf.js)

let currentSplitPdfFile = null;
let currentSplitTotalPages = 0;

document.addEventListener('DOMContentLoaded', () => {
    initSplitPdfEventListeners();
});

/**
 * Initializes listeners for Split PDF modal controls
 */
function initSplitPdfEventListeners() {
    const dropzone = document.getElementById('split-pdf-dropzone');
    const fileInput = document.getElementById('split-pdf-file-input');
    const modeSelect = document.getElementById('split-mode-select');

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
                    handleSplitPdfFile(file);
                } else {
                    showToast('Please upload a valid PDF file.', 'info');
                }
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleSplitPdfFile(e.target.files[0]);
            }
        });
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const rangeContainer = document.getElementById('split-custom-range-container');
            const singlePdfOption = document.getElementById('split-single-pdf-option');

            if (e.target.value === 'custom') {
                if (rangeContainer) rangeContainer.classList.remove('hidden');
                if (singlePdfOption) singlePdfOption.classList.remove('hidden');
            } else {
                if (rangeContainer) rangeContainer.classList.add('hidden');
                if (singlePdfOption) singlePdfOption.classList.add('hidden');
            }
        });
    }
}

/**
 * Handles PDF file upload and page count extraction
 */
async function handleSplitPdfFile(file) {
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        currentSplitPdfFile = file;
        currentSplitTotalPages = pdfDoc.numPages;

        const dropzone = document.getElementById('split-pdf-dropzone');
        const fileStatus = document.getElementById('split-pdf-file-status');
        const fileNameEl = document.getElementById('split-pdf-file-name');
        const fileSizeEl = document.getElementById('split-pdf-file-size');
        const badgeEl = document.getElementById('split-total-pages-badge');
        const splitBtn = document.getElementById('split-download-pdf-btn');

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);
        if (badgeEl) badgeEl.textContent = `Total Pages: ${currentSplitTotalPages}`;

        if (dropzone) dropzone.classList.add('hidden');
        if (fileStatus) fileStatus.classList.remove('hidden');
        if (splitBtn) splitBtn.disabled = false;

        showToast(`Loaded "${file.name}" with ${currentSplitTotalPages} pages.`, 'success');

    } catch (error) {
        console.error('Error loading PDF for splitting:', error);
        if (error.name === 'PasswordException' || error.message?.includes('password')) {
            showToast('Failed to open PDF: Document is password-protected.', 'info');
        } else {
            showToast('Failed to load PDF. File may be corrupted.', 'info');
        }
    }
}

/**
 * Parses user input page range strings such as "1-3, 5, 7-10"
 */
function parsePageRangeInput(rangeStr, maxPages) {
    if (!rangeStr || !rangeStr.trim()) return [];

    const pagesSet = new Set();
    const parts = rangeStr.split(',');

    for (let part of parts) {
        part = part.trim();
        if (!part) continue;

        if (part.includes('-')) {
            const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1], 10);
                const end = parseInt(rangeMatch[2], 10);
                if (start <= end) {
                    for (let p = start; p <= end; p++) {
                        if (p >= 1 && p <= maxPages) {
                            pagesSet.add(p);
                        }
                    }
                }
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                pagesSet.add(pageNum);
            }
        }
    }

    return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Executes splitting and downloading based on selected mode
 */
async function executeSplitAndDownload() {
    if (!currentSplitPdfFile || currentSplitTotalPages === 0) {
        showToast('Please upload a PDF file to split.', 'info');
        return;
    }

    const mode = document.getElementById('split-mode-select')?.value || 'all';
    const rangeInput = document.getElementById('split-custom-range-input')?.value || '';
    const mergeSingle = document.getElementById('split-merge-single-checkbox')?.checked || false;
    const splitBtn = document.getElementById('split-download-pdf-btn');

    let targetPages = [];

    if (mode === 'all') {
        for (let i = 1; i <= currentSplitTotalPages; i++) {
            targetPages.push(i);
        }
    } else {
        targetPages = parsePageRangeInput(rangeInput, currentSplitTotalPages);
        if (targetPages.length === 0) {
            showToast('Please enter a valid page range (e.g. 1-3, 5).', 'info');
            return;
        }
    }

    if (splitBtn) {
        splitBtn.disabled = true;
        splitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing Split...`;
        if (window.lucide) lucide.createIcons();
    }

    try {
        const arrayBuffer = await currentSplitPdfFile.arrayBuffer();
        const srcPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const baseFileName = currentSplitPdfFile.name.replace(/\.pdf$/i, '');

        if (mode === 'custom' && mergeSingle) {
            // Merge extracted range into single PDF
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const pageIndices = targetPages.map(p => p - 1);
            const copiedPages = await newPdfDoc.copyPages(srcPdfDoc, pageIndices);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFileName}-extracted.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Extracted pages merged into single PDF!', 'success');

        } else if (targetPages.length === 1) {
            // Single page download
            const pageNum = targetPages[0];
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [pageNum - 1]);
            newPdfDoc.addPage(copiedPage);

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFileName}-page-${pageNum}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Page ${pageNum} extracted successfully!`, 'success');

        } else {
            // Multiple separate pages as ZIP archive
            const zip = new JSZip();

            for (const pageNum of targetPages) {
                const singlePdfDoc = await PDFLib.PDFDocument.create();
                const [copiedPage] = await singlePdfDoc.copyPages(srcPdfDoc, [pageNum - 1]);
                singlePdfDoc.addPage(copiedPage);

                const singleBytes = await singlePdfDoc.save();
                zip.file(`${baseFileName}-page-${pageNum}.pdf`, singleBytes);
            }

            const zipContent = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipContent);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFileName}-split-pages.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Extracted ${targetPages.length} pages into ZIP file!`, 'success');
        }

    } catch (error) {
        console.error('Error splitting PDF:', error);
        showToast('Failed to split PDF file. File may be corrupted or protected.', 'info');
    } finally {
        if (splitBtn) {
            splitBtn.disabled = false;
            splitBtn.innerHTML = `<i data-lucide="scissors" class="w-4 h-4"></i> Split & Download`;
            if (window.lucide) lucide.createIcons();
        }
    }
}

/**
 * Resets Split PDF UI state
 */
function resetSplitPdfUI() {
    currentSplitPdfFile = null;
    currentSplitTotalPages = 0;

    const dropzone = document.getElementById('split-pdf-dropzone');
    const fileStatus = document.getElementById('split-pdf-file-status');
    const fileInput = document.getElementById('split-pdf-file-input');
    const splitBtn = document.getElementById('split-download-pdf-btn');
    const customRangeInput = document.getElementById('split-custom-range-input');

    if (fileInput) fileInput.value = '';
    if (customRangeInput) customRangeInput.value = '';
    if (dropzone) dropzone.classList.remove('hidden');
    if (fileStatus) fileStatus.classList.add('hidden');
    if (splitBtn) splitBtn.disabled = true;
}

/**
 * Opens Split PDF Modal
 */
function openSplitPdfModal() {
    openModal('split-pdf-modal');
}

/**
 * Closes Split PDF Modal
 */
function closeSplitPdfModal() {
    closeModal('split-pdf-modal');
}
