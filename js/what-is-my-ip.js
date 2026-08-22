// Kittutools - Advanced "What is My IP" & Network Tool (js/what-is-my-ip.js)

let currentFetchedIp = '';

function openWhatIsMyIpModal() {
    openModal('what-is-my-ip-modal');
    fetchIpDetails();
}

function closeWhatIsMyIpModal() {
    closeModal('what-is-my-ip-modal');
}

async function fetchIpDetails() {
    const ipDisplay = document.getElementById('ip-address-display');
    const ispDisplay = document.getElementById('ip-isp-display');
    const locationDisplay = document.getElementById('ip-location-display');
    const userAgentDisplay = document.getElementById('ip-useragent-display');
    const statusText = document.getElementById('ip-status-text');

    if (userAgentDisplay) {
        userAgentDisplay.textContent = navigator.userAgent;
    }

    if (statusText) statusText.textContent = 'Fetching IP & Network details...';

    try {
        // Primary attempt: ipapi.co for detailed IP info
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            currentFetchedIp = data.ip || 'Unavailable';
            if (ipDisplay) ipDisplay.textContent = currentFetchedIp;
            if (ispDisplay) ispDisplay.textContent = data.org || data.asn || 'Client Network';
            if (locationDisplay) locationDisplay.textContent = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Local / Private';
            if (statusText) statusText.textContent = 'IP details updated live!';
            return;
        }
    } catch (err) {
        console.warn('ipapi.co fetch failed, trying fallback ipify:', err);
    }

    try {
        // Fallback attempt: ipify.org
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            currentFetchedIp = data.ip || 'Unavailable';
            if (ipDisplay) ipDisplay.textContent = currentFetchedIp;
            if (ispDisplay) ispDisplay.textContent = 'Standard Web Connection';
            if (locationDisplay) locationDisplay.textContent = 'Client Browser Location';
            if (statusText) statusText.textContent = 'IP details loaded via ipify fallback';
            return;
        }
    } catch (err) {
        console.warn('ipify fetch failed:', err);
    }

    // Default fallback if completely offline or blocked
    currentFetchedIp = '127.0.0.1 (Local)';
    if (ipDisplay) ipDisplay.textContent = currentFetchedIp;
    if (ispDisplay) ispDisplay.textContent = 'Local Browser Session';
    if (locationDisplay) locationDisplay.textContent = 'Client Device';
    if (statusText) statusText.textContent = 'Operating in Client-Side Offline Mode';
}

function copyIpAddress() {
    const ipDisplay = document.getElementById('ip-address-display');
    const ipToCopy = (ipDisplay && ipDisplay.textContent) ? ipDisplay.textContent.trim() : currentFetchedIp;

    if (!ipToCopy || ipToCopy === 'Fetching...') {
        showToast('IP address not loaded yet', 'info');
        return;
    }

    navigator.clipboard.writeText(ipToCopy).then(() => {
        showToast(`IP Address (${ipToCopy}) copied to clipboard!`, 'success');
    }).catch(() => {
        showToast(`Copied IP: ${ipToCopy}`, 'success');
    });
}
