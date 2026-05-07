# app/routes.py
# Secure API with protection against SQL injection, XSS, and other vulnerabilities

from flask import (render_template, url_for, flash, redirect, request,
                   jsonify, Blueprint, make_response, send_from_directory,
                   current_app, abort)
from app import db, bcrypt, limiter
from app.models import Product, Admin, Customer, Order, OrderItem, Offer, ContactMessage, ChatMessage
from app.forms import LoginForm, ProductForm, CustomerRegisterForm, CustomerLoginForm
from functools import wraps
from flask_login import login_user, current_user, logout_user, login_required
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from markupsafe import escape
from werkzeug.utils import secure_filename
import random
import re
import html
import os
import uuid

# Create a Blueprint
bp = Blueprint('main', __name__)

# ================================
# SECURITY UTILITIES
# ================================

def sanitize_input(text):
    """Sanitize user input to prevent XSS attacks."""
    if text is None:
        return None
    if not isinstance(text, str):
        return text
    return html.escape(str(text).strip())

def sanitize_output(data):
    """Sanitize output data for JSON responses."""
    if isinstance(data, dict):
        return {k: sanitize_output(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_output(item) for item in data]
    elif isinstance(data, str):
        return html.escape(data)
    return data

def validate_price(price):
    """Validate price is a positive number."""
    try:
        price = float(price)
        if price < 0:
            return None
        return price
    except (TypeError, ValueError):
        return None

def validate_integer(value, min_val=0, max_val=None):
    """Validate integer within bounds."""
    try:
        value = int(value)
        if value < min_val:
            return None
        if max_val and value > max_val:
            return None
        return value
    except (TypeError, ValueError):
        return None

def allowed_file(filename):
    """Check if a file extension is allowed."""
    allowed = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed

def admin_required(f):
    """Decorator that requires admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or getattr(current_user, 'role', None) != 'admin':
            flash('Admin access required.', 'danger')
            return redirect(url_for('main.admin_login'))
        return f(*args, **kwargs)
    return decorated

def customer_required(f):
    """Decorator that requires customer role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or getattr(current_user, 'role', None) != 'customer':
            return redirect(url_for('main.customer_login'))
        return f(*args, **kwargs)
    return decorated

def save_product_image(file):
    """Save an uploaded product image and return the filename."""
    if file and file.filename and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename
    return None

def save_chat_image(file):
    """Save an uploaded chat image and return the filename."""
    if file and file.filename and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(current_app.config['CHAT_UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename
    return None

def add_security_headers(response):
    """Add security headers to response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
        "img-src 'self' data: https: blob:; "
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; "
        "frame-src https://www.google.com"
    )
    return response

# Apply security headers to all responses
@bp.after_request
def apply_security_headers(response):
    return add_security_headers(response)

# ================================
# FRONTEND STATIC FILE SERVING
# ================================

@bp.route('/')
def home():
    """Serve the landing page."""
    project_root = current_app.config.get('PROJECT_ROOT', '')
    return send_from_directory(project_root, 'index.html')

@bp.route('/<path:filename>')
def serve_frontend(filename):
    """Serve frontend static files (HTML, CSS, JS, images)."""
    project_root = current_app.config.get('PROJECT_ROOT', '')

    # Security: prevent directory traversal
    safe_name = os.path.normpath(filename)
    if safe_name.startswith('..') or safe_name.startswith('/'):
        abort(404)

    # Don't serve backend files
    if safe_name.startswith('backend'):
        abort(404)

    filepath = os.path.join(project_root, safe_name)
    if os.path.isfile(filepath):
        directory = os.path.dirname(filepath)
        basename = os.path.basename(filepath)
        return send_from_directory(directory, basename)

    abort(404)

@bp.route('/uploads/products/<path:filename>')
def serve_upload(filename):
    """Serve uploaded product images."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@bp.route('/uploads/chat/<path:filename>')
def serve_chat_upload(filename):
    """Serve uploaded chat images."""
    return send_from_directory(current_app.config['CHAT_UPLOAD_FOLDER'], filename)

# ================================
# PUBLIC API ROUTES
# ================================

@bp.route('/api/products')
def api_products():
    """Fetch all products."""
    try:
        products = Product.query.order_by(Product.id.desc()).all()
        safe_products = [sanitize_output(p.to_dict()) for p in products]
        response = make_response(jsonify(safe_products))
        response.headers['Cache-Control'] = 'public, max-age=60'
        return response
    except Exception as e:
        return jsonify({'error': 'Failed to fetch products'}), 500

@bp.route('/api/products/<int:product_id>')
def api_product_detail(product_id):
    """Get a single product by ID."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(sanitize_output(product.to_dict()))

@bp.route('/api/products/category/<category>')
def api_products_by_category(category):
    """Get products by category."""
    safe_category = sanitize_input(category)
    if not safe_category or len(safe_category) > 50:
        return jsonify({'error': 'Invalid category'}), 400

    products = Product.query.filter(
        func.lower(Product.category) == safe_category.lower()
    ).all()
    return jsonify([sanitize_output(p.to_dict()) for p in products])

@bp.route('/api/products/search')
def api_search_products():
    """Search products securely."""
    query = request.args.get('q', '')
    safe_query = sanitize_input(query)
    if not safe_query or len(safe_query) < 2:
        return jsonify([])
    if len(safe_query) > 100:
        return jsonify({'error': 'Search query too long'}), 400

    search_pattern = f'%{safe_query}%'
    products = Product.query.filter(
        db.or_(
            Product.name.ilike(search_pattern),
            Product.description.ilike(search_pattern),
            Product.category.ilike(search_pattern)
        )
    ).limit(20).all()
    return jsonify([sanitize_output(p.to_dict()) for p in products])

@bp.route('/api/offers/active')
def api_active_offers():
    """Get active offers for the storefront."""
    now = datetime.now(timezone.utc)
    offers = Offer.query.filter(
        Offer.is_active == True,
        Offer.start_date <= now,
        Offer.end_date >= now
    ).all()
    return jsonify([sanitize_output(o.to_dict()) for o in offers])

# ================================
# CHECKOUT API
# ================================

@bp.route('/api/checkout', methods=['POST'])
@limiter.limit("10 per minute")
def api_checkout():
    """Create an order from the cart. Requires customer login."""
    if not current_user.is_authenticated or getattr(current_user, 'role', None) != 'customer':
        return jsonify({'error': 'Please login to place an order', 'redirect': '/account-login.html'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    items = data.get('items', [])
    if not items or len(items) == 0:
        return jsonify({'error': 'Cart is empty'}), 400
    if len(items) > 50:
        return jsonify({'error': 'Too many items'}), 400

    # Calculate total and validate items
    total = 0
    order_items = []
    for item in items:
        product_id = validate_integer(item.get('id'), min_val=1)
        quantity = validate_integer(item.get('quantity'), min_val=1, max_val=100)

        if not product_id or not quantity:
            return jsonify({'error': 'Invalid item in cart'}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': f'Product not found: {item.get("name", "unknown")}'}), 400

        item_total = product.price * quantity
        total += item_total

        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=quantity,
            price=product.price
        ))

    # Create order linked to customer
    order = Order(
        customer_id=current_user.id,
        customer_name=current_user.name,
        customer_email=current_user.email,
        customer_phone=current_user.phone or '',
        total=total,
        status='pending'
    )
    db.session.add(order)
    db.session.flush()  # Get the order ID

    for oi in order_items:
        oi.order_id = order.id
        db.session.add(oi)

    db.session.commit()

    return jsonify({
        'message': 'Order placed successfully!',
        'order_id': order.id,
        'total': total
    }), 201

# ================================
# CONTACT API
# ================================

@bp.route('/api/contact', methods=['POST'])
@limiter.limit("5 per minute")
def api_contact():
    """Submit a contact form message."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    name = sanitize_input(data.get('name'))
    email = sanitize_input(data.get('email'))
    phone = sanitize_input(data.get('phone', ''))
    subject = sanitize_input(data.get('subject'))
    message = sanitize_input(data.get('message'))

    if not name or len(name) < 2:
        return jsonify({'error': 'Name is required'}), 400
    if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'error': 'Valid email is required'}), 400
    if not subject:
        return jsonify({'error': 'Subject is required'}), 400
    if not message or len(message) < 5:
        return jsonify({'error': 'Message is required (min 5 characters)'}), 400
    if len(message) > 2000:
        return jsonify({'error': 'Message is too long (max 2000 characters)'}), 400

    contact = ContactMessage(
        name=name,
        email=email,
        phone=phone,
        subject=subject,
        message=message
    )
    db.session.add(contact)
    db.session.commit()

    return jsonify({'message': 'Message sent successfully!'}), 201

# ================================
# ADMIN ROUTES
# ================================

@bp.route('/admin/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    form = LoginForm()
    if form.validate_on_submit():
        username = sanitize_input(form.username.data)
        admin = Admin.query.filter_by(username=username).first()
        if admin and bcrypt.check_password_hash(admin.password_hash, form.password.data):
            login_user(admin)
            next_page = request.args.get('next')
            # Validate next_page to prevent open redirect
            if next_page and (not next_page.startswith('/admin') or next_page.startswith('//')):
                next_page = None
            return redirect(next_page) if next_page else redirect(url_for('main.dashboard'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('admin/login.html', title='Admin Login', form=form)

@bp.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('main.home'))

@bp.route('/admin/dashboard')
@login_required
def dashboard():
    products = Product.query.order_by(Product.id.desc()).all()
    orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    offers = Offer.query.filter_by(is_active=True).all()
    unread_messages = ContactMessage.query.filter_by(is_read=False).count()

    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_revenue = db.session.query(func.sum(Order.total)).scalar() or 0
    active_offers = Offer.query.filter_by(is_active=True).count()

    return render_template('admin/dashboard.html',
                         title='Dashboard',
                         products=products,
                         orders=orders,
                         offers=offers,
                         unread_messages=unread_messages,
                         stats={
                             'total_products': total_products,
                             'total_orders': total_orders,
                             'total_revenue': total_revenue,
                             'active_offers': active_offers
                         })

# ================================
# PRODUCT MANAGEMENT
# ================================

@bp.route('/admin/products')
@login_required
def admin_products():
    products = Product.query.order_by(Product.id.desc()).all()
    return render_template('admin/products.html', title='Products', products=products)

@bp.route('/admin/product/add', methods=['GET', 'POST'])
@login_required
def add_product():
    form = ProductForm()
    if form.validate_on_submit():
        name = sanitize_input(form.name.data)
        description = sanitize_input(form.description.data)
        category = sanitize_input(form.category.data)
        price = validate_price(form.price.data)
        stock = validate_integer(form.stock.data, min_val=0) or 10

        if price is None:
            flash('Invalid price value', 'danger')
            return render_template('admin/product_form.html', title='Add Product', form=form, legend='New Product')

        # Handle image upload
        image_filename = ''
        image_url = ''
        if form.image.data and form.image.data.filename:
            image_filename = save_product_image(form.image.data)
            if not image_filename:
                flash('Invalid image file', 'danger')
                return render_template('admin/product_form.html', title='Add Product', form=form, legend='New Product')
        elif form.image_url.data:
            url = sanitize_input(form.image_url.data)
            if url and re.match(r'^https?://', url):
                image_url = url
            else:
                flash('Image URL must start with http:// or https://', 'danger')
                return render_template('admin/product_form.html', title='Add Product', form=form, legend='New Product')

        product = Product(
            name=name,
            description=description,
            price=price,
            category=category,
            image_filename=image_filename,
            image_url=image_url,
            stock=stock,
            is_featured=form.is_featured.data
        )
        db.session.add(product)
        db.session.commit()
        flash('The product has been added!', 'success')
        return redirect(url_for('main.admin_products'))
    return render_template('admin/product_form.html', title='Add Product', form=form, legend='New Product')

@bp.route('/admin/product/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    form = ProductForm()
    if form.validate_on_submit():
        product.name = sanitize_input(form.name.data)
        product.description = sanitize_input(form.description.data)
        product.category = sanitize_input(form.category.data)
        product.is_featured = form.is_featured.data

        price = validate_price(form.price.data)
        if price is None:
            flash('Invalid price value', 'danger')
            return render_template('admin/product_form.html', title='Edit Product', form=form, legend=f'Edit {product.name}')
        product.price = price

        stock = validate_integer(form.stock.data, min_val=0)
        if stock is not None:
            product.stock = stock

        # Handle image upload (replaces existing)
        if form.image.data and form.image.data.filename:
            new_filename = save_product_image(form.image.data)
            if new_filename:
                # Delete old uploaded file if exists
                if product.image_filename:
                    old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], product.image_filename)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                product.image_filename = new_filename
                product.image_url = ''
            else:
                flash('Invalid image file', 'danger')
                return render_template('admin/product_form.html', title='Edit Product', form=form, legend=f'Edit {product.name}')
        elif form.image_url.data:
            url = sanitize_input(form.image_url.data)
            if url and re.match(r'^https?://', url):
                product.image_url = url
                # Clear uploaded image if URL is provided
                if product.image_filename:
                    old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], product.image_filename)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                    product.image_filename = ''

        db.session.commit()
        flash('The product has been updated!', 'success')
        return redirect(url_for('main.admin_products'))
    elif request.method == 'GET':
        form.name.data = product.name
        form.description.data = product.description
        form.price.data = product.price
        form.category.data = product.category
        form.image_url.data = product.image_url or ''
        form.stock.data = product.stock or 10
        form.is_featured.data = product.is_featured
    return render_template('admin/product_form.html', title='Edit Product', form=form,
                         legend=f'Edit {product.name}', product=product)

