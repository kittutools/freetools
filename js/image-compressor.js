// Kittutools - Pro-Level Image Compressor Logic (js/image-compressor.js)

let compressedFilesList = []; // Array of { id, originalFile, originalSize, compressedBlob, compressedSize, originalDataUrl, compressedDataUrl, savedPercent }
let isTargetKbMode = false;

document.addEventListener('DOMContentLoaded', () => {
    initCompressorListeners();
});

/**
 * Initializes listeners for Image Compressor UI
 */
function initCompressorListeners() {
    const dropzone = document.getElementById('compressor-dropzone');
    const fileInput = document.getElementById('compressor-file-input');
    const qualitySlider = document.getElementById('compressor-quality-slider');
    const qualityValueDisplay = document.getElementById('compressor-quality-val');
    const targetKbInput = document.getElementById('compressor-target-kb');
    const modeQualityBtn = document.getElementById('mode-quality-btn');
    const modeKbBtn = document.getElementById('mode-kb-btn');
    const formatSelect = document.getElementById('compressor-format-select');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleCompressorFiles(Array.from(e.target.files));
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
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleCompressorFiles(Array.from(e.dataTransfer.files));
        }
    });

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            if (qualityValueDisplay) qualityValueDisplay.textContent = e.target.value + '%';
            recompressAllFiles();
        });
    }

    if (targetKbInput) {
        targetKbInput.addEventListener('input', () => {
            recompressAllFiles();
        });
    }

    if (modeQualityBtn && modeKbBtn) {
        modeQualityBtn.addEventListener('click', () => {
            isTargetKbMode = false;
            modeQualityBtn.classList.add('bg-red-600', 'text-white');
            modeQualityBtn.classList.remove('bg-neutral-900', 'text-neutral-400');
            modeKbBtn.classList.remove('bg-red-600', 'text-white');
            modeKbBtn.classList.add('bg-neutral-900', 'text-neutral-400');

            document.getElementById('wrapper-quality-slider')?.classList.remove('hidden');
            document.getElementById('wrapper-target-kb')?.classList.add('hidden');
            recompressAllFiles();
        });

        modeKbBtn.addEventListener('click', () => {
            isTargetKbMode = true;
            modeKbBtn.classList.add('bg-red-600', 'text-white');
            modeKbBtn.classList.remove('bg-neutral-900', 'text-neutral-400');
            modeQualityBtn.classList.remove('bg-red-600', 'text-white');
            modeQualityBtn.classList.add('bg-neutral-900', 'text-neutral-400');

            document.getElementById('wrapper-quality-slider')?.classList.add('hidden');
            document.getElementById('wrapper-target-kb')?.classList.remove('hidden');
            recompressAllFiles();
        });
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', () => {
            recompressAllFiles();
        });
    }
}

function openCompressorModal() {
    openModal('image-compressor-modal');
}

function closeCompressorModal() {
    closeModal('image-compressor-modal');
}

/**
 * Reads multi-uploaded image files and processes compression
 */
function handleCompressorFiles(files) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
        showToast('Please upload valid image files (JPG, PNG, WebP).', 'info');
        return;
    }

    validFiles.forEach(file => {
        const id = 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        compressedFilesList.push({
            id: id,
            originalFile: file,
            originalSize: file.size,
            compressedBlob: null,
            compressedSize: 0,
            originalDataUrl: '',
            compressedDataUrl: '',
            savedPercent: 0
        });
    });

    recompressAllFiles();
}

/**
 * Compresses an image blob to target specs using Canvas
 */
