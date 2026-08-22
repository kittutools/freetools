// Kittutools - Advanced MD5 & SHA Hash Generator (js/hash-generator.js)

function openHashGeneratorModal() {
    openModal('hash-generator-modal');
    generateHashes();
}

function closeHashGeneratorModal() {
    closeModal('hash-generator-modal');
}

function generateHashes() {
    const inputText = document.getElementById('hash-input-text').value;

    const md5Field = document.getElementById('hash-out-md5');
    const sha1Field = document.getElementById('hash-out-sha1');
    const sha256Field = document.getElementById('hash-out-sha256');
    const sha512Field = document.getElementById('hash-out-sha512');

    if (window.CryptoJS) {
        md5Field.value = CryptoJS.MD5(inputText).toString();
        sha1Field.value = CryptoJS.SHA1(inputText).toString();
        sha256Field.value = CryptoJS.SHA256(inputText).toString();
        sha512Field.value = CryptoJS.SHA512(inputText).toString();
    } else {
        md5Field.value = "CryptoJS library missing";
        sha1Field.value = "CryptoJS library missing";
        sha256Field.value = "CryptoJS library missing";
        sha512Field.value = "CryptoJS library missing";
    }
}

function copyHash(fieldId, algorithmName) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value) return;

    navigator.clipboard.writeText(field.value).then(() => {
        if (window.showToast) {
            showToast(`${algorithmName} hash copied!`, 'success');
        }
    });
}
