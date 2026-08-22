// Kittutools - PDF to Word Converter Logic (js/pdf-to-word.js)

let currentWordPdfFile = null;
let currentWordPdfDoc = null;

document.addEventListener('DOMContentLoaded', () => {
    initPdfToWordListeners();
});

/**
 * Initializes drag-and-drop, file browsing, and customization controls for PDF to Word converter
 */
function initPdfToWordListeners() {
    const dropzone = document.getElementById('pdf-to-word-dropzone');
    const fileInput = document.getElementById('pdf-to-word-file-input');
    const pageRangeSelect = document.getElementById('pdf-word-page-range-select');
    const customRangeInput = document.getElementById('pdf-word-custom-range-input');
    const layoutPresetSelect = document.getElementById('pdf-word-layout-preset');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            loadPdfFileForWord(e.target.files[0]);
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
            loadPdfFileForWord(e.dataTransfer.files[0]);
        }
    });

    if (pageRangeSelect) {
        pageRangeSelect.addEventListener('change', (e) => {
            const customContainer = document.getElementById('pdf-word-custom-range-container');
            if (e.target.value === 'custom') {
                if (customContainer) customContainer.classList.remove('hidden');
            } else {
                if (customContainer) customContainer.classList.add('hidden');
            }
            if (currentWordPdfDoc) {
                updateExtractedWordPreview();
            }
        });
    }

    if (customRangeInput) {
        customRangeInput.addEventListener('input', () => {
            if (currentWordPdfDoc) {
                updateExtractedWordPreview();
            }
        });
    }

    if (layoutPresetSelect) {
        layoutPresetSelect.addEventListener('change', () => {
            if (currentWordPdfDoc) {
                updateExtractedWordPreview();
            }
        });
    }
}

function openPdfToWordModal() {
    openModal('pdf-to-word-modal');
}

function closePdfToWordModal() {
    closeModal('pdf-to-word-modal');
}

/**
 * Loads a PDF file object and initiates structure parsing
 */
async function loadPdfFileForWord(file) {
    if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
        showToast('Please upload a valid PDF document (.pdf).', 'info');
        return;
    }

    currentWordPdfFile = file;

    const statusEl = document.getElementById('pdf-to-word-file-status');
    const dropzone = document.getElementById('pdf-to-word-dropzone');
    const nameEl = document.getElementById('pdf-to-word-file-name');
    const sizeEl = document.getElementById('pdf-to-word-file-size');
    const titleInput = document.getElementById('pdf-word-filename');

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);
    if (titleInput) {
        const cleanName = file.name.replace(/\.pdf$/i, '') + '-Converted';
        titleInput.value = cleanName;
    }

    if (dropzone) dropzone.classList.add('hidden');
    if (statusEl) statusEl.classList.remove('hidden');

    await parseWordPdfDocument();
}

/**
 * Parses the loaded PDF document using PDF.js
 */
async function parseWordPdfDocument() {
    if (!currentWordPdfFile) return;

    const progressWrapper = document.getElementById('pdf-word-progress-wrapper');
    const progressBar = document.getElementById('pdf-word-progress-bar');
    const progressText = document.getElementById('pdf-word-progress-text');
    const convertBtn = document.getElementById('download-word-docx-btn');

    if (progressWrapper) progressWrapper.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '20%';
    if (progressText) progressText.textContent = 'Parsing PDF document...';
    if (convertBtn) convertBtn.disabled = true;

    try {
        const arrayBuffer = await currentWordPdfFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        currentWordPdfDoc = await loadingTask.promise;

        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = `Loaded ${currentWordPdfDoc.numPages} page(s) successfully!`;

        setTimeout(() => {
            if (progressWrapper) progressWrapper.classList.add('hidden');
        }, 300);

        if (convertBtn) convertBtn.disabled = false;
        showToast(`PDF loaded! Total pages: ${currentWordPdfDoc.numPages}`, 'success');

        await updateExtractedWordPreview();

    } catch (err) {
        console.error('Error parsing PDF file for Word conversion:', err);
        if (progressWrapper) progressWrapper.classList.add('hidden');
        showToast('Error parsing PDF file. File may be corrupted or password protected.', 'info');
        resetPdfToWordUI();
    }
}

/**
 * Parses custom page range string (e.g. "1-5, 8") into array of page numbers
 */
function parsePageRangeForWord(rangeStr, maxPages) {
    if (!rangeStr || !rangeStr.trim()) {
        return Array.from({ length: maxPages }, (_, i) => i + 1);
    }

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

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    return sortedPages.length > 0 ? sortedPages : Array.from({ length: maxPages }, (_, i) => i + 1);
}

/**
 * Extracts text items from PDF pages
 */
