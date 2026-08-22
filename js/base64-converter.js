// Kittutools - Pro Base64 To Image & Image To Base64 Converter (js/base64-converter.js)

let base64ActiveTab = 'img2base64';

function openBase64ConverterModal() {
    openModal('base64-converter-modal');
    initBase64Uploader();
}

function closeBase64ConverterModal() {
    closeModal('base64-converter-modal');
}

function switchBase64Tab(tab) {
    base64ActiveTab = tab;
    const tabA = document.getElementById('b64-tab-img2b64');
    const tabB = document.getElementById('b64-tab-b642img');
    const sectionA = document.getElementById('b64-section-img2b64');
    const sectionB = document.getElementById('b64-section-b642img');

    if (tab === 'img2base64') {
        tabA.classList.add('bg-red-600', 'text-white');
        tabA.classList.remove('bg-neutral-900', 'text-neutral-400');
        tabB.classList.remove('bg-red-600', 'text-white');
        tabB.classList.add('bg-neutral-900', 'text-neutral-400');

        sectionA.classList.remove('hidden');
        sectionB.classList.add('hidden');
    } else {
        tabB.classList.add('bg-red-600', 'text-white');
        tabB.classList.remove('bg-neutral-900', 'text-neutral-400');
        tabA.classList.remove('bg-red-600', 'text-white');
        tabA.classList.add('bg-neutral-900', 'text-neutral-400');

        sectionB.classList.remove('hidden');
        sectionA.classList.add('hidden');
    }
}

function initBase64Uploader() {
    const dropzone = document.getElementById('b64-dropzone');
    const fileInput = document.getElementById('b64-file-input');

    if (!dropzone || !fileInput) return;

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
            convertImageToBase64(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            convertImageToBase64(e.target.files[0]);
        }
    });
}

function convertImageToBase64(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'info');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Str = e.target.result;
        const outputText = document.getElementById('b64-output-string');
        const previewImg = document.getElementById('b64-input-preview-img');
        const emptyState = document.getElementById('b64-empty-state-a');
        const activeContainer = document.getElementById('b64-output-container-a');

        if (outputText) outputText.value = base64Str;
        if (previewImg) previewImg.src = base64Str;
        if (emptyState) emptyState.classList.add('hidden');
        if (activeContainer) activeContainer.classList.remove('hidden');

        showToast('Image converted to Base64 Data URI!', 'success');
    };
    reader.readAsDataURL(file);
}

function copyBase64String() {
    const outputText = document.getElementById('b64-output-string');
    if (!outputText || !outputText.value) {
        showToast('No Base64 string to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(outputText.value).then(() => {
        showToast('Base64 string copied to clipboard!', 'success');
    }).catch(() => {
        outputText.select();
        document.execCommand('copy');
        showToast('Base64 string copied to clipboard!', 'success');
    });
}

function decodeBase64ToImage() {
    const inputArea = document.getElementById('b64-input-string');
    const previewImg = document.getElementById('b64-decoded-img');
    const emptyState = document.getElementById('b64-empty-state-b');
    const activeContainer = document.getElementById('b64-output-container-b');
    const downloadBtn = document.getElementById('download-b64-decoded-btn');

    if (!inputArea || !inputArea.value.trim()) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (activeContainer) activeContainer.classList.add('hidden');
        if (downloadBtn) downloadBtn.disabled = true;
        return;
    }

    let b64 = inputArea.value.trim();
    if (!b64.startsWith('data:image/')) {
        // If raw base64 without Data URI prefix, add standard PNG header
        b64 = 'data:image/png;base64,' + b64;
    }

    if (previewImg) {
        previewImg.onerror = () => {
            showToast('Invalid Base64 string format', 'info');
            if (emptyState) emptyState.classList.remove('hidden');
            if (activeContainer) activeContainer.classList.add('hidden');
            if (downloadBtn) downloadBtn.disabled = true;
        };
        previewImg.onload = () => {
            if (emptyState) emptyState.classList.add('hidden');
            if (activeContainer) activeContainer.classList.remove('hidden');
            if (downloadBtn) downloadBtn.disabled = false;
        };
        previewImg.src = b64;
    }
}

function downloadDecodedImage() {
    const previewImg = document.getElementById('b64-decoded-img');
    if (!previewImg || !previewImg.src) {
        showToast('No decoded image to download', 'info');
        return;
    }

    const link = document.createElement('a');
    link.href = previewImg.src;
    link.download = 'decoded-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded decoded image successfully!', 'success');
}
