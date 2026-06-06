import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Search, ShoppingCart } from "lucide-react"
import { useMemo, useState } from "react"

import {
  addToCart,
  getProducts,
  type Product,
  type ProductsResponse,
} from "@/api/store"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Store - FastAPI Template",
      },
    ],
  }),
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function Storefront() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useCustomToast()
  const [searchValue, setSearchValue] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["storefront-products"],
    queryFn: () => getProducts(),
  })

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      showSuccessToast("Product added to cart")
    },
    onError: handleError.bind(showErrorToast),
  })

  const products: Product[] = data?.data ?? []
  const categories: string[] = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  )
  const filteredProducts: Product[] = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, products, searchValue])

  const onAddToCart = (product: Product) => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" })
      return
    }
    if (product.inventory_count < 1 || addToCartMutation.isPending) {
      return
    }
    addToCartMutation.mutate({ productId: product.id, quantity: 1 })
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background px-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
            Curated everyday essentials
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Build your store on FastAPI, then actually shop in it.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            This storefront turns the starter template into a compact e-commerce
            MVP with auth, product browsing, and a server-side cart.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/cart">
                <ShoppingCart className="size-4" />
                Open cart
              </Link>
            </Button>
            {!currentUser && (
              <Button asChild size="lg" variant="outline">
                <Link to="/signup">Create account</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border bg-card/80 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Catalog</p>
            <p className="text-3xl font-semibold">{products.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-3xl font-semibold">
              {Math.max(categories.length - 1, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-lg font-medium">
              {currentUser?.full_name || currentUser?.email || "Guest shopper"}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search for sneakers, headphones, hoodies..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === activeCategory ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-2xl border bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden rounded-2xl pt-0 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-64 w-full object-cover"
                />
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-primary">{product.category}</p>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                    </div>
                    <p className="text-lg font-semibold">
                      {currencyFormatter.format(product.price)}
                    </p>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{product.inventory_count} in stock</span>
                  <Link
                    to="/product/$productId"
                    params={{ productId: product.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    View details
                  </Link>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button
                    className="w-full"
                    onClick={() => onAddToCart(product)}
                    disabled={product.inventory_count < 1}
                  >
                    <ShoppingCart className="size-4" />
                    {product.inventory_count < 1 ? "Out of stock" : "Add to cart"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <h3 className="text-xl font-semibold">No products found</h3>
            <p className="mt-2 text-muted-foreground">
              Try another search term or switch to a different category.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function Dashboard() {
  return <Storefront />
  /*

  return (
    <div>
      <div>
        <h1 className="text-2xl truncate max-w-sm">
          Hi, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome back, nice to see you again!!!
        </p>
      </div>
    </div>
  )
  */
}
