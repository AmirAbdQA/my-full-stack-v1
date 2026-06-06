import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    CartItem,
    CartItemCreate,
    CartItemUpdate,
    Item,
    ItemCreate,
    Product,
    ProductCreate,
    ProductUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_product(*, session: Session, product_in: ProductCreate) -> Product:
    db_product = Product.model_validate(product_in)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product


def update_product(
    *, session: Session, db_product: Product, product_in: ProductUpdate
) -> Product:
    update_data = product_in.model_dump(exclude_unset=True)
    db_product.sqlmodel_update(update_data)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product


def get_cart_item_by_product(
    *, session: Session, user_id: uuid.UUID, product_id: uuid.UUID
) -> CartItem | None:
    statement = select(CartItem).where(
        CartItem.user_id == user_id, CartItem.product_id == product_id
    )
    return session.exec(statement).first()


def add_to_cart(
    *, session: Session, user_id: uuid.UUID, cart_item_in: CartItemCreate
) -> CartItem:
    db_cart_item = get_cart_item_by_product(
        session=session, user_id=user_id, product_id=cart_item_in.product_id
    )
    if db_cart_item:
        db_cart_item.quantity += cart_item_in.quantity
    else:
        db_cart_item = CartItem.model_validate(
            cart_item_in, update={"user_id": user_id}
        )
    session.add(db_cart_item)
    session.commit()
    session.refresh(db_cart_item)
    return db_cart_item


def update_cart_item(
    *, session: Session, db_cart_item: CartItem, cart_item_in: CartItemUpdate
) -> CartItem:
    db_cart_item.quantity = cart_item_in.quantity
    session.add(db_cart_item)
    session.commit()
    session.refresh(db_cart_item)
    return db_cart_item
