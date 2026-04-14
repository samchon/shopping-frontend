"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeDollarSign,
  Gift,
  ShieldCheck,
  ShoppingBag,
  Tags,
  TicketPercent,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  useAdminDashboard,
  useCreateAdminCoupon,
  useCreateAdminDeposit,
  useCreateAdminMileage,
  useJoinAdmin,
  useLoginAdmin,
} from "@/lib/shopping/hooks";
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

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateTimeValue(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();
  const loginAdmin = useLoginAdmin();
  const joinAdmin = useJoinAdmin();
  const createAdminCoupon = useCreateAdminCoupon();
  const createAdminDeposit = useCreateAdminDeposit();
  const createAdminMileage = useCreateAdminMileage();

  const [couponUnit, setCouponUnit] = useState<"amount" | "percent">("percent");
  const [couponAccess, setCouponAccess] = useState<"public" | "private">("public");
  const [couponExclusive, setCouponExclusive] = useState(false);
  const [couponMultiplicative, setCouponMultiplicative] = useState(false);
  const [depositDirection, setDepositDirection] = useState<"income" | "outcome">("income");
  const [mileageDirection, setMileageDirection] = useState<"income" | "outcome">("income");

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
        title="Admin dashboard request failed"
        description="The admin console could not load. Retry to re-check administrator scope and system summaries."
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

  const { session, metrics, sales, orders, coupons, deposits, mileages } = dashboard.data;

  if (!session.active) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="grid gap-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Administrator console
                </p>
                <h1 className="mt-2 text-3xl font-semibold">
                  Promote the current customer or use the built-in operator account
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  The admin console exposes mall-wide summaries. It uses dedicated
                  administrator endpoints instead of the storefront customer flow.
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
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Built-in administrator account
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
                        await loginAdmin.mutateAsync(values);
                        toast.success("Administrator session is ready.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Administrator login failed.",
                        );
                      }
                    })}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="admin-email">Admin email</Label>
                      <Input id="admin-email" {...loginForm.register("email")} />
                      <FormMessage message={loginForm.formState.errors.email?.message} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        {...loginForm.register("password")}
                      />
                      <FormMessage message={loginForm.formState.errors.password?.message} />
                    </div>
                    <Button disabled={loginAdmin.isPending} type="submit">
                      {loginAdmin.isPending ? "Signing in..." : "Log in as admin"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BadgeDollarSign className="h-5 w-5 text-primary" />
                    Promote current customer
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
                  <Button
                    disabled={!session.canJoin || joinAdmin.isPending}
                    onClick={async () => {
                      try {
                        await joinAdmin.mutateAsync();
                        toast.success("This customer session is now an administrator.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Administrator join failed.",
                        );
                      }
                    }}
                    type="button"
                    variant={session.canJoin ? "default" : "outline"}
                  >
                    {joinAdmin.isPending ? "Joining..." : "Join as admin"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                Administrator console
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                View market-wide sales, orders, coupons, and policy metadata
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Logged in as {session.admin?.nickname} ({session.admin?.email}). This surface
                now includes creation tools for market-wide discount and ledger metadata, not
                just passive summaries.
              </p>
            </div>
            <div className="rounded-3xl bg-secondary px-4 py-3 text-right">
              <p className="text-sm text-muted-foreground">Admin joined</p>
              <p className="text-lg font-semibold">
                {formatDateTime(session.admin?.joinedAt ?? null)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Sales</p>
                <p className="text-2xl font-semibold">{metrics.sales}</p>
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
                <p className="text-sm text-muted-foreground">Coupons</p>
                <p className="text-2xl font-semibold">{metrics.coupons}</p>
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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Create market coupon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                try {
                  await createAdminCoupon.mutateAsync({
                    name: String(formData.get("name") ?? ""),
                    unit: couponUnit,
                    value: Number(formData.get("value") ?? 0),
                    threshold: toNullableNumber(String(formData.get("threshold") ?? "")),
                    limit: toNullableNumber(String(formData.get("limit") ?? "")),
                    multiplicative: couponUnit === "amount" ? couponMultiplicative : false,
                    access: couponAccess,
                    exclusive: couponExclusive,
                    volume: toNullableNumber(String(formData.get("volume") ?? "")),
                    volumePerCitizen: toNullableNumber(
                      String(formData.get("volumePerCitizen") ?? ""),
                    ),
                    expiredIn: toNullableNumber(String(formData.get("expiredIn") ?? "")),
                    openedAt: toDateTimeValue(String(formData.get("openedAt") ?? "")),
                    closedAt: toDateTimeValue(String(formData.get("closedAt") ?? "")),
                  });
                  toast.success("Coupon created.");
                  event.currentTarget.reset();
                  setCouponExclusive(false);
                  setCouponMultiplicative(false);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Coupon creation failed.",
                  );
                }
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="coupon-name">Coupon name</Label>
                <Input id="coupon-name" name="name" placeholder="Golden Week 15%" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="coupon-unit">Discount unit</Label>
                  <Select
                    onValueChange={(value: "amount" | "percent") => setCouponUnit(value)}
                    value={couponUnit}
                  >
                    <SelectTrigger id="coupon-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coupon-value">Discount value</Label>
                  <Input id="coupon-value" min="0" name="value" required type="number" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="coupon-threshold">Threshold</Label>
                  <Input id="coupon-threshold" min="0" name="threshold" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coupon-limit">Limit</Label>
                  <Input id="coupon-limit" min="0" name="limit" type="number" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="coupon-access">Access</Label>
                  <Select
                    onValueChange={(value: "public" | "private") => setCouponAccess(value)}
                    value={couponAccess}
                  >
                    <SelectTrigger id="coupon-access">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coupon-expired-in">Expires in days</Label>
                  <Input id="coupon-expired-in" min="0" name="expiredIn" type="number" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="coupon-volume">Volume cap</Label>
                  <Input id="coupon-volume" min="0" name="volume" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coupon-volume-per-citizen">Per citizen cap</Label>
                  <Input
                    id="coupon-volume-per-citizen"
                    min="0"
                    name="volumePerCitizen"
                    type="number"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="coupon-opened-at">Opened at</Label>
                  <Input id="coupon-opened-at" name="openedAt" type="datetime-local" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coupon-closed-at">Closed at</Label>
                  <Input id="coupon-closed-at" name="closedAt" type="datetime-local" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={couponExclusive} onCheckedChange={(value) => setCouponExclusive(value === true)} />
                  Exclusive coupon
                </label>
                {couponUnit === "amount" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={couponMultiplicative}
                      onCheckedChange={(value) => setCouponMultiplicative(value === true)}
                    />
                    Multiplicative amount
                  </label>
                ) : null}
              </div>
              <Button disabled={createAdminCoupon.isPending} type="submit">
                {createAdminCoupon.isPending ? "Creating..." : "Create coupon"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              Create deposit metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                try {
                  await createAdminDeposit.mutateAsync({
                    code: String(formData.get("code") ?? ""),
                    source: String(formData.get("source") ?? ""),
                    direction: depositDirection,
                  });
                  toast.success("Deposit metadata created.");
                  event.currentTarget.reset();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Deposit metadata creation failed.",
                  );
                }
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="deposit-code">Code</Label>
                <Input id="deposit-code" name="code" placeholder="manual_charge" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deposit-source">Source</Label>
                <Input
                  id="deposit-source"
                  name="source"
                  placeholder="Manual charge"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deposit-direction">Direction</Label>
                <Select
                  onValueChange={(value: "income" | "outcome") => setDepositDirection(value)}
                  value={depositDirection}
                >
                  <SelectTrigger id="deposit-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={createAdminDeposit.isPending} type="submit" variant="outline">
                {createAdminDeposit.isPending ? "Creating..." : "Create deposit meta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-primary" />
              Create mileage metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                try {
                  await createAdminMileage.mutateAsync({
                    code: String(formData.get("code") ?? ""),
                    source: String(formData.get("source") ?? ""),
                    direction: mileageDirection,
                    defaultValue: toNullableNumber(String(formData.get("defaultValue") ?? "")),
                  });
                  toast.success("Mileage metadata created.");
                  event.currentTarget.reset();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Mileage metadata creation failed.",
                  );
                }
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="mileage-code">Code</Label>
                <Input id="mileage-code" name="code" placeholder="review_reward" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mileage-source">Source</Label>
                <Input
                  id="mileage-source"
                  name="source"
                  placeholder="Review reward"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mileage-direction">Direction</Label>
                <Select
                  onValueChange={(value: "income" | "outcome") => setMileageDirection(value)}
                  value={mileageDirection}
                >
                  <SelectTrigger id="mileage-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mileage-default-value">Default value</Label>
                <Input
                  id="mileage-default-value"
                  min="0"
                  name="defaultValue"
                  type="number"
                />
              </div>
              <Button disabled={createAdminMileage.isPending} type="submit" variant="outline">
                {createAdminMileage.isPending ? "Creating..." : "Create mileage meta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Market sales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="grid gap-2 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{sale.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.sectionName} / {formatDateTime(sale.updatedAt)}
                    </p>
                  </div>
                  <Badge variant={sale.status === "paused" ? "secondary" : "default"}>
                    {sale.status === "paused" ? "Paused" : "Live"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(sale.priceRange.lowest.real)} to{" "}
                  {formatCurrency(sale.priceRange.highest.real)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-primary" />
              Paid orders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid gap-2 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.name}</p>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                  <Badge>{order.itemCount} items</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Paid {formatDateTime(order.paidAt)}
                </p>
                <p className="text-lg font-semibold">{formatCurrency(order.totalPrice)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              Coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="grid gap-1 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{coupon.name}</p>
                  <Badge variant={coupon.access === "public" ? "default" : "secondary"}>
                    {coupon.access}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{coupon.discountLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Opened {formatDateTime(coupon.openedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              Deposit metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {deposits.map((item) => (
              <div
                key={item.id}
                className="grid gap-1 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <p className="font-semibold">{item.source}</p>
                <p className="text-sm text-muted-foreground">{item.code}</p>
                <Badge variant={item.direction === "income" ? "default" : "secondary"}>
                  {item.direction}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-primary" />
              Mileage metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mileages.map((item) => (
              <div
                key={item.id}
                className="grid gap-1 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <p className="font-semibold">{item.source}</p>
                <p className="text-sm text-muted-foreground">{item.code}</p>
                <p className="text-sm text-muted-foreground">
                  Default value:{" "}
                  {item.defaultValue === null ? "Variable" : formatCurrency(item.defaultValue)}
                </p>
                <Badge variant={item.direction === "income" ? "default" : "secondary"}>
                  {item.direction}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
