// Kittutools - URL Slug Generator (SEO Tool) (js/slug-generator.js)

const COMMON_STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in',
    'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the',
    'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
]);

function openSlugGeneratorModal() {
    openModal('slug-generator-modal');
    generateUrlSlug();
}

function closeSlugGeneratorModal() {
    closeModal('slug-generator-modal');
}

function generateUrlSlug() {
    const inputEl = document.getElementById('slug-input-title');
    const outputEl = document.getElementById('slug-output-preview');
    const removeStopWordsCheck = document.getElementById('slug-remove-stopwords');
    const lowercaseCheck = document.getElementById('slug-lowercase');
    const separatorSelect = document.getElementById('slug-separator-select');

    if (!inputEl || !outputEl) return;

    let text = inputEl.value.trim();

    if (!text) {
        outputEl.value = '';
        return;
    }

    const separator = separatorSelect ? separatorSelect.value : '-';
    const removeStopWords = removeStopWordsCheck ? removeStopWordsCheck.checked : true;
    const forceLowercase = lowercaseCheck ? lowercaseCheck.checked : true;

    // Normalize accents/diacritics
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (forceLowercase) {
        text = text.toLowerCase();
    }

    // Split into tokens based on non-alphanumeric characters
    let words = text.split(/[^a-zA-Z0-9]+/);

    // Filter out empty strings
    words = words.filter(w => w.length > 0);

    // Filter stop words if checked
    if (removeStopWords) {
        words = words.filter(w => !COMMON_STOP_WORDS.has(w.toLowerCase()));
    }

    // Join with selected separator
    let slug = words.join(separator);

    // Remove any trailing/leading separators or duplicate separators
    const escapeSep = separator === '-' ? '\\-' : separator;
    const regexDuplicate = new RegExp(`${escapeSep}+`, 'g');
    slug = slug.replace(regexDuplicate, separator);

    outputEl.value = slug;
}

function copyUrlSlug() {
    const outputEl = document.getElementById('slug-output-preview');
    if (!outputEl || !outputEl.value) {
        showToast('No slug generated to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(outputEl.value).then(() => {
        showToast('Clean SEO slug copied to clipboard!', 'success');
    }).catch(() => {
        outputEl.select();
        document.execCommand('copy');
        showToast('Clean SEO slug copied to clipboard!', 'success');
    });
}

function clearSlugInput() {
    const inputEl = document.getElementById('slug-input-title');
    const outputEl = document.getElementById('slug-output-preview');
    if (inputEl) inputEl.value = '';
    if (outputEl) outputEl.value = '';
    showToast('Input cleared', 'info');
}
