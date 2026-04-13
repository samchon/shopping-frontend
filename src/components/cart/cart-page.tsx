"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCart,
  useCreateOrder,
  useDeleteCartItem,
  useUpdateCartItem,
} from "@/lib/shopping/hooks";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function CartRow({
  itemId,
  title,
  thumbnailUrl,
  orderable,
  volume,
  totalPrice,
  createdAt,
  sectionName,
  selections,
  selected,
  onSelect,
}: {
  itemId: string;
  title: string;
  thumbnailUrl: string | null;
  orderable: boolean;
  volume: number;
  totalPrice: number;
  createdAt: string;
  sectionName: string;
  selections: Array<{
    unitName: string;
    stockName: string;
    quantity: number;
    choices: Array<{ label: string; value: string }>;
  }>;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const updateItem = useUpdateCartItem(itemId);
  const deleteItem = useDeleteCartItem(itemId);

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={selected}
              disabled={!orderable}
              onCheckedChange={(checked) => onSelect(checked === true)}
            />
            <div className="h-24 w-24 overflow-hidden rounded-3xl bg-muted">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={title} className="h-full w-full object-cover" src={thumbnailUrl} />
              ) : null}
            </div>
          </div>

          <div className="grid flex-1 gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <Badge variant={orderable ? "default" : "secondary"}>
                    {orderable ? sectionName : "Unavailable for order"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Added {formatDateTime(createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total snapshot price</p>
                <p className="text-xl font-semibold">{formatCurrency(totalPrice)}</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] bg-muted/40 p-4">
              {selections.map((selection) => (
                <div key={`${selection.unitName}-${selection.stockName}`} className="grid gap-1">
                  <p className="text-sm font-medium">
                    {selection.unitName} / {selection.stockName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quantity per set: {selection.quantity}
                  </p>
                  {selection.choices.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selection.choices.map((choice) => (
                        <span
                          key={`${choice.label}-${choice.value}`}
                          className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {choice.label}: {choice.value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    updateItem.mutate(
                      { volume: Math.max(volume - 1, 1) },
                      {
                        onError: (error) => toast.error(error.message),
                      },
                    )
                  }
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  -
                </Button>
                <Input
                  className="w-20 text-center"
                  min={1}
                  onChange={(event) => {
                    const nextVolume = Math.max(Number(event.target.value || 1), 1);
                    updateItem.mutate(
                      { volume: nextVolume },
                      {
                        onError: (error) => toast.error(error.message),
                      },
                    );
                  }}
                  type="number"
                  value={volume}
                />
                <Button
                  onClick={() =>
                    updateItem.mutate(
                      { volume: volume + 1 },
                      {
                        onError: (error) => toast.error(error.message),
                      },
                    )
                  }
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  +
                </Button>
              </div>

              <Button
                onClick={() =>
                  deleteItem.mutate(undefined, {
                    onError: (error) => toast.error(error.message),
                  })
                }
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const createOrder = useCreateOrder();
  const [selectionOverrides, setSelectionOverrides] = useState<
    Record<string, boolean>
  >({});

  if (cart.isError) {
    return (
      <ErrorState
        description="The cart snapshot could not be refreshed from the API. Retry to continue editing quantities or creating an order."
        onRetry={() => cart.refetch()}
        title="Cart request failed"
      />
    );
  }

  if (cart.isLoading || !cart.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-48 rounded-full" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-[28px]" />
        ))}
      </div>
    );
  }

  const { items, totals } = cart.data;
  const selectedIds = items
    .filter((item) => item.orderable && selectionOverrides[item.id] !== false)
    .map((item) => item.id);
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const selectedTotals = {
    itemCount: selectedItems.length,
    quantity: selectedItems.reduce((sum, item) => sum + item.volume, 0),
    subtotal: selectedItems.reduce((sum, item) => sum + item.totalPrice, 0),
  };
  const unavailableCount = items.filter((item) => !item.orderable).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
      <div className="grid gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
            Cart snapshot
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Review every composed commodity</h1>
        </div>

        {items.length ? (
          items.map((item) => (
            <CartRow
              key={item.id}
              itemId={item.id}
              createdAt={item.createdAt}
              onSelect={(checked) =>
                setSelectionOverrides((current) => ({
                  ...current,
                  [item.id]: checked,
                }))
              }
              orderable={item.orderable}
              sectionName={item.sectionName}
              selected={selectedIds.includes(item.id)}
              selections={item.selections}
              thumbnailUrl={item.thumbnailUrl}
              title={item.title}
              totalPrice={item.totalPrice}
              volume={item.volume}
            />
          ))
        ) : (
          <Card>
            <CardContent className="grid place-items-center gap-3 p-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="text-sm text-muted-foreground">
                Add a sale snapshot from the catalog to begin composing an order.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid h-fit gap-4 lg:sticky lg:top-28">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected items</span>
              <span>{selectedTotals.itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected volume</span>
              <span>{selectedTotals.quantity}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected subtotal</span>
              <span className="font-semibold">
                {formatCurrency(selectedTotals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">All cart items</span>
              <span>
                {totals.itemCount} / {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="rounded-[24px] bg-muted/50 p-4 text-sm text-muted-foreground">
              Order creation promotes selected cart commodities into order goods. Final
              publish still requires citizen verification and a shipping address.
            </div>
            {unavailableCount ? (
              <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                {unavailableCount} unavailable item
                {unavailableCount === 1 ? " is" : "s are"} excluded from order creation.
              </div>
            ) : null}
            <Button
              className="h-12 text-base"
              disabled={!selectedIds.length || createOrder.isPending}
              onClick={() =>
                createOrder.mutate(
                  { commodityIds: selectedIds },
                  {
                    onError: (error) => toast.error(error.message),
                    onSuccess: ({ orderId }) => {
                      toast.success("Order draft created.");
                      router.push(`/orders/${orderId}`);
                    },
                  },
                )
              }
            >
              {createOrder.isPending ? "Creating..." : "Create order draft"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
