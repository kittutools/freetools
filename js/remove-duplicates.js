// Kittutools - Smart Remove Duplicate Lines Tool (js/remove-duplicates.js)

function openRemoveDuplicatesModal() {
    openModal('remove-duplicates-modal');
    processDuplicateLines();
}

function closeRemoveDuplicatesModal() {
    closeModal('remove-duplicates-modal');
}

function processDuplicateLines() {
    const inputArea = document.getElementById('rd-input-text');
    const caseSensitiveCheckbox = document.getElementById('rd-case-sensitive');
    const trimWhitespaceCheckbox = document.getElementById('rd-trim-whitespace');
    const sortOrderSelect = document.getElementById('rd-sort-order');
    const notificationBadge = document.getElementById('rd-notification-badge');
    const removedCountSpan = document.getElementById('rd-removed-count');

    if (!inputArea) return;

    const rawText = inputArea.value;
    if (!rawText) {
        if (notificationBadge) notificationBadge.classList.add('hidden');
        return;
    }

    const lines = rawText.split(/\r?\n/);
    const totalOriginalLines = lines.length;

    const isCaseSensitive = caseSensitiveCheckbox ? caseSensitiveCheckbox.checked : false;
    const isTrimWhitespace = trimWhitespaceCheckbox ? trimWhitespaceCheckbox.checked : false;
    const sortOrder = sortOrderSelect ? sortOrderSelect.value : 'original';

    const seen = new Set();
    const uniqueLines = [];

    lines.forEach(line => {
        let processedLine = line;
        if (isTrimWhitespace) {
            processedLine = processedLine.trim();
        }

        let key = isCaseSensitive ? processedLine : processedLine.toLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            uniqueLines.push(processedLine);
        }
    });

    // Sorting
    if (sortOrder === 'a-z') {
        uniqueLines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: isCaseSensitive ? 'variant' : 'base' }));
    } else if (sortOrder === 'z-a') {
        uniqueLines.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: isCaseSensitive ? 'variant' : 'base' }));
    }

    const duplicatesRemovedCount = totalOriginalLines - uniqueLines.length;

    // Update Notification
    if (notificationBadge && removedCountSpan) {
        removedCountSpan.textContent = duplicatesRemovedCount.toString();
        notificationBadge.classList.remove('hidden');
    }

    return {
        uniqueText: uniqueLines.join('\n'),
        removedCount: duplicatesRemovedCount,
        uniqueLines: uniqueLines
    };
}

function applyRemoveDuplicates() {
    const inputArea = document.getElementById('rd-input-text');
    const result = processDuplicateLines();
    if (inputArea && result) {
        inputArea.value = result.uniqueText;
        showToast(`Cleaned! ${result.removedCount} duplicate lines removed.`, 'success');
    }
}

function clearRemoveDuplicatesText() {
    const inputArea = document.getElementById('rd-input-text');
    const notificationBadge = document.getElementById('rd-notification-badge');

    if (inputArea) {
        inputArea.value = '';
        if (notificationBadge) notificationBadge.classList.add('hidden');
        showToast('Text cleared', 'info');
    }
}

function copyCleanedDuplicatesText() {
    const inputArea = document.getElementById('rd-input-text');
    if (!inputArea || !inputArea.value) {
        showToast('No text to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(inputArea.value).then(() => {
        showToast('Cleaned list copied to clipboard!', 'success');
    }).catch(() => {
        inputArea.select();
        document.execCommand('copy');
        showToast('Cleaned list copied to clipboard!', 'success');
    });
}

function downloadCleanedDuplicatesTxt() {
    const inputArea = document.getElementById('rd-input-text');
    if (!inputArea || !inputArea.value) {
        showToast('No text to download', 'info');
        return;
    }

    const blob = new Blob([inputArea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded cleaned_list.txt!', 'success');
}