@bp.route('/admin/product/delete/<int:product_id>', methods=['POST'])
@login_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    # Delete uploaded image file
    if product.image_filename:
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], product.image_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
    db.session.delete(product)
    db.session.commit()
    flash('The product has been deleted!', 'success')
    return redirect(url_for('main.admin_products'))

# ================================
# ADMIN API ENDPOINTS
# ================================

@bp.route('/admin/api/stats')
@login_required
def api_stats():
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_revenue = db.session.query(func.sum(Order.total)).scalar() or 0
    active_offers = Offer.query.filter_by(is_active=True).count()
    unread_messages = ContactMessage.query.filter_by(is_read=False).count()
    return jsonify({
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'active_offers': active_offers,
        'unread_messages': unread_messages
    })

@bp.route('/admin/api/sales-chart')
@login_required
def api_sales_chart():
    end_date = datetime.now(timezone.utc)
    labels = []
    sales_data = []

    for i in range(7):
        date = end_date - timedelta(days=6-i)
        labels.append(date.strftime('%a'))
        day_revenue = db.session.query(func.sum(Order.total)).filter(
            func.date(Order.created_at) == date.date()
        ).scalar() or random.randint(15000, 85000)
        sales_data.append(day_revenue)

    return jsonify({'labels': labels, 'sales': sales_data})

