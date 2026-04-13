import "server-only";

import ShoppingApi from "@samchon/shopping-api";

import type {
  CreateOrderPayload,
  OrderCollectionView,
  OrderDetailView,
  PublishOrderPayload,
} from "@/lib/shopping/types";
import {
  mapOrderDetail,
  mapOrderListItem,
  mapSession,
} from "@/server/shopping/mappers";

import { ApiRouteError } from "./errors";
import { requireCitizen, requireCurrentCustomer, type SessionContext } from "./session";

export async function getOrdersData(
  context: SessionContext,
): Promise<OrderCollectionView> {
  const customer = await requireCurrentCustomer(context);
  const page = await ShoppingApi.functional.shoppings.customers.orders.index(
    context.connection,
    {
      limit: 0,
      sort: ["-order.created_at"],
    },
  );

  return {
    session: mapSession(customer),
    orders: page.data.map(mapOrderListItem),
    pagination: page.pagination,
  };
}

export async function createOrder(
  payload: CreateOrderPayload,
  context: SessionContext,
) {
  if (!payload.commodityIds.length) {
    throw new ApiRouteError(400, "Select at least one cart item to create an order.");
  }

  const cartPage =
    await ShoppingApi.functional.shoppings.customers.carts.commodities.index(
      context.connection,
      {
        limit: 0,
      },
    );
  const selected = cartPage.data.filter((item) =>
    payload.commodityIds.includes(item.id),
  );

  if (!selected.length) {
    throw new ApiRouteError(404, "The selected cart items could not be found.");
  }

  const order = await ShoppingApi.functional.shoppings.customers.orders.create(
    context.connection,
    {
      goods: selected.map((item) => ({
        commodity_id: item.id,
        volume: item.volume,
      })),
    },
  );

  return {
    orderId: order.id,
  };
}

export async function getOrderDetail(
  orderId: string,
  context: SessionContext,
): Promise<OrderDetailView> {
  const customer = await requireCurrentCustomer(context);
  const order = await ShoppingApi.functional.shoppings.customers.orders.at(
    context.connection,
    orderId,
  );
  const requiresCitizen = customer.citizen === null;
  const canPublish = order.publish
    ? false
    : requiresCitizen
      ? false
      : await ShoppingApi.functional.shoppings.customers.orders.publish.able(
          context.connection,
          orderId,
        );

  return {
    session: mapSession(customer),
    ...mapOrderDetail(order, canPublish, requiresCitizen),
  };
}

export async function publishOrder(
  orderId: string,
  payload: PublishOrderPayload,
  context: SessionContext,
) {
  await requireCitizen(context);

  return ShoppingApi.functional.shoppings.customers.orders.publish.create(
    context.connection,
    orderId,
    {
      address: {
        mobile: payload.mobile,
        name: payload.name,
        country: payload.country,
        province: payload.province,
        city: payload.city,
        department: payload.department,
        possession: payload.possession,
        zip_code: payload.zipCode,
        special_note: payload.specialNote,
      },
      vendor: {
        code: "prototype",
        uid: crypto.randomUUID(),
      },
    },
  );
}
