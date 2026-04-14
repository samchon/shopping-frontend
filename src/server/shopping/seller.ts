import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  LoginMemberPayload,
  SellerDashboardView,
  SellerIdentityView,
  SellerOpenSalePayload,
  SellerOrderView,
  SellerReplicaSalePayload,
  SellerSaleView,
  SellerSessionView,
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

function mapSellerIdentity(
  seller: ShoppingApi.functional.shoppings.sellers.authenticate.get.Output,
): SellerIdentityView {
  return {
    id: seller.id,
    nickname: seller.member.nickname,
    email: seller.member.emails[0]?.value ?? null,
    joinedAt: seller.created_at,
    citizen: {
      name: seller.citizen.name,
      mobile: seller.citizen.mobile,
    },
  };
}

function mapSellerSale(
  sale: ShoppingApi.functional.shoppings.sellers.sales.index.Output["data"][number],
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
    stockCount: sale.units.reduce(
      (acc, unit) => acc + ("stocks" in unit && Array.isArray(unit.stocks) ? unit.stocks.length : 0),
      0,
    ),
    priceRange: {
      lowest: mapMoney(sale.price_range.lowest),
      highest: mapMoney(sale.price_range.highest),
    },
  };
}

function mapSellerOrder(
  order: ShoppingApi.functional.shoppings.sellers.orders.index.Output["data"][number],
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

export async function getSellerSessionData(
  context: SessionContext,
): Promise<SellerSessionView> {
  const customer = await requireCurrentCustomer(context);

  try {
    const seller =
      await ShoppingApi.functional.shoppings.sellers.authenticate.get(
        context.connection,
      );

    return {
      customer: mapSession(customer),
      seller: mapSellerIdentity(seller),
      active: true,
      canJoin: false,
    };
  } catch (error) {
    if (!isForbiddenError(error)) {
      throw error;
    }

    return {
      customer: mapSession(customer),
      seller: null,
      active: false,
      canJoin: Boolean(customer.member && customer.citizen),
    };
  }
}

export async function loginSeller(
  payload: LoginMemberPayload,
  context: SessionContext,
): Promise<SellerSessionView> {
  await ShoppingApi.functional.shoppings.sellers.authenticate.login(
    context.connection,
    {
      email: payload.email,
      password: payload.password,
    },
  );

  return getSellerSessionData(context);
}

export async function joinSeller(
  context: SessionContext,
): Promise<SellerSessionView> {
  await ShoppingApi.functional.shoppings.sellers.authenticate.join(
    context.connection,
    {},
  );
  return getSellerSessionData(context);
}

export async function getSellerDashboard(
  context: SessionContext,
): Promise<SellerDashboardView> {
  const session = await getSellerSessionData(context);
  if (!session.active) {
    return {
      session,
      sales: [],
      orders: [],
      metrics: {
        liveSales: 0,
        pausedSales: 0,
        paidOrders: 0,
        revenue: 0,
      },
    };
  }

  const [salesPage, ordersPage] = await Promise.all([
    ShoppingApi.functional.shoppings.sellers.sales.index(context.connection, {
      limit: 0,
      sort: ["-sale.updated_at"],
    }),
    ShoppingApi.functional.shoppings.sellers.orders.index(context.connection, {
      limit: 0,
      sort: ["-order.publish.paid_at"],
    }),
  ]);

  const sales = salesPage.data.map(mapSellerSale);
  const orders = ordersPage.data.map(mapSellerOrder);

  return {
    session,
    sales,
    orders,
    metrics: {
      liveSales: sales.filter((sale) => sale.status === "live").length,
      pausedSales: sales.filter((sale) => sale.status === "paused").length,
      paidOrders: orders.length,
      revenue: orders.reduce((acc, order) => acc + order.totalPrice, 0),
    },
  };
}

export async function replicateSellerSale(
  payload: SellerReplicaSalePayload,
  context: SessionContext,
): Promise<SellerDashboardView> {
  const template = await ShoppingApi.functional.shoppings.sellers.sales.replica(
    context.connection,
    payload.sourceSaleId,
  );

  await ShoppingApi.functional.shoppings.sellers.sales.create(context.connection, {
    ...template,
    section_code: payload.sectionCode,
    status: payload.status === "paused" ? "paused" : null,
    opened_at: payload.openedAt,
    closed_at: payload.closedAt,
    tags: payload.tags,
    content: {
      ...template.content,
      title: payload.title,
    },
  });

  return getSellerDashboard(context);
}

export async function pauseSellerSale(
  saleId: string,
  context: SessionContext,
): Promise<SellerDashboardView> {
  await ShoppingApi.functional.shoppings.sellers.sales.pause(
    context.connection,
    saleId,
  );
  return getSellerDashboard(context);
}

export async function restoreSellerSale(
  saleId: string,
  context: SessionContext,
): Promise<SellerDashboardView> {
  await ShoppingApi.functional.shoppings.sellers.sales.restore(
    context.connection,
    saleId,
  );
  return getSellerDashboard(context);
}

export async function openSellerSale(
  saleId: string,
  payload: SellerOpenSalePayload,
  context: SessionContext,
): Promise<SellerDashboardView> {
  await ShoppingApi.functional.shoppings.sellers.sales.open(
    context.connection,
    saleId,
    {
      opened_at: payload.openedAt,
      closed_at: payload.closedAt,
    },
  );
  return getSellerDashboard(context);
}
