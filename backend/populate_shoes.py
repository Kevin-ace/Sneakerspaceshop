import os
from flask import Flask
from app import db, create_app
from app.models import Product
from dotenv import load_dotenv

load_dotenv()

app = create_app()

sneakers = [
    {
        "name": "Nike Air Mag 'Back to the Future'",
        "description": "The ultimate space-themed sneaker. Features power-lacing and glowing lights.",
        "price": 25000.0,
        "category": "Space Limited",
        "image_url": "https://images.stockx.com/images/Nike-Air-Mag-Back-To-The-Future.jpg",
        "stock": 5,
        "is_featured": True
    },
    {
        "name": "Jordan 1 Retro High 'Stardust'",
        "description": "A celestial take on the classic AJ1 with nebula-inspired patterns.",
        "price": 350.0,
        "category": "Basketball",
        "image_url": "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Silver-Toe-W-Product.jpg",
        "stock": 25,
        "is_featured": True
    },
    {
        "name": "Adidas Yeezy Boost 350 V2 'Moonrock'",
        "description": "Iconic Yeezy comfort in a lunar-inspired colorway.",
        "price": 450.0,
        "category": "Lifestyle",
        "image_url": "https://images.stockx.com/images/Adidas-Yeezy-Boost-350-Moonrock-Product.jpg",
        "stock": 15,
        "is_featured": False
    },
    {
        "name": "Nike Air Max 90 'Mars Landing'",
        "description": "Featuring a reflective graphic of the Martian surface.",
        "price": 180.0,
        "category": "Running",
        "image_url": "https://images.stockx.com/images/Nike-Air-Max-90-Mars-Landing-Product.jpg",
        "stock": 40,
        "is_featured": True
    },
    {
        "name": "Vans Old Skool 'NASA Space Voyager'",
        "description": "Classic Vans silhouette celebrating 60 years of space exploration.",
        "price": 120.0,
        "category": "Skate",
        "image_url": "https://images.stockx.com/images/Vans-Old-Skool-NASA-Space-Voyager-White.jpg",
        "stock": 50,
        "is_featured": False
    },
    {
        "name": "Converse Chuck 70 'Intergalactic'",
        "description": "Timeless Chucks with a cosmic twist.",
        "price": 95.0,
        "category": "Lifestyle",
        "image_url": "https://images.stockx.com/images/Converse-Chuck-Taylor-All-Star-70s-Hi-Space-Racer-Blue.jpg",
        "stock": 30,
        "is_featured": False
    },
    {
        "name": "New Balance 990v5 'Meteorite'",
        "description": "Premium comfort meets industrial space aesthetics.",
        "price": 210.0,
        "category": "Running",
        "image_url": "https://images.stockx.com/images/New-Balance-990v5-Grey-Product.jpg",
        "stock": 20,
        "is_featured": False
    },
    {
        "name": "Puma RS-X 'Asteroid'",
        "description": "Bulky retro-future design with metallic accents.",
        "price": 130.0,
        "category": "Lifestyle",
        "image_url": "https://images.stockx.com/images/Puma-RS-X-Toys-Black-Blue-Product.jpg",
        "stock": 35,
        "is_featured": False
    }
]

with app.app_context():
    print("Checking and adding sneakers to the database...")
    added_count = 0
    for s in sneakers:
        existing = Product.query.filter_by(name=s['name']).first()
        if not existing:
            product = Product(**s)
            db.session.add(product)
            added_count += 1
    
    db.session.commit()
    print(f"Successfully added {added_count} new sneakers!")
    
    total_count = Product.query.count()
    print(f"Total product count: {total_count}")
