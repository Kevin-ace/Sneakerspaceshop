import os
import secrets
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Security: Generate a strong random key if not set in .env
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

    # Database: PostgreSQL with SQLite fallback
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    # Auto-detect: secure cookies when not on localhost
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') != 'development'

    # CSRF settings
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour

    # File upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(basedir, 'uploads', 'products')
    CHAT_UPLOAD_FOLDER = os.environ.get('CHAT_UPLOAD_FOLDER') or os.path.join(basedir, 'uploads', 'chat')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'}