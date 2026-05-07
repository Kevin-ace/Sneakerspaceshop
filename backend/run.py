from app import create_app, db
from app.models import Admin, Product
from app import bcrypt
import os

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Admin': Admin, 'Product': Product}

@app.cli.command('create-admin')
def create_admin():
    """Creates the initial admin user from .env variables."""
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    password = os.environ.get('ADMIN_PASSWORD', 'admin')
    if Admin.query.filter_by(username=username).first():
        print(f"Admin user '{username}' already exists.")
        return
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    admin = Admin(username=username, password_hash=hashed_password)
    db.session.add(admin)
    db.session.commit()
    print(f"Admin user '{username}' created successfully.")

@app.cli.command('init-db')
def init_db():
    """Initialize database tables."""
    db.create_all()
    print("Database tables created.")

    # Create admin if not exists
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    password = os.environ.get('ADMIN_PASSWORD', 'admin')
    if not Admin.query.filter_by(username=username).first():
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        admin = Admin(username=username, password_hash=hashed_password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user '{username}' created.")
    else:
        print(f"Admin user '{username}' already exists.")

if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    print("\n" + "=" * 50)
    print("  🚀 SneakerSpace Server Starting")
    print("=" * 50)
    print(f"  Store:     http://{host}:{port}/")
    print(f"  Shop:      http://{host}:{port}/home.html")
    print(f"  Admin:     http://{host}:{port}/admin/login")
    print(f"  Debug:     {'ON' if debug else 'OFF'}")
    print("=" * 50 + "\n")
    app.run(host=host, port=port, debug=debug)