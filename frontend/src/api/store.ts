import axios from "axios"
import { OpenAPI } from "@/client"

export type Product = {
  id: string
  name: string
  description: string
  category: string
  image_url: string
  price: number
  inventory_count: number
  is_active: boolean
  created_at?: string | null
}

export type ProductsResponse = {
  data: Product[]
  count: number
}

export type CartItem = {
  id: string
  quantity: number
  line_total: number
  product: Product
}

export type Cart = {
  items: CartItem[]
  total_items: number
  subtotal: number
}

function getRequestConfig() {
  const token = localStorage.getItem("access_token")
  return {
    baseURL: OpenAPI.BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }
}

export async function getProducts(params?: {
  search?: string
  category?: string
}): Promise<ProductsResponse> {
  const response = await axios.get<ProductsResponse>("/api/v1/products/", {
    ...getRequestConfig(),
    params,
  })
  return response.data
}

export async function getProduct(productId: string): Promise<Product> {
  const response = await axios.get<Product>(
    `/api/v1/products/${productId}`,
    getRequestConfig(),
  )
  return response.data
}

export async function getCart(): Promise<Cart> {
  const response = await axios.get<Cart>("/api/v1/cart/", getRequestConfig())
  return response.data
}

export async function addToCart(productId: string, quantity: number): Promise<Cart> {
  const response = await axios.post<Cart>(
    "/api/v1/cart/items",
    {
      product_id: productId,
      quantity,
    },
    getRequestConfig(),
  )
  return response.data
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number,
): Promise<Cart> {
  const response = await axios.patch<Cart>(
    `/api/v1/cart/items/${cartItemId}`,
    {
      quantity,
    },
    getRequestConfig(),
  )
  return response.data
}

export async function removeCartItem(cartItemId: string): Promise<Cart> {
  const response = await axios.delete<Cart>(
    `/api/v1/cart/items/${cartItemId}`,
    getRequestConfig(),
  )
  return response.data
}

export async function clearCart(): Promise<void> {
  await axios.delete("/api/v1/cart/clear", getRequestConfig())
}