async function compressSingleImage(item) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            item.originalDataUrl = dataUrl;

            const img = new Image();
            img.onload = async () => {
                const targetFormat = document.getElementById('compressor-format-select')?.value || 'original';
                let outputMime = item.originalFile.type;

                if (targetFormat === 'jpeg') outputMime = 'image/jpeg';
                else if (targetFormat === 'png') outputMime = 'image/png';
                else if (targetFormat === 'webp') outputMime = 'image/webp';

                let quality = 0.8;
                if (!isTargetKbMode) {
                    const sliderVal = parseInt(document.getElementById('compressor-quality-slider')?.value || '80', 10);
                    quality = sliderVal / 100.0;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                canvas.width = width;
                canvas.height = height;

                // Handle white background fill if converting PNG/WebP with transparency to JPEG
                if (outputMime === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);

                if (isTargetKbMode) {
                    const targetKb = parseFloat(document.getElementById('compressor-target-kb')?.value || '50');
                    const targetBytes = targetKb * 1024;

                    // Binary search or scaling iteration to achieve target KB
                    let minQ = 0.05;
                    let maxQ = 1.0;
                    let bestBlob = null;
                    let bestScale = 1.0;

                    for (let attempt = 0; attempt < 7; attempt++) {
                        const testQ = (minQ + maxQ) / 2;
                        const testBlob = await new Promise(res => canvas.toBlob(res, outputMime, testQ));

                        if (testBlob.size <= targetBytes) {
                            bestBlob = testBlob;
                            minQ = testQ; // try higher quality
                        } else {
                            maxQ = testQ; // need lower quality
                        }
                    }

                    // If quality adjustment alone is not enough, scale down canvas resolution
                    if (!bestBlob || bestBlob.size > targetBytes) {
                        let currentScale = 0.9;
                        while (currentScale >= 0.2) {
                            const scaleCanvas = document.createElement('canvas');
                            scaleCanvas.width = Math.round(width * currentScale);
                            scaleCanvas.height = Math.round(height * currentScale);
                            const sCtx = scaleCanvas.getContext('2d');
                            if (outputMime === 'image/jpeg') {
                                sCtx.fillStyle = '#FFFFFF';
                                sCtx.fillRect(0, 0, scaleCanvas.width, scaleCanvas.height);
                            }
                            sCtx.drawImage(img, 0, 0, scaleCanvas.width, scaleCanvas.height);

                            const testScaleBlob = await new Promise(res => scaleCanvas.toBlob(res, outputMime, 0.5));
                            if (testScaleBlob.size <= targetBytes || currentScale <= 0.25) {
                                bestBlob = testScaleBlob;
                                break;
                            }
                            currentScale -= 0.15;
                        }
                    }

                    item.compressedBlob = bestBlob;
                } else {
                    const blob = await new Promise(res => canvas.toBlob(res, outputMime, quality));
                    item.compressedBlob = blob;
                }

                item.compressedSize = item.compressedBlob ? item.compressedBlob.size : item.originalSize;
                item.compressedDataUrl = URL.createObjectURL(item.compressedBlob);

                const savedBytes = item.originalSize - item.compressedSize;
                item.savedPercent = Math.max(0, Math.round((savedBytes / item.originalSize) * 100));

                resolve();
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(item.originalFile);
    });
}

/**
 * Re-evaluates and compresses all loaded files
 */
async function recompressAllFiles() {
    if (compressedFilesList.length === 0) {
        renderCompressorUI();
        return;
    }

    for (let item of compressedFilesList) {
        await compressSingleImage(item);
    }

    renderCompressorUI();
}

/**
 * Renders live statistics and side-by-side comparison cards
 */
