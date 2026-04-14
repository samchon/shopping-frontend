"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserRound,
  Wallet,
  WalletCards,
} from "lucide-react";

import { SessionDialog } from "@/components/session/session-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart, useSession } from "@/lib/shopping/hooks";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Catalog", icon: Home },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: WalletCards },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/seller", label: "Seller", icon: Store },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSession();
  const cart = useCart();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 surface-blur">
        <div className="container flex min-h-[76px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/12 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              shopping-api
            </div>
            <div>
              <Link href="/" className="text-lg font-semibold">
                Samchon Storefront
              </Link>
              <p className="text-sm text-muted-foreground">
                SDK-shaped commerce without SDK-shaped screens
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({
                      variant: active ? "default" : "ghost",
                      size: "sm",
                    }),
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.href === "/cart" && cart.data ? (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">
                      {cart.data.totals.itemCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {session.isLoading ? (
              <Skeleton className="h-10 w-28 rounded-full" />
            ) : session.isError || !session.data ? (
              <Button onClick={() => session.refetch()} type="button" variant="outline">
                Retry session
              </Button>
            ) : (
              <SessionDialog
                session={session.data}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <UserRound className="h-4 w-4" />
                    {session.data.member?.nickname ?? "Guest"}
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <div className="container flex gap-2 pb-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({
                    variant: active ? "default" : "outline",
                    size: "sm",
                  }),
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="container py-8 md:py-10">{children}</main>
    </div>
  );
}
