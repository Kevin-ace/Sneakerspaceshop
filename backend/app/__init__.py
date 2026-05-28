# app/__init__.py

from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
import os

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
csrf = CSRFProtect()
login_manager = LoginManager()
login_manager.login_view = 'main.customer_login'
login_manager.login_message_category = 'info'
limiter = Limiter(key_func=get_remote_address, default_limits=[])

def create_app(config_class=Config):
    # Resolve paths
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Store project root for serving frontend files
    app.config['PROJECT_ROOT'] = project_root

    # Enable CORS only for API routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    limiter.init_app(app)
    csrf.init_app(app)

    # Ensure upload directories exist
    upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(backend_dir, 'uploads', 'products'))
    chat_upload_folder = os.path.join(os.path.dirname(upload_folder), 'chat')
    app.config['UPLOAD_FOLDER'] = upload_folder
    app.config['CHAT_UPLOAD_FOLDER'] = chat_upload_folder
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(chat_upload_folder, exist_ok=True)

    # Register the blueprint
    from app.routes import bp as main_blueprint
    app.register_blueprint(main_blueprint)

    return app

# Import models at the bottom to avoid circular import issues
from app import models