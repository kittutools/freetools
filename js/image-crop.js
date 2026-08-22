// Kittutools - Ultimate Image Crop Tool Logic (js/image-crop.js)

let cropperInstance = null;
let cropImageFile = null;
let currentScaleX = 1;
let currentScaleY = 1;
let currentRotate = 0;

document.addEventListener('DOMContentLoaded', () => {
    initImageCropListeners();
});

/**
 * Initializes Drag & Drop and Control Listeners for Image Cropper
 */
function initImageCropListeners() {
    const dropzone = document.getElementById('crop-dropzone');
    const fileInput = document.getElementById('crop-file-input');
    const customWidthInput = document.getElementById('crop-custom-w');
    const customHeightInput = document.getElementById('crop-custom-h');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            loadCropImageFile(e.target.files[0]);
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
            loadCropImageFile(e.dataTransfer.files[0]);
        }
    });

    if (customWidthInput && customHeightInput) {
        const applyCustomRatio = () => {
            const w = parseFloat(customWidthInput.value);
            const h = parseFloat(customHeightInput.value);
            if (cropperInstance && !isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                cropperInstance.setAspectRatio(w / h);
                setActiveAspectButton('custom');
            }
        };
        customWidthInput.addEventListener('input', applyCustomRatio);
        customHeightInput.addEventListener('input', applyCustomRatio);
    }
}

function openCropModal() {
    openModal('image-crop-modal');
}

function closeCropModal() {
    closeModal('image-crop-modal');
}

/**
 * Loads image file into cropper container and initializes Cropper.js
 */
function loadCropImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please upload a valid image file (JPG, PNG, WebP).', 'info');
        return;
    }

    cropImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageEl = document.getElementById('cropper-target-image');
        const cropperWrapper = document.getElementById('cropper-wrapper');
        const emptyState = document.getElementById('crop-empty-state');
        const exportBtn = document.getElementById('export-cropped-btn');

        if (!imageEl || !cropperWrapper) return;

        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }

        imageEl.src = e.target.result;
        cropperWrapper.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (exportBtn) exportBtn.disabled = false;

        currentScaleX = 1;
        currentScaleY = 1;
        currentRotate = 0;

        cropperInstance = new Cropper(imageEl, {
            aspectRatio: NaN, // Free transform default
            viewMode: 1,
            autoCropArea: 0.9,
            responsive: true,
            restore: true,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
            crop(event) {
                const wInput = document.getElementById('crop-info-width');
                const hInput = document.getElementById('crop-info-height');
                if (wInput) wInput.textContent = Math.round(event.detail.width) + ' px';
                if (hInput) hInput.textContent = Math.round(event.detail.height) + ' px';
            }
        });

        setActiveAspectButton('free');
        showToast('Image loaded into cropper!', 'success');
    };
    reader.readAsDataURL(file);
}

/**
 * Sets Aspect Ratio Preset on Cropper instance
 */
function setCropAspectRatio(ratio, presetName) {
    const customWrapper = document.getElementById('crop-custom-input-wrapper');

    if (presetName === 'custom') {
        if (customWrapper) customWrapper.classList.remove('hidden');
        if (cropperInstance) {
            const w = parseFloat(document.getElementById('crop-custom-w')?.value || '1');
            const h = parseFloat(document.getElementById('crop-custom-h')?.value || '1');
            if (w > 0 && h > 0) {
                cropperInstance.setAspectRatio(w / h);
            }
        }
    } else {
        if (customWrapper) customWrapper.classList.add('hidden');
        if (cropperInstance) {
            cropperInstance.setAspectRatio(ratio);
        }
    }

    setActiveAspectButton(presetName);
}

function setActiveAspectButton(presetName) {
    const buttons = document.querySelectorAll('.crop-aspect-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-aspect') === presetName) {
            btn.classList.add('bg-red-600', 'text-white', 'border-red-500');
            btn.classList.remove('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');
        } else {
            btn.classList.remove('bg-red-600', 'text-white', 'border-red-500');
            btn.classList.add('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');
        }
    });
}

/**
 * Transformations & Adjustments
 */
function rotateCropImage(degree) {
    if (!cropperInstance) return;
    currentRotate += degree;
    cropperInstance.rotate(degree);
}

function flipCropImage(direction) {
    if (!cropperInstance) return;
    if (direction === 'horizontal') {
        currentScaleX = -currentScaleX;
        cropperInstance.scaleX(currentScaleX);
    } else if (direction === 'vertical') {
        currentScaleY = -currentScaleY;
        cropperInstance.scaleY(currentScaleY);
    }
}

function zoomCropImage(ratio) {
    if (!cropperInstance) return;
    cropperInstance.zoom(ratio);
}

function resetCropImage() {
    if (!cropperInstance) return;
    cropperInstance.reset();
    currentScaleX = 1;
    currentScaleY = 1;
    currentRotate = 0;
    setActiveAspectButton('free');
    showToast('Cropper reset to original!', 'info');
}

/**
 * Exports cropped image canvas to downloadable file
 */
function exportCroppedImage() {
    if (!cropperInstance) return;

    const exportFormatSelect = document.getElementById('crop-export-format')?.value || 'image/png';
    let ext = 'png';
    if (exportFormatSelect === 'image/jpeg') ext = 'jpg';
    if (exportFormatSelect === 'image/webp') ext = 'webp';

    const croppedCanvas = cropperInstance.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });

    if (!croppedCanvas) {
        showToast('Could not extract cropped area.', 'info');
        return;
    }

    croppedCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Kittutools_Cropped_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Cropped image exported successfully!', 'success');
    }, exportFormatSelect, 0.95);
}
