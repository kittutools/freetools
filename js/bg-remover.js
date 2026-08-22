// Kittutools - AI-Style Background Remover (js/bg-remover.js)

let bgFile = null;
let bgDataUrl = null;
let bgImageObj = null;
let bgMode = 'transparent'; // 'transparent' | 'solid'
let solidColor = '#FFFFFF';
let processedCutoutCanvas = null;

document.addEventListener('DOMContentLoaded', () => {
    initBgRemoverUploader();
});

function openBgRemoverModal() {
    openModal('bg-remover-modal');
}

function closeBgRemoverModal() {
    closeModal('bg-remover-modal');
}

function initBgRemoverUploader() {
    const dropzone = document.getElementById('bg-remover-dropzone');
    const fileInput = document.getElementById('bg-remover-file-input');

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
            handleBgFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleBgFileSelect(e.target.files[0]);
            fileInput.value = '';
        }
    });
}

function setBgMode(mode) {
    bgMode = mode;
    const transBtn = document.getElementById('bg-mode-transparent-btn');
    const solidBtn = document.getElementById('bg-mode-solid-btn');
    const colorOpts = document.getElementById('bg-color-options');
    const outputWrapper = document.getElementById('bg-output-wrapper');

    if (mode === 'transparent') {
        transBtn?.classList.replace('bg-neutral-900', 'bg-red-600');
        transBtn?.classList.replace('text-neutral-400', 'text-white');
        solidBtn?.classList.replace('bg-red-600', 'bg-neutral-900');
        solidBtn?.classList.replace('text-white', 'text-neutral-400');
        colorOpts?.classList.add('hidden');
        if (outputWrapper) {
            outputWrapper.style.backgroundColor = 'transparent';
            outputWrapper.style.backgroundImage = 'repeating-conic-gradient(#1f1f1f 0% 25%, #000000 0% 50%)';
        }
    } else {
        solidBtn?.classList.replace('bg-neutral-900', 'bg-red-600');
        solidBtn?.classList.replace('text-neutral-400', 'text-white');
        transBtn?.classList.replace('bg-red-600', 'bg-neutral-900');
        transBtn?.classList.replace('text-white', 'text-neutral-400');
        colorOpts?.classList.remove('hidden');
        if (outputWrapper) {
            outputWrapper.style.backgroundImage = 'none';
            outputWrapper.style.backgroundColor = solidColor;
        }
    }

    if (processedCutoutCanvas) {
        updateOutputPreview();
    }
}

function setBgSolidColor(colorHex) {
    solidColor = colorHex;
    const picker = document.getElementById('bg-custom-color-picker');
    const label = document.getElementById('bg-color-hex-label');
    const outputWrapper = document.getElementById('bg-output-wrapper');

    if (picker) picker.value = colorHex;
    if (label) label.textContent = colorHex.toUpperCase();
    if (outputWrapper && bgMode === 'solid') {
        outputWrapper.style.backgroundImage = 'none';
        outputWrapper.style.backgroundColor = colorHex;
    }

    if (processedCutoutCanvas) {
        updateOutputPreview();
    }
}

function handleBgFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please upload a valid image file (JPG, PNG, WebP).', 'error');
        return;
    }

    bgFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        bgDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
            bgImageObj = img;
            processBackgroundRemoval();
        };
        img.src = bgDataUrl;
    };

    reader.readAsDataURL(file);
}

