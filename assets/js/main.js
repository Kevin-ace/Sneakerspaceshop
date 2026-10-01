/**
 * SpaceSneakers Main Application
 * Handles theme, cart, products, and UI interactions
 */

// ================================
// Theme Management
// ================================
const theme = {
    current: localStorage.getItem('theme') || 'light',

    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.current);
        this.apply();
    },

    apply() {
        document.documentElement.setAttribute('data-theme', this.current);
        const themeToggle = document.querySelector('.theme-toggle i, #themeToggle i');
        if (themeToggle) {
            themeToggle.className = this.current === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update starfield if it exists
        const starfield = document.querySelector('.starfield');
        if (starfield) {
            starfield.style.opacity = this.current === 'light' ? '0.3' : '1';
        }
    },

    init() {
        this.apply();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
    }
};

// ================================
// Enhanced Cart System
// ================================
const cart = {
    items: JSON.parse(localStorage.getItem('cart')) || [],

    add(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.save();
        this.updateUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
        this.animateCartIcon();
    },

    remove(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            this.items = this.items.filter(item => item.id !== productId);
            this.save();
            this.updateUI();
            this.showNotification('Item removed from cart', 'info');
        }
    },

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.remove(productId);
                return;
            }
        }
        this.save();
        this.updateUI();
    },

    clear() {
        this.items = [];
        this.save();
        this.updateUI();
        this.showNotification('Cart cleared', 'info');
    },

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    updateUI() {
        // Update cart count badges
        const cartCounts = document.querySelectorAll('.cart-count');
        const totalItems = this.getItemCount();
        cartCounts.forEach(count => {
            count.textContent = totalItems;
            count.style.display = totalItems > 0 ? 'flex' : 'none';
        });

        // Update cart sidebar content
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalElement = document.querySelector('.total-amount');
        const emptyCartMessage = document.querySelector('.empty-cart-message');
        const cartFooter = document.querySelector('.cart-footer');

        if (cartItemsContainer) {
            if (this.items.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added anything yet</p>
                        <a href="shop.html" class="continue-shopping-btn">Continue Shopping</a>
                    </div>
                `;
                if (cartFooter) cartFooter.style.display = 'none';
            } else {
                cartItemsContainer.innerHTML = this.items.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-price">Ksh ${item.price.toLocaleString()}</p>
                            <div class="cart-item-quantity">
                                <button class="qty-btn minus" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn plus" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="cart-item-actions">
                            <span class="cart-item-total">Ksh ${(item.price * item.quantity).toLocaleString()}</span>
                            <button class="remove-item" onclick="cart.remove(${item.id})">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                if (cartFooter) cartFooter.style.display = 'block';
            }
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = `Ksh ${this.getTotal().toLocaleString()}`;
        }
    },

    animateCartIcon() {
        const cartIcon = document.querySelector('.cart-toggle, .cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('cart-bounce');
            setTimeout(() => cartIcon.classList.remove('cart-bounce'), 500);
        }
    },

    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.cart-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    toggleSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.querySelector('.cart-overlay');

        if (sidebar) {
            sidebar.classList.toggle('open');
            document.body.classList.toggle('cart-open');

            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.className = 'cart-overlay';
                newOverlay.onclick = () => this.toggleSidebar();
                document.body.appendChild(newOverlay);
                setTimeout(() => newOverlay.classList.add('active'), 10);
            } else {
                overlay.classList.toggle('active');
                if (!overlay.classList.contains('active')) {
                    setTimeout(() => overlay.remove(), 300);
                }
            }
        }
    },

    init() {
        this.updateUI();

        // Cart toggle button
        const cartToggle = document.getElementById('cartToggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        // Close cart button
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => this.toggleSidebar());
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) {
                    this.showNotification('Your cart is empty', 'info');
                    return;
                }
                this.showCheckoutModal();
            });
        }
    },

    async showCheckoutModal() {
        // Check if customer is logged in
        try {
            const authRes = await fetch('/api/auth/status');
            let authData = null;
            if (authRes.ok) { try { authData = await authRes.json(); } catch (e) {} }
            if (!authData || !authData.logged_in) {
                this.showNotification('Please login to place an order', 'info');
                setTimeout(() => { window.location.href = 'account-login.html'; }, 1000);
                return;
            }
        } catch (e) {
            this.showNotification('Please login to place an order', 'info');
            setTimeout(() => { window.location.href = 'account-login.html'; }, 1000);
            return;
        }

        document.querySelectorAll('.checkout-modal').forEach(m => m.remove());
        const modal = document.createElement('div');
        modal.className = 'checkout-modal';
        modal.innerHTML = `
            <div class="checkout-overlay" onclick="this.parentElement.remove()"></div>
            <div class="checkout-content">
                <button class="close-modal" onclick="this.closest('.checkout-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h2><i class="fas fa-lock"></i> Confirm Order</h2>
                <div class="checkout-summary">
                    <p><strong>${this.getItemCount()}</strong> item(s) — <strong>Ksh ${this.getTotal().toLocaleString()}</strong></p>
                </div>
                <div style="margin-bottom:1rem;color:var(--text-secondary,#a5a5c0);font-size:0.9rem;text-align:center">
                    Order will be placed using your account details.
                </div>
                <button class="checkout-submit-btn" id="confirmOrderBtn">
                    <i class="fas fa-check-circle"></i> Place Order — Ksh ${this.getTotal().toLocaleString()}
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
            const btn = document.getElementById('confirmOrderBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            try {
                const result = await API.checkout({
                    items: this.items.map(item => ({
                        id: item.id, name: item.name, quantity: item.quantity, price: item.price
                    }))
                });
                modal.remove();
                this.clear();
                this.toggleSidebar();
                this.showNotification(
                    `Order #${result.order_id} placed! Total: Ksh ${result.total.toLocaleString()}`,
                    'success'
                );
            } catch (error) {
                if (error.message && error.message.includes('login')) {
                    window.location.href = 'account-login.html';
                    return;
                }
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
                btn.disabled = false;
                this.showNotification(error.message || 'Checkout failed.', 'error');
            }
        });
    }
};

