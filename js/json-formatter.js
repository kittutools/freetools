// Kittutools - Smart JSON Formatter & Validator (js/json-formatter.js)

let indentSpaceCount = 2;

function openJsonFormatterModal() {
    openModal('json-formatter-modal');
    validateAndFormatJson(false);
}

function closeJsonFormatterModal() {
    closeModal('json-formatter-modal');
}

function setJsonIndent(spaces) {
    indentSpaceCount = spaces;

    const btn2 = document.getElementById('json-indent-2-btn');
    const btn4 = document.getElementById('json-indent-4-btn');

    if (spaces === 2) {
        btn2.className = 'px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium transition-colors';
        btn4.className = 'px-3 py-1 bg-neutral-900 text-neutral-400 hover:text-white rounded-lg text-xs font-medium transition-colors';
    } else {
        btn4.className = 'px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium transition-colors';
        btn2.className = 'px-3 py-1 bg-neutral-900 text-neutral-400 hover:text-white rounded-lg text-xs font-medium transition-colors';
    }

    formatJsonBeautify();
}

function validateAndFormatJson(autoFormat = false) {
    const rawInput = document.getElementById('json-input-text').value.trim();
    const statusBox = document.getElementById('json-status-box');

    if (!rawInput) {
        statusBox.className = 'hidden p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2';
        return;
    }

    try {
        const parsed = JSON.parse(rawInput);

        statusBox.className = 'p-3.5 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold flex items-center gap-2';
        statusBox.innerHTML = `
            <i data-lucide="check-circle-2" class="w-4 h-4 text-green-500"></i>
            <span>Valid JSON Object</span>
        `;
        if (window.lucide) lucide.createIcons();

        if (autoFormat) {
            document.getElementById('json-input-text').value = JSON.stringify(parsed, null, indentSpaceCount);
        }
    } catch (err) {
        statusBox.className = 'p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2';
        statusBox.innerHTML = `
            <i data-lucide="alert-triangle" class="w-4 h-4 text-red-500"></i>
            <span>Invalid JSON Syntax Error: ${escapeHtml(err.message)}</span>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatJsonBeautify() {
    const rawInput = document.getElementById('json-input-text').value.trim();
    if (!rawInput) return;

    try {
        const parsed = JSON.parse(rawInput);
        document.getElementById('json-input-text').value = JSON.stringify(parsed, null, indentSpaceCount);
        validateAndFormatJson();
        if (window.showToast) showToast(`JSON Beautified with ${indentSpaceCount} spaces!`, 'success');
    } catch (err) {
        validateAndFormatJson();
        if (window.showToast) showToast('Cannot beautify invalid JSON string', 'info');
    }
}

function formatJsonMinify() {
    const rawInput = document.getElementById('json-input-text').value.trim();
    if (!rawInput) return;

    try {
        const parsed = JSON.parse(rawInput);
        document.getElementById('json-input-text').value = JSON.stringify(parsed);
        validateAndFormatJson();
        if (window.showToast) showToast('JSON Minified!', 'success');
    } catch (err) {
        validateAndFormatJson();
        if (window.showToast) showToast('Cannot minify invalid JSON string', 'info');
    }
}

function clearJsonInput() {
    document.getElementById('json-input-text').value = '';
    validateAndFormatJson();
}

function copyCleanJson() {
    const rawInput = document.getElementById('json-input-text').value.trim();
    if (!rawInput) return;

    navigator.clipboard.writeText(rawInput).then(() => {
        if (window.showToast) {
            showToast('Clean JSON copied to clipboard!', 'success');
        }
    });
}