function renderCompressorUI() {
    const listContainer = document.getElementById('compressor-items-list');
    const emptyState = document.getElementById('compressor-empty-state');
    const statsBar = document.getElementById('compressor-stats-bar');

    if (!listContainer || !emptyState) return;

    if (compressedFilesList.length === 0) {
        listContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (statsBar) statsBar.classList.add('hidden');
        listContainer.innerHTML = '';
        return;
    }

    listContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    if (statsBar) statsBar.classList.remove('hidden');

    // Calculate aggregated stats
    let totalOrigBytes = 0;
    let totalCompBytes = 0;

    compressedFilesList.forEach(item => {
        totalOrigBytes += item.originalSize;
        totalCompBytes += item.compressedSize;
    });

    const totalSavedBytes = totalOrigBytes - totalCompBytes;
    const totalSavedPercent = totalOrigBytes > 0 ? Math.max(0, Math.round((totalSavedBytes / totalOrigBytes) * 100)) : 0;

    const origStatsEl = document.getElementById('stat-orig-size');
    const compStatsEl = document.getElementById('stat-new-size');
    const savedStatsEl = document.getElementById('stat-saved-percent');

    if (origStatsEl) origStatsEl.textContent = formatFileSize(totalOrigBytes);
    if (compStatsEl) compStatsEl.textContent = formatFileSize(totalCompBytes);
    if (savedStatsEl) savedStatsEl.textContent = `${totalSavedPercent}% Saved`;

    listContainer.innerHTML = compressedFilesList.map(item => `
        <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 relative group">
            <!-- Remove item -->
            <button onclick="removeCompressorItem('${item.id}')" class="absolute top-3 right-3 text-neutral-400 hover:text-red-400 p-1 rounded-md hover:bg-neutral-800 transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Comparison Preview Grid -->
            <div class="grid grid-cols-2 gap-4 w-full md:w-2/3">
                <!-- Original Preview -->
                <div class="space-y-1.5">
                    <span class="text-[10px] uppercase font-bold text-neutral-400">Original (${formatFileSize(item.originalSize)})</span>
                    <div class="w-full h-32 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                        <img src="${item.originalDataUrl}" alt="Original" class="w-full h-full object-contain">
                    </div>
                </div>

                <!-- Compressed Preview -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] uppercase font-bold text-red-400">Compressed (${formatFileSize(item.compressedSize)})</span>
                        <span class="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">-${item.savedPercent}%</span>
                    </div>
                    <div class="w-full h-32 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                        <img src="${item.compressedDataUrl}" alt="Compressed" class="w-full h-full object-contain">
                    </div>
                </div>
            </div>

            <!-- Download Button & File Info -->
            <div class="w-full md:w-1/3 flex flex-col justify-between space-y-3 pt-2 md:pt-0">
                <div>
                    <h5 class="text-xs font-bold text-white truncate" title="${item.originalFile.name}">${item.originalFile.name}</h5>
                    <p class="text-[11px] text-neutral-400 mt-0.5">Space saved: <strong class="text-green-400">${formatFileSize(Math.max(0, item.originalSize - item.compressedSize))}</strong></p>
                </div>
                <button onclick="downloadCompressedItem('${item.id}')" class="w-full inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>Download Image</span>
                </button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

/**
 * Downloads a single compressed file
 */
function downloadCompressedItem(id) {
    const item = compressedFilesList.find(f => f.id === id);
    if (!item || !item.compressedBlob) return;

    const ext = getCompressorExtension(item);
    const link = document.createElement('a');
    link.href = item.compressedDataUrl;
    link.download = `Kittutools_Compressed_${item.originalFile.name.split('.')[0]}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded compressed image!', 'success');
}

/**
 * Downloads all compressed images as a ZIP archive
 */
async function downloadAllCompressedZip() {
    if (compressedFilesList.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("compressed_images");

    compressedFilesList.forEach(item => {
        const ext = getCompressorExtension(item);
        folder.file(`compressed_${item.originalFile.name.split('.')[0]}.${ext}`, item.compressedBlob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "Kittutools_Compressed_Images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded ZIP with all compressed images!', 'success');
}

function getCompressorExtension(item) {
    const targetFormat = document.getElementById('compressor-format-select')?.value || 'original';
    if (targetFormat === 'jpeg') return 'jpg';
    if (targetFormat === 'png') return 'png';
    if (targetFormat === 'webp') return 'webp';
    return item.originalFile.name.split('.').pop() || 'jpg';
}

function removeCompressorItem(id) {
    compressedFilesList = compressedFilesList.filter(f => f.id !== id);
    renderCompressorUI();
}

function clearAllCompressorItems() {
    compressedFilesList = [];
    renderCompressorUI();
}
