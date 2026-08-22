// Kittutools - Pro Binary To Text & Text To Binary Converter (js/binary-converter.js)

let binaryEncodingMode = 'utf8'; // 'ascii' or 'utf8'

function openBinaryConverterModal() {
    openModal('binary-converter-modal');
    convertTextToBinary();
}

function closeBinaryConverterModal() {
    closeModal('binary-converter-modal');
}

function setBinaryEncodingMode(mode) {
    binaryEncodingMode = mode;
    const asciiBtn = document.getElementById('binary-encoding-ascii-btn');
    const utf8Btn = document.getElementById('binary-encoding-utf8-btn');

    if (mode === 'ascii') {
        if (asciiBtn) {
            asciiBtn.classList.add('bg-red-600', 'text-white');
            asciiBtn.classList.remove('bg-neutral-900', 'text-neutral-400');
        }
        if (utf8Btn) {
            utf8Btn.classList.remove('bg-red-600', 'text-white');
            utf8Btn.classList.add('bg-neutral-900', 'text-neutral-400');
        }
    } else {
        if (utf8Btn) {
            utf8Btn.classList.add('bg-red-600', 'text-white');
            utf8Btn.classList.remove('bg-neutral-900', 'text-neutral-400');
        }
        if (asciiBtn) {
            asciiBtn.classList.remove('bg-red-600', 'text-white');
            asciiBtn.classList.add('bg-neutral-900', 'text-neutral-400');
        }
    }

    convertTextToBinary();
}

function convertTextToBinary() {
    const textInput = document.getElementById('binary-text-input');
    const binaryOutput = document.getElementById('binary-binary-output');

    if (!textInput || !binaryOutput) return;

    const text = textInput.value;
    if (!text) {
        binaryOutput.value = '';
        return;
    }

    if (binaryEncodingMode === 'utf8') {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        const binaryArr = Array.from(bytes).map(b => b.toString(2).padStart(8, '0'));
        binaryOutput.value = binaryArr.join(' ');
    } else { // ASCII
        let binaryStr = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            binaryStr += (charCode & 0xFF).toString(2).padStart(8, '0') + ' ';
        }
        binaryOutput.value = binaryStr.trim();
    }
}

function convertBinaryToText() {
    const binaryInput = document.getElementById('binary-binary-output');
    const textOutput = document.getElementById('binary-text-input');

    if (!binaryInput || !textOutput) return;

    const rawBinary = binaryInput.value.trim();
    if (!rawBinary) {
        textOutput.value = '';
        return;
    }

    // Clean up input by removing non-binary non-space chars
    const tokens = rawBinary.split(/\s+/).filter(t => t.length > 0);

    try {
        if (binaryEncodingMode === 'utf8') {
            const byteValues = tokens.map(bin => parseInt(bin, 2)).filter(n => !isNaN(n));
            const byteArray = new Uint8Array(byteValues);
            const decoder = new TextDecoder('utf-8');
            textOutput.value = decoder.decode(byteArray);
        } else { // ASCII
            let text = '';
            tokens.forEach(bin => {
                const num = parseInt(bin, 2);
                if (!isNaN(num)) {
                    text += String.fromCharCode(num);
                }
            });
            textOutput.value = text;
        }
    } catch (e) {
        console.warn('Binary decode error:', e);
    }
}

function copyBinaryInputSection() {
    const textInput = document.getElementById('binary-text-input');
    if (!textInput || !textInput.value) {
        showToast('Text area is empty', 'info');
        return;
    }

    navigator.clipboard.writeText(textInput.value).then(() => {
        showToast('Text copied to clipboard!', 'success');
    }).catch(() => {
        textInput.select();
        document.execCommand('copy');
        showToast('Text copied to clipboard!', 'success');
    });
}

function copyBinaryOutputSection() {
    const binaryOutput = document.getElementById('binary-binary-output');
    if (!binaryOutput || !binaryOutput.value) {
        showToast('Binary output is empty', 'info');
        return;
    }

    navigator.clipboard.writeText(binaryOutput.value).then(() => {
        showToast('Binary code copied to clipboard!', 'success');
    }).catch(() => {
        binaryOutput.select();
        document.execCommand('copy');
        showToast('Binary code copied to clipboard!', 'success');
    });
}
