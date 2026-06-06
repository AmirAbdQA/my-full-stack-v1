import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { useState } from "react"

import { addToCart, getProduct } from "@/api/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/product/$productId")({
  component: ProductPage,
  loader: ({ params }) => params.productId,
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function ProductPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useCustomToast()
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  })

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      showSuccessToast("Product added to cart")
    },
    onError: handleError.bind(showErrorToast),
  })

  const onAddToCart = () => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" })
      return
    }
    addToCartMutation.mutate()
  }

  if (isLoading || !product) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[480px] animate-pulse rounded-3xl bg-muted/40" />
        <div className="h-[480px] animate-pulse rounded-3xl bg-muted/40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to store
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full max-h-[640px] w-full object-cover"
          />
        </div>

        <Card className="rounded-3xl">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                {product.category}
              </p>
              <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-3xl font-semibold">
                {currencyFormatter.format(product.price)}
              </p>
            </div>

            <p className="text-base leading-7 text-muted-foreground">
              {product.description}
            </p>

            <div className="grid gap-4 rounded-2xl border bg-muted/20 p-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="text-lg font-medium">
                  {product.inventory_count > 0
                    ? `${product.inventory_count} in stock`
                    : "Out of stock"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-medium">{product.category}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="w-full sm:max-w-28">
                <label className="mb-2 block text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  max={product.inventory_count}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          product.inventory_count || 1,
                          Number(event.target.value) || 1,
                        ),
                      ),
                    )
                  }
                />
              </div>
              <div className="flex-1 self-end">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onAddToCart}
                  disabled={
                    product.inventory_count < 1 || addToCartMutation.isPending
                  }
                >
                  <ShoppingCart className="size-4" />
                  {product.inventory_count < 1 ? "Out of stock" : "Add to cart"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
