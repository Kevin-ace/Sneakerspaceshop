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
});