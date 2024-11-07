// main.js
// Smooth scroll effect for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollTop({
            behavior: 'smooth'
        });
    });
});

// Product hover effect with tilt
const products = document.querySelectorAll('.product-card');
products.forEach(product => {
    product.addEventListener('mousemove', (e) => {
        const rect = product.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        product.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    
    product.addEventListener('mouseleave', () => {
        product.style.transform = 'none';
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach((element) => {
    observer.observe(element);
});

// Shopping cart functionality
let cart = [];

function addToCart(productId, name, price) {
    cart.push({ id: productId, name, price });
    updateCartCount();
    showNotification('Added to cart!');
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    cartCount.textContent = cart.length;
    cartCount.classList.add('bump');
    setTimeout(() => cartCount.classList.remove('bump'), 300);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Product filter functionality
function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        if (category === 'all' || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
// main.js
// Theme management
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
    }
};

// Enhanced Cart Functionality
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
        this.showNotification(`Added ${product.name} to cart!`);
    },
    
    remove(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
        this.updateUI();
    },
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.remove(productId);
            }
        }
        this.save();
        this.updateUI();
    },
    
    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },
    
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    updateUI() {
        const cartCount = document.querySelector('.cart-count');
        const cartTotal = document.querySelector('.cart-total');
        const cartItems = document.querySelector('.cart-items');
        
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.classList.add('bump');
            setTimeout(() => cartCount.classList.remove('bump'), 300);
        }
        
        if (cartTotal) {
            cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
        }
        
        if (cartItems) {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>$${item.price}</p>
                        <div class="quantity-controls">
                            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button onclick="cart.remove(${item.id})" class="remove-item">×</button>
                </div>
            `).join('');
        }
    },
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

// Product Quick View
function showQuickView(productId) {
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    // Fetch product details based on productId
    const product = getProductDetails(productId); // You'll need to implement this
    
    modal.innerHTML = `
        <div class="quick-view-content">
            <button class="close-modal">×</button>
            <div class="product-preview">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="price">$${product.price}</p>
                    <p class="description">${product.description}</p>
                    <button onclick="cart.add({
                        id: ${product.id},
                        name: '${product.name}',
                        price: ${product.price},
                        image: '${product.image}'
                    })">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
}

// Animation on scroll
const observerOptions = {
    threshold: 0.2,
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

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    theme.init();
    cart.updateUI();
    
    document.querySelectorAll('.animate-on-scroll').forEach((element) => {
        observer.observe(element);
    });
    
    // Image lazy loading
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formDetails = Object.fromEntries(formData);
            
            // Here you would typically send this data to your backend
            console.log('Form submitted:', formDetails);
            
            // Show success message
            showNotification('Message sent successfully! We\'ll get back to you soon.');
            
            // Reset form
            contactForm.reset();
        });
    }

    // Price slider functionality
    const priceSlider = document.querySelector('.price-slider');
    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            filterByPrice(value);
        });
    }

    // Category filter functionality
    const categoryFilters = document.querySelectorAll('.filter-group input[type="checkbox"]');
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', () => {
            const selectedCategories = Array.from(categoryFilters)
                .filter(f => f.checked)
                .map(f => f.value);
            filterByCategories(selectedCategories);
        });
    });

    // Sort functionality
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }
});

function filterByPrice(maxPrice) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const price = parseFloat(product.querySelector('.product-price').textContent.replace('Ksh ', ''));
        product.style.display = price <= maxPrice ? 'block' : 'none';
    });
}

function filterByCategories(categories) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const shouldShow = categories.length === 0 || 
            categories.includes(product.dataset.category);
        product.style.display = shouldShow ? 'block' : 'none';
    });
}

function sortProducts(method) {
    const shelves = document.querySelectorAll('.shelf-products');
    shelves.forEach(shelf => {
        const products = Array.from(shelf.children);
        products.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('Ksh ', ''));
            const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('Ksh ', ''));
            
            switch(method) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                default:
                    return 0;
            }
        });
        
        products.forEach(product => shelf.appendChild(product));
    });
}

// Price range slider functionality
const priceSlider = document.querySelector('.price-slider');
const priceValue = document.getElementById('priceValue');

if (priceSlider && priceValue) {
    priceSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value).toLocaleString();
        priceValue.textContent = value;
        filterByPrice(e.target.value);
    });
}

