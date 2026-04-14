import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  AdminCouponView,
  AdminCreateCouponPayload,
  AdminCreateDepositPayload,
  AdminCreateMileagePayload,
  AdminDashboardView,
  AdminIdentityView,
  AdminLedgerMetaView,
  AdminSessionView,
  LoginMemberPayload,
  SellerOrderView,
  SellerSaleView,
} from "@/lib/shopping/types";
import { mapMoney, mapSession } from "@/server/shopping/mappers";

import { requireCurrentCustomer, type SessionContext } from "./session";

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

function mapAdminIdentity(
  admin: ShoppingApi.functional.shoppings.admins.authenticate.get.Output,
): AdminIdentityView {
  return {
    id: admin.id,
    nickname: admin.member.nickname,
    email: admin.member.emails[0]?.value ?? null,
    joinedAt: admin.created_at,
    citizen: {
      name: admin.citizen.name,
      mobile: admin.citizen.mobile,
    },
  };
}

function mapSale(
  sale: ShoppingApi.functional.shoppings.admins.sales.index.Output["data"][number],
): SellerSaleView {
  return {
    id: sale.id,
    title: sale.content.title,
    sectionCode: sale.section.code,
    sectionName: sale.section.name,
    openedAt: sale.opened_at,
    closedAt: sale.closed_at,
    updatedAt: sale.updated_at,
    status: sale.paused_at ? "paused" : "live",
    tags: sale.tags,
    unitCount: sale.units.length,
    stockCount: 0,
    priceRange: {
      lowest: mapMoney(sale.price_range.lowest),
      highest: mapMoney(sale.price_range.highest),
    },
  };
}

function mapOrder(
  order: ShoppingApi.functional.shoppings.admins.orders.index.Output["data"][number],
): SellerOrderView {
  return {
    id: order.id,
    name: order.name,
    customerName: order.customer.citizen?.name ?? order.customer.member?.nickname ?? "Guest",
    customerEmail: order.customer.member?.emails[0]?.value ?? null,
    createdAt: order.created_at,
    paidAt: order.publish?.paid_at ?? null,
    itemCount: order.goods.length,
    totalPrice: order.price.real,
  };
}

function mapCoupon(
  coupon: ShoppingApi.functional.shoppings.admins.coupons.index.Output["data"][number],
): AdminCouponView {
  return {
    id: coupon.id,
    name: coupon.name,
    createdAt: coupon.created_at,
    openedAt: coupon.opened_at,
    closedAt: coupon.closed_at,
    access: coupon.restriction.access,
    discountLabel: discountLabelOf(coupon.discount),
  };
}

function mapDeposit(
  deposit: ShoppingApi.functional.shoppings.admins.deposits.index.Output["data"][number],
): AdminLedgerMetaView {
  return {
    id: deposit.id,
    code: deposit.code,
    source: deposit.source,
    direction: deposit.direction === 1 ? "income" : "outcome",
    createdAt: deposit.created_at,
    defaultValue: null,
  };
}

function mapMileage(
  mileage: ShoppingApi.functional.shoppings.admins.mileages.index.Output["data"][number],
): AdminLedgerMetaView {
  return {
    id: mileage.id,
    code: mileage.code,
    source: mileage.source,
    direction: mileage.direction === 1 ? "income" : "outcome",
    createdAt: mileage.created_at,
    defaultValue: mileage.value,
  };
}

export async function getAdminSessionData(
  context: SessionContext,
): Promise<AdminSessionView> {
  const customer = await requireCurrentCustomer(context);

  try {
    const admin =
      await ShoppingApi.functional.shoppings.admins.authenticate.get(
        context.connection,
      );

    return {
      customer: mapSession(customer),
      admin: mapAdminIdentity(admin),
      active: true,
      canJoin: false,
    };
  } catch (error) {
    if (!isForbiddenError(error)) {
      throw error;
    }

    return {
      customer: mapSession(customer),
      admin: null,
      active: false,
      canJoin: Boolean(customer.member && customer.citizen),
    };
  }
}

export async function loginAdmin(
  payload: LoginMemberPayload,
  context: SessionContext,
): Promise<AdminSessionView> {
  await ShoppingApi.functional.shoppings.admins.authenticate.login(
    context.connection,
    {
      email: payload.email,
      password: payload.password,
    },
  );
  return getAdminSessionData(context);
}

