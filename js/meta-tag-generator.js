// Kittutools - Professional Meta Tag Generator (High-Traffic SEO Tool) (js/meta-tag-generator.js)

function openMetaTagGeneratorModal() {
    openModal('meta-tag-generator-modal');
    generateMetaTagsCode();
}

function closeMetaTagGeneratorModal() {
    closeModal('meta-tag-generator-modal');
}

function generateMetaTagsCode() {
    const title = (document.getElementById('meta-site-title')?.value || '').trim();
    const description = (document.getElementById('meta-site-description')?.value || '').trim();
    const keywords = (document.getElementById('meta-site-keywords')?.value || '').trim();
    const author = (document.getElementById('meta-site-author')?.value || '').trim();
    const siteUrl = (document.getElementById('meta-site-url')?.value || '').trim();
    const imageUrl = (document.getElementById('meta-site-image')?.value || '').trim();
    const twitterHandle = (document.getElementById('meta-twitter-handle')?.value || '').trim();

    const robotIndex = document.getElementById('meta-robot-index')?.value || 'index';
    const robotFollow = document.getElementById('meta-robot-follow')?.value || 'follow';
    const robotsContent = `${robotIndex}, ${robotFollow}`;

    const incOg = document.getElementById('meta-inc-og')?.checked ?? true;
    const incTwitter = document.getElementById('meta-inc-twitter')?.checked ?? true;

    let codeLines = [];

    codeLines.push(`<!-- Primary Meta Tags -->`);
    codeLines.push(`<title>${escapeHtmlMeta(title || 'My Website Title')}</title>`);
    codeLines.push(`<meta name="title" content="${escapeHtmlMeta(title || 'My Website Title')}">`);
    if (description) {
        codeLines.push(`<meta name="description" content="${escapeHtmlMeta(description)}">`);
    }
    if (keywords) {
        codeLines.push(`<meta name="keywords" content="${escapeHtmlMeta(keywords)}">`);
    }
    if (author) {
        codeLines.push(`<meta name="author" content="${escapeHtmlMeta(author)}">`);
    }
    codeLines.push(`<meta name="robots" content="${robotsContent}">`);
    codeLines.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    codeLines.push(`<meta charset="UTF-8">`);

    if (incOg) {
        codeLines.push(``);
        codeLines.push(`<!-- Open Graph / Facebook / LinkedIn -->`);
        codeLines.push(`<meta property="og:type" content="website">`);
        if (siteUrl) codeLines.push(`<meta property="og:url" content="${escapeHtmlMeta(siteUrl)}">`);
        if (title) codeLines.push(`<meta property="og:title" content="${escapeHtmlMeta(title)}">`);
        if (description) codeLines.push(`<meta property="og:description" content="${escapeHtmlMeta(description)}">`);
        if (imageUrl) codeLines.push(`<meta property="og:image" content="${escapeHtmlMeta(imageUrl)}">`);
    }

    if (incTwitter) {
        codeLines.push(``);
        codeLines.push(`<!-- Twitter Cards -->`);
        codeLines.push(`<meta name="twitter:card" content="summary_large_image">`);
        if (twitterHandle) codeLines.push(`<meta name="twitter:site" content="${escapeHtmlMeta(twitterHandle)}">`);
        if (siteUrl) codeLines.push(`<meta name="twitter:url" content="${escapeHtmlMeta(siteUrl)}">`);
        if (title) codeLines.push(`<meta name="twitter:title" content="${escapeHtmlMeta(title)}">`);
        if (description) codeLines.push(`<meta name="twitter:description" content="${escapeHtmlMeta(description)}">`);
        if (imageUrl) codeLines.push(`<meta name="twitter:image" content="${escapeHtmlMeta(imageUrl)}">`);
    }

    const outputEl = document.getElementById('meta-output-code');
    if (outputEl) {
        outputEl.value = codeLines.join('\n');
    }
}

function escapeHtmlMeta(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function copyMetaCode() {
    const outputEl = document.getElementById('meta-output-code');
    if (!outputEl || !outputEl.value) {
        showToast('No code generated to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(outputEl.value).then(() => {
        showToast('HTML Meta Tag code copied to clipboard!', 'success');
    }).catch(() => {
        outputEl.select();
        document.execCommand('copy');
        showToast('HTML Meta Tag code copied to clipboard!', 'success');
    });
}
