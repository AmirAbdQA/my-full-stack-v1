import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import delete, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CartItem,
    CartItemCreate,
    CartItemPublic,
    CartItemUpdate,
    CartPublic,
    Message,
    Product,
    ProductPublic,
)

router = APIRouter(prefix="/cart", tags=["cart"])


def build_cart_response(
    cart_items: list[CartItem], products_by_id: dict[uuid.UUID, Product]
) -> CartPublic:
    items: list[CartItemPublic] = []
    subtotal = 0.0
    total_items = 0

    for cart_item in cart_items:
        product = products_by_id.get(cart_item.product_id)
        if not product:
            continue
        line_total = round(product.price * cart_item.quantity, 2)
        subtotal += line_total
        total_items += cart_item.quantity
        items.append(
            CartItemPublic(
                id=cart_item.id,
                quantity=cart_item.quantity,
                product=ProductPublic.model_validate(product, from_attributes=True),
                line_total=line_total,
            )
        )

    return CartPublic(
        items=items, total_items=total_items, subtotal=round(subtotal, 2)
    )


@router.get("/", response_model=CartPublic)
def read_cart(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve the current user's cart.
    """
    cart_items = session.exec(
        select(CartItem).where(CartItem.user_id == current_user.id)
    ).all()
    if not cart_items:
        return CartPublic(items=[], total_items=0, subtotal=0)

    product_ids = [item.product_id for item in cart_items]
    products = session.exec(select(Product).where(Product.id.in_(product_ids))).all()
    products_by_id = {product.id: product for product in products}
    return build_cart_response(cart_items, products_by_id)


@router.post("/items", response_model=CartPublic)
def add_cart_item(
    *, session: SessionDep, current_user: CurrentUser, cart_item_in: CartItemCreate
) -> Any:
    """
    Add a product to the cart.
    """
    product = session.get(Product, cart_item_in.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.inventory_count < cart_item_in.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    existing_item = crud.get_cart_item_by_product(
        session=session, user_id=current_user.id, product_id=cart_item_in.product_id
    )
    requested_quantity = cart_item_in.quantity + (
        existing_item.quantity if existing_item else 0
    )
    if requested_quantity > product.inventory_count:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    crud.add_to_cart(
        session=session, user_id=current_user.id, cart_item_in=cart_item_in
    )
    return read_cart(session=session, current_user=current_user)


@router.patch("/items/{cart_item_id}", response_model=CartPublic)
def update_cart_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    cart_item_id: uuid.UUID,
    cart_item_in: CartItemUpdate,
) -> Any:
    """
    Update cart item quantity.
    """
    cart_item = session.get(CartItem, cart_item_id)
    if not cart_item or cart_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    product = session.get(Product, cart_item.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if cart_item_in.quantity > product.inventory_count:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    crud.update_cart_item(
        session=session, db_cart_item=cart_item, cart_item_in=cart_item_in
    )
    return read_cart(session=session, current_user=current_user)


@router.delete("/items/{cart_item_id}", response_model=CartPublic)
def delete_cart_item(
    *, session: SessionDep, current_user: CurrentUser, cart_item_id: uuid.UUID
) -> Any:
    """
    Remove an item from the cart.
    """
    cart_item = session.get(CartItem, cart_item_id)
    if not cart_item or cart_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    session.delete(cart_item)
    session.commit()
    return read_cart(session=session, current_user=current_user)


@router.delete("/clear", response_model=Message)
def clear_cart(session: SessionDep, current_user: CurrentUser) -> Message:
    """
    Remove all items from the cart.
    """
    session.exec(delete(CartItem).where(CartItem.user_id == current_user.id))
    session.commit()
    return Message(message="Cart cleared successfully")