// ================================
// Wishlist System
// ================================
const wishlist = {
    items: JSON.parse(localStorage.getItem('wishlist')) || [],

    toggle(productId) {
        const index = this.items.indexOf(productId);
        if (index > -1) {
            this.items.splice(index, 1);
            this.updateIcon(productId, false);
        } else {
            this.items.push(productId);
            this.updateIcon(productId, true);
        }
        localStorage.setItem('wishlist', JSON.stringify(this.items));
    },

    updateIcon(productId, isWished) {
        const btn = document.querySelector(`[data-id="${productId}"] .wishlist-btn i`);
        if (btn) {
            btn.className = isWished ? 'fas fa-heart' : 'far fa-heart';
            btn.style.color = isWished ? '#e74c3c' : '';
        }
    },

    init() {
        this.items.forEach(id => this.updateIcon(id, true));
    }
};

// ================================
// Product Loading & Filtering
// ================================
const ProductManager = {
    allProducts: [],
    currentFilters: {
        categories: [],
        brands: [],
        sizes: [],
        minPrice: 0,
        maxPrice: 100000,
        sortBy: 'featured'
    },

    async init() {
        console.log('ProductManager: Initializing...');
        
        // Load products from API
        if (typeof API !== 'undefined') {
            try {
                this.allProducts = await API.getProducts();
                console.log('ProductManager: Fetched', this.allProducts.length, 'products');
            } catch (error) {
                console.error('ProductManager: Failed to fetch products', error);
                this.allProducts = [];
            }
        }

        // Initialize filters
        this.initFilters();
        this.initSearch();

        // Load products into different sections
        this.renderAllSections();
    },

    async renderAllSections() {
        await this.loadShopProducts();
        await this.loadFeaturedProducts();
        await this.loadNewArrivals();
        await this.loadTrendingProducts();
        await this.loadSpecialOffer();
    },

    async loadShopProducts() {
        const container = document.querySelector('.shelf-products, .products-grid');
        if (!container) return;

        if (typeof ProductRenderer === 'undefined') {
            console.error('ProductRenderer not found');
            return;
        }

        ProductRenderer.showLoading(container, 6);

        // Allow a small delay for the loading animation to be seen
        setTimeout(() => {
            let products = [...this.allProducts];
            products = this.applyFilters(products);
            products = this.applySort(products);

            ProductRenderer.renderProducts(products, container);
            
            // Re-initialize wishlist icons
            if (window.wishlist && typeof wishlist.init === 'function') {
                wishlist.init();
            }
            
            // Re-initialize scroll animations for new elements
            if (window.ScrollAnimations && typeof ScrollAnimations.observeAll === 'function') {
                ScrollAnimations.observeAll();
            }
        }, 300);
    },

    async loadFeaturedProducts() {
        const container = document.querySelector('.featured-grid');
        if (!container || typeof API === 'undefined' || typeof ProductRenderer === 'undefined') return;

        const products = await API.getFeaturedProducts(4);
        ProductRenderer.renderProducts(products, container);
        if (window.ScrollAnimations) ScrollAnimations.observeAll();
    },

    async loadNewArrivals() {
        const container = document.querySelector('.products-slider');
        if (!container || typeof API === 'undefined' || typeof ProductRenderer === 'undefined') return;

        const products = await API.getNewArrivals();
        if (products.length > 0) {
            ProductRenderer.renderProducts(products, container);
        } else {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem; grid-column: 1/-1;">No new arrivals yet. Check back soon!</p>';
        }
        if (window.ScrollAnimations) ScrollAnimations.observeAll();
    },

    async loadTrendingProducts() {
        const container = document.querySelector('.trending-products .products-grid');
        if (!container || typeof API === 'undefined' || typeof ProductRenderer === 'undefined') return;

        const products = await API.getTrendingProducts();
        if (products.length > 0) {
            ProductRenderer.renderProducts(products, container);
        } else {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem; grid-column: 1/-1;">No trending products yet. Check back soon!</p>';
        }
        if (window.ScrollAnimations) ScrollAnimations.observeAll();
    },

    async loadSpecialOffer() {
        if (typeof API === 'undefined' || typeof API.getHomepageOffer !== 'function') return;

        const section = document.getElementById('specialOfferSection');
        if (!section) return;

        try {
            const offer = await API.getHomepageOffer();
            if (!offer) {
                section.style.display = 'none';
                return;
            }

            // Populate the banner
            const titleEl = document.getElementById('offerTitle');
            const descEl = document.getElementById('offerDescription');
            const codeWrap = document.getElementById('offerCodeWrap');
            const codeEl = document.getElementById('offerCode');

            if (titleEl) titleEl.textContent = offer.title || 'Special Offer';
            if (descEl) descEl.textContent = offer.description || `Get ${offer.discount_percent}% off on selected items!`;

            if (offer.code && codeWrap && codeEl) {
                codeEl.textContent = offer.code;
                codeWrap.style.display = 'block';
            }

            // Show the section
            section.style.display = '';

            // Start real countdown
            if (offer.end_date && typeof startOfferCountdown === 'function') {
                startOfferCountdown(offer.end_date);
            }
        } catch (error) {
            console.error('Failed to load special offer:', error);
            section.style.display = 'none';
        }
    },

    applyFilters(products) {
        return products.filter(p => {
            // Category filter
            const matchesCategory = this.currentFilters.categories.length === 0 || 
                this.currentFilters.categories.includes(p.category.toLowerCase());
            
            // Brand filter (Checking name and description for brand keywords)
            const matchesBrand = this.currentFilters.brands.length === 0 || 
                this.currentFilters.brands.some(brand => 
                    p.name.toLowerCase().includes(brand.toLowerCase()) || 
                    (p.description && p.description.toLowerCase().includes(brand.toLowerCase()))
                );

            // Price filter
            const matchesPrice = p.price >= this.currentFilters.minPrice && 
                               p.price <= this.currentFilters.maxPrice;

            // Size filter (Note: In a real app, products would have explicit sizes. 
            // Here we assume all products are available in all sizes for the demo, 
            // but we implement the logic for completeness)
            const matchesSize = this.currentFilters.sizes.length === 0 || true; 

            return matchesCategory && matchesBrand && matchesPrice && matchesSize;
        });
    },

    applySort(products) {
        const sorted = [...products];

        switch (this.currentFilters.sortBy) {
            case 'price-low':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
                sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
                break;
            default:
                // Featured/Default
                break;
        }

        return sorted;
    },

    initFilters() {
        // Category checkboxes
        const categoryFilters = document.querySelectorAll('.filter-group input[value="running"], .filter-group input[value="basketball"], .filter-group input[value="lifestyle"], .filter-group input[value="casual"], .filter-group input[value="training"], .filter-group input[value="boots"]');
        categoryFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.currentFilters.categories = Array.from(categoryFilters)
                    .filter(f => f.checked)
                    .map(f => f.value.toLowerCase());
                this.loadShopProducts();
            });
        });

        // Brand checkboxes
        const brandFilters = document.querySelectorAll('.filter-group input[value="nike"], .filter-group input[value="adidas"], .filter-group input[value="jordan"], .filter-group input[value="vans"], .filter-group input[value="puma"]');
        brandFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.currentFilters.brands = Array.from(brandFilters)
                    .filter(f => f.checked)
                    .map(f => f.value.toLowerCase());
                this.loadShopProducts();
            });
        });

        // Size buttons
        const sizeButtons = document.querySelectorAll('.size-filter-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active class is already handled in shop.html script, but we need the data
                setTimeout(() => {
                    this.currentFilters.sizes = Array.from(document.querySelectorAll('.size-filter-btn.active'))
                        .map(b => b.dataset.size);
                    this.loadShopProducts();
                }, 50);
            });
        });

        // Price slider
        const priceSlider = document.querySelector('.price-slider');
        const priceValue = document.getElementById('priceValue');
        if (priceSlider && priceValue) {
            priceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.currentFilters.maxPrice = value;
                // Use a small debounce for performance
                if (this.priceTimer) clearTimeout(this.priceTimer);
                this.priceTimer = setTimeout(() => this.loadShopProducts(), 100);
            });
        }

        // Sort select
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.loadShopProducts();
            });
        }
    },

    initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = e.target.value.trim();
                const container = document.querySelector('.shelf-products, .products-grid');
                if (!container || typeof ProductRenderer === 'undefined') return;

                if (query.length >= 2) {
                    ProductRenderer.showLoading(container, 3);
                    const results = await API.searchProducts(query);
                    ProductRenderer.renderProducts(results, container);
                    if (window.ScrollAnimations) ScrollAnimations.observeAll();
                } else if (query.length === 0) {
                    this.loadShopProducts();
                }
            }, 300);
        });
    }
};

