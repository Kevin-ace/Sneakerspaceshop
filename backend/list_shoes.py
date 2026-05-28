from app import create_app
from app.models import Product

app = create_app()

with app.app_context():
    products = Product.query.all()
    for p in products:
        print(f"ID: {p.id}, Name: {p.name}, Price: {p.price}")
