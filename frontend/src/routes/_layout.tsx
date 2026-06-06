import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { LogIn, Settings, ShoppingCart, ShieldCheck } from "lucide-react"

import { Footer } from "@/components/Common/Footer"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

function Layout() {
  const { user: currentUser, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Logo variant="full" />
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Button asChild variant="ghost">
                <Link to="/">Store</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/cart">
                  <ShoppingCart className="size-4" />
                  Cart
                </Link>
              </Button>
              {currentUser && (
                <Button asChild variant="ghost">
                  <Link to="/settings">
                    <Settings className="size-4" />
                    Account
                  </Link>
                </Button>
              )}
              {currentUser?.is_superuser && (
                <Button asChild variant="ghost">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" />
                    Admin
                  </Link>
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {currentUser.full_name || currentUser.email}
                </span>
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/signup">Sign up</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">
                    <LogIn className="size-4" />
                    Login
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 py-8 md:py-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Layout
