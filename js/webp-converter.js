// Kittutools - Advanced WebP Converter (js/webp-converter.js)

let webpFiles = []; // Array of objects { id, file, name, origSize, origType, dataUrl, convertedDataUrl, newSize, format }
let webpDirection = 'to_webp'; // 'to_webp' | 'from_webp_png' | 'from_webp_jpg'
let webpQuality = 0.85; // 0.05 to 1.0

document.addEventListener('DOMContentLoaded', () => {
    initWebpConverterUploader();
});

function openWebpConverterModal() {
    openModal('webp-converter-modal');
}

function closeWebpConverterModal() {
    closeModal('webp-converter-modal');
}

function initWebpConverterUploader() {
    const dropzone = document.getElementById('webp-dropzone');
    const fileInput = document.getElementById('webp-file-input');

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
            handleWebpFilesUpload(Array.from(e.dataTransfer.files));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleWebpFilesUpload(Array.from(e.target.files));
            fileInput.value = '';
        }
    });
}

function updateWebpDirection() {
    const select = document.getElementById('webp-direction-select');
    if (select) {
        webpDirection = select.value;
    }
    reprocessAllWebpFiles();
}

function updateWebpQualityValue(val) {
    const qualityNum = parseInt(val, 10);
    webpQuality = qualityNum / 100;

    const valLabel = document.getElementById('webp-quality-val');
    if (valLabel) valLabel.textContent = `${qualityNum}%`;

    reprocessAllWebpFiles();
}

function handleWebpFilesUpload(files) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    const filteredFiles = files.filter(f => validTypes.includes(f.type) || f.type.startsWith('image/'));

    if (filteredFiles.length === 0) {
        showToast('Please upload valid image files (JPG, PNG, BMP, WebP).', 'error');
        return;
    }

    let processedCount = 0;
    filteredFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const item = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                origSize: file.size,
                origType: file.type || 'image/jpeg',
                dataUrl: e.target.result
            };

            const converted = await convertSingleWebpItem(item, webpDirection, webpQuality);
            item.convertedDataUrl = converted.dataUrl;
            item.newSize = converted.size;
            item.ext = converted.ext;

            webpFiles.push(item);
            processedCount++;

            if (processedCount === filteredFiles.length) {
                renderWebpFilesList();
                showToast(`Added ${filteredFiles.length} image file(s) for WebP conversion.`, 'success');
            }
        };
        reader.readAsDataURL(file);
    });
}

function convertSingleWebpItem(item, direction, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            let mime = 'image/webp';
            let ext = 'webp';

            if (direction === 'to_webp') {
                mime = 'image/webp';
                ext = 'webp';
            } else if (direction === 'from_webp_png') {
                mime = 'image/png';
                ext = 'png';
            } else if (direction === 'from_webp_jpg') {
                mime = 'image/jpeg';
                ext = 'jpg';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const dataUrl = canvas.toDataURL(mime, quality);
            const head = 'data:' + mime + ';base64,';
            const size = Math.round((dataUrl.length - head.length) * 3 / 4);

            resolve({ dataUrl, size, ext });
        };
        img.src = item.dataUrl;
    });
}

async function reprocessAllWebpFiles() {
    if (webpFiles.length === 0) return;

    for (let i = 0; i < webpFiles.length; i++) {
        const converted = await convertSingleWebpItem(webpFiles[i], webpDirection, webpQuality);
        webpFiles[i].convertedDataUrl = converted.dataUrl;
        webpFiles[i].newSize = converted.size;
        webpFiles[i].ext = converted.ext;
    }

    renderWebpFilesList();
}

function renderWebpFilesList() {
    const badge = document.getElementById('webp-count-badge');
    const emptyState = document.getElementById('webp-empty-state');
    const list = document.getElementById('webp-items-list');
    const zipBtn = document.getElementById('download-webp-zip-btn');

    if (badge) badge.textContent = `${webpFiles.length} files`;

    if (webpFiles.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (list) list.classList.add('hidden');
        if (zipBtn) zipBtn.disabled = true;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (list) list.classList.remove('hidden');
    if (zipBtn) zipBtn.disabled = false;

    list.innerHTML = '';

    webpFiles.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 group';

        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const targetFilename = `${baseName}.${item.ext}`;

        const diffBytes = item.origSize - item.newSize;
        const savedPercent = item.origSize > 0 ? Math.round((diffBytes / item.origSize) * 100) : 0;
        const savedText = savedPercent > 0 ? `${savedPercent}% Smaller` : `${Math.abs(savedPercent)}% Larger`;
        const savedClass = savedPercent > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-neutral-400 bg-neutral-800/50 border-neutral-700/50';

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                <div class="w-14 h-14 rounded-xl bg-black border border-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    <img src="${item.convertedDataUrl}" alt="${item.name}" class="w-full h-full object-contain">
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-white truncate" title="${item.name}">${item.name}</p>

                    <!-- Original Size vs New Size Bar -->
                    <div class="flex items-center gap-2 text-xs font-mono mt-1">
                        <span class="text-neutral-400">Orig: <strong class="text-white">${formatFileSize(item.origSize)}</strong></span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-red-500"></i>
                        <span class="text-neutral-400">New: <strong class="text-red-400">${formatFileSize(item.newSize)}</strong></span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${savedClass}">${savedText}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                <button onclick="downloadSingleWebpItem(${index})" class="inline-flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Download ${item.ext.toUpperCase()}</span>
                </button>
                <button onclick="removeWebpItem(${index})" class="p-2 text-neutral-500 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition-colors" title="Remove file">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        list.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

function removeWebpItem(index) {
    webpFiles.splice(index, 1);
    renderWebpFilesList();
}

function clearAllWebpItems() {
    webpFiles = [];
    renderWebpFilesList();
}

function downloadSingleWebpItem(index) {
    const item = webpFiles[index];
    if (!item) return;

    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;

    const a = document.createElement('a');
    a.download = `${baseName}_converted.${item.ext}`;
    a.href = item.convertedDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${a.download}`, 'success');
}

async function downloadAllWebpZip() {
    if (webpFiles.length === 0 || !window.JSZip) {
        showToast('No converted files or JSZip library unavailable.', 'error');
        return;
    }

    const zipBtn = document.getElementById('download-webp-zip-btn');
    if (zipBtn) zipBtn.disabled = true;

    try {
        const zip = new JSZip();
        showToast('Building ZIP archive of converted WebP files...', 'info');

        webpFiles.forEach((item, i) => {
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
            const base64Data = item.convertedDataUrl.split(',')[1];
            zip.file(`${baseName}_converted_${i + 1}.${item.ext}`, base64Data, { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.download = 'Kittutools_WebP_Converted.zip';
        a.href = URL.createObjectURL(zipBlob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('Converted files ZIP downloaded successfully!', 'success');
    } catch (err) {
        showToast('ZIP generation failed: ' + err.message, 'error');
    } finally {
        if (zipBtn) zipBtn.disabled = false;
    }
}
