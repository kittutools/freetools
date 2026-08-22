// Kittutools - Ultimate Favicon Generator (js/favicon-generator.js)

let faviconLoadedImage = null;

function openFaviconGeneratorModal() {
    openModal('favicon-generator-modal');
    initFaviconUploader();
}

function closeFaviconGeneratorModal() {
    closeModal('favicon-generator-modal');
}

function initFaviconUploader() {
    const dropzone = document.getElementById('favicon-dropzone');
    const fileInput = document.getElementById('favicon-file-input');

    if (!dropzone || !fileInput) return;

    // Avoid duplicate event listener bindings
    if (dropzone.dataset.initialized) return;
    dropzone.dataset.initialized = 'true';

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-red-500', 'bg-neutral-900/60');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-red-500', 'bg-neutral-900/60');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-red-500', 'bg-neutral-900/60');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFaviconImageUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFaviconImageUpload(e.target.files[0]);
        }
    });
}

function handleFaviconImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid PNG or JPG image file', 'info');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            faviconLoadedImage = img;
            renderFaviconPreviews();

            const previewContainer = document.getElementById('favicon-preview-container');
            const emptyState = document.getElementById('favicon-empty-state');
            const downloadBtn = document.getElementById('download-favicon-pack-btn');

            if (previewContainer) previewContainer.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');
            if (downloadBtn) downloadBtn.disabled = false;

            showToast('Image loaded! Favicon previews updated.', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderFaviconPreviews() {
    if (!faviconLoadedImage) return;

    const sizes = [16, 32, 48, 180];
    sizes.forEach(size => {
        const canvas = document.getElementById(`favicon-canvas-${size}`);
        if (canvas) {
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(faviconLoadedImage, 0, 0, size, size);
        }
    });
}

async function downloadFaviconPackZip() {
    if (!faviconLoadedImage) {
        showToast('Please upload an image first', 'info');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showToast('JSZip library loading...', 'info');
        return;
    }

    const zip = new JSZip();

    const size16Check = document.getElementById('fav-size-16');
    const size32Check = document.getElementById('fav-size-32');
    const size48Check = document.getElementById('fav-size-48');
    const size180Check = document.getElementById('fav-size-180');

    const selectedSizes = [];
    if (!size16Check || size16Check.checked) selectedSizes.push(16);
    if (!size32Check || size32Check.checked) selectedSizes.push(32);
    if (!size48Check || size48Check.checked) selectedSizes.push(48);
    if (!size180Check || size180Check.checked) selectedSizes.push(180);

    if (selectedSizes.length === 0) {
        showToast('Please select at least one icon size', 'info');
        return;
    }

    for (const size of selectedSizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(faviconLoadedImage, 0, 0, size, size);

        const filename = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(filename, base64Data, { base64: true });
    }

    // Include favicon.ico (usually 32x32 canvas exported or bundled)
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = 32;
    icoCanvas.height = 32;
    const icoCtx = icoCanvas.getContext('2d');
    icoCtx.drawImage(faviconLoadedImage, 0, 0, 32, 32);
    const icoDataUrl = icoCanvas.toDataURL('image/png');
    zip.file('favicon.ico', icoDataUrl.split(',')[1], { base64: true });

    // HTML code snippet file
    const htmlSnippet = `<!-- Kittutools Favicon Tags -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`;

    zip.file('favicon-html-code.html', htmlSnippet);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'favicon-pack.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    showToast('Favicon Pack (ZIP) downloaded successfully!', 'success');
}
