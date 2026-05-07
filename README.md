# 🚀 SneakerSpace

A full-stack e-commerce platform for premium sneakers with customer accounts, order tracking, real-time chat, and a comprehensive admin dashboard.

## Features

### Storefront
- Modern space-themed UI with dark/light mode
- Product catalog with categories, search, and filtering
- Shopping cart with persistent state
- Customer registration & login
- Checkout (requires account)
- Order tracking with status timeline
- Per-order chat with admin (supports image sharing)
- Contact form

### Admin Dashboard (`/admin`)
- Sales analytics with charts
- Product management (CRUD + image upload)
- Order management with status updates
- Customer chat per order
- Contact message inbox with unread badges
- Promotional offers management

### Security
- Bcrypt password hashing
- CSRF protection (Flask-WTF)
- Rate limiting on auth/checkout/contact endpoints
- Input sanitization (XSS prevention)
- Secure session cookies (HTTPOnly, SameSite)
- Content Security Policy headers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (Custom Properties), Vanilla JS |
| Backend | Flask (Python) |
| Database | PostgreSQL |
| Auth | Flask-Login (dual-role: customer + admin) |
| Deployment | Render (gunicorn) |

## Local Development

### Prerequisites
- Python 3.12+
- PostgreSQL

### Setup

```bash
# Clone
git clone git@github.com:Kevin-ace/Sneakerspaceshop.git
cd Sneakerspaceshop

# Create & activate venv
cd backend
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and a strong secret key

# Initialize database
export FLASK_APP=run.py
flask db upgrade
flask init-db

# Run
python run.py
```

The app runs at **http://localhost:5000**

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/home.html` | Store home |
| `/shop.html` | Product catalog |
| `/account-login.html` | Customer login |
| `/account.html` | Customer dashboard |
| `/admin/login` | Admin login |

Default admin: `admin` / `admin` (change in `.env`)

---

## Project Structure

```
SneakerSpace/
├── render.yaml              # Render deployment config
├── build.sh                 # Build script (migrations + setup)
├── index.html               # Landing page
├── home.html                # Store home
├── shop.html                # Product catalog
├── account-login.html       # Customer login
├── account-register.html    # Customer registration
├── account.html             # Customer dashboard
├── order-detail.html        # Order tracking + chat
├── contact.html             # Contact form
├── assets/
│   ├── css/styles.css       # Global styles
│   ├── js/
│   │   ├── api.js           # API service layer
│   │   ├── main.js          # App logic (cart, checkout, UI)
│   │   ├── theme.js         # Theme toggle
│   │   └── navigation.js    # Nav utilities
│   └── images/              # Product images
└── backend/
    ├── run.py               # App entry point
    ├── config.py            # Configuration
    ├── requirements.txt     # Python dependencies
    ├── .env.example         # Environment template
    ├── uploads/             # User uploads (products, chat)
    ├── migrations/          # Alembic migrations
    └── app/
        ├── __init__.py      # App factory
        ├── models.py        # DB models
        ├── routes.py        # All routes & API
        ├── forms.py         # WTForms
        └── templates/admin/ # Admin portal templates
```

## License

© 2024 Kevin | All rights reserved.
