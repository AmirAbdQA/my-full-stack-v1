import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, func, select

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser
from app.models import Product, ProductCreate, ProductPublic, ProductsPublic, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=ProductsPublic)
def read_products(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    category: str | None = None,
) -> Any:
    """
    Retrieve active products for the storefront.
    """
    statement = select(Product).where(Product.is_active)
    count_statement = select(func.count()).select_from(Product).where(Product.is_active)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(Product.name.ilike(search_pattern))
        count_statement = count_statement.where(Product.name.ilike(search_pattern))

    if category:
        statement = statement.where(Product.category == category)
        count_statement = count_statement.where(Product.category == category)

    count = session.exec(count_statement).one()
    products = session.exec(
        statement.order_by(col(Product.created_at).desc()).offset(skip).limit(limit)
    ).all()
    return ProductsPublic(data=products, count=count)


@router.get("/{product_id}", response_model=ProductPublic)
def read_product(session: SessionDep, product_id: uuid.UUID) -> Any:
    """
    Get a product by id.
    """
    product = session.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post(
    "/",
    response_model=ProductPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def create_product(*, session: SessionDep, product_in: ProductCreate) -> Any:
    """
    Create a product.
    """
    return crud.create_product(session=session, product_in=product_in)


@router.put(
    "/{product_id}",
    response_model=ProductPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def update_product(
    *, session: SessionDep, product_id: uuid.UUID, product_in: ProductUpdate
) -> Any:
    """
    Update a product.
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(
        session=session, db_product=product, product_in=product_in
    )


@router.delete(
    "/{product_id}", dependencies=[Depends(get_current_active_superuser)]
)
def delete_product(session: SessionDep, product_id: uuid.UUID) -> dict[str, str]:
    """
    Soft delete a product.
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    session.add(product)
    session.commit()
    return {"message": "Product archived successfully"}
