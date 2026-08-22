// Kittutools - SVG to PNG Converter (js/svg-to-png.js)

let svgFile = null; // { file, name, size, svgText, origWidth, origHeight, aspect }
let svgExportWidth = 1024;
let svgExportHeight = 1024;
let svgLockAspect = true;

document.addEventListener('DOMContentLoaded', () => {
    initSvgToPngUploader();
});

function openSvgToPngModal() {
    openModal('svg-to-png-modal');
}

function closeSvgToPngModal() {
    closeModal('svg-to-png-modal');
}

function initSvgToPngUploader() {
    const dropzone = document.getElementById('svg-dropzone');
    const fileInput = document.getElementById('svg-file-input');

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
            handleSvgFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleSvgFileUpload(e.target.files[0]);
            fileInput.value = '';
        }
    });

    const wInput = document.getElementById('svg-width-input');
    const hInput = document.getElementById('svg-height-input');
    const aspectCheckbox = document.getElementById('svg-lock-aspect');

    if (aspectCheckbox) {
        aspectCheckbox.addEventListener('change', (e) => {
            svgLockAspect = e.target.checked;
        });
    }

    if (wInput) {
        wInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!val || val <= 0) return;
            svgExportWidth = val;
            if (svgLockAspect && svgFile && svgFile.aspect) {
                svgExportHeight = Math.round(val / svgFile.aspect);
                if (hInput) hInput.value = svgExportHeight;
            }
            renderSvgPreview();
        });
    }

    if (hInput) {
        hInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!val || val <= 0) return;
            svgExportHeight = val;
            if (svgLockAspect && svgFile && svgFile.aspect) {
                svgExportWidth = Math.round(val * svgFile.aspect);
                if (wInput) wInput.value = svgExportWidth;
            }
            renderSvgPreview();
        });
    }
}

function handleSvgFileUpload(file) {
    if (!file || (!file.type.includes('svg') && !file.name.toLowerCase().endsWith('.svg'))) {
        showToast('Please upload a valid SVG vector file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const svgText = e.target.result;

        // Parse SVG dimensions
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');

        let origW = 512;
        let origH = 512;

        if (svgEl) {
            const viewBox = svgEl.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.trim().split(/[\s,]+/);
                if (parts.length === 4) {
                    origW = parseFloat(parts[2]) || origW;
                    origH = parseFloat(parts[3]) || origH;
                }
            } else {
                origW = parseFloat(svgEl.getAttribute('width')) || origW;
                origH = parseFloat(svgEl.getAttribute('height')) || origH;
            }
        }

        const aspect = origW / origH;
        svgExportWidth = Math.round(origW) || 1024;
        svgExportHeight = Math.round(origH) || 1024;

        // Default upscale to at least 1024 if small
        if (svgExportWidth < 1024 && svgExportHeight < 1024) {
            svgExportWidth = 1024;
            svgExportHeight = Math.round(1024 / aspect);
        }

        svgFile = {
            file: file,
            name: file.name,
            size: file.size,
            svgText: svgText,
            origWidth: origW,
            origHeight: origH,
            aspect: aspect
        };

        const wInput = document.getElementById('svg-width-input');
        const hInput = document.getElementById('svg-height-input');
        if (wInput) wInput.value = svgExportWidth;
        if (hInput) hInput.value = svgExportHeight;

        const infoName = document.getElementById('svg-file-name');
        const infoSize = document.getElementById('svg-file-size');
        const fileStatus = document.getElementById('svg-file-status');
        const emptyState = document.getElementById('svg-empty-state');
        const previewWrapper = document.getElementById('svg-preview-wrapper');
        const downloadBtn = document.getElementById('download-svg-png-btn');

        if (infoName) infoName.textContent = file.name;
        if (infoSize) infoSize.textContent = `${formatFileSize(file.size)} • Original: ${Math.round(origW)}x${Math.round(origH)} px`;
        if (fileStatus) fileStatus.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (previewWrapper) previewWrapper.classList.remove('hidden');
        if (downloadBtn) downloadBtn.disabled = false;

        renderSvgPreview();
        showToast('SVG file loaded successfully!', 'success');
    };
    reader.readAsText(file);
}

function setPresetResolution(w, h) {
    svgExportWidth = w;
    svgExportHeight = h;

    const wInput = document.getElementById('svg-width-input');
    const hInput = document.getElementById('svg-height-input');

    if (wInput) wInput.value = w;
    if (hInput) hInput.value = h;

    if (svgFile) {
        svgFile.aspect = w / h;
    }

    renderSvgPreview();
}

function renderSvgPreview() {
    if (!svgFile) return;

    const previewContainer = document.getElementById('svg-preview-container');
    const dimText = document.getElementById('svg-render-dims');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    const blob = new Blob([svgFile.svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(url);
        img.className = 'max-h-64 object-contain mx-auto';
        previewContainer.appendChild(img);
    };
    img.src = url;

    if (dimText) {
        dimText.textContent = `${svgExportWidth} x ${svgExportHeight} px`;
    }
}

function resetSvgUI() {
    svgFile = null;
    const fileStatus = document.getElementById('svg-file-status');
    const emptyState = document.getElementById('svg-empty-state');
    const previewWrapper = document.getElementById('svg-preview-wrapper');
    const downloadBtn = document.getElementById('download-svg-png-btn');

    if (fileStatus) fileStatus.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (previewWrapper) previewWrapper.classList.add('hidden');
    if (downloadBtn) downloadBtn.disabled = true;
}

function downloadSvgAsPng() {
    if (!svgFile) {
        showToast('No SVG file uploaded.', 'error');
        return;
    }

    const downloadBtn = document.getElementById('download-svg-png-btn');
    if (downloadBtn) downloadBtn.disabled = true;

    try {
        const blob = new Blob([svgFile.svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = svgExportWidth;
            canvas.height = svgExportHeight;
            const ctx = canvas.getContext('2d');

            // Clear canvas for transparency
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);

            const pngDataUrl = canvas.toDataURL('image/png');
            const baseName = svgFile.name.substring(0, svgFile.name.lastIndexOf('.')) || svgFile.name;

            const a = document.createElement('a');
            a.download = `${baseName}_${svgExportWidth}x${svgExportHeight}.png`;
            a.href = pngDataUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showToast(`Downloaded transparent PNG (${svgExportWidth}x${svgExportHeight} px)!`, 'success');
            if (downloadBtn) downloadBtn.disabled = false;
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            showToast('Failed to render SVG to canvas.', 'error');
            if (downloadBtn) downloadBtn.disabled = false;
        };
        img.src = url;
    } catch (err) {
        showToast('Error converting SVG: ' + err.message, 'error');
        if (downloadBtn) downloadBtn.disabled = false;
    }
}
