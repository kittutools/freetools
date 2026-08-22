// Kittutools - AI-Inspired Color Palette Generator (js/color-palette.js)

let paletteColors = [
    { hex: '#EF4444', locked: false },
    { hex: '#3B82F6', locked: false },
    { hex: '#10B981', locked: false },
    { hex: '#F59E0B', locked: false },
    { hex: '#8B5CF6', locked: false }
];

function openColorPaletteModal() {
    openModal('color-palette-modal');
    generateNewPalette();
}

function closeColorPaletteModal() {
    closeModal('color-palette-modal');
}

function getRandomHexColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function hexToRgb(hex) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
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
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function generateNewPalette() {
    const ruleSelect = document.getElementById('palette-harmony-select');
    const rule = ruleSelect ? ruleSelect.value : 'complementary';

    const baseHex = paletteColors[0].locked ? paletteColors[0].hex : getRandomHexColor();
    const baseRgb = hexToRgb(baseHex);
    const [h, s, l] = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

    const newHexes = [baseHex];

    if (rule === 'monochromatic') {
        const lightOffsets = [-30, -15, 15, 30];
        lightOffsets.forEach(off => {
            const newL = Math.min(90, Math.max(10, l + off));
            newHexes.push(hslToHex(h, s, newL));
        });
    } else if (rule === 'analogous') {
        const hueOffsets = [-60, -30, 30, 60];
        hueOffsets.forEach(off => {
            const newH = (h + off + 360) % 360;
            newHexes.push(hslToHex(newH, s, l));
        });
    } else if (rule === 'triadic') {
        const hueOffsets = [120, 240, 120, 240];
        hueOffsets.forEach((off, idx) => {
            const newH = (h + off) % 360;
            const newL = idx > 1 ? Math.min(85, l + 15) : l;
            newHexes.push(hslToHex(newH, s, newL));
        });
    } else { // Complementary / Default
        const compH = (h + 180) % 360;
        newHexes.push(hslToHex(compH, s, l));
        newHexes.push(hslToHex((h + 30) % 360, s, Math.min(85, l + 15)));
        newHexes.push(hslToHex((compH + 30) % 360, s, Math.max(15, l - 15)));
        newHexes.push(hslToHex((h + 150) % 360, s, l));
    }

    for (let i = 0; i < 5; i++) {
        if (!paletteColors[i].locked) {
            paletteColors[i].hex = newHexes[i];
        }
    }

    renderPaletteUI();
}

function toggleColorLock(index) {
    paletteColors[index].locked = !paletteColors[index].locked;
    renderPaletteUI();
}

function renderPaletteUI() {
    for (let i = 0; i < 5; i++) {
        const strip = document.getElementById(`palette-strip-${i}`);
        const hexLabel = document.getElementById(`palette-hex-${i}`);
        const rgbLabel = document.getElementById(`palette-rgb-${i}`);
        const lockIcon = document.getElementById(`palette-lock-icon-${i}`);

        if (strip) {
            strip.style.backgroundColor = paletteColors[i].hex;
        }
        if (hexLabel) {
            hexLabel.textContent = paletteColors[i].hex;
        }
        if (rgbLabel) {
            const rgb = hexToRgb(paletteColors[i].hex);
            rgbLabel.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }
        if (lockIcon) {
            if (paletteColors[i].locked) {
                lockIcon.setAttribute('data-lucide', 'lock');
                lockIcon.classList.add('text-red-500');
            } else {
                lockIcon.setAttribute('data-lucide', 'unlock');
                lockIcon.classList.remove('text-red-500');
            }
        }
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

function copyColorValue(index, type = 'hex') {
    const color = paletteColors[index];
    if (!color) return;

    let valueToCopy = color.hex;
    if (type === 'rgb') {
        const rgb = hexToRgb(color.hex);
        valueToCopy = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    navigator.clipboard.writeText(valueToCopy).then(() => {
        showToast(`Copied ${valueToCopy} to clipboard!`, 'success');
    }).catch(() => {
        showToast(`Copied ${valueToCopy}`, 'success');
    });
}

function exportPaletteCssVariables() {
    let cssVars = `:root {\n`;
    paletteColors.forEach((color, idx) => {
        const rgb = hexToRgb(color.hex);
        cssVars += `  --color-palette-${idx + 1}: ${color.hex}; /* rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) */\n`;
    });
    cssVars += `}`;

    navigator.clipboard.writeText(cssVars).then(() => {
        showToast('Palette exported as CSS variables to clipboard!', 'success');
    }).catch(() => {
        showToast('Exported CSS variables!', 'success');
    });
}
