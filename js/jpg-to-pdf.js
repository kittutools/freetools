// Kittutools - JPG / Image to PDF Converter Logic (js/jpg-to-pdf.js)

let uploadedImages = []; // Stores image objects: { id, name, size, type, dataUrl, width, height }

document.addEventListener('DOMContentLoaded', () => {
    initDropzoneListeners();
    initOptionsListeners();
});

/**
 * Initializes listeners for option controls (such as toggling orientation enable state)
 */
function initOptionsListeners() {
    const pageSizeSelect = document.getElementById('pdf-page-size');
    const orientationSelect = document.getElementById('pdf-orientation');

    if (pageSizeSelect && orientationSelect) {
        const updateOrientationState = () => {
            if (pageSizeSelect.value === 'auto') {
                orientationSelect.disabled = true;
            } else {
                orientationSelect.disabled = false;
            }
        };

        pageSizeSelect.addEventListener('change', updateOrientationState);
        updateOrientationState();
    }
}

/**
 * Initializes Drag and Drop & File Selector listeners for the converter modal
 */
function initDropzoneListeners() {
    const dropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('image-file-input');

    if (!dropzone || !fileInput) return;

    // Trigger file dialog on click
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleSelectedFiles(Array.from(e.target.files));
            fileInput.value = ''; // Reset input
        }
    });

    // Drag and Drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('border-red-500', 'bg-neutral-900/80');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('border-red-500', 'bg-neutral-900/80');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            handleSelectedFiles(Array.from(dt.files));
        }
    });
}

/**
 * Opens the JPG to PDF modal dialog
 */
function openJpgToPdfModal() {
    openModal('jpg-to-pdf-modal');
}

/**
 * Closes the JPG to PDF modal dialog
 */
function closeJpgToPdfModal() {
    closeModal('jpg-to-pdf-modal');
}

/**
 * Handles array of File objects and loads them into memory with dimensions
 */
