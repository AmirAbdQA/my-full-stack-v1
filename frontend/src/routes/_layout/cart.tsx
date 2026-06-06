import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"

import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/api/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/cart")({
  component: CartPage,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" })
    }
  },
  head: () => ({
    meta: [{ title: "Cart - FastAPI Template" }],
  }),
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function CartPage() {
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useCustomToast()

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  })

  const refreshCart = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cart"] })
  }

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      updateCartItem(cartItemId, quantity),
    onSuccess: refreshCart,
    onError: handleError.bind(showErrorToast),
  })

  const removeItemMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      refreshCart()
      showSuccessToast("Item removed from cart")
    },
    onError: handleError.bind(showErrorToast),
  })

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      refreshCart()
      showSuccessToast("Cart cleared")
    },
    onError: handleError.bind(showErrorToast),
  })

  if (isLoading || !cart) {
    return <div className="h-[420px] animate-pulse rounded-3xl border bg-muted/40" />
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed px-6 py-16 text-center">
        <ShoppingBag className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add a few products to see your order summary here.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <Card key={item.id} className="rounded-3xl">
            <CardContent className="flex flex-col gap-5 md:flex-row">
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="h-40 w-full rounded-2xl object-cover md:w-44"
              />
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-primary">{item.product.category}</p>
                    <h2 className="text-2xl font-semibold">{item.product.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.product.description}
                    </p>
                  </div>
                  <p className="text-xl font-semibold">
                    {currencyFormatter.format(item.line_total)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          cartItemId: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      disabled={updateQuantityMutation.isPending}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <div className="min-w-12 text-center text-lg font-medium">
                      {item.quantity}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          cartItemId: item.id,
                          quantity: Math.min(
                            item.product.inventory_count,
                            item.quantity + 1,
                          ),
                        })
                      }
                      disabled={
                        updateQuantityMutation.isPending ||
                        item.quantity >= item.product.inventory_count
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Items</span>
            <span>{cart.total_items}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex items-center justify-between border-t pt-5 text-lg font-semibold">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(cart.subtotal)}</span>
          </div>

          <div className="grid gap-3">
            <Button size="lg" disabled>
              Checkout coming soon
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
            >
              Clear cart
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
