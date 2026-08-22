// Kittutools - Pro Case Converter (js/case-converter.js)

function openCaseConverterModal() {
    openModal('case-converter-modal');
}

function closeCaseConverterModal() {
    closeModal('case-converter-modal');
}

function convertCase(type) {
    const inputEl = document.getElementById('cc-input-text');
    if (!inputEl) return;

    let str = inputEl.value;
    if (!str) {
        showToast('Please enter text to convert', 'info');
        return;
    }

    let result = '';

    switch (type) {
        case 'uppercase':
            result = str.toUpperCase();
            break;
        case 'lowercase':
            result = str.toLowerCase();
            break;
        case 'titlecase':
            result = str.toLowerCase().replace(/(?:^|\s|-|_|\/)\w/g, function(match) {
                return match.toUpperCase();
            });
            break;
        case 'sentencecase':
            // Capitalize first letter of each sentence
            result = str.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, function(match, p1, p2) {
                return p1 + p2.toUpperCase();
            });
            break;
        case 'inversecase':
            result = str.split('').map(char => {
                if (char === char.toUpperCase()) {
                    return char.toLowerCase();
                } else {
                    return char.toUpperCase();
                }
            }).join('');
            break;
        case 'slugify':
            result = str
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-');
            break;
        default:
            result = str;
    }

    inputEl.value = result;
    showToast(`Converted to ${type.toUpperCase()}`, 'success');
}

function clearCaseConverterText() {
    const inputEl = document.getElementById('cc-input-text');
    if (inputEl) {
        inputEl.value = '';
        showToast('Text cleared', 'info');
    }
}

function copyCaseConverterText() {
    const inputEl = document.getElementById('cc-input-text');
    if (!inputEl || !inputEl.value) {
        showToast('No text to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(inputEl.value).then(() => {
        showToast('Converted text copied to clipboard!', 'success');
    }).catch(() => {
        inputEl.select();
        document.execCommand('copy');
        showToast('Converted text copied to clipboard!', 'success');
    });
}