function handleSelectedFiles(files) {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validFiles = files.filter(file => validImageTypes.includes(file.type.toLowerCase()));

    if (validFiles.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Please select valid JPG, PNG, or WebP image files.', 'info');
        }
        return;
    }

    let loadedCount = 0;

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                uploadedImages.push({
                    id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.type,
                    dataUrl: dataUrl,
                    width: img.width,
                    height: img.height
                });

                loadedCount++;
                if (loadedCount === validFiles.length) {
                    renderThumbnails();
                    if (typeof showToast === 'function') {
                        showToast(`Added ${loadedCount} image${loadedCount > 1 ? 's' : ''}!`, 'success');
                    }
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Formats bytes to readable size (KB / MB)
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Renders thumbnail cards grid for added images
 */
function renderThumbnails() {
    const grid = document.getElementById('image-thumbnails-grid');
    const emptyState = document.getElementById('empty-preview-state');
    const countBadge = document.getElementById('selected-image-count');
    const convertBtn = document.getElementById('convert-pdf-btn');
    const clearAllBtn = document.getElementById('clear-all-images-btn');

    if (!grid || !emptyState) return;

    if (uploadedImages.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (countBadge) countBadge.textContent = '0 files';
        if (convertBtn) convertBtn.disabled = true;
        if (clearAllBtn) clearAllBtn.classList.add('hidden');
        grid.innerHTML = '';
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    if (countBadge) countBadge.textContent = `${uploadedImages.length} file${uploadedImages.length > 1 ? 's' : ''}`;
    if (convertBtn) convertBtn.disabled = false;
    if (clearAllBtn) clearAllBtn.classList.remove('hidden');

    grid.innerHTML = uploadedImages.map((img, index) => `
        <div class="relative group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden p-2 flex flex-col justify-between transition-all hover:border-neutral-700">
            <!-- Order Tag -->
            <span class="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm z-10 border border-neutral-800">
                #${index + 1}
            </span>

            <!-- Delete Button -->
            <button onclick="removeImage('${img.id}')" class="absolute top-3 right-3 bg-black/80 hover:bg-red-600 text-neutral-300 hover:text-white p-1 rounded-md backdrop-blur-sm z-10 transition-colors border border-neutral-800">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>

            <!-- Thumbnail Image -->
            <div class="w-full h-28 bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                <img src="${img.dataUrl}" alt="${img.name}" class="w-full h-full object-contain">
            </div>

            <!-- Details & Reorder controls -->
            <div class="space-y-1">
                <p class="text-xs font-semibold text-white truncate" title="${img.name}">${img.name}</p>
                <div class="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>${img.width}x${img.height}</span>
                    <span>${img.size}</span>
                </div>
                <!-- Move left / right controls -->
                <div class="flex items-center justify-between pt-1 text-neutral-400 border-t border-neutral-800/80">
                    <button onclick="moveImage(${index}, -1)" ${index === 0 ? 'disabled class="opacity-30 cursor-not-allowed"' : 'class="hover:text-white text-xs"'}>
                        <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <span class="text-[10px] text-neutral-500 font-mono">Move</span>
                    <button onclick="moveImage(${index}, 1)" ${index === uploadedImages.length - 1 ? 'disabled class="opacity-30 cursor-not-allowed"' : 'class="hover:text-white text-xs"'}>
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Moves an image left (-1) or right (+1) in the list
 */
function moveImage(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= uploadedImages.length) return;

    const temp = uploadedImages[index];
    uploadedImages[index] = uploadedImages[targetIndex];
    uploadedImages[targetIndex] = temp;

    renderThumbnails();
}

/**
 * Removes single image by ID
 */
function removeImage(id) {
    uploadedImages = uploadedImages.filter(img => img.id !== id);
    renderThumbnails();
}

/**
 * Clears all uploaded images
 */
function clearAllImages() {
    uploadedImages = [];
    renderThumbnails();
}

/**
 * Helper to compress image dataUrl based on selected quality setting
 */
function compressImage(imgObj, qualitySetting) {
    return new Promise((resolve) => {
        if (qualitySetting === 'high') {
            let format = 'JPEG';
            if (imgObj.type.includes('png')) format = 'PNG';
            if (imgObj.type.includes('webp')) format = 'WEBP';
            resolve({ dataUrl: imgObj.dataUrl, format: format });
            return;
        }

        const qualityFactor = qualitySetting === 'low' ? 0.4 : 0.7;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', qualityFactor);
            resolve({ dataUrl: compressedDataUrl, format: 'JPEG' });
        };
        img.onerror = () => {
            let format = 'JPEG';
            if (imgObj.type.includes('png')) format = 'PNG';
            if (imgObj.type.includes('webp')) format = 'WEBP';
            resolve({ dataUrl: imgObj.dataUrl, format: format });
        };
        img.src = imgObj.dataUrl;
    });
}

/**
 * Generates and triggers instant PDF download using jsPDF client-side
 */
async function generateAndDownloadPdf() {
    if (uploadedImages.length === 0) return;

    const convertBtn = document.getElementById('convert-pdf-btn');
    if (convertBtn) {
        convertBtn.disabled = true;
        convertBtn.innerHTML = `
            <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
            <span>Compiling PDF...</span>
        `;
        if (window.lucide) lucide.createIcons();
    }

    try {
        const { jsPDF } = window.jspdf;
        const pageSizeSetting = document.getElementById('pdf-page-size')?.value || 'a4';
        const orientationSetting = document.getElementById('pdf-orientation')?.value || 'portrait';
        const qualitySetting = document.getElementById('pdf-quality')?.value || 'high';
        const marginSetting = document.getElementById('pdf-margin')?.value || 'none';
        let customFilename = document.getElementById('pdf-filename')?.value.trim() || 'Kittutools-Converted';

        if (!customFilename.toLowerCase().endsWith('.pdf')) {
            customFilename += '.pdf';
        }

        // Margin in mm (0.5 inch = 12.7 mm)
        const margin = marginSetting === 'small' ? 12.7 : 0;

        let doc = null;

        for (let i = 0; i < uploadedImages.length; i++) {
            const imgObj = uploadedImages[i];
            const { dataUrl, format } = await compressImage(imgObj, qualitySetting);

            let pageWidth, pageHeight;
            let pageFormat, pageOrientation;

            if (pageSizeSetting === 'auto') {
                const imgWidthMM = imgObj.width * 0.264583;
                const imgHeightMM = imgObj.height * 0.264583;
                pageWidth = imgWidthMM + (margin * 2);
                pageHeight = imgHeightMM + (margin * 2);
                pageFormat = [pageWidth, pageHeight];
                pageOrientation = pageWidth >= pageHeight ? 'landscape' : 'portrait';
            } else {
                pageFormat = pageSizeSetting; // 'a4' or 'letter'
                pageOrientation = orientationSetting; // 'portrait' or 'landscape'
            }

            if (i === 0) {
                doc = new jsPDF({
                    orientation: pageOrientation,
                    unit: 'mm',
                    format: pageFormat
                });
            } else {
                doc.addPage(pageFormat, pageOrientation);
            }

            pageWidth = doc.internal.pageSize.getWidth();
            pageHeight = doc.internal.pageSize.getHeight();

            const printableWidth = pageWidth - (margin * 2);
            const printableHeight = pageHeight - (margin * 2);

            if (pageSizeSetting === 'auto') {
                doc.addImage(dataUrl, format, margin, margin, printableWidth, printableHeight);
            } else {
                const imgRatio = imgObj.width / imgObj.height;
                const printRatio = printableWidth / printableHeight;

                let drawWidth = printableWidth;
                let drawHeight = printableHeight;

                if (imgRatio > printRatio) {
                    drawHeight = printableWidth / imgRatio;
                } else {
                    drawWidth = printableHeight * imgRatio;
                }

                const xPos = margin + (printableWidth - drawWidth) / 2;
                const yPos = margin + (printableHeight - drawHeight) / 2;

                doc.addImage(dataUrl, format, xPos, yPos, drawWidth, drawHeight);
            }
        }

        if (doc) {
            doc.save(customFilename);
            if (typeof showToast === 'function') {
                showToast(`Successfully downloaded ${customFilename}!`, 'success');
            }
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to compile PDF. Please try again.', 'info');
        }
    } finally {
        if (convertBtn) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = `
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Convert & Download PDF</span>
            `;
            if (window.lucide) lucide.createIcons();
        }
    }
}
