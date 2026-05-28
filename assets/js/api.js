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
     * Get trending products (curated by admin)
     * @returns {Promise<Array>} Trending products
     */
    async getTrendingProducts() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/trending`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return [];
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
            return products.filter(p => p.is_featured).slice(0, limit);
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    },

    /**
     * Get new arrivals (curated by admin)
     * @returns {Promise<Array>} New arrival products
     */
    async getNewArrivals() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/new-arrivals`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching new arrivals:', error);
            return [];
        }
    },

    /**
     * Get the homepage banner offer (curated by admin)
     * @returns {Promise<Object|null>} Active homepage offer or null
     */
    async getHomepageOffer() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/offers/homepage`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching homepage offer:', error);
            return null;
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

// Make API available globally
window.API = API;