// Category page functionality
const categoryCards = document.querySelectorAll('.category-card');
const categoryProducts = document.getElementById('categoryProducts');

// Product data (you can expand this)
const productsByCategory = {
    running: [
        { id: 1, name: 'Speed Runner Pro', price: 12000, image: 'assets/images/running-1.jpg', rating: 4.5 },
        { id: 2, name: 'Marathon Elite', price: 15000, image: 'assets/images/running-2.jpg', rating: 4.8 },
        // Add more running shoes
    ],
    basketball: [
        { id: 3, name: 'Air Jordan 8s', price: 6500, image: 'assets/images/aj8.jpeg', rating: 5.0 },
        // Add more basketball shoes
    ],
    // Add more categories
};

categoryCards.forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        showCategoryProducts(category);
    });
});

function showCategoryProducts(category) {
    const products = productsByCategory[category] || [];
    const productsGrid = categoryProducts.querySelector('.products-grid');
    const categoryHeader = categoryProducts.querySelector('.category-header');

    categoryHeader.innerHTML = `
        <h2>${category.charAt(0).toUpperCase() + category.slice(1)} Collection</h2>
        <button class="back-to-categories" onclick="hideCategoryProducts()">
            <i class="fas fa-arrow-left"></i> Back to Categories
        </button>
    `;

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-overlay">
                    <button onclick="cart.add({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}'})" class="add-to-cart-btn">
                        Add to Cart
                    </button>
                    <a href="product-detail.html?id=${product.id}" class="view-details-btn">View Details</a>
                </div>
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-price">Ksh ${product.price.toLocaleString()}</div>
                <div class="product-rating">★★★★★ (${product.rating})</div>
            </div>
        </div>
    `).join('');

    categoryProducts.classList.add('active');
    categoryProducts.scrollIntoView({ behavior: 'smooth' });
}

function hideCategoryProducts() {
    categoryProducts.classList.remove('active');
    document.querySelector('.categories-grid').scrollIntoView({ behavior: 'smooth' });
}

// Newsletter form handling
document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    showNotification('Thanks for subscribing!');
    e.target.reset();
});

// Dynamic product loading for featured products
const featuredProducts = [
    {
        id: 1,
        name: 'Air Jordan 8s',
        price: 6500,
        image: 'assets/images/aj8.jpeg',
        rating: 5
    },
    // Add more featured products
];

function loadFeaturedProducts() {
    const productsSlider = document.querySelector('.products-slider');
    if (!productsSlider) return;

    productsSlider.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-overlay">
                    <button onclick="cart.add({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}'})" class="add-to-cart-btn">
                        Add to Cart
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">Ksh ${product.price.toLocaleString()}</p>
                <div class="rating">
                    ${'★'.repeat(product.rating)}${'☆'.repeat(5-product.rating)}
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadFeaturedProducts);

class PriceRangeFilter {
    constructor() {
        this.minSlider = document.getElementById('minPriceSlider');
        this.maxSlider = document.getElementById('maxPriceSlider');
        this.priceDisplay = document.querySelector('.price-display');
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.updateDisplay();
        this.filterProducts();
    }

    setupEventListeners() {
        this.minSlider.addEventListener('input', () => {
            if (parseInt(this.minSlider.value) > parseInt(this.maxSlider.value)) {
                this.minSlider.value = this.maxSlider.value;
            }
            this.updateDisplay();
            this.filterProducts();
        });

        this.maxSlider.addEventListener('input', () => {
            if (parseInt(this.maxSlider.value) < parseInt(this.minSlider.value)) {
                this.maxSlider.value = this.minSlider.value;
            }
            this.updateDisplay();
            this.filterProducts();
        });
    }

    updateDisplay() {
        const minPrice = parseInt(this.minSlider.value).toLocaleString();
        const maxPrice = parseInt(this.maxSlider.value).toLocaleString();
        this.priceDisplay.textContent = `Ksh ${minPrice} - Ksh ${maxPrice}`;
    }

    filterProducts() {
        const minPrice = parseInt(this.minSlider.value);
        const maxPrice = parseInt(this.maxSlider.value);
        
        document.querySelectorAll('.product-card').forEach(product => {
            const price = parseInt(product.querySelector('.price')
                .textContent.replace('Ksh ', '').replace(',', ''));
            
            if (price >= minPrice && price <= maxPrice) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }
}

// Initialize price range filter
document.addEventListener('DOMContentLoaded', () => {
    new PriceRangeFilter();
});