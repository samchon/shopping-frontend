"use client";

import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/lib/shopping/hooks";
import type { OrderListItemView } from "@/lib/shopping/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function statusLabel(status: OrderListItemView["status"]) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending-payment":
      return "Pending payment";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

function statusVariant(status: OrderListItemView["status"]) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "pending-payment":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    case "draft":
    default:
      return "outline" as const;
  }
}

export function OrdersPage() {
  const orders = useOrders();

  if (orders.isError) {
    return (
      <ErrorState
        description="The order timeline could not be loaded from the storefront API. Retry to fetch your drafts and published orders again."
        onRetry={() => orders.refetch()}
        title="Orders request failed"
      />
    );
  }

  if (orders.isLoading || !orders.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-56 rounded-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[28px]" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[28px]" />
        ))}
      </div>
    );
  }

  const { orders: items, session } = orders.data;
  const counts = {
    draft: items.filter((order) => order.status === "draft").length,
    pending: items.filter((order) => order.status === "pending-payment").length,
    paid: items.filter((order) => order.status === "paid").length,
    cancelled: items.filter((order) => order.status === "cancelled").length,
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                Order timeline
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Track every draft and publish attempt</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {session.member
                  ? `${session.member.nickname} is browsing with a linked member session.`
                  : "This storefront is currently browsing as a guest customer session."}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/cart">
                Go to cart
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-semibold">{counts.draft}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{counts.pending}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-semibold">{counts.paid}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-semibold">{counts.cancelled}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/orders/${item.id}`} className="group block">
              <Card className="transition-transform duration-200 hover:-translate-y-1">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold group-hover:text-primary">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.itemCount} line item{item.itemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-sm text-muted-foreground">Order total</p>
                      <p className="text-2xl font-semibold">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>Paid at: {formatDateTime(item.paidAt)}</p>
                    <p>Cancelled at: {formatDateTime(item.cancelledAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-[24px] bg-muted/40 p-4">
              <ReceiptText className="h-5 w-5 text-primary" />
              Create an order draft from selected cart commodities to start the checkout flow.
            </div>
            <div>
              <Button asChild>
                <Link href="/">Browse catalog</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
