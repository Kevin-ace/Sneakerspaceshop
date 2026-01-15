# app/routes.py

from flask import render_template, url_for, flash, redirect, request, jsonify, Blueprint
from app import db, bcrypt
from app.models import Product, Admin
from app.forms import LoginForm, ProductForm
from flask_login import login_user, current_user, logout_user, login_required

# Create a Blueprint
bp = Blueprint('main', __name__)

# app = current_app

### PUBLIC ROUTES ###
@bp.route('/')
def home():
    products = Product.query.all()
    return render_template('index.html', products=products)

@bp.route('/api/products')
def api_products():
    """API endpoint for quick product updates on the frontend."""
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products])

### ADMIN ROUTES ###

@bp.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard')) # <-- Use blueprint name in url_for
    form = LoginForm()
    if form.validate_on_submit():
        admin = Admin.query.filter_by(username=form.username.data).first()
        if admin and bcrypt.check_password_hash(admin.password_hash, form.password.data):
            login_user(admin)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.dashboard'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('admin/login.html', title='Admin Login', form=form)

@bp.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('main.home')) # <-- Use blueprint name in url_for

@bp.route('/admin/dashboard')
@login_required
def dashboard():
    products = Product.query.all()
    return render_template('admin/dashboard.html', title='Dashboard', products=products)

@bp.route('/admin/product/add', methods=['GET', 'POST'])
@login_required
def add_product():
    form = ProductForm()
    if form.validate_on_submit():
        product = Product(name=form.name.data, description=form.description.data,
                          price=form.price.data, category=form.category.data,
                          image_url=form.image_url.data)
        db.session.add(product)
        db.session.commit()
        flash('The product has been added!', 'success')
        return redirect(url_for('main.dashboard')) # <-- Use blueprint name in url_for
    return render_template('admin/product_form.html', title='Add Product', form=form, legend='New Product')

@bp.route('/admin/product/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    form = ProductForm()
    if form.validate_on_submit():
        product.name = form.name.data
        product.description = form.description.data
        product.price = form.price.data
        product.category = form.category.data
        product.image_url = form.image_url.data
        db.session.commit()
        flash('The product has been updated!', 'success')
        return redirect(url_for('main.dashboard')) # <-- Use blueprint name in url_for
    elif request.method == 'GET':
        form.name.data = product.name
        form.description.data = product.description
        form.price.data = product.price
        form.category.data = product.category
        form.image_url.data = product.image_url
    return render_template('admin/product_form.html', title='Edit Product', form=form, legend=f'Edit {product.name}')

@bp.route('/admin/product/delete/<int:product_id>', methods=['POST'])
@login_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash('The product has been deleted!', 'success')
    return redirect(url_for('main.dashboard')) # <-- Use blueprint name in url_for