async function extractPdfTextDetails(targetPages) {
    if (!currentWordPdfDoc) return { pagesData: [], totalCharCount: 0, previewText: '' };

    const pagesData = [];
    let totalCharCount = 0;
    let fullTextExcerpt = '';

    for (const pageNum of targetPages) {
        try {
            const page = await currentWordPdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();

            const rawItems = textContent.items || [];

            // Format items into structured lines based on Y coordinates
            const lineMap = new Map();

            for (const item of rawItems) {
                const str = item.str || '';
                if (!str) continue;

                // transform[5] is Y position on page canvas
                const y = item.transform ? Math.round(item.transform[5]) : 0;
                const x = item.transform ? Math.round(item.transform[4]) : 0;

                // Group items on roughly same Y position (+- 3px)
                let matchedY = null;
                for (const existingY of lineMap.keys()) {
                    if (Math.abs(existingY - y) <= 3) {
                        matchedY = existingY;
                        break;
                    }
                }

                if (matchedY !== null) {
                    lineMap.get(matchedY).push({ str, x, y });
                } else {
                    lineMap.set(y, [{ str, x, y }]);
                }
            }

            // Sort lines from top of page to bottom (descending Y)
            const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
            const pageLines = [];

            for (const yVal of sortedYs) {
                const itemsOnLine = lineMap.get(yVal);
                // Sort items left to right
                itemsOnLine.sort((a, b) => a.x - b.x);
                const lineText = itemsOnLine.map(it => it.str).join(' ');
                if (lineText.trim()) {
                    pageLines.push(lineText);
                }
            }

            const pagePlainText = pageLines.join('\n');
            totalCharCount += pagePlainText.trim().length;

            if (fullTextExcerpt.length < 500 && pagePlainText.trim()) {
                fullTextExcerpt += `--- Page ${pageNum} ---\n` + pagePlainText + '\n\n';
            }

            pagesData.push({
                pageNum,
                lines: pageLines,
                plainText: pagePlainText
            });

        } catch (err) {
            console.error(`Error reading page ${pageNum}:`, err);
        }
    }

    return {
        pagesData,
        totalCharCount,
        previewText: fullTextExcerpt.trim()
    };
}

/**
 * Updates text extraction preview box
 */
async function updateExtractedWordPreview() {
    if (!currentWordPdfDoc) return;

    const previewBox = document.getElementById('pdf-word-preview-box');
    const statBadge = document.getElementById('pdf-word-stat-badge');
    const previewTextEl = document.getElementById('pdf-word-preview-text');

    const pageRangeType = document.getElementById('pdf-word-page-range-select')?.value || 'all';
    const customRangeStr = document.getElementById('pdf-word-custom-range-input')?.value || '';

    let targetPages = [];
    if (pageRangeType === 'all') {
        targetPages = Array.from({ length: currentWordPdfDoc.numPages }, (_, i) => i + 1);
    } else {
        targetPages = parsePageRangeForWord(customRangeStr, currentWordPdfDoc.numPages);
    }

    const { totalCharCount, previewText } = await extractPdfTextDetails(targetPages);

    if (previewBox) previewBox.classList.remove('hidden');

    if (statBadge) {
        statBadge.textContent = `${targetPages.length} page(s) • ${totalCharCount} char(s)`;
    }

    if (previewTextEl) {
        if (totalCharCount === 0) {
            previewTextEl.textContent = '[Scanned Image PDF Detected: No selectable text layer found in file]';
            previewTextEl.classList.add('text-red-400');
        } else {
            previewTextEl.textContent = previewText || 'Text ready for Word conversion.';
            previewTextEl.classList.remove('text-red-400');
        }
    }
}

/**
 * Executes PDF to Word conversion and triggers client-side download
 */
