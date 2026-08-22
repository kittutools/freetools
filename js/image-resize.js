// Kittutools - Advanced Image Resize Tool (js/image-resize.js)

let resizeFiles = []; // Store uploaded file objects with image metadata
let resizeUnit = 'pixels'; // 'pixels' | 'percentage'
let isLockAspect = true;
let manualWidth = null;
let manualHeight = null;
let scalePercent = 100;

document.addEventListener('DOMContentLoaded', () => {
    initResizeUploader();
    initResizeControls();
});

function openImageResizeModal() {
    openModal('image-resize-modal');
}

function closeImageResizeModal() {
    closeModal('image-resize-modal');
}

function initResizeUploader() {
    const dropzone = document.getElementById('image-resize-dropzone');
    const fileInput = document.getElementById('image-resize-file-input');

    if (!dropzone || !fileInput) return;

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
            handleResizeFilesUpload(Array.from(e.dataTransfer.files));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleResizeFilesUpload(Array.from(e.target.files));
            fileInput.value = '';
        }
    });
}

function initResizeControls() {
    const lockAspectCheckbox = document.getElementById('resize-lock-aspect');
    const widthInput = document.getElementById('resize-width-input');
    const heightInput = document.getElementById('resize-height-input');
    const percentSlider = document.getElementById('resize-percent-slider');

    if (lockAspectCheckbox) {
        lockAspectCheckbox.addEventListener('change', (e) => {
            isLockAspect = e.target.checked;
            recalculateDimensions();
        });
    }

    if (widthInput) {
        widthInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            manualWidth = isNaN(val) ? null : val;

            if (isLockAspect && manualWidth && resizeFiles.length > 0 && resizeFiles[0].origWidth) {
                const ratio = resizeFiles[0].origHeight / resizeFiles[0].origWidth;
                manualHeight = Math.round(manualWidth * ratio);
                if (heightInput) heightInput.value = manualHeight;
            }
            renderResizeThumbnails();
        });
    }

    if (heightInput) {
        heightInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            manualHeight = isNaN(val) ? null : val;

            if (isLockAspect && manualHeight && resizeFiles.length > 0 && resizeFiles[0].origHeight) {
                const ratio = resizeFiles[0].origWidth / resizeFiles[0].origHeight;
                manualWidth = Math.round(manualHeight * ratio);
                if (widthInput) widthInput.value = manualWidth;
            }
            renderResizeThumbnails();
        });
    }

    if (percentSlider) {
        percentSlider.addEventListener('input', (e) => {
            scalePercent = parseInt(e.target.value, 10) || 100;
            const percentLabel = document.getElementById('resize-percent-label');
            if (percentLabel) percentLabel.textContent = `${scalePercent}%`;
            renderResizeThumbnails();
        });
    }
}

function setResizeUnit(unit) {
    resizeUnit = unit;
    const pixelsBtn = document.getElementById('resize-unit-pixels-btn');
    const percentBtn = document.getElementById('resize-unit-percent-btn');
    const pixelsControls = document.getElementById('resize-pixels-controls');
    const percentControls = document.getElementById('resize-percent-controls');

    if (unit === 'pixels') {
        pixelsBtn?.classList.replace('bg-neutral-900', 'bg-red-600');
        pixelsBtn?.classList.replace('text-neutral-400', 'text-white');
        percentBtn?.classList.replace('bg-red-600', 'bg-neutral-900');
        percentBtn?.classList.replace('text-white', 'text-neutral-400');
        pixelsControls?.classList.remove('hidden');
        percentControls?.classList.add('hidden');
    } else {
        percentBtn?.classList.replace('bg-neutral-900', 'bg-red-600');
        percentBtn?.classList.replace('text-neutral-400', 'text-white');
        pixelsBtn?.classList.replace('bg-red-600', 'bg-neutral-900');
        pixelsBtn?.classList.replace('text-white', 'text-neutral-400');
        percentControls?.classList.remove('hidden');
        pixelsControls?.classList.add('hidden');
    }

    renderResizeThumbnails();
}

