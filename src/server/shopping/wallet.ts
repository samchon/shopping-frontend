import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  WalletCouponTicketView,
  WalletCouponView,
  WalletHistoryEntryView,
  WalletView,
} from "@/lib/shopping/types";
import { mapSession } from "@/server/shopping/mappers";

import { type SessionContext, requireCurrentCustomer } from "./session";

function isForbiddenError(error: unknown) {
  return (
    (typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 403) ||
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 403)
  );
}

function discountLabelOf(
  discount: { unit: "amount" | "percent"; value: number },
) {
  return discount.unit === "percent"
    ? `${discount.value}% discount`
    : `-${new Intl.NumberFormat("ko-KR").format(discount.value)} KRW`;
}

function mapHistory(
  entry: {
    id: string;
    value: number;
    balance: number;
    created_at: string;
    deposit?: { source: string } | undefined;
    mileage?: { source: string } | undefined;
  },
): WalletHistoryEntryView {
  return {
    id: entry.id,
    label: entry.deposit?.source ?? entry.mileage?.source ?? "Adjustment",
    amount: entry.value,
    balance: entry.balance,
    createdAt: entry.created_at,
  };
}

function mapCoupon(
  coupon: ShoppingApi.functional.shoppings.customers.coupons.index.Output["data"][number],
): WalletCouponView {
  return {
    id: coupon.id,
    name: coupon.name,
    createdAt: coupon.created_at,
    openedAt: coupon.opened_at,
    closedAt: coupon.closed_at,
    discountLabel: discountLabelOf(coupon.discount),
    threshold: coupon.discount.threshold,
    limit: coupon.discount.limit,
    public: coupon.restriction.access === "public",
    remaining: coupon.inventory.volume,
  };
}

function mapTicket(
  ticket: ShoppingApi.functional.shoppings.customers.coupons.tickets.index.Output["data"][number],
): WalletCouponTicketView {
  return {
    id: ticket.id,
    couponId: ticket.coupon.id,
    couponName: ticket.coupon.name,
    createdAt: ticket.created_at,
    expiredAt: ticket.expired_at,
    discountLabel: discountLabelOf(ticket.coupon.discount),
  };
}

export async function getWalletData(
  context: SessionContext,
): Promise<WalletView> {
  const customer = await requireCurrentCustomer(context);

  const couponsPromise = ShoppingApi.functional.shoppings.customers.coupons.index(
    context.connection,
    {
      limit: 20,
      sort: ["-coupon.created_at"],
    },
  );
  const ticketsPromise =
    ShoppingApi.functional.shoppings.customers.coupons.tickets.index(
      context.connection,
      {
        limit: 20,
        sort: ["-ticket.created_at"],
      },
    );

  const walletCore = customer.citizen
    ? Promise.all([
        ShoppingApi.functional.shoppings.customers.deposits.histories.balance(
          context.connection,
        ),
        ShoppingApi.functional.shoppings.customers.mileages.histories.balance(
          context.connection,
        ),
        ShoppingApi.functional.shoppings.customers.deposits.histories.index(
          context.connection,
          {
            limit: 20,
            sort: ["-history.created_at"],
          },
        ),
        ShoppingApi.functional.shoppings.customers.mileages.histories.index(
          context.connection,
          {
            limit: 20,
            sort: ["-history.created_at"],
          },
        ),
      ])
    : Promise.resolve([
        0,
        0,
        { data: [] },
        { data: [] },
      ] as const);

  const [walletData, coupons, tickets] = await Promise.all([
    walletCore.catch((error) => {
      if (!isForbiddenError(error)) {
        throw error;
      }
      return [0, 0, { data: [] }, { data: [] }] as const;
    }),
    couponsPromise,
    ticketsPromise,
  ]);
  const [depositBalance, mileageBalance, depositHistories, mileageHistories] =
    walletData;

  return {
    session: mapSession(customer),
    balances: {
      deposit: depositBalance,
      mileage: mileageBalance,
    },
    depositHistories: depositHistories.data.map(mapHistory),
    mileageHistories: mileageHistories.data.map(mapHistory),
    coupons: coupons.data.map(mapCoupon),
    tickets: tickets.data.map(mapTicket),
  };
}

export async function claimCoupon(
  couponId: string,
  context: SessionContext,
): Promise<WalletView> {
  await ShoppingApi.functional.shoppings.customers.coupons.tickets.create(
    context.connection,
    {
      coupon_id: couponId,
    },
  );
  return getWalletData(context);
}
