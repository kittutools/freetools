// Kittutools - Professional XML Sitemap Generator (js/sitemap-generator.js)

function openSitemapGeneratorModal() {
    openModal('sitemap-generator-modal');
    generateXmlSitemap();
}

function closeSitemapGeneratorModal() {
    closeModal('sitemap-generator-modal');
}

function generateXmlSitemap() {
    const urlInput = document.getElementById('sitemap-url-input');
    const changeFreqSelect = document.getElementById('sitemap-changefreq-select');
    const prioritySelect = document.getElementById('sitemap-priority-select');
    const lastModCheck = document.getElementById('sitemap-lastmod-check');
    const outputArea = document.getElementById('sitemap-xml-output');

    if (!urlInput || !outputArea) return;

    let url = urlInput.value.trim() || 'https://example.com';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const changefreq = changeFreqSelect ? changeFreqSelect.value : 'weekly';
    const priority = prioritySelect ? prioritySelect.value : '0.8';

    let lastmodTag = '';
    if (lastModCheck && lastModCheck.checked) {
        const today = new Date().toISOString().split('T')[0];
        lastmodTag = `\n    <lastmod>${today}</lastmod>`;
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
</urlset>`;

    outputArea.value = xmlContent;
}

function copyXmlSitemap() {
    const outputArea = document.getElementById('sitemap-xml-output');
    if (!outputArea || !outputArea.value) {
        showToast('No XML sitemap content to copy', 'info');
        return;
    }

    navigator.clipboard.writeText(outputArea.value).then(() => {
        showToast('XML Sitemap copied to clipboard!', 'success');
    }).catch(() => {
        outputArea.select();
        document.execCommand('copy');
        showToast('XML Sitemap copied to clipboard!', 'success');
    });
}

function downloadXmlSitemap() {
    const outputArea = document.getElementById('sitemap-xml-output');
    if (!outputArea || !outputArea.value) {
        showToast('No XML sitemap to download', 'info');
        return;
    }

    const blob = new Blob([outputArea.value], { type: 'application/xml' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    showToast('Downloaded sitemap.xml successfully!', 'success');
}