function handleResizeFilesUpload(files) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    const filteredFiles = files.filter(f => validImageTypes.includes(f.type) || f.type.startsWith('image/'));

    if (filteredFiles.length === 0) {
        showToast('Please upload valid image files (JPG, PNG, WebP, GIF, BMP).', 'error');
        return;
    }

    let loadedCount = 0;
    filteredFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const item = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type || 'image/jpeg',
                    dataUrl: e.target.result,
                    origWidth: img.width,
                    origHeight: img.height
                };
                resizeFiles.push(item);
                loadedCount++;

                if (loadedCount === filteredFiles.length) {
                    if (resizeFiles.length > 0 && manualWidth === null) {
                        manualWidth = resizeFiles[0].origWidth;
                        manualHeight = resizeFiles[0].origHeight;
                        const wInput = document.getElementById('resize-width-input');
                        const hInput = document.getElementById('resize-height-input');
                        if (wInput) wInput.value = manualWidth;
                        if (hInput) hInput.value = manualHeight;
                    }
                    renderResizeThumbnails();
                    showToast(`Added ${filteredFiles.length} image(s) for resizing.`, 'success');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function recalculateDimensions() {
    if (isLockAspect && manualWidth && resizeFiles.length > 0 && resizeFiles[0].origWidth) {
        const ratio = resizeFiles[0].origHeight / resizeFiles[0].origWidth;
        manualHeight = Math.round(manualWidth * ratio);
        const hInput = document.getElementById('resize-height-input');
        if (hInput) hInput.value = manualHeight;
    }
    renderResizeThumbnails();
}

function calculateTargetDimensions(item) {
    if (resizeUnit === 'percentage') {
        const factor = scalePercent / 100;
        return {
            w: Math.max(1, Math.round(item.origWidth * factor)),
            h: Math.max(1, Math.round(item.origHeight * factor))
        };
    } else {
        if (manualWidth && manualHeight && !isLockAspect) {
            return { w: manualWidth, h: manualHeight };
        } else if (manualWidth && isLockAspect) {
            const ratio = item.origHeight / item.origWidth;
            return { w: manualWidth, h: Math.max(1, Math.round(manualWidth * ratio)) };
        } else if (manualWidth && manualHeight) {
            return { w: manualWidth, h: manualHeight };
        } else {
            return { w: item.origWidth, h: item.origHeight };
        }
    }
}

function renderResizeThumbnails() {
    const countBadge = document.getElementById('resize-count-badge');
    const emptyState = document.getElementById('resize-empty-state');
    const grid = document.getElementById('resize-thumbnails-grid');
    const zipBtn = document.getElementById('download-resized-zip-btn');

    if (countBadge) countBadge.textContent = `${resizeFiles.length} images`;

    if (resizeFiles.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');
        if (zipBtn) zipBtn.disabled = true;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (grid) grid.classList.remove('hidden');
    if (zipBtn) zipBtn.disabled = false;

    grid.innerHTML = '';

    resizeFiles.forEach((item, index) => {
        const targetDim = calculateTargetDimensions(item);

        const card = document.createElement('div');
        card.className = 'bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between gap-3 relative group';

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl bg-black border border-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img src="${item.dataUrl}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-white truncate" title="${item.name}">${item.name}</p>
                    <div class="text-[11px] text-neutral-400 mt-1 space-y-0.5">
                        <p>Original: <span class="text-neutral-300 font-mono">${item.origWidth}×${item.origHeight} px</span></p>
                        <p>New Size: <span class="text-red-400 font-mono font-bold">${targetDim.w}×${targetDim.h} px</span></p>
                    </div>
                </div>
                <button onclick="removeResizeItem(${index})" class="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors" title="Remove image">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="flex items-center justify-end border-t border-neutral-800/80 pt-2">
                <button onclick="downloadSingleResizedImage(${index})" class="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-semibold transition-colors">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Download</span>
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

function removeResizeItem(index) {
    resizeFiles.splice(index, 1);
    renderResizeThumbnails();
}

function clearAllResizeImages() {
    resizeFiles = [];
    manualWidth = null;
    manualHeight = null;
    const wInput = document.getElementById('resize-width-input');
    const hInput = document.getElementById('resize-height-input');
    if (wInput) wInput.value = '';
    if (hInput) hInput.value = '';
    renderResizeThumbnails();
}

function resizeImageToCanvas(item) {
    return new Promise((resolve) => {
        const targetDim = calculateTargetDimensions(item);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetDim.w;
            canvas.height = targetDim.h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetDim.w, targetDim.h);
            resolve({ canvas, targetDim });
        };
        img.src = item.dataUrl;
    });
}

async function downloadSingleResizedImage(index) {
    const item = resizeFiles[index];
    if (!item) return;

    try {
        const { canvas } = await resizeImageToCanvas(item);
        const outputType = item.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, 0.92);

        const a = document.createElement('a');
        const ext = outputType === 'image/png' ? 'png' : 'jpg';
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        a.download = `${baseName}_resized.${ext}`;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloaded ${a.download}`, 'success');
    } catch (err) {
        showToast('Failed to resize image: ' + err.message, 'error');
    }
}

async function downloadAllResizedZip() {
    if (resizeFiles.length === 0 || !window.JSZip) {
        showToast('No images to download or JSZip missing.', 'error');
        return;
    }

    const zipBtn = document.getElementById('download-resized-zip-btn');
    if (zipBtn) zipBtn.disabled = true;

    try {
        const zip = new JSZip();
        showToast('Resizing images and generating ZIP archive...', 'info');

        for (let i = 0; i < resizeFiles.length; i++) {
            const item = resizeFiles[i];
            const { canvas } = await resizeImageToCanvas(item);
            const outputType = item.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const ext = outputType === 'image/png' ? 'png' : 'jpg';
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;

            const base64Data = canvas.toDataURL(outputType, 0.92).split(',')[1];
            zip.file(`${baseName}_resized_${i + 1}.${ext}`, base64Data, { base64: true });
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.download = 'Kittutools_Resized_Images.zip';
        a.href = URL.createObjectURL(zipBlob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('Resized ZIP download completed!', 'success');
    } catch (err) {
        showToast('Error generating ZIP: ' + err.message, 'error');
    } finally {
        if (zipBtn) zipBtn.disabled = false;
    }
}
