"use client";

import { Coins, Gift, TicketPercent, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClaimCoupon, useWallet } from "@/lib/shopping/hooks";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function ClaimCouponButton({ couponId }: { couponId: string }) {
  const claimCoupon = useClaimCoupon(couponId);

  return (
    <Button
      disabled={claimCoupon.isPending}
      onClick={async () => {
        try {
          await claimCoupon.mutateAsync();
          toast.success("Coupon claimed.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Coupon claim failed.");
        }
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      {claimCoupon.isPending ? "Claiming..." : "Claim coupon"}
    </Button>
  );
}

export function WalletPage() {
  const wallet = useWallet();

  if (wallet.isError) {
    return (
      <ErrorState
        title="Wallet request failed"
        description="The wallet could not load deposit, mileage, and coupon data. Retry to fetch the customer asset state again."
        onRetry={() => wallet.refetch()}
      />
    );
  }

  if (wallet.isLoading || !wallet.data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-40 rounded-[28px]" />
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

  const { session, balances, coupons, tickets, depositHistories, mileageHistories } =
    wallet.data;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                Customer wallet
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Track balances, issued tickets, and claimable coupons
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {session.member
                  ? `${session.member.nickname} is browsing with a linked member session.`
                  : "This wallet is attached to the current auto-created customer session."}
              </p>
            </div>
            <Badge variant={session.citizen ? "default" : "secondary"}>
              {session.citizen ? "Citizen verified" : "Citizen verification unlocks balance history"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Deposit balance</p>
                <p className="text-2xl font-semibold">{formatCurrency(balances.deposit)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Mileage balance</p>
                <p className="text-2xl font-semibold">{formatCurrency(balances.mileage)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Available coupons</p>
                <p className="text-2xl font-semibold">{coupons.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-muted/50 shadow-none">
              <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">Owned tickets</p>
                <p className="text-2xl font-semibold">{tickets.length}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-primary" />
              Deposit history
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {depositHistories.length ? (
              depositHistories.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-2 rounded-[24px] border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <Badge variant={entry.amount >= 0 ? "default" : "secondary"}>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatCurrency(entry.amount)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Running balance: {formatCurrency(entry.balance)}
                  </p>
                </div>
              ))
            ) : (
              <div className="grid place-items-center gap-2 rounded-[24px] bg-muted/30 p-10 text-center">
                <Coins className="h-8 w-8 text-primary" />
                <p className="text-lg font-semibold">No deposit history yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Verify citizen information to unlock balance history in this prototype.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Mileage history
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mileageHistories.length ? (
              mileageHistories.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-2 rounded-[24px] border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <Badge variant={entry.amount >= 0 ? "default" : "secondary"}>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatCurrency(entry.amount)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Running balance: {formatCurrency(entry.balance)}
                  </p>
                </div>
              ))
            ) : (
              <div className="grid place-items-center gap-2 rounded-[24px] bg-muted/30 p-10 text-center">
                <Gift className="h-8 w-8 text-primary" />
                <p className="text-lg font-semibold">No mileage history yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  This prototype exposes mileage after citizen verification and simulated rewards.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              Claimable coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="grid gap-3 rounded-[24px] border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{coupon.name}</p>
                    <p className="text-sm text-muted-foreground">{coupon.discountLabel}</p>
                  </div>
                  <Badge variant={coupon.public ? "default" : "secondary"}>
                    {coupon.public ? "Public" : "Private"}
                  </Badge>
                </div>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  <p>Threshold: {coupon.threshold ? formatCurrency(coupon.threshold) : "None"}</p>
                  <p>Discount limit: {coupon.limit ? formatCurrency(coupon.limit) : "None"}</p>
                  <p>
                    Remaining issues: {coupon.remaining === null ? "Unlimited" : coupon.remaining}
                  </p>
                  <p>Closes: {formatDateTime(coupon.closedAt)}</p>
                </div>
                <div>
                  <ClaimCouponButton couponId={coupon.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              Owned coupon tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {tickets.length ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid gap-2 rounded-[24px] border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{ticket.couponName}</p>
                      <p className="text-sm text-muted-foreground">{ticket.discountLabel}</p>
                    </div>
                    <Badge>Ticket</Badge>
                  </div>
                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <p>Claimed: {formatDateTime(ticket.createdAt)}</p>
                    <p>Expires: {formatDateTime(ticket.expiredAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid place-items-center gap-2 rounded-[24px] bg-muted/30 p-10 text-center">
                <TicketPercent className="h-8 w-8 text-primary" />
                <p className="text-lg font-semibold">No coupon tickets yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Claim one of the available coupons to add it to the customer wallet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
