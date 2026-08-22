// Kittutools - Dedicated PNG to JPG Converter (js/png-to-jpg.js)

let pngToJpgFiles = []; // Array of objects { id, file, name, origSize, dataUrl, convertedDataUrl, newSize }
let pngToJpgQuality = 0.90; // 0.0 to 1.0
let pngToJpgBgColor = '#FFFFFF'; // White or Black background fill

document.addEventListener('DOMContentLoaded', () => {
    initPngToJpgUploader();
});

function openPngToJpgModal() {
    openModal('png-to-jpg-modal');
}

function closePngToJpgModal() {
    closeModal('png-to-jpg-modal');
}

function initPngToJpgUploader() {
    const dropzone = document.getElementById('png-to-jpg-dropzone');
    const fileInput = document.getElementById('png-to-jpg-file-input');

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
            handlePngFilesUpload(Array.from(e.dataTransfer.files));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handlePngFilesUpload(Array.from(e.target.files));
            fileInput.value = '';
        }
    });
}

function updatePngQualityValue(val) {
    const qualityNum = parseInt(val, 10);
    pngToJpgQuality = qualityNum / 100;

    const valLabel = document.getElementById('png-quality-val');
    if (valLabel) valLabel.textContent = `${qualityNum}%`;

    reprocessAllPngFiles();
}

function updatePngBgColor(colorHex) {
    pngToJpgBgColor = colorHex;

    const btnWhite = document.getElementById('png-bg-white-btn');
    const btnBlack = document.getElementById('png-bg-black-btn');

    if (btnWhite && btnBlack) {
        if (colorHex.toUpperCase() === '#FFFFFF') {
            btnWhite.className = 'px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold transition-all border border-red-500';
            btnBlack.className = 'px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-neutral-800';
        } else {
            btnBlack.className = 'px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold transition-all border border-red-500';
            btnWhite.className = 'px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-neutral-800';
        }
    }

    reprocessAllPngFiles();
}

function handlePngFilesUpload(files) {
    // Filter for PNG images (or general images)
    const filteredFiles = files.filter(f => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png') || f.type.startsWith('image/'));

    if (filteredFiles.length === 0) {
        showToast('Please select PNG image files to convert.', 'error');
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
                dataUrl: e.target.result
            };

            const converted = await convertSinglePngToJpg(item, pngToJpgQuality, pngToJpgBgColor);
            item.convertedDataUrl = converted.dataUrl;
            item.newSize = converted.size;

            pngToJpgFiles.push(item);
            processedCount++;

            if (processedCount === filteredFiles.length) {
                renderPngToJpgList();
                showToast(`Added ${filteredFiles.length} PNG file(s) for conversion.`, 'success');
            }
        };
        reader.readAsDataURL(file);
    });
}

function convertSinglePngToJpg(item, quality, bgColor) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Fill background color (since PNG might have transparency)
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw PNG on top
            ctx.drawImage(img, 0, 0);

            const mime = 'image/jpeg';
            const dataUrl = canvas.toDataURL(mime, quality);
            const head = 'data:' + mime + ';base64,';
            const size = Math.round((dataUrl.length - head.length) * 3 / 4);

            resolve({ dataUrl, size });
        };
        img.src = item.dataUrl;
    });
}

async function reprocessAllPngFiles() {
    if (pngToJpgFiles.length === 0) return;

    for (let i = 0; i < pngToJpgFiles.length; i++) {
        const converted = await convertSinglePngToJpg(pngToJpgFiles[i], pngToJpgQuality, pngToJpgBgColor);
        pngToJpgFiles[i].convertedDataUrl = converted.dataUrl;
        pngToJpgFiles[i].newSize = converted.size;
    }

    renderPngToJpgList();
}

function renderPngToJpgList() {
    const badge = document.getElementById('png-count-badge');
    const emptyState = document.getElementById('png-empty-state');
    const list = document.getElementById('png-items-list');
    const zipBtn = document.getElementById('download-png-zip-btn');

    if (badge) badge.textContent = `${pngToJpgFiles.length} files`;

    if (pngToJpgFiles.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (list) list.classList.add('hidden');
        if (zipBtn) zipBtn.disabled = true;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (list) list.classList.remove('hidden');
    if (zipBtn) zipBtn.disabled = false;

    list.innerHTML = '';

    pngToJpgFiles.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3 group';

        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const targetFilename = `${baseName}.jpg`;

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-12 h-12 rounded-xl bg-black border border-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1" style="background-color: ${pngToJpgBgColor}">
                    <img src="${item.convertedDataUrl}" alt="${item.name}" class="w-full h-full object-contain">
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
                <button onclick="downloadSinglePngJpg(${index})" class="inline-flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Download JPG</span>
                </button>
                <button onclick="removePngItem(${index})" class="p-2 text-neutral-500 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition-colors" title="Remove file">
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

function removePngItem(index) {
    pngToJpgFiles.splice(index, 1);
    renderPngToJpgList();
}

function clearAllPngItems() {
    pngToJpgFiles = [];
    renderPngToJpgList();
}

function downloadSinglePngJpg(index) {
    const item = pngToJpgFiles[index];
    if (!item) return;

    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;

    const a = document.createElement('a');
    a.download = `${baseName}_converted.jpg`;
    a.href = item.convertedDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${a.download}`, 'success');
}

async function downloadAllPngJpgZip() {
    if (pngToJpgFiles.length === 0 || !window.JSZip) {
        showToast('No converted files or JSZip library unavailable.', 'error');
        return;
    }

    const zipBtn = document.getElementById('download-png-zip-btn');
    if (zipBtn) zipBtn.disabled = true;

    try {
        const zip = new JSZip();
        showToast('Building ZIP archive of converted JPG files...', 'info');

        pngToJpgFiles.forEach((item, i) => {
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
            const base64Data = item.convertedDataUrl.split(',')[1];
            zip.file(`${baseName}_converted_${i + 1}.jpg`, base64Data, { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.download = 'Kittutools_PNG_to_JPG.zip';
        a.href = URL.createObjectURL(zipBlob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('Converted JPG files ZIP downloaded successfully!', 'success');
    } catch (err) {
        showToast('ZIP generation failed: ' + err.message, 'error');
    } finally {
        if (zipBtn) zipBtn.disabled = false;
    }
}
