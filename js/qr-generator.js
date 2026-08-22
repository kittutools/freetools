// Kittutools - Premium QR Code Generator (js/qr-generator.js)

let qrCodeInstance = null;

function openQrGeneratorModal() {
    openModal('qr-generator-modal');
    generateQrCode();
}

function closeQrGeneratorModal() {
    closeModal('qr-generator-modal');
}

function switchQrType(type) {
    const textTab = document.getElementById('qr-tab-text');
    const wifiTab = document.getElementById('qr-tab-wifi');
    const textForm = document.getElementById('qr-form-text');
    const wifiForm = document.getElementById('qr-form-wifi');

    if (type === 'text') {
        textTab.className = 'px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white transition-colors';
        wifiTab.className = 'px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition-colors';
        textForm.classList.remove('hidden');
        wifiForm.classList.add('hidden');
    } else {
        wifiTab.className = 'px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white transition-colors';
        textTab.className = 'px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition-colors';
        wifiForm.classList.remove('hidden');
        textForm.classList.add('hidden');
    }

    generateQrCode();
}

function getQrContent() {
    const textForm = document.getElementById('qr-form-text');
    const isWifi = textForm.classList.contains('hidden');

    if (isWifi) {
        const ssid = document.getElementById('qr-wifi-ssid').value.trim() || 'MyWiFi';
        const pass = document.getElementById('qr-wifi-pass').value;
        const enc = document.getElementById('qr-wifi-enc').value;
        // WIFI:S:SSID;T:WPA;P:PASSWORD;;
        if (enc === 'nopass') {
            return `WIFI:S:${ssid};T:nopass;;`;
        }
        return `WIFI:S:${ssid};T:${enc};P:${pass};;`;
    } else {
        return document.getElementById('qr-text-input').value.trim() || 'https://kittutools.com';
    }
}

function generateQrCode() {
    const qrContainer = document.getElementById('qr-preview-container');
    if (!qrContainer) return;

    const content = getQrContent();
    const fgColor = document.getElementById('qr-fg-color')?.value || '#000000';
    const bgColor = document.getElementById('qr-bg-color')?.value || '#ffffff';

    document.getElementById('qr-fg-label').textContent = fgColor.toUpperCase();
    document.getElementById('qr-bg-label').textContent = bgColor.toUpperCase();

    qrContainer.innerHTML = '';

    if (window.QRCode) {
        qrCodeInstance = new QRCode(qrContainer, {
            text: content,
            width: 200,
            height: 200,
            colorDark: fgColor,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

function downloadQrCode() {
    const qrContainer = document.getElementById('qr-preview-container');
    if (!qrContainer) return;

    const canvas = qrContainer.querySelector('canvas');
    const img = qrContainer.querySelector('img');
    const size = parseInt(document.getElementById('qr-export-size').value, 10) || 500;
    const format = document.getElementById('qr-export-format').value || 'png';

    const fgColor = document.getElementById('qr-fg-color')?.value || '#000000';
    const bgColor = document.getElementById('qr-bg-color')?.value || '#ffffff';

    let srcCanvas = canvas;
    if (!srcCanvas && img && img.src) {
        // Create offscreen image to canvas
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.onload = function() {
            processExport(tempImg);
        };
        tempImg.src = img.src;
        return;
    } else if (srcCanvas) {
        processExport(srcCanvas);
    }

    function processExport(source) {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = size;
        exportCanvas.height = size;
        const ctx = exportCanvas.getContext('2d');

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        // Draw QR
        ctx.drawImage(source, 0, 0, size, size);

        if (format === 'svg') {
            // Generate clean SVG download
            const svgData = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
                    <rect width="100%" height="100%" fill="${bgColor}"/>
                    <image href="${exportCanvas.toDataURL('image/png')}" width="${size}" height="${size}"/>
                </svg>
            `;
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qrcode_${size}x${size}.svg`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const dataUrl = exportCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `qrcode_${size}x${size}.png`;
            a.click();
        }

        if (window.showToast) {
            showToast(`QR Code exported as ${format.toUpperCase()} (${size}x${size})!`, 'success');
        }
    }
}