# ================================
# OFFERS MANAGEMENT
# ================================

@bp.route('/admin/offers')
@login_required
def admin_offers():
    offers = Offer.query.order_by(Offer.created_at.desc()).all()
    return render_template('admin/offers.html', title='Offers', offers=offers)

@bp.route('/admin/api/offers', methods=['GET'])
@login_required
def api_get_offers():
    offers = Offer.query.order_by(Offer.created_at.desc()).all()
    return jsonify([sanitize_output(o.to_dict()) for o in offers])

@bp.route('/admin/api/offers', methods=['POST'])
@login_required
def api_create_offer():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    title = sanitize_input(data.get('title'))
    if not title or len(title) > 100:
        return jsonify({'error': 'Invalid title'}), 400

    discount = validate_integer(data.get('discount_percent'), 1, 100)
    if discount is None:
        return jsonify({'error': 'Discount must be 1-100'}), 400

    try:
        start_date = datetime.fromisoformat(data.get('start_date'))
        end_date = datetime.fromisoformat(data.get('end_date'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format'}), 400

    offer = Offer(
        title=title,
        description=sanitize_input(data.get('description')),
        discount_percent=discount,
        code=sanitize_input(data.get('code')),
        start_date=start_date,
        end_date=end_date,
        is_active=bool(data.get('is_active', True))
    )
    db.session.add(offer)
    db.session.commit()
    return jsonify(sanitize_output(offer.to_dict())), 201

@bp.route('/admin/api/offers/<int:offer_id>', methods=['DELETE'])
@login_required
def api_delete_offer(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    db.session.delete(offer)
    db.session.commit()
    return jsonify({'message': 'Offer deleted'})

@bp.route('/admin/api/offers/<int:offer_id>/toggle', methods=['POST'])
@login_required
def api_toggle_offer(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    offer.is_active = not offer.is_active
    db.session.commit()
    return jsonify(sanitize_output(offer.to_dict()))

# ================================
# ORDERS MANAGEMENT
# ================================

@bp.route('/admin/orders')
@login_required
def admin_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return render_template('admin/orders.html', title='Orders', orders=orders)

@bp.route('/admin/api/orders/<int:order_id>/status', methods=['PUT'])
@login_required
def api_update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()

    status = sanitize_input(data.get('status'))
    valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400

    order.status = status
    db.session.commit()
    return jsonify(sanitize_output(order.to_dict()))

# ================================
# MESSAGES / INBOX
# ================================

@bp.route('/admin/messages')
@login_required
def admin_messages():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return render_template('admin/messages.html', title='Messages', messages=messages)

@bp.route('/admin/api/messages/<int:message_id>/read', methods=['POST'])
@login_required
def api_mark_message_read(message_id):
    msg = ContactMessage.query.get_or_404(message_id)
    msg.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'})

@bp.route('/admin/api/messages/<int:message_id>', methods=['DELETE'])
@login_required
def api_delete_message(message_id):
    msg = ContactMessage.query.get_or_404(message_id)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Message deleted'})

# ================================
# SEED DEMO DATA
# ================================

@bp.route('/admin/seed-demo', methods=['POST'])
@login_required
def seed_demo_data():
    for i in range(10):
        order = Order(
            customer_email=f'customer{i+1}@example.com',
            customer_name=f'Customer {i+1}',
            total=random.randint(5000, 50000),
            status=random.choice(['pending', 'processing', 'shipped', 'delivered']),
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 7))
        )
        db.session.add(order)

    offer = Offer(
        title='New Year Sale',
        description='Get 20% off on all products!',
        discount_percent=20,
        code='NEWYEAR20',
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True
    )
    db.session.add(offer)
    db.session.commit()
    flash('Demo data seeded!', 'success')
    return redirect(url_for('main.dashboard'))

# ================================
# CUSTOMER AUTH
# ================================

@bp.route('/api/auth/status')
def api_auth_status():
    """Check if customer is logged in."""
    if current_user.is_authenticated and getattr(current_user, 'role', None) == 'customer':
        return jsonify({'logged_in': True, 'customer': current_user.to_dict()})
    return jsonify({'logged_in': False})

@bp.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute")
def api_register():
    """Register a new customer."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    name = sanitize_input(data.get('name'))
    email = sanitize_input(data.get('email', '')).lower().strip()
    phone = sanitize_input(data.get('phone', ''))
    password = data.get('password', '')

    if not name or len(name) < 2:
        return jsonify({'error': 'Name is required (min 2 chars)'}), 400
    if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'error': 'Valid email is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if Customer.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 400

    customer = Customer(name=name, email=email, phone=phone)
    customer.set_password(password)
    db.session.add(customer)
    db.session.commit()
    login_user(customer)
    return jsonify({'message': 'Account created!', 'customer': customer.to_dict()}), 201

@bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def api_customer_login():
    """Login a customer via JSON API."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    email = sanitize_input(data.get('email', '')).lower().strip()
    password = data.get('password', '')

    customer = Customer.query.filter_by(email=email).first()
    if customer and customer.check_password(password):
        login_user(customer)
        return jsonify({'message': 'Login successful', 'customer': customer.to_dict()})
    return jsonify({'error': 'Invalid email or password'}), 401

@bp.route('/api/auth/logout', methods=['POST'])
def api_customer_logout():
    """Logout customer."""
    logout_user()
    return jsonify({'message': 'Logged out'})

@bp.route('/account/login')
def customer_login():
    """Redirect to frontend login page."""
    return redirect('/account-login.html')

# ================================
# CUSTOMER ORDERS API
# ================================

@bp.route('/api/account/orders')
def api_customer_orders():
    """Get orders for the logged-in customer."""
    if not current_user.is_authenticated or getattr(current_user, 'role', None) != 'customer':
        return jsonify({'error': 'Login required'}), 401
    orders = Order.query.filter_by(customer_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify([sanitize_output(o.to_dict()) for o in orders])

@bp.route('/api/account/orders/<int:order_id>')
def api_customer_order_detail(order_id):
    """Get a specific order for the logged-in customer."""
    if not current_user.is_authenticated or getattr(current_user, 'role', None) != 'customer':
        return jsonify({'error': 'Login required'}), 401
    order = Order.query.filter_by(id=order_id, customer_id=current_user.id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(sanitize_output(order.to_dict()))

# ================================
# CHAT API
# ================================

@bp.route('/api/chat/<int:order_id>/messages')
def api_chat_messages(order_id):
    """Get chat messages for an order."""
    if not current_user.is_authenticated:
        return jsonify({'error': 'Login required'}), 401

    role = getattr(current_user, 'role', None)
    if role == 'customer':
        order = Order.query.filter_by(id=order_id, customer_id=current_user.id).first()
    elif role == 'admin':
        order = Order.query.get(order_id)
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    messages = ChatMessage.query.filter_by(order_id=order_id).order_by(ChatMessage.created_at.asc()).all()

    # Mark messages from the other party as read
    other_type = 'admin' if role == 'customer' else 'customer'
    ChatMessage.query.filter_by(order_id=order_id, sender_type=other_type, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify([sanitize_output(m.to_dict()) for m in messages])

@bp.route('/api/chat/<int:order_id>/send', methods=['POST'])
def api_chat_send(order_id):
    """Send a chat message."""
    if not current_user.is_authenticated:
        return jsonify({'error': 'Login required'}), 401

    role = getattr(current_user, 'role', None)
    if role == 'customer':
        order = Order.query.filter_by(id=order_id, customer_id=current_user.id).first()
    elif role == 'admin':
        order = Order.query.get(order_id)
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    data = request.get_json()
    message_text = sanitize_input(data.get('message', ''))
    if not message_text or len(message_text) > 2000:
        return jsonify({'error': 'Message is required (max 2000 chars)'}), 400

    msg = ChatMessage(
        order_id=order_id,
        sender_type=role,
        sender_id=current_user.id,
        message=message_text
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(sanitize_output(msg.to_dict())), 201

@bp.route('/api/chat/<int:order_id>/upload', methods=['POST'])
def api_chat_upload(order_id):
    """Upload an image in chat."""
    if not current_user.is_authenticated:
        return jsonify({'error': 'Login required'}), 401

    role = getattr(current_user, 'role', None)
    if role == 'customer':
        order = Order.query.filter_by(id=order_id, customer_id=current_user.id).first()
    elif role == 'admin':
        order = Order.query.get(order_id)
    else:
        return jsonify({'error': 'Unauthorized'}), 403

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    filename = save_chat_image(file)
    if not filename:
        return jsonify({'error': 'Invalid image file'}), 400

    caption = sanitize_input(request.form.get('message', ''))

    msg = ChatMessage(
        order_id=order_id,
        sender_type=role,
        sender_id=current_user.id,
        message=caption or '',
        image_filename=filename
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(sanitize_output(msg.to_dict())), 201

# ================================
# ADMIN CHAT VIEW
# ================================

@bp.route('/admin/chat/<int:order_id>')
@admin_required
def admin_chat(order_id):
    order = Order.query.get_or_404(order_id)
    return render_template('admin/chat.html', title=f'Chat - Order #{order.id}', order=order)