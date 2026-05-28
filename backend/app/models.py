from app import db, login_manager, bcrypt
from flask_login import UserMixin
from datetime import datetime, timezone

@login_manager.user_loader
def load_user(user_id):
    """Load user by composite ID: 'admin_<id>' or 'customer_<id>'."""
    if not user_id:
        return None
    try:
        parts = str(user_id).split('_')
        if len(parts) == 2:
            role, uid = parts
            uid = int(uid)
            if role == 'admin':
                return Admin.query.get(uid)
            elif role == 'customer':
                return Customer.query.get(uid)
        # Fallback for legacy sessions: try admin first
        uid = int(user_id)
        return Admin.query.get(uid)
    except (ValueError, TypeError):
        return None


class Admin(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    @property
    def role(self):
        return 'admin'

    def get_id(self):
        return f'admin_{self.id}'

    def __repr__(self):
        return f'<Admin {self.username}>'


class Customer(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    orders = db.relationship('Order', backref='customer', lazy=True)

    @property
    def role(self):
        return 'customer'

    def get_id(self):
        return f'customer_{self.id}'

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Customer {self.name}>'


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(255), nullable=True, default='')
    image_filename = db.Column(db.String(255), nullable=True, default='')
    stock = db.Column(db.Integer, default=10)
    is_featured = db.Column(db.Boolean, default=False)
    is_trending = db.Column(db.Boolean, default=False)
    is_new_arrival = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def display_image_url(self):
        """Return the best available image URL."""
        if self.image_filename:
            return f'/uploads/products/{self.image_filename}'
        if self.image_url:
            url = self.image_url
            # Ensure absolute path for relative URLs
            if url and not url.startswith(('http', '/')):
                url = f'/{url}'
            return url
        return '/assets/images/hero-sneaker.png'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'image_url': self.display_image_url,
            'stock': self.stock,
            'is_featured': self.is_featured,
            'is_trending': self.is_trending,
            'is_new_arrival': self.is_new_arrival,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Product {self.name}>'


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=True)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_name = db.Column(db.String(100), nullable=True)
    customer_phone = db.Column(db.String(20), nullable=True)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='order', lazy=True, cascade='all, delete-orphan')

    @property
    def status_step(self):
        """Return numeric step for tracking timeline."""
        steps = {'pending': 1, 'processing': 2, 'shipped': 3, 'delivered': 4, 'cancelled': -1}
        return steps.get(self.status, 0)

    @property
    def unread_customer_messages(self):
        """Count of unread messages from customer (for admin view)."""
        return ChatMessage.query.filter_by(
            order_id=self.id, sender_type='customer', is_read=False
        ).count()

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'total': self.total,
            'status': self.status,
            'status_step': self.status_step,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data

    def __repr__(self):
        return f'<Order {self.id}>'


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    product = db.relationship('Product', backref='order_items')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'price': self.price
        }

    def __repr__(self):
        return f'<OrderItem {self.product_name}>'


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    sender_type = db.Column(db.String(10), nullable=False)  # 'customer' or 'admin'
    sender_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=True)
    image_filename = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def image_url(self):
        if self.image_filename:
            return f'/uploads/chat/{self.image_filename}'
        return None

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'sender_type': self.sender_type,
            'sender_id': self.sender_id,
            'message': self.message,
            'image_url': self.image_url,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ChatMessage {self.id} on Order {self.order_id}>'


class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    discount_percent = db.Column(db.Integer, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_homepage_banner = db.Column(db.Boolean, default=False)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'discount_percent': self.discount_percent,
            'code': self.code,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'is_homepage_banner': self.is_homepage_banner,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Offer {self.title}>'


class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    subject = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'subject': self.subject,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ContactMessage from {self.name}>'