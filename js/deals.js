// Kittutools - Live Loot Deals Application Logic (js/deals.js)

let allDealsData = [];
let currentDealCategory = 'all';
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initLootDeals();
});

/**
 * Fetches deals from deals.json and initializes rendering & timers
 */
async function initLootDeals() {
    try {
        const response = await fetch('deals.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allDealsData = await response.json();
    } catch (error) {
        console.warn('Could not load deals.json via fetch, using default fallback data:', error);
        allDealsData = getDefaultDealsFallback();
    }

    // Attach category filter listeners
    initDealCategoryFilters();

    // Initial render
    renderDeals();

    // Start live ticking countdown timers
    startCountdownTimer();
}

/**
 * Initializes filter tab buttons ("All", "Groceries", "Electronics")
 */
function initDealCategoryFilters() {
    const filterButtons = document.querySelectorAll('.deal-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('bg-red-600', 'text-white', 'shadow-[0_0_15px_rgba(239,68,68,0.5)]');
                b.classList.add('bg-neutral-900/80', 'text-neutral-400', 'hover:text-white', 'border-neutral-800');
            });

            btn.classList.add('bg-red-600', 'text-white', 'shadow-[0_0_15px_rgba(239,68,68,0.5)]');
            btn.classList.remove('bg-neutral-900/80', 'text-neutral-400', 'border-neutral-800');

            currentDealCategory = btn.getAttribute('data-deal-category') || 'all';
            renderDeals();
        });
    });
}

/**
 * Renders deal cards based on active category filter
 */
