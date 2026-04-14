"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  CalendarClock,
  CopyPlus,
  LockKeyhole,
  Package,
  ReceiptText,
  Store,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useJoinSeller,
  useLoginSeller,
  useOpenSellerSale,
  usePauseSellerSale,
  useReplicateSellerSale,
  useRestoreSellerSale,
  useSellerDashboard,
} from "@/lib/shopping/hooks";
import type { SellerOpenSalePayload, SellerSaleView } from "@/lib/shopping/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

function FormMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return new Date(value).toISOString();
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function SellerSaleCard({ sale }: { sale: SellerSaleView }) {
  const pauseSellerSale = usePauseSellerSale(sale.id);
  const restoreSellerSale = useRestoreSellerSale(sale.id);
  const openSellerSale = useOpenSellerSale(sale.id);

  async function submitSchedule(formData: FormData) {
    const payload: SellerOpenSalePayload = {
      openedAt: fromDateTimeLocalValue(formData.get("openedAt")),
      closedAt: fromDateTimeLocalValue(formData.get("closedAt")),
    };

    try {
      await openSellerSale.mutateAsync(payload);
      toast.success("Sale schedule updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sale schedule update failed.");
    }
  }

  return (
    <div
      className="grid gap-4 rounded-[24px] border border-border/70 bg-muted/30 p-4"
      data-sale-title={sale.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{sale.title}</p>
          <p className="text-sm text-muted-foreground">
            {sale.sectionName} / Updated {formatDateTime(sale.updatedAt)}
          </p>
        </div>
        <Badge variant={sale.status === "paused" ? "secondary" : "default"}>
          {sale.status === "paused" ? "Paused" : "Live"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {sale.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-accent px-2.5 py-1 text-xs">
            #{tag}
          </span>
        ))}
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
        <p>Units: {sale.unitCount}</p>
        <p>Stocks surfaced: {sale.stockCount}</p>
        <p>
          Price: {formatCurrency(sale.priceRange.lowest.real)} to{" "}
          {formatCurrency(sale.priceRange.highest.real)}
        </p>
      </div>

      <form
        className="grid gap-3 rounded-[20px] bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitSchedule(new FormData(event.currentTarget));
        }}
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <p className="font-medium">Publishing window</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`sale-opened-${sale.id}`}>Opened at</Label>
            <Input
              defaultValue={toDateTimeLocalValue(sale.openedAt)}
              id={`sale-opened-${sale.id}`}
              name="openedAt"
              type="datetime-local"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`sale-closed-${sale.id}`}>Closed at</Label>
            <Input
              defaultValue={toDateTimeLocalValue(sale.closedAt)}
              id={`sale-closed-${sale.id}`}
              name="closedAt"
              type="datetime-local"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={openSellerSale.isPending} type="submit" variant="outline">
            {openSellerSale.isPending ? "Saving..." : "Update schedule"}
          </Button>
          {sale.status === "paused" ? (
            <Button
              disabled={restoreSellerSale.isPending}
              onClick={async () => {
                try {
                  await restoreSellerSale.mutateAsync();
                  toast.success("Sale restored.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Sale restore failed.");
                }
              }}
              type="button"
            >
              {restoreSellerSale.isPending ? "Restoring..." : "Restore sale"}
            </Button>
          ) : (
            <Button
              disabled={pauseSellerSale.isPending}
              onClick={async () => {
                try {
                  await pauseSellerSale.mutateAsync();
                  toast.success("Sale paused.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Sale pause failed.");
                }
              }}
              type="button"
              variant="secondary"
            >
              {pauseSellerSale.isPending ? "Pausing..." : "Pause sale"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export function SellerDashboardPage() {
  const dashboard = useSellerDashboard();
  const loginSeller = useLoginSeller();
  const joinSeller = useJoinSeller();
  const replicateSellerSale = useReplicateSellerSale();

  const [sourceSaleId, setSourceSaleId] = useState("");
  const [replicaStatus, setReplicaStatus] = useState<"live" | "paused">("live");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Seller dashboard request failed"
        description="The seller console could not load. Retry to re-check the seller session and dashboard data."
        onRetry={() => dashboard.refetch()}
      />
    );
  }

  if (dashboard.isLoading || !dashboard.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-44 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[420px] rounded-[28px]" />
          <Skeleton className="h-[420px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const { session, sales, orders, metrics } = dashboard.data;

  if (!session.active) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="grid gap-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Seller console
                </p>
                <h1 className="mt-2 text-3xl font-semibold">
                  Log in as the built-in operator or promote this customer to seller
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Customer sessions are created on demand. You can sign in with the shared
                  operator credentials, or join this current member session as a seller after
                  membership signup and citizen verification.
                </p>
              </div>
              <Badge variant="secondary">
                Current customer: {session.customer.member?.nickname ?? "Guest"}
              </Badge>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
              <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LockKeyhole className="h-5 w-5 text-primary" />
                    Built-in operator account
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="rounded-2xl bg-card p-4 text-sm">
                    <p className="font-medium">Email</p>
                    <p className="mt-1 font-mono">robot@nestia.io</p>
                  </div>
                  <div className="rounded-2xl bg-card p-4 text-sm">
                    <p className="font-medium">Password</p>
                    <p className="mt-1 font-mono">samchon</p>
                  </div>

                  <form
                    className="grid gap-4"
                    onSubmit={loginForm.handleSubmit(async (values) => {
                      try {
                        await loginSeller.mutateAsync(values);
                        toast.success("Seller session is ready.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Seller login failed.",
                        );
                      }
                    })}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="seller-email">Seller email</Label>
                      <Input id="seller-email" {...loginForm.register("email")} />
                      <FormMessage message={loginForm.formState.errors.email?.message} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="seller-password">Password</Label>
                      <Input
                        id="seller-password"
                        type="password"
                        {...loginForm.register("password")}
                      />
                      <FormMessage message={loginForm.formState.errors.password?.message} />
                    </div>
                    <Button type="submit" disabled={loginSeller.isPending}>
                      {loginSeller.isPending ? "Signing in..." : "Log in as seller"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-primary" />
                    Join this customer as seller
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm text-muted-foreground">
                  <div className="rounded-2xl bg-card p-4">
                    <p>Member</p>
                    <p className="mt-1 font-medium text-foreground">
                      {session.customer.member?.email ?? "Not joined yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-card p-4">
                    <p>Citizen</p>
                    <p className="mt-1 font-medium text-foreground">
                      {session.customer.citizen?.name ?? "Verification needed"}
                    </p>
                  </div>
                  <p>
                    Seller join is available only after member signup and citizen
                    verification on the customer session dialog.
                  </p>
                  <Button
                    disabled={!session.canJoin || joinSeller.isPending}
                    onClick={async () => {
                      try {
                        await joinSeller.mutateAsync();
                        toast.success("This customer session is now a seller.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Seller join failed.",
                        );
                      }
                    }}
                    type="button"
                    variant={session.canJoin ? "default" : "outline"}
                  >
                    {joinSeller.isPending ? "Joining..." : "Join as seller"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSourceSaleId = sourceSaleId || sales[0]?.id || "";
  const sourceSale = sales.find((sale) => sale.id === selectedSourceSaleId) ?? sales[0] ?? null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                Seller console
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Operate sales and watch paid orders from one surface
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Logged in as {session.seller?.nickname} ({session.seller?.email}). This console
                now includes seller-side creation tooling, replica generation, and publishing
                controls on top of the summary endpoints.
              </p>
            </div>
            <div className="rounded-3xl bg-secondary px-4 py-3 text-right">
              <p className="text-sm text-muted-foreground">Seller joined</p>
              <p className="text-lg font-semibold">
                {formatDateTime(session.seller?.joinedAt ?? null)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Live sales</p>
                <p className="text-2xl font-semibold">{metrics.liveSales}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Paused sales</p>
                <p className="text-2xl font-semibold">{metrics.pausedSales}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Paid orders</p>
                <p className="text-2xl font-semibold">{metrics.paidOrders}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-semibold">{formatCurrency(metrics.revenue)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CopyPlus className="h-5 w-5 text-primary" />
              Replica studio
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Clone an existing sale through the SDK replica endpoint, then relaunch it with a
              new title, schedule, and tags. This is the fastest way to seed additional
              storefront data without building every SKU from scratch.
            </p>
            {sourceSale ? (
              <form
                key={selectedSourceSaleId}
                className="grid gap-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!sourceSale) {
                    return;
                  }
                  const formData = new FormData(event.currentTarget);

                  try {
                    await replicateSellerSale.mutateAsync({
                      sourceSaleId: sourceSale.id,
                      title: String(formData.get("title") ?? "").trim(),
                      sectionCode: sourceSale.sectionCode,
                      tags: parseTags(String(formData.get("tags") ?? "")),
                      openedAt: fromDateTimeLocalValue(formData.get("openedAt")),
                      closedAt: fromDateTimeLocalValue(formData.get("closedAt")),
                      status: replicaStatus,
                    });
                    toast.success("Replica sale created.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Replica sale creation failed.",
                    );
                  }
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="replica-source-sale">Source sale</Label>
                  <Select
                    onValueChange={(value) => setSourceSaleId(value)}
                    value={selectedSourceSaleId}
                  >
                    <SelectTrigger id="replica-source-sale">
                      <SelectValue placeholder="Choose a source sale" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map((sale) => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="replica-title">New title</Label>
                  <Input
                    defaultValue={`${sourceSale.title} Replica`}
                    id="replica-title"
                    name="title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="replica-tags">Tags</Label>
                  <Input
                    defaultValue={sourceSale.tags.join(", ")}
                    id="replica-tags"
                    name="tags"
                    placeholder="studio, limited, promo"
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="replica-status">Initial status</Label>
                    <Select
                      onValueChange={(value: "live" | "paused") => setReplicaStatus(value)}
                      value={replicaStatus}
                    >
                      <SelectTrigger id="replica-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="replica-opened-at">Opened at</Label>
                    <Input
                      defaultValue={toDateTimeLocalValue(sourceSale.openedAt)}
                      id="replica-opened-at"
                      name="openedAt"
                      type="datetime-local"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="replica-closed-at">Closed at</Label>
                    <Input
                      defaultValue={toDateTimeLocalValue(sourceSale.closedAt)}
                      id="replica-closed-at"
                      name="closedAt"
                      type="datetime-local"
                    />
                  </div>
                </div>
                <div className="rounded-[20px] bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Replica target section</p>
                  <p className="mt-1">{sourceSale.sectionName}</p>
                </div>
                <Button
                  disabled={replicateSellerSale.isPending}
                  type="submit"
                >
                  {replicateSellerSale.isPending ? "Creating..." : "Create replica sale"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                A source sale is required before the replica studio can clone inventory.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Paid orders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {orders.length ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 rounded-[24px] border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{order.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName}
                        {order.customerEmail ? ` / ${order.customerEmail}` : ""}
                      </p>
                    </div>
                    <Badge>
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>Created {formatDateTime(order.createdAt)}</p>
                    <p>Paid {formatDateTime(order.paidAt)}</p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Collected amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(order.totalPrice)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid place-items-center gap-2 rounded-[24px] bg-muted/30 p-10 text-center">
                <BarChart3 className="h-8 w-8 text-primary" />
                <p className="text-lg font-semibold">No paid orders yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Paid orders will appear here after a customer publishes checkout for one of
                  this seller&apos;s goods.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Seller sales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {sales.map((sale) => (
            <SellerSaleCard key={sale.id} sale={sale} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