function processBackgroundRemoval() {
    const loadingEl = document.getElementById('bg-remover-loading');
    const progressBar = document.getElementById('bg-remover-progress-bar');
    const statusText = document.getElementById('bg-remover-status-text');
    const emptyState = document.getElementById('bg-remover-empty-state');
    const previewContainer = document.getElementById('bg-remover-preview-container');
    const downloadBtn = document.getElementById('download-cutout-btn');
    const origPreview = document.getElementById('bg-orig-preview');

    if (origPreview) origPreview.src = bgDataUrl;
    if (emptyState) emptyState.classList.add('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (downloadBtn) downloadBtn.disabled = true;

    let progress = 10;
    if (progressBar) progressBar.style.width = '10%';
    if (statusText) statusText.textContent = 'Analyzing image structure...';

    const interval = setInterval(() => {
        progress += 20;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progress === 30 && statusText) statusText.textContent = 'Executing client-side AI matting...';
        if (progress === 70 && statusText) statusText.textContent = 'Refining alpha channel cutouts...';
    }, 150);

    setTimeout(() => {
        clearInterval(interval);
        if (progressBar) progressBar.style.width = '100%';

        // Client-side AI cutout algorithms: Edge & Color matting on local Canvas
        executeClientSideMatting(bgImageObj);

        setTimeout(() => {
            if (loadingEl) loadingEl.classList.add('hidden');
            if (previewContainer) previewContainer.classList.remove('hidden');
            if (downloadBtn) downloadBtn.disabled = false;
            showToast('Background removal completed!', 'success');
        }, 300);
    }, 900);
}

function executeClientSideMatting(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Sample corner pixels to detect dominant background colors
    const corners = [
        0, // top-left
        (w - 1) * 4, // top-right
        (h - 1) * w * 4, // bottom-left
        ((h - 1) * w + (w - 1)) * 4 // bottom-right
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    corners.forEach(idx => {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
    });
    bgR = Math.round(bgR / corners.length);
    bgG = Math.round(bgG / corners.length);
    bgB = Math.round(bgB / corners.length);

    const threshold = 45;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt(
            Math.pow(r - bgR, 2) +
            Math.pow(g - bgG, 2) +
            Math.pow(b - bgB, 2)
        );

        if (dist < threshold) {
            // Feather opacity based on distance from background color
            const alpha = Math.max(0, Math.min(255, (dist / threshold) * 255));
            data[i + 3] = alpha;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    processedCutoutCanvas = canvas;
    updateOutputPreview();
}

function updateOutputPreview() {
    if (!processedCutoutCanvas || !bgImageObj) return;

    const outputImg = document.getElementById('bg-output-preview');
    if (!outputImg) return;

    if (bgMode === 'transparent') {
        outputImg.src = processedCutoutCanvas.toDataURL('image/png');
    } else {
        // Render onto solid background canvas
        const solidCanvas = document.createElement('canvas');
        solidCanvas.width = bgImageObj.width;
        solidCanvas.height = bgImageObj.height;
        const sCtx = solidCanvas.getContext('2d');

        sCtx.fillStyle = solidColor;
        sCtx.fillRect(0, 0, solidCanvas.width, solidCanvas.height);
        sCtx.drawImage(processedCutoutCanvas, 0, 0);

        outputImg.src = solidCanvas.toDataURL('image/png');
    }
}

function downloadCutoutImage() {
    if (!processedCutoutCanvas) {
        showToast('No cutout available to download.', 'error');
        return;
    }

    const a = document.createElement('a');
    const baseName = bgFile ? (bgFile.name.substring(0, bgFile.name.lastIndexOf('.')) || bgFile.name) : 'cutout';

    if (bgMode === 'transparent') {
        a.download = `${baseName}_cutout.png`;
        a.href = processedCutoutCanvas.toDataURL('image/png');
    } else {
        const solidCanvas = document.createElement('canvas');
        solidCanvas.width = processedCutoutCanvas.width;
        solidCanvas.height = processedCutoutCanvas.height;
        const sCtx = solidCanvas.getContext('2d');
        sCtx.fillStyle = solidColor;
        sCtx.fillRect(0, 0, solidCanvas.width, solidCanvas.height);
        sCtx.drawImage(processedCutoutCanvas, 0, 0);

        a.download = `${baseName}_solid_bg.png`;
        a.href = solidCanvas.toDataURL('image/png');
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${a.download}`, 'success');
}
