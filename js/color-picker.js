// Kittutools - Pro Color Picker & HEX/RGB Converter (js/color-picker.js)

function openColorPickerModal() {
    openModal('color-picker-modal');
    updateColorFromHex(document.getElementById('color-hex-input').value || '#EF4444');
}

function closeColorPickerModal() {
    closeModal('color-picker-modal');
}

function pickColorWithEyeDropper() {
    if (!('EyeDropper' in window)) {
        if (window.showToast) showToast('EyeDropper API is not supported in this browser', 'info');
        return;
    }

    const eyeDropper = new EyeDropper();
    eyeDropper.open().then((result) => {
        if (result && result.sRGBHex) {
            updateColorFromHex(result.sRGBHex);
        }
    }).catch(() => {
        // User canceled eye dropper
    });
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    if (isNaN(num)) return { r: 239, g: 68, b: 68 };
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function rgbToHex(r, g, b) {
    const toHex = (c) => {
        const hex = Math.max(0, Math.min(255, c)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));

    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);

    return { c, m, y, k };
}

function updateColorFromNativePicker(val) {
    updateColorFromHex(val);
}

function updateColorFromHexInput(val) {
    if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
        if (!val.startsWith('#')) val = '#' + val;
        updateColorFromHex(val);
    }
}

function updateColorFromSliders() {
    const r = parseInt(document.getElementById('color-slider-r').value, 10);
    const g = parseInt(document.getElementById('color-slider-g').value, 10);
    const b = parseInt(document.getElementById('color-slider-b').value, 10);
    const a = parseFloat(document.getElementById('color-slider-a').value);

    const hex = rgbToHex(r, g, b);
    updateColorUI(hex, r, g, b, a);
}

function updateColorFromHex(hex) {
    hex = hex.toUpperCase();
    if (!hex.startsWith('#')) hex = '#' + hex;
    const rgb = hexToRgb(hex);
    const a = parseFloat(document.getElementById('color-slider-a')?.value || 1.0);
    updateColorUI(hex, rgb.r, rgb.g, rgb.b, a);
}

function updateColorUI(hex, r, g, b, a) {
    document.getElementById('color-native-picker').value = hex;
    document.getElementById('color-hex-input').value = hex;

    document.getElementById('color-slider-r').value = r;
    document.getElementById('color-slider-g').value = g;
    document.getElementById('color-slider-b').value = b;

    document.getElementById('color-val-r').textContent = r;
    document.getElementById('color-val-g').textContent = g;
    document.getElementById('color-val-b').textContent = b;
    document.getElementById('color-val-a').textContent = a.toFixed(2);

    const preview = document.getElementById('color-preview-box');
    if (preview) {
        preview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    // Update Codes Display
    const hexCode = hex;
    const rgbCode = a < 1.0 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);
    const hslCode = a < 1.0 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const cmyk = rgbToCmyk(r, g, b);
    const cmykCode = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

    document.getElementById('color-out-hex').value = hexCode;
    document.getElementById('color-out-rgb').value = rgbCode;
    document.getElementById('color-out-hsl').value = hslCode;
    document.getElementById('color-out-cmyk').value = cmykCode;
}

function copyColorCode(elementId, label) {
    const input = document.getElementById(elementId);
    if (!input || !input.value) return;

    navigator.clipboard.writeText(input.value).then(() => {
        if (window.showToast) {
            showToast(`${label} copied to clipboard!`, 'success');
        }
    });
}
