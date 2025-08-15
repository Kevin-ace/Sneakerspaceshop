from app import create_app, db
from app.models import Admin
from app import bcrypt
import os

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Admin': Admin}

@app.cli.command('create-admin')
def create_admin():
    """Creates the initial admin user from .env variables."""
    username = os.environ.get('ADMIN_USERNAME')
    password = os.environ.get('ADMIN_PASSWORD')
    if Admin.query.filter_by(username=username).first():
        print(f"Admin user '{username}' already exists.")
        return
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    admin = Admin(username=username, password_hash=hashed_password)
    db.session.add(admin)
    db.session.commit()
    print(f"Admin user '{username}' created successfully.")

if __name__ == '__main__':
    app.run(debug=True)