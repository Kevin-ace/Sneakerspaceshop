/**
 * SpaceSneakers API Service
 * Handles all communication with the Flask backend
 */

const API = {
    // Use relative URLs — frontend is served through Flask on the same origin
    BASE_URL: '',

    /**
     * Fetch all products from the backend
     * @returns {Promise<Array>} Array of product objects
     */
    async getProducts() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    /**
     * Fetch products filtered by category
     * @param {string} category - Category to filter by
     * @returns {Promise<Array>} Filtered products
     */
    async getProductsByCategory(category) {
        try {
            const products = await this.getProducts();
            if (category === 'all') return products;
            return products.filter(p =>
                p.category.toLowerCase() === category.toLowerCase()
            );
        } catch (error) {
            console.error('Error fetching products by category:', error);
            return [];
        }
    },

    /**
     * Fetch a single product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProductById(id) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    },

    /**
     * Get featured products (top N by default)
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Featured products
     */
    async getFeaturedProducts(limit = 4) {
        try {
            const products = await this.getProducts();
            return products.slice(0, limit);
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    },

    /**
     * Get new arrivals (most recent products)
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} New arrival products
     */
    async getNewArrivals(limit = 6) {
        try {
            const products = await this.getProducts();
            return products.slice(-limit).reverse();
        } catch (error) {
            console.error('Error fetching new arrivals:', error);
            return [];
        }
    },

    /**
     * Search products by name
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching products
     */
    async searchProducts(query) {
        try {
            const products = await this.getProducts();
            const searchTerm = query.toLowerCase();
            return products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description?.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    },

    /**
     * Filter products by price range
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @returns {Promise<Array>} Filtered products
     */
    async getProductsByPriceRange(minPrice, maxPrice) {
        try {
            const products = await this.getProducts();
            return products.filter(p => p.price >= minPrice && p.price <= maxPrice);
        } catch (error) {
            console.error('Error filtering products:', error);
            return [];
        }
    },

    /**
     * Submit a checkout order
     * @param {Object} orderData - { customer_name, customer_email, customer_phone, items: [{id, name, quantity, price}] }
     * @returns {Promise<Object>} Response with order_id or error
     */
    async checkout(orderData) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Checkout failed');
            }
            return data;
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    },

    /**
     * Submit a contact form message
     * @param {Object} contactData - { name, email, phone, subject, message }
     * @returns {Promise<Object>} Response
     */
    async sendContactMessage(contactData) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }
            return data;
        } catch (error) {
            console.error('Contact form error:', error);
            throw error;
        }
    }
};

