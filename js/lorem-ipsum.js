// Kittutools - Advanced Lorem Ipsum / Dummy Text Generator (js/lorem-ipsum.js)

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "ut",
    "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
    "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor",
    "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat",
    "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in",
    "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
];

function openLoremIpsumModal() {
    openModal('lorem-ipsum-modal');
    generateLoremIpsumText();
}

function closeLoremIpsumModal() {
    closeModal('lorem-ipsum-modal');
}

function generateSentence(wordCount = 8) {
    let words = [];
    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * LOREM_WORDS.length);
        words.push(LOREM_WORDS[randomIndex]);
    }
    let sentence = words.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function generateParagraph(sentenceCount = 5) {
    let sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
        const wordsInSentence = Math.floor(Math.random() * 8) + 6;
        sentences.push(generateSentence(wordsInSentence));
    }
    return sentences.join(' ');
}

function generateLoremIpsumText() {
    const qtyInput = document.getElementById('lorem-quantity');
    const typeSelect = document.getElementById('lorem-type');
    const htmlToggle = document.getElementById('lorem-html-tags');
    const outputArea = document.getElementById('lorem-output');

    if (!qtyInput || !typeSelect || !outputArea) return;

    let qty = parseInt(qtyInput.value) || 3;
    if (qty < 1) qty = 1;
    if (qty > 100) qty = 100;

    const type = typeSelect.value;
    const includeHtml = htmlToggle ? htmlToggle.checked : false;

    let results = [];

    if (type === 'paragraphs') {
        for (let i = 0; i < qty; i++) {
            let p = generateParagraph(5);
            if (includeHtml) {
                p = `<p>${p}</p>`;
            }
            results.push(p);
        }
        outputArea.value = results.join('\n\n');
    } else if (type === 'words') {
        let words = [];
        for (let i = 0; i < qty; i++) {
            const randomIndex = Math.floor(Math.random() * LOREM_WORDS.length);
            words.push(LOREM_WORDS[randomIndex]);
        }
        let text = words.join(' ');
        if (includeHtml) {
            text = `<p>${text}</p>`;
        }
        outputArea.value = text;
    } else if (type === 'sentences') {
        for (let i = 0; i < qty; i++) {
            let s = generateSentence(Math.floor(Math.random() * 8) + 6);
            if (includeHtml) {
                s = `<p>${s}</p>`;
            }
            results.push(s);
        }
        outputArea.value = results.join(' ');
    } else if (type === 'lists') {
        let listItems = [];
        for (let i = 0; i < qty; i++) {
            let item = generateSentence(5).replace('.', '');
            if (includeHtml) {
                listItems.push(`  <li>${item}</li>`);
            } else {
                listItems.push(`• ${item}`);
            }
        }
        if (includeHtml) {
            outputArea.value = `<ul>\n${listItems.join('\n')}\n</ul>`;
        } else {
            outputArea.value = listItems.join('\n');
        }
    }
}

function copyLoremIpsumText() {
    const outputArea = document.getElementById('lorem-output');
    if (!outputArea || !outputArea.value) {
        showToast('No text generated to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(outputArea.value).then(() => {
        showToast('Lorem ipsum copied to clipboard!', 'success');
    }).catch(() => {
        outputArea.select();
        document.execCommand('copy');
        showToast('Lorem ipsum copied to clipboard!', 'success');
    });
}
