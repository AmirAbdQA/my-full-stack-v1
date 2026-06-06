from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import Product


def test_read_products(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/products/")

    assert response.status_code == 200
    content = response.json()
    assert content["count"] >= 1
    assert len(content["data"]) >= 1


def test_add_product_to_cart(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    product = db.exec(select(Product)).first()
    assert product is not None

    response = client.post(
        f"{settings.API_V1_STR}/cart/items",
        headers=normal_user_token_headers,
        json={"product_id": str(product.id), "quantity": 1},
    )

    assert response.status_code == 200
    content = response.json()
    assert content["total_items"] == 1
    assert len(content["items"]) == 1
    assert content["items"][0]["product"]["id"] == str(product.id)