export async function joinAdmin(
  context: SessionContext,
): Promise<AdminSessionView> {
  await ShoppingApi.functional.shoppings.admins.authenticate.join(
    context.connection,
    {},
  );
  return getAdminSessionData(context);
}

export async function getAdminDashboard(
  context: SessionContext,
): Promise<AdminDashboardView> {
  const session = await getAdminSessionData(context);
  if (!session.active) {
    return {
      session,
      sales: [],
      orders: [],
      coupons: [],
      deposits: [],
      mileages: [],
      metrics: {
        sales: 0,
        paidOrders: 0,
        coupons: 0,
        revenue: 0,
      },
    };
  }

  const [salesPage, ordersPage, couponsPage, depositsPage, mileagesPage] =
    await Promise.all([
      ShoppingApi.functional.shoppings.admins.sales.index(context.connection, {
        limit: 0,
        sort: ["-sale.updated_at"],
      }),
      ShoppingApi.functional.shoppings.admins.orders.index(context.connection, {
        limit: 0,
        sort: ["-order.publish.paid_at"],
      }),
      ShoppingApi.functional.shoppings.admins.coupons.index(context.connection, {
        limit: 0,
        sort: ["-coupon.created_at"],
      }).catch(() => ({ data: [] })),
      ShoppingApi.functional.shoppings.admins.deposits.index(context.connection, {
        limit: 0,
        sort: ["+deposit.source"],
      }).catch(() => ({ data: [] })),
      ShoppingApi.functional.shoppings.admins.mileages.index(context.connection, {
        limit: 0,
        sort: ["+mileage.source"],
      }).catch(() => ({ data: [] })),
    ]);

  const sales = salesPage.data.map(mapSale);
  const orders = ordersPage.data.map(mapOrder);
  const coupons = couponsPage.data.map(mapCoupon);
  const deposits = depositsPage.data.map(mapDeposit);
  const mileages = mileagesPage.data.map(mapMileage);

  return {
    session,
    sales,
    orders,
    coupons,
    deposits,
    mileages,
    metrics: {
      sales: sales.length,
      paidOrders: orders.length,
      coupons: coupons.length,
      revenue: orders.reduce((acc, order) => acc + order.totalPrice, 0),
    },
  };
}

export async function createAdminCoupon(
  payload: AdminCreateCouponPayload,
  context: SessionContext,
): Promise<AdminDashboardView> {
  await ShoppingApi.functional.shoppings.admins.coupons.create(context.connection, {
    name: payload.name,
    discount:
      payload.unit === "percent"
        ? {
            unit: "percent",
            value: payload.value,
            threshold: payload.threshold,
            limit: payload.limit,
          }
        : {
            unit: "amount",
            value: payload.value,
            threshold: payload.threshold,
            limit: payload.limit,
            multiplicative: payload.multiplicative,
          },
    restriction: {
      access: payload.access,
      exclusive: payload.exclusive,
      volume: payload.volume,
      volume_per_citizen: payload.volumePerCitizen,
      expired_in: payload.expiredIn,
      expired_at: null,
    },
    criterias: [],
    disposable_codes: [],
    opened_at: payload.openedAt,
    closed_at: payload.closedAt,
  });

  return getAdminDashboard(context);
}

export async function createAdminDeposit(
  payload: AdminCreateDepositPayload,
  context: SessionContext,
): Promise<AdminDashboardView> {
  await ShoppingApi.functional.shoppings.admins.deposits.create(context.connection, {
    code: payload.code,
    source: payload.source,
    direction: payload.direction === "income" ? 1 : -1,
  });
  return getAdminDashboard(context);
}

export async function createAdminMileage(
  payload: AdminCreateMileagePayload,
  context: SessionContext,
): Promise<AdminDashboardView> {
  await ShoppingApi.functional.shoppings.admins.mileages.create(context.connection, {
    code: payload.code,
    source: payload.source,
    direction: payload.direction === "income" ? 1 : -1,
    value: payload.defaultValue,
  });
  return getAdminDashboard(context);
}
