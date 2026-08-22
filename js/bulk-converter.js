// Kittutools - Pro-Level Bulk Image Converter (js/bulk-converter.js)

let bulkFiles = []; // Array of objects { id, file, name, origSize, origType, dataUrl, convertedDataUrl, newSize }
let bulkOutputFormat = 'image/webp'; // 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'
let bulkQuality = 0.85; // 0.05 to 1.0

document.addEventListener('DOMContentLoaded', () => {
    initBulkConverterUploader();
});

function openBulkConverterModal() {
    openModal('bulk-converter-modal');
}

function closeBulkConverterModal() {
    closeModal('bulk-converter-modal');
}

function initBulkConverterUploader() {
    const dropzone = document.getElementById('bulk-converter-dropzone');
    const fileInput = document.getElementById('bulk-converter-file-input');

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
            handleBulkFilesUpload(Array.from(e.dataTransfer.files));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleBulkFilesUpload(Array.from(e.target.files));
            fileInput.value = '';
        }
    });
}

function updateBulkQualityValue(val) {
    const qualityNum = parseInt(val, 10);
    bulkQuality = qualityNum / 100;

    const valLabel = document.getElementById('bulk-quality-val');
    if (valLabel) valLabel.textContent = `${qualityNum}%`;

    reprocessAllBulkFiles();
}

function updateBulkConverterSettings() {
    const formatSelect = document.getElementById('bulk-output-format');
    const qualityWrapper = document.getElementById('bulk-quality-wrapper');

    if (formatSelect) {
        bulkOutputFormat = formatSelect.value;
    }

    if (qualityWrapper) {
        if (bulkOutputFormat === 'image/jpeg' || bulkOutputFormat === 'image/webp') {
            qualityWrapper.classList.remove('opacity-40', 'pointer-events-none');
        } else {
            qualityWrapper.classList.add('opacity-40', 'pointer-events-none');
        }
    }

    reprocessAllBulkFiles();
}

function handleBulkFilesUpload(files) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
    const filteredFiles = files.filter(f => validTypes.includes(f.type) || f.type.startsWith('image/'));

    if (filteredFiles.length === 0) {
        showToast('Please upload valid image files (PNG, JPG, WebP, BMP, GIF).', 'error');
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
                origType: file.type || 'image/png',
                dataUrl: e.target.result
            };

            const converted = await convertSingleItem(item, bulkOutputFormat, bulkQuality);
            item.convertedDataUrl = converted.dataUrl;
            item.newSize = converted.size;

            bulkFiles.push(item);
            processedCount++;

            if (processedCount === filteredFiles.length) {
                renderBulkFilesList();
                showToast(`Added ${filteredFiles.length} file(s) for conversion.`, 'success');
            }
        };
        reader.readAsDataURL(file);
    });
}

function convertSingleItem(item, targetFormat, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const mime = targetFormat === 'image/bmp' ? 'image/png' : targetFormat;
            const dataUrl = canvas.toDataURL(mime, quality);
            const head = 'data:' + mime + ';base64,';
            const size = Math.round((dataUrl.length - head.length) * 3 / 4);

            resolve({ dataUrl, size });
        };
        img.src = item.dataUrl;
    });
}

async function reprocessAllBulkFiles() {
    if (bulkFiles.length === 0) return;

    for (let i = 0; i < bulkFiles.length; i++) {
        const converted = await convertSingleItem(bulkFiles[i], bulkOutputFormat, bulkQuality);
        bulkFiles[i].convertedDataUrl = converted.dataUrl;
        bulkFiles[i].newSize = converted.size;
    }

    renderBulkFilesList();
}

function renderBulkFilesList() {
    const badge = document.getElementById('bulk-count-badge');
    const emptyState = document.getElementById('bulk-empty-state');
    const list = document.getElementById('bulk-items-list');
    const zipBtn = document.getElementById('download-converted-zip-btn');

    if (badge) badge.textContent = `${bulkFiles.length} files`;

    if (bulkFiles.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (list) list.classList.add('hidden');
        if (zipBtn) zipBtn.disabled = true;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (list) list.classList.remove('hidden');
    if (zipBtn) zipBtn.disabled = false;

    list.innerHTML = '';

    const formatExtMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };
    const targetExt = formatExtMap[bulkOutputFormat] || 'jpg';

    bulkFiles.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3 group';

        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const targetFilename = `${baseName}.${targetExt}`;

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-12 h-12 rounded-xl bg-black border border-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img src="${item.dataUrl}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-white truncate" title="${item.name}">${item.name}</p>
                    <div class="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span class="text-neutral-500 font-mono">${formatFileSize(item.origSize)}</span>
                        <i data-lucide="arrow-right" class="w-3 h-3 text-red-500"></i>
                        <span class="text-red-400 font-bold font-mono">${targetFilename} (${formatFileSize(item.newSize)})</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
                <button onclick="downloadSingleBulkItem(${index})" class="inline-flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Download</span>
                </button>
                <button onclick="removeBulkItem(${index})" class="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors" title="Remove file">
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

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function removeBulkItem(index) {
    bulkFiles.splice(index, 1);
    renderBulkFilesList();
}

function clearAllBulkItems() {
    bulkFiles = [];
    renderBulkFilesList();
}

function downloadSingleBulkItem(index) {
    const item = bulkFiles[index];
    if (!item) return;

    const formatExtMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };
    const targetExt = formatExtMap[bulkOutputFormat] || 'jpg';
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;

    const a = document.createElement('a');
    a.download = `${baseName}_converted.${targetExt}`;
    a.href = item.convertedDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${a.download}`, 'success');
}

async function downloadAllConvertedZip() {
    if (bulkFiles.length === 0 || !window.JSZip) {
        showToast('No converted files or JSZip library unavailable.', 'error');
        return;
    }

    const zipBtn = document.getElementById('download-converted-zip-btn');
    if (zipBtn) zipBtn.disabled = true;

    try {
        const zip = new JSZip();
        showToast('Building ZIP archive of converted files...', 'info');

        const formatExtMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/bmp': 'bmp'
        };
        const targetExt = formatExtMap[bulkOutputFormat] || 'jpg';

        bulkFiles.forEach((item, i) => {
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
            const base64Data = item.convertedDataUrl.split(',')[1];
            zip.file(`${baseName}_converted_${i + 1}.${targetExt}`, base64Data, { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.download = 'Kittutools_Converted_Images.zip';
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
