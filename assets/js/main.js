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
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.className = this.current === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },

    init() {
        this.apply();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggle());
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
                // Redirect to checkout or show checkout modal
                this.showNotification('Proceeding to checkout...', 'success');
                // window.location.href = 'checkout.html';
            });
        }
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
        minPrice: 0,
        maxPrice: 100000,
        sortBy: 'featured'
    },

    async init() {
        // Load products from API
        if (typeof API !== 'undefined') {
            this.allProducts = await API.getProducts();
        }

        // Initialize filters
        this.initFilters();
        this.initSearch();

        // Load products into different sections
        await this.loadShopProducts();
        await this.loadFeaturedProducts();
        await this.loadNewArrivals();
        await this.loadTrendingProducts();
    },

    async loadShopProducts() {
        const container = document.querySelector('.shelf-products, .products-grid');
        if (!container || typeof ProductRenderer === 'undefined') return;

        ProductRenderer.showLoading(container, 6);

        let products = this.allProducts;
        products = this.applyFilters(products);
        products = this.applySort(products);

        setTimeout(() => {
            ProductRenderer.renderProducts(products, container);
            wishlist.init();
        }, 500);
    },

    async loadFeaturedProducts() {
        const container = document.querySelector('.featured-grid');
        if (!container || typeof API === 'undefined') return;

        const products = await API.getFeaturedProducts(4);
        if (products.length > 0 && typeof ProductRenderer !== 'undefined') {
            ProductRenderer.renderProducts(products, container);
        }
    },

    async loadNewArrivals() {
        const container = document.querySelector('.products-slider');
        if (!container || typeof API === 'undefined') return;

        ProductRenderer.showLoading(container, 4);
        const products = await API.getNewArrivals(6);

        setTimeout(() => {
            if (typeof ProductRenderer !== 'undefined') {
                ProductRenderer.renderProducts(products, container);
            }
        }, 300);
    },

    async loadTrendingProducts() {
        const container = document.querySelector('.trending-products .products-grid');
        if (!container || typeof API === 'undefined') return;

        ProductRenderer.showLoading(container, 4);
        const products = await API.getFeaturedProducts(4);

        setTimeout(() => {
            if (typeof ProductRenderer !== 'undefined') {
                ProductRenderer.renderProducts(products, container);
            }
        }, 300);
    },

    applyFilters(products) {
        let filtered = [...products];

        // Category filter
        if (this.currentFilters.categories.length > 0) {
            filtered = filtered.filter(p =>
                this.currentFilters.categories.includes(p.category.toLowerCase())
            );
        }

        // Price filter
        filtered = filtered.filter(p =>
            p.price >= this.currentFilters.minPrice &&
            p.price <= this.currentFilters.maxPrice
        );

        return filtered;
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
                sorted.sort((a, b) => b.id - a.id);
                break;
            default:
                // Featured - no specific sort
                break;
        }

        return sorted;
    },

    initFilters() {
        // Category checkboxes
        const categoryFilters = document.querySelectorAll('.filter-group input[type="checkbox"]');
        categoryFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.currentFilters.categories = Array.from(categoryFilters)
                    .filter(f => f.checked)
                    .map(f => f.value.toLowerCase());
                this.loadShopProducts();
            });
        });

        // Price slider
        const priceSlider = document.querySelector('.price-slider');
        const priceValue = document.getElementById('priceValue');
        if (priceSlider && priceValue) {
            priceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                priceValue.textContent = value.toLocaleString();
                this.currentFilters.maxPrice = value;
                this.loadShopProducts();
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
        const searchInput = document.querySelector('.search-bar input');
        const searchBtn = document.querySelector('.search-bar button');

        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    const query = e.target.value.trim();
                    if (query.length >= 2 && typeof API !== 'undefined') {
                        const results = await API.searchProducts(query);
                        const container = document.querySelector('.shelf-products, .products-grid');
                        if (container && typeof ProductRenderer !== 'undefined') {
                            ProductRenderer.renderProducts(results, container);
                        }
                    } else if (query.length === 0) {
                        this.loadShopProducts();
                    }
                }, 300);
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput?.value.trim();
                if (query) {
                    // Could redirect to search results page
                    console.log('Searching for:', query);
                }
            });
        }
    }
};

// ================================
// Scroll Animations
// ================================
const ScrollAnimations = {
    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.dataset.delay) {
                        entry.target.style.transitionDelay = entry.target.dataset.delay;
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
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

            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Simulate API call (replace with actual API call)
            setTimeout(() => {
                cart.showNotification('Message sent successfully!', 'success');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
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

    // Lazy load images
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
});

// Export for global access
window.cart = cart;
window.wishlist = wishlist;
window.theme = theme;
window.ProductManager = ProductManager;