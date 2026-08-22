// Kittutools - Complete Robots.txt Generator (js/robots-generator.js)

function openRobotsGeneratorModal() {
    openModal('robots-generator-modal');
    generateRobotsTxt();
}

function closeRobotsGeneratorModal() {
    closeModal('robots-generator-modal');
}

function generateRobotsTxt() {
    const userAgentSelect = document.getElementById('robots-user-agent');
    const accessSelect = document.getElementById('robots-access-rule');
    const disallowPathInput = document.getElementById('robots-disallow-path');
    const sitemapUrlInput = document.getElementById('robots-sitemap-url');
    const outputArea = document.getElementById('robots-txt-output');

    if (!outputArea) return;

    const userAgent = userAgentSelect ? userAgentSelect.value : '*';
    const accessRule = accessSelect ? accessSelect.value : 'disallow';
    const disallowPath = disallowPathInput ? disallowPathInput.value.trim() : '/admin/';
    const sitemapUrl = sitemapUrlInput ? sitemapUrlInput.value.trim() : '';

    let content = `User-agent: ${userAgent}\n`;

    if (accessRule === 'disallow') {
        if (disallowPath) {
            const paths = disallowPath.split(',').map(p => p.trim()).filter(p => p.length > 0);
            paths.forEach(p => {
                const cleanPath = p.startsWith('/') ? p : '/' + p;
                content += `Disallow: ${cleanPath}\n`;
            });
        } else {
            content += `Disallow: /\n`;
        }
    } else {
        content += `Allow: /\n`;
    }

    if (sitemapUrl) {
        let cleanSitemap = sitemapUrl;
        if (!cleanSitemap.startsWith('http://') && !cleanSitemap.startsWith('https://')) {
            cleanSitemap = 'https://' + cleanSitemap;
        }
        content += `\nSitemap: ${cleanSitemap}\n`;
    }

    outputArea.value = content.trim();
}

function downloadRobotsTxt() {
    const outputArea = document.getElementById('robots-txt-output');
    if (!outputArea || !outputArea.value) {
        showToast('No robots.txt content to download', 'info');
        return;
    }

    const blob = new Blob([outputArea.value], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'robots.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    showToast('Downloaded robots.txt successfully!', 'success');
}