function renderDeals() {
    const container = document.getElementById('loot-deals-grid');
    if (!container) return;

    const filteredDeals = allDealsData.filter(deal => {
        if (currentDealCategory === 'all') return true;
        return deal.category.toLowerCase() === currentDealCategory.toLowerCase();
    });

    if (filteredDeals.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl">
                <p class="text-neutral-400 text-sm font-bold">No loot deals found in this category right now.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredDeals.map(deal => createDealCardHtml(deal)).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Generates HTML string for an individual deal card
 */
function createDealCardHtml(deal) {
    const storeBadgeClass = getStoreBadgeClass(deal.store);

    return `
        <div class="deal-card group relative bg-neutral-950/90 border border-neutral-800/90 hover:border-red-500/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(239,68,68,0.25)] hover:-translate-y-1" data-category="${deal.category.toLowerCase()}">
            <div>
                <!-- Top Badges Row -->
                <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="${storeBadgeClass}">${deal.store}</span>
                    <span class="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg tracking-tight shadow-[0_0_12px_rgba(239,68,68,0.5)] uppercase">${deal.discount}</span>
                </div>

                <!-- Product Image Container -->
                <div class="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden mb-4 bg-neutral-900 border border-neutral-800/80 group-hover:border-red-500/40 transition-colors flex items-center justify-center p-2">
                    <img src="${deal.image}" alt="${deal.title}" class="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80';">

                    <!-- Floating Countdown Badge on Image -->
                    <div class="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md border border-red-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-red-500 animate-pulse"></i>
                        <span class="deal-timer font-mono text-[11px] font-extrabold text-red-400 tracking-wider" data-seconds="${deal.expiresInSeconds || 14400}">00:00:00</span>
                    </div>
                </div>

                <!-- Deal Heading -->
                <h3 class="font-black text-white text-base sm:text-lg leading-snug line-clamp-2 mb-2 group-hover:text-red-400 transition-colors tracking-tight">
                    ${deal.title}
                </h3>
            </div>

            <!-- Price & Call to Action Footer -->
            <div class="pt-3 border-t border-neutral-900 mt-2 space-y-3">
                <div class="flex items-baseline justify-between">
                    <div>
                        <span class="text-xs text-neutral-400 font-bold uppercase tracking-wider block">Deal Price</span>
                        <span class="text-emerald-400 font-black text-xl sm:text-2xl tracking-tight">${deal.dealPrice}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-neutral-500 font-bold block">M.R.P.</span>
                        <span class="text-neutral-400 line-through text-xs sm:text-sm font-extrabold">${deal.originalPrice}</span>
                    </div>
                </div>

                <!-- Bold Red GRAB DEAL NOW 3D Elevation Button -->
                <a href="${deal.link}" target="_blank" rel="noopener noreferrer" class="grab-deal-btn w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(239,68,68,0.6)] active:translate-y-0 active:shadow-none transition-all duration-200 flex items-center justify-center gap-2 group/btn">
                    <span>GRAB DEAL NOW</span>
                    <i data-lucide="external-link" class="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"></i>
                </a>
            </div>
        </div>
    `;
}

/**
 * Returns store badge CSS styling classes for Amazon, Flipkart, Blinkit, Zepto
 */
function getStoreBadgeClass(storeName) {
    const s = (storeName || '').toLowerCase();
    if (s.includes('amazon')) {
        return 'bg-amber-500 text-black font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider shadow-sm';
    } else if (s.includes('flipkart')) {
        return 'bg-blue-600 text-yellow-300 font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider shadow-sm';
    } else if (s.includes('blinkit')) {
        return 'bg-yellow-400 text-emerald-950 font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider shadow-sm';
    } else if (s.includes('zepto')) {
        return 'bg-purple-600 text-white font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider shadow-sm';
    }
    return 'bg-neutral-800 text-white font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider';
}

/**
 * Continuously ticking countdown timer logic
 */
function startCountdownTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    function updateTimers() {
        const timerElements = document.querySelectorAll('.deal-timer');
        timerElements.forEach(el => {
            let secondsLeft = parseInt(el.getAttribute('data-seconds') || '0', 10);
            if (secondsLeft > 0) {
                secondsLeft--;
                el.setAttribute('data-seconds', secondsLeft.toString());
            } else {
                secondsLeft = 14400; // Reset loop
                el.setAttribute('data-seconds', secondsLeft.toString());
            }

            const hrs = Math.floor(secondsLeft / 3600);
            const mins = Math.floor((secondsLeft % 3600) / 60);
            const secs = secondsLeft % 60;

            const format = (n) => n.toString().padStart(2, '0');
            el.textContent = `${format(hrs)}:${format(mins)}:${format(secs)}`;
        });
    }

    updateTimers();
    countdownInterval = setInterval(updateTimers, 1000);
}

/**
 * Fallback deals data if fetch fails or running directly off local file system
 */
function getDefaultDealsFallback() {
    return [
        {
            id: 'deal-1',
            title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
            category: 'Electronics',
            store: 'Amazon',
            originalPrice: '₹29,990',
            dealPrice: '₹19,990',
            discount: '33% OFF',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
            link: 'https://amazon.in',
            expiresInSeconds: 14400
        },
        {
            id: 'deal-2',
            title: 'Apple MacBook Air M2 Chip (8GB / 256GB SSD)',
            category: 'Electronics',
            store: 'Flipkart',
            originalPrice: '₹1,14,900',
            dealPrice: '₹89,900',
            discount: '21% OFF',
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
            link: 'https://flipkart.com',
            expiresInSeconds: 21600
        },
        {
            id: 'deal-3',
            title: 'Fortune Sunlite Sunflower Cooking Oil 5L Canister',
            category: 'Groceries',
            store: 'Blinkit',
            originalPrice: '₹1,050',
            dealPrice: '₹649',
            discount: '38% OFF',
            image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
            link: 'https://blinkit.com',
            expiresInSeconds: 7200
        },
        {
            id: 'deal-4',
            title: 'Cadbury Celebrations Premium Assorted Chocolates 182g',
            category: 'Groceries',
            store: 'Zepto',
            originalPrice: '₹350',
            dealPrice: '₹199',
            discount: '43% OFF',
            image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=500&auto=format&fit=crop&q=80',
            link: 'https://zepto.com',
            expiresInSeconds: 10800
        },
        {
            id: 'deal-5',
            title: 'Samsung 55-Inch Crystal 4K Vivid Ultra HD Smart TV',
            category: 'Electronics',
            store: 'Amazon',
            originalPrice: '₹64,900',
            dealPrice: '₹41,990',
            discount: '35% OFF',
            image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80',
            link: 'https://amazon.in',
            expiresInSeconds: 18000
        },
        {
            id: 'deal-6',
            title: 'Amul Pure Cow Ghee 1L Tin Pack',
            category: 'Groceries',
            store: 'Blinkit',
            originalPrice: '₹675',
            dealPrice: '₹540',
            discount: '20% OFF',
            image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80',
            link: 'https://blinkit.com',
            expiresInSeconds: 12600
        }
    ];
}
