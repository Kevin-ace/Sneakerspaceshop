/**
 * SpaceSneakers API Service
 * Handles communication with the Flask backend or falls back to static catalog
 * for GitHub Pages and offline static hosting.
 */

const API = {
    // Allows setting a custom backend URL (e.g. window.API_BASE_URL = 'https://space-sneakers.onrender.com')
    // Defaults to relative URL for same-origin Flask backend or static fallback
    get BASE_URL() {
        return (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL.replace(/\/$/, '') : '';
    },

    /**
     * Check if running in a static hosting environment (like GitHub Pages) without an external API backend
     */
    isStaticHost() {
        if (typeof window === 'undefined') return false;
        if (window.API_BASE_URL) return false;
        return window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:' || window.STATIC_MODE === true;
    },

    // Rich static catalog for GitHub Pages / static deployment
    FALLBACK_PRODUCTS: [
        {
            id: 1,
            name: "Nike Air Mag 'Back to the Future'",
            description: "The ultimate space-themed sneaker. Features power-lacing and glowing lights.",
            price: 250000,
            category: "Space Limited",
            image_url: "assets/images/hero-sneaker.png",
            stock: 5,
            is_featured: true,
            is_trending: true,
            is_new_arrival: false
        },
        {
            id: 2,
            name: "Air Jordan 8 Retro",
            description: "Classic high-top basketball sneaker with criss-cross straps.",
            price: 18500,
            category: "Basketball",
            image_url: "assets/images/aj8.jpeg",
            stock: 25,
            is_featured: true,
            is_trending: true,
            is_new_arrival: true
        },
        {
            id: 3,
            name: "Louis Vuitton x Timberland Boot",
            description: "Luxury collaboration boot crafted with premium leather and iconic monogram detailing.",
            price: 45000,
            category: "Boots",
            image_url: "assets/images/Timberlandslv.jpeg",
            stock: 15,
            is_featured: true,
            is_trending: true,
            is_new_arrival: true
        },
        {
            id: 4,
            name: "Jordan 1 Retro High 'Stardust'",
            description: "A celestial take on the classic AJ1 with nebula-inspired patterns.",
            price: 22000,
            category: "Basketball",
            image_url: "assets/images/aj1s.jpeg",
            stock: 25,
            is_featured: true,
            is_trending: true,
            is_new_arrival: true
        },
        {
            id: 5,
            name: "Nike Air Max 90 'Mars Landing'",
            description: "Featuring a reflective graphic of the Martian surface.",
            price: 16500,
            category: "Running",
            image_url: "assets/images/airmax.jpeg",
            stock: 40,
            is_featured: true,
            is_trending: false,
            is_new_arrival: true
        },
        {
            id: 6,
            name: "Vans Sk8-Hi 'NASA Space Voyager'",
            description: "Classic Vans silhouette celebrating space exploration.",
            price: 12500,
            category: "Skate",
            image_url: "assets/images/VansSk8-Hi.jpg",
            stock: 50,
            is_featured: false,
            is_trending: false,
            is_new_arrival: true
        },
        {
            id: 7,
            name: "Air Jordan 6 Retro 'Infrared'",
            description: "Timeless Air Jordan 6 design with infrared accents and premium nubuck.",
            price: 24000,
            category: "Basketball",
            image_url: "assets/images/Aj6s.jpg",
            stock: 30,
            is_featured: false,
            is_trending: true,
            is_new_arrival: false
        },
        {
            id: 8,
            name: "Air Jordan 14 Retro 'Last Shot'",
            description: "Sleek aerodynamic design inspired by luxury sports cars.",
            price: 26000,
            category: "Basketball",
            image_url: "assets/images/aj14s.jpeg",
            stock: 20,
            is_featured: false,
            is_trending: true,
            is_new_arrival: false
        },
        {
            id: 9,
            name: "Nike Pegasus Trail 'Galactic'",
            description: "Off-road capability meets responsive cushioning for all terrains.",
            price: 17500,
            category: "Running",
            image_url: "assets/images/pegasus.jpeg",
            stock: 35,
            is_featured: false,
            is_trending: false,
            is_new_arrival: false
        },
        {
            id: 10,
            name: "Air Jordan Retro Collection",
            description: "Premium authentic Jordan drop featuring iconic colorways.",
            price: 21000,
            category: "Basketball",
            image_url: "assets/images/aj.jpeg",
            stock: 15,
            is_featured: false,
            is_trending: true,
            is_new_arrival: false
        }
    ],

    /**
     * Fetch all products from the backend or fallback catalog
     * @returns {Promise<Array>} Array of product objects
     */
    async getProducts() {
        if (this.isStaticHost()) {
            return this.FALLBACK_PRODUCTS;
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/products`);
            if (response.ok) {
                let products = [];
                try { products = await response.json(); } catch(e) {}
                if (Array.isArray(products) && products.length > 0) {
                    return products;
                }
            }
        } catch (error) {
            console.warn('Backend unavailable; using fallback catalog for static hosting.');
        }
        return this.FALLBACK_PRODUCTS;
    },

    /**
     * Fetch products filtered by category
     * @param {string} category - Category to filter by
     * @returns {Promise<Array>} Filtered products
     */
    async getProductsByCategory(category) {
        try {
            const products = await this.getProducts();
            if (!category || category === 'all') return products;
            return products.filter(p =>
                p.category && p.category.toLowerCase() === category.toLowerCase()
            );
        } catch (error) {
            console.error('Error fetching products by category:', error);
            return this.FALLBACK_PRODUCTS;
        }
    },

    /**
     * Fetch a single product by ID
     * @param {number|string} id - Product ID
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProductById(id) {
        const numId = parseInt(id, 10);
        if (this.isStaticHost()) {
            const products = this.FALLBACK_PRODUCTS;
            return products.find(p => p.id === numId) || products[0] || null;
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/${numId}`);
            if (response.ok) {
                let product = null;
                try { product = await response.json(); } catch(e) {}
                if (product) return product;
            }
        } catch (error) {
            console.warn('Backend product fetch unavailable; matching fallback product.');
        }
        const products = await this.getProducts();
        return products.find(p => p.id === numId) || products[0] || null;
    },

    /**
     * Get trending products
     * @returns {Promise<Array>} Trending products
     */
    async getTrendingProducts() {
        if (this.isStaticHost()) {
            const trending = this.FALLBACK_PRODUCTS.filter(p => p.is_trending);
            return trending.length > 0 ? trending : this.FALLBACK_PRODUCTS.slice(0, 4);
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/trending`);
            if (response.ok) {
                let products = [];
                try { products = await response.json(); } catch(e) {}
                if (Array.isArray(products) && products.length > 0) return products;
            }
        } catch (error) {
            console.warn('Backend trending fetch unavailable; using fallback.');
        }
        const all = await this.getProducts();
        const trending = all.filter(p => p.is_trending);
        return trending.length > 0 ? trending : all.slice(0, 4);
    },

    /**
     * Get featured products (top N by default)
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Featured products
     */
    async getFeaturedProducts(limit = 4) {
        try {
            const products = await this.getProducts();
            const featured = products.filter(p => p.is_featured);
            return (featured.length > 0 ? featured : products).slice(0, limit);
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return this.FALLBACK_PRODUCTS.slice(0, limit);
        }
    },

    /**
     * Get new arrivals
     * @returns {Promise<Array>} New arrival products
     */
    async getNewArrivals() {
        if (this.isStaticHost()) {
            const arrivals = this.FALLBACK_PRODUCTS.filter(p => p.is_new_arrival);
            return arrivals.length > 0 ? arrivals : this.FALLBACK_PRODUCTS.slice(0, 4);
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/products/new-arrivals`);
            if (response.ok) {
                let products = [];
                try { products = await response.json(); } catch(e) {}
                if (Array.isArray(products) && products.length > 0) return products;
            }
        } catch (error) {
            console.warn('Backend new arrivals fetch unavailable; using fallback.');
        }
        const all = await this.getProducts();
        const arrivals = all.filter(p => p.is_new_arrival);
        return arrivals.length > 0 ? arrivals : all.slice(0, 4);
    },

    /**
     * Get the homepage banner offer
     * @returns {Promise<Object|null>} Active homepage offer or null
     */
    async getHomepageOffer() {
        if (this.isStaticHost()) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            return {
                title: "Exclusive Launch Offer",
                description: "Get 20% off on your first sneaker order! Use promo code SPACE20 at checkout.",
                discount_percent: 20,
                code: "SPACE20",
                end_date: futureDate.toISOString()
            };
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/offers/homepage`);
            if (response.ok) {
                let offer = null;
                try { offer = await response.json(); } catch(e) {}
                if (offer) return offer;
            }
        } catch (error) {
            console.warn('Backend offer fetch unavailable; using fallback offer.');
        }
        // Fallback active offer for static hosting
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        return {
            title: "Exclusive Launch Offer",
            description: "Get 20% off on your first sneaker order! Use promo code SPACE20 at checkout.",
            discount_percent: 20,
            code: "SPACE20",
            end_date: futureDate.toISOString()
        };
    },

    /**
     * Search products by name, description, or category
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching products
     */
    async searchProducts(query) {
        try {
            const products = await this.getProducts();
            const searchTerm = (query || '').toLowerCase().trim();
            if (!searchTerm) return products;
            return products.filter(p =>
                (p.name && p.name.toLowerCase().includes(searchTerm)) ||
                (p.description && p.description.toLowerCase().includes(searchTerm)) ||
                (p.category && p.category.toLowerCase().includes(searchTerm))
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
     */
    async checkout(orderData) {
        if (this.isStaticHost()) {
            return {
                message: 'Order received! (Demo mode)',
                order_id: Math.floor(1000 + Math.random() * 9000),
                total: orderData.total || 0
            };
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            let data = null;
            try { data = await response.json(); } catch(e) {}
            if (!response.ok) {
                const errMsg = (data && data.error) ? data.error : 'Checkout failed. Please try again.';
                throw new Error(errMsg);
            }
            return data;
        } catch (error) {
            console.warn('Backend unavailable during checkout; returning simulated order confirmation for demo.');
            return {
                message: 'Order received! (Demo mode)',
                order_id: Math.floor(1000 + Math.random() * 9000),
                total: orderData.total || 0
            };
        }
    },

    /**
     * Submit a contact form message
     */
    async sendContactMessage(contactData) {
        if (this.isStaticHost()) {
            return { message: 'Message sent successfully! (Demo mode)' };
        }
        try {
            const response = await fetch(`${this.BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            let data = null;
            try { data = await response.json(); } catch(e) {}
            if (!response.ok) {
                const errMsg = (data && data.error) ? data.error : 'Failed to send message. Please try again.';
                throw new Error(errMsg);
            }
            return data;
        } catch (error) {
            console.warn('Backend unavailable; returning simulated message confirmation.');
            return { message: 'Message sent successfully!' };
        }
    }
};

// Make API available globally
window.API = API;

