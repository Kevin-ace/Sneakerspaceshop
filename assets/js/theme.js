class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        // Apply saved theme on page load
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleIcon();
    }

    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (this.theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
}); 