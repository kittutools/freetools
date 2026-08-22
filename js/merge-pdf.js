// Kittutools - Ultimate Merge PDF Logic (js/merge-pdf.js)

let mergePdfFiles = []; // Array of objects: { id, file, name, size, pageCount }

document.addEventListener('DOMContentLoaded', () => {
    initMergePdfEventListeners();
});

/**
 * Initializes drag & drop, multi-file inputs, and UI listeners for Merge PDF modal
 */
function initMergePdfEventListeners() {
    const dropzone = document.getElementById('merge-pdf-dropzone');
    const fileInput = document.getElementById('merge-pdf-file-input');

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
                const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (files.length > 0) {
                    addMergePdfFiles(files);
                } else {
                    showToast('Please upload valid PDF files.', 'info');
                }
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                addMergePdfFiles(Array.from(e.target.files));
                e.target.value = ''; // Reset input to allow re-uploading same file if deleted
            }
        });
    }
}

/**
 * Trigger extra file browsing via "Add More Files" button
 */
function triggerAddMorePdfFiles() {
    const fileInput = document.getElementById('merge-pdf-file-input');
    if (fileInput) fileInput.click();
}

/**
 * Processes incoming PDF files, parses page counts, and adds to list
 */
async function addMergePdfFiles(files) {
    for (const file of files) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const item = {
                id: 'pdf_' + Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                size: file.size,
                pageCount: pdfDoc.numPages
            };

            mergePdfFiles.push(item);
        } catch (error) {
            console.error('Error reading PDF file for merge:', error);
            if (error.name === 'PasswordException' || error.message?.includes('password')) {
                showToast(`Could not add "${file.name}": Document is password-protected.`, 'info');
            } else {
                showToast(`Could not add "${file.name}": File corrupted or invalid.`, 'info');
            }
        }
    }

    renderMergeFileCards();
}

/**
 * Renders interactive visual list cards for uploaded PDFs
 */
function renderMergeFileCards() {
    const listContainer = document.getElementById('merge-file-cards-list');
    const emptyState = document.getElementById('merge-empty-state');
    const badgeCount = document.getElementById('merge-file-count-badge');
    const mergeBtn = document.getElementById('merge-download-pdf-btn');

    if (badgeCount) badgeCount.textContent = `${mergePdfFiles.length} files`;

    if (mergePdfFiles.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (listContainer) {
            listContainer.classList.add('hidden');
            listContainer.innerHTML = '';
        }
        if (mergeBtn) mergeBtn.disabled = true;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (listContainer) {
        listContainer.classList.remove('hidden');
        listContainer.innerHTML = '';

        mergePdfFiles.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-2xl transition-all';
            card.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/20">
                        ${index + 1}
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-white truncate max-w-xs sm:max-w-md" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</p>
                        <p class="text-[11px] text-neutral-400">${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'} • ${formatBytes(item.size)}</p>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="moveMergePdfFile(${index}, -1)" ${index === 0 ? 'disabled' : ''} class="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 bg-neutral-950 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors" title="Move Up">
                        <i data-lucide="arrow-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="moveMergePdfFile(${index}, 1)" ${index === mergePdfFiles.length - 1 ? 'disabled' : ''} class="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 bg-neutral-950 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors" title="Move Down">
                        <i data-lucide="arrow-down" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="deleteMergePdfFile(${index})" class="p-1.5 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors" title="Delete File">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    if (mergeBtn) {
        mergeBtn.disabled = mergePdfFiles.length < 2;
    }
}

/**
 * Reorders files in the merge array
 */
function moveMergePdfFile(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mergePdfFiles.length) return;

    const temp = mergePdfFiles[index];
    mergePdfFiles[index] = mergePdfFiles[newIndex];
    mergePdfFiles[newIndex] = temp;

    renderMergeFileCards();
}

/**
 * Deletes a file from the merge array
 */
function deleteMergePdfFile(index) {
    if (index >= 0 && index < mergePdfFiles.length) {
        mergePdfFiles.splice(index, 1);
        renderMergeFileCards();
    }
}

/**
 * Executes merging of all loaded PDFs in sequence using pdf-lib and triggers download
 */
async function executeMergeAndDownload() {
    if (mergePdfFiles.length < 2) {
        showToast('Please add at least 2 PDF files to merge.', 'info');
        return;
    }

    const mergeBtn = document.getElementById('merge-download-pdf-btn');
    if (mergeBtn) {
        mergeBtn.disabled = true;
        mergeBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Merging PDFs...`;
        if (window.lucide) lucide.createIcons();
    }

    try {
        const mergedPdfDoc = await PDFLib.PDFDocument.create();

        for (const item of mergePdfFiles) {
            const arrayBuffer = await item.file.arrayBuffer();
            const pdfToMerge = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdfDoc.copyPages(pdfToMerge, pdfToMerge.getPageIndices());

            copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
        }

        const mergedPdfBytes = await mergedPdfDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'Kittutools-Merged-Document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('PDF files merged successfully!', 'success');

    } catch (error) {
        console.error('Error merging PDF files:', error);
        showToast('Failed to merge PDFs. One or more files may be corrupted or encrypted.', 'info');
    } finally {
        if (mergeBtn) {
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = `<i data-lucide="layers" class="w-4 h-4"></i> Merge & Download PDF`;
            if (window.lucide) lucide.createIcons();
        }
    }
}

/**
 * Resets Merge PDF UI state
 */
function resetMergePdfUI() {
    mergePdfFiles = [];
    const fileInput = document.getElementById('merge-pdf-file-input');
    if (fileInput) fileInput.value = '';
    renderMergeFileCards();
}

/**
 * Opens Merge PDF Modal
 */
function openMergePdfModal() {
    openModal('merge-pdf-modal');
}

/**
 * Closes Merge PDF Modal
 */
function closeMergePdfModal() {
    closeModal('merge-pdf-modal');
}

/**
 * Utility HTML escaper
 */
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
