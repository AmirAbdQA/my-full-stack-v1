from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import Product, ProductCreate, User, UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    product_count = session.exec(select(Product)).first()
    if not product_count:
        sample_products = [
            ProductCreate(
                name="Urban Runner Sneakers",
                description="Lightweight sneakers for everyday city walks and casual outfits.",
                category="Shoes",
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
                price=89.99,
                inventory_count=18,
            ),
            ProductCreate(
                name="Essential Cotton Hoodie",
                description="Soft brushed cotton hoodie with a relaxed fit for cooler days.",
                category="Apparel",
                image_url="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80",
                price=64.5,
                inventory_count=25,
            ),
            ProductCreate(
                name="Minimal Leather Backpack",
                description="Clean everyday backpack with dedicated laptop sleeve and premium zippers.",
                category="Accessories",
                image_url="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
                price=119.0,
                inventory_count=9,
            ),
            ProductCreate(
                name="Noise Canceling Headphones",
                description="Wireless over-ear headphones with immersive sound and long battery life.",
                category="Electronics",
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
                price=199.0,
                inventory_count=12,
            ),
            ProductCreate(
                name="Glass Water Bottle",
                description="Reusable bottle with silicone sleeve designed for work, gym, and travel.",
                category="Lifestyle",
                image_url="https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
                price=24.99,
                inventory_count=40,
            ),
            ProductCreate(
                name="Desk Lamp Pro",
                description="Adjustable LED desk lamp with warm and cool light settings.",
                category="Home",
                image_url="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
                price=54.0,
                inventory_count=14,
            ),
        ]
        for product_in in sample_products:
            crud.create_product(session=session, product_in=product_in)