// Product rendering utilities
const ProductRenderer = {
    /**
     * Escape HTML special characters to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML-safe text
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    /**
     * Validate and sanitize URL
     * @param {string} url - URL to validate
     * @returns {string} Safe URL or placeholder
     */
    sanitizeUrl(url) {
        if (!url) return 'assets/images/hero-sneaker.png';
        // Allow http, https, relative URLs, and upload paths
        if (url.match(/^(https?:\/\/|\/|assets\/|\/uploads\/)/i)) {
            return this.escapeHtml(url);
        }
        return 'assets/images/hero-sneaker.png';
    },

    /**
     * Create a product card HTML with XSS protection
     * @param {Object} product - Product object
     * @returns {string} HTML string
     */
    createProductCard(product) {
        const safeId = parseInt(product.id) || 0;
        const safeName = this.escapeHtml(product.name);
        const safeCategory = this.escapeHtml(product.category);
        const safeDescription = this.escapeHtml(product.description || '');
        const safePrice = parseFloat(product.price) || 0;
        const safeImageUrl = this.sanitizeUrl(product.image_url);
        const jsEscapedName = safeName.replace(/'/g, "\\'").replace(/"/g, '\\"');

        return `
            <div class="product-card" data-category="${safeCategory}" data-id="${safeId}" data-price="${safePrice}">
                <div class="product-image-container">
                    <img src="${safeImageUrl}" alt="${safeName}" class="product-image" loading="lazy" onerror="this.src='assets/images/hero-sneaker.png'">
                    <div class="product-badge">New</div>
                    <div class="product-overlay">
                        <button class="quick-view-btn" onclick="ProductRenderer.showQuickView(${safeId})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="add-to-cart-btn" onclick="cart.add({
                            id: ${safeId}, 
                            name: '${jsEscapedName}', 
                            price: ${safePrice}, 
                            image: '${safeImageUrl}'
                        })">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <a href="product-detail.html?id=${safeId}" class="view-details-btn">
                            View Details
                        </a>
                    </div>
                    <button class="wishlist-btn" onclick="wishlist.toggle(${safeId})">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-category">${safeCategory}</span>
                    <h3 class="product-title">${safeName}</h3>
                    <p class="product-description">${safeDescription}</p>
                    <div class="product-footer">
                        <span class="product-price">Ksh ${safePrice.toLocaleString()}</span>
                        <div class="product-rating">
                            <i class="fas fa-star"></i>
                            <span>4.5</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Create a loading skeleton HTML
     * @returns {string} HTML string
     */
    createSkeleton() {
        return `
            <div class="product-card skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line medium"></div>
                </div>
            </div>
        `;
    },

    /**
     * Render products to a container
     * @param {Array} products - Array of products
     * @param {HTMLElement} container - Container element
     */
    renderProducts(products, container) {
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or check back later</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(p => this.createProductCard(p)).join('');
    },

    /**
     * Show loading skeletons
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeletons
     */
    showLoading(container, count = 4) {
        if (!container) return;
        container.innerHTML = Array(count).fill(this.createSkeleton()).join('');
    },

    /**
     * Show quick view modal with XSS protection
     * @param {number} productId - Product ID
     */
    async showQuickView(productId) {
        const product = await API.getProductById(productId);
        if (!product) return;

        const safeId = parseInt(product.id) || 0;
        const safeName = this.escapeHtml(product.name);
        const safeCategory = this.escapeHtml(product.category);
        const safeDescription = this.escapeHtml(product.description) || 'Premium quality sneakers for your collection.';
        const safePrice = parseFloat(product.price) || 0;
        const safeImageUrl = this.sanitizeUrl(product.image_url);
        const jsEscapedName = safeName.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
            <div class="quick-view-overlay" onclick="this.parentElement.remove()"></div>
            <div class="quick-view-content">
                <button class="close-modal" onclick="this.closest('.quick-view-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="quick-view-grid">
                    <div class="quick-view-image">
                        <img src="${safeImageUrl}" alt="${safeName}" onerror="this.src='assets/images/hero-sneaker.png'">
                    </div>
                    <div class="quick-view-details">
                        <span class="product-category">${safeCategory}</span>
                        <h2>${safeName}</h2>
                        <p class="product-description">${safeDescription}</p>
                        <div class="price-section">
                            <span class="current-price">Ksh ${safePrice.toLocaleString()}</span>
                        </div>
                        <div class="size-selector">
                            <h4>Select Size</h4>
                            <div class="sizes">
                                ${[38, 39, 40, 41, 42, 43, 44, 45].map(size =>
            `<button class="size-btn" onclick="this.parentElement.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">${size}</button>`
        ).join('')}
                            </div>
                        </div>
                        <div class="quantity-selector">
                            <h4>Quantity</h4>
                            <div class="quantity-controls">
                                <button onclick="updateQuickViewQty(-1)">-</button>
                                <span id="quickViewQty">1</span>
                                <button onclick="updateQuickViewQty(1)">+</button>
                            </div>
                        </div>
                        <button class="add-to-cart-large" onclick="cart.add({
                            id: ${safeId}, 
                            name: '${jsEscapedName}', 
                            price: ${safePrice}, 
                            image: '${safeImageUrl}'
                        }); this.closest('.quick-view-modal').remove();">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }
};

// Quick view quantity helper
function updateQuickViewQty(change) {
    const qtyEl = document.getElementById('quickViewQty');
    if (qtyEl) {
        let qty = parseInt(qtyEl.textContent) + change;
        if (qty < 1) qty = 1;
        if (qty > 10) qty = 10;
        qtyEl.textContent = qty;
    }
}

// Make API and ProductRenderer available globally
window.API = API;
window.ProductRenderer = ProductRenderer;
