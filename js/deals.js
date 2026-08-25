// Kittutools - Live Loot Deals Carousel & Automated Status Logic (js/deals.js)

(function () {
    let rawDeals = [];
    let filteredDeals = [];
    let activeOverlayStates = {}; // key: dealId -> { type: 'SOLD OUT' | 'DEAL ENDED', expiresAt: timestamp }
    let currentScrollIndex = 0;
    let autoplayInterval = null;
    let isPaused = false;
    let cardTimersMap = new Map(); // map card element to countdown timer interval

    document.addEventListener('DOMContentLoaded', () => {
        initDealsSection();
    });

    /**
     * Fetch deals data from deals.json and initialize carousel & automated simulation
     */
    async function initDealsSection() {
        const carouselTrack = document.getElementById('loot-deals-track');
        if (!carouselTrack) return;

        try {
            const response = await fetch('deals.json');
            if (!response.ok) {
                console.error('Failed to load deals.json:', response.statusText);
                return;
            }
            const data = await response.json();
            rawDeals = data.deals || [];

            // Rule 1: Strictly filter deals featuring a discount of 70% or higher (70% - 95% Off)
            filteredDeals = rawDeals.filter(deal => deal.discount >= 70);

            // Update badge counts
            const dealsBadge = document.getElementById('deals-count-badge');
            if (dealsBadge) {
                dealsBadge.textContent = `${filteredDeals.length}+ Big Offers (70%+ Off)`;
            }

            renderCarouselCards();
            setupCarouselControls();
            startAutoplay();
            startStatusSimulationTimer();

        } catch (err) {
            console.error('Error initializing Live Loot Deals:', err);
        }
    }

    /**
     * Get Store styling configuration
     */
    function getStoreBadgeConfig(storeName) {
        switch (storeName ? storeName.toLowerCase() : '') {
            case 'amazon':
                return {
                    bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                    icon: 'shopping-bag',
                    name: 'Amazon'
                };
            case 'flipkart':
                return {
                    bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                    icon: 'shopping-cart',
                    name: 'Flipkart'
                };
            case 'blinkit':
                return {
                    bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
                    icon: 'zap',
                    name: 'Blinkit'
                };
            case 'bigbasket':
                return {
                    bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                    icon: 'box',
                    name: 'BigBasket'
                };
            default:
                return {
                    bg: 'bg-red-500/20 text-red-400 border-red-500/40',
                    icon: 'tag',
                    name: storeName || 'Loot Store'
                };
        }
    }

    /**
     * Efficiently render carousel cards for memory optimization
     */
    function renderCarouselCards() {
        const carouselTrack = document.getElementById('loot-deals-track');
        if (!carouselTrack) return;

        // Clear existing contents & timers
        carouselTrack.innerHTML = '';
        cardTimersMap.forEach(interval => clearInterval(interval));
        cardTimersMap.clear();

        if (filteredDeals.length === 0) {
            carouselTrack.innerHTML = `
                <div class="w-full text-center py-8 text-neutral-400 text-sm">
                    No active 70%+ loot deals available right now. Check back soon!
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredDeals.forEach((deal, index) => {
            const storeConfig = getStoreBadgeConfig(deal.store);
            const overlayState = activeOverlayStates[deal.id];

            const card = document.createElement('div');
            card.className = 'deal-card-item flex-shrink-0 w-[280px] sm:w-[320px] neon-card rounded-2xl p-4 sm:p-5 relative group transition-all duration-300 flex flex-col justify-between select-none';
            card.setAttribute('data-deal-id', deal.id);
            card.setAttribute('data-index', index);

            // Clean product URL
            const cleanUrl = typeof deal.url === 'string' ? deal.url.trim() : '#';

            // Calculate countdown expiration
            let targetEndTime = Date.now() + (deal.expiresInSeconds * 1000);

            card.innerHTML = `
                <!-- Overlay Popup Container for Sold Out / Ended simulation -->
                <div class="deal-overlay-container ${overlayState ? 'flex' : 'hidden'} absolute inset-0 z-20 bg-black/85 backdrop-blur-sm rounded-2xl flex-col items-center justify-center p-4 text-center border-2 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all">
                    <div class="animate-bounce mb-2 text-red-500">
                        <i data-lucide="${overlayState?.type === 'SOLD OUT' ? 'flame' : 'clock'}" class="w-10 h-10"></i>
                    </div>
                    <div class="text-xl sm:text-2xl font-black font-copperplate tracking-wider text-red-500 uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] mb-1">
                        ${overlayState?.type === 'SOLD OUT' ? '🔥 SOLD OUT' : '⏰ DEAL ENDED'}
                    </div>
                    <p class="text-[11px] text-neutral-300 font-medium mb-3">Refreshes in <span class="overlay-countdown text-red-400 font-bold font-mono">60s</span></p>
                    <div class="px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-[10px] text-neutral-300">
                        Auto-rotating offer queue...
                    </div>
                </div>

                <!-- Card Main Content -->
                <div>
                    <!-- Store Badge & Discount Badge Header -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide ${storeConfig.bg}">
                            <i data-lucide="${storeConfig.icon}" class="w-3.5 h-3.5"></i>
                            <span>${storeConfig.name}</span>
                        </span>

                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.6)] font-copperplate">
                            <span>${deal.discount}% OFF</span>
                        </span>
                    </div>

                    <!-- Deal Title & Category -->
                    <h4 class="font-bold text-white text-base sm:text-lg leading-snug mb-1 line-clamp-2 group-hover:text-red-400 transition-colors font-sans">
                        ${deal.title}
                    </h4>
                    <p class="text-[11px] text-neutral-400 mb-3 font-medium uppercase tracking-wider">${deal.category}</p>

                    <!-- Rating & Reviews -->
                    <div class="flex items-center gap-2 mb-4">
                        <div class="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-amber-400 text-xs font-bold">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                            <span>${deal.rating}</span>
                        </div>
                        <span class="text-xs text-neutral-500">(${deal.reviewsCount.toLocaleString()} reviews)</span>
                    </div>
                </div>

                <!-- Price & Countdown Timer Footer -->
                <div class="pt-3 border-t border-neutral-800/80 space-y-3">
                    <div class="flex items-baseline justify-between">
                        <div>
                            <span class="text-xs text-neutral-500 line-through mr-1.5">₹${deal.originalPrice.toLocaleString('en-IN')}</span>
                            <span class="text-xl sm:text-2xl font-black text-white font-copperplate tracking-tight">₹${deal.discountedPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <span class="text-[10px] font-bold text-green-400 uppercase tracking-wider bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md">Save ₹${(deal.originalPrice - deal.discountedPrice).toLocaleString('en-IN')}</span>
                    </div>

                    <!-- Countdown Timer Bar -->
                    <div class="bg-neutral-950/90 border border-neutral-800 p-2 rounded-xl flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5 text-neutral-400 font-semibold text-[11px]">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-red-500 animate-pulse"></i>
                            <span>Ends In:</span>
                        </div>
                        <span class="countdown-timer-display font-mono font-bold text-red-500 tracking-wider">--:--:--</span>
                    </div>

                    <!-- Grab Deal CTA Button -->
                    <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="grab-deal-btn relative z-50 pointer-events-auto cursor-pointer neon-btn w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-wider font-copperplate">
                        <span>Grab Deal Now</span>
                        <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                </div>
            `;

            const grabBtn = card.querySelector('.grab-deal-btn');
            if (grabBtn) {
                grabBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }

            fragment.appendChild(card);

            // Start countdown timer for this card
            setupCardCountdown(card, targetEndTime);
        });

        carouselTrack.appendChild(fragment);

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Start live countdown timer per card
     */
    function setupCardCountdown(cardEl, targetTime) {
        const timerDisplay = cardEl.querySelector('.countdown-timer-display');
        if (!timerDisplay) return;

        function updateTimer() {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((targetTime - now) / 1000));

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            timerDisplay.textContent = formatted;
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        cardTimersMap.set(cardEl, interval);
    }

    /**
     * Carousel scrolling and navigation controls
     */
    function setupCarouselControls() {
        const track = document.getElementById('loot-deals-track');
        const prevBtn = document.getElementById('loot-carousel-prev');
        const nextBtn = document.getElementById('loot-carousel-next');

        if (!track) return;

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                scrollCarousel('prev');
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                scrollCarousel('next');
            });
        }

        // Pause on hover
        track.addEventListener('mouseenter', () => { isPaused = true; });
        track.addEventListener('mouseleave', () => { isPaused = false; });
        track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
        track.addEventListener('touchend', () => { isPaused = false; }, { passive: true });
    }

    /**
     * Scroll carousel horizontally
     */
    function scrollCarousel(direction) {
        const track = document.getElementById('loot-deals-track');
        if (!track) return;

        const cardWidth = 300; // Average card width + gap
        const scrollAmount = direction === 'next' ? cardWidth * 2 : -cardWidth * 2;

        track.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }

    /**
     * Automated Carousel Auto-Play Loop
     */
    function startAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);

        autoplayInterval = setInterval(() => {
            const track = document.getElementById('loot-deals-track');
            if (!track || isPaused) return;

            // Check if reached end of scroll, loop back to start smoothly
            if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: 320, behavior: 'smooth' });
            }
        }, 3500);
    }

    /**
     * Rule 2: Automated Live Status Simulation (Sold Out / Ended Logic)
     * Cycle through random deals in carousel every few minutes.
     * Trigger 3D overlay popup showing "🔥 SOLD OUT" or "⏰ DEAL ENDED" banner in bright Neon Red for 1 minute (60s).
     * After 1 minute, automatically refresh/return to regular active state or rotate offer queue.
     */
    function startStatusSimulationTimer() {
        // Run status check cycle every 2 minutes (120,000 ms) or trigger initial simulation after 10 seconds for instant testing
        const SIMULATION_CYCLE = 60000; // Every 60 seconds trigger a deal overlay event

        setInterval(() => {
            if (filteredDeals.length === 0) return;

            // Pick a random deal ID
            const randomIndex = Math.floor(randomRange(0, filteredDeals.length));
            const selectedDeal = filteredDeals[randomIndex];
            if (!selectedDeal) return;

            // Don't trigger if already active overlay
            if (activeOverlayStates[selectedDeal.id]) return;

            const overlayType = Math.random() > 0.5 ? 'SOLD OUT' : 'DEAL ENDED';
            const expiresAt = Date.now() + 60000; // Exactly 1 minute (60s)

            activeOverlayStates[selectedDeal.id] = {
                type: overlayType,
                expiresAt: expiresAt
            };

            // Update card UI overlay
            applyOverlayToCard(selectedDeal.id, overlayType, 60);

            // Set 1 minute timer to remove overlay and refresh offer
            setTimeout(() => {
                delete activeOverlayStates[selectedDeal.id];
                refreshDealCard(selectedDeal.id);
            }, 60000);

        }, SIMULATION_CYCLE);

        // Also trigger initial simulation after 8 seconds so visitors see dynamic realism quickly
        setTimeout(() => {
            if (filteredDeals.length > 0) {
                const firstDeal = filteredDeals[0];
                activeOverlayStates[firstDeal.id] = {
                    type: 'SOLD OUT',
                    expiresAt: Date.now() + 60000
                };
                applyOverlayToCard(firstDeal.id, 'SOLD OUT', 60);
                setTimeout(() => {
                    delete activeOverlayStates[firstDeal.id];
                    refreshDealCard(firstDeal.id);
                }, 60000);
            }
        }, 8000);
    }

    /**
     * Applies the Sold Out / Ended overlay to a specific card element
     */
    function applyOverlayToCard(dealId, type, secondsLeft) {
        const card = document.querySelector(`[data-deal-id="${dealId}"]`);
        if (!card) return;

        const overlayContainer = card.querySelector('.deal-overlay-container');
        if (!overlayContainer) return;

        const iconEl = overlayContainer.querySelector('i');
        const titleEl = overlayContainer.querySelector('.font-copperplate');
        const countdownEl = overlayContainer.querySelector('.overlay-countdown');

        if (titleEl) {
            titleEl.textContent = type === 'SOLD OUT' ? '🔥 SOLD OUT' : '⏰ DEAL ENDED';
        }

        overlayContainer.classList.remove('hidden');
        overlayContainer.classList.add('flex');

        // Start 1 minute countdown on overlay badge
        let remaining = secondsLeft;
        const overlayInterval = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = `${Math.max(0, remaining)}s`;
            }
            if (remaining <= 0) {
                clearInterval(overlayInterval);
            }
        }, 1000);
    }

    /**
     * Refreshes a specific card back to active state or rotates to fresh offer
     */
    function refreshDealCard(dealId) {
        const card = document.querySelector(`[data-deal-id="${dealId}"]`);
        if (!card) return;

        const overlayContainer = card.querySelector('.deal-overlay-container');
        if (overlayContainer) {
            overlayContainer.classList.add('hidden');
            overlayContainer.classList.remove('flex');
        }

        // Pulse highlight card to show it has refreshed back to regular state
        card.classList.add('ring-2', 'ring-green-500', 'scale-[1.02]');
        setTimeout(() => {
            card.classList.remove('ring-2', 'ring-green-500', 'scale-[1.02]');
        }, 1500);
    }

    function randomRange(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    // Expose helpers globally if needed for testing
    window.DealsModule = {
        getFilteredDeals: () => filteredDeals,
        triggerOverlay: (dealId, type) => {
            activeOverlayStates[dealId] = { type, expiresAt: Date.now() + 60000 };
            applyOverlayToCard(dealId, type, 60);
        },
        removeOverlay: (dealId) => {
            delete activeOverlayStates[dealId];
            refreshDealCard(dealId);
        }
    };
})();
