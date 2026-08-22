// Kittutools - Ultimate Word & Character Counter (js/word-counter.js)

function openWordCounterModal() {
    openModal('word-counter-modal');
    updateWordCounterStats();
}

function closeWordCounterModal() {
    closeModal('word-counter-modal');
}

function updateWordCounterStats() {
    const textInput = document.getElementById('wc-input-text');
    if (!textInput) return;

    const text = textInput.value;

    // Characters with spaces
    const charsWithSpaces = text.length;

    // Characters without spaces
    const charsWithoutSpaces = text.replace(/\s/g, '').length;

    // Words count (handling whitespace, punctuation, newlines)
    const trimmedText = text.trim();
    const words = trimmedText ? trimmedText.split(/\s+/).filter(w => w.length > 0) : [];
    const totalWords = words.length;

    // Sentences count (splitting by ., !, ? or newline if sentence ends)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalSentences = sentences.length;

    // Paragraphs count (splitting by non-empty lines)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const totalParagraphs = paragraphs.length;

    // Reading time: avg 200 words per minute
    const readingTimeMinutes = Math.ceil(totalWords / 200);
    const readingTimeStr = totalWords === 0 ? '0 sec' : (readingTimeMinutes < 1 ? '< 1 min' : `${readingTimeMinutes} min`);

    // Speaking time: avg 130 words per minute
    const speakingTimeMinutes = Math.ceil(totalWords / 130);
    const speakingTimeStr = totalWords === 0 ? '0 sec' : (speakingTimeMinutes < 1 ? '< 1 min' : `${speakingTimeMinutes} min`);

    // Update DOM elements
    const wordCountEl = document.getElementById('wc-words');
    const charCountEl = document.getElementById('wc-chars');
    const charNoSpaceCountEl = document.getElementById('wc-chars-nospace');
    const sentencesCountEl = document.getElementById('wc-sentences');
    const paragraphsCountEl = document.getElementById('wc-paragraphs');
    const readTimeEl = document.getElementById('wc-reading-time');
    const speakTimeEl = document.getElementById('wc-speaking-time');

    if (wordCountEl) wordCountEl.textContent = totalWords.toLocaleString();
    if (charCountEl) charCountEl.textContent = charsWithSpaces.toLocaleString();
    if (charNoSpaceCountEl) charNoSpaceCountEl.textContent = charsWithoutSpaces.toLocaleString();
    if (sentencesCountEl) sentencesCountEl.textContent = totalSentences.toLocaleString();
    if (paragraphsCountEl) paragraphsCountEl.textContent = totalParagraphs.toLocaleString();
    if (readTimeEl) readTimeEl.textContent = readingTimeStr;
    if (speakTimeEl) speakTimeEl.textContent = speakingTimeStr;
}

function clearWordCounterText() {
    const textInput = document.getElementById('wc-input-text');
    if (textInput) {
        textInput.value = '';
        updateWordCounterStats();
        showToast('Text cleared', 'info');
    }
}

function copyWordCounterText() {
    const textInput = document.getElementById('wc-input-text');
    if (!textInput || !textInput.value) {
        showToast('No text to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(textInput.value).then(() => {
        showToast('Text copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        textInput.select();
        document.execCommand('copy');
        showToast('Text copied to clipboard!', 'success');
    });
}