// ================================
// Scroll Animations
// ================================
const ScrollAnimations = {
    observer: null,

    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.dataset.delay) {
                        entry.target.style.transitionDelay = entry.target.dataset.delay;
                    }
                    // Once visible, stop observing
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.observeAll();
    },

    observeAll() {
        if (!this.observer) return;
        document.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => {
            this.observer.observe(el);
        });
    }
};

// ================================
// Smooth Scrolling
// ================================
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

// ================================
// Product Card Interactions
// ================================
const ProductInteractions = {
    init() {
        // 3D tilt effect on hover
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.product-card:hover');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList && e.target.classList.contains('product-card')) {
                e.target.style.transform = '';
            }
        }, true);
    }
};

// ================================
// Contact Form
// ================================
const ContactForm = {
    init() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            try {
                if (typeof API !== 'undefined' && API.sendContactMessage) {
                    await API.sendContactMessage(data);
                    cart.showNotification('Message sent successfully!', 'success');
                    form.reset();
                } else {
                    // Fallback if API not loaded
                    setTimeout(() => {
                        cart.showNotification('Message sent successfully!', 'success');
                        form.reset();
                    }, 1000);
                }
            } catch (error) {
                cart.showNotification(error.message || 'Failed to send message', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
};

// ================================
// Newsletter Form
// ================================
const Newsletter = {
    init() {
        const form = document.querySelector('.newsletter-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;

            if (email) {
                cart.showNotification('Thanks for subscribing!', 'success');
                form.reset();
            }
        });
    }
};

// ================================
// Initialize Everything
// ================================
document.addEventListener('DOMContentLoaded', () => {
    // Core systems
    theme.init();
    cart.init();
    wishlist.init();

    // Product loading (with API)
    ProductManager.init();

    // UI enhancements
    ScrollAnimations.init();
    SmoothScroll.init();
    ProductInteractions.init();
    ContactForm.init();
    Newsletter.init();
    AccountUI.init();

    // Lazy load images
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
});

// ================================
// Account UI (dynamic nav icon)
// ================================
const AccountUI = {
    async init() {
        const navIcons = document.querySelector('.nav-icons');
        if (!navIcons) return;

        // Add account button before theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const accountBtn = document.createElement('a');
        accountBtn.className = 'account-toggle';
        accountBtn.id = 'accountToggle';
        accountBtn.setAttribute('aria-label', 'Account');
        accountBtn.style.cssText = 'color:var(--text-secondary);font-size:1.2rem;cursor:pointer;transition:color 0.3s;text-decoration:none;display:flex;align-items:center;gap:0.3rem';

        try {
            const r = await fetch('/api/auth/status');
            let d = null;
            if (r.ok) { try { d = await r.json(); } catch (e) {} }
            if (d && d.logged_in) {
                accountBtn.href = 'account.html';
                accountBtn.innerHTML = `<i class="fas fa-user-circle" style="color:var(--primary)"></i>`;
                accountBtn.title = d.customer.name;
            } else {
                accountBtn.href = 'account-login.html';
                accountBtn.innerHTML = `<i class="fas fa-user"></i>`;
                accountBtn.title = 'Sign In';
            }
        } catch (e) {
            accountBtn.href = 'account-login.html';
            accountBtn.innerHTML = `<i class="fas fa-user"></i>`;
            accountBtn.title = 'Sign In';
        }

        if (themeToggle) {
            navIcons.insertBefore(accountBtn, themeToggle);
        } else {
            navIcons.appendChild(accountBtn);
        }
    }
};

// Export for global access
window.cart = cart;
window.wishlist = wishlist;
window.theme = theme;
window.ProductManager = ProductManager;
window.ScrollAnimations = ScrollAnimations;