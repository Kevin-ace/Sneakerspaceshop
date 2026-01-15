/**
 * SpaceSneakers API Service
 * Handles all communication with the Flask backend
 */

const API = {
    // Base URL for the Flask backend
    BASE_URL: 'http://127.0.0.1:5000',

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
            const products = await this.getProducts();
            return products.find(p => p.id === parseInt(id)) || null;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    },

    /**
     * Get featured products (top 4 by default)
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
            // Return last N products as "new arrivals"
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
    }
};

// Product rendering utilities
const ProductRenderer = {
    /**
     * Create a product card HTML
     * @param {Object} product - Product object
     * @returns {string} HTML string
     */
    createProductCard(product) {
        const imageUrl = product.image_url || 'assets/images/hero-sneaker.png';
        return `
            <div class="product-card" data-category="${product.category}" data-id="${product.id}" data-price="${product.price}">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy">
                    <div class="product-badge">New</div>
                    <div class="product-overlay">
                        <button class="quick-view-btn" onclick="ProductRenderer.showQuickView(${product.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="add-to-cart-btn" onclick="cart.add({
                            id: ${product.id}, 
                            name: '${product.name.replace(/'/g, "\\'")}', 
                            price: ${product.price}, 
                            image: '${imageUrl}'
                        })">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <a href="product-detail.html?id=${product.id}" class="view-details-btn">
                            View Details
                        </a>
                    </div>
                    <button class="wishlist-btn" onclick="wishlist.toggle(${product.id})">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-footer">
                        <span class="product-price">Ksh ${product.price.toLocaleString()}</span>
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
     * Show quick view modal
     * @param {number} productId - Product ID
     */
    async showQuickView(productId) {
        const product = await API.getProductById(productId);
        if (!product) return;

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
                        <img src="${product.image_url || 'assets/images/hero-sneaker.png'}" alt="${product.name}">
                    </div>
                    <div class="quick-view-details">
                        <span class="product-category">${product.category}</span>
                        <h2>${product.name}</h2>
                        <p class="product-description">${product.description || 'Premium quality sneakers for your collection.'}</p>
                        <div class="price-section">
                            <span class="current-price">Ksh ${product.price.toLocaleString()}</span>
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
                            id: ${product.id}, 
                            name: '${product.name.replace(/'/g, "\\'")}', 
                            price: ${product.price}, 
                            image: '${product.image_url || 'assets/images/hero-sneaker.png'}'
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