async function executePdfToWordConversion() {
    if (!currentWordPdfDoc) {
        showToast('Please upload a PDF file first.', 'info');
        return;
    }

    const convertBtn = document.getElementById('download-word-docx-btn');
    const progressWrapper = document.getElementById('pdf-word-progress-wrapper');
    const progressBar = document.getElementById('pdf-word-progress-bar');
    const progressText = document.getElementById('pdf-word-progress-text');

    if (convertBtn) convertBtn.disabled = true;
    if (progressWrapper) progressWrapper.classList.remove('hidden');

    const layoutPreset = document.getElementById('pdf-word-layout-preset')?.value || 'flow';
    const pageRangeType = document.getElementById('pdf-word-page-range-select')?.value || 'all';
    const customRangeStr = document.getElementById('pdf-word-custom-range-input')?.value || '';
    let docTitle = document.getElementById('pdf-word-filename')?.value.trim() || 'Kittutools-Converted';

    if (!docTitle.toLowerCase().endsWith('.docx')) {
        docTitle += '.docx';
    }

    let targetPages = [];
    if (pageRangeType === 'all') {
        targetPages = Array.from({ length: currentWordPdfDoc.numPages }, (_, i) => i + 1);
    } else {
        targetPages = parsePageRangeForWord(customRangeStr, currentWordPdfDoc.numPages);
    }

    if (progressText) progressText.textContent = `Extracting text from ${targetPages.length} page(s)...`;
    if (progressBar) progressBar.style.width = '30%';

    try {
        const { pagesData, totalCharCount } = await extractPdfTextDetails(targetPages);

        if (progressBar) progressBar.style.width = '60%';

        // Check if PDF is a scanned image-only PDF
        if (totalCharCount === 0) {
            showToast('Scanned PDF detected. Text extraction may be limited without full server-side OCR.', 'info');
        }

        if (progressText) progressText.textContent = 'Generating Microsoft Word (.docx) document...';
        if (progressBar) progressBar.style.width = '80%';

        // Build Word document structure using docx UMD library
        const docxLib = window.docx;
        if (!docxLib) {
            throw new Error('docx library not loaded properly.');
        }

        const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } = docxLib;

        const docChildren = [];

        // Title Header
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: docTitle.replace(/\.docx$/i, ''),
                        bold: true,
                        size: 32, // 16pt font
                        color: "1F2937"
                    })
                ],
                heading: HeadingLevel.HEADING_1,
                spaceAfter: 300
            })
        );

        if (totalCharCount === 0) {
            // Scanned PDF warning notice in generated Word file
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "[Scanned PDF Notice]",
                            bold: true,
                            color: "EF4444"
                        }),
                        new TextRun({
                            text: " This PDF document appears to contain scanned image pages without embedded text layers. Text extraction may be limited without full server-side OCR."
                        })
                    ],
                    spaceAfter: 200
                })
            );
        } else if (layoutPreset === 'flow') {
            // Plain Text Flow: extracts all text in paragraphs
            for (const pageObj of pagesData) {
                if (pageObj.lines.length === 0) continue;

                // Page break marker
                if (pagesData.length > 1) {
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `--- Page ${pageObj.pageNum} ---`,
                                    italics: true,
                                    color: "6B7280",
                                    size: 20
                                })
                            ],
                            spaceBefore: 200,
                            spaceAfter: 150
                        })
                    );
                }

                // Append lines as paragraphs
                for (const line of pageObj.lines) {
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                    size: 24 // 12pt
                                })
                            ],
                            spaceAfter: 120
                        })
                    );
                }
            }
        } else {
            // Keep Layout (Basic Blocks): format blocks/lines per page with section blocks
            for (const pageObj of pagesData) {
                // Page Header Block
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Page ${pageObj.pageNum}`,
                                bold: true,
                                size: 26,
                                color: "EF4444"
                            })
                        ],
                        spaceBefore: 300,
                        spaceAfter: 200
                    })
                );

                if (pageObj.lines.length === 0) {
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "[Empty Page / Image Block]",
                                    italics: true,
                                    color: "9CA3AF"
                                })
                            ],
                            spaceAfter: 150
                        })
                    );
                } else {
                    for (const line of pageObj.lines) {
                        docChildren.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: line,
                                        size: 22
                                    })
                                ],
                                spaceAfter: 100
                            })
                        );
                    }
                }
            }
        }

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: docChildren
                }
            ]
        });

        const wordBlob = await Packer.toBlob(doc);

        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
            if (progressWrapper) progressWrapper.classList.add('hidden');
        }, 300);

        // Trigger browser download
        const url = URL.createObjectURL(wordBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docTitle;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`Converted & downloaded Word (.docx) file successfully!`, 'success');

    } catch (err) {
        console.error('Error during Word conversion:', err);
        if (progressWrapper) progressWrapper.classList.add('hidden');
        showToast('Failed to convert PDF to Word. Please try again.', 'info');
    } finally {
        if (convertBtn) convertBtn.disabled = false;
    }
}

/**
 * Resets PDF to Word UI state
 */
function resetPdfToWordUI() {
    currentWordPdfFile = null;
    currentWordPdfDoc = null;

    const statusEl = document.getElementById('pdf-to-word-file-status');
    const dropzone = document.getElementById('pdf-to-word-dropzone');
    const fileInput = document.getElementById('pdf-to-word-file-input');
    const progressWrapper = document.getElementById('pdf-word-progress-wrapper');
    const previewBox = document.getElementById('pdf-word-preview-box');
    const convertBtn = document.getElementById('download-word-docx-btn');

    if (fileInput) fileInput.value = '';
    if (dropzone) dropzone.classList.remove('hidden');
    if (statusEl) statusEl.classList.add('hidden');
    if (progressWrapper) progressWrapper.classList.add('hidden');
    if (previewBox) previewBox.classList.add('hidden');
    if (convertBtn) convertBtn.disabled = true;
}

/**
 * Format bytes into human readable string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
