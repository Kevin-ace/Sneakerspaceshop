/**
 * SpaceSneakers Product Renderer
 * Handles the visual rendering of product cards and loading states
 */

const ProductRenderer = {
    /**
     * Decode HTML entities
     * @param {string} html - Escaped HTML string
     * @returns {string} Decoded string
     */
    decodeHtml(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    },

    /**
     * Render a list of products into a container
     * @param {Array} products - Array of product objects
     * @param {HTMLElement} container - Target container
     */
    renderProducts(products, container) {
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="text-align:center; padding: 5rem; grid-column: 1/-1; width: 100%;">
                    <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.2; color: var(--primary);"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No products found</h3>
                    <p style="color: var(--text-secondary);">Try adjusting your filters or search terms</p>
                    <button onclick="clearAllFilters()" class="primary-btn" style="margin-top: 1.5rem; padding: 0.8rem 2rem;">Reset Filters</button>
                </div>
            `;
            return;
        }

        try {
            const html = products.map(product => {
                try {
                    return this.createProductCard(product);
                } catch (e) {
                    console.error('Error rendering product card:', e);
                    return '';
                }
            }).join('');
            
            container.innerHTML = html;
            
            // Update results count if present
            const countElement = document.getElementById('resultsCount');
            if (countElement) {
                countElement.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
            }
        } catch (error) {
            console.error('Critical error in renderProducts:', error);
            container.innerHTML = '<p style="color:red; text-align:center; grid-column: 1/-1;">Error loading products. Please refresh the page.</p>';
        }
    },

    /**
     * Create HTML for a single product card
     * @param {Object} product - Product data
     * @returns {string} HTML string
     */
    createProductCard(product) {
        if (!product) return '';
        
        const safeId = product.id || 0;
        const decodedName = this.decodeHtml(product.name || 'Unnamed Product');
        const safeName = decodedName.replace(/'/g, "&apos;");
        const safePrice = product.price || 0;
        const safeCategory = this.decodeHtml(product.category || 'Uncategorized');
        const safeImage = product.image_url || 'assets/images/hero-sneaker.png';
        const isWished = typeof wishlist !== 'undefined' && wishlist.items && wishlist.items.includes(safeId);
        
        return `
            <div class="product-card animate-on-scroll" data-id="${safeId}">
                <div class="product-image-container">
                    <img class="product-image" src="${safeImage}" alt="${safeName}" loading="lazy" onerror="this.src='assets/images/hero-sneaker.png'">
                    <button class="wishlist-btn" onclick="if(window.wishlist) wishlist.toggle(${safeId})" aria-label="Add to wishlist">
                        <i class="${isWished ? 'fas' : 'far'} fa-heart" ${isWished ? 'style="color:#e74c3c"' : ''}></i>
                    </button>
                    <div class="product-overlay">
                        <a href="product-detail.html?id=${safeId}" class="view-details-btn" aria-label="View details">
                            <i class="fas fa-eye"></i> View Details
                        </a>
                        <button class="add-to-cart-btn" onclick="if(window.cart) cart.add({
                            id: ${safeId},
                            name: '${safeName.replace(/'/g, "\\'")}',
                            price: ${safePrice},
                            image: '${safeImage}'
                        })" aria-label="Add to cart">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                    ${product.is_featured ? '<span class="product-badge">Featured</span>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-category">${safeCategory}</div>
                    <h3 class="product-title">${decodedName}</h3>
                    <div class="product-footer">
                        <span class="product-price">Ksh ${safePrice.toLocaleString()}</span>
                        <div class="product-rating">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <span>(5.0)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Show loading skeletons in a container
     * @param {HTMLElement} container - Target container
     * @param {number} count - Number of skeletons to show
     */
    showLoading(container, count = 4) {
        if (!container) return;
        
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="product-card skeleton" style="min-height: 380px;">
                    <div class="product-image-container skeleton-box" style="height: 280px; background: var(--bg-secondary); opacity: 0.6;"></div>
                    <div class="product-info">
                        <div class="skeleton-line short" style="height: 12px; background: var(--bg-secondary); width: 35%; margin-bottom: 1rem; border-radius: 4px;"></div>
                        <div class="skeleton-line" style="height: 20px; background: var(--bg-secondary); width: 85%; margin-bottom: 1.5rem; border-radius: 4px;"></div>
                        <div class="product-footer">
                            <div class="skeleton-line medium" style="height: 24px; background: var(--bg-secondary); width: 45%; border-radius: 4px;"></div>
                            <div class="skeleton-circle" style="width: 35px; height: 35px; background: var(--bg-secondary); border-radius: 50%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = skeletons;
    }
};

window.ProductRenderer = ProductRenderer;
