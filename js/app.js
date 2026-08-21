// Kittutools - Main Application Logic (js/app.js)

document.addEventListener('DOMContentLoaded', () => {
    initSearchAndFiltering();
    initCategoryTabs();
    initNotifications();
});

let currentCategory = 'all';
let currentSearchQuery = '';

/**
 * Initializes global search listeners and real-time filtering
 */
function initSearchAndFiltering() {
    const globalSearchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    function handleSearchInput(e) {
        currentSearchQuery = e.target.value.trim().toLowerCase();

        // Sync both desktop and mobile search inputs
        if (globalSearchInput && e.target !== globalSearchInput) {
            globalSearchInput.value = e.target.value;
        }
        if (mobileSearchInput && e.target !== mobileSearchInput) {
            mobileSearchInput.value = e.target.value;
        }

        // Toggle clear search button visibility
        if (clearSearchBtn) {
            if (currentSearchQuery.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
        }

        filterTools();
    }

    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', handleSearchInput);
    }
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearchInput);
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            resetSearch();
        });
    }
}

/**
 * Initializes category tab navigation button listeners
 */
function initCategoryTabs() {
    const tabButtons = document.querySelectorAll('.category-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-red-600', 'text-white');
                btn.classList.add('bg-neutral-900', 'text-neutral-400');
            });

            button.classList.add('active', 'bg-red-600', 'text-white');
            button.classList.remove('bg-neutral-900', 'text-neutral-400');

            currentCategory = button.getAttribute('data-category') || 'all';
            filterTools();
        });
    });
}

/**
 * Filters tool cards and sections based on search query and category
 */
function filterTools() {
    const cards = document.querySelectorAll('.tool-card');
    const sections = document.querySelectorAll('.tool-section');
    const noResultsEl = document.getElementById('no-results');
    const visibleCountEl = document.getElementById('visible-count');

    let visibleCardsCount = 0;

    // Track visible cards per section
    const sectionVisibleMap = {
        pdf: 0,
        image: 0,
        text: 0,
        utility: 0
    };

    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const searchTerms = (card.getAttribute('data-name') || '').toLowerCase();
        const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const cardDesc = card.querySelector('p')?.textContent.toLowerCase() || '';

        const matchesCategory = (currentCategory === 'all' || currentCategory === cardCategory);
        const matchesSearch = currentSearchQuery === '' ||
            searchTerms.includes(currentSearchQuery) ||
            cardTitle.includes(currentSearchQuery) ||
            cardDesc.includes(currentSearchQuery);

        if (matchesCategory && matchesSearch) {
            card.classList.remove('hidden');
            visibleCardsCount++;
            if (sectionVisibleMap[cardCategory] !== undefined) {
                sectionVisibleMap[cardCategory]++;
            }
        } else {
            card.classList.add('hidden');
        }
    });

    // Toggle section containers visibility based on visible child cards
    sections.forEach(section => {
        const secCat = section.getAttribute('data-section');
        if (currentCategory !== 'all' && currentCategory !== secCat) {
            section.classList.add('hidden');
        } else if (sectionVisibleMap[secCat] === 0) {
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
        }
    });

    // Update count display
    if (visibleCountEl) {
        visibleCountEl.textContent = visibleCardsCount.toString();
    }

    // Toggle No Results display
    if (noResultsEl) {
        if (visibleCardsCount === 0) {
            noResultsEl.classList.remove('hidden');
        } else {
            noResultsEl.classList.add('hidden');
        }
    }
}

/**
 * Resets search query inputs and filters
 */
function resetSearch() {
    const globalSearchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (globalSearchInput) globalSearchInput.value = '';
    if (mobileSearchInput) mobileSearchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.classList.add('hidden');

    currentSearchQuery = '';
    filterTools();
}

/**
 * Generic notification/toast handler
 */
function initNotifications() {
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 bg-neutral-900 ${
        type === 'success'
            ? 'border-red-500/50 text-white'
            : 'border-neutral-800 text-neutral-300'
    }`;

    const icon = type === 'success' ? 'check-circle-2' : 'info';
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 ${type === 'success' ? 'text-red-500' : 'text-neutral-400'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    if (window.lucide) {
        lucide.createIcons();
    }

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto dismiss after 3s
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Trigger handler for non-modal tools preview
 */
function triggerUpcomingTool(toolName) {
    showToast(`${toolName} launcher initialized in browser!`, 'success');
}

/**
 * Modal helper functions
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }
}

/**
 * Handles contact form submit in contact modal
 */
function handleContactSubmit(event) {
    event.preventDefault();
    closeModal('contact-modal');
    showToast('Thank you! Your message has been received.', 'success');
    if (event.target) {
        event.target.reset();
    }
}